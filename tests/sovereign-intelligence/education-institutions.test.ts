import test from 'node:test';import assert from 'node:assert/strict';
import {educationInstitutions,educationVisitDates,validEducationVisit,type EducationKind} from '../../lib/demo-sandbox/education-institutions';
const now=new Date('2026-09-06T00:00:00Z');
for(const kind of Object.keys(educationInstitutions) as EducationKind[])test(`education ${kind} own programmes and valid visits`,()=>{const i=educationInstitutions[kind];assert.ok(i.fees.includes('Fictional'));assert.equal(validEducationVisit(kind,i.programmes[0],'2026-09-07',i.times[0],now),true);assert.equal(validEducationVisit(kind,'invented','2026-09-07',i.times[0],now),false);});
test('student information stays gated in every institution',()=>{for(const i of Object.values(educationInstitutions))assert.match(i.support,/verified/);});
test('weekend, past and unlisted appointment slots rejected',()=>{assert.equal(educationVisitDates(now).length,5);assert.equal(validEducationVisit('school','Class 1–5','2026-09-12','10:00',now),false);assert.equal(validEducationVisit('school','Class 1–5','2026-09-07','15:00',now),false);});
test('college programmes cannot leak into school choice',()=>assert.equal(validEducationVisit('school','BCom Commerce','2026-09-07','10:00',now),false));
