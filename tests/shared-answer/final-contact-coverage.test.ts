import test from 'node:test';
import assert from 'node:assert/strict';
import {validateMaterialClaimCoverage} from '../../lib/sovereign-intelligence/claim-validator';
test('a grounded address survives a subsequent conversational question',()=>{
 const source='Webtechnosys operates from H.No 746 - TF, New Wada, Morjim, Goa 403512, India.';
 const r=validateMaterialClaimCoverage({answer:'Address: H.No 746 - TF, New Wada, Morjim, Goa 403512, India\n\nMay I have your name?',evidenceUnits:[source]});
 assert.equal(r.valid,true);assert.equal(r.decisions.length,1);
});
test('numeric claims in questions are still checked against evidence',()=>{
 assert.equal(validateMaterialClaimCoverage({answer:'Can you pay the required fee of 9999?',evidenceUnits:['No fee specified.']}).valid,false);
});
