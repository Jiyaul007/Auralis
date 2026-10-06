'use strict';
/* Sliders, context menus, modals, command palette, router */
/* ===================== SLIDERS ===================== */
const Seek={drag:null,ratio:0,
 ratioOf(el,e){const rc=$('.track',el).getBoundingClientRect();return clamp((e.clientX-rc.left)/Math.max(1,rc.width),0,1)},
 down(el,e){if(e.button>0)return;this.drag={el,type:el.dataset.k};try{el.setPointerCapture(e.pointerId)}catch(_){}el.classList.add('dragging');this.ratio=this.ratioOf(el,e);if(this.drag.type==='vol')Player.setVolume(this.ratio);else UI.progress(true)},
 move(e){if(!this.drag)return;this.ratio=this.ratioOf(this.drag.el,e);if(this.drag.type==='vol')Player.setVolume(this.ratio);else UI.progress(true)},
 up(e){if(!this.drag)return;const d=this.drag;this.drag=null;d.el.classList.remove('dragging');if(d.type==='seek'){const t=Player.track;if(t)Player.seek(this.ratio*t.duration)}},
 tip(el,e){const t=Player.track,tip=$('#seektip');if(!t||!el){tip.classList.remove('show');return}const r=this.ratioOf(el,e);tip.textContent=fmt(r*t.duration);tip.style.left=e.clientX+'px';tip.style.top=(el.getBoundingClientRect().top-8)+'px';tip.classList.add('show')}
};

