'use strict';
/* UI components and page views (home, search, artist, album, playlist, stats, settings...) */
/* ===================== UI: helpers & components ===================== */
const UI={};
const View={lists:{},subs:[],onResize:null};
const img=(src,cls,alt='')=>`<img class="${cls}" src="${src}" alt="${esc(alt)}" draggable="false">`;
function cover(kind,id,size=240){
 switch(kind){
  case'album':{const a=AL(id);return Art.make('album:'+id,{size,hue:a?a.hue:0})}
  case'artist':{const a=A(id);return Art.make('artist:'+id,{size,hue:a?a.hue:0,text:a?a.name.replace(/^The /,'')[0]:''})}
  case'show':{const a=SHOWS[id];return Art.make('show:'+id,{size,hue:a?a.hue:0,style:4})}
  case'playlist':{const p=PL.get(id);return Art.make('pl:'+(p?p.seed:id),{size})}
  case'mix':{const m=Rec.mix(id);return Art.make('mix:'+id,{size,hue:m?m.hue:200,style:3})}
  case'genre':{const g=GMAP[id];return Art.make('genre:'+id,{size,hue:g?g.hue:0})}
  case'mood':return Art.make('mood:'+id,{size});
  case'liked':return Art.make('liked',{size,hue:268,style:0,text:'♥'});
  case'avatar':return Art.make('avatar:'+id,{size,text:((Store.get().profile.name||'?').trim()[0]||'?').toUpperCase()});
 }
 return Art.make('x:'+kind+id,{size});
}
const trackCover=(t,size=96)=>t.kind==='ep'?cover('show',t.albumId,size):cover('album',t.albumId,size);
const totalDur=ids=>ids.reduce((a,i)=>a+(T(i)?T(i).duration:0),0);
const plural=(n,w)=>`${n} ${w}${n===1?'':'s'}`;

function entityTracks(kind,id){
 switch(kind){
  case'album':return AL(id)?AL(id).tracks.slice():[];
  case'artist':return CAT.tracks.filter(t=>t.artistId===id).sort((a,b)=>b.plays-a.plays).map(t=>t.id);
  case'playlist':{const p=PL.get(id);return p?p.tracks.slice():[]}
  case'mix':{const m=Rec.mix(id);return m?m.ids.slice():[]}
  case'track':case'ep':return[id];
  case'show':return EPS.filter(e=>e.albumId===id).sort((a,b)=>b.ts-a.ts).map(e=>e.id);
  case'genre':return CAT.tracks.filter(t=>t.genre===id).sort((a,b)=>b.plays-a.plays).map(t=>t.id);
  case'mood':return CAT.tracks.filter(t=>t.mood===id).sort((a,b)=>b.plays-a.plays).map(t=>t.id);
  case'liked':return Store.get().likes.slice();
 }return[];
}

function trackRow(t,o={}){
 const s=Store.get(),liked=s.likes.includes(t.id),cur=s.currentId===t.id,ep=t.kind==='ep';
 const prog=ep?(s.podcast.progress[t.id]||0):0;
 return `<div class="row${cur?' cur':''}${o.rm?' has-rm':''}" role="row" tabindex="0" data-act="row" data-track="${t.id}" data-list="${o.list||''}" data-i="${o.i}"${o.plid?` data-plid="${o.plid}"`:''}${o.drag?` draggable="true" data-drag="${o.drag}" data-drop="${o.drag}"`:''} aria-label="${esc(t.title)}, ${esc(artistName(t))}">
  <div class="r-idx"><span class="num">${o.i+1}</span><span class="bars" aria-hidden="true"><i></i><i></i><i></i></span><span class="r-play">${ic('play')}</span></div>
  <div class="r-main">${img(trackCover(t,96),'r-cover')}<div class="r-text"><div class="r-title">${esc(t.title)}</div><div class="r-sub"><a href="#/${ep?'show':'artist'}/${t.artistId}">${esc(artistName(t))}</a></div>${ep&&prog>5?`<div class="ep-prog" aria-label="Progress"><i style="width:${clamp(prog/t.duration*100,0,100).toFixed(1)}%"></i></div>`:''}</div></div>
  <div class="r-album"><a href="#/${ep?'show':'album'}/${t.albumId}">${esc(albumTitle(t))}</a></div>
  <div class="r-plays">${ep?esc(t.date):t.plays.toLocaleString()}</div>
  <button class="icon-btn like${liked?' on':''}" type="button" data-act="like" data-id="${t.id}" aria-pressed="${liked}" aria-label="${liked?'Remove from':'Add to'} Liked Songs">${ic(liked?'heart-fill':'heart')}</button>
  <div class="r-dur"><span>${fmt(t.duration)}</span>${o.rm?`<button class="icon-btn rmv" type="button" data-act="pl-rm" data-id="${o.plid}" data-i="${o.i}" aria-label="Remove from playlist">${ic('close')}</button>`:''}</div>
  <button class="icon-btn" type="button" data-act="more" data-track="${t.id}" aria-haspopup="menu" aria-label="More options for ${esc(t.title)}">${ic('more')}</button>
 </div>`;
}
const listHead=()=>`<div class="row head" role="row"><div class="r-idx">#</div><div class="r-main">Title</div><div class="r-album">Album</div><div class="r-plays">Plays</div><div></div><div class="r-dur">${ic('clock')}</div><div></div></div>`;
function card(o){return `<article class="card${o.round?' round':''} ${o.cls||''}" tabindex="0" role="link" data-nav="${o.nav}" ${o.attrs||''} aria-label="${esc(o.title)}${o.sub?', '+esc(o.sub):''}">
 <div class="art">${img(o.img,'cover',o.title)}<button class="fab" type="button" data-act="play-entity" data-kind="${o.kind}" data-id="${o.id}" aria-label="Play ${esc(o.title)}">${ic('play')}</button></div>
 <h3 class="c-title">${esc(o.title)}</h3><p class="c-sub">${esc(o.sub||'')}</p></article>`}
