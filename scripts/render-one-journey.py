import os,sys,json,math,subprocess
from PIL import Image,ImageDraw,ImageFont,ImageFilter
C=json.loads(sys.argv[1]);os.makedirs('/home/user/journey',exist_ok=True);os.chdir('/home/user/journey')
def run(a):subprocess.run(a,check=True,stdout=subprocess.DEVNULL)
def fetch(u,p):run(['curl','-fsSL','-A','Mozilla/5.0',u,'-o',p])
fetch('https://aifrogi.com/brand/aifrogi-logo-white.png','logo.png')
fetch('https://d2ol7oe51mr4n9.cloudfront.net/user_3HgKfuLfI7SalGtcrGxZ6Tbs2Zu/dba8f38a-2d87-4726-9392-c1364f5223fa.mp4','music.mp4')
fetch('https://d8j0ntlcm91z4.cloudfront.net/user_3HgKfuLfI7SalGtcrGxZ6Tbs2Zu/hf_20260906_074239_e5f76fb9-5557-4fa3-8156-df67b812022b.mp4','hotel.mp4')
run(['ffmpeg','-y','-v','error','-ss','9','-i','hotel.mp4','-frames:v','1','room.png'])
room=Image.open('room.png').convert('RGB').crop((145,585,720,1030)).resize((346,235),Image.Resampling.LANCZOS)
logo=Image.open('logo.png').convert('RGBA');logo=logo.crop(logo.getbbox())
W,H=720,1280;gold='#dec181';white='#f7f3ea';grey='#a5aab3'
fonts={}
def font(n):
 if n not in fonts:fonts[n]=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',n)
 return fonts[n]
def text(im,s,y,n=28,c=white,x=None):
 d=ImageDraw.Draw(im);ww=d.textbbox((0,0),s,font=font(n))[2]
 xx=(im.width-ww)/2 if x is None else x
 assert xx>=0 and xx+ww<=im.width,(s,xx,ww)
 d.text((xx,y),s,font=font(n),fill=c)
def ease(v):v=max(0,min(1,v));return v*v*(3-2*v)
def bubble(im,lines,y,right=False):
 d=ImageDraw.Draw(im);x=44 if right else 20;h=30*len(lines)+30
 d.rounded_rectangle((x,y,380,y+h),18,fill='#67552e' if right else '#222c39')
 for j,line in enumerate(lines):text(im,line,y+15+30*j,22,x=x+15)
def button(im,label,y,pressed=False):
 d=ImageDraw.Draw(im);d.rounded_rectangle((25,y,375,y+64),16,fill='#e2c787' if pressed else '#b3924e')
 text(im,label,y+17,25,'#101217')
def screen(stage,t):
 im=Image.new('RGB',(400,760),'#0c131d');d=ImageDraw.Draw(im)
 text(im,'Team Inbox' if stage==4 else ('Booking activity' if stage==3 else 'HotelGPT'),62,28,gold)
 d.line((22,111,378,111),fill='#2c3440',width=1)
 if stage==0:
  if t>.15:
   bubble(im,['A room for two?','12–14 September.'],160,True)
  if t>1.3:bubble(im,['Of course. Let’s find','your stay.'],296)
  if t>2.6:
   d.rounded_rectangle((25,456,375,528),16,outline=gold,width=2)
   text(im,'12–14 Sep · 2 guests',479,23,gold)
  if t>3.5:button(im,'Find a room',575,t>4.8)
 elif stage==1:
  im.paste(room,(27,140));text(im,'Garden Suite',402,34)
  text(im,'12–14 Sep · 2 guests',456,23,grey)
  if t<6:
   button(im,'Choose room',556,t>4.5)
  else:
   text(im,'Two nights',510,22,grey)
   button(im,'Confirm room',575,t>9.3)
 elif stage==2:
  k=ease(t/.65);d.ellipse((127,184,273,330),outline='#61d2a7',width=4)
  if k>.15:
   points=[(155,257),(186,286),(248,223)]
   d.line(points,fill='#61d2a7',width=7)
  text(im,'Room confirmed',376,34)
  text(im,'Garden Suite',453,27,gold)
  text(im,'12–14 Sep · 2 guests',501,23,grey)
  text(im,'Stay #1042',566,23,grey)
 elif stage==3:
  d.rounded_rectangle((22,166,378,453),23,fill='#19342c',outline='#345749',width=2)
  text(im,'Stay #1042',195,23,grey)
  text(im,'Garden Suite',247,33)
  text(im,'12–14 September',305,24,grey)
  text(im,'Confirmed',379,29,'#65d8ad')
  text(im,'Booking recorded',529,25,gold)
 elif stage==4:
  if t<2.3:
   bubble(im,['Can you help with','an early check-in?'],170,True)
   if t>1:bubble(im,['Connecting you','with the team.'],306)
  else:
   d.rounded_rectangle((22,141,378,229),16,fill='#3f3421')
   text(im,'Human needed',157,25,gold)
   text(im,'Stay #1042 · Garden Suite',195,20)
   bubble(im,['Can you help with','an early check-in?'],283,True)
   bubble(im,['12–14 Sep · 2 guests','Conversation included'],420)
   d.rounded_rectangle((22,593,378,658),13,outline='#435164',width=2)
   text(im,'Write a reply…',612,23,grey,x=40)
 else:
  text(im,'AI Business',210,40);text(im,'Bot Family',264,40)
  text(im,'aifrogi.com',395,32,gold)
  text(im,'+91-7410582898',475,29)
  text(im,'info@aifrogi.com',532,25,grey)
 return im