/* ===================== MENU / MODAL ===================== */
const Menu={el:null,opener:null,
 open(x,y,items,opener){this.close(true);const m=document.createElement('div');m.className='ctx glass';m.setAttribute('role','menu');
  m.innerHTML=items.map((it,i)=>it.sep?'<hr role="separator">':`<button type="button" role="menuitem" data-mi="${i}"${it.off?' disabled':''}>${it.icon?ic(it.icon):'<span class="ic"></span>'}<span>${esc(it.label)}</span></button>`).join('');
  document.body.appendChild(m);m._items=items;this.el=m;this.opener=opener||document.activeElement;
  const r=m.getBoundingClientRect();m.style.left=clamp(x,8,window.innerWidth-r.width-8)+'px';m.style.top=clamp(y,8,window.innerHeight-r.height-8)+'px';const b=$('button:not([disabled])',m);b&&b.focus({preventScroll:true})},
 close(quiet){if(!this.el)return;this.el.remove();this.el=null;if(!quiet&&this.opener&&this.opener.focus&&document.body.contains(this.opener))try{this.opener.focus({preventScroll:true})}catch(_){}},
 key(e){const bs=$$('button:not([disabled])',this.el),i=bs.indexOf(document.activeElement);if(e.key==='ArrowDown'){e.preventDefault();bs[(i+1)%bs.length].focus()}else if(e.key==='ArrowUp'){e.preventDefault();bs[(i-1+bs.length)%bs.length].focus()}else if(e.key==='Escape'||e.key==='Tab'){e.preventDefault();this.close()}}
};
const Modal={stack:[],
 open(o){const ov=document.createElement('div');ov.className='overlay';ov.innerHTML=`<div class="modal glass ${o.cls||''}" role="dialog" aria-modal="true" ${o.title?'aria-labelledby="mt'+this.stack.length+'"':'aria-label="Dialog"'}>${o.title?`<div class="m-head"><h2 id="mt${this.stack.length}" class="h2">${esc(o.title)}</h2>${o.locked?'':`<button class="icon-btn" type="button" data-act="modal-close" aria-label="Close">${ic('close')}</button>`}</div>`:''}<div class="m-body">${o.body}</div></div>`;
  document.body.appendChild(ov);const m={el:ov,body:$('.m-body',ov),opener:document.activeElement,locked:!!o.locked,onClose:o.onClose,close:()=>Modal.close(m)};this.stack.push(m);
  const f=$('[autofocus],input,textarea,select,button:not([data-act=modal-close])',ov)||$('button',ov);f&&setTimeout(()=>f.focus({preventScroll:true}),30);o.onOpen&&o.onOpen(m);return m},
 close(m){m=m||this.stack[this.stack.length-1];if(!m)return;this.stack=this.stack.filter(x=>x!==m);m.el.remove();if(m.onClose)m.onClose();if(m.opener&&m.opener.focus&&document.body.contains(m.opener))try{m.opener.focus({preventScroll:true})}catch(_){}},
 top(){return this.stack[this.stack.length-1]},
 trap(e){const m=this.top();if(!m)return;const f=$$('button:not([disabled]),input,select,textarea,a[href],[tabindex="0"]',m.el).filter(x=>x.offsetParent!==null);if(!f.length)return;const a=f[0],b=f[f.length-1];if(e.shiftKey&&document.activeElement===a){e.preventDefault();b.focus()}else if(!e.shiftKey&&document.activeElement===b){e.preventDefault();a.focus()}},
 prompt({title,label,value='',cta='Save',onOk}){const m=this.open({title,body:`<form class="m-form"><label class="field"><span>${esc(label)}</span><input type="text" name="v" value="${esc(value)}" maxlength="60" autocomplete="off" autofocus></label><div class="m-act"><button class="btn" type="button" data-act="modal-close">Cancel</button><button class="btn primary" type="submit">${esc(cta)}</button></div></form>`});
  $('form',m.el).addEventListener('submit',e=>{e.preventDefault();const v=$('input',m.el).value.trim();m.close();onOk(v)});const i=$('input',m.el);i&&i.select()},
 confirm({title,msg,cta='Confirm',danger,onOk}){const m=this.open({title,body:`<p class="muted">${esc(msg)}</p><div class="m-act"><button class="btn" type="button" data-act="modal-close">Cancel</button><button class="btn ${danger?'danger':'primary'}" type="button" id="cf-ok">${esc(cta)}</button></div>`});$('#cf-ok',m.el).addEventListener('click',()=>{m.close();onOk()})}
};
function addToPlaylistModal(ids){
 const pls=Store.get().playlists;
 const m=Modal.open({title:'Add to playlist',body:`<div class="pick-list"><button class="pick-row" type="button" data-pk="new">${ic('plus')}<span>New playlist</span></button>${pls.map(p=>`<button class="pick-row" type="button" data-pk="${p.id}">${img(cover('playlist',p.id,64),'r-cover')}<span>${esc(p.name)}</span><small class="muted">${plural(p.tracks.length,'song')}</small></button>`).join('')}</div>`});
 m.el.addEventListener('click',e=>{const b=e.target.closest('[data-pk]');if(!b)return;const k=b.dataset.pk;m.close();if(k==='new')Modal.prompt({title:'New playlist',label:'Name',cta:'Create',onOk:v=>{const p=PL.create(v,ids);Toast.show(`Created “${p.name}”`)}});else PL.add(k,ids)});
}
function shareModal(kind,id){
 const base=location.href.split('#')[0],link=`${base}#/${kind}/${id}`;
 const m=Modal.open({title:'Share',body:`<p class="muted">Anyone with this link can open it in Auralis.</p><div class="share-row"><input id="share-in" type="text" readonly value="${esc(link)}" aria-label="Share link"><button class="btn primary" type="button" id="share-cp">${ic('copy')}Copy link</button></div>`});
 $('#share-cp',m.el).addEventListener('click',async()=>{const inp=$('#share-in',m.el);let ok=false;try{await navigator.clipboard.writeText(link);ok=true}catch(e){try{inp.select();ok=document.execCommand('copy')}catch(_){}}Toast.show(ok?'Link copied':'Press Ctrl+C to copy the selected link')});
}
const SHORTCUTS=[['Space','Play / pause'],['← / →','Seek 5 seconds'],['Shift + ← / →','Previous / next track'],['↑ / ↓','Volume'],['M','Mute'],['L','Like current song'],['S','Shuffle'],['R','Repeat'],['F','Full-screen player'],['Q','Queue panel'],['/','Focus search'],['Ctrl / ⌘ + K','Command palette'],['Alt + ↑ / ↓','Reorder focused row'],['?','This list'],['Esc','Close overlay']];
const shortcutsModal=()=>Modal.open({title:'Keyboard shortcuts',body:`<dl class="keys">${SHORTCUTS.map(([k,d])=>`<div><dt>${k.split(' + ').map(x=>`<kbd>${esc(x)}</kbd>`).join('+')}</dt><dd>${d}</dd></div>`).join('')}</dl>`});
const sleepModal=()=>{const m=Modal.open({title:'Sleep timer',body:`<div class="pick-list">${[[15,'15 minutes'],[30,'30 minutes'],[60,'60 minutes'],['end','End of this track'],[0,'Turn off']].map(([v,l])=>`<button class="pick-row" type="button" data-sl="${v}">${ic(v===0?'close':'moon')}<span>${l}</span></button>`).join('')}</div>`});
 m.el.addEventListener('click',e=>{const b=e.target.closest('[data-sl]');if(!b)return;const v=b.dataset.sl;m.close();Player.setSleep(v==='end'?'end':+v)})};