const trackCard=t=>card({kind:'track',id:t.id,title:t.title,sub:artistName(t),img:trackCover(t,240),nav:'#/album/'+t.albumId,attrs:`data-track="${t.id}"`});
const albumCard=a=>card({kind:'album',id:a.id,title:a.title,sub:`${a.year} · ${A(a.artistId).name}`,img:cover('album',a.id),nav:'#/album/'+a.id,attrs:`data-ctx="album:${a.id}"`});
const artistCard=a=>card({kind:'artist',id:a.id,title:a.name,sub:'Artist',img:cover('artist',a.id),nav:'#/artist/'+a.id,round:true,attrs:`data-ctx="artist:${a.id}"`});
const mixCard=m=>card({kind:'mix',id:m.id,title:m.name,sub:m.desc,img:cover('mix',m.id),nav:'#/mix/'+m.id});
const plCard=p=>card({kind:'playlist',id:p.id,title:p.name,sub:`${plural(p.tracks.length,'song')} · ${p.public?'Public':'Private'}`,img:cover('playlist',p.id),nav:'#/playlist/'+p.id,attrs:`data-ctx="playlist:${p.id}"`});
const showCard=s=>card({kind:'show',id:s.id,title:s.name,sub:'Podcast',img:cover('show',s.id),nav:'#/show/'+s.id,attrs:`data-ctx="show:${s.id}"`});
const tile=o=>`<div class="tile" tabindex="0" role="link" data-nav="${o.nav}" aria-label="${esc(o.title)}">${img(o.img,'tile-bg')}<span class="tile-t">${esc(o.title)}</span></div>`;
function shelf(title,html,extra=''){const id=uid('sh');return `<section class="shelf reveal" aria-labelledby="${id}"><div class="shelf-head"><h2 id="${id}" class="h2">${esc(title)}</h2>${extra}<div class="shelf-nav"><button class="icon-btn" type="button" data-act="shelf" data-dir="-1" aria-label="Scroll ${esc(title)} left">${ic('chev-l')}</button><button class="icon-btn" type="button" data-act="shelf" data-dir="1" aria-label="Scroll ${esc(title)} right">${ic('chev-r')}</button></div></div><div class="shelf-row">${html}</div></section>`}
const empty=(icon,title,msg,cta='')=>`<div class="empty">${ic(icon,'empty-ic')}<h3>${esc(title)}</h3><p>${esc(msg)}</p>${cta}</div>`;
const hero=o=>`<header class="hero" style="--hh:hsl(${Math.round(o.hue)} 62% 36%)">${img(o.img,'hero-cover'+(o.round?' round':''),o.title)}<div class="hero-t"><p class="hero-type">${esc(o.type)}</p><h1 class="hero-h">${esc(o.title)}</h1>${o.desc?`<p class="hero-d">${o.desc}</p>`:''}<p class="hero-m">${o.meta||''}</p></div></header>`;
function dlBtn(key,label=true){const done=Downloads.isDone(key),p=Store.get()._dlp[key];return `<button class="btn dl${done?' on':''}" type="button" data-act="download" data-dk="${key}" data-lbl="${label?1:0}" aria-pressed="${done}" aria-label="Download for offline listening">${p!=null?`<span class="dl-p">${p}%</span>`:ic(done?'check':'download')}${label?`<span class="dl-l">${done?'Downloaded':p!=null?'Downloading':'Download'}</span>`:''}</button>`}
const playBtn=(list,extra='')=>`<button class="play-big" type="button" data-act="play-list" data-list="${list}" aria-label="Play">${ic('play')}</button>`;
const shufBtn=list=>`<button class="btn" type="button" data-act="play-list" data-list="${list}" data-shuffle="1">${ic('shuffle')}Shuffle</button>`;
const notFound=(title='Page not found',msg='That page doesn’t exist. Try heading back home.')=>({title:'Not found',html:`<div class="page">${empty('search',title,msg,'<a class="btn primary" href="#/home">Go home</a>')}</div>`});

/* ---- lyrics ---- */
const LY={
 subj:['the lights','your shadow','this city','the static','a small ember','the tide','our echo','midnight','the window glass','a paper moon','the radio','every street'],
 verb:['hum low','fold into blue','keep time','lean closer','rewrite the sky','break like waves','slow down','drift apart','start to glow','wait for us','turn to gold','fade out'],
 place:['over the rooftops','under the neon','across the water','inside the silence','behind the screen','along the avenue','past the last train','beyond the skyline'],
 hook:['Stay a little longer','Hold the signal steady','We are only passing through','Let the quiet carry us','Turn it up, let it bloom','Nothing here is lost','Follow the light home','This is how we glow']
};
const CHAP=['Cold open','What we got wrong','A small experiment','Listener questions','The long way round','One thing to try','Closing thoughts'];
const Lyrics={cache:{},idx:-1,lines:[],
 get(t){if(this.cache[t.id])return this.cache[t.id];let out;
  if(t.kind==='ep'){const n=6,step=(t.duration-30)/n;out=Array.from({length:n},(_,i)=>({t:15+i*step,text:`Chapter ${i+1}: ${CHAP[(hash(t.id)+i)%CHAP.length]}`}))}
  else{const r=rng('ly'+t.id),cap=s=>s[0].toUpperCase()+s.slice(1);
   const verse=()=>Array.from({length:4},()=>{const k=Math.floor(r()*3),S=pick(r,LY.subj),V=pick(r,LY.verb),P=pick(r,LY.place);return k===0?`${cap(S)} ${V} ${P}`:k===1?`Hold on, ${S} ${V}`:`${cap(P)}, ${S} ${V}`});
   const hk=LY.hook.slice().sort(()=>r()-.5).slice(0,4),br=[`${cap(pick(r,LY.subj))} ${pick(r,LY.verb)}`,'And we are still here'];
   const lines=['♪',...verse(),...hk,...verse(),...hk,...br,...hk],step=(t.duration-24)/(lines.length-1);
   out=lines.map((text,i)=>({t:i===0?0:8+(i-1)*step,text}))}
  return this.cache[t.id]=out},
 index(pos){const L=this.lines;let lo=0;for(let i=0;i<L.length;i++){if(L[i].t<=pos)lo=i;else break}return lo}
};

