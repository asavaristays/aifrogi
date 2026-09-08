'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './team-inbox.module.css';
type Summary = {unread:number;needsHuman:number;checkedAt:string};
type BadgingNavigator = Navigator & {setAppBadge?:(count:number)=>Promise<void>;clearAppBadge?:()=>Promise<void>};
export function TeamInboxStatus() {
  const [summary,setSummary] = useState<Summary|null>(null);
  const [notice,setNotice] = useState('');
  const [alerts,setAlerts] = useState(false);
  const [reviewing,setReviewing] = useState(false);
  const last = useRef<Summary|null>(null);
  const refresh = useRef<()=>Promise<void>>(async()=>{});
  useEffect(()=>{
    let cancelled=false;
    const nav=navigator as BadgingNavigator;
    const originalTitle=document.title;
    async function poll() {
      try {
        const response=await fetch('/api/team-inbox/summary',{cache:'no-store'});
        if(!response.ok) throw new Error('Sign in again or retry. Inbox counts unavailable.');
        const value=await response.json() as Summary;
        if(cancelled)return;
        setSummary(value);
        document.title=`${value.unread ? `(${value.unread}) ` : ''}Team Inbox · AiFrogi`;
        if(nav.setAppBadge) await nav.setAppBadge(value.unread).catch(()=>{});
        if(alerts && last.current && (value.unread>last.current.unread || value.needsHuman>last.current.needsHuman) && typeof Notification!=='undefined' && Notification.permission==='granted') {
          try { new Notification('AiFrogi Team Inbox',{body:'New inbox activity. Sign in to review.',tag:'aifrogi-team-inbox'}); } catch { /* In-app counts remain available on unsupported devices. */ }
        }
        last.current=value;
      } catch { if(!cancelled){setSummary(null);setNotice('Counts unavailable. Refresh or sign in again.');await nav.clearAppBadge?.().catch(()=>{});} }
    }
    refresh.current=poll;
    void poll();
    const timer=setInterval(poll,20000);
    return ()=>{cancelled=true;clearInterval(timer);document.title=originalTitle;void nav.clearAppBadge?.().catch(()=>{});};
  },[alerts]);
  async function enableAlerts(){
    if(typeof Notification==='undefined'){setNotice('Browser alerts are not supported here. Use the inbox counts and existing email alerts.');return;}
    const permission=await Notification.requestPermission();
    setAlerts(permission==='granted');
    setNotice(permission==='granted'?'Alerts enabled while this inbox remains open. Background push is not enabled.':'Alerts not enabled. Inbox counts remain available.');
  }
  async function markSeen(){
    if(!summary || reviewing)return;
    setReviewing(true);
    try {
    const r=await fetch('/api/team-inbox/summary',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({checkedAt:summary.checkedAt})});
    setNotice(r.ok?'Marked reviewed for your account. Human-help requests remain open until handled.':'Could not mark reviewed. Refresh and retry.');
    if(r.ok)await refresh.current();
    } catch {setNotice('Could not mark reviewed. Your messages are unchanged. Please retry.');}
    finally {setReviewing(false);}
  }
  return <><header className={styles.header}>
    <div><h1>Team Inbox</h1><p>Your website conversations, ready for a human reply.</p><div className={styles.counts}><span><strong>{summary?.unread ?? '—'}</strong> messages since review</span><span><strong>{summary?.needsHuman ?? '—'}</strong> need human help</span></div></div>
    <div className={styles.tools}><button disabled={!summary || reviewing} onClick={markSeen}>{reviewing?'Saving…':'Mark reviewed'}</button><details><summary>Inbox options</summary><div className={styles.options}><button onClick={alerts?()=>setAlerts(false):enableAlerts}>{alerts?'Disable browser alerts':'Enable browser alerts'}</button><button onClick={()=>setNotice('Use your browser menu → Add to Home Screen. Icon badges depend on device support and update while this inbox is open.')}>Add to Home Screen</button><a href="/billing">Usage & billing</a><p>Counts refresh every 20 seconds. Mark reviewed clears your account’s count, not open help requests. Alerts work while the inbox is open; closed-app push is not enabled. Alerts never show private message text.</p></div></details></div>
  </header>{notice && <p role="status" className={styles.notice}>{notice}</p>}</>;
}
