// Original, low-volume ambient motif. No audio downloads, tracking or voice synthesis.
export class ExperienceMusic {
  private master: GainNode;
  private bed: GainNode;
  private timer: ReturnType<typeof setInterval> | null = null;
  private chord = 0;
  private disposed = false;
  constructor(private context: AudioContext) {
    this.master = context.createGain(); this.master.gain.value = 0;
    this.master.connect(context.destination);
    this.bed = context.createGain(); this.bed.gain.value = 0; this.bed.connect(this.master);
  }
  async unlock() {await this.context.resume();}
  mute(muted: boolean) {
    if(this.disposed)return;
    const now=this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value,now);
    this.master.gain.linearRampToValueAtTime(muted?0:0.16,now+0.08);
  }
  private tone(frequency:number, start:number, duration:number, level:number, output:GainNode) {
    const oscillator=this.context.createOscillator(), envelope=this.context.createGain();
    oscillator.type='sine';oscillator.frequency.value=frequency;
    envelope.gain.setValueAtTime(0,start);
    envelope.gain.linearRampToValueAtTime(level,start+Math.min(.3,duration/5));
    envelope.gain.exponentialRampToValueAtTime(.0001,start+duration);
    oscillator.connect(envelope);envelope.connect(output);
    oscillator.onended=()=>{oscillator.disconnect();envelope.disconnect();};
    oscillator.start(start);oscillator.stop(start+duration+.02);
  }
  private phrase() {
    if(this.disposed)return;
    const chords=[[196,246.94,369.99],[164.81,246.94,329.63],[174.61,261.63,349.23],[146.83,220,329.63]];
    const notes=chords[this.chord++%chords.length],now=this.context.currentTime;
    notes.forEach((frequency,index)=>this.tone(frequency,now+index*.16,3.1,.12,this.bed));
  }
  setPlaying(playing:boolean) {
    if(this.disposed)return;
    if(this.timer){clearInterval(this.timer);this.timer=null;}
    const now=this.context.currentTime;
    this.bed.gain.cancelScheduledValues(now);
    this.bed.gain.setValueAtTime(this.bed.gain.value,now);
    this.bed.gain.linearRampToValueAtTime(playing?1:0,now+.15);
    if(playing){this.phrase();this.timer=setInterval(()=>this.phrase(),2800);}
  }
  transition() {
    if(this.disposed)return;
    const now=this.context.currentTime;
    this.tone(659.25,now,.32,.1,this.master);
    this.tone(987.77,now+.08,.42,.06,this.master);
  }
  dispose() {
    this.disposed=true;if(this.timer)clearInterval(this.timer);this.timer=null;
    void this.context.close().catch(()=>{});
  }
}