/* ---- charts (canvas) ---- */
const Charts={
 prep(c){const dpr=Math.min(2,window.devicePixelRatio||1),r=c.getBoundingClientRect(),w=Math.max(10,r.width),h=Math.max(10,r.height);c.width=w*dpr;c.height=h*dpr;const x=c.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);return{x,w,h}},
 heat(c,grid){if(!c)return;const{x,w,h}=this.prep(c),L=34,B=20,cw=(w-L)/24,ch=(h-B)/7,mx=Math.max(1,...grid.flat()),days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  x.clearRect(0,0,w,h);x.font='11px DM Sans, sans-serif';x.textBaseline='middle';
  const ac=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#9d8cff';
  for(let d=0;d<7;d++){x.fillStyle='#b9b4cc';x.textAlign='right';x.fillText(days[d],L-8,d*ch+ch/2);for(let hr=0;hr<24;hr++){const v=grid[d][hr]/mx;x.fillStyle='rgba(255,255,255,.06)';rr(x,L+hr*cw+1,d*ch+1,cw-2,ch-2,4);x.fill();if(v>0){x.globalAlpha=.25+.75*v;x.fillStyle=ac;rr(x,L+hr*cw+1,d*ch+1,cw-2,ch-2,4);x.fill();x.globalAlpha=1}}}
  x.fillStyle='#b9b4cc';x.textAlign='center';[0,6,12,18,23].forEach(hr=>x.fillText(hr===0?'12a':hr===12?'12p':hr<12?hr+'a':(hr-12)+'p',L+hr*cw+cw/2,h-8))},
 donut(c,data){if(!c)return;const{x,w,h}=this.prep(c),cx=w/2,cy=h/2,R=Math.min(w,h)/2-6,tot=data.reduce((a,d)=>a+d[1],0)||1;let a0=-Math.PI/2;x.clearRect(0,0,w,h);
  data.forEach(([g,v])=>{const a1=a0+v/tot*Math.PI*2;x.beginPath();x.arc(cx,cy,R,a0,a1-.02);x.arc(cx,cy,R*.62,a1-.02,a0,true);x.closePath();x.fillStyle=`hsl(${GMAP[g]?GMAP[g].hue:200} 70% 58%)`;x.fill();a0=a1});
  x.fillStyle='#f4f2fb';x.font='700 20px Orbitron, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(Math.round(tot/60)+'',cx,cy-6);x.font='12px DM Sans, sans-serif';x.fillStyle='#b9b4cc';x.fillText('minutes',cx,cy+14)}
};
function rr(x,a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()}

/* ===================== VIEWS ===================== */
function homeView(){
 const s=Store.get(),hr=new Date().getHours(),g=hr<5?'night':hr<12?'morning':hr<17?'afternoon':hr<22?'evening':'night';
 const mixes=Rec.dailyMixes(),disc=Rec.discover();
 const quick=[{nav:'#/liked',img:cover('liked',0,96),title:tr('liked'),kind:'liked',id:'0'},...mixes.map(m=>({nav:'#/mix/'+m.id,img:cover('mix',m.id,96),title:m.name,kind:'mix',id:m.id})),{nav:'#/mix/discover',img:cover('mix','discover',96),title:disc.name,kind:'mix',id:'discover'},{nav:'#/podcasts',img:cover('show','sh1',96),title:tr('podcasts'),kind:'show',id:'sh1'}];
 const recent=s.recent.map(T).filter(t=>t&&t.kind==='track').slice(0,12);
 const trending=CAT.tracks.slice().sort((a,b)=>b.plays-a.plays).slice(0,12);
 const news=CAT.albumList.slice().sort((a,b)=>(b.year*12+b.month)-(a.year*12+a.month)).slice(0,10);
 const recentHtml=recent.length?shelf(tr('recent'),recent.map(trackCard).join('')):shelf(tr('recent'),`<div class="shelf-empty">${empty('note','Nothing played yet','Your recent songs will land here. Start with a mix made for you.',`<button class="btn primary" type="button" data-act="play-entity" data-kind="mix" data-id="daily1">${ic('play')}Play Daily Mix 1</button>`)}</div>`);
 return{title:tr('home'),subs:['profile'],html:`<div class="page">
  <h1 class="greet">${esc(tr(g))}, ${esc(s.profile.name)}</h1>
  <div class="quick">${quick.map(q=>`<div class="qtile" tabindex="0" role="link" data-nav="${q.nav}" aria-label="${esc(q.title)}">${img(q.img,'q-cover')}<span class="q-t">${esc(q.title)}</span><button class="fab sm" type="button" data-act="play-entity" data-kind="${q.kind}" data-id="${q.id}" aria-label="Play ${esc(q.title)}">${ic('play')}</button></div>`).join('')}</div>
  ${recentHtml}
  ${shelf(tr('madeForYou'),[...mixes,disc].map(mixCard).join(''))}
  ${shelf(tr('trending'),trending.map(trackCard).join(''))}
  ${shelf(tr('newReleases'),news.map(albumCard).join(''))}
  <section class="shelf reveal"><div class="shelf-head"><h2 class="h2">${esc(tr('genres'))}</h2></div><div class="tiles">${GENRES.map(g=>tile({nav:'#/genre/'+g.id,img:cover('genre',g.id,160),title:g.name})).join('')}</div></section>
  <section class="shelf reveal"><div class="shelf-head"><h2 class="h2">${esc(tr('moods'))}</h2></div><div class="tiles">${MOODS.map(m=>tile({nav:'#/mood/'+m,img:cover('mood',m,160),title:m})).join('')}</div></section>
 </div>`};
}

