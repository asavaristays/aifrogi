import os,sys,json,subprocess,math
from PIL import Image,ImageDraw,ImageFont,ImageFilter
C=json.loads(sys.argv[1]);os.makedirs('/home/user/finalfilm',exist_ok=True);os.chdir('/home/user/finalfilm')
def run(a):subprocess.run(a,check=True,stdout=subprocess.DEVNULL)
def fetch(u,p):run(['curl','-f','-sS','-L','-A','Mozilla/5.0',u,'-o',p])
fetch(C['phone'],'phone.mp4');fetch(C['hotel'],'hotel.mp4')
fetch('https://d2ol7oe51mr4n9.cloudfront.net/user_3HgKfuLfI7SalGtcrGxZ6Tbs2Zu/dba8f38a-2d87-4726-9392-c1364f5223fa.mp4','old.mp4')
fetch('https://aifrogi.com/brand/aifrogi-logo-white.png','logo.png')
fetch('https://aifrogi.com/brand/aifrogi-sovereign-bot.png','bot.png')
W,H,F=720,1280,30
gold='#e5c879';white='#f6f5ef';grey='#b6b5b0'
fonts={}
def font(n):
 if n not in fonts:fonts[n]=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',n)
 return fonts[n]
def text(d,s,y,n=30,c=white,x=None):
 w=d.textbbox((0,0),s,font=font(n))[2]
 if x is None:x=(W-w)//2
 assert x>=35 and x+w<=685,(s,x,w)
 d.text((x,y),s,font=font(n),fill=c)
logo=Image.open('logo.png').convert('RGBA');logo=logo.crop(logo.getbbox())
mark=logo.copy();mark.thumbnail((152,65),Image.Resampling.LANCZOS)
bot=Image.open('bot.png').convert('RGB')
def ease(t):return 1-(1-max(0,min(1,t)))**3
def bg(t):
 im=Image.new('RGB',(W,H),(5,6,8));d=ImageDraw.Draw(im)
 # Quiet moving light traces, not a slide background.
 for j in range(8):
  x=int(360+270*math.sin(t*.22+j*.64));y=int(650+320*math.cos(t*.18+j*.64))
  d.ellipse((x-2,y-2,x+2,y+2),fill=(85,69,34))
 return im
