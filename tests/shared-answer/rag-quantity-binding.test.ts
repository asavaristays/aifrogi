import {test} from 'node:test';
import assert from 'node:assert/strict';
import {quantityAlternativesSupported} from '../../lib/rag-quantity-binding';
test('quantities cannot be transferred between differently labelled products',()=>{
 assert.equal(quantityAlternativesSupported('We offer 2 or 4-night retreats.',['2 night Retreat\n4 night Conference']),false);
 assert.equal(quantityAlternativesSupported('We offer 30 or 60-second commercials.',['30 Second AI Commercial\n60 Second AI Brand Film']),false);
});
test('alternatives with independently supported matching labels remain eligible',()=>{
 assert.equal(quantityAlternativesSupported('We offer 2 or 4-night retreats.',['2 night Retreat\n4 night Retreat']),true);
 assert.equal(quantityAlternativesSupported('We offer a 30-second commercial and a 60-second brand film.',['30 Second AI Commercial\n60 Second AI Brand Film']),true);
});
