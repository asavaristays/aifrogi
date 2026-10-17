/** Conservative robots rules for the identified crawler. Unknown fetch failures
 * are handled by the caller; this parser never grants source authorisation. */
export function robotsAllows(text:string,url:string,agent='aifrogi-kb-crawler') {
 const groups:Array<{agents:string[];rules:Array<{allow:boolean;path:string}>}>=[];
 let group={agents:[] as string[],rules:[] as Array<{allow:boolean;path:string}>};
 for(const raw of text.split(/\r?\n/)){
  const match=raw.replace(/#.*/,'').match(/^\s*([a-z-]+)\s*:\s*(.*?)\s*$/i);if(!match)continue;
  const key=match[1].toLowerCase(),value=match[2];
  if(key==='user-agent'){if(group.rules.length){groups.push(group);group={agents:[],rules:[]};}group.agents.push(value.toLowerCase());}
  else if((key==='allow'||key==='disallow')&&value&&group.agents.length)group.rules.push({allow:key==='allow',path:value});
 }
 groups.push(group);
 const score=(agents:string[])=>Math.max(-1,...agents.map(a=>a==='*'?0:agent.includes(a)?a.length:-1));
 const specificity=Math.max(-1,...groups.map(g=>score(g.agents)));
 const path=new URL(url).pathname+new URL(url).search;
 const rules=groups.filter(g=>score(g.agents)===specificity&&specificity>=0).flatMap(g=>g.rules).filter(rule=>{
  const pattern=rule.path.split('*').map(part=>part.replace(/[.+?^${}()|[\]\\]/g,'\\$&')).join('.*').replace(/\\\$$/,'$');
  return new RegExp('^'+pattern).test(path);
 }).sort((a,b)=>b.path.replace(/[*$]/g,'').length-a.path.replace(/[*$]/g,'').length||Number(b.allow)-Number(a.allow));
 return rules[0]?.allow??true;
}