const Search={q:'',f:'all',sel:-1,
 run(q){this.q=q;this.sel=-1;if(Router.cur.name!=='search'){Router.go('#/search'+(q?'/'+encodeURIComponent(q):''));return}
  try{history.replaceState(null,'','#/search'+(q?'/'+encodeURIComponent(q):''))}catch(e){}this.paint()},
 paint(){const el=$('#sr');if(el){el.innerHTML=this.html();$$('#sr .row:not(.head),#sr .card,#sr .top-res').forEach(e=>e.dataset.sr='1');Reveal.init(el)}},
 saveRecent(){const q=this.q.trim();if(!q||q.length<2)return;const s=Store.get();Store.set({searches:[q,...s.searches.filter(x=>x.toLowerCase()!==q.toLowerCase())].slice(0,8)})},
 find(q){const s=Store.get();
  const tracks=CAT.tracks.map(t=>({t,sc:Math.max(fuzzy(q,t.title),fuzzy(q,artistName(t))*.9,fuzzy(q,albumTitle(t))*.6,fuzzy(q,t.mood)*.4,fuzzy(q,GMAP[t.genre].name)*.4)})).filter(x=>x.sc>0).sort((a,b)=>b.sc-a.sc);
  const artists=CAT.artistList.map(a=>({a,sc:fuzzy(q,a.name)})).filter(x=>x.sc>0).sort((a,b)=>b.sc-a.sc);
  const albums=CAT.albumList.map(a=>({a,sc:Math.max(fuzzy(q,a.title),fuzzy(q,A(a.artistId).name)*.7)})).filter(x=>x.sc>0).sort((a,b)=>b.sc-a.sc);
  const pls=[...s.playlists.map(p=>({p,k:'playlist',sc:fuzzy(q,p.name)})),...Rec.build().all.map(m=>({p:m,k:'mix',sc:fuzzy(q,m.name)}))].filter(x=>x.sc>0).sort((a,b)=>b.sc-a.sc);
  const eps=EPS.map(e=>({e,sc:Math.max(fuzzy(q,e.title),fuzzy(q,SHOWS[e.albumId].name)*.8)})).filter(x=>x.sc>0).sort((a,b)=>b.sc-a.sc);
  return{tracks,artists,albums,pls,eps}},
 html(){const q=this.q.trim(),s=Store.get();
  if(!q){return `${s.searches.length?`<section class="shelf"><div class="shelf-head"><h2 class="h2">Recent searches</h2><button class="btn sm" type="button" data-act="sclear">Clear all</button></div><div class="chips">${s.searches.map(x=>`<span class="chip rs"><button type="button" data-act="srecent" data-q="${esc(x)}">${esc(x)}</button><button type="button" class="rs-x" data-act="srecent-rm" data-q="${esc(x)}" aria-label="Remove ${esc(x)} from recent searches">${ic('close')}</button></span>`).join('')}</div></section>`:''}
   <section class="shelf"><div class="shelf-head"><h2 class="h2">${esc(tr('genres'))}</h2></div><div class="tiles">${GENRES.map(g=>tile({nav:'#/genre/'+g.id,img:cover('genre',g.id,160),title:g.name})).join('')}</div></section>
   <section class="shelf"><div class="shelf-head"><h2 class="h2">${esc(tr('moods'))}</h2></div><div class="tiles">${MOODS.map(m=>tile({nav:'#/mood/'+m,img:cover('mood',m,160),title:m})).join('')}</div></section>`}
  const R=this.find(q),f=this.f,all=f==='all';
  const chips=[['all','All'],['songs','Songs'],['artists','Artists'],['albums','Albums'],['playlists','Playlists'],['podcasts','Podcasts']].map(([k,l])=>`<button class="chip" type="button" data-act="sfilter" data-f="${k}" aria-pressed="${f===k}">${l}</button>`).join('');
  const nTracks=all?4:20,tr_=R.tracks.slice(0,nTracks).map(x=>x.t);View.lists.search=tr_.map(t=>t.id);
  const none=!R.tracks.length&&!R.artists.length&&!R.albums.length&&!R.pls.length&&!R.eps.length;
  if(none)return `<div class="chips">${chips}</div>${empty('search',`No results for “${q}”`,'Check the spelling or try a different artist, song, or mood.')}`;
  let top='';
  if(all){const c=[R.tracks[0]&&{sc:R.tracks[0].sc,k:'t',v:R.tracks[0].t},R.artists[0]&&{sc:R.artists[0].sc+5,k:'a',v:R.artists[0].a},R.albums[0]&&{sc:R.albums[0].sc,k:'al',v:R.albums[0].a}].filter(Boolean).sort((a,b)=>b.sc-a.sc)[0];
   if(c){const t=c.k==='t'?c.v:null;const im=c.k==='a'?cover('artist',c.v.id,240):c.k==='al'?cover('album',c.v.id,240):trackCover(c.v,240);const title=c.k==='a'?c.v.name:c.v.title;const sub=c.k==='a'?'Artist':c.k==='al'?`${c.v.type} · ${A(c.v.artistId).name}`:`Song · ${artistName(c.v)}`;const nav=c.k==='a'?'#/artist/'+c.v.id:c.k==='al'?'#/album/'+c.v.id:'#/album/'+c.v.albumId;
    top=`<section class="shelf"><h2 class="h2">Top result</h2><div class="top-res" tabindex="0" role="link" data-nav="${nav}" ${t?`data-track="${t.id}"`:''} aria-label="${esc(title)}">${img(im,'tr-cover'+(c.k==='a'?' round':''),title)}<div><div class="tr-t">${esc(title)}</div><div class="tr-s">${esc(sub)}</div></div><button class="fab sm" type="button" data-act="play-entity" data-kind="${c.k==='a'?'artist':c.k==='al'?'album':'track'}" data-id="${c.v.id}" aria-label="Play ${esc(title)}">${ic('play')}</button></div></section>`}}
  const sec=(k,title,html)=>(all||f===k)&&html?`<section class="shelf"><h2 class="h2">${title}</h2>${html}</section>`:'';
  const songs=tr_.length?`<div class="tl">${tr_.map((t,i)=>trackRow(t,{i,list:'search'})).join('')}</div>`:'';
  const grid=(arr,fn,n)=>arr.length?`<div class="grid">${arr.slice(0,all?6:n).map(fn).join('')}</div>`:'';
  return `<div class="chips">${chips}</div>${top}${sec('songs','Songs',songs)}${sec('artists','Artists',grid(R.artists,x=>artistCard(x.a),24))}${sec('albums','Albums',grid(R.albums,x=>albumCard(x.a),24))}${sec('playlists','Playlists',grid(R.pls,x=>x.k==='mix'?mixCard(x.p):plCard(x.p),24))}${sec('podcasts','Podcast episodes',R.eps.length?`<div class="tl">${R.eps.slice(0,all?3:12).map((x,i)=>{View.lists.eps=R.eps.slice(0,12).map(y=>y.e.id);return trackRow(x.e,{i,list:'eps'})}).join('')}</div>`:'')}`}
};
function searchView(q){Search.q=q||'';Search.f='all';Search.sel=-1;return{title:'Search',html:`<div class="page"><div id="sr" aria-live="polite">${Search.html()}</div></div>`,mount(){const i=$('#q');if(i&&i.value!==Search.q)i.value=Search.q;Search.paint()}}}