const eqModal=()=>Modal.open({title:'Equalizer',cls:'wide',body:`<div id="eq-host">${eqHTML()}</div>`});
function togetherModal(){
 const on=Store.get()._together;
 const m=Modal.open({title:'Listen together',body:`<p class="muted">Sync playback with other Auralis tabs in this browser. Start a session, then open the app in a second tab — play, pause, seek and track changes follow along.</p>
 <p class="tg-state"><span class="dot${on?' live':''}"></span><span id="tg-line">${on?`Session live · <b id="tg-count">${Together.count()}</b> listening`:'Not in a session'}</span></p>
 <div class="m-act"><button class="btn" type="button" id="tg-open">Open another tab</button><button class="btn primary" type="button" id="tg-toggle">${on?'Leave session':'Start session'}</button></div>`});
 $('#tg-open',m.el).addEventListener('click',()=>{try{window.open(location.href,'_blank')}catch(e){}});
 $('#tg-toggle',m.el).addEventListener('click',()=>{if(Store.get()._together)Together.stop();else Together.start();m.close()});
}
function onboarding(){
 const picks={genres:[],artists:[]};let step=0;
 const m=Modal.open({title:'Welcome to Auralis',locked:true,cls:'wide',body:'<div id="ob"></div>'});
 const draw=()=>{const b=$('#ob',m.el);
  if(step===0)b.innerHTML=`<p class="muted">Pick 3 genres you enjoy. We’ll use them to build your first mixes.</p><div class="pick-grid">${GENRES.map(g=>`<button class="pick" type="button" data-ob="g" data-v="${g.id}" aria-pressed="${picks.genres.includes(g.id)}">${img(cover('genre',g.id,96),'pick-img')}<span>${esc(g.name)}</span></button>`).join('')}</div>`;
  else if(step===1)b.innerHTML=`<p class="muted">Now pick 3 artists.</p><div class="pick-grid">${CAT.artistList.map(a=>`<button class="pick" type="button" data-ob="a" data-v="${a.id}" aria-pressed="${picks.artists.includes(a.id)}">${img(cover('artist',a.id,96),'pick-img round')}<span>${esc(a.name)}</span></button>`).join('')}</div>`;
  else b.innerHTML=`<label class="field"><span>What should we call you?</span><input id="ob-name" type="text" maxlength="24" value="${esc(Store.get().profile.name==='Listener'?'':Store.get().profile.name)}" placeholder="Your name" autocomplete="off"></label>`;
  const need=step<2?3:0,have=step===0?picks.genres.length:step===1?picks.artists.length:0;
  b.insertAdjacentHTML('beforeend',`<div class="m-act"><button class="btn" type="button" data-ob="skip">Skip for now</button><button class="btn primary" type="button" data-ob="next"${have<need?' disabled':''}>${step===2?'Start listening':`Next${need?` (${have}/3)`:''}`}</button></div>`)};
 const finish=skip=>{const name=($('#ob-name',m.el)||{}).value;const p=Store.get().profile;Store.set({profile:{...p,onboarded:true,name:(name&&name.trim())||p.name,seeds:skip?p.seeds:{genres:picks.genres,artists:picks.artists}}});m.close();Toast.show(skip?'You can tune your taste anytime by liking songs':'Your mixes are ready');Router.refresh()};
 m.el.addEventListener('click',e=>{const b=e.target.closest('[data-ob]');if(!b)return;const k=b.dataset.ob;
  if(k==='g'||k==='a'){const arr=k==='g'?picks.genres:picks.artists,v=b.dataset.v,i=arr.indexOf(v);if(i>=0)arr.splice(i,1);else if(arr.length<3)arr.push(v);draw();const nb=$(`[data-ob="${k}"][data-v="${v}"]`,m.el);nb&&nb.focus()}
  else if(k==='next'){if(step<2){step++;draw()}else finish(false)}else if(k==='skip')finish(true)});
 draw();
}

