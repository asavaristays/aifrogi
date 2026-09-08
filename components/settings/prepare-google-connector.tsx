"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
export function PrepareGoogleConnector({propertySlug}:{propertySlug:string}) {
  const [busy,setBusy]=useState(false),[error,setError]=useState("");const router=useRouter();
  async function prepare(){setBusy(true);setError("");try{
    const response=await fetch('/api/appointment-journey/current',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'PREPARE_GOOGLE',propertySlug})});
    const body=await response.json();if(!response.ok)throw Error(body.error||'Setup failed');router.refresh();
  }catch(e){setError(e instanceof Error?e.message:'Setup failed');}finally{setBusy(false);}}
  return <div><button disabled={busy} onClick={prepare} className="rounded-full bg-black px-6 py-3 font-semibold !text-white disabled:opacity-50">{busy?'Preparing…':'Prepare Google connection'}</button>{error?<p role="alert" className="mt-3 text-red-700">{error}</p>:null}</div>;
}