def mascot(t):
 s=1+.025*math.sin(t*.35);ww=int(720*s);hh=int(900*s)
 im=bg(t);b=bot.resize((ww,hh),Image.Resampling.LANCZOS);im.paste(b,((720-ww)//2,int(195+8*math.sin(t*.8))))
 return im
def chrome(im,caption='',note=''):
 layer=Image.new('RGBA',(W,H));d=ImageDraw.Draw(layer)
 for y in range(180):d.line((0,y,W,y),fill=(0,0,0,int(110*(1-y/180))))
 for y in range(990,H):d.line((0,y,W,y),fill=(0,0,0,int(205*(y-990)/290)))
 im=Image.alpha_composite(im.convert('RGBA'),layer)
 im.alpha_composite(mark,((720-mark.width)//2,78))
 d=ImageDraw.Draw(im)
 if caption:text(d,caption,1120,29)
 if note:text(d,note,1170,19,grey)
 return im.convert('RGB')
def bubble(d,box,lines,selected=False):
 x,y,w,h=box;d.rounded_rectangle((x,y,x+w,y+h),24,fill='#14171d',outline=gold if selected else '#44433e',width=2)
 for j,s in enumerate(lines):text(d,s,y+22+j*39,25,gold if j==0 else white,x+24)
def report(t):
 im=bg(t);d=ImageDraw.Draw(im);text(d,'See the whole conversation.',285,32)
 # Staged appearance: real recorded totals, not fabricated animation counts.
 alpha=ease(t/.7);r=142
 d.arc((218,405,502,689),-90,-90+359*alpha,fill=gold,width=4)
 if t>.35:text(d,'86',455,84);text(d,'messages',565,25,grey)
 for j,(v,s) in enumerate([('41','AI replies'),('2','Negative ratings')]):
  k=ease((t-.7-j*.4)/.6);yy=int(755+70*(1-k))
  if k>0:
   xx=90+j*330;text(d,v,yy,47,gold,xx);text(d,s,yy+66,22,grey,xx)
 text(d,'Message Matrix · 6 Sep 2026',955,23,grey)
 return chrome(im,'See activity. Find gaps. Improve.','Recorded snapshot — not a live counter')
def handover(t):
 im=bg(t);d=ImageDraw.Draw(im);k=ease(t/2)
 text(d,'A conversation, not a restart.',295,31)
 # Conversation travels to the inbox; the context moves with it.
 d.line((170,650,550,650),fill='#51482d',width=2)
 x=int(60+180*k);y=int(450+90*k)
 bubble(d,(x,y,360,175),['Guest needs help','Dates and room selected','Conversation included'],True)
 if t>1.6:
  text(d,'TEAM INBOX',825,25,gold)
  text(d,'Ready for your team',875,28)
 return chrome(im,'Human help when it matters.')
def family(t,base):
 im=Image.blend(base.convert('RGB'),Image.new('RGB',(W,H),(4,5,7)),.38)
 d=ImageDraw.Draw(im);idx=min(2,int(t/2));labels=[('ClinicGPT','Appointment enquiries'),('PropertyGPT','Property discovery'),('FlowCart','Shopping assistance')]
 label,sub=labels[idx];u=(t%2)/2
 shift=int(60*(1-ease(u*4)))
 # Typography flies through the same cinematic environment; no card grid.
 text(d,label,530+shift,48,gold);text(d,sub,607+shift,28)
 return chrome(im,'Different businesses. One bot family.')
def ending(t):
 im=mascot(t);shade=Image.new('RGBA',(W,H),(0,0,0,0));sd=ImageDraw.Draw(shade)
 sd.rectangle((0,780,720,1280),fill=(5,6,8,255));im=Image.alpha_composite(im.convert('RGBA'),shade)
 l=logo.copy();l.thumbnail((270,110));im.alpha_composite(l,((720-l.width)//2,140))
 d=ImageDraw.Draw(im);text(d,'Less waiting. More business.',815,32)
 text(d,'Start your 15-day trial',880,26,gold)
 text(d,'+91-7410582898',975,34)
 text(d,'info@aifrogi.com',1035,25,grey);text(d,'aifrogi.com',1080,25,gold)
 return im.convert('RGB')
out=subprocess.Popen(['ffmpeg','-y','-v','error','-f','rawvideo','-pix_fmt','rgb24','-s','720x1280','-r','30','-i','-','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','picture.mp4'],stdin=subprocess.PIPE)
samples=[];globalframe=0
def write(im):
 global globalframe
 if globalframe%150==0:samples.append(im.resize((240,426)))
 out.stdin.write(im.convert('RGB').tobytes());globalframe+=1
def footage(path,seconds,start=0,rate=1):
 f=f"scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setpts=PTS/{rate},fps=30"
 pr=subprocess.Popen(['ffmpeg','-v','error','-ss',str(start),'-i',path,'-vf',f,'-t',str(seconds),'-f','rawvideo','-pix_fmt','rgb24','-'],stdout=subprocess.PIPE)
 for i in range(seconds*30):
  raw=pr.stdout.read(W*H*3)
  if len(raw)!=W*H*3:raise RuntimeError('Missing video frame')
  yield i/30,Image.frombytes('RGB',(W,H),raw)
 pr.stdout.close();pr.wait()
for t,im in footage('phone.mp4',5):write(chrome(im,'Every enquiry deserves an answer.'))
for i in range(150):write(chrome(mascot(i/30),'Meet your AI business assistant.'))
last=None
for t,im in footage('hotel.mp4',13,rate=15/13):
 stage=min(3,int(t/3.25));caps=['Choose your dates.','Explore available rooms.','Review your details.','Your demo booking, confirmed.']
 write(chrome(im,caps[stage],'HotelGPT · Demo booking journey'));last=im
for t,im in footage('hotel.mp4',6,start=9):write(family(t,im))
for i in range(180):write(report(i/30))
for i in range(120):write(handover(i/30))
for i in range(180):write(ending(i/30))
out.stdin.close();assert out.wait()==0
assert globalframe==1350
run(['ffmpeg','-y','-v','error','-i','picture.mp4','-i','old.mp4','-map','0:v','-map','1:a','-c:v','copy','-c:a','copy','-t','45','-movflags','+faststart','final.mp4'])
sheet=Image.new('RGB',(720,1278))
for j,s in enumerate(samples):sheet.paste(s,((j%3)*240,(j//3)*426))
sheet.save('review.jpg',quality=92)
print(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration,size','-of','json','final.mp4']).decode(),flush=True)
for name,u in zip(['final.mp4','review.jpg'],C['uploads']):
 res=subprocess.check_output(['curl','-f','-sS','-w','%{http_code}','-X','PUT','-H','Content-Type: '+u['content_type'],'--upload-file',name,u['upload_url']]).decode()
 assert res.endswith('200'),res
 print('UPLOADED '+u['media_id']+' HTTP '+res,flush=True)
