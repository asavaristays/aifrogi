import {getDb} from '@/lib/db';
import {listDemoFixtures} from '@/lib/demo-sandbox/fixtures';
import {getBotPersonaPack} from '@/lib/bot-persona-packs';
import {DemoShareLink} from '@/components/website-bot/demo-share-link';
export const dynamic='force-dynamic';
export const metadata={title:'AI Bot Demos | AiFrogi',description:'Explore fictional business bot demonstrations by category.'};
export default async function DemoGallery(){
 const db=getDb();
 const ready=await db?.organization.findMany({where:{isDemo:true,demoKey:{startsWith:'SHOWCASE:'},status:'ACTIVE',botProfile:{status:'LIVE'},demoSandbox:{status:'READY'}},select:{slug:true}})||[];
 const slugs=new Set(ready.map(r=>r.slug));
 return <main className="min-h-screen bg-[#f5f3ee] px-5 py-12 text-stone-900"><div className="mx-auto max-w-5xl"><a href="https://webtechnosys.com" className="text-sm underline">Webtechnosys AI Agency</a><p className="mt-8 text-xs uppercase tracking-widest">Explore · Try · Share</p><h1 className="mt-3 text-2xl font-semibold">Find the AI Bot for your business.</h1><p className="mt-4 max-w-2xl text-stone-600">Choose a category and try a conversation. Share an individual demo with your team or client.</p><p className="my-7 rounded-2xl bg-amber-50 p-4 text-sm text-amber-950">Demonstrations only: fictional business data and mock connectors. No real appointments, payments or external notifications. Use fictional contact details.</p><div className="grid gap-5 sm:grid-cols-2">{listDemoFixtures().map(f=>{const slug=f.slug.replace('demo-','showcase-');return <article key={slug} className="rounded-3xl bg-white p-6 shadow-sm"><p className="text-xs text-stone-500">{f.industry} · Demo</p><h2 className="mt-2 text-lg font-semibold">{getBotPersonaPack(f.category).productName}</h2><p className="my-4 text-sm text-stone-600">{f.intro}</p><p className="mb-5 text-sm">Try: “{f.facts[0].question}”</p>{slugs.has(slug)?<div className="flex flex-wrap items-start gap-3"><a href={`/bot/${slug}`} target="_blank" rel="noopener noreferrer" className="rounded-full px-5 py-2 text-sm" style={{background:'#111',color:'#fff'}}>Open demo ↗</a><DemoShareLink slug={slug}/></div>:<p className="text-sm text-stone-500">Demo temporarily unavailable</p>}</article>;})}</div></div></main>;
}
