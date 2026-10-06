'use strict';
/* ============================================================
   AURALIS — single-file generative music streaming app
   Modules: Utils · Catalog · Art · Store · AudioEngine · Player ·
   Recommender · Router · UI (views, menus, modals) · Services
   ============================================================ */

/* ===================== UTILS ===================== */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const fmt=s=>{s=Math.max(0,Math.floor(s||0));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return h?`${h}:${String(m).padStart(2,'0')}:${String(x).padStart(2,'0')}`:`${m}:${String(x).padStart(2,'0')}`};
const fmtLong=s=>{const m=Math.round(s/60);return m>=60?`${Math.floor(m/60)} hr ${m%60} min`:`${m} min`};
const fmtNum=n=>n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?Math.round(n/1e3)+'K':String(n);
const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
const rng=seed=>{let a=typeof seed==='number'?seed:hash(String(seed));return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
const pick=(r,arr)=>arr[Math.floor(r()*arr.length)];
const shuffleArr=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const debounce=(fn,ms)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)}};
const uid=p=>p+Math.random().toString(36).slice(2,9);
const dayKey=()=>new Date().toISOString().slice(0,10);
const ic=(n,cls='')=>`<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const lev=(a,b)=>{const m=a.length,n=b.length;let p=Array.from({length:n+1},(_,i)=>i);for(let i=1;i<=m;i++){const c=[i];for(let j=1;j<=n;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c}return p[n]};
function fuzzy(q,t){q=q.toLowerCase().trim();t=t.toLowerCase();if(!q)return 0;const i=t.indexOf(q);if(i>=0)return 100-Math.min(i,40)*.5+(i===0?20:0);
  let best=0;const th=q.length<4?0:q.length<7?1:2;if(th){for(const w of t.split(/[\s&]+/)){const d=lev(q,w.slice(0,q.length+1));if(d<=th)best=Math.max(best,60-d*15)}}
  if(best)return best;
  let qi=0,gaps=0,last=-1;for(let k=0;k<t.length&&qi<q.length;k++){if(t[k]===q[qi]){if(last>=0)gaps+=k-last-1;last=k;qi++}}
  return qi===q.length&&q.length>=3?Math.max(5,40-gaps):0}

/* ===================== I18N ===================== */
const I18N={
en:{home:'Home',search:'Search',browse:'Browse',library:'Your Library',liked:'Liked Songs',stats:'Listening stats',settings:'Settings',podcasts:'Podcasts',morning:'Good morning',afternoon:'Good afternoon',evening:'Good evening',night:'Good night',recent:'Recently played',madeForYou:'Made for you',trending:'Trending now',newReleases:'New releases',genres:'Browse all',moods:'Moods & moments',queue:'Queue',nowPlaying:'Now playing',createPlaylist:'Create playlist',upNext:'Up next',searchPh:'Search songs, artists, albums…',playlists:'Playlists',albums:'Albums',artists:'Artists',downloads:'Downloads',me:'Profile'},
es:{home:'Inicio',search:'Buscar',browse:'Explorar',library:'Tu biblioteca',liked:'Canciones que te gustan',stats:'Estadísticas',settings:'Ajustes',podcasts:'Pódcasts',morning:'Buenos días',afternoon:'Buenas tardes',evening:'Buenas noches',night:'Buenas noches',recent:'Reproducido recientemente',madeForYou:'Hecho para ti',trending:'Tendencias',newReleases:'Novedades',genres:'Explorar todo',moods:'Estados de ánimo',queue:'Cola',nowPlaying:'Reproduciendo',createPlaylist:'Crear lista',upNext:'A continuación',searchPh:'Buscar canciones, artistas, álbumes…',playlists:'Listas',albums:'Álbumes',artists:'Artistas',downloads:'Descargas',me:'Perfil'},
fr:{home:'Accueil',search:'Rechercher',browse:'Parcourir',library:'Votre bibliothèque',liked:'Titres likés',stats:'Statistiques',settings:'Réglages',podcasts:'Podcasts',morning:'Bonjour',afternoon:'Bon après-midi',evening:'Bonsoir',night:'Bonne nuit',recent:'Écoutés récemment',madeForYou:'Conçu pour vous',trending:'Tendances',newReleases:'Nouveautés',genres:'Tout parcourir',moods:'Ambiances',queue:'File d’attente',nowPlaying:'En lecture',createPlaylist:'Créer une playlist',upNext:'À suivre',searchPh:'Titres, artistes, albums…',playlists:'Playlists',albums:'Albums',artists:'Artistes',downloads:'Téléchargements',me:'Profil'},
de:{home:'Start',search:'Suchen',browse:'Entdecken',library:'Deine Bibliothek',liked:'Lieblingssongs',stats:'Hörstatistik',settings:'Einstellungen',podcasts:'Podcasts',morning:'Guten Morgen',afternoon:'Guten Tag',evening:'Guten Abend',night:'Gute Nacht',recent:'Zuletzt gehört',madeForYou:'Für dich gemacht',trending:'Im Trend',newReleases:'Neuerscheinungen',genres:'Alles durchsuchen',moods:'Stimmungen',queue:'Warteschlange',nowPlaying:'Läuft gerade',createPlaylist:'Playlist erstellen',upNext:'Als Nächstes',searchPh:'Songs, Künstler, Alben suchen…',playlists:'Playlists',albums:'Alben',artists:'Künstler',downloads:'Downloads',me:'Profil'},
hi:{home:'होम',search:'खोजें',browse:'ब्राउज़',library:'आपकी लाइब्रेरी',liked:'पसंदीदा गाने',stats:'सुनने के आँकड़े',settings:'सेटिंग्स',podcasts:'पॉडकास्ट',morning:'सुप्रभात',afternoon:'नमस्कार',evening:'शुभ संध्या',night:'शुभ रात्रि',recent:'हाल ही में सुना',madeForYou:'आपके लिए',trending:'ट्रेंडिंग',newReleases:'नई रिलीज़',genres:'सब देखें',moods:'मूड',queue:'कतार',nowPlaying:'अभी बज रहा है',createPlaylist:'प्लेलिस्ट बनाएँ',upNext:'आगे',searchPh:'गाने, कलाकार, एल्बम खोजें…',playlists:'प्लेलिस्ट',albums:'एल्बम',artists:'कलाकार',downloads:'डाउनलोड',me:'प्रोफ़ाइल'}
};
const LANGS=[['en','English'],['es','Español'],['fr','Français'],['de','Deutsch'],['hi','हिन्दी']];
let LANG='en';
const tr=k=>(I18N[LANG]||I18N.en)[k]||I18N.en[k]||k;

/* ===================== CATALOG ===================== */
const NOTE=['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
const SCALES={major:[0,2,4,5,7,9,11],minor:[0,2,3,5,7,8,10],dorian:[0,2,3,5,7,9,10],phrygian:[0,1,3,5,7,8,10],lydian:[0,2,4,6,7,9,11],mixolydian:[0,2,4,5,7,9,10],pentMin:[0,3,5,7,10],pentMaj:[0,2,4,7,9]};
const SCALE_LABEL={major:'major',minor:'minor',dorian:'dorian',phrygian:'phrygian',lydian:'lydian',mixolydian:'mixolydian',pentMin:'minor pent.',pentMaj:'major pent.'};
const MOODS=['Chill','Energetic','Dreamy','Focus','Melancholy','Uplifting','Dark','Romantic'];
const GENRES=[
 {id:'synthwave',name:'Synthwave',hue:305,bpm:[98,124],moods:['Energetic','Dreamy','Dark'],scales:['minor','dorian']},
 {id:'lofi',name:'Lo-Fi',hue:32,bpm:[68,84],moods:['Chill','Focus','Melancholy'],scales:['dorian','major','pentMin']},
 {id:'ambient',name:'Ambient',hue:190,bpm:[60,78],moods:['Dreamy','Focus','Chill'],scales:['lydian','major','dorian']},
 {id:'techno',name:'Techno',hue:262,bpm:[124,136],moods:['Energetic','Dark','Focus'],scales:['minor','phrygian']},
 {id:'acoustic',name:'Acoustic',hue:96,bpm:[80,108],moods:['Romantic','Uplifting','Melancholy'],scales:['major','pentMaj','dorian']},
 {id:'jazz',name:'Midnight Jazz',hue:218,bpm:[92,126],moods:['Romantic','Chill','Melancholy'],scales:['dorian','mixolydian','minor']},
 {id:'hiphop',name:'Boom Bap',hue:350,bpm:[80,96],moods:['Dark','Energetic','Focus'],scales:['minor','pentMin']},
 {id:'futurebass',name:'Future Bass',hue:162,bpm:[138,150],moods:['Uplifting','Energetic','Dreamy'],scales:['major','lydian','minor']}
];
const GMAP=Object.fromEntries(GENRES.map(g=>[g.id,g]));
/* per-genre generative recipe template (steps are 16ths) */
const GEN={
 synthwave:{k:[0,4,8,12],s:[4,12],h:[0,2,4,6,8,10,12,14],bass:[0,2,4,6,8,10,12,14],bw:'sawtooth',lw:'sawtooth',pw:'sawtooth',arp:2,sw:0,lp:2600,seventh:false},
 lofi:{k:[0,10],s:[4,12],h:[2,6,10,14],bass:[0,6,10],bw:'triangle',lw:'triangle',pw:'triangle',arp:4,sw:.2,lp:1500,seventh:true},
 ambient:{k:[],s:[],h:[],bass:[0],bw:'sine',lw:'sine',pw:'sine',arp:8,sw:0,lp:2000,seventh:true},
 techno:{k:[0,4,8,12],s:[12],h:[2,6,10,14],bass:[2,6,10,14],bw:'sawtooth',lw:'square',pw:'sawtooth',arp:1,sw:0,lp:1900,seventh:false},
 acoustic:{k:[0],s:[8],h:[],bass:[0,8],bw:'triangle',lw:'triangle',pw:'triangle',arp:2,sw:.06,lp:3600,seventh:false},
 jazz:{k:[0,8],s:[],h:[0,3,6,8,11,14],bass:[0,4,8,12],bw:'sine',lw:'triangle',pw:'sine',arp:3,sw:.3,lp:2800,seventh:true},
 hiphop:{k:[0,6,10],s:[4,12],h:[0,2,4,6,8,10,12,14],bass:[0,6,10],bw:'sine',lw:'square',pw:'triangle',arp:4,sw:.14,lp:1700,seventh:false},
 futurebass:{k:[0,10],s:[8],h:[0,2,4,6,8,10,12,14],bass:[0,3,6,8,11],bw:'sawtooth',lw:'sawtooth',pw:'sawtooth',arp:2,sw:0,lp:3800,seventh:false,sup:true}
};
const WORDS={
 synthwave:[['Neon','Chrome','Midnight','Laser','Electric','Turbo','Crimson','Digital'],['Highway','Skyline','Horizon','Overdrive','Mirage','Arcade','Sunset','Pulse']],
 lofi:[['Rainy','Sleepy','Soft','Paper','Warm','Quiet','Faded','Window'],['Afternoon','Notebook','Coffee','Cassette','Blanket','Balcony','Streetlight','Daydream']],
 ambient:[['Glass','Tidal','Slow','Weightless','Silver','Distant','Hollow','Aurora'],['Drift','Cathedral','Bloom','Currents','Horizons','Echoes','Orbit','Mist']],
 techno:[['Concrete','Binary','Iron','Strobe','Warehouse','Grid','Voltage','Kinetic'],['Ritual','Engine','Tunnel','Circuit','Signal','Machine','Basement','Cycle']],
 acoustic:[['Golden','Wild','Kindled','Harvest','Barefoot','Evergreen','Open','Willow'],['Road','Orchard','Letters','Porch','River','Lantern','Meadow','Home']],
 jazz:[['Blue','Smoky','Velvet','Late','Moonlit','Amber','Quiet','Slow'],['Corner','Quartet','Lounge','Waltz','Alley','Standard','Hour','Serenade']],
 hiphop:[['Dusty','Backroom','Vinyl','Corner','Heavy','Midtown','Golden','Rooftop'],['Sermon','Ledger','Cipher','Hustle','Tape','Block','Story','Loop']],
 futurebass:[['Prism','Shatter','Skyward','Glitter','Afterglow','Lucid','Cloud','Rapture'],['Bloom','Drop','Fever','Spark','Wave','Halo','Rush','Fragments']]
};
const ARTISTS_SRC=[
 ['Velvet Circuit','synthwave','futurebass','Analog romantics building cinematic night-drive anthems from vintage-style synth patches.'],
 ['Moonlit Static','lofi','ambient','A bedroom producer stitching tape hiss and soft keys into slow, rainy-day loops.'],
 ['Halcyon Fields','ambient','acoustic','Long-form soundscapes imagined in empty halls and open meadows.'],
 ['Kilo Meridian','techno','synthwave','Warehouse-minded techno built on tight grooves and restless basslines.'],
 ['Juniper Hollow','acoustic','lofi','Fingerpicked songs for porches, road trips and quiet kitchens.'],
 ['The Blue Quorum','jazz','lofi','A rotating quartet playing late-night standards that never quite end.'],
 ['Dust & Cadence','hiphop','jazz','Boom-bap with dusty drums, wandering bass and plenty of room to think.'],
 ['Prism Harbor','futurebass','synthwave','Bright, bruised and bursting drops engineered for the open sky.'],
 ['Nova Lantern','synthwave','futurebass','Glowing leads and big gated drums from a duo obsessed with sunsets.'],
 ['Paper Satellites','lofi','acoustic','Hand-me-down loops and warm guitar orbiting a sleepy beat.'],
 ['Ora Vance','ambient','jazz','Mood pieces that quietly turn into slow jazz by the third minute.'],
 ['Static Orchard','techno','hiphop','Dark, swinging machine music with a streak of street-corner swagger.']
];
const ALBUM_ARTISTS=[0,0,1,2,2,3,4,5,6,7,8,9,10,11,1,3];
const PF=['Mira','Jonas','Ines','Tobias','Leila','Cass','Arlo','Noor','Piper','Rafael','Sana','Dex'],PL_=['Okafor','Lindqvist','Marlowe','Vega','Hartwell','Sato','Delacroix','Brandt','Quill','Moreau','Ashby','Kerr'];

function makeRecipe(t,gm){
 const r=rng('rec:'+t.id),cfg=GEN[t.genre];
 const sc=pick(r,gm.scales),scale=SCALES[sc],pc=Math.floor(r()*12),len=scale.length;
 const progs=[[0,5,3,4],[0,3,4,0],[5,3,0,4],[0,4,5,3],[0,2,3,4],[0,5,1,4]];
 const prog=pick(r,progs).map(d=>d%len);
 const alt=['sine','triangle','square','sawtooth'];
 const lw=r()<.7?cfg.lw:pick(r,alt);
 const grid=pick(r,[2,2,4,1]);
 const phrase=()=>{const p=new Array(16).fill(-1);let d=pick(r,[0,2,4])+len;for(let s=0;s<16;s+=grid){if(r()<.62){d+=pick(r,[-2,-1,-1,0,1,1,2]);d=clamp(d,3,len*2);p[s]=d}}return p};
 const A_=phrase(),B_=phrase();
 const mel=[...A_,...A_.map(v=>v>=0&&r()<.2?v+1:v),...A_,...B_];
 const arp=pick(r,[[0,2,4,7,4,2],[0,4,2,7],[0,2,4,2],[7,4,2,0,2,4,7,9]]);
 return{kind:'syn',gen:t.genre,pc,sc,scale,bpm:t.bpm,prog,lw,mel,grid,arp,seventh:cfg.seventh,base:30+pc};
}

const CAT=(()=>{
 const artists={},albums={},tracks=[],tmap={},used=new Set();
 ARTISTS_SRC.forEach(([name,g1,g2,bio],i)=>{const id='a'+(i+1),r=rng('artist'+id);
  artists[id]={id,kind:'artist',name,genres:[g1,g2],bio,listeners:Math.floor(180000+Math.pow(r(),1.6)*9e6),hue:GMAP[g1].hue+(r()*30-15),albums:[]}});
 const title=(g,r)=>{const [X,Y]=WORDS[g];for(let k=0;k<40;k++){const t=pick(r,X)+' '+pick(r,Y);if(!used.has(t)){used.add(t);return t}}return pick(r,X)+' '+pick(r,Y)+' II'};
 const person=r=>pick(r,PF)+' '+pick(r,PL_);
 ALBUM_ARTISTS.forEach((ai,i)=>{
  const aid='a'+(ai+1),a=artists[aid],id='al'+(i+1),r=rng('album'+id),g=a.genres[0],n=i<12?5:4;
  const year=2026-(i%6),month=1+Math.floor(r()*12),hue=GMAP[g].hue+(r()*40-20);
  albums[id]={id,kind:'album',title:title(g,r),artistId:aid,year,month,hue,genre:g,tracks:[],type:n===4?'EP':'Album'};
  a.albums.push(id);
  for(let k=0;k<n;k++){
   const tid='t'+(tracks.length+1),tr_=rng('track'+tid),tg=tr_()<.72?a.genres[0]:a.genres[1],gm=GMAP[tg];
   const t={id:tid,kind:'track',title:title(tg,tr_),artistId:aid,albumId:id,genre:tg,bpm:Math.round(gm.bpm[0]+tr_()*(gm.bpm[1]-gm.bpm[0])),mood:pick(tr_,gm.moods),year,duration:Math.round(150+tr_()*115),plays:Math.floor(20000+Math.pow(tr_(),2.4)*8e6),hue:hue+(tr_()*24-12),credit:{writer:person(tr_),producer:person(tr_),mixer:person(tr_)}};
   t.recipe=makeRecipe(t,gm);t.key=NOTE[t.recipe.pc]+' '+SCALE_LABEL[t.recipe.sc];
   tracks.push(t);tmap[tid]=t;albums[id].tracks.push(tid);
  }
 });
 return{artists,albums,tracks,tmap,albumList:Object.values(albums),artistList:Object.values(artists)};
})();

const SHOWS={
 sh1:{id:'sh1',kind:'show',name:'The Quiet Hour',hue:200,desc:'Slow conversations about attention, sleep and making room in a loud world.'},
 sh2:{id:'sh2',kind:'show',name:'Signal & Noise',hue:280,desc:'Weekly takes on how music and technology keep reshaping each other.'},
 sh3:{id:'sh3',kind:'show',name:'Deep Cuts',hue:20,desc:'Producers walk through one track, one decision at a time.'},
 sh4:{id:'sh4',kind:'show',name:'Night Shift Stories',hue:330,desc:'Short fiction read for the hours between midnight and dawn.'}
};
const EP_TITLES=[
 ['Where did the morning go?','On doing one thing at a time','The case for boring evenings','Sleep is a skill','A walk without headphones'],
 ['Why every playlist sounds the same','The loudness war, revisited','Inside a generative score','Tape hiss as a texture','What an algorithm can’t hear'],
 ['Building a bassline from silence','The snare that changed a chorus','Ten minutes on one chord','Arranging for an empty room','Mixing with your eyes closed'],
 ['The lighthouse keeper’s radio','Last train to Harbor Street','A city that hums at 3 a.m.','The vending machine oracle','Morning, eventually']
];
const EPS=[],EMAP={};
EP_TITLES.forEach((list,si)=>list.forEach((title,k)=>{
 const sid='sh'+(si+1),id='e'+(EPS.length+1),r=rng('ep'+id),d=new Date(2026,8,30-(k*6+si*2+1));
 const e={id,kind:'ep',title,artistId:sid,albumId:sid,genre:'podcast',bpm:0,mood:'Spoken',year:2026,duration:Math.round(900+r()*1500),plays:0,hue:SHOWS[sid].hue+(r()*20-10),date:d.toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'}),ts:d.getTime(),recipe:{kind:'pod',f0:95+Math.floor(r()*110)},desc:`Episode ${5-k} of ${SHOWS[sid].name}. ${SHOWS[sid].desc}`};
 EPS.push(e);EMAP[id]=e;
}));
const T=id=>CAT.tmap[id]||EMAP[id]||null;
const A=id=>CAT.artists[id]||SHOWS[id]||null;
const AL=id=>CAT.albums[id]||null;
const artistName=t=>{const a=A(t.artistId);return a?a.name:'Unknown'};
const albumTitle=t=>t.kind==='ep'?SHOWS[t.albumId].name:CAT.albums[t.albumId].title;
const trackHue=t=>t.hue;

/* ===================== ART (procedural covers) ===================== */
const Art=(()=>{
 const cache=new Map();
 const hsl=(h,s,l,a=1)=>`hsla(${((Math.round(h)%360)+360)%360},${s}%,${l}%,${a})`;
 const PX='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
 function make(key,o={}){
  const size=o.size||240,h=o.hue!=null?o.hue:hash(key)%360,ck=key+'|'+size+'|'+Math.round(h);
  if(cache.has(ck))return cache.get(ck);
  let url=PX;
  try{
   const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d'),S=size,r=rng('art'+key);
   const style=o.style!=null?o.style:hash(key)%5;
   const bg=x.createLinearGradient(0,0,S,S);bg.addColorStop(0,hsl(h,55,14));bg.addColorStop(1,hsl(h+45,65,28));x.fillStyle=bg;x.fillRect(0,0,S,S);
   if(style===0){for(let i=0;i<6;i++){const cx=r()*S,cy=r()*S,rad=S*(.18+r()*.4),g=x.createRadialGradient(cx,cy,0,cx,cy,rad),hh=h+r()*90-20;g.addColorStop(0,hsl(hh,85,62,.9));g.addColorStop(1,hsl(hh,85,50,0));x.fillStyle=g;x.beginPath();x.arc(cx,cy,rad,0,7);x.fill()}}
   else if(style===1){const cx=S*(.3+r()*.4),cy=S*(.3+r()*.4);for(let i=14;i>0;i--){x.beginPath();x.arc(cx,cy,i*S*.065,0,7);x.fillStyle=hsl(h+i*9,75,i%2?55:20);x.fill()}}
   else if(style===2){x.save();x.translate(S/2,S/2);x.rotate((r()-.5)*1.2);x.translate(-S/2,-S/2);const n=6+Math.floor(r()*6);for(let i=-2;i<n+2;i++){x.fillStyle=hsl(h+i*14,70,18+((i*37%5+5)%5+3)*7);x.fillRect(-S,i*S/n,S*3,S/n+1)}x.restore()}
   else if(style===3){const n=9+Math.floor(r()*5),cs=S/n;for(let i=0;i<n;i++)for(let j=0;j<n;j++){const d=Math.hypot(i-n/2+.5,j-n/2+.5)/(n/2),rad=cs*.5*Math.max(0,1-Math.min(1,d))*(.4+r()*.8)+1;x.fillStyle=hsl(h+d*60,80,62-d*25);x.beginPath();x.arc((i+.5)*cs,(j+.5)*cs,rad,0,7);x.fill()}}
   else{for(let k=0;k<6;k++){x.beginPath();x.moveTo(0,S);const amp=S*(.05+r()*.12),f=1+r()*3,ph=r()*6,base=S*(.25+k*.12);for(let px=0;px<=S;px+=4)x.lineTo(px,base+Math.sin(px/S*f*6.283+ph)*amp);x.lineTo(S,S);x.closePath();x.fillStyle=hsl(h+k*16,75,26+k*7,.88);x.fill()}}
   const vg=x.createRadialGradient(S/2,S/2,S*.2,S/2,S/2,S*.82);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.38)');x.fillStyle=vg;x.fillRect(0,0,S,S);
   for(let i=0;i<S*4;i++){x.fillStyle=r()<.5?'rgba(255,255,255,.045)':'rgba(0,0,0,.06)';x.fillRect(r()*S,r()*S,1,1)}
   if(o.text){x.fillStyle='rgba(255,255,255,.88)';x.font='700 '+Math.round(S*.46)+'px Orbitron, DM Sans, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(o.text,S/2,S/2+S*.02)}
   url=c.toDataURL('image/jpeg',.86)||PX;
  }catch(e){url=PX}
  cache.set(ck,url);return url;
 }
 return{make};
})();

/* ===================== STORE (state + pub/sub + persistence) ===================== */
const KEY='auralis.v1';
const DEFAULTS=()=>({
 profile:{name:'Listener',avatar:'a1',accent:'#9d8cff',onboarded:false,seeds:{genres:[],artists:[]}},
 likes:[],playlists:[],savedAlbums:[],followed:[],downloads:{},recent:[],history:[],searches:[],
 queue:[],qIndex:-1,origQueue:null,currentId:null,position:0,volume:.8,muted:false,shuffle:false,repeat:'off',speed:1,crossfade:0,
 eq:{preset:'Flat',gains:[0,0,0,0,0,0,0,0,0,0]},
 settings:{quality:'high',anim:true,lang:'en',cursor:true,viz:'bars'},
 podcast:{progress:{},followed:[]},
 libView:'grid',libSort:'recent',libTab:'playlists',
 ui:{right:true,sb:null,float:false,fx:null,fy:null},
 _playing:false,_route:'home',_sleep:null,_together:false,_dlp:{},_rp:'now',_fs:false,_mini:false
});
const isObj=v=>v&&typeof v==='object'&&!Array.isArray(v);
const mergeInto=(d,s)=>{for(const k in d){if(!(k in s))continue;if(isObj(d[k])&&isObj(s[k])&&Object.keys(d[k]).length)d[k]=mergeInto(d[k],s[k]);else d[k]=s[k]}return d};
const Store=(()=>{
 let state=DEFAULTS(),subs=[],saveT=null,mem=null;
 try{const raw=localStorage.getItem(KEY);if(raw){const p=JSON.parse(raw);if(isObj(p))state=mergeInto(DEFAULTS(),p)}}catch(e){}
 for(const k of Object.keys(state))if(k[0]==='_')state[k]=DEFAULTS()[k];
 const strip=()=>{const o={};for(const k in state)if(k[0]!=='_')o[k]=state[k];return o};
 function flush(){clearTimeout(saveT);saveT=null;let data;try{data=JSON.stringify(strip())}catch(e){return}try{localStorage.setItem(KEY,data)}catch(e){mem=data}}
 function save(){clearTimeout(saveT);saveT=setTimeout(flush,300)}
 return{
  get:()=>state,
  set(patch,o={}){const keys=Object.keys(patch);for(const k of keys)state[k]=patch[k];if(keys.some(k=>k[0]!=='_'))save();if(o.silent)return;
   for(const s of subs.slice()){if(s.keys==='*'||keys.some(k=>s.keys.includes(k))){try{s.fn(keys)}catch(e){console.error(e)}}}},
  on(keys,fn){const s={keys,fn};subs.push(s);return()=>{subs=subs.filter(x=>x!==s)}},
  flush,
  reset(){try{localStorage.removeItem(KEY)}catch(e){}state=DEFAULTS();mem=null}
 };
})();
LANG=Store.get().settings.lang||'en';
