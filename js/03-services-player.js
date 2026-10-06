'use strict';
/* Recommender, library/playlist helpers, player controller, downloads, listen-together */
/* ===================== SERVICES ===================== */
const Theme={hue:262,set(t){this.hue=t?t.hue:262;document.documentElement.style.setProperty('--tint',`hsl(${Math.round(this.hue)} 70% 44%)`)},
 accent(c){const r=document.documentElement.style;r.setProperty('--accent',c);const n=parseInt(c.slice(1),16),R=n>>16,G=n>>8&255,B=n&255,L=(.299*R+.587*G+.114*B)/255;r.setProperty('--accent-ink',L>.55?'#0b0a14':'#ffffff')}};
const Motion={on:true,mq:window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)'):{matches:false,addEventListener(){}},
 apply(){this.on=Store.get().settings.anim&&!this.mq.matches;document.body.classList.toggle('no-anim',!this.on)}};
const Toast={show(msg,o={}){const host=$('#toasts');if(!host)return;while(host.children.length>=3)host.firstChild.remove();
  const el=document.createElement('div');el.className='toast glass'+(o.kind==='error'?' err':'');el.setAttribute('role','status');
  el.innerHTML=`<span>${esc(msg)}</span>${o.action?`<button class="toast-act" type="button">${esc(o.action)}</button>`:''}`;
  host.appendChild(el);let done=false;const kill=()=>{if(done)return;done=true;el.classList.add('out');setTimeout(()=>el.remove(),250)};
  if(o.action)$('.toast-act',el).addEventListener('click',()=>{try{o.fn&&o.fn()}finally{kill()}});
  setTimeout(kill,o.ms||(o.action?6000:3200))}};
const Loop={fns:[],running:false,id:0,add(fn){this.fns.push(fn)},
 start(){if(this.running)return;this.running=true;const f=t=>{if(!this.running)return;for(const fn of this.fns){try{fn(t)}catch(e){console.error(e)}}this.id=requestAnimationFrame(f)};this.id=requestAnimationFrame(f)},
 stop(){this.running=false;cancelAnimationFrame(this.id)}};