function browseView(){return{title:tr('browse'),html:`<div class="page"><h1 class="greet">${esc(tr('browse'))}</h1>
 <section class="shelf"><div class="shelf-head"><h2 class="h2">Genres</h2></div><div class="tiles">${GENRES.map(g=>tile({nav:'#/genre/'+g.id,img:cover('genre',g.id,160),title:g.name})).join('')}</div></section>
 <section class="shelf"><div class="shelf-head"><h2 class="h2">${esc(tr('moods'))}</h2></div><div class="tiles">${MOODS.map(m=>tile({nav:'#/mood/'+m,img:cover('mood',m,160),title:m})).join('')}</div></section></div>`}}

function collectionView(kind,id){
 const g=kind==='genre'?GMAP[id]:null;if(kind==='genre'&&!g)return notFound();if(kind==='mood'&&!MOODS.includes(id))return notFound();
 const ids=entityTracks(kind,id),title=g?g.name:id,hue=g?g.hue:hash(id)%360;View.lists.main=ids;
 return{title,html:`<div class="page">${hero({img:cover(kind,id,360),hue,type:kind==='genre'?'Genre':'Mood',title,meta:`${plural(ids.length,'song')} · ${fmtLong(totalDur(ids))}`})}
 <div class="actions">${playBtn('main')}${shufBtn('main')}</div><div class="tl">${listHead()}${ids.map((i,n)=>trackRow(T(i),{i:n,list:'main'})).join('')}</div></div>`}}

function artistView(id){
 const a=CAT.artists[id];if(!a)return notFound('Artist not found');
 const ids=entityTracks('artist',id);View.lists.main=ids;const fol=Lib.isFollowing(id);
 const albums=a.albums.map(AL).sort((x,y)=>(y.year*12+y.month)-(x.year*12+x.month));
 return{title:a.name,subs:['followed'],html:`<div class="page">
  <header class="a-hero" style="--hh:hsl(${Math.round(a.hue)} 62% 36%)">${img(cover('artist',id,360),'a-bg')}<div class="a-fade"></div><div class="a-t"><p class="hero-type">Artist</p><h1 class="hero-h big">${esc(a.name)}</h1><p class="hero-m">${a.listeners.toLocaleString()} monthly listeners</p></div></header>
  <div class="actions">${playBtn('main')}${shufBtn('main')}<button class="btn${fol?' on':''}" type="button" data-act="follow" data-id="${id}" aria-pressed="${fol}">${fol?'Following':'Follow'}</button><button class="icon-btn" type="button" data-act="more" data-ctx="artist:${id}" aria-haspopup="menu" aria-label="More options">${ic('more')}</button></div>
  <section class="shelf"><h2 class="h2">Popular</h2><div class="tl pop">${ids.map((i,n)=>trackRow(T(i),{i:n,list:'main'})).join('')}</div>${ids.length>5?`<button class="btn sm" type="button" data-act="toggle-more">Show more</button>`:''}</section>
  ${shelf('Discography',albums.map(albumCard).join(''))}
  ${shelf('Fans also like',Rec.similarArtists(id).map(artistCard).join(''))}
  <section class="shelf about"><h2 class="h2">About</h2><div class="about-b"><p>${esc(a.bio)}</p><div class="chips">${a.genres.map(g=>`<a class="chip" href="#/genre/${g}">${esc(GMAP[g].name)}</a>`).join('')}</div></div></section></div>`}}

function albumView(id){
 const a=AL(id);if(!a)return notFound('Album not found');
 const ids=a.tracks.slice();View.lists.main=ids;const sv=Lib.isSaved(id);
 return{title:a.title,subs:['savedAlbums'],html:`<div class="page">${hero({img:cover('album',id,360),hue:a.hue,type:a.type,title:a.title,meta:`<a href="#/artist/${a.artistId}">${esc(A(a.artistId).name)}</a> · ${a.year} · ${plural(ids.length,'song')}, ${fmtLong(totalDur(ids))}`})}
 <div class="actions">${playBtn('main')}${shufBtn('main')}<button class="icon-btn big${sv?' on':''}" type="button" data-act="save-album" data-id="${id}" aria-pressed="${sv}" aria-label="${sv?'Remove from':'Save to'} your library">${ic(sv?'check':'plus')}</button>${dlBtn('album:'+id)}<button class="icon-btn" type="button" data-act="more" data-ctx="album:${id}" aria-haspopup="menu" aria-label="More options">${ic('more')}</button></div>
 <div class="tl">${listHead()}${ids.map((i,n)=>trackRow(T(i),{i:n,list:'main'})).join('')}</div>
 ${shelf('More by '+A(a.artistId).name,A(a.artistId).albums.filter(x=>x!==id).map(x=>albumCard(AL(x))).join('')||'<div class="shelf-empty"><p class="muted">This is their only release so far.</p></div>')}</div>`}}

function playlistView(id){
 const p=PL.get(id);if(!p)return notFound('Playlist not found','This playlist may have been deleted.');
 const ids=p.tracks.filter(T);View.lists.main=ids;const sug=Rec.suggest(ids,6);
 return{title:p.name,subs:['playlists'],html:`<div class="page">${hero({img:cover('playlist',id,360),hue:hash(p.seed)%360,type:p.public?'Public playlist':'Private playlist',title:p.name,meta:`${esc(Store.get().profile.name)} · ${plural(ids.length,'song')}${ids.length?', '+fmtLong(totalDur(ids)):''}${p.collab?' · Collaborative':''}`})}
 <div class="actions">${ids.length?playBtn('main')+shufBtn('main'):''}
  <button class="btn" type="button" data-act="pl-toggle" data-key="public" data-id="${id}" aria-pressed="${p.public}">${ic(p.public?'globe':'lock')}${p.public?'Public':'Private'}</button>
  <button class="btn${p.collab?' on':''}" type="button" data-act="pl-toggle" data-key="collab" data-id="${id}" aria-pressed="${p.collab}">${ic('users')}Collaborative</button>
  ${dlBtn('playlist:'+id)}
  <button class="icon-btn" type="button" data-act="pl-rename" data-id="${id}" aria-label="Rename playlist">${ic('edit')}</button>
  <button class="icon-btn" type="button" data-act="pl-regen" data-id="${id}" aria-label="Generate a new cover">${ic('dice')}</button>
  <button class="icon-btn" type="button" data-act="pl-dup" data-id="${id}" aria-label="Duplicate playlist">${ic('copy')}</button>
  <button class="icon-btn" type="button" data-act="pl-del" data-id="${id}" aria-label="Delete playlist">${ic('trash')}</button></div>
 ${ids.length?`<div class="tl" role="table" aria-label="Playlist tracks. Drag rows or press Alt plus arrow keys to reorder.">${listHead()}${ids.map((tid,n)=>trackRow(T(tid),{i:n,list:'main',plid:id,drag:'pl:'+id,rm:true})).join('')}</div>`:empty('note','This playlist is empty','Add songs from the suggestions below, or use “Add to playlist” on any track.')}
 <section class="shelf"><h2 class="h2">Songs to add</h2><div class="sugs">${sug.map(t=>`<div class="sug">${img(trackCover(t,96),'r-cover')}<div class="r-text"><div class="r-title">${esc(t.title)}</div><div class="r-sub">${esc(artistName(t))}</div></div><button class="btn sm" type="button" data-act="pl-add" data-id="${id}" data-t="${t.id}">${ic('plus')}Add</button></div>`).join('')}</div></section></div>`}}