/* ---- context menus ---- */
function menuItemsFor(el){
 const near=el.closest('[data-ctx],[data-track]');if(!near)return null;const s=Store.get(),items=[];
 if(near.dataset.ctx){const[k,id]=near.dataset.ctx.split(':');
  if(k==='album'){const sv=Lib.isSaved(id);items.push({label:'Play',icon:'play',fn:()=>Player.loadList(entityTracks('album',id),0)},{label:'Add to queue',icon:'queue',fn:()=>entityTracks('album',id).forEach(t=>Player.enqueue(t))},{label:sv?'Remove from library':'Save to library',icon:sv?'check':'plus',fn:()=>Lib.toggleAlbum(id)},{label:Downloads.isDone('album:'+id)?'Remove download':'Download',icon:'download',fn:()=>Downloads.toggle('album:'+id)},{sep:1},{label:'Go to artist',icon:'user',fn:()=>Router.go('#/artist/'+AL(id).artistId)},{label:'Share',icon:'share',fn:()=>shareModal('album',id)})}
  else if(k==='artist'){const f=Lib.isFollowing(id);items.push({label:'Play top songs',icon:'play',fn:()=>Player.loadList(entityTracks('artist',id),0)},{label:f?'Unfollow':'Follow',icon:'user',fn:()=>Lib.toggleFollow(id)},{label:'Share',icon:'share',fn:()=>shareModal('artist',id)})}
  else if(k==='playlist'){const p=PL.get(id);if(!p)return null;items.push({label:'Play',icon:'play',off:!p.tracks.length,fn:()=>Player.loadList(p.tracks,0)},{label:'Rename',icon:'edit',fn:()=>Actions['pl-rename']({dataset:{id}})},{label:'Duplicate',icon:'copy',fn:()=>{const n=PL.duplicate(id);if(n)Router.go('#/playlist/'+n.id)}},{label:p.public?'Make private':'Make public',icon:p.public?'lock':'globe',fn:()=>PL.toggle(id,'public')},{label:Downloads.isDone('playlist:'+id)?'Remove download':'Download',icon:'download',fn:()=>Downloads.toggle('playlist:'+id)},{label:'Share',icon:'share',fn:()=>shareModal('playlist',id)},{sep:1},{label:'Delete',icon:'trash',fn:()=>PL.del(id)})}
  else if(k==='show'){const f=Lib.isShowFollowed(id);items.push({label:'Play latest',icon:'play',fn:()=>Player.loadList(entityTracks('show',id),0)},{label:f?'Unfollow':'Follow',icon:'user',fn:()=>Lib.toggleShow(id)})}
  return items}
 const id=near.dataset.track,t=T(id);if(!t)return null;const liked=s.likes.includes(id),ep=t.kind==='ep';
 items.push({label:'Play',icon:'play',fn:()=>Player.loadList([id],0)},{label:'Play next',icon:'queue',fn:()=>Player.enqueue(id,'next')},{label:'Add to queue',icon:'plus',fn:()=>Player.enqueue(id)},{sep:1});
 if(!ep)items.push({label:liked?'Remove from Liked Songs':'Save to Liked Songs',icon:liked?'heart-fill':'heart',fn:()=>Lib.toggleLike(id)},{label:'Add to playlist…',icon:'plus',fn:()=>addToPlaylistModal([id])});
 const row=el.closest('[data-plid]');if(row)items.push({label:'Remove from this playlist',icon:'trash',fn:()=>PL.remove(row.dataset.plid,+row.dataset.i)});
 const qi=near.dataset.qi;if(qi!==undefined&&+qi!==s.qIndex){const i=+qi;items.push({label:'Move up in queue',icon:'up',off:i<=s.qIndex+1,fn:()=>Player.moveQueue(i,i-1)},{label:'Move down in queue',icon:'down',off:i>=s.queue.length-1,fn:()=>Player.moveQueue(i,i+1)},{label:'Remove from queue',icon:'close',fn:()=>Player.removeFromQueue(i)})}
 items.push({sep:1},{label:ep?'Go to show':'Go to artist',icon:'user',fn:()=>Router.go(`#/${ep?'show':'artist'}/${t.artistId}`)});if(!ep)items.push({label:'Go to album',icon:'library',fn:()=>Router.go('#/album/'+t.albumId)});
 items.push({label:Downloads.isDone('track:'+id)?'Remove download':'Download',icon:'download',fn:()=>Downloads.toggle('track:'+id)},{label:'Share',icon:'share',fn:()=>shareModal('track',id)});
 return items;
}
function openMenuAt(el,x,y){const items=menuItemsFor(el);if(items)Menu.open(x,y,items,el)}