const Reveal={io:null,init(root){this.kill();const els=$$('.reveal',root);if(!Motion.on||!('IntersectionObserver' in window)){els.forEach(e=>e.classList.add('in'));return}
  this.io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');this.io.unobserve(e.target)}}),{root:$('#main'),rootMargin:'0px 0px -6% 0px',threshold:.05});els.forEach(e=>this.io.observe(e))},
 kill(){if(this.io){this.io.disconnect();this.io=null}}};

/* ---- Recommender ---- */
const Rec={_k:'',_c:null,
 profile(){const s=Store.get(),gw={},aw={},mw={};let bs=0,bn=0;const add=(m,k,v)=>{m[k]=(m[k]||0)+v};
  s.profile.seeds.genres.forEach(g=>add(gw,g,3));
  s.profile.seeds.artists.forEach(a=>{add(aw,a,3);const ar=CAT.artists[a];if(ar){add(gw,ar.genres[0],1.5);add(gw,ar.genres[1],.7)}});
  s.likes.forEach(id=>{const t=CAT.tmap[id];if(!t)return;add(gw,t.genre,2);add(aw,t.artistId,1.5);add(mw,t.mood,1);bs+=t.bpm;bn++});
  const h=s.history.slice(-300);h.forEach((x,i)=>{const t=CAT.tmap[x.id];if(!t)return;const w=(.4+.6*Math.min(1,x.sec/t.duration))*(.5+.5*i/h.length);add(gw,t.genre,w);add(aw,t.artistId,w*.8);add(mw,t.mood,w*.6);bs+=t.bpm*w;bn+=w});
  const norm=m=>{const mx=Math.max(0,...Object.values(m));if(mx>0)for(const k in m)m[k]/=mx;return m};
  return{gw:norm(gw),aw:norm(aw),mw:norm(mw),bpm:bn?bs/bn:null,heard:new Set(s.history.map(x=>x.id)),likes:new Set(s.likes)}},
 score(t,p){const dr=rng(dayKey()+t.id)();let s=(p.gw[t.genre]||0)+.9*(p.aw[t.artistId]||0)+.5*(p.mw[t.mood]||0);if(p.bpm)s+=.8*Math.exp(-Math.pow((t.bpm-p.bpm)/28,2));return s+dr*.4},
 build(){const s=Store.get(),sig=[s.likes.length,s.history.length,JSON.stringify(s.profile.seeds),dayKey()].join('|');if(this._k===sig&&this._c)return this._c;
  const p=this.profile(),scored=CAT.tracks.map(t=>({t,s:this.score(t,p)})).sort((a,b)=>b.s-a.s);
  let gs=Object.entries(p.gw).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);const dr=rng('daily'+dayKey());
  GENRES.map(g=>g.id).sort(()=>dr()-.5).forEach(g=>{if(!gs.includes(g))gs.push(g)});gs=gs.slice(0,3);
  const mixes=gs.map((g,i)=>{const ids=scored.map(x=>({t:x.t,s:x.s+(x.t.genre===g?1.6:0)})).sort((a,b)=>b.s-a.s).slice(0,22).map(x=>x.t.id);
   const names=[...new Set(ids.slice(0,6).map(id=>artistName(CAT.tmap[id])))].slice(0,3);
   return{id:'daily'+(i+1),name:'Daily Mix '+(i+1),genre:g,hue:GMAP[g].hue,ids,desc:`${GMAP[g].name} with ${names.join(', ')} and more`}});
  let disc=scored.filter(x=>!p.heard.has(x.t.id)&&!p.likes.has(x.t.id)).slice(0,22).map(x=>x.t.id);
  if(disc.length<10)disc=scored.slice(0,22).map(x=>x.t.id);
  const discover={id:'discover',name:'Discover Mix',genre:null,hue:(GMAP[gs[0]].hue+140)%360,ids:disc,desc:'Fresh picks matched to your taste, tempo and mood'};
  this._k=sig;this._c={mixes,discover,all:[...mixes,discover]};return this._c},
 dailyMixes(){return this.build().mixes},discover(){return this.build().discover},mix(id){return this.build().all.find(m=>m.id===id)||null},
 similarArtists(id){const a=CAT.artists[id];return CAT.artistList.filter(x=>x.id!==id).map(x=>({x,s:x.genres.filter(g=>a.genres.includes(g)).length*2+(x.genres[0]===a.genres[0]?1:0)+rng(id+x.id)()*.5})).sort((p,q)=>q.s-p.s).slice(0,6).map(o=>o.x)},
 suggest(exclude,n=8){const p=this.profile(),ex=new Set(exclude);return CAT.tracks.filter(t=>!ex.has(t.id)).map(t=>({t,s:this.score(t,p)})).sort((a,b)=>b.s-a.s).slice(0,n).map(x=>x.t)}
};

