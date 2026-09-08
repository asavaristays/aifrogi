import fs from 'node:fs';
const cases=[['businessgpt','What services do you offer?'],['clinicgpt','What treatments are available?'],['hotelgpt','What rooms are available?'],['dinegpt','What cuisine do you serve?'],['edugpt','What programmes are available?'],['propertygpt','What properties are available?'],['flowcart','What products can I order?'],['custombot','What workflow do you support?']];
const results=[];
for(const [name,message]of cases){
 const slug='showcase-'+name;
 const page=await fetch('https://app.aifrogi.com/bot/'+slug);
 const html=await page.text();
 const r=await fetch('https://app.aifrogi.com/api/public/website-bot/'+slug,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,sessionId:'qa-showcase-'+Date.now()+'-'+name})});
 const j=await r.json();
 const row={slug,pageStatus:page.status,demoLabel:html.includes('Demo')&&html.includes('Synthetic'),chatStatus:r.status,answer:j.answer||null,error:j.error||null};
 results.push(row);console.log(JSON.stringify(row));
}
fs.mkdirSync('output/acceptance',{recursive:true});fs.writeFileSync('output/acceptance/showcase-20260906.json',JSON.stringify({kind:'SYNTHETIC_PUBLIC_SMOKE',results},null,2));
if(results.some(r=>r.pageStatus!==200||!r.demoLabel||r.chatStatus!==200||!r.answer))process.exitCode=1;
