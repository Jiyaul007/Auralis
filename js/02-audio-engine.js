'use strict';
/* Web Audio engine: voices, decks, EQ, crossfade */
/* ===================== AUDIO ENGINE ===================== */
const EQ_FREQ=[31,62,125,250,500,1000,2000,4000,8000,16000];
const EQ_LABEL=['31','62','125','250','500','1k','2k','4k','8k','16k'];
const EQ_PRESETS={Flat:[0,0,0,0,0,0,0,0,0,0],'Bass Boost':[6,5,4,2,0,0,0,0,0,0],Vocal:[-2,-2,-1,1,3,4,4,2,0,-1],Electronic:[5,4,1,0,-2,2,1,3,5,5],Acoustic:[4,3,2,1,2,2,3,3,3,2]};
const QUALITY={low:{label:'Low · 96 kbps',lp:7000},normal:{label:'Normal · 160 kbps',lp:11500},high:{label:'High · 320 kbps',lp:18000},lossless:{label:'Lossless',lp:22000}};
const mtof=m=>440*Math.pow(2,(m-69)/12);
const deg2m=(rec,deg,base)=>{const sc=rec.scale,n=sc.length;return base+12*Math.floor(deg/n)+sc[((deg%n)+n)%n]};

const Voices={
 kick(c,out,t,v){const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(40,t+.14);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.95*v,t+.004);g.gain.exponentialRampToValueAtTime(.001,t+.34);o.connect(g);g.connect(out);o.start(t);o.stop(t+.36)},
 noise(c,buf,t,dur){const s=c.createBufferSource();s.buffer=buf;s.start(t,Math.random()*.6,dur);return s},
 snare(c,out,t,v,buf){const n=Voices.noise(c,buf,t,.2),f=c.createBiquadFilter(),g=c.createGain();f.type='bandpass';f.frequency.value=2000;f.Q.value=.7;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.5*v,t+.003);g.gain.exponentialRampToValueAtTime(.001,t+.18);n.connect(f);f.connect(g);g.connect(out);
  const o=c.createOscillator(),og=c.createGain();o.type='triangle';o.frequency.setValueAtTime(220,t);o.frequency.exponentialRampToValueAtTime(120,t+.08);og.gain.setValueAtTime(.3*v,t);og.gain.exponentialRampToValueAtTime(.001,t+.12);o.connect(og);og.connect(out);o.start(t);o.stop(t+.14)},
 hat(c,out,t,v,buf){const n=Voices.noise(c,buf,t,.07),f=c.createBiquadFilter(),g=c.createGain();f.type='highpass';f.frequency.value=7500;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.2*v,t+.002);g.gain.exponentialRampToValueAtTime(.001,t+.055);n.connect(f);f.connect(g);g.connect(out)},
 bass(c,out,t,f,dur,type){const o=c.createOscillator(),fl=c.createBiquadFilter(),g=c.createGain();dur=Math.max(.12,dur);o.type=type;o.frequency.value=f;fl.type='lowpass';fl.Q.value=4;fl.frequency.setValueAtTime(900,t);fl.frequency.exponentialRampToValueAtTime(220,t+dur);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.34,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(fl);fl.connect(g);g.connect(out);o.start(t);o.stop(t+dur+.05)},
 pad(c,out,t,f,dur,type,vol,lp){const g=c.createGain(),fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=lp;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+Math.min(.5,dur*.3));g.gain.setValueAtTime(vol,t+dur*.75);g.gain.exponentialRampToValueAtTime(.0008,t+dur+.4);
  [-7,7].forEach(dt=>{const o=c.createOscillator();o.type=type;o.frequency.value=f;o.detune.value=dt;o.connect(fl);o.start(t);o.stop(t+dur+.45)});fl.connect(g);g.connect(out)},
 lead(c,out,t,f,dur,type,vol,lp,sup){dur=Math.max(.08,dur);const g=c.createGain(),fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.setValueAtTime(lp,t);fl.frequency.exponentialRampToValueAtTime(Math.max(300,lp*.35),t+dur);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+.008);g.gain.exponentialRampToValueAtTime(.0008,t+dur);
  (sup?[-12,0,12]:[0]).forEach(d=>{const o=c.createOscillator();o.type=type;o.frequency.value=f;o.detune.value=d;o.connect(fl);o.start(t);o.stop(t+dur+.05)});fl.connect(g);g.connect(out)},
 murmur(c,out,t,f0,r,buf){const o=c.createOscillator(),env=c.createGain(),dur=.12+r()*.1;o.type='sawtooth';o.frequency.setValueAtTime(f0*(1+(r()-.5)*.25),t);o.frequency.linearRampToValueAtTime(f0*(.9+r()*.2),t+dur);
  env.gain.setValueAtTime(.0001,t);env.gain.linearRampToValueAtTime(.11,t+.03);env.gain.exponentialRampToValueAtTime(.001,t+dur);
  [[450+r()*350,1],[1200+r()*1000,.6]].forEach(([fr,gn])=>{const b=c.createBiquadFilter(),g=c.createGain();b.type='bandpass';b.frequency.value=fr;b.Q.value=6;g.gain.value=gn;o.connect(b);b.connect(g);g.connect(env)});
  env.connect(out);o.start(t);o.stop(t+dur+.03)}
};

