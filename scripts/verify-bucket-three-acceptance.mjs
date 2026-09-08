import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

// Completeness is checked BEFORE reporting success; skips never earn credit.
const categories = ['BUSINESS_AI', 'STAY', 'PINGBOOK', 'RESTAURANT', 'EDUCATION', 'REAL_ESTATE', 'FLOWCART', 'CUSTOM'];
const required = categories.flatMap(c => Array.from({length:10}, (_, i) => `B3-${c}-${String(i+1).padStart(2,'0')}`));
const run = spawnSync(process.execPath, ['--import','tsx','--test','--test-reporter=tap','tests/sovereign-intelligence/bucket-three-b1-http.test.ts','tests/sovereign-intelligence/bucket-three-b2-http.test.ts'], {encoding:'utf8'});
const tap = `${run.stdout || ''}\n${run.stderr || ''}`;
const cases = [...tap.matchAll(/^(ok|not ok) \d+ - (B3-[A-Z_]+-\d{2}) (.+)$/gm)].map(m => ({id:m[2], passed:m[1]==='ok', journey:m[3]}));
const missingOrDuplicate = required.filter(id => cases.filter(c => c.id===id).length!==1);
const unexpected = cases.filter(c => !required.includes(c.id));
const accepted = run.status===0 && cases.length===80 && !missingOrDuplicate.length && !unexpected.length && cases.every(c=>c.passed) && !/^(?:not )?ok .+# (SKIP|TODO)\b/im.test(tap);
const report = {timestamp:new Date().toISOString(), type:'SYNTHETIC_ISOLATED_HTTP', accepted, required:80, executed:cases.length, passed:cases.filter(c=>c.passed).length, missingOrDuplicate, unexpected, perPersona:categories.map(category=>({category, required:10, passed:cases.filter(c=>c.id.startsWith(`B3-${category}-`)&&c.passed).length})), cases, limitations:'Deterministic model and DB; mock connectors. Not real-world accuracy, multilingual certification or live provider certification.'};
mkdirSync('output/acceptance',{recursive:true});
writeFileSync('output/acceptance/bucket-three-http.tap',tap);
writeFileSync('output/acceptance/bucket-three-http.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({accepted,required:80,executed:cases.length,passed:report.passed,missingOrDuplicate,perPersona:report.perPersona}));
process.exit(accepted?0:1);
