"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type StayCase = { id:string; kind:"QUERY"|"COMPLAINT"; status:"NEW"|"IN_PROGRESS"|"RESOLVED"; priority:"URGENT"|"NORMAL"; latestMessage:string };
type Metrics = { open:number; queries:number; complaints:number; resolved:number; urgent:number };

function department(message:string) {
  const value=message.toLowerCase();
  if(/tap|water|electric|light|repair|broken|maintenance|ac\b|air condition/.test(value))return "Maintenance";
  if(/towel|linen|clean|housekeep|toilet|room service/.test(value))return "Housekeeping";
  if(/food|breakfast|lunch|dinner|restaurant|drink|tea|coffee/.test(value))return "Food & Beverage";
  if(/safari|experience|tour|activity|pickup|transport|taxi/.test(value))return "Experiences";
  return "Front Desk";
}

export function StayOperationsSnapshot({propertySlug}:{propertySlug:string}) {
  const [cases,setCases]=useState<StayCase[]>([]);
  const [metrics,setMetrics]=useState<Metrics|null>(null);
  useEffect(()=>{let active=true;void fetch(`/api/hotelgpt-stay/cases?propertySlug=${encodeURIComponent(propertySlug)}`,{cache:"no-store"}).then(response=>response.ok?response.json():null).then(body=>{if(active&&body){setCases(body.cases||[]);setMetrics(body.metrics||null);}}).catch(()=>null);return()=>{active=false};},[propertySlug]);
  const departments=useMemo(()=>cases.filter(item=>item.status!=="RESOLVED").reduce<Record<string,number>>((all,item)=>{const key=department(item.latestMessage);all[key]=(all[key]||0)+1;return all;},{}),[cases]);
  const totalOpen=Math.max(metrics?.open||0,1);
  const stages=[{label:"Received",value:cases.filter(item=>item.status==="NEW").length,color:"bg-[#2878b8]"},{label:"In progress",value:cases.filter(item=>item.status==="IN_PROGRESS").length,color:"bg-[#7454b3]"},{label:"Resolved",value:metrics?.resolved||0,color:"bg-[#168064]"}];
  return <section className="mb-6 overflow-hidden rounded-2xl border border-[#e5dece] bg-white shadow-[0_16px_44px_rgba(40,32,12,.06)]">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eee8db] px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#8a6a16]">Live hotel operations</p><h3 className="mt-1 text-lg font-semibold">Guest service at a glance</h3></div><div className="flex gap-2"><Link href="/in-stay/inbox" className="rounded-lg bg-[#171717] px-3.5 py-2 text-xs font-bold text-white">Service inbox</Link><Link href="/in-stay" className="rounded-lg border border-[#dcd5c7] px-3.5 py-2 text-xs font-bold">View operations</Link></div></div>
    <div className="grid lg:grid-cols-[1.05fr_1.35fr]">
      <div className="border-b border-[#eee8db] p-5 lg:border-b-0 lg:border-r"><div className="grid grid-cols-3 gap-3">{[["Open",metrics?.open||0],["Urgent",metrics?.urgent||0],["Complaints",metrics?.complaints||0]].map(([label,value])=><div key={label} className="rounded-xl bg-[#f8f6f0] p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>)}</div><div className="mt-5 flex h-2 overflow-hidden rounded-full bg-[#eeeae1]">{stages.map(stage=><span key={stage.label} className={stage.color} style={{width:`${Math.max(4,(stage.value/Math.max(cases.length,1))*100)}%`}}/>)}</div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">{stages.map(stage=><span key={stage.label} className="text-[11px] text-[var(--text-muted)]"><i className={`mr-1.5 inline-block size-2 rounded-full ${stage.color}`}/>{stage.label} <strong className="text-[var(--text)]">{stage.value}</strong></span>)}</div></div>
      <div className="p-5"><p className="text-xs font-semibold">Open work by department</p><div className="mt-4 space-y-3">{["Front Desk","Housekeeping","Food & Beverage","Maintenance","Experiences"].map(name=>{const value=departments[name]||0;return <div key={name} className="grid grid-cols-[120px_1fr_24px] items-center gap-3 text-[11px]"><span className="truncate text-[var(--text-muted)]">{name}</span><span className="h-2 overflow-hidden rounded-full bg-[#f0ede6]"><span className="block h-full rounded-full bg-[#c3a443]" style={{width:`${value?Math.max(12,(value/totalOpen)*100):0}%`}}/></span><strong className="text-right">{value}</strong></div>})}</div></div>
    </div>
  </section>;
}
