import test from 'node:test';
import assert from 'node:assert/strict';
import {boundedFormData} from '../lib/bounded-form-data';
test('accepts a bounded real multipart form',async()=>{
 const data=new FormData();data.set('action','CRAWL');
 const parsed=await boundedFormData(new Request('https://example.com',{method:'POST',body:data}),1024);
 assert.equal(parsed.get('action'),'CRAWL');
});
test('rejects an oversized declared upload before reading it',async()=>{
 let read=false;const request={url:'https://example.com',headers:new Headers({'content-length':'2048'}),get body(){read=true;return null;}} as unknown as Request;
 await assert.rejects(()=>boundedFormData(request,1024),/allowed size/);assert.equal(read,false);
});
test('cancels oversized chunked or under-declared uploads before multipart parsing',async()=>{
 for(const length of [undefined,'1']){
  let canceled=false;const body=new ReadableStream<Uint8Array>({pull(controller){controller.enqueue(new Uint8Array(1025));},cancel(){canceled=true;}});
  const request={url:'https://example.com',headers:new Headers(length?{'content-length':length}:{}),body} as Request;
  await assert.rejects(()=>boundedFormData(request,1024),/allowed size/);assert.equal(canceled,true);
 }
});