function stepVoices(eng,deck,n,t){
 const rec=deck.rec,c=eng.ctx,bus=deck.bus;
 if(rec.kind==='pod'){
  const r=rng(deck.track.id+':'+n),ph=n%28;
  if(n%64===0)Voices.pad(c,bus,t,mtof(45+(hash(deck.track.id)%5)),12.8/eng.speed,'sine',.018,700);
  if(ph<20&&r()<.78)Voices.murmur(c,bus,t,rec.f0,r,eng.noise);
  return;
 }
 const cfg=GEN[rec.gen],sdur=deck.stepDur/eng.speed;
 const s=n%16,bar=Math.floor(n/16),cyc=Math.floor(bar/16),sec=Math.floor(bar/4)%4;
 const when=t+(s%2?cfg.sw*sdur:0),chord=rec.prog[(bar+cyc)%4];
 if(s===0){const tones=rec.seventh?[0,2,4,6]:[0,2,4];tones.forEach(o=>Voices.pad(c,bus,when,mtof(deg2m(rec,chord+o,rec.base+24)),sdur*16,cfg.pw,sec===3?.04:.052,cfg.lp*.5))}
 const drums=rec.gen!=='ambient';
 if(drums&&sec>=1){if(cfg.k.includes(s))Voices.kick(c,bus,when,rec.gen==='lofi'?.75:1);if(cfg.s.includes(s))Voices.snare(c,bus,when,rec.gen==='lofi'?.7:1,eng.noise)}
 if(drums&&cfg.h.includes(s)&&(sec>=1||rec.gen==='techno'))Voices.hat(c,bus,when,s%4===2?1:.6,eng.noise);
 if(sec>=1&&cfg.bass.includes(s))Voices.bass(c,bus,when,mtof(deg2m(rec,chord,rec.base)),sdur*(cfg.bass.length>8?1.5:3.4),cfg.bw);
 else if(rec.gen==='ambient'&&s===0&&bar%2===0)Voices.bass(c,bus,when,mtof(deg2m(rec,chord,rec.base)),sdur*30,'sine');
 if(sec!==1&&s%cfg.arp===0){const idx=Math.floor(n/cfg.arp)%rec.arp.length;Voices.lead(c,bus,when,mtof(deg2m(rec,chord+rec.arp[idx],rec.base+36)),sdur*cfg.arp*.9,rec.gen==='acoustic'?'triangle':'sine'===cfg.lw?'sine':'triangle',(sec===0?.03:.05),cfg.lp,false)}
 if(sec>=2){const d=rec.mel[(bar%4)*16+s];if(d>=0)Voices.lead(c,bus,when,mtof(deg2m(rec,d,rec.base+24+(cyc%2?12:0))),sdur*rec.grid*1.8,rec.lw,.075,cfg.lp,!!cfg.sup)}
}

class Deck{
 constructor(eng){this.eng=eng;const c=eng.ctx;this.out=c.createGain();this.out.gain.value=0;this.out.connect(eng.eqIn);this.bus=null;this.timer=null;this.haltT=null;this.track=null;this.rec=null;this.stepDur=.15;this.anchorCtx=0;this.anchorSong=0;this.nextStep=0;this.running=false}
 newBus(){const c=this.eng.ctx,old=this.bus;if(old){const t=c.currentTime;old.gain.cancelScheduledValues(t);old.gain.setValueAtTime(old.gain.value,t);old.gain.linearRampToValueAtTime(0,t+.04);setTimeout(()=>{try{old.disconnect()}catch(e){}},500)}const b=c.createGain();b.connect(this.out);this.bus=b}
 start(track,offset){clearTimeout(this.haltT);this.track=track;this.rec=track.recipe;this.stepDur=this.rec.kind==='pod'?.2:60/this.rec.bpm/4;this.jump(offset);if(!this.timer)this.timer=setInterval(()=>this.tick(),50);this.running=true;this.tick()}
 jump(pos){const c=this.eng.ctx;this.newBus();this.anchorCtx=c.currentTime+.04;this.anchorSong=pos;this.nextStep=Math.ceil(pos/this.stepDur-1e-6)}
 time(){if(!this.track)return 0;return this.anchorSong+Math.max(0,this.eng.ctx.currentTime-this.anchorCtx)*this.eng.speed}
 tick(){if(!this.track||!this.bus)return;const eng=this.eng,now=eng.ctx.currentTime,hz=now+.35,dur=this.track.duration;
  for(let g=0;g<64;g++){const st=this.nextStep*this.stepDur;if(st>=dur)break;const when=this.anchorCtx+(st-this.anchorSong)/eng.speed;if(when>hz)break;if(when>=now-.01)stepVoices(eng,this,this.nextStep,Math.max(when,now));this.nextStep++}}
 fade(to,sec){const g=this.out.gain,t=this.eng.ctx.currentTime;g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(to,t+Math.max(.005,sec))}
 halt(sec=.25){if(!this.running&&!this.timer)return;this.fade(0,sec);clearTimeout(this.haltT);this.haltT=setTimeout(()=>{clearInterval(this.timer);this.timer=null;this.running=false},sec*1000+60)}
}