function mixView(id){
 const m=Rec.mix(id);if(!m)return notFound('Mix not found');View.lists.main=m.ids;
 return{title:m.name,subs:[],html:`<div class="page">${hero({img:cover('mix',id,360),hue:m.hue,type:'Made for you',title:m.name,desc:esc(m.desc),meta:`${plural(m.ids.length,'song')} · ${fmtLong(totalDur(m.ids))}`})}
 <div class="actions">${playBtn('main')}${shufBtn('main')}<button class="btn" type="button" data-act="mix-save" data-id="${id}">${ic('plus')}Save as playlist</button></div>
 <div class="tl">${listHead()}${m.ids.map((t,n)=>trackRow(T(t),{i:n,list:'main'})).join('')}</div></div>`}}

function likedView(){
 const ids=Store.get().likes.filter(T);View.lists.main=ids;
 return{title:tr('liked'),subs:['likes'],html:`<div class="page">${hero({img:cover('liked',0,360),hue:268,type:'Playlist',title:tr('liked'),meta:`${esc(Store.get().profile.name)} · ${plural(ids.length,'song')}${ids.length?', '+fmtLong(totalDur(ids)):''}`})}
 ${ids.length?`<div class="actions">${playBtn('main')}${shufBtn('main')}</div><div class="tl">${listHead()}${ids.map((t,n)=>trackRow(T(t),{i:n,list:'main'})).join('')}</div>`:empty('heart','Songs you like will show up here','Tap the heart on any track to save it to your Liked Songs.','<a class="btn primary" href="#/browse">Find something to like</a>')}</div>`}}

function libraryView(){
 const s=Store.get(),tab=s.libTab,sort=s.libSort,grid=s.libView==='grid';let items=[];
 if(tab==='playlists'){items=[{pin:1,kind:'liked',id:'0',title:tr('liked'),sub:`Playlist · ${plural(s.likes.length,'song')}`,img:cover('liked',0),nav:'#/liked',ts:Infinity,by:s.profile.name},...s.playlists.map(p=>({kind:'playlist',id:p.id,title:p.name,sub:`Playlist · ${plural(p.tracks.length,'song')}`,img:cover('playlist',p.id),nav:'#/playlist/'+p.id,ts:p.updated,by:s.profile.name,attrs:`data-ctx="playlist:${p.id}"`})),...Rec.build().all.map(m=>({kind:'mix',id:m.id,title:m.name,sub:'Made for you',img:cover('mix',m.id),nav:'#/mix/'+m.id,ts:0,by:'Auralis'}))]}
 else if(tab==='albums')items=s.savedAlbums.filter(x=>AL(x.id)).map(x=>{const a=AL(x.id);return{kind:'album',id:a.id,title:a.title,sub:`${a.type} · ${A(a.artistId).name}`,img:cover('album',a.id),nav:'#/album/'+a.id,ts:x.ts,by:A(a.artistId).name,attrs:`data-ctx="album:${a.id}"`}});
 else if(tab==='artists')items=s.followed.filter(x=>A(x.id)).map(x=>{const a=A(x.id);return{kind:'artist',id:a.id,title:a.name,sub:'Artist',img:cover('artist',a.id),nav:'#/artist/'+a.id,ts:x.ts,by:a.name,round:true,attrs:`data-ctx="artist:${a.id}"`}});
 else{const ids=Object.keys(s.downloads).filter(T);View.lists.main=ids;}
 if(tab!=='downloads'){const cmp=sort==='alpha'?(a,b)=>a.title.localeCompare(b.title):sort==='creator'?(a,b)=>a.by.localeCompare(b.by)||a.title.localeCompare(b.title):(a,b)=>b.ts-a.ts;items.sort((a,b)=>(b.pin?1:0)-(a.pin?1:0)||cmp(a,b))}
 const tabs=[['playlists',tr('playlists')],['albums',tr('albums')],['artists',tr('artists')],['downloads',tr('downloads')]];
 const emptyMsg={albums:['Save albums you love','Tap the + on any album to keep it here.','<a class="btn primary" href="#/browse">Browse albums</a>'],artists:['Follow your favorite artists','Follow an artist and they’ll appear in your library.','<a class="btn primary" href="#/browse">Find artists</a>'],downloads:['Nothing downloaded yet','Download songs, albums or playlists to simulate offline listening.','<a class="btn primary" href="#/home">Pick something</a>']};
 let body='';
 if(tab==='downloads'){const ids=View.lists.main;body=ids.length?`<div class="tl">${listHead()}${ids.map((t,n)=>trackRow(T(t),{i:n,list:'main'})).join('')}</div>`:empty('download',...emptyMsg.downloads)}
 else if(!items.length)body=empty(tab==='albums'?'library':'user',...emptyMsg[tab]);
 else if(grid)body=`<div class="grid">${items.map(i=>card({kind:i.kind,id:i.id,title:i.title,sub:i.sub,img:i.img,nav:i.nav,round:i.round,attrs:i.attrs})).join('')}</div>`;
 else body=`<div class="lib-list">${items.map(i=>`<div class="lib-row" tabindex="0" role="link" data-nav="${i.nav}" ${i.attrs||''}>${img(i.img,'r-cover'+(i.round?' round':''))}<div class="r-text"><div class="r-title">${esc(i.title)}</div><div class="r-sub">${esc(i.sub)}</div></div><button class="fab sm static" type="button" data-act="play-entity" data-kind="${i.kind}" data-id="${i.id}" aria-label="Play ${esc(i.title)}">${ic('play')}</button></div>`).join('')}</div>`;
 return{title:tr('library'),subs:['playlists','savedAlbums','followed','libTab','libSort','libView','downloads','likes'],html:`<div class="page"><div class="lib-head"><h1 class="greet">${esc(tr('library'))}</h1><button class="btn primary" type="button" data-act="pl-new">${ic('plus')}${esc(tr('createPlaylist'))}</button></div>
 <div class="lib-bar"><div class="chips" role="tablist" aria-label="Library sections">${tabs.map(([k,l])=>`<button class="chip" role="tab" type="button" data-act="tab" data-tab="${k}" aria-selected="${tab===k}" aria-pressed="${tab===k}">${esc(l)}</button>`).join('')}</div>
 ${tab!=='downloads'?`<div class="lib-tools"><label class="sel"><span class="sr-only">Sort by</span><select data-in="libSort"><option value="recent"${sort==='recent'?' selected':''}>Recently added</option><option value="alpha"${sort==='alpha'?' selected':''}>Alphabetical</option><option value="creator"${sort==='creator'?' selected':''}>Creator</option></select></label>
 <div class="seg" role="group" aria-label="View"><button class="icon-btn" type="button" data-act="lib-view" data-v="grid" aria-pressed="${grid}" aria-label="Grid view">${ic('browse')}</button><button class="icon-btn" type="button" data-act="lib-view" data-v="list" aria-pressed="${!grid}" aria-label="List view">${ic('lyrics')}</button></div></div>`:''}</div>${body}</div>`}}

