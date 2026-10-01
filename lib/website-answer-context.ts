import type { ActiveWebsiteChunk } from "@/lib/active-website-crawl-retrieval";
import { assembleAnswerContext, selectRelevantPassages } from "@/lib/sovereign-intelligence/answer-context";

const stopWords = new Set(["the","and","for","from","can","could","you","your","tell","about","does","how","what","when","where","please","with","have","that","this","business","businesses"]);
function terms(value:string){return [...new Set((value.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || []).filter(term=>!stopWords.has(term)).map(term=>term.length>4 && term.endsWith("s") ? term.slice(0,-1) : term))];}

export function focusedWebsiteRetrievalQuery(question:string){
  return terms(question).slice(0,12).join(" ") || question.trim();
}

export function rankWebsiteAnswerChunks(question:string, chunks:ActiveWebsiteChunk[]){
  const queryTerms=terms(question);
  const documents=chunks.map(chunk=>new Set(terms(`${chunk.title} ${chunk.content}`)));
  const ranked=chunks.map((chunk,index)=>{
    const titleTerms=new Set(terms(chunk.title));
    const score=queryTerms.reduce((sum,term)=>{
      const frequency=documents.filter(document=>document.has(term)).length;
      const weight=1+Math.log((chunks.length+1)/(frequency+1));
      return sum+(documents[index].has(term)?weight:0)+(titleTerms.has(term)?weight*3:0);
    },0);
    return {chunk,index,score};
  }).sort((a,b)=>b.score-a.score || a.index-b.index);
  return ranked.map(({chunk})=>chunk);
}

export function prepareWebsiteAnswerContext(question:string, chunks:ActiveWebsiteChunk[], maxChars:number){
  const ranked=rankWebsiteAnswerChunks(question,chunks);
  // Distribute the context budget across evidence instead of concatenating whole
  // pages and silently cutting later relevant passages out of the prompt.
  const assembled=assembleAnswerContext({retrievalQuestion:question,maxChars,rankedPages:ranked.map((chunk,index)=>({url:chunk.url,title:chunk.title,bucket:"Active tenant crawl",text:selectRelevantPassages(chunk.content,question,2400),score:ranked.length-index}))});
  return {...assembled,rankedChunkIds:ranked.map(chunk=>chunk.chunk_id)};
}