class AudioEngine{
 constructor(){this.ctx=null;this.decks=[];this.active=0;this.speed=1;this.volume=.8;this.muted=false;this.track=null;this.playing=false;this.pausedPos=0;this.xfading=false;this.fadedOut=false;this.ok=true;this.eqGains=EQ_PRESETS.Flat.slice();this.lp=18000;this.xT=null}
 ensure(){
  if(!this.ctx){try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw new Error('no audio');this.ctx=new AC({latencyHint:'interactive'});this.build()}catch(e){this.ok=false;this.ctx=null;return false}}
  if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});
  return true;
 }
 build(){
  const c=this.ctx;this.eqIn=c.createGain();let prev=this.eqIn;
  this.filters=EQ_FREQ.map((f,i)=>{const b=c.createBiquadFilter();b.type=i===0?'lowshelf':i===9?'highshelf':'peaking';b.frequency.value=f;b.Q.value=1.1;b.gain.value=this.eqGains[i]||0;prev.connect(b);prev=b;return b});
  this.comp=c.createDynamicsCompressor();this.comp.threshold.value=-14;this.comp.knee.value=18;this.comp.ratio.value=4;this.comp.attack.value=.01;this.comp.release.value=.2;prev.connect(this.comp);
  this.qlp=c.createBiquadFilter();this.qlp.type='lowpass';this.qlp.frequency.value=this.lp;this.comp.connect(this.qlp);
  this.master=c.createGain();this.qlp.connect(this.master);
  this.analyser=c.createAnalyser();this.analyser.fftSize=2048;this.analyser.smoothingTimeConstant=.82;this.master.connect(this.analyser);this.analyser.connect(c.destination);
  const nb=c.createBuffer(1,c.sampleRate,c.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;this.noise=nb;
  this.decks=[new Deck(this),new Deck(this)];this.master.gain.value=this.muted?0:Math.pow(this.volume,2);
 }
 deck(){return this.decks[this.active]}
 pos(){return this.playing&&this.ctx&&this.deck()&&this.deck().track?this.deck().time():this.pausedPos}
 applyVolume(){if(!this.ctx)return;this.master.gain.setTargetAtTime(this.muted?0:Math.pow(this.volume,2),this.ctx.currentTime,.02)}
 setVolume(v){this.volume=v;this.applyVolume()}
 setMuted(m){this.muted=m;this.applyVolume()}
 setEQ(g){this.eqGains=g.slice();if(!this.ctx)return;g.forEach((v,i)=>this.filters[i].gain.setTargetAtTime(v,this.ctx.currentTime,.03))}
 setQuality(lp){this.lp=lp;if(this.ctx)this.qlp.frequency.setTargetAtTime(lp,this.ctx.currentTime,.05)}
 setSpeed(s){const p=this.pos();this.speed=s;if(this.ctx&&this.playing)this.deck().jump(p)}
 cancelXf(){clearTimeout(this.xT);this.xfading=false}
 play(track,offset=0,fade=.12){
  if(!this.ensure())return false;this.cancelXf();
  const cur=this.deck(),nxt=this.decks[1-this.active];
  if(cur.track)cur.halt(fade);
  nxt.start(track,offset);nxt.fade(1,fade);
  this.active=1-this.active;this.track=track;this.playing=true;this.fadedOut=false;this.pausedPos=offset;return true;
 }
 pause(){if(!this.playing)return;this.pausedPos=this.deck().time();this.playing=false;this.cancelXf();this.decks.forEach(d=>d.halt(.22))}
 resume(){if(!this.track)return false;return this.play(this.track,this.pausedPos,.2)}
 stop(){this.playing=false;this.cancelXf();this.decks.forEach(d=>d.halt(.1));this.pausedPos=0}
 seek(t){if(this.playing&&this.ctx){const d=this.deck();d.jump(t);if(this.fadedOut){d.fade(1,.05);this.fadedOut=false}}else this.pausedPos=t}
 crossfadeTo(track,cf){
  if(!this.playing||!this.ensure())return false;
  const cur=this.deck(),nxt=this.decks[1-this.active];
  nxt.start(track,0);nxt.fade(1,cf);cur.halt(cf);
  this.active=1-this.active;this.track=track;this.xfading=true;this.fadedOut=false;clearTimeout(this.xT);this.xT=setTimeout(()=>{this.xfading=false},cf*1000);return true;
 }
 fadeOut(sec){if(this.fadedOut||!this.playing||!this.ctx)return;this.fadedOut=true;this.deck().fade(0,sec)}
}
const engine=new AudioEngine();
