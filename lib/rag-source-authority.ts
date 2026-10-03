import type {AnswerEvidence} from './shared-answer-engine';

/** Only approved stable entity/field metadata can establish a source override. */
export function resolveRagSourceAuthority(units:AnswerEvidence[]) {
  const groups=new Map<string,AnswerEvidence[]>();
  for(const unit of units) {
    if(!unit.fieldKey||!unit.entityKey) continue;
    const key=JSON.stringify([unit.entityKey,unit.fieldKey]);
    const group=groups.get(key)??[];group.push(unit);groups.set(key,group);
  }
  const excluded=new Set<string>();const conflicts:string[]=[];
  for(const [key,group] of groups) {
    const rank=Math.min(...group.map(u=>u.authorityRank??100));
    const strongest=group.filter(u=>(u.authorityRank??100)===rank);
    const values=new Set(strongest.map(u=>u.valueHash||u.digest));
    if(values.size>1) {conflicts.push(key);continue;}
    for(const u of group) if((u.authorityRank??100)>rank) excluded.add(u.id);
  }
  return {evidence:units.filter(u=>!excluded.has(u.id)),conflicts};
}
