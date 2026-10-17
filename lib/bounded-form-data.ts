/** Bound both declared and chunked uploads before multipart parsing allocates. */
export async function boundedFormData(request:Request,maxBytes:number) {
 const length=request.headers.get('content-length');
 if(length && (!/^\d+$/.test(length)||Number(length)>maxBytes))throw Error('Upload exceeds the allowed size.');
 const reader=request.body?.getReader();if(!reader)throw Error('Choose a workbook or website action.');
 const chunks:Uint8Array[]=[];let bytes=0;
 try{for(;;){const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;if(bytes>maxBytes){await reader.cancel();throw Error('Upload exceeds the allowed size.');}chunks.push(part.value);}}finally{reader.releaseLock();}
 const buffer=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){buffer.set(chunk,offset);offset+=chunk.byteLength;}
 return new Request(request.url,{method:'POST',headers:{'content-type':request.headers.get('content-type')||''},body:buffer}).formData();
}
