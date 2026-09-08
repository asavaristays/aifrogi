'use client';
import {useEffect,useState,type RefObject} from 'react';
import {MousePointer2} from 'lucide-react';
import styles from './experience-story.module.css';
export function ExperienceCursor({surface,target,clicking,visible}:{surface:RefObject<HTMLDivElement|null>;target:string|null;clicking:boolean;visible:boolean}) {
  const [point,setPoint]=useState<{x:number;y:number}|null>(null);
  useEffect(()=>{
    const parent=surface.current;
    if(!parent||!target||!visible){setPoint(null);return;}
    const update=()=>{
      const element=parent.querySelector<HTMLElement>(`[data-guide="${target}"]`);
      if(!element){setPoint(null);return;}
      const rect=element.getBoundingClientRect(),base=parent.getBoundingClientRect();
      setPoint({x:rect.left-base.left+rect.width*.65,y:rect.top-base.top+rect.height*.58});
    };
    update();const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(update):null;observer?.observe(parent);
    window.addEventListener('resize',update);
    return()=>{observer?.disconnect();window.removeEventListener('resize',update);};
  },[surface,target,visible]);
  if(!visible||!point)return null;
  return <div aria-hidden="true" className={styles.demoCursor} data-clicking={clicking} style={{left:point.x,top:point.y}}><span/><MousePointer2 size={30} fill="#fff" stroke="#292419" strokeWidth={1.4}/></div>;
}
