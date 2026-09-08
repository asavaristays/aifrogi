'use client';
import Image from 'next/image';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Play,Pause,RotateCcw,Share2,Volume2,VolumeX,X,Check,ShieldCheck,CalendarDays,BookOpen,Link2,Headphones,Stethoscope,Building2,Utensils,GraduationCap,Home,ShoppingBag,Briefcase,Sparkles} from 'lucide-react';
import {chapterAt,chapterStarts,experienceBots,storyChapters,storyDuration} from '@/lib/experience-story';
import styles from './experience-story.module.css';
import {ExperienceMusic} from '@/lib/experience-music';
import {ExperienceCursor} from './experience-cursor';
import {reelCue,reelPhase} from '@/lib/experience-reel';
const botIcons=[Stethoscope,Building2,Utensils,GraduationCap,Home,ShoppingBag,Briefcase,Sparkles];
export function ExperienceStory() {
  const [time,setTime]=useState(0),[playing,setPlaying]=useState(false),[music,setMusic]=useState(false),[audioBusy,setAudioBusy]=useState(false),[notice,setNotice]=useState('');
  const sound=useRef<ExperienceMusic|null>(null);
  const visual=useRef<HTMLDivElement>(null);
  const [selectedConnector,setSelectedConnector]=useState(-1),[annual,setAnnual]=useState(false);
  const [selectedBot,setSelectedBot]=useState(0),[slot,setSlot]=useState('4:30 PM'),[confirmed,setConfirmed]=useState(false),[reduced,setReduced]=useState(false);
  const scrollArea=useRef<HTMLDivElement>(null),touch=useRef<{x:number;y:number}|null>(null);
  const scene=chapterAt(time),chapter=storyChapters[scene],localTime=time-chapterStarts[scene];
  const phase=reelPhase(scene,localTime),cue=reelCue(scene,localTime);
  const shownBot=phase.family??selectedBot,shownConnector=phase.connector??selectedConnector,shownAnnual=phase.yearly||annual;
  const shownSlot=phase.slotPicked?'4:30 PM':slot;
  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>{setReduced(media.matches); if(media.matches)setPlaying(false);};update();media.addEventListener('change',update);
    const hide=()=>{if(document.hidden)setPlaying(false);};document.addEventListener('visibilitychange',hide);
    return()=>{media.removeEventListener('change',update);document.removeEventListener('visibilitychange',hide);};
  },[]);
  useEffect(()=>{
    if(!playing)return;
    let last=performance.now();
    const interval=setInterval(()=>{const now=performance.now();const delta=(now-last)/1000;last=now;setTime(value=>Math.min(storyDuration,value+delta));},100);
    return()=>clearInterval(interval);
  },[playing]);
  useEffect(()=>{if(time>=storyDuration)setPlaying(false);},[time]);
  useEffect(()=>{if(scrollArea.current)scrollArea.current.scrollTop=0;},[scene]);
  useEffect(()=>{
    sound.current?.mute(!music || document.hidden);
    sound.current?.setPlaying(music&&playing&&!document.hidden);
  },[music,playing]);
  useEffect(()=>{if(music&&!document.hidden)sound.current?.transition();},[scene,music]);
  useEffect(()=>{if(cue?.clicking&&music&&playing&&!document.hidden)sound.current?.transition();},[cue?.clicking,music,playing]);
  useEffect(()=>{
    const visibility=()=>sound.current?.mute(document.hidden||!music);
    document.addEventListener('visibilitychange',visibility);
    return()=>document.removeEventListener('visibilitychange',visibility);
  },[music]);
  useEffect(()=>()=>{sound.current?.dispose();sound.current=null;},[]);
  async function toggleMusic(){
    if(audioBusy)return;
    if(music){sound.current?.mute(true);setMusic(false);return;}
    setAudioBusy(true);
    try {
      if(!sound.current){
        const Context=window.AudioContext||(window as Window & {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
        if(!Context)throw new Error('Audio unavailable');
        sound.current=new ExperienceMusic(new Context());
      }
      await sound.current.unlock();setMusic(true);
    }catch{setMusic(false);setNotice('Music is unavailable here. The story still works without sound.');}
    finally{setAudioBusy(false);}
  }
  function go(index:number){setPlaying(false);setTime(chapterStarts[Math.max(0,Math.min(storyChapters.length-1,index))]);}
  function resetDemo(){setConfirmed(false);setAnnual(false);setSelectedBot(0);setSelectedConnector(-1);setSlot('4:30 PM');}
  function play(){if(time>=storyDuration){setTime(0);resetDemo();}setPlaying(value=>!value);}
  async function share(){setPlaying(false);try{if(navigator.share)await navigator.share({title:'Experience AiFrogi',url:'https://aifrogi.com/experience'});else{await navigator.clipboard.writeText('https://aifrogi.com/experience');setNotice('Link copied. Share it with your team.');}}catch{setNotice('Share this link: https://aifrogi.com/experience');}}
  const bookingShown=confirmed || phase.booking;
  return <main className={styles.experience} data-playing={playing} data-reduced={reduced} onKeyDown={event=>{if(event.target!==event.currentTarget)return;if(event.key==='ArrowRight'){event.preventDefault();go(scene+1);}if(event.key==='ArrowLeft'){event.preventDefault();go(scene-1);}}} tabIndex={-1}>
    <div className={styles.shell}>
      <header className={styles.header}><a href="https://aifrogi.com" aria-label="AiFrogi homepage"><Image src="/brand/aifrogi-logo-white.png" alt="AiFrogi" width={140} height={53} priority/></a><span>THE 45-SECOND EXPERIENCE</span><a href="https://aifrogi.com" className={styles.closeButton} aria-label="Close presentation"><X size={19}/></a></header>
      <div ref={scrollArea} className={styles.stage} onTouchStart={event=>{touch.current={x:event.touches[0].clientX,y:event.touches[0].clientY};}} onTouchEnd={event=>{if(!touch.current)return;const x=event.changedTouches[0].clientX-touch.current.x,y=event.changedTouches[0].clientY-touch.current.y;touch.current=null;if(Math.abs(x)>65&&Math.abs(x)>Math.abs(y)*1.4)go(scene+(x<0?1:-1));}}>
        <section key={scene} className={styles.scene} aria-label={chapter.label}>
          <div className={styles.intro}><p className={styles.eyebrow}>0{scene+1} / {chapter.label}</p><h1>{chapter.title.split('\n').map((line,i)=><span key={line} className={i===1?styles.gold:undefined}>{line}</span>)}</h1><p className={styles.copy}>{chapter.copy}</p></div>
          <div ref={visual} className={styles.visual}>
            {scene===0&&<div className={styles.hero}><Image src="/brand/aifrogi-sovereign-bot.png" alt="AiFrogi’s black and gold AI assistant" width={560} height={700} sizes="(max-width: 700px) 80vw, 460px" priority/><button className={styles.primary} onClick={()=>{setTime(0);setConfirmed(false);setPlaying(true);resetDemo();}}>Watch 45 seconds <Play size={16}/></button><button className={styles.textButton} onClick={()=>go(2)}>Or explore your bot family <ArrowRight size={16}/></button></div>}
            {scene===1&&<div className={styles.chat}>
              <div className={styles.chatHead}><Stethoscope size={20}/><div><strong>ClinicGPT</strong><small>Demo journey · no real booking</small></div><span className={styles.liveDot}/></div>
              <p data-guide="question" className={styles.guest}>Can I book a consultation?</p>
              <div className={styles.reveal} data-visible={!playing||localTime>=1.5}><p className={styles.bot}>Two example slots. Which works for you?</p><span className={styles.checkLabel}><Check size={13}/> Demo calendar checked</span></div>
              <div className={styles.slots}>{['4:30 PM','5:00 PM'].map((value,i)=><button data-guide={i===0?'slot':undefined} data-clicked={i===0&&phase.slotPicked} key={value} aria-pressed={(phase.slotPicked||!playing)&&shownSlot===value} onClick={()=>{setPlaying(false);setSlot(value);setConfirmed(false);setTime(chapterStarts[1]);}}>{value}</button>)}</div>
              {bookingShown?<div className={styles.confirmation}><Check/><div><strong>You’re booked. In this demo.</strong><p>{shownSlot} · simulated provider verification</p></div></div>:<button data-guide="confirm" data-clicked={phase.confirming} className={styles.primary} onClick={()=>{setPlaying(false);setConfirmed(true);}}>{phase.confirming?'Verifying demo result…':'Confirm my slot'} <ArrowRight size={16}/></button>}
              <p className={styles.small}>Simulation only. Real actions need approved connectors and verification.</p>
            </div>}
            {scene===2&&<div className={styles.family}><div className={styles.botGrid}>{experienceBots.map((bot,i)=>{const Glyph=botIcons[i];return <button data-guide={`family-${i}`} key={bot.slug} aria-pressed={shownBot===i} onClick={()=>{setSelectedBot(i);setPlaying(false);setTime(chapterStarts[2]);}}><Glyph size={20}/><span>{bot.industry}</span></button>;})}</div><div className={styles.selected} key={shownBot}><strong>{experienceBots[shownBot].name}</strong><p>{experienceBots[shownBot].outcome}</p><a className={styles.primary} href={`https://app.aifrogi.com/bot/${experienceBots[shownBot].slug}`} target="_blank" rel="noopener noreferrer" onClick={()=>setPlaying(false)}>Try this demo <ArrowRight size={16}/></a></div><p className={styles.small}>Fictional data · mock connectors · no real transactions.</p></div>}
            {scene===3&&<div className={styles.setupPanel}>
              <p className={styles.panelLabel}><Sparkles size={16}/> YOUR BOT WORKSPACE <span>Demo</span></p>
              <label className={styles.fieldLabel}>Your website</label><div data-guide="website" className={styles.websiteField}>https://{!playing?'your-business.com':'your-business.com'.slice(0,Math.floor(localTime*16))}<span className={styles.caret}/></div>
              <div className={styles.answerPreview}><span>ANSWER PREVIEW</span><p>“Yes, we can help. Here’s the next step…”</p></div>
              <button data-guide="approve" className={styles.primary} data-clicked={phase.reviewed} onClick={()=>{setPlaying(false);setTime(chapterStarts[3]+3.2);}}>{phase.reviewed?<><Check size={18}/> Demo answer reviewed</>:<>Review the answer <ArrowRight size={16}/></>}</button>
              <div className={styles.launchRail}><span>Knowledge</span><ArrowRight size={14}/><span>Review</span><ArrowRight size={14}/><span>Launch checks</span></div>
              <p className={styles.small}>Then improve with reviewed feedback. This is a preview, not a live publication.</p>
              <a className={styles.textButton} href="https://aifrogi.com/install-ai-bot" target="_blank" rel="noopener noreferrer" onClick={()=>setPlaying(false)}>See onboarding <ArrowRight size={16}/></a>
            </div>}
            {scene===4&&<div className={styles.connectors}><div className={styles.hub}><Link2 size={30}/><strong>Connect the next step.</strong><small>Demonstration · approved permissions only</small></div><div className={styles.connectorGrid}>{['Calendar','Sheets','Razorpay','Store','PMS','CRM'].map((label,i)=><button data-guide={`connector-${i}`} aria-pressed={shownConnector===i} key={label} onClick={()=>{setSelectedConnector(i);setPlaying(false);setTime(chapterStarts[4]);}}>{shownConnector===i?<Check size={15}/>:<Link2 size={15}/>} {label}</button>)}</div><div className={styles.connectorResult} key={shownConnector}>{shownConnector<0?'Choose a tool. See the outcome.':['Check an appointment slot.','Keep an enquiry record.','Verify a payment status.','Check product information.','Read authorised room availability.','Pass an enquiry to your team.'][shownConnector]}</div><p className={styles.small}>Not connected here. Vendor access, scope, tests and charges are agreed before activation.</p><a className={styles.textButton} href="https://aifrogi.com/pricing#connector-guides" target="_blank" rel="noopener noreferrer" onClick={()=>setPlaying(false)}>Requirements & costs <ArrowRight size={16}/></a></div>}
            {scene===5&&<div className={styles.trust}><div className={styles.trustHeading}><ShieldCheck size={38} strokeWidth={1.3}/><strong>Control stays with you.</strong></div><div className={styles.guardPills}><span>Approved knowledge</span><span>Access controls</span><span>Verified actions</span></div><p className={styles.guest}>Can I speak to your team?</p><button data-guide="handover" className={styles.primary} data-clicked={phase.handover} onClick={()=>{setPlaying(false);setTime(chapterStarts[5]+1.8);}}><Headphones size={18}/> {phase.handover?'Demo handover ready':'Bring in a person'}</button>{phase.handover&&<div className={styles.handover}><Check size={20}/><span>Your question + context, ready for the team.</span></div>}<p className={styles.small}>Simulated handover. Product safeguards—not a claim of regulatory certification.</p><a className={styles.textButton} href="https://aifrogi.com/security-compliance" target="_blank" rel="noopener noreferrer" onClick={()=>setPlaying(false)}>Security & responsibilities <ArrowRight size={16}/></a></div>}
            {scene===6&&<div className={styles.pricing}><p className={styles.eyebrow}>STARTER · ONE AI BOT</p><div className={styles.billingToggle}>{[false,true].map(yearly=><button data-guide={yearly?'yearly':'monthly'} key={String(yearly)} aria-pressed={shownAnnual===yearly} onClick={()=>{setAnnual(yearly);setPlaying(false);setTime(chapterStarts[6]);}}>{yearly?'Yearly':'Monthly'}</button>)}</div><p className={styles.price} key={String(shownAnnual)}>{shownAnnual?'₹4,999':'₹499'}</p><p className={styles.billingNote}>{shownAnnual?'per year · save ₹989':'per month · billed monthly'}</p><div className={styles.trialStrip}><strong>Try first. ₹0.</strong><span>15-day free trial</span></div><p className={styles.small}>Trial: 100 AI replies. Starter allowance: 1,000 AI replies. Usage limits apply; taxes, connectors and provider fees are separate unless quoted together.</p><a className={styles.textButton} href="https://aifrogi.com/pricing" target="_blank" rel="noopener noreferrer" onClick={()=>setPlaying(false)}>Full pricing & terms <ArrowRight size={16}/></a></div>}
            {scene===7&&<div className={styles.finale}><Image src="/brand/aifrogi-logo-white.png" alt="AiFrogi" width={220} height={83}/><a data-guide="try-demo" className={styles.primary} href="https://app.aifrogi.com/ai-bot-demos" onClick={()=>setPlaying(false)}>Try the bot family <ArrowRight size={18}/></a><a className={styles.secondary} href="https://app.aifrogi.com/register?source=experience">Start your free trial</a><div className={styles.contact}><a href="tel:+917410582898">+91-7410582898</a><a href="mailto:info@aifrogi.com">info@aifrogi.com</a></div><button className={styles.textButton} onClick={share}><Share2 size={16}/>Share this experience</button></div>}
          </div>
        </section>
      </div>
      <footer className={styles.controls}>
        <nav className={styles.progress} aria-label="Story chapters">{storyChapters.map((item,i)=><button key={item.label} aria-label={`Chapter ${i+1}: ${item.label}`} aria-current={scene===i?'step':undefined} onClick={()=>go(i)}><span style={{width:`${Math.max(0,Math.min(100,(time-chapterStarts[i])/item.seconds*100))}%`}}/></button>)}</nav>
        <div className={styles.controlRow}><button onClick={()=>go(scene-1)} disabled={scene===0} aria-label="Previous chapter"><ArrowLeft size={19}/></button><button className={styles.playButton} onClick={play}>{playing?<Pause size={17}/>:time>=storyDuration?<RotateCcw size={17}/>:<Play size={17}/>} {playing?'Pause':time>=storyDuration?'Replay':'Play'}</button><span className={styles.timer}>{Math.min(storyDuration,Math.floor(time))} / {storyDuration}s</span><button onClick={toggleMusic} disabled={audioBusy} aria-pressed={music} aria-label={music?'Mute music':'Enable background music and slide sounds'} title={music?'Music on — tap to mute':'Music off — tap to enable'}>{music?<Volume2 size={18}/>:<VolumeX size={18}/>}</button><button onClick={()=>go(scene+1)} disabled={scene===storyChapters.length-1} aria-label="Next chapter"><ArrowRight size={19}/></button></div>
        <p className={styles.hint}>{reduced?'Reduced motion · tap chapters to explore.':'Swipe left or right · tap a chapter · sound optional'}</p>
      </footer>
            <ExperienceCursor surface={visual} target={scene===1&&bookingShown?null:cue?.target??null} clicking={cue?.clicking??false} visible={playing&&!reduced}/>
          </div>
    {notice&&<div className={styles.notice} role="status">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss message">×</button></div>}
  </main>;
}