/* ---- Library helpers (likes, follows, saves) ---- */
const Lib={
 isLiked:id=>Store.get().likes.includes(id),
 toggleLike(id){const s=Store.get(),on=s.likes.includes(id),t=T(id);
  if(on){const prev=s.likes.slice();Store.set({likes:s.likes.filter(x=>x!==id)});Toast.show('Removed from Liked Songs',{action:'Undo',fn:()=>{Store.set({likes:prev});UI.syncLikes()}})}
  else{Store.set({likes:[id,...s.likes]});Toast.show(`Added “${t?t.title:''}” to Liked Songs`)}
  UI.syncLikes();return!on},
 isSaved:id=>Store.get().savedAlbums.some(x=>x.id===id),
 toggleAlbum(id){const s=Store.get();if(Lib.isSaved(id)){Store.set({savedAlbums:s.savedAlbums.filter(x=>x.id!==id)});Toast.show('Removed from your library')}else{Store.set({savedAlbums:[{id,ts:Date.now()},...s.savedAlbums]});Toast.show('Saved to your library')}},
 isFollowing:id=>Store.get().followed.some(x=>x.id===id),
 toggleFollow(id){const s=Store.get();if(Lib.isFollowing(id)){Store.set({followed:s.followed.filter(x=>x.id!==id)});Toast.show('Unfollowed '+A(id).name)}else{Store.set({followed:[{id,ts:Date.now()},...s.followed]});Toast.show('Following '+A(id).name)}},
 isShowFollowed:id=>Store.get().podcast.followed.includes(id),
 toggleShow(id){const s=Store.get(),p=s.podcast,on=p.followed.includes(id);Store.set({podcast:{...p,followed:on?p.followed.filter(x=>x!==id):[...p.followed,id]}});Toast.show(on?'Unfollowed show':'Following '+SHOWS[id].name)}
};
const PL={
 get:id=>Store.get().playlists.find(p=>p.id===id)||null,
 create(name,ids=[]){const now=Date.now(),n=Store.get().playlists.length+1,p={id:uid('pl'),name:(name||'').trim()||'My playlist #'+n,tracks:ids.slice(),created:now,updated:now,public:true,collab:false,seed:uid('c')};Store.set({playlists:[p,...Store.get().playlists]});return p},
 update(id,fn){Store.set({playlists:Store.get().playlists.map(p=>p.id===id?Object.assign(fn({...p,tracks:p.tracks.slice()})||p,{updated:Date.now()}):p)})},
 rename(id,name){name=(name||'').trim();if(!name)return;PL.update(id,p=>{p.name=name;return p})},
 add(id,ids){const p=PL.get(id);if(!p)return 0;const fresh=ids.filter(x=>!p.tracks.includes(x));if(!fresh.length){Toast.show('Already in “'+p.name+'”');return 0}PL.update(id,q=>{q.tracks=[...q.tracks,...fresh];return q});Toast.show(`Added ${fresh.length>1?fresh.length+' songs':'1 song'} to “${p.name}”`);return fresh.length},
 remove(id,idx){const p=PL.get(id);if(!p)return;const prev=p.tracks.slice();PL.update(id,q=>{q.tracks.splice(idx,1);return q});Toast.show('Removed from playlist',{action:'Undo',fn:()=>PL.update(id,q=>{q.tracks=prev;return q})})},
 reorder(id,from,to){PL.update(id,q=>{if(from<0||from>=q.tracks.length)return q;const[x]=q.tracks.splice(from,1);q.tracks.splice(clamp(to,0,q.tracks.length),0,x);return q})},
 del(id){const s=Store.get(),p=PL.get(id);if(!p)return;const prev=s.playlists.slice();Store.set({playlists:s.playlists.filter(x=>x.id!==id)});if(location.hash.includes(id))location.hash='#/library';Toast.show(`Deleted “${p.name}”`,{action:'Undo',fn:()=>{Store.set({playlists:prev})}})},
 duplicate(id){const p=PL.get(id);if(!p)return;const n=PL.create('Copy of '+p.name,p.tracks);Toast.show('Playlist duplicated');return n},
 toggle(id,key){PL.update(id,p=>{p[key]=!p[key];return p})},
 regen(id){PL.update(id,p=>{p.seed=uid('c');return p})}
};

