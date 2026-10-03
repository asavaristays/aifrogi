import {createHash} from 'node:crypto';
import type {AnswerScope} from './shared-answer-engine';

/** Short-lived query vectors only. No answers or evidence are cached.
 * Authority is checked before lookup; the source snapshot is part of the key. */
export class RagQueryEmbeddingCache {
  private entries=new Map<string,{expiresAt:number;pending:Promise<number[]>}>();
  constructor(private ttlMs=120000,private maxEntries=256,private now:()=>number=Date.now){}
  async read(scope:AnswerScope,model:string,question:string,load:()=>Promise<number[]>) {
    const key=createHash('sha256').update(JSON.stringify([scope.organizationId,scope.propertyId,scope.generationId,model,question])).digest('hex');
    for(const [id,entry] of this.entries)if(entry.expiresAt<=this.now())this.entries.delete(id);
    let entry=this.entries.get(key);const hit=Boolean(entry);
    if(entry){this.entries.delete(key);this.entries.set(key,entry);}
    else {
      const pending=Promise.resolve().then(load).then(vector=>[...vector]);
      entry={expiresAt:this.now()+this.ttlMs,pending};this.entries.set(key,entry);
      while(this.entries.size>this.maxEntries)this.entries.delete(this.entries.keys().next().value!);
      const current=entry;
      pending.catch(()=>{if(this.entries.get(key)===current)this.entries.delete(key);});
    }
    return {vector:[...await entry.pending],hit};
  }
}
export const ragQueryEmbeddingCache=new RagQueryEmbeddingCache();
