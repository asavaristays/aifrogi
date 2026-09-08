import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reelCue,reelPhase} from '../../lib/experience-reel';
test('cursor arrives before click and booking follows simulated verification',()=>{
  assert.equal(reelCue(1,0),null);
  assert.deepEqual(reelCue(1,2.4),{target:'slot',clicking:false});
  assert.deepEqual(reelCue(1,3.2),{target:'slot',clicking:true});
  assert.equal(reelPhase(1,3).slotPicked,false);assert.equal(reelPhase(1,3.1).slotPicked,true);
  assert.equal(reelPhase(1,5.2).confirming,true);assert.equal(reelPhase(1,5.2).booking,false);assert.equal(reelPhase(1,6.2).booking,true);
});
test('family, setup, connectors, handover and billing follow their click cues',()=>{
  assert.equal(reelPhase(2,2.2).family,1);assert.equal(reelPhase(2,4).family,5);
  assert.equal(reelPhase(3,3.2).reviewed,true);assert.equal(reelPhase(4,3.2).connector,1);
  assert.equal(reelPhase(5,1.8).handover,true);assert.equal(reelPhase(6,2.2).yearly,true);
  assert.equal(reelCue(7,3)?.clicking,false);
});
test('cursor cannot intercept taps or dispatch navigation/connector actions',()=>{
  const cursor=readFileSync('components/marketing/experience-cursor.tsx','utf8');
  assert.doesNotMatch(cursor,/\.click\(|dispatchEvent|fetch\(|window\.location/);
  assert.match(cursor,/aria-hidden="true"/);
  const css=readFileSync('components/marketing/experience-story.module.css','utf8');
  assert.match(css,/pointer-events:none/);
  const source=readFileSync('components/marketing/experience-story.tsx','utf8');
  assert.match(source,/visible=\{playing&&!reduced\}/);
  assert.match(source,/setAnnual\(false\)/);
});