/* ===================== COMMAND PALETTE ===================== */
const Palette={open(){
 const cmds=[['Go to Home','home',()=>Router.go('#/home')],['Search','search',()=>{Router.go('#/search');setTimeout(()=>{const q=$('#q');q&&q.focus()},60)}],['Browse genres & moods','browse',()=>Router.go('#/browse')],['Your Library','library',()=>Router.go('#/library')],['Liked Songs','heart',()=>Router.go('#/liked')],['Podcasts','podcast',()=>Router.go('#/podcasts')],['Listening stats','stats',()=>Router.go('#/stats')],['Settings','settings',()=>Router.go('#/settings')],
  ['Play / pause','play',()=>Player.toggle()],['Next track','next',()=>Player.next()],['Previous track','prev',()=>Player.prev()],['Toggle shuffle','shuffle',()=>Player.toggleShuffle()],['Cycle repeat','repeat',()=>Player.cycleRepeat()],['Toggle mute','mute',()=>Player.toggleMute()],['Open full-screen player','expand',()=>UI.setFS(true)],['Toggle queue panel','queue',()=>Actions['queue-toggle']()],['Open equalizer','eq',()=>eqModal()],['Sleep timer','moon',()=>sleepModal()],['Toggle mini-player mode','mini',()=>Actions.mini()],['Toggle floating widget','mini',()=>Actions.float()],['Create playlist','plus',()=>Actions['pl-new']()],['Listen together','users',()=>togetherModal()],['Keyboard shortcuts','cmd',()=>shortcutsModal()]];
 const m=Modal.open({cls:'palette',body:`<div class="pal"><input id="pal-in" type="text" role="combobox" aria-expanded="true" aria-controls="pal-list" aria-label="Command palette" placeholder="Type a command, song, artist or album…" autocomplete="off" autofocus><ul id="pal-list" role="listbox"></ul></div>`});
 const inp=$('#pal-in',m.el),list=$('#pal-list',m.el);let items=[],sel=0;
 const render=()=>{const q=inp.value.trim();let r=cmds.map(([l,i,fn])=>({l,i,fn,sc:q?fuzzy(q,l):1})).filter(x=>x.sc>0).sort((a,b)=>b.sc-a.sc).slice(0,q?6:12);
  if(q.length>=2){const S=Search.find(q);S.tracks.slice(0,4).forEach(x=>r.push({l:x.t.title,sub:'Song · '+artistName(x.t),i:'note',fn:()=>Player.loadList([x.t.id],0)}));S.artists.slice(0,3).forEach(x=>r.push({l:x.a.name,sub:'Artist',i:'user',fn:()=>Router.go('#/artist/'+x.a.id)}));S.albums.slice(0,3).forEach(x=>r.push({l:x.a.title,sub:'Album',i:'library',fn:()=>Router.go('#/album/'+x.a.id)}))}
  items=r;sel=clamp(sel,0,Math.max(0,r.length-1));list.innerHTML=r.length?r.map((x,k)=>`<li role="option" id="po${k}" data-k="${k}" aria-selected="${k===sel}" class="${k===sel?'on':''}">${ic(x.i)}<span>${esc(x.l)}</span>${x.sub?`<small class="muted">${esc(x.sub)}</small>`:''}</li>`).join(''):'<li class="muted pad">No matches</li>';inp.setAttribute('aria-activedescendant',r.length?'po'+sel:'')};
 const run=k=>{const x=items[k];if(!x)return;m.close();setTimeout(()=>x.fn(),30)};
 inp.addEventListener('input',()=>{sel=0;render()});
 inp.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();sel=(sel+1)%Math.max(1,items.length);render();$('.on',list)&&$('.on',list).scrollIntoView({block:'nearest'})}else if(e.key==='ArrowUp'){e.preventDefault();sel=(sel-1+items.length)%Math.max(1,items.length);render();$('.on',list)&&$('.on',list).scrollIntoView({block:'nearest'})}else if(e.key==='Enter'){e.preventDefault();run(sel)}});
 list.addEventListener('click',e=>{const li=e.target.closest('[data-k]');if(li)run(+li.dataset.k)});render();
}};

