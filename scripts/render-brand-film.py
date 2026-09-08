import os,sys,json,subprocess,urllib.request,wave
import numpy as np
from PIL import Image,ImageDraw,ImageFont
cfg=json.loads(sys.argv[1]); os.makedirs('/home/user/film',exist_ok=True);os.chdir('/home/user/film')
def run(args): subprocess.run(args,check=True,stdout=subprocess.DEVNULL)
def fetch(url,path): subprocess.run(['curl','-f','-sS','-L','-A','Mozilla/5.0',url,'-o',path],check=True)
for i,url in enumerate(cfg['videos']): fetch(url,f'scene{i}.mp4')
fetch('https://aifrogi.com/brand/aifrogi-logo-white.png','logo.png')
fetch('https://aifrogi.com/brand/aifrogi-sovereign-bot.png','bot.png')
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def center(d,text,y,size,color='#ffffff',bold=False):
 f=ImageFont.truetype(BOLD if bold else FONT,size)
 box=d.textbbox((0,0),text,font=f); x=(720-(box[2]-box[0]))/2
 assert x>=35,(text,x)
 d.text((x,y),text,font=f,fill=color)
end=Image.new('RGB',(720,1280),(7,8,9)); d=ImageDraw.Draw(end)
d.ellipse((70,220,650,800),outline=(52,44,22),width=1)
bot=Image.open('bot.png').convert('RGB');bot.thumbnail((430,540))
end.paste(bot,((720-bot.width)//2,275))
logo=Image.open('logo.png').convert('RGBA');logo.thumbnail((350,132))
end.paste(logo,((720-logo.width)//2,140),logo)
center(d,'Less waiting. More business.',815,33,bold=True)
center(d,'Start your 15-day trial',885,27,'#e2c266')
d.line((245,945,475,945),fill='#574c2b',width=1)
center(d,'+91-7410582898',982,34,bold=True)
center(d,'info@aifrogi.com',1044,25,'#d0d0cc')
center(d,'aifrogi.com',1090,25,'#e2c266')
end.save('end.png')

# Replace the generated mascot variant with the exact supplied bot, slowly dollying in.
run(['ffmpeg','-y','-v','error','-i','scene0.mp4','-loop','1','-i','bot.png','-filter_complex_threads','1','-filter_complex',
"[0:v]scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,trim=duration=8,setpts=PTS-STARTPTS[a];[1:v]scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2,zoompan=z='1+0.025*on/150':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=150:s=720x1280:fps=30,trim=duration=5,setsar=1,setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1:a=0[v]",
'-map','[v]','-an','-t','13','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','corrected0.mp4'])
os.replace('corrected0.mp4','scene0.mp4')

# Transparent, exact typography; all examples remain explicitly simulated.
titles=[
[(0,4.8,['Messages keep coming.']),(4.8,8.8,['Your team cannot','answer everything.']),(8.8,13,['Meet AiFrogi.'])],
[(0,7,['Turn questions','into next steps.']),(7,13,['One family.','Different businesses.'])],
[(0,7,['AI helps.','Your team stays in control.']),(7,13,['Less waiting.','More business.'])]
]
for i,blocks in enumerate(titles):
 ff=['ffmpeg','-y','-v','error','-i',f'scene{i}.mp4']
 layers=[]
 for k,(start,stop,lines) in enumerate(blocks):
  im=Image.new('RGBA',(720,1280),(0,0,0,0));dr=ImageDraw.Draw(im)
  for y in range(420):
   dr.line((0,y,719,y),fill=(0,0,0,int(185*max(0,1-y/420))))
  for j,line in enumerate(lines): center(dr,line,100+j*60,42,bold=True)
  if i==1 and k==0:
   center(dr,'Approved answers. Optional connectors.',260,24,'#e2c266')
  if i==1 and k==1:
   center(dr,'ClinicGPT  •  HotelGPT  •  DineGPT',265,24,'#e2c266')
   center(dr,'eduGPT  •  PropertyGPT  •  FlowCart',305,24,'#e2c266')
   center(dr,'BusinessGPT  •  Custom Bot',345,24,'#e2c266')
  if i==2 and k==0:
   center(dr,'Human help, with conversation context.',260,24,'#e2c266')
  dr.rounded_rectangle((110,1175,610,1220),22,fill=(0,0,0,175))
  center(dr,'Illustrative demo • Not a live transaction',1185,18,'#ddd5bb')
  name=f'overlay{i}-{k}.png';im.save(name);ff+=['-loop','1','-i',name];layers.append((start,stop))
 chain="[0:v]scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,trim=duration=13,setpts=PTS-STARTPTS[v0];"
 for k,(a,b) in enumerate(layers):
  chain+=f"[v{k}][{k+1}:v]overlay=0:0:enable='between(t,{a},{b})'[v{k+1}];"
 chain=chain.rstrip(';')
 run(ff+['-filter_complex_threads','1','-filter_complex',chain,'-map',f'[v{len(layers)}]','-an','-t','13','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p',f'cut{i}.mp4'])
run(['ffmpeg','-y','-v','error','-loop','1','-i','end.png','-vf','fade=t=in:d=0.35','-r','30','-t','6','-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','cut3.mp4'])
with open('cuts.txt','w') as f:
 for i in range(4):f.write(f"file 'cut{i}.mp4'\n")
# Original 120 BPM instrumental score, no imported song, no speech.
sr=44100;N=45*sr;rng=np.random.default_rng(91);song=np.zeros((N,2),dtype=np.float64)
def add(sig,t,amp=1,pan=0):
 s=int(t*sr); n=min(len(sig),N-s)
 if n<=0:return
 song[s:s+n,0]+=sig[:n]*amp*(1-pan*.35)
 song[s:s+n,1]+=sig[:n]*amp*(1+pan*.35)
def tone(note,dur,pluck=True):
 t=np.arange(int(sr*dur))/sr;f=440*2**((note-69)/12)
 env=(1-np.exp(-t*70))*np.exp(-t*(3.5 if pluck else .22))*np.minimum(1,(dur-t)*6)
 return (np.sin(2*np.pi*f*t)+.22*np.sin(2*np.pi*f*2*t)+.08*np.sin(2*np.pi*f*3*t))*env
chords=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]]
for bar in range(23):
 base=bar*2;ch=chords[(bar//2)%4]
 for note in ch: add(tone(note,2.4,False),base,.025)
 for step in range(8):
  note=ch[[0,1,2,1,0,2,1,2][step]]+12
  add(tone(note,.55),base+step*.25,.036 if base>=8 else .015,(-1)**step*.7)
  add(tone(note,.5),base+step*.25+.375,.008,(-1)**(step+1))
 if base>=8:
  for beat in range(4):
   t=np.arange(int(.36*sr))/sr
   kick=np.sin(2*np.pi*(48*t+50*.03*(1-np.exp(-t/.03))))*np.exp(-t*12)
   add(kick,base+beat*.5,.2)
   add(tone(ch[0]-12,.38),base+beat*.5,.09)
   if beat%2:
    t=np.arange(int(.18*sr))/sr;n=rng.normal(0,1,len(t))
    add(np.diff(n,prepend=0)*np.exp(-t*35),base+beat*.5,.025)
  for h in range(8):
   t=np.arange(int(.075*sr))/sr;n=rng.normal(0,1,len(t))
   add(np.diff(n,prepend=0)*np.exp(-t*65),base+h*.25,.012,(-1)**h*.6)
# Delicate notification motif resolves into rhythm.
for when,note in [(1,81),(2,84),(3,88),(4,81),(5,84),(6,88),(8,93)]:
 add(tone(note,.38),when,.048,.4)
timeline=np.arange(N)/sr
song*= (np.minimum(1,timeline/1.3)*np.minimum(1,(45-timeline)/2.0))[:,None]
song=np.tanh(song*1.3);song*=.79/max(np.max(np.abs(song)),.01)
with wave.open('score.wav','wb') as f:
 f.setnchannels(2);f.setsampwidth(2);f.setframerate(sr);f.writeframes((song*32767).astype('<i2').tobytes())
run(['ffmpeg','-y','-v','error','-f','concat','-safe','0','-i','cuts.txt','-i','score.wav','-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','192k','-af','loudnorm=I=-16:TP=-1.5:LRA=9','-t','45','-movflags','+faststart','final.mp4'])
run(['ffmpeg','-y','-v','error','-i','final.mp4','-vf','fps=1/5,scale=240:426,tile=3x3','-frames:v','1','sheet.jpg'])
info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json','final.mp4']))
print(json.dumps({'duration':info['format']['duration'],'bytes':info['format']['size'],'streams':[(s['codec_type'],s['codec_name'],s.get('width'),s.get('height')) for s in info['streams']]}))
for filename,upload in zip(['final.mp4','sheet.jpg','end.png'],cfg['uploads']):
 run(['curl','-f','-sS','-X','PUT','-H','Content-Type: '+upload['content_type'],'--upload-file',filename,upload['upload_url']])
 print('UPLOADED '+upload['media_id'],flush=True)