/* ---- Media Session + keep-alive element ---- */
const MediaSess={ok:'mediaSession' in navigator,last:0,audio:null,
 init(){if(!this.ok)return;const h=(a,f)=>{try{navigator.mediaSession.setActionHandler(a,f)}catch(e){}};
  h('play',()=>{if(!engine.playing)Player.toggle()});h('pause',()=>{if(engine.playing)Player.toggle()});h('previoustrack',()=>Player.prev());h('nexttrack',()=>Player.next());
  h('seekto',d=>Player.seek(d.seekTime||0));h('seekbackward',d=>Player.seek(engine.pos()-(d.seekOffset||10)));h('seekforward',d=>Player.seek(engine.pos()+(d.seekOffset||10)))},
 meta(t){if(!this.ok||!t)return;try{navigator.mediaSession.metadata=new MediaMetadata({title:t.title,artist:artistName(t),album:albumTitle(t),artwork:[{src:trackCover(t,256),sizes:'256x256',type:'image/jpeg'}]})}catch(e){}},
 state(){if(!this.ok)return;try{navigator.mediaSession.playbackState=engine.playing?'playing':'paused'}catch(e){}
  try{if(!this.audio){const sr=8000,n=sr,b=new Uint8Array(44+n),dv=new DataView(b.buffer),w=(o,s)=>{for(let i=0;i<s.length;i++)b[o+i]=s.charCodeAt(i)};w(0,'RIFF');dv.setUint32(4,36+n,true);w(8,'WAVEfmt ');dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,1,true);dv.setUint32(24,sr,true);dv.setUint32(28,sr,true);dv.setUint16(32,1,true);dv.setUint16(34,8,true);w(36,'data');dv.setUint32(40,n,true);b.fill(128,44);
    let bin='';for(let i=0;i<b.length;i++)bin+=String.fromCharCode(b[i]);this.audio=new Audio('data:audio/wav;base64,'+btoa(bin));this.audio.loop=true}
   if(engine.playing)this.audio.play().catch(()=>{});else this.audio.pause()}catch(e){}},
 pos(t,pos){if(!this.ok)return;const n=Date.now();if(n-this.last<1000)return;this.last=n;try{navigator.mediaSession.setPositionState({duration:t.duration,position:clamp(pos,0,t.duration),playbackRate:engine.speed})}catch(e){}}
};

