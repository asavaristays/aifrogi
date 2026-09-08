import {createHash} from 'node:crypto';
import {googleJson} from './appointment-journey-google-oauth';
export const SHEET_ROW_LIMIT=10000;
export type SheetReservation={version:1;row:number;revision:string;phase:'PENDING'|'VERIFIED'};
export function parseSheetReservation(value:string|null):SheetReservation|null{
 if(!value)return null;
 const v=JSON.parse(value);
 if(v.version!==1||!Number.isInteger(v.row)||v.row<2||v.row>SHEET_ROW_LIMIT||!['PENDING','VERIFIED'].includes(v.phase)||typeof v.revision!=='string'||!/^[a-f0-9]{64}$/.test(v.revision))throw Error('Invalid Sheets reservation; operator review required.');
 return v;
}
export function sheetRowRevision(values:string[]){return createHash('sha256').update(JSON.stringify(values)).digest('hex');}
export function normalizeSheetRow(value:unknown):string[]{
 if(!Array.isArray(value)||value.some(v=>typeof v!=='string'&&typeof v!=='number'&&typeof v!=='boolean'))throw Error('Unverifiable Sheets row.');
 return Array.from({length:10},(_,i)=>value[i]===undefined?'':String(value[i]));
}
export function locateBookingRow(rows:string[][],bookingId:string,reservedRows:number[]){
 if(rows.length>SHEET_ROW_LIMIT)throw Error('Sheets reconciliation limit exceeded; operator review required.');
 if(rows[0]?.[0]!=='Booking ID')throw Error('Bookings sheet header changed; operator review required.');
 const matches=rows.flatMap((row,i)=>i>0&&row[0]===bookingId?[i+1]:[]);
 if(matches.length>1)throw Error('Duplicate booking rows already exist; operator review required.');
 const row=matches[0]||Math.max(rows.length+1,2,...reservedRows.map(r=>r+1));
 if(row>SHEET_ROW_LIMIT)throw Error('Bookings sheet capacity reached; operator review required.');
 return row;
}
export async function readBookingSheet(accessToken:string,sheetId:string){
 const response=await googleJson<{values?:unknown[]}>({accessToken,url:`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/Bookings!A1:J${SHEET_ROW_LIMIT+1}?valueRenderOption=UNFORMATTED_VALUE`});
 if(!Array.isArray(response.values))throw Error('Bookings sheet could not be verified.');
 return response.values.map(normalizeSheetRow);
}
export async function reconcileReservedSheetRow(input:{accessToken:string;sheetId:string;reservation:SheetReservation;values:string[];mayWrite:boolean}){
 const {reservation,values}=input;
 if(sheetRowRevision(values)!==reservation.revision)throw Error('Booking changed while a Sheets write was pending; operator review required.');
 const read=()=>readBookingSheet(input.accessToken,input.sheetId);
 let rows=await read();
 const located=locateBookingRow(rows,values[0],[]);
 const matches=rows.flatMap((row,i)=>i>0&&row[0]===values[0]?[i+1]:[]);
 if(matches.length&&located!==reservation.row)throw Error('Booking row moved; operator review required.');
 let current=rows[reservation.row-1]||Array(10).fill('');
 if(current[0]&&current[0]!==values[0])throw Error('Reserved row belongs to another booking; refusing overwrite.');
 if(sheetRowRevision(current)===reservation.revision)return {row:reservation.row,recovered:!input.mayWrite};
 if(!input.mayWrite)throw Error('Sheets write outcome is uncertain; no automatic repeat. Operator review required.');
 if(current.some(Boolean)&&!current[0])throw Error('Reserved row contains unowned data; refusing overwrite.');
 await googleJson({accessToken:input.accessToken,url:`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(input.sheetId)}/values/Bookings!A${reservation.row}:J${reservation.row}?valueInputOption=RAW`,method:'PUT',body:{values:[values]}});
 rows=await read();
 const found=locateBookingRow(rows,values[0],[]);
 current=rows[reservation.row-1]||[];
 if(found!==reservation.row||sheetRowRevision(current)!==reservation.revision)throw Error('Sheets read-back failed; outcome requires reconciliation.');
 return {row:reservation.row,recovered:false};
}
