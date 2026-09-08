import test from 'node:test';
import assert from 'node:assert/strict';
import {assertCorrectionPublishable} from '../../lib/knowledge-correction-gate';
const input={status:'PREVIEW_PENDING',validationStatus:'VALID',conflictStatus:'CLEAR',fieldApprovedBy:'owner',fieldApprovedAt:new Date('2026-01-01'),question:'What services?',answer:'Approved services.',previewQuestion:'What services?',previewAnswer:'Approved services.',openFlags:0,expiresAt:new Date('2027-01-01'),effectiveAt:new Date('2026-01-01'),now:new Date('2026-09-01')};
test('current approved and valid preview passes',()=>assert.doesNotThrow(()=>assertCorrectionPublishable(input)));
for(const [name,change] of Object.entries({paused:{status:'PAUSED'},superseded:{status:'SUPERSEDED'},invalid:{validationStatus:'INVALID'},conflict:{conflictStatus:'UNRESOLVED'},unsigned:{fieldApprovedBy:null},undated:{fieldApprovedAt:null},staleAnswer:{previewAnswer:'Old answer'},staleQuestion:{previewQuestion:'Old question'},flagged:{openFlags:1},expired:{expiresAt:new Date('2026-08-01')},future:{effectiveAt:new Date('2026-10-01')}}))test('publication blocks '+name,()=>assert.throws(()=>assertCorrectionPublishable({...input,...change})));