/* ---- Player controller ---- */
const Player={session:null,lastTick:performance.now(),lastSave:0,sleepT:null,
 get track(){const id=Store.get().currentId;return id?T(id):null},
 init(){const s=Store.get();engine.setVolume(s.volume);engine.setMuted(s.muted);engine.setEQ(s.eq.gains);engine.setQuality(QUALITY[s.settings.quality].lp);engine.speed=s.speed;
  const t=this.track;if(t){engine.track=t;engine.pausedPos=clamp(s.position||0,0,t.duration-1);Theme.set(t);MediaSess.meta(t)}
  MediaSess.init();setInterval(()=>this.tick(),250)},
 loadList(ids,index=0){const s=Store.get();let q=ids.slice(),idx=clamp(index,0,q.length-1);if(!q.length)return;
  if(s.shuffle){const cur=q[idx],rest=q.filter((_,i)=>i!==idx);shuffleArr(rest);Store.set({origQueue:ids.slice()});q=[cur,...rest];idx=0}else Store.set({origQueue:null});
  Store.set({queue:q});this.playIndex(idx)},
 playList(ids,{shuffle=false}={}){if(!ids.length)return;if(shuffle){Store.set({shuffle:true});this.loadList(ids,Math.floor(Math.random()*ids.length))}else this.loadList(ids,0)},
 playIndex(i,{offset,xfade=false}={}){const s=Store.get(),id=s.queue[i],t=T(id);if(!t)return;this.commit();
  let off=offset;if(off===undefined){off=0;if(t.kind==='ep'){const p=s.podcast.progress[t.id]||0;if(p>5&&p<t.duration-10)off=p}}
  const cf=Math.max(.5,s.crossfade);const ok=xfade?engine.crossfadeTo(t,cf):engine.play(t,off);
  if(!ok){Toast.show('Audio isn’t available in this browser.',{kind:'error'});return}
  Store.set({qIndex:i,currentId:id,position:off,recent:[id,...s.recent.filter(x=>x!==id)].slice(0,30),_playing:true});
  Theme.set(t);this.session={id,sec:0};MediaSess.meta(t);MediaSess.state();UI.syncPlay();Together.sync()},
 toggle(){const s=Store.get();
  if(!s.currentId){const m=Rec.dailyMixes()[0];this.loadList(m.ids,0);return}
  if(!engine.ensure()){Toast.show('Audio isn’t available in this browser.',{kind:'error'});return}
  if(engine.playing){engine.pause();Store.set({_playing:false});Store.set({position:engine.pausedPos},{silent:true});this.saveProgress(engine.pausedPos)}
  else{const t=this.track;if(!t)return;if(!engine.track||engine.track.id!==t.id){engine.track=t;engine.pausedPos=s.position||0}
   if(engine.pausedPos>=t.duration-.5)engine.pausedPos=0;engine.resume();Store.set({_playing:true});if(!this.session)this.session={id:t.id,sec:0}}
  MediaSess.state();UI.syncPlay();Together.sync()},
 nextIndex(user){const s=Store.get(),n=s.queue.length;if(!n)return null;if(s.repeat==='one'&&!user)return s.qIndex;const i=s.qIndex+1;if(i<n)return i;if(s.repeat==='all')return 0;return null},
 next(){const i=this.nextIndex(true);if(i===null){this.finish();return}this.playIndex(i)},
 prev(){const s=Store.get(),n=s.queue.length;if(!n||engine.pos()>3||(s.qIndex<=0&&s.repeat!=='all')){this.seek(0);return}this.playIndex(s.qIndex>0?s.qIndex-1:n-1)},
 finish(){this.commit();engine.pause();engine.pausedPos=0;Store.set({_playing:false,position:0});MediaSess.state();UI.syncPlay()},
 seek(t){const tr=this.track;if(!tr)return;t=clamp(t,0,tr.duration-.05);engine.seek(t);Store.set({position:t},{silent:true});UI.progress(true);Together.sync()},
 setVolume(v,o={}){v=clamp(v,0,1);engine.setVolume(v);if(v>0&&Store.get().muted){engine.setMuted(false);Store.set({muted:false},{silent:true})}Store.set({volume:v},{silent:true});UI.syncVol()},
 toggleMute(){const m=!Store.get().muted;engine.setMuted(m);Store.set({muted:m},{silent:true});UI.syncVol()},
 toggleShuffle(){const s=Store.get();
  if(!s.shuffle){const q=s.queue.slice(),cur=q[s.qIndex],rest=q.filter((_,i)=>i!==s.qIndex);shuffleArr(rest);Store.set({shuffle:true,origQueue:q,queue:q.length?[cur,...rest]:[],qIndex:q.length?0:-1})}
  else{const o=s.origQueue;if(o&&o.length){const cur=s.queue[s.qIndex],idx=o.indexOf(cur);Store.set({shuffle:false,origQueue:null,queue:o,qIndex:idx>=0?idx:0})}else Store.set({shuffle:false,origQueue:null})}
  UI.syncModes();UI.renderQueueViews()},
 cycleRepeat(){const r=Store.get().repeat;Store.set({repeat:r==='off'?'all':r==='all'?'one':'off'});UI.syncModes()},
 setSpeed(v){Store.set({speed:v});engine.setSpeed(v);UI.syncModes();Toast.show(`Playback speed ${v}×`)},
 enqueue(id,mode='end'){const s=Store.get();let q=s.queue.slice();
  if(!q.length){if(s.currentId){q=[s.currentId];Store.set({queue:q,qIndex:0})}else{this.loadList([id],0);Toast.show('Playing now');return}}
  const at=mode==='next'?Store.get().qIndex+1:q.length;q.splice(at,0,id);Store.set({queue:q,origQueue:s.shuffle&&s.origQueue?[...s.origQueue,id]:s.origQueue});
  Toast.show(mode==='next'?'Playing next':'Added to queue');UI.renderQueueViews()},
 removeFromQueue(i){const s=Store.get();if(i===s.qIndex||i<0||i>=s.queue.length)return;const prev={queue:s.queue.slice(),qIndex:s.qIndex},q=s.queue.slice();q.splice(i,1);
  Store.set({queue:q,qIndex:i<s.qIndex?s.qIndex-1:s.qIndex});UI.renderQueueViews();Toast.show('Removed from queue',{action:'Undo',fn:()=>{Store.set(prev);UI.renderQueueViews()}})},
 moveQueue(from,to){const s=Store.get(),q=s.queue.slice();if(from<=s.qIndex||to<=s.qIndex||from>=q.length)return;to=clamp(to,s.qIndex+1,q.length-1);const[x]=q.splice(from,1);q.splice(to,0,x);Store.set({queue:q});UI.renderQueueViews()},
 clearQueue(){const s=Store.get();if(s.queue.length<=s.qIndex+1)return;const prev={queue:s.queue.slice(),qIndex:s.qIndex};Store.set({queue:s.queue.slice(0,s.qIndex+1)});UI.renderQueueViews();Toast.show('Queue cleared',{action:'Undo',fn:()=>{Store.set(prev);UI.renderQueueViews()}})},
 commit(){const ss=this.session;if(ss&&ss.sec>=8){const s=Store.get();Store.set({history:s.history.concat({id:ss.id,ts:Date.now(),sec:Math.round(ss.sec)}).slice(-2000)})}this.session=null},
 saveProgress(pos){const t=this.track;if(!t||t.kind!=='ep')return;const p=Store.get().podcast;Store.set({podcast:{...p,progress:{...p.progress,[t.id]:pos}}},{silent:true})},
 ended(){const s=Store.get(),t=this.track;this.commit();if(t&&t.kind==='ep')this.saveProgress(0);
  if(s._sleep&&s._sleep.end){this.sleepFire();return}
  const ni=this.nextIndex(false);if(ni===null){this.finish();return}this.playIndex(ni)},
 tick(){const now=performance.now(),dt=Math.min(1,(now-this.lastTick)/1000);this.lastTick=now;const s=Store.get(),t=this.track;
  if(s._sleep&&s._sleep.until&&Date.now()>=s._sleep.until)this.sleepFire();
  if(!t||!engine.playing)return;if(this.session)this.session.sec+=dt;
  const pos=engine.pos(),rem=(t.duration-pos)/engine.speed;
  if(!engine.xfading){const cf=s.crossfade,ni=this.nextIndex(false),sleepEnd=s._sleep&&s._sleep.end,canX=cf>0&&ni!==null&&s.repeat!=='one'&&!sleepEnd;
   if(canX&&rem<=cf){this.playIndex(ni,{offset:0,xfade:true});return}
   if(!canX&&rem<=2&&rem>0)engine.fadeOut(Math.max(.2,rem));
   if(rem<=.05){this.ended();return}}
  if(now-this.lastSave>3000){this.lastSave=now;Store.set({position:pos},{silent:true});this.saveProgress(pos)}
  MediaSess.pos(t,pos)},
 setSleep(mode){clearTimeout(this.sleepT);if(!mode){Store.set({_sleep:null});Toast.show('Sleep timer off');return}
  if(mode==='end')Store.set({_sleep:{until:0,end:true}});else Store.set({_sleep:{until:Date.now()+mode*60000,end:false}});
  Toast.show(mode==='end'?'Sleep timer: end of this track':`Sleep timer set for ${mode} minutes`)},
 sleepFire(){Store.set({_sleep:null});if(engine.playing){engine.deck().fade(0,3);setTimeout(()=>{if(engine.playing){engine.pause();Store.set({_playing:false});UI.syncPlay();MediaSess.state()}},3100)}Toast.show('Sleep timer ended — playback paused')}
};

