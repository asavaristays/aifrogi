import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import {extractKnowledgeDocument,stageAtomicClaims} from '../../lib/services/knowledge-document-service';
const mime='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
async function file(formula=false){const w=new ExcelJS.Workbook();const s=w.addWorksheet('Contact');s.addRow(['Field','Value']);s.addRow(['Address',formula?{formula:'1+1',result:2}:'Suite 10, Example Business Centre']);return new File([new Uint8Array(await w.xlsx.writeBuffer())],'source.xlsx',{type:mime});}
test('XLSX uses existing atomic claim staging without publishing uploaded data',async()=>{const r=await extractKnowledgeDocument(await file());const claims=stageAtomicClaims(r.extractedText,mime);assert.equal(claims.length,1);assert.equal(claims[0].answer,'Suite 10, Example Business Centre');assert.equal(claims[0].category,'Contact');});
test('formula values cannot silently become approved facts',async()=>{await assert.rejects(()=>file(true).then(extractKnowledgeDocument),/formulas/);});