function podcastsView(){
 const s=Store.get(),prog=s.podcast.progress,cont=EPS.filter(e=>(prog[e.id]||0)>5&&prog[e.id]<e.duration-10),latest=EPS.slice().sort((a,b)=>b.ts-a.ts).slice(0,10);
 View.lists.eps=latest.map(e=>e.id);View.lists.cont=cont.map(e=>e.id);
 return{title:tr('podcasts'),subs:['podcast'],html:`<div class="page"><h1 class="greet">${esc(tr('podcasts'))}</h1>
 <div class="speed-bar" role="group" aria-label="Playback speed"><span class="muted">Playback speed</span>${[1,1.25,1.5,1.75,2].map(v=>`<button class="chip" type="button" data-act="set-speed" data-v="${v}" aria-pressed="${s.speed===v}">${v}×</button>`).join('')}</div>
 ${cont.length?`<section class="shelf"><h2 class="h2">Continue listening</h2><div class="tl">${cont.map((e,i)=>trackRow(e,{i,list:'cont'})).join('')}</div></section>`:''}
 ${shelf('Shows',Object.values(SHOWS).map(showCard).join(''))}
 <section class="shelf"><h2 class="h2">Latest episodes</h2><div class="tl">${latest.map((e,i)=>trackRow(e,{i,list:'eps'})).join('')}</div></section></div>`}}
function showView(id){
 const sh=SHOWS[id];if(!sh)return notFound('Show not found');const ids=entityTracks('show',id);View.lists.main=ids;const fol=Lib.isShowFollowed(id);
 return{title:sh.name,subs:['podcast'],html:`<div class="page">${hero({img:cover('show',id,360),hue:sh.hue,type:'Podcast',title:sh.name,desc:esc(sh.desc),meta:plural(ids.length,'episode')})}
 <div class="actions">${playBtn('main')}<button class="btn${fol?' on':''}" type="button" data-act="show-follow" data-id="${id}" aria-pressed="${fol}">${fol?'Following':'Follow'}</button>
 <div class="speed-bar" role="group" aria-label="Playback speed">${[1,1.25,1.5,1.75,2].map(v=>`<button class="chip" type="button" data-act="set-speed" data-v="${v}" aria-pressed="${Store.get().speed===v}">${v}×</button>`).join('')}</div></div>
 <div class="tl">${ids.map((e,n)=>trackRow(T(e),{i:n,list:'main'})).join('')}</div></div>`}}