/* ===================== ROUTER / VIEW ===================== */
const Router={routes:[],cur:{name:'home',params:{}},token:0,t:null,
 add(pattern,name,fn){const keys=[];const re=new RegExp('^'+pattern.replace(/:([a-z]+)/g,(_,k)=>{keys.push(k);return'([^/]+)'})+'/?$');this.routes.push({re,keys,name,fn})},
 go(h){if(location.hash===h)this.resolve();else location.hash=h},
 start(){window.addEventListener('hashchange',()=>this.resolve());this.resolve()},
 refresh(){Router.resolve(true)},
 resolve(refresh){const path=(location.hash.replace(/^#/,'')||'/home').split('?')[0];let r=null,m=null;for(const rt of this.routes){m=rt.re.exec(path);if(m){r=rt;break}}
  if(!r){r=this.routes[this.routes.length-1];m=[]}
  const params={};r.keys.forEach((k,i)=>params[k]=decodeURIComponent(m[i+1]||''));const tok=++this.token;this.cur={name:r.name,params};
  View.cleanup();UI.syncNav();Menu.close(true);
  const go=()=>{if(tok!==this.token)return;let out;View.lists={};try{out=r.fn(params)}catch(e){console.error(e);out=notFound('Something went wrong','That page failed to load. Try going home.')}if(out&&out.html!==undefined)View.mount(out,!!refresh)};
  clearTimeout(this.t);if(refresh){go();return}View.skeleton(r.name);this.t=setTimeout(go,Motion.on?150:0)}
};
View.cleanup=()=>{View.subs.forEach(f=>f());View.subs=[];View.onResize=null;Reveal.kill()};
View.skeleton=name=>{const sk=n=>Array.from({length:n},()=>'<div class="sk card-sk"></div>').join('');$('#view').innerHTML=name==='home'||name==='browse'||name==='library'||name==='podcasts'?`<div class="page"><div class="sk sk-h"></div><div class="grid">${sk(6)}</div></div>`:`<div class="page"><div class="sk sk-hero"></div>${Array.from({length:6},()=>'<div class="sk sk-row"></div>').join('')}</div>`};
View.mount=(out,refresh)=>{const v=$('#view'),main=$('#main'),st=main.scrollTop;
 // re-run builders that fill View.lists happen inside out.html creation; keep them
 v.innerHTML=out.html;const pg=v.firstElementChild;if(pg&&!refresh&&Motion.on)pg.classList.add('page-in');
 document.title=(Player.track&&engine.playing?'▶ ':'')+(out.title?out.title+' · ':'')+'Auralis';
 if(refresh)main.scrollTop=st;else{main.scrollTop=0;const a=document.activeElement;if(!a||a.id!=='q'){try{main.focus({preventScroll:true})}catch(_){}}}
 (out.subs||[]).length&&View.subs.push(Store.on(out.subs,()=>Router.refresh()));
 Reveal.init(v);UI.after();if(out.mount)out.mount(v);UI.syncCur()};
