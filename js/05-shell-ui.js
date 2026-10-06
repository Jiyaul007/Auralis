'use strict';
/* Sidebar, topbar, player bar, full-screen player, right panel, visualizer, particles, cursor */
/* ===================== SHELL RENDERERS ===================== */
const NAV=[['home','home','#/home'],['search','search','#/search'],['browse','browse','#/browse'],['podcasts','podcast','#/podcasts']];
function renderSidebar(){
 const s=Store.get(),link=(r,i,h,l)=>`<a class="navlink" href="${h}" data-route="${r}">${ic(i)}<span class="label">${esc(l)}</span></a>`;
 $('#sidebar').innerHTML=`<div class="brand"><svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="#5eead4"/></linearGradient></defs><path d="M16 3 28 27h-5.2L16 12.8 9.2 27H4z" fill="url(#lg)"/><circle cx="16" cy="22" r="2.6" fill="#0b0a14"/></svg><span class="label">AURALIS</span><button class="icon-btn sb-toggle" type="button" data-act="sb-toggle" aria-label="Collapse sidebar">${ic('chev-l')}</button></div>
 <nav aria-label="Main">${NAV.map(([r,i,h])=>link(r,i,h,tr(r))).join('')}</nav>
 <div class="lib-title"><span class="label">${esc(tr('library'))}</span><button class="icon-btn" type="button" data-act="pl-new" aria-label="${esc(tr('createPlaylist'))}">${ic('plus')}</button></div>
 <nav class="side-lib" aria-label="Your library">${link('library','library','#/library',tr('library'))}${link('liked','heart','#/liked',tr('liked'))}${link('stats','stats','#/stats',tr('stats'))}
 ${s.playlists.map(p=>`<a class="navlink pl-link" href="#/playlist/${p.id}" data-route="playlist:${p.id}" data-ctx="playlist:${p.id}">${img(cover('playlist',p.id,64),'pl-th')}<span class="label">${esc(p.name)}</span></a>`).join('')}</nav>`;
 UI.syncNav();
}
function renderTopbar(){
 const p=Store.get().profile;
 $('#topbar').innerHTML=`<div class="tb-nav"><button class="icon-btn solid" type="button" data-act="back" aria-label="Go back">${ic('chev-l')}</button><button class="icon-btn solid" type="button" data-act="fwd" aria-label="Go forward">${ic('chev-r')}</button></div>
 <div class="searchbox" role="search">${ic('search')}<input id="q" type="text" placeholder="${esc(tr('searchPh'))}" aria-label="Search" autocomplete="off" spellcheck="false" value="${esc(Search.q)}"></div>
 <div class="tb-r"><button class="icon-btn solid" type="button" data-act="palette" aria-label="Open command palette (Ctrl or Command K)">${ic('cmd')}</button><button class="icon-btn solid" id="tg-btn" type="button" data-act="together" aria-label="Listen together" aria-pressed="${Store.get()._together}">${ic('users')}</button><button class="avatar-btn" type="button" data-act="profile-menu" aria-label="Profile menu" aria-haspopup="menu"><img src="${cover('avatar',p.avatar,96)}" alt=""></button></div>`;
}
function renderTabbar(){
 const tabs=[['home','home','#/home',tr('home')],['search','search','#/search',tr('search')],['library','library','#/library',tr('library')],['podcasts','podcast','#/podcasts',tr('podcasts')],['settings','user','#/settings',tr('me')]];
 $('#tabbar').innerHTML=tabs.map(([r,i,h,l])=>`<a class="tab" href="${h}" data-route="${r}">${ic(i)}<span>${esc(l)}</span></a>`).join('');UI.syncNav();
}
const seekHTML=()=>`<span class="t-cur" data-cur>0:00</span><div class="seek" role="slider" tabindex="0" data-k="seek" aria-label="Seek" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="track"><div class="fill"></div><div class="thumb"></div></div></div><span class="t-dur" data-dur>0:00</span>`;
const ctlHTML=()=>`<button class="icon-btn" type="button" data-act="shuffle" aria-pressed="false" aria-label="Shuffle">${ic('shuffle')}</button><button class="icon-btn" type="button" data-act="prev" aria-label="Previous">${ic('prev')}</button><button class="play-neu" type="button" data-act="toggle" aria-label="Play">${ic('play')}</button><button class="icon-btn" type="button" data-act="next" aria-label="Next">${ic('next')}</button><button class="icon-btn" type="button" data-act="repeat" aria-pressed="false" aria-label="Repeat">${ic('repeat')}</button>`;
const volHTML=()=>`<button class="icon-btn" type="button" data-act="mute" aria-label="Mute">${ic('volume')}</button><div class="vol" role="slider" tabindex="0" data-k="vol" aria-label="Volume" aria-valuemin="0" aria-valuemax="100" aria-valuenow="80"><div class="track"><div class="fill"></div><div class="thumb"></div></div></div>`;
function renderPlayer(){
 const t=Player.track,s=Store.get(),sl=s._sleep;
 $('#player').innerHTML=`<div class="p-left">${t?`<button class="p-art" type="button" data-act="fs-open" aria-label="Open full-screen player">${img(trackCover(t,96),'p-cover')}</button><div class="p-meta"><a class="p-title" href="#/${t.kind==='ep'?'show':'album'}/${t.albumId}">${esc(t.title)}</a><a class="p-artist" href="#/${t.kind==='ep'?'show':'artist'}/${t.artistId}">${esc(artistName(t))}</a></div><button class="icon-btn like" type="button" data-act="like" data-id="${t.id}" aria-pressed="false" aria-label="Add to Liked Songs">${ic('heart')}</button>`:`<div class="p-empty">${ic('note')}<span>Pick a song to start listening</span></div>`}</div>
 <div class="p-center"><div class="p-controls">${ctlHTML()}</div><div class="p-time">${seekHTML()}</div></div>
 <div class="p-mini-ctl"><button class="play-neu sm" type="button" data-act="toggle" aria-label="Play">${ic('play')}</button><button class="icon-btn" type="button" data-act="next" aria-label="Next">${ic('next')}</button></div>
 <div class="p-right"><button class="icon-btn hide-md" type="button" data-act="lyrics" aria-label="Show lyrics">${ic('lyrics')}</button><button class="icon-btn hide-md" type="button" data-act="queue-toggle" aria-label="Toggle queue panel">${ic('queue')}</button><button class="icon-btn hide-md speed-b" type="button" data-act="speed" aria-label="Playback speed" aria-haspopup="menu">${ic('speed')}<small data-speed>1×</small></button><button class="icon-btn hide-md${sl?' on':''}" type="button" data-act="sleep" aria-label="Sleep timer" aria-pressed="${!!sl}">${ic('moon')}</button><div class="vol-w hide-md">${volHTML()}</div><button class="icon-btn hide-md" type="button" data-act="float" aria-label="Floating mini widget">${ic('mini')}</button><button class="icon-btn" type="button" data-act="fs-open" aria-label="Full-screen player">${ic('expand')}</button></div>
 <div class="p-prog" aria-hidden="true"><i data-prog></i></div>`;
 UI.after();
}
const fsBody=t=>t?`<div class="fs-stage" id="fs-stage" data-viz="${Store.get().settings.viz}"><canvas id="viz" aria-hidden="true"></canvas>${img(trackCover(t,360),'fs-art','Cover art for '+t.title)}</div>
 <div class="fs-side"><div class="fs-meta"><h2 class="fs-title">${esc(t.title)}</h2><p class="fs-artist"><a href="#/${t.kind==='ep'?'show':'artist'}/${t.artistId}" data-act="fs-close">${esc(artistName(t))}</a></p></div><div class="lyrics" id="fs-ly" tabindex="0" aria-label="${t.kind==='ep'?'Chapters':'Lyrics'}">${Lyrics.lines.map((l,i)=>`<p class="ly" data-t="${l.t.toFixed(1)}" data-i="${i}" data-act="ly-seek">${esc(l.text)}</p>`).join('')}</div></div>`:`<div class="fs-empty">${empty('note','Nothing playing','Choose a song and it will open here with its visualizer and lyrics.')}</div>`;