/* ---- Simulated downloads ---- */
const Downloads={timers:{},
 tracksOf(key){const[k,id]=key.split(':');if(k==='track')return[id];if(k==='album')return AL(id)?AL(id).tracks:[];if(k==='playlist'){const p=PL.get(id);return p?p.tracks:[]}return[]},
 isDone(key){const d=Store.get().downloads,ids=this.tracksOf(key);return ids.length>0&&ids.every(i=>d[i])},
 toggle(key){const s=Store.get();if(this.timers[key])return;
  if(this.isDone(key)){const d={...s.downloads};this.tracksOf(key).forEach(i=>delete d[i]);Store.set({downloads:d});Toast.show('Download removed');UI.syncDownloads();return}
  let p=0;Store.set({_dlp:{...s._dlp,[key]:0}});UI.syncDownloads();
  this.timers[key]=setInterval(()=>{p=Math.min(100,p+6+Math.random()*10);const cur=Store.get()._dlp;
   if(p>=100){clearInterval(this.timers[key]);delete this.timers[key];const d={...Store.get().downloads};this.tracksOf(key).forEach(i=>d[i]=1);const n={...cur};delete n[key];Store.set({downloads:d,_dlp:n});Toast.show('Downloaded — available offline');UI.syncDownloads()}
   else{Store.set({_dlp:{...cur,[key]:Math.round(p)}});UI.syncDownloads()}},Motion.on?140:20)}
};