function statsView(){
 const s=Store.get(),h=s.history;
 if(!h.length)return{title:tr('stats'),subs:['history'],html:`<div class="page"><h1 class="greet">${esc(tr('stats'))}</h1>${empty('stats','No listening history yet','Play a few songs and your top tracks, artists and listening habits will appear here.',`<button class="btn primary" type="button" data-act="seed-stats">${ic('spark')}Generate sample history</button>`)}</div>`};
 const by=fn=>{const m={};h.forEach(x=>{const t=CAT.tmap[x.id];if(!t)return;const k=fn(t);m[k]=(m[k]||0)+x.sec});return Object.entries(m).sort((a,b)=>b[1]-a[1])};
 const topT=by(t=>t.id).slice(0,5),topA=by(t=>t.artistId).slice(0,5),topG=by(t=>t.genre),total=h.reduce((a,x)=>a+x.sec,0);
 const grid=Array.from({length:7},()=>new Array(24).fill(0));h.forEach(x=>{const d=new Date(x.ts);grid[d.getDay()][d.getHours()]+=x.sec/60});
 const peak=(()=>{let b=0,bh=0;for(let hr=0;hr<24;hr++){const v=grid.reduce((a,r)=>a+r[hr],0);if(v>b){b=v;bh=hr}}return bh})();
 const pk=`${peak%12||12} ${peak<12?'AM':'PM'}`,mxA=topA[0]?topA[0][1]:1;
 return{title:tr('stats'),subs:['history'],mount(){const draw=()=>{Charts.heat($('#c-heat'),grid);Charts.donut($('#c-donut'),topG.slice(0,6))};draw();View.onResize=draw},
 html:`<div class="page"><h1 class="greet">${esc(tr('stats'))}</h1>
 <div class="stat-tiles"><div class="stat"><span class="stat-n">${Math.round(total/60).toLocaleString()}</span><span class="stat-l">minutes listened</span></div><div class="stat"><span class="stat-n">${h.length}</span><span class="stat-l">plays</span></div><div class="stat"><span class="stat-n">${new Set(h.map(x=>x.id)).size}</span><span class="stat-l">different songs</span></div><div class="stat"><span class="stat-n">${pk}</span><span class="stat-l">busiest hour</span></div></div>
 <div class="two"><section class="panel"><h2 class="h2">Top tracks</h2><ol class="top-list">${topT.map(([id,sec],i)=>{const t=T(id);return `<li><span class="top-n">${i+1}</span>${img(trackCover(t,96),'r-cover')}<div class="r-text"><a class="r-title" href="#/album/${t.albumId}">${esc(t.title)}</a><div class="r-sub">${esc(artistName(t))}</div></div><span class="muted">${Math.round(sec/60)} min</span></li>`}).join('')}</ol></section>
 <section class="panel"><h2 class="h2">Top artists</h2><ol class="top-list">${topA.map(([id,sec],i)=>`<li><span class="top-n">${i+1}</span>${img(cover('artist',id,96),'r-cover round')}<div class="r-text"><a class="r-title" href="#/artist/${id}">${esc(A(id).name)}</a><div class="bar"><i style="width:${(sec/mxA*100).toFixed(0)}%"></i></div></div><span class="muted">${Math.round(sec/60)} min</span></li>`).join('')}</ol></section></div>
 <div class="two"><section class="panel"><h2 class="h2">Listening by hour</h2><canvas id="c-heat" class="chart" role="img" aria-label="Heatmap of listening minutes by day of week and hour"></canvas></section>
 <section class="panel"><h2 class="h2">Top genres</h2><div class="donut-w"><canvas id="c-donut" class="chart sq" role="img" aria-label="Genre breakdown donut chart"></canvas><ul class="legend">${topG.slice(0,6).map(([g,v])=>`<li><i style="background:hsl(${GMAP[g].hue} 70% 58%)"></i>${esc(GMAP[g].name)}<span class="muted">${Math.round(v/total*100)}%</span></li>`).join('')}</ul></div></section></div></div>`}}

const fmtDb=v=>(v>0?'+':'')+(+v).toFixed(1);
function eqHTML(){const e=Store.get().eq;return `<div class="eq-presets" role="group" aria-label="Equalizer presets">${Object.keys(EQ_PRESETS).map(n=>`<button class="chip" type="button" data-act="eq-preset" data-p="${n}" aria-pressed="${e.preset===n}">${n}</button>`).join('')}</div>
 <div class="eq-bands">${EQ_FREQ.map((f,i)=>`<label class="eq-band"><span class="eq-db" data-eqdb="${i}">${fmtDb(e.gains[i])}</span><span class="eq-rot"><input type="range" min="-12" max="12" step="0.5" value="${e.gains[i]}" data-in="eq" data-b="${i}" aria-label="${EQ_LABEL[i]} hertz gain"></span><span class="eq-f">${EQ_LABEL[i]}</span></label>`).join('')}</div>`}
function settingsView(){
 const s=Store.get(),p=s.profile,sw=['#9d8cff','#5eead4','#fb7185','#fbbf24','#60a5fa','#f472b6'];
 const toggle=(k,label,desc,on)=>`<label class="set-row"><span><b>${label}</b><small>${desc}</small></span><input type="checkbox" class="switch" data-in="${k}" ${on?'checked':''}></label>`;
 return{title:tr('settings'),html:`<div class="page narrow"><h1 class="greet">${esc(tr('settings'))}</h1>
 <section class="panel"><h2 class="h2">Profile</h2><div class="prof"><img id="av-prev" class="avatar" src="${cover('avatar',p.avatar,240)}" alt="Your avatar"><div class="prof-f"><label class="field"><span>Display name</span><input type="text" data-in="name" value="${esc(p.name)}" maxlength="24" autocomplete="off"></label><button class="btn" type="button" data-act="avatar-new">${ic('dice')}New avatar</button></div></div>
  <div class="field"><span>Accent color</span><div class="swatches" role="group" aria-label="Accent color">${sw.map(c=>`<button class="swatch" type="button" data-act="accent" data-c="${c}" style="--c:${c}" aria-pressed="${p.accent.toLowerCase()===c}" aria-label="Accent ${c}"></button>`).join('')}<label class="swatch custom" title="Custom color"><input type="color" data-in="accent" value="${p.accent}" aria-label="Custom accent color"></label></div></div></section>
 <section class="panel"><h2 class="h2">Playback</h2>
  <label class="set-row col"><span><b>Crossfade</b><small>Blend the end of one song into the next</small></span><span class="range-w"><input type="range" min="0" max="12" step="1" value="${s.crossfade}" data-in="crossfade" aria-label="Crossfade seconds"><output id="cf-out">${s.crossfade?s.crossfade+' s':'Off'}</output></span></label>
  <label class="set-row"><span><b>Audio quality</b><small>Simulated: lower tiers roll off the highs</small></span><select data-in="quality">${Object.entries(QUALITY).map(([k,v])=>`<option value="${k}"${s.settings.quality===k?' selected':''}>${v.label}</option>`).join('')}</select></label></section>
 <section class="panel"><h2 class="h2">Equalizer</h2><div id="eq-host">${eqHTML()}</div><button class="btn sm" type="button" data-act="eq-preset" data-p="Flat">Reset to flat</button></section>
 <section class="panel"><h2 class="h2">Appearance & language</h2>${toggle('anim','Animations','Motion, particles and reveal effects',s.settings.anim)}${toggle('cursor','Custom cursor','A morphing cursor on mouse devices',s.settings.cursor)}
  <label class="set-row"><span><b>Language</b><small>Navigation and section titles</small></span><select data-in="lang">${LANGS.map(([k,l])=>`<option value="${k}"${s.settings.lang===k?' selected':''}>${l}</option>`).join('')}</select></label></section>
 <section class="panel"><h2 class="h2">More</h2><div class="row-btns"><a class="btn" href="#/stats">${ic('stats')}Listening stats</a><button class="btn" type="button" data-act="shortcuts">${ic('cmd')}Keyboard shortcuts</button><button class="btn danger" type="button" data-act="reset-data">${ic('trash')}Reset all data</button></div></section></div>`}}
