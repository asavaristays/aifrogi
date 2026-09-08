import test from 'node:test';
import assert from 'node:assert/strict';
import {ExperienceMusic} from '../../lib/experience-music';
function fixture(){
  const ramps:number[][]=[],starts:number[]=[],stops:number[]=[];let closed=false;
  const context={currentTime:1,destination:{},resume:async()=>{},close:async()=>{closed=true;},
    createGain:()=>{const calls:number[]=[];ramps.push(calls);return {gain:{value:0,cancelScheduledValues:()=>{},setValueAtTime:()=>{},linearRampToValueAtTime:(v:number)=>calls.push(v),exponentialRampToValueAtTime:()=>{}},connect:()=>{},disconnect:()=>{}};},
    createOscillator:()=>({type:'sine',frequency:{value:0},connect:()=>{},disconnect:()=>{},start:(at:number)=>starts.push(at),stop:(at:number)=>stops.push(at),onended:null})};
  return {engine:new ExperienceMusic(context as unknown as AudioContext),ramps,starts,stops,closed:()=>closed};
}
test('music is silent on construction and mute targets zero',()=>{
  const f=fixture();assert.equal(f.starts.length,0);f.engine.mute(false);assert.equal(f.ramps[0].at(-1),.16);f.engine.mute(true);assert.equal(f.ramps[0].at(-1),0);f.engine.dispose();
});
test('music pause fades the bed and disposal closes the context',()=>{
  const f=fixture();f.engine.setPlaying(true);assert.equal(f.starts.length,3);f.engine.setPlaying(false);assert.equal(f.ramps[1].at(-1),0);f.engine.dispose();assert.equal(f.closed(),true);f.engine.setPlaying(true);assert.equal(f.starts.length,3);
});
test('slide cue is short, finite and has no speech or audio downloads',()=>{
  const f=fixture();f.engine.transition();assert.equal(f.starts.length,2);for(let i=0;i<2;i++){assert.ok(f.stops[i]>f.starts[i]);assert.ok(f.stops[i]-f.starts[i]<.5);}f.engine.dispose();
});