/* ---- Listen together + collaborative playlists (BroadcastChannel) ---- */
const Together={ch:null,id:uid('tab'),active:false,peers:new Map(),applying:false,applyingPl:false,timer:null,_st:null,
 init(){try{this.ch=new BroadcastChannel('auralis-together');this.ch.onmessage=e=>this.onMsg(e.data)}catch(e){this.ch=null}
  Store.on(['playlists'],()=>this.pushPl());window.addEventListener('pagehide',()=>{if(this.active)this.send({t:'bye'})})},
 send(m){try{this.ch&&this.ch.postMessage({...m,from:this.id,ts:Date.now()})}catch(e){}},
 count(){return this.peers.size+1},
 start(){if(!this.ch){Toast.show('Listen together needs BroadcastChannel support.',{kind:'error'});return}this.active=true;Store.set({_together:true});this.send({t:'hello'});clearInterval(this.timer);this.timer=setInterval(()=>{this.send({t:'ping'});this.prune()},3000);this.sync();Toast.show('Listening together — open Auralis in another tab to join')},
 stop(){this.send({t:'bye'});this.active=false;clearInterval(this.timer);this.peers.clear();Store.set({_together:false});Toast.show('Left the session')},
 prune(){const n=Date.now();let ch=false;for(const[k,v]of this.peers)if(n-v>8000){this.peers.delete(k);ch=true}if(ch)UI.syncTogether()},
 sync(){if(!this.active||this.applying)return;clearTimeout(this._st);this._st=setTimeout(()=>{const s=Store.get();this.send({t:'state',track:s.currentId,queue:s.queue,qIndex:s.qIndex,pos:engine.pos(),playing:engine.playing})},60)},
 pushPl(){if(this.applyingPl)return;const c=Store.get().playlists.filter(p=>p.collab);if(c.length)this.send({t:'pl',pls:c})},
 onMsg(m){if(!m||m.from===this.id)return;
  switch(m.t){
   case'hello':this.peers.set(m.from,Date.now());UI.syncTogether();if(this.active){this.send({t:'ping'});this.sync()}break;
   case'ping':this.peers.set(m.from,Date.now());UI.syncTogether();break;
   case'bye':this.peers.delete(m.from);UI.syncTogether();break;
   case'state':if(!this.active)return;this.peers.set(m.from,Date.now());this.apply(m);break;
   case'pl':{const cur=Store.get().playlists;let ch=false;const next=cur.slice();
    (m.pls||[]).forEach(p=>{const i=next.findIndex(x=>x.id===p.id);if(i<0){next.unshift(p);ch=true}else if(p.updated>next[i].updated){next[i]=p;ch=true}});
    if(ch){this.applyingPl=true;Store.set({playlists:next});this.applyingPl=false;Toast.show('A collaborative playlist was updated')}break}
  }},
 apply(m){this.applying=true;try{const s=Store.get(),lat=(Date.now()-m.ts)/1000,target=m.pos+(m.playing?lat:0);
   if(!m.track){return}
   if(JSON.stringify(m.queue)!==JSON.stringify(s.queue))Store.set({queue:m.queue,qIndex:m.qIndex});
   if(m.track!==s.currentId){Player.playIndex(m.qIndex,{offset:target});if(!m.playing&&engine.playing)Player.toggle()}
   else{if(Math.abs(engine.pos()-target)>1.5)Player.seek(target);if(m.playing!==engine.playing)Player.toggle()}
   if(m.playing&&engine.ctx&&engine.ctx.state!=='running')Toast.show('Click anywhere to enable audio in this tab')}
  finally{this.applying=false}}
};
