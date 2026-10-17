import {inflateRawSync} from 'node:zlib';

/** Bound decompression before ExcelJS parses any untrusted workbook XML. */
export function assertSafeReviewXlsx(input:Uint8Array) {
 const bytes=Buffer.from(input.buffer,input.byteOffset,input.byteLength);
 const invalid=()=>new Error('The workbook archive is invalid or exceeds safe import limits.');
 if(bytes.length<22||bytes.length>5*1024*1024)throw invalid();
 let end=-1;
 for(let n=bytes.length-22;n>=Math.max(0,bytes.length-65557);n--){
  if(bytes.readUInt32LE(n)===0x06054b50&&n+22+bytes.readUInt16LE(n+20)===bytes.length){end=n;break;}
 }
 if(end<0||bytes.readUInt16LE(end+4)||bytes.readUInt16LE(end+6))throw invalid();
 const count=bytes.readUInt16LE(end+10),directorySize=bytes.readUInt32LE(end+12),directoryOffset=bytes.readUInt32LE(end+16);
 if(!count||count>1000||count!==bytes.readUInt16LE(end+8)||directoryOffset+directorySize!==end)throw invalid();
 let offset=directoryOffset,total=0;const names=new Set<string>();
 for(let i=0;i<count;i++){
  if(offset+46>end||bytes.readUInt32LE(offset)!==0x02014b50)throw invalid();
  const flags=bytes.readUInt16LE(offset+8),method=bytes.readUInt16LE(offset+10),compressed=bytes.readUInt32LE(offset+20),expanded=bytes.readUInt32LE(offset+24),nameLength=bytes.readUInt16LE(offset+28),extra=bytes.readUInt16LE(offset+30),comment=bytes.readUInt16LE(offset+32),local=bytes.readUInt32LE(offset+42);
  if(offset+46+nameLength+extra+comment>end||flags&1||![0,8].includes(method)||local+30>directoryOffset)throw invalid();
  const name=bytes.subarray(offset+46,offset+46+nameLength).toString('utf8');
  if(names.has(name)||name.startsWith('/')||name.split('/').includes('..')||/\\|vbaProject|externalLinks/i.test(name))throw invalid();names.add(name);
  total+=expanded;if(total>25*1024*1024||expanded>20*1024*1024)throw invalid();
  if(bytes.readUInt32LE(local)!==0x04034b50||bytes.readUInt16LE(local+8)!==method)throw invalid();
  const localName=bytes.readUInt16LE(local+26),localExtra=bytes.readUInt16LE(local+28),start=local+30+localName+localExtra;
  if(start+compressed>directoryOffset||!bytes.subarray(local+30,local+30+localName).equals(bytes.subarray(offset+46,offset+46+nameLength)))throw invalid();
  const data=bytes.subarray(start,start+compressed);
  try{const actual=method===8?inflateRawSync(data,{maxOutputLength:Math.max(1,expanded)}):data;if(actual.length!==expanded)throw invalid();}catch{throw invalid();}
  offset+=46+nameLength+extra+comment;
 }
 if(offset!==end||!names.has('[Content_Types].xml')||!names.has('xl/workbook.xml'))throw invalid();
}
