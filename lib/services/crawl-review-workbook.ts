import ExcelJS from 'exceljs';
import {getDb} from '@/lib/db';

export type CrawlReviewRow={id:string;propertyId:string;generationId:string;content:string;url:string;title:string};
export const CRAWL_REVIEW_MAX_ROWS=2000;
const columns=['Category','Page title','Section','Extracted content','Source URL','Review flag','Approval','Public visibility','Tenant ID','Generation ID','Client correction','Source chunk ID'];

/** Export existing authorised captures only. This operation never crawls or publishes. */
export async function readCrawlReviewRows(propertyId:string,organizationId:string):Promise<CrawlReviewRow[]> {
 const db=getDb();if(!db)throw Error('Database unavailable.');
 const property=await db.property.findFirst({where:{id:propertyId,organizationId},select:{id:true}});
 if(!property)throw Error('The property does not belong to this workspace.');
 const rows=await db.$queryRaw<CrawlReviewRow[]>`SELECT * FROM aifrogi_security.owner_crawl_review_rows(${propertyId},current_setting('app.security_actor',true))`;
 if(rows.length>CRAWL_REVIEW_MAX_ROWS)throw Error('This capture exceeds the 2,000-row review limit. Ask support for a scoped export.');
 if(!rows.length)throw Error('No current authorised website capture is available. Connect and read your website first.');
 return rows;
}
export async function buildCrawlReviewWorkbook(rows:CrawlReviewRow[]) {
 if(!rows.length || new Set(rows.map(r=>r.propertyId)).size!==1 || new Set(rows.map(r=>r.generationId)).size!==1)throw Error('One property and crawl version are required.');
 const workbook=new ExcelJS.Workbook();workbook.creator='AiFrogi';
 const instructions=workbook.addWorksheet('Start Here');
 instructions.addRows([
 ['Website knowledge review','Every row starts private and pending. Nothing in this file is published automatically.'],
 ['1. Review','Check extracted text against its source page.'],
 ['2. Correct','Enter a complete replacement in Client correction. Keep source text and identity columns unchanged.'],
 ['3. Approve','Choose Approved and Public only for reviewed rows. Resolve a review flag before clearing it.'],
 ['4. Upload','Preview the file, then stage approved rows. Approve the source document and each answer in Intelligence before publishing.'],
 ['Missing information','Use Add one answer for information absent from this website. Never put passwords, OTPs or private customer details here.'],
 ['Later corrections','Use Edit answer on the current approved answer. Re-importing changed files is staged for review, never an automatic override.'],
 ['Changed website','Download a new file after a new crawl; an old version cannot be imported.']
 ]);
 const sheet=workbook.addWorksheet('Categorized Content');sheet.addRow(columns);sheet.views=[{state:'frozen',ySplit:1}];sheet.autoFilter='A1:L1';
 sheet.columns=columns.map((_,i)=>({width:i===3||i===10?75:i===4?55:25}));
 for(const row of rows){
  const hint=`${new URL(row.url).pathname} ${row.title}`;
  const category=/contact|location/i.test(hint)?'Contact':/about|company/i.test(hint)?'Business':/polic|terms|refund/i.test(hint)?'Policies':'Services';
  const flag=/\b(?:bank|ifsc|upi|guarantee|certif|refund|price|fee|payment)\b|₹/i.test(row.content)?'Commercial or policy information — review before approval':'';
  const item=sheet.addRow([category,row.title,`Source ${row.id}`,row.content,row.url,flag,'Pending client review','Private draft',row.propertyId,row.generationId,'',row.id]);
  item.alignment={vertical:'top',wrapText:true};
  item.getCell(7).dataValidation={type:'list',allowBlank:false,formulae:['"Pending client review,Approved,Rejected"']};
  item.getCell(8).dataValidation={type:'list',allowBlank:false,formulae:['"Private draft,Public"']};
 }
 sheet.getRow(1).font={bold:true};
 return new Uint8Array(await workbook.xlsx.writeBuffer());
}
