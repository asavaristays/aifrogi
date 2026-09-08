import { marketingMetadata } from '@/lib/seo';
import Link from 'next/link';
export const metadata = marketingMetadata({title:'Experience AiFrogi',description:'Watch the AiFrogi AI Business Bot film.',path:'/experience'});
export default function ExperiencePage() {
  return <main style={{minHeight:'100dvh',background:'#080b10',color:'#fff',padding:'20px',display:'flex',flexDirection:'column',alignItems:'center',gap:'16px'}}>
    <Link href="/" style={{color:'#e8cb7b',textDecoration:'none'}}>← AiFrogi</Link>
    <video controls playsInline preload="metadata" aria-label="AiFrogi AI Business Bot presentation" style={{width:'100%',maxWidth:'540px',maxHeight:'82dvh',borderRadius:'20px',background:'#000'}}>
      <source src="/media/AIFrogi-AI-Bot-20260906.mp4" type="video/mp4"/>
      Your browser does not support video playback. <a href="/media/AIFrogi-AI-Bot-20260906.mp4">Open the video</a>.
    </video>
    <a href="/media/AIFrogi-AI-Bot-20260906.mp4" download style={{color:'#e8cb7b'}}>Download video</a>
  </main>;
}