function renderFS(){
 const t=Player.track,v=Store.get().settings.viz;Lyrics.lines=t?Lyrics.get(t):[];Lyrics.idx=-1;
 $('#fs').innerHTML=`<div class="fs-top"><button class="icon-btn solid" type="button" data-act="fs-close" aria-label="Close full-screen player">${ic('chev-d')}</button><div class="fs-src"><small>Now playing</small><b>${t?esc(albumTitle(t)):'Auralis'}</b></div><div class="seg viz-sw" role="group" aria-label="Visualizer style">${[['bars','stats'],['wave','speed'],['circular','dice']].map(([m,i])=>`<button class="icon-btn" type="button" data-act="viz" data-m="${m}" aria-pressed="${v===m}" aria-label="${m} visualizer" title="${m}">${ic(i)}</button>`).join('')}</div><button class="icon-btn solid" type="button" data-act="eq-open" aria-label="Equalizer">${ic('eq')}</button></div>
 <div class="fs-body">${fsBody(t)}</div>
 <div class="fs-bottom"><div class="p-time">${seekHTML()}</div><div class="p-controls">${ctlHTML()}</div><div class="fs-extra"><button class="icon-btn" type="button" data-act="speed" aria-haspopup="menu" aria-label="Playback speed">${ic('speed')}<small data-speed>1×</small></button><button class="icon-btn" type="button" data-act="sleep" aria-label="Sleep timer">${ic('moon')}</button><div class="vol-w">${volHTML()}</div><button class="icon-btn like" type="button" data-act="like" data-id="${t?t.id:''}" aria-pressed="false" aria-label="Add to Liked Songs">${ic('heart')}</button></div></div>`;
 Viz.c=null;if(Store.get()._fs){Viz.resize()}UI.after();
}
function renderMini(){
 const t=Player.track;
 $('#mini').innerHTML=`<div class="mini-grip" data-grip aria-hidden="true">${ic('grip')}</div><button class="icon-btn mini-x" type="button" data-act="${Store.get()._mini?'mini':'float'}" aria-label="${Store.get()._mini?'Exit mini-player mode':'Close floating widget'}">${ic(Store.get()._mini?'expand':'close')}</button>
 <div class="mini-main">${t?img(trackCover(t,96),'mini-cover'):`<div class="mini-cover blank">${ic('note')}</div>`}<div class="p-meta"><span class="p-title">${t?esc(t.title):'Nothing playing'}</span><span class="p-artist">${t?esc(artistName(t)):'Pick a song'}</span></div></div>
 <div class="p-time">${seekHTML()}</div><div class="p-controls"><button class="icon-btn" type="button" data-act="prev" aria-label="Previous">${ic('prev')}</button><button class="play-neu sm" type="button" data-act="toggle" aria-label="Play">${ic('play')}</button><button class="icon-btn" type="button" data-act="next" aria-label="Next">${ic('next')}</button></div>`;
 UI.after();
}
function nowHTML(){
 const t=Player.track;if(!t)return empty('note','Nothing playing yet','Pick any song and its credits, lyrics and artist info will show here.');
 const ep=t.kind==='ep',a=A(t.artistId),credits=ep?[['Show',a.name],['Published',t.date],['Length',fmtLong(t.duration)]]:[['Written by',t.credit.writer],['Produced by',t.credit.producer],['Mixed by',t.credit.mixer],['Released',t.year],['Tempo',t.bpm+' BPM'],['Key',t.key],['Mood',t.mood],['Genre',GMAP[t.genre].name]];
 return `${img(trackCover(t,360),'rp-art',t.title)}<div class="rp-title-row"><div class="p-meta"><a class="rp-t" href="#/${ep?'show':'album'}/${t.albumId}">${esc(t.title)}</a><a class="p-artist" href="#/${ep?'show':'artist'}/${t.artistId}">${esc(a.name)}</a></div><button class="icon-btn like" type="button" data-act="like" data-id="${t.id}" aria-pressed="false" aria-label="Add to Liked Songs">${ic('heart')}</button>${dlBtn('track:'+t.id,false)}</div>
 <section class="rp-card"><h3>Credits</h3><dl class="credits">${credits.map(([k,v])=>`<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></section>
 <section class="rp-card"><div class="rp-card-h"><h3>${ep?'Chapters':'Lyrics'}</h3><button class="btn sm" type="button" data-act="lyrics">Expand</button></div><div id="rp-ly" class="rp-ly"></div></section>
 ${ep?`<section class="rp-card"><h3>About this episode</h3><p class="muted">${esc(t.desc)}</p></section>`:`<section class="rp-card artist-c"><h3>About the artist</h3><div class="ac-row">${img(cover('artist',a.id,96),'r-cover round')}<div class="r-text"><a class="r-title" href="#/artist/${a.id}">${esc(a.name)}</a><div class="r-sub">${fmtNum(a.listeners)} monthly listeners</div></div><button class="btn sm${Lib.isFollowing(a.id)?' on':''}" type="button" data-act="follow" data-id="${a.id}">${Lib.isFollowing(a.id)?'Following':'Follow'}</button></div><p class="muted">${esc(a.bio)}</p></section>`}`;
}
function queueHTML(){
 const s=Store.get(),q=s.queue,cur=s.qIndex;if(!q.length||cur<0)return empty('queue','Your queue is empty','Add songs with “Add to queue”, or start playing something.');
 const item=(id,i,isCur)=>{const t=T(id);if(!t)return'';return `<div class="q-item${isCur?' cur':''}" tabindex="0" role="listitem" data-act="q-play" data-i="${i}" data-track="${id}" data-qi="${i}"${isCur?'':` draggable="true" data-drag="queue" data-drop="queue"`} aria-label="${esc(t.title)}, ${esc(artistName(t))}">${isCur?`<span class="bars" aria-hidden="true"><i></i><i></i><i></i></span>`:`<span class="grip" aria-hidden="true">${ic('grip')}</span>`}${img(trackCover(t,96),'r-cover')}<div class="r-text"><div class="r-title">${esc(t.title)}</div><div class="r-sub">${esc(artistName(t))}</div></div>${isCur?'':`<button class="icon-btn" type="button" data-act="q-rm" data-i="${i}" aria-label="Remove ${esc(t.title)} from queue">${ic('close')}</button>`}</div>`};
 const up=q.slice(cur+1);
 return `<h3 class="rp-sub">${esc(tr('nowPlaying'))}</h3><div role="list">${item(q[cur],cur,true)}</div><div class="rp-sub-row"><h3 class="rp-sub">${esc(tr('upNext'))}</h3>${up.length?`<button class="btn sm" type="button" data-act="q-clear">Clear queue</button>`:''}</div>${up.length?`<div role="list" class="q-list" aria-label="Up next. Drag to reorder.">${up.map((id,k)=>item(id,cur+1+k,false)).join('')}</div>`:`<p class="muted pad">Nothing queued after this song.</p>`}`;
}
function renderRight(){
 const tab=Store.get()._rp;
 $('#right').innerHTML=`<div class="rp-head"><div class="seg tabs" role="tablist"><button class="chip" role="tab" type="button" data-act="rp-tab" data-tab="now" aria-selected="${tab==='now'}" aria-pressed="${tab==='now'}">${esc(tr('nowPlaying'))}</button><button class="chip" role="tab" type="button" data-act="rp-tab" data-tab="queue" aria-selected="${tab==='queue'}" aria-pressed="${tab==='queue'}">${esc(tr('queue'))}</button></div><button class="icon-btn" type="button" data-act="rp-close" aria-label="Close panel">${ic('close')}</button></div><div class="rp-body">${tab==='queue'?queueHTML():nowHTML()}</div>`;
 Lyrics.idx=-1;UI.after();
}

/* ===================== UI sync ===================== */
let lastP=0;
UI.after=()=>{UI.syncPlay();UI.syncModes();UI.syncVol();UI.syncLikes();UI.syncDownloads();UI.progress(true);UI.syncTogether()};
UI.renderQueueViews=()=>{if(Store.get()._rp==='queue'||true)renderRight()};
UI.syncPlay=()=>{const on=Store.get()._playing&&engine.playing!==false,t=Player.track;document.body.classList.toggle('is-playing',on);
 $$('[data-act=toggle]').forEach(b=>{b.innerHTML=ic(on?'pause':'play');b.setAttribute('aria-label',on?'Pause':'Play')});
 document.title=t&&on?`▶ ${t.title} · ${artistName(t)}`:'Auralis — music streaming'};
UI.syncCur=()=>{const id=Store.get().currentId;$$('.row[data-track]').forEach(r=>r.classList.toggle('cur',r.dataset.track===id))};
UI.syncModes=()=>{const s=Store.get();$$('[data-act=shuffle]').forEach(b=>b.setAttribute('aria-pressed',s.shuffle));$$('[data-act=repeat]').forEach(b=>{b.innerHTML=ic(s.repeat==='one'?'repeat1':'repeat');b.setAttribute('aria-pressed',s.repeat!=='off');b.setAttribute('aria-label','Repeat: '+s.repeat)});$$('[data-speed]').forEach(e=>e.textContent=s.speed+'×')};
UI.syncVol=()=>{const s=Store.get(),v=s.muted?0:s.volume;$$('.vol').forEach(el=>{$('.fill',el).style.width=v*100+'%';$('.thumb',el).style.left=v*100+'%';el.setAttribute('aria-valuenow',Math.round(v*100))});$$('[data-act=mute]').forEach(b=>{b.innerHTML=ic(v===0?'mute':'volume');b.setAttribute('aria-label',v===0?'Unmute':'Mute')})};
UI.syncLikes=()=>{const l=Store.get().likes;$$('.like').forEach(b=>{const on=l.includes(b.dataset.id);b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);b.setAttribute('aria-label',on?'Remove from Liked Songs':'Add to Liked Songs');b.innerHTML=ic(on?'heart-fill':'heart')})};
UI.syncDownloads=()=>{const p=Store.get()._dlp;$$('[data-dk]').forEach(b=>{const key=b.dataset.dk,done=Downloads.isDone(key),pr=p[key],lbl=b.dataset.lbl==='1';b.classList.toggle('on',done);b.setAttribute('aria-pressed',done);b.innerHTML=(pr!=null?`<span class="dl-p">${pr}%</span>`:ic(done?'check':'download'))+(lbl?`<span class="dl-l">${done?'Downloaded':pr!=null?'Downloading':'Download'}</span>`:'')})};
UI.syncTogether=()=>{const on=Store.get()._together;const b=$('#tg-btn');if(b){b.setAttribute('aria-pressed',on);b.classList.toggle('on',on);b.title=on?`${Together.count()} listening`:'Listen together'}const c=$('#tg-count');if(c)c.textContent=Together.count()};
UI.pop=el=>{if(!el||!Motion.on)return;el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop')};
UI.syncNav=()=>{const r=Router.cur,key=r.params&&r.params.id&&r.name==='playlist'?'playlist:'+r.params.id:r.name;$$('[data-route]').forEach(a=>{const on=a.dataset.route===key;if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});if(r.name!=='search'){const i=$('#q');if(i&&i.value)i.value=''}};
UI.progress=force=>{const now=performance.now();if(!force&&now-lastP<90)return;lastP=now;const t=Player.track,dur=t?t.duration:0,pos=engine.pos(),drag=Seek.drag&&Seek.drag.type==='seek',shown=drag?Seek.ratio*dur:pos,r=dur?clamp(shown/dur,0,1):0;
 $$('.seek').forEach(el=>{$('.fill',el).style.width=r*100+'%';$('.thumb',el).style.left=r*100+'%';el.setAttribute('aria-valuenow',Math.round(r*100));el.setAttribute('aria-valuetext',fmt(shown)+' of '+fmt(dur))});
 const cs=fmt(shown),ds=fmt(dur);$$('[data-cur]').forEach(e=>{if(e._v!==cs){e.textContent=cs;e._v=cs}});$$('[data-dur]').forEach(e=>{if(e._v!==ds){e.textContent=ds;e._v=ds}});$$('[data-prog]').forEach(e=>e.style.width=r*100+'%');
 UI.lyricsUpdate(pos)};
UI.rpLyrics=()=>{const el=$('#rp-ly');if(!el)return;const L=Lyrics.lines,i=Math.max(0,Lyrics.idx);el.innerHTML=L.slice(i,i+3).map((l,k)=>`<p class="${k===0?'on':''}">${esc(l.text)}</p>`).join('')};
UI.lyricsUpdate=pos=>{if(!Lyrics.lines.length)return;const i=Lyrics.index(pos);if(i===Lyrics.idx&&$('#rp-ly')&&$('#rp-ly').firstChild)return;const changed=i!==Lyrics.idx;Lyrics.idx=i;UI.rpLyrics();if(!changed)return;
 const box=$('#fs-ly');if(box){$$('.ly',box).forEach((e,k)=>{e.classList.toggle('on',k===i);e.classList.toggle('past',k<i)});if(Store.get()._fs){const on=$('.ly.on',box);if(on)box.scrollTo({top:on.offsetTop-box.clientHeight/2+on.clientHeight/2,behavior:Motion.on?'smooth':'auto'})}}};
UI.setFS=on=>{const fs=$('#fs');Store.set({_fs:on},{silent:true});fs.classList.toggle('open',on);fs.setAttribute('aria-hidden',String(!on));document.body.classList.toggle('fs-open',on);
 if(on){UI.fsOpener=document.activeElement;Viz.resize();const b=$('[data-act=fs-close]',fs);b&&b.focus({preventScroll:true});Lyrics.idx=-1;UI.lyricsUpdate(engine.pos())}else{const o=UI.fsOpener;if(o&&o.focus&&document.body.contains(o))o.focus({preventScroll:true})}};
UI.applyLayout=()=>{const u=Store.get().ui,app=$('#app');app.classList.toggle('no-right',!u.right);const c=u.sb===null?window.innerWidth<1100:u.sb;document.body.classList.toggle('sb-collapsed',c);const f=u.float&&!Store.get()._mini;const m=$('#mini');m.classList.toggle('show',f||Store.get()._mini);document.body.classList.toggle('mini-mode',!!Store.get()._mini);
 if(u.fx!=null&&!Store.get()._mini){m.style.left=clamp(u.fx,0,window.innerWidth-300)+'px';m.style.top=clamp(u.fy,0,window.innerHeight-170)+'px';m.style.right='auto';m.style.bottom='auto'}else if(Store.get()._mini){m.style.left=m.style.top=m.style.right=m.style.bottom=''}};

/* ===================== VISUALIZER / PARTICLES / CURSOR ===================== */
const Viz={c:null,x:null,w:0,h:0,dpr:1,freq:null,wave:null,t:0,
 resize(){const c=$('#viz');if(!c)return;this.c=c;const p=c.parentElement.getBoundingClientRect();this.dpr=Math.min(2,window.devicePixelRatio||1);this.w=Math.max(10,p.width);this.h=Math.max(10,p.height);c.width=this.w*this.dpr;c.height=this.h*this.dpr;this.x=c.getContext('2d');if(this.x)this.x.setTransform(this.dpr,0,0,this.dpr,0,0)},
 data(){const an=engine.analyser;if(an&&!this.freq){this.freq=new Uint8Array(an.frequencyBinCount);this.wave=new Uint8Array(an.fftSize)}
  if(an&&engine.playing){an.getByteFrequencyData(this.freq);an.getByteTimeDomainData(this.wave);return true}return false},
 draw(){if(!Store.get()._fs)return;if(!this.c||!this.c.isConnected)this.resize();const x=this.x;if(!x)return;const live=this.data();this.t+=.016;const W=this.w,H=this.h,hue=Theme.hue,mode=Store.get().settings.viz,t=this.t;x.clearRect(0,0,W,H);
  const F=i=>live?this.freq[i]/255:.12+.1*Math.sin(t*2+i*.35)+.05*Math.sin(t*3.1+i);
  if(mode==='bars'){const n=56,bw=W/n;for(let i=0;i<n;i++){const bi=Math.floor(Math.pow(i/n,1.8)*380)+2,v=Math.min(1,F(bi)*1.15),bh=Math.max(4,v*H*.42);x.fillStyle=`hsl(${hue+i*1.6} 85% ${52+v*18}%)`;rr(x,i*bw+bw*.15,H-bh-8,bw*.7,bh,bw*.3);x.fill()}}
  else if(mode==='wave'){x.lineWidth=3;x.lineJoin='round';x.strokeStyle=`hsl(${hue} 90% 68%)`;x.shadowColor=`hsl(${hue} 90% 60%)`;x.shadowBlur=14;x.beginPath();const n=128;for(let i=0;i<=n;i++){const px=i/n*W,v=live?(this.wave[Math.floor(i/n*(this.wave.length-1))]-128)/128:Math.sin(t*2+i*.2)*.08;const py=H/2+v*H*.34;i?x.lineTo(px,py):x.moveTo(px,py)}x.stroke();x.shadowBlur=0}
  else{const cx=W/2,cy=H/2,R=Math.min(W,H)*.31,n=96;x.lineWidth=Math.max(2,R*.028);x.lineCap='round';for(let i=0;i<n;i++){const a=i/n*Math.PI*2-Math.PI/2,v=F(Math.floor(Math.pow(i<n/2?i/(n/2):(n-i)/(n/2),1.6)*300)+2),len=R*.08+v*R*.55;x.strokeStyle=`hsl(${hue+i*2.4} 85% 62%)`;x.beginPath();x.moveTo(cx+Math.cos(a)*R,cy+Math.sin(a)*R);x.lineTo(cx+Math.cos(a)*(R+len),cy+Math.sin(a)*(R+len));x.stroke()}}}
};
const FX={c:null,x:null,p:[],w:0,h:0,buf:null,cleared:false,
 init(){this.c=$('#fx');this.x=this.c.getContext('2d');this.resize();for(let i=0;i<46;i++)this.p.push({x:Math.random(),y:Math.random(),r:.6+Math.random()*2,vx:(Math.random()-.5)*.00006,vy:-.00004-Math.random()*.00008,a:.15+Math.random()*.35})},
 resize(){this.w=this.c.width=window.innerWidth;this.h=this.c.height=window.innerHeight},
 draw(){if(!Motion.on){if(!this.cleared){this.x.clearRect(0,0,this.w,this.h);this.cleared=true}return}this.cleared=false;let e=0;
  if(engine.analyser&&engine.playing){if(!this.buf)this.buf=new Uint8Array(engine.analyser.frequencyBinCount);engine.analyser.getByteFrequencyData(this.buf);for(let i=1;i<10;i++)e+=this.buf[i];e/=2550}
  const x=this.x,hue=Theme.hue;x.clearRect(0,0,this.w,this.h);const sp=1+e*6;
  for(const p of this.p){p.x+=p.vx*sp*16;p.y+=p.vy*sp*16;if(p.y<-.02){p.y=1.02;p.x=Math.random()}if(p.x<-.02)p.x=1.02;if(p.x>1.02)p.x=-.02;x.fillStyle=`hsla(${hue+p.r*20},80%,72%,${p.a*(.7+e*.8)})`;x.beginPath();x.arc(p.x*this.w,p.y*this.h,p.r*(1+e),0,6.283);x.fill()}}
};
const Cursor={dot:null,ring:null,tx:0,ty:0,rx:0,ry:0,active:false,
 enabled(){return Store.get().settings.cursor&&window.matchMedia&&window.matchMedia('(pointer: fine)').matches},
 init(){this.dot=$('#cur-dot');this.ring=$('#cur-ring');
  document.addEventListener('mousemove',e=>{if(!this.enabled()){if(this.active){this.active=false;document.body.classList.remove('cc')}return}if(!this.active){this.active=true;document.body.classList.add('cc');this.rx=e.clientX;this.ry=e.clientY}this.tx=e.clientX;this.ty=e.clientY;this.dot.style.transform=`translate(${e.clientX}px,${e.clientY}px) translate(-50%,-50%)`;
   const t=e.target.closest?e.target:document.body,hov=t.closest('a,button,[data-act],[data-nav],.seek,.vol,select,.switch,input[type=range],input[type=color],label'),txt=t.closest('input[type=text],textarea');this.ring.classList.toggle('c-hover',!!hov&&!txt);this.ring.classList.toggle('c-text',!!txt)},{passive:true});
  document.addEventListener('mousedown',()=>this.ring.classList.add('c-down'));document.addEventListener('mouseup',()=>this.ring.classList.remove('c-down'));
  document.addEventListener('mouseleave',()=>document.body.classList.remove('cc'));document.addEventListener('mouseenter',()=>{if(this.active&&this.enabled())document.body.classList.add('cc')});
  Loop.add(()=>{if(!this.active)return;const k=Motion.on?.2:1;this.rx+=(this.tx-this.rx)*k;this.ry+=(this.ty-this.ry)*k;this.ring.style.transform=`translate(${this.rx}px,${this.ry}px) translate(-50%,-50%)`})},
 apply(){if(!this.enabled()){this.active=false;document.body.classList.remove('cc')}}
};