def background(t):
 im=Image.new('RGB',(720,1280),'#080b10');d=ImageDraw.Draw(im)
 # Subtle moving gold atmosphere; one continuous camera.
 for j in range(6):
  x=360+int(285*math.sin(t*.07+j));y=690+int(430*math.cos(t*.08+j))
  d.arc((x-140,y-220,x+140,y+220),20,110,fill='#242221',width=1)
 return im
def phone(scr,t):
 p=Image.new('RGBA',(442,810),(0,0,0,0));d=ImageDraw.Draw(p)
 d.rounded_rectangle((1,1,440,809),55,fill='#37332e',outline='#c4ad76',width=3)
 d.rounded_rectangle((9,9,432,801),48,fill='#05090e',outline='#676158',width=2)
 mask=Image.new('L',(400,760),0);ImageDraw.Draw(mask).rounded_rectangle((0,0,399,759),36,fill=255)
 p.paste(scr,(21,25),mask)
 d.rounded_rectangle((186,37,256,54),9,fill='#030405')
 d.rounded_rectangle((157,774,285,778),2,fill='#777c83')
 return p
cuts=[3,7,18,25,31,39]
captions=['Every enquiry matters.','Choose your stay.','Room confirmed.','Clear insights.','Human help.','Less waiting.']
out=subprocess.Popen(['ffmpeg','-y','-v','error','-f','rawvideo','-pix_fmt','rgb24','-s','720x1280','-r','30','-i','-','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','picture.mp4'],stdin=subprocess.PIPE)
samples=[]
for frame in range(1350):
 t=frame/30;im=background(t).convert('RGBA')
 if t<3:
  k=ease(t/1.3);l=logo.copy();l.thumbnail((330,135));im.alpha_composite(l,((720-l.width)//2,280))
  text(im,'AI Business',527,48,gold);text(im,'Bot Family',588,48,gold)
  text(im,'+91-7410582898',828,34);text(im,'aifrogi.com',884,29,grey)
 else:
  stage=max(i for i,c in enumerate(cuts) if c<=t);local=t-cuts[stage]
  scr=screen(stage,local)
  # Screen content slides within the same phone; the shell stays in place.
  if stage>0 and local<.55:
   old=screen(stage-1,cuts[stage]-cuts[stage-1]);offset=int(400*ease(local/.55))
   mix=Image.new('RGB',(400,760),'#0c131d');mix.paste(old,(-offset,0));mix.paste(scr,(400-offset,0));scr=mix
  p=phone(scr,t)
  intro=ease((t-3)/.7);ending=ease((t-39)/1.2) if stage==5 else 0
  scale=(.94+.035*math.sin((t-3)/36*math.pi))*(.94+.06*intro)*(1-.09*ending)
  p=p.resize((int(442*scale),int(810*scale)),Image.Resampling.LANCZOS)
  y=220+int(55*(1-intro))+int(22*ending)
  im.alpha_composite(p,((720-p.width)//2,y))
  l=logo.copy();l.thumbnail((180,75));im.alpha_composite(l,((720-l.width)//2,83))
  text(im,captions[stage],1102,42)
  if stage==5:text(im,'Start your 15-day trial',1164,25,gold)
 if frame in [0,150,360,630,840,1050,1260]:
  samples.append(im.convert('RGB').resize((240,426)))
 out.stdin.write(im.convert('RGB').tobytes())
out.stdin.close();assert out.wait()==0
run(['ffmpeg','-y','-v','error','-i','picture.mp4','-i','music.mp4','-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-af','afade=t=out:st=43:d=2','-t','45','-movflags','+faststart','journey.mp4'])
sheet=Image.new('RGB',(960,852),'#080b10')
for j,im in enumerate(samples):sheet.paste(im,((j%4)*240,(j//4)*426))
sheet.save('review.jpg',quality=94)
print(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration,size','-of','json','journey.mp4']).decode(),flush=True)
for name,u in zip(['journey.mp4','review.jpg'],C['uploads']):
 result=subprocess.check_output(['curl','-fsS','-w','%{http_code}','-X','PUT','-H','Content-Type: '+u['content_type'],'--upload-file',name,u['upload_url']]).decode()
 assert result.endswith('200'),result
 print('UPLOADED '+u['media_id']+' HTTP '+result,flush=True)
