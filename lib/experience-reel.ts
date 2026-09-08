// Presentation-only cues. Never dispatch clicks or invoke real connector actions.
const cues: Record<number, {at:number;target:string;clickAt:number}[]> = {
  1:[{at:.8,target:'question',clickAt:1.3},{at:2.3,target:'slot',clickAt:3.1},{at:4.2,target:'confirm',clickAt:5.1}],
  2:[{at:.8,target:'family-1',clickAt:2.2},{at:2.8,target:'family-5',clickAt:4}],
  3:[{at:.5,target:'website',clickAt:1},{at:2.3,target:'approve',clickAt:3.2}],
  4:[{at:.6,target:'connector-0',clickAt:1.5},{at:2.3,target:'connector-1',clickAt:3.2}],
  5:[{at:.7,target:'handover',clickAt:1.8}],
  6:[{at:.8,target:'yearly',clickAt:2.2}],
  7:[{at:.6,target:'try-demo',clickAt:Infinity}]
};
export function reelCue(scene:number,time:number) {
  const cue=cues[scene]?.findLast(item=>time>=item.at);
  return cue?{target:cue.target,clicking:time>=cue.clickAt&&time<cue.clickAt+.45}:null;
}
export function reelPhase(scene:number,time:number) {
  return {booking:scene===1&&time>=6.2,slotPicked:scene===1&&time>=3.1,confirming:scene===1&&time>=5.1,
    family:scene===2?(time>=4?5:time>=2.2?1:null):null,
    reviewed:scene===3&&time>=3.2,connector:scene===4?(time>=3.2?1:time>=1.5?0:null):null,
    handover:scene===5&&time>=1.8,yearly:scene===6&&time>=2.2};
}
