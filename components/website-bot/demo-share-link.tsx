"use client";
import {useState} from 'react';
export function DemoShareLink({slug}:{slug:string}){
 const [notice,setNotice]=useState('');
 return <div><button type="button" onClick={async()=>{try{await navigator.clipboard.writeText(`${location.origin}/bot/${slug}`);setNotice('Link copied');}catch{setNotice('Open the demo and copy its browser address.');}}} className="rounded-full border border-stone-300 px-4 py-2 text-sm" style={{color:'#171717',background:'#fff'}}>Copy demo link</button><p role="status" className="mt-1 text-xs text-stone-600">{notice}</p></div>;
}
