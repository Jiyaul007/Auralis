'use strict';
/* Actions, event handling, keyboard shortcuts, routes, app init */
/* ===================== ACTIONS ===================== */
const setAccent=c=>{const p=Store.get().profile;Store.set({profile:{...p,accent:c}},{silent:true});Theme.accent(c);$$('.swatch[data-c]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.c.toLowerCase()===c.toLowerCase()))};
const Actions={
 row(el){const list=el.dataset.list,i=+el.dataset.i,ids=View.lists[list],id=el.dataset.track;
  if(Store.get().currentId===id&&engine.track){Player.toggle();return}
  if(ids&&ids[i]===id)Player.loadList(ids,i);else Player.loadList([id],0)},
 'play-entity'(el){const ids=entityTracks(el.dataset.kind,el.dataset.id);if(!ids.length){Toast.show('Nothing to play here yet');return}Player.loadList(ids,0)},
 'play-list'(el){const ids=View.lists[el.dataset.list]||[];if(!ids.length)return;if(el.dataset.shuffle)Player.playList(ids,{shuffle:true});else Player.loadList(ids,0)},
 like(el){if(!el.dataset.id)return;Lib.toggleLike(el.dataset.id);UI.pop(el)},
 more(el){const r=el.getBoundingClientRect();openMenuAt(el,r.left,r.bottom+4)},
 shelf(el){const row=$('.shelf-row',el.closest('.shelf'));row&&row.scrollBy({left:+el.dataset.dir*row.clientWidth*.85,behavior:Motion.on?'smooth':'auto'})},
 toggle(){Player.toggle()},prev(){Player.prev()},next(){Player.next()},shuffle(){Player.toggleShuffle()},repeat(){Player.cycleRepeat()},mute(){Player.toggleMute()},
 speed(el){const r=el.getBoundingClientRect(),cur=Store.get().speed;Menu.open(r.left,r.top-210,[0.5,0.75,1,1.25,1.5,1.75,2].map(v=>({label:v+'×'+(v===cur?'  ✓':''),icon:'speed',fn:()=>Player.setSpeed(v)})),el);Menu.el.style.top=Math.max(8,r.top-Menu.el.offsetHeight-8)+'px';Menu.el.style.left=clamp(r.left-40,8,window.innerWidth-Menu.el.offsetWidth-8)+'px'},
 'set-speed'(el){Player.setSpeed(+el.dataset.v);$$('[data-act=set-speed]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.v===Store.get().speed))},
 sleep(){sleepModal()},
 'queue-toggle'(){const s=Store.get();if(s.ui.right&&s._rp==='queue')Store.set({ui:{...s.ui,right:false}});else Store.set({_rp:'queue',ui:{...s.ui,right:true}})},
 lyrics(){UI.setFS(true)},'fs-open'(){UI.setFS(true)},'fs-close'(){UI.setFS(false)},
 viz(el){const s=Store.get();Store.set({settings:{...s.settings,viz:el.dataset.m}});$$('[data-act=viz]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.m===el.dataset.m));const st=$('#fs-stage');if(st)st.dataset.viz=el.dataset.m},
 float(){const s=Store.get();if(s._mini){Actions.mini();return}Store.set({ui:{...s.ui,float:!s.ui.float}})},
 mini(){const s=Store.get();Store.set({_mini:!s._mini});renderMini();UI.applyLayout()},
 'eq-open'(){eqModal()},
 'rp-tab'(el){Store.set({_rp:el.dataset.tab})},'rp-close'(){const s=Store.get();Store.set({ui:{...s.ui,right:false}})},
 'q-play'(el){Player.playIndex(+el.dataset.i)},'q-rm'(el){Player.removeFromQueue(+el.dataset.i)},'q-clear'(){Player.clearQueue()},
 'ly-seek'(el){Player.seek(+el.dataset.t)},
 follow(el){Lib.toggleFollow(el.dataset.id);const on=Lib.isFollowing(el.dataset.id);$$(`[data-act=follow][data-id="${el.dataset.id}"]`).forEach(b=>{b.textContent=on?'Following':'Follow';b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)})},
 'show-follow'(el){Lib.toggleShow(el.dataset.id)},
 'save-album'(el){Lib.toggleAlbum(el.dataset.id)},
 download(el){Downloads.toggle(el.dataset.dk)},
 'pl-new'(){Modal.prompt({title:'Create playlist',label:'Playlist name',cta:'Create',onOk:v=>{const p=PL.create(v);Router.go('#/playlist/'+p.id)}})},
 'pl-rename'(el){const p=PL.get(el.dataset.id);if(!p)return;Modal.prompt({title:'Rename playlist',label:'Playlist name',value:p.name,onOk:v=>{PL.rename(p.id,v)}})},
 'pl-del'(el){const p=PL.get(el.dataset.id);if(!p)return;Modal.confirm({title:'Delete playlist?',msg:`“${p.name}” will be removed from your library. You can undo right after.`,cta:'Delete',danger:true,onOk:()=>PL.del(p.id)})},
 'pl-dup'(el){const n=PL.duplicate(el.dataset.id);if(n)Router.go('#/playlist/'+n.id)},
 'pl-toggle'(el){PL.toggle(el.dataset.id,el.dataset.key)},
 'pl-regen'(el){PL.regen(el.dataset.id)},
 'pl-add'(el){PL.add(el.dataset.id,[el.dataset.t])},
 'pl-rm'(el){PL.remove(el.dataset.id,+el.dataset.i)},
 'mix-save'(el){const m=Rec.mix(el.dataset.id);if(!m)return;const p=PL.create(m.name,m.ids);Toast.show(`Saved as “${p.name}”`);Router.go('#/playlist/'+p.id)},
 'toggle-more'(el){const tl=el.closest('.shelf').querySelector('.tl');const on=tl.classList.toggle('expanded');el.textContent=on?'Show less':'Show more'},
 sfilter(el){Search.f=el.dataset.f;Search.paint()},
 srecent(el){const q=el.dataset.q;const i=$('#q');if(i)i.value=q;Search.run(q)},
 'srecent-rm'(el){const s=Store.get();Store.set({searches:s.searches.filter(x=>x!==el.dataset.q)});Search.paint()},
 sclear(){Store.set({searches:[]});Search.paint()},
 tab(el){Store.set({libTab:el.dataset.tab})},'lib-view'(el){Store.set({libView:el.dataset.v})},
 accent(el){setAccent(el.dataset.c)},
 'avatar-new'(){const p=Store.get().profile;Store.set({profile:{...p,avatar:uid('a')}},{silent:true});const im=$('#av-prev');if(im)im.src=cover('avatar',Store.get().profile.avatar,240);renderTopbar()},
 'eq-preset'(el){const n=el.dataset.p,g=EQ_PRESETS[n].slice();Store.set({eq:{preset:n,gains:g}},{silent:true});engine.setEQ(g);$$('[data-in=eq]').forEach(i=>{i.value=g[+i.dataset.b]});$$('[data-eqdb]').forEach(e=>e.textContent=fmtDb(g[+e.dataset.eqdb]));$$('[data-act=eq-preset]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.p===n))},
 'reset-data'(){Modal.confirm({title:'Reset all data?',msg:'This clears your playlists, likes, history and settings on this device. It can’t be undone.',cta:'Reset everything',danger:true,onOk:()=>{engine.stop();Store.reset();location.hash='#/home';location.reload()}})},
 shortcuts(){shortcutsModal()},palette(){Palette.open()},together(){togetherModal()},
 'profile-menu'(el){const r=el.getBoundingClientRect();Menu.open(r.right-220,r.bottom+6,[{label:'Profile & settings',icon:'settings',fn:()=>Router.go('#/settings')},{label:'Listening stats',icon:'stats',fn:()=>Router.go('#/stats')},{label:'Keyboard shortcuts',icon:'cmd',fn:()=>shortcutsModal()},{label:'Mini-player mode',icon:'mini',fn:()=>Actions.mini()}],el)},
 back(){history.back()},fwd(){history.forward()},
 'sb-toggle'(){const s=Store.get(),c=document.body.classList.contains('sb-collapsed');Store.set({ui:{...s.ui,sb:!c}})},
 'modal-close'(){const m=Modal.top();if(m&&!m.locked)m.close()},
 'seed-stats'(){const r=rng('seed'+Date.now()),now=Date.now(),h=[];const pool=CAT.tracks;for(let i=0;i<180;i++){const t=pool[Math.floor(Math.pow(r(),1.6)*pool.length)],d=new Date(now-Math.floor(r()*30)*864e5),hr=pick(r,[7,8,9,13,14,18,21,22,22,23,0]);d.setHours(hr,Math.floor(r()*60));h.push({id:t.id,ts:d.getTime(),sec:Math.round(t.duration*(.4+r()*.6))})}Store.set({history:h.concat(Store.get().history).slice(-2000)});Toast.show('Sample history added')}
};
const Inputs={
 name(el){const p=Store.get().profile;Store.set({profile:{...p,name:el.value.slice(0,24)||'Listener'}},{silent:true});const im=$('#av-prev');if(im)im.src=cover('avatar',p.avatar,240);renderTopbar()},
 accent(el){setAccent(el.value)},
 crossfade(el){const v=+el.value;Store.set({crossfade:v},{silent:true});const o=$('#cf-out');if(o)o.textContent=v?v+' s':'Off'},
 quality(el){const s=Store.get();Store.set({settings:{...s.settings,quality:el.value}},{silent:true});engine.setQuality(QUALITY[el.value].lp)},
 lang(el){const s=Store.get();LANG=el.value;Store.set({settings:{...s.settings,lang:el.value}});renderSidebar();renderTopbar();renderTabbar();Router.refresh()},
 anim(el){const s=Store.get();Store.set({settings:{...s.settings,anim:el.checked}});Motion.apply()},
 cursor(el){const s=Store.get();Store.set({settings:{...s.settings,cursor:el.checked}});Cursor.apply()},
 libSort(el){Store.set({libSort:el.value})},
 eq(el){const g=Store.get().eq.gains.slice(),b=+el.dataset.b;g[b]=+el.value;Store.set({eq:{preset:'Custom',gains:g}},{silent:true});engine.setEQ(g);$$(`[data-eqdb="${b}"]`).forEach(e=>e.textContent=fmtDb(g[b]));$$('[data-in=eq][data-b="'+b+'"]').forEach(i=>{if(i!==el)i.value=g[b]});$$('[data-act=eq-preset]').forEach(x=>x.setAttribute('aria-pressed','false'))}
};

/* ===================== EVENTS ===================== */
let lpT=null,lpFired=false;
document.addEventListener('click',e=>{
 if(lpFired){lpFired=false;e.preventDefault();return}
 const tg=e.target;
 if(Menu.el){const mi=tg.closest&&tg.closest('[data-mi]');if(mi&&Menu.el.contains(mi)){const it=Menu.el._items[+mi.dataset.mi];Menu.close(true);it&&it.fn&&it.fn();return}Menu.close(true);if(!(tg.closest&&tg.closest('[data-act=more],[data-act=speed],[data-act=profile-menu]')))return}
 if(tg.classList&&tg.classList.contains('overlay')){const m=Modal.top();if(m&&!m.locked&&m.el===tg)m.close();return}
 if(tg.closest('a[href^="#"]')){const a=tg.closest('a[href^="#"]');if(a.closest('#fs'))UI.setFS(false);if(Router.cur.name==='search'&&Search.q&&a.closest('#sr'))Search.saveRecent();return}
 const a=tg.closest('[data-act],[data-nav]');if(!a)return;
 if(a.dataset.act){const fn=Actions[a.dataset.act];if(fn){if(Router.cur.name==='search'&&Search.q&&a.closest('#sr'))Search.saveRecent();fn(a,e)}}
 else if(a.dataset.nav){if(Router.cur.name==='search'&&Search.q)Search.saveRecent();Router.go(a.dataset.nav)}
});
document.addEventListener('input',e=>{const el=e.target;if(el.dataset&&el.dataset.in&&Inputs[el.dataset.in]&&el.type!=='checkbox'&&el.tagName!=='SELECT')Inputs[el.dataset.in](el)});
document.addEventListener('change',e=>{const el=e.target;if(el.dataset&&el.dataset.in&&Inputs[el.dataset.in]&&(el.type==='checkbox'||el.tagName==='SELECT'))Inputs[el.dataset.in](el)});
document.addEventListener('contextmenu',e=>{const el=e.target.closest&&e.target.closest('[data-ctx],[data-track]');if(!el)return;const items=menuItemsFor(e.target);if(!items)return;e.preventDefault();Menu.open(e.clientX,e.clientY,items,el)});
document.addEventListener('touchstart',e=>{const el=e.target.closest&&e.target.closest('[data-ctx],[data-track]');if(!el||e.target.closest('button,a,.seek,.vol'))return;const t=e.touches[0];clearTimeout(lpT);lpT=setTimeout(()=>{const items=menuItemsFor(el);if(items){lpFired=true;Menu.open(t.clientX,t.clientY,items,el)}},550)},{passive:true});
['touchend','touchmove','touchcancel'].forEach(n=>document.addEventListener(n,()=>clearTimeout(lpT),{passive:true}));
document.addEventListener('pointerdown',e=>{const el=e.target.closest&&e.target.closest('.seek,.vol');if(el){e.preventDefault();engine.ensure();Seek.down(el,e)}});
document.addEventListener('pointermove',e=>{if(Seek.drag){Seek.move(e);return}const el=e.target.closest&&e.target.closest('.seek');if(el&&e.pointerType!=='touch')Seek.tip(el,e);else $('#seektip').classList.remove('show')});
document.addEventListener('pointerup',e=>Seek.up(e));document.addEventListener('pointercancel',e=>Seek.up(e));
document.addEventListener('gesturestart',()=>{});
['pointerdown','keydown'].forEach(n=>document.addEventListener(n,()=>{if(engine.ctx&&engine.ctx.state==='suspended')engine.ctx.resume().catch(()=>{})},{passive:true,capture:true}));
/* search box */
document.addEventListener('input',e=>{if(e.target.id==='q')debSearch(e.target.value)});
const debSearch=debounce(v=>Search.run(v),140);
document.addEventListener('focusin',e=>{if(e.target.id==='q'&&Router.cur.name!=='search'){Router.go('#/search')}});
document.addEventListener('keydown',e=>{if(e.target.id!=='q')return;const items=$$('#sr [data-sr]');
 if(e.key==='ArrowDown'||e.key==='ArrowUp'){if(!items.length)return;e.preventDefault();Search.sel=e.key==='ArrowDown'?(Search.sel+1)%items.length:(Search.sel-1+items.length)%items.length;items.forEach(i=>i.classList.remove('sr-sel'));const it=items[Search.sel];it.classList.add('sr-sel');it.scrollIntoView({block:'nearest'})}
 else if(e.key==='Enter'){const it=items[Search.sel>=0?Search.sel:0];if(it&&Search.q.trim()){e.preventDefault();Search.saveRecent();it.click()}}
 else if(e.key==='Escape'){e.target.blur()}});
/* queue/playlist reorder with drag & drop */
let dnd=null;
const clearDrop=()=>$$('.drop-before,.drop-after,.dragging').forEach(x=>x.classList.remove('drop-before','drop-after','dragging'));
document.addEventListener('dragstart',e=>{const el=e.target.closest&&e.target.closest('[data-drag]');if(!el)return;dnd={list:el.dataset.drag,from:+el.dataset.i};e.dataTransfer.effectAllowed='move';try{e.dataTransfer.setData('text/plain',String(dnd.from))}catch(_){}el.classList.add('dragging')});
document.addEventListener('dragover',e=>{if(!dnd)return;const t=e.target.closest&&e.target.closest('[data-drop]');if(!t||t.dataset.drop!==dnd.list)return;e.preventDefault();e.dataTransfer.dropEffect='move';const rc=t.getBoundingClientRect(),after=e.clientY>rc.top+rc.height/2;$$('.drop-before,.drop-after').forEach(x=>x.classList.remove('drop-before','drop-after'));t.classList.add(after?'drop-after':'drop-before')});
document.addEventListener('drop',e=>{if(!dnd)return;const t=e.target.closest&&e.target.closest('[data-drop]');if(!t||t.dataset.drop!==dnd.list){clearDrop();dnd=null;return}e.preventDefault();const rc=t.getBoundingClientRect(),after=e.clientY>rc.top+rc.height/2;let to=+t.dataset.i+(after?1:0);const from=dnd.from;if(from<to)to--;const list=dnd.list;clearDrop();dnd=null;if(from===to)return;
 if(list==='queue')Player.moveQueue(from,to);else if(list.startsWith('pl:'))PL.reorder(list.slice(3),from,to)});
document.addEventListener('dragend',()=>{clearDrop();dnd=null});
/* floating widget drag */
document.addEventListener('pointerdown',e=>{const g=e.target.closest&&e.target.closest('[data-grip]');if(!g||Store.get()._mini)return;const m=$('#mini'),r=m.getBoundingClientRect(),ox=e.clientX-r.left,oy=e.clientY-r.top;g.setPointerCapture(e.pointerId);
 const mv=ev=>{m.style.left=clamp(ev.clientX-ox,0,window.innerWidth-r.width)+'px';m.style.top=clamp(ev.clientY-oy,0,window.innerHeight-r.height)+'px';m.style.right='auto';m.style.bottom='auto'};
 const up=()=>{g.removeEventListener('pointermove',mv);g.removeEventListener('pointerup',up);const b=m.getBoundingClientRect(),s=Store.get();Store.set({ui:{...s.ui,fx:b.left,fy:b.top}},{silent:true})};g.addEventListener('pointermove',mv);g.addEventListener('pointerup',up)});
/* swipe gestures for mobile player */
let sw=null;
document.addEventListener('touchstart',e=>{const t=e.touches[0];if(e.target.closest('#player')&&!e.target.closest('button,a,.seek,.vol'))sw={y:t.clientY,k:'up'};else if(e.target.closest('#fs')&&!e.target.closest('.lyrics,.seek,.vol,button'))sw={y:t.clientY,k:'down'};else sw=null},{passive:true});
document.addEventListener('touchend',e=>{if(!sw)return;const dy=(e.changedTouches[0]||{}).clientY-sw.y;if(sw.k==='up'&&dy<-40&&Player.track)UI.setFS(true);else if(sw.k==='down'&&dy>80)UI.setFS(false);sw=null},{passive:true});
/* keyboard */
document.addEventListener('keydown',e=>{
 const tg=e.target,tag=tg.tagName,typing=/INPUT|TEXTAREA|SELECT/.test(tag)&&tg.type!=='range'&&tg.type!=='checkbox'||tg.isContentEditable;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(Modal.top()&&Modal.top().el.querySelector('.pal'))Modal.close();else Palette.open();return}
 if(e.key==='Tab'&&Modal.top())Modal.trap(e);
 if(Menu.el){Menu.key(e);return}
 if(e.key==='Escape'){if(Modal.top()){if(!Modal.top().locked)Modal.close();return}if(Store.get()._fs){UI.setFS(false);return}if(Store.get()._mini){Actions.mini();return}}
 if(typing||Modal.top())return;
 if((e.key==='Enter')&&(tg.dataset.act||tg.dataset.nav)&&tag!=='BUTTON'&&tag!=='A'){e.preventDefault();tg.click();return}
 if(e.altKey&&(e.key==='ArrowUp'||e.key==='ArrowDown')){const row=tg.closest('[data-drag]');if(row){e.preventDefault();const f=+row.dataset.i,d=e.key==='ArrowUp'?-1:1,l=row.dataset.drag;if(l==='queue')Player.moveQueue(f,f+d);else PL.reorder(l.slice(3),f,f+d);setTimeout(()=>{const n=$(`[data-drag="${l}"][data-i="${f+d}"]`);n&&n.focus()},40)}return}
 if((e.key==='Delete'||e.key==='Backspace')&&tg.dataset&&tg.dataset.plid){e.preventDefault();PL.remove(tg.dataset.plid,+tg.dataset.i);return}
 if((e.key==='ArrowDown'||e.key==='ArrowUp')&&(tg.classList.contains('row')||tg.classList.contains('q-item'))&&!e.altKey){e.preventDefault();const sib=$$('.row[data-i]:not(.head),.q-item',tg.parentElement),i=sib.indexOf(tg),n=sib[i+(e.key==='ArrowDown'?1:-1)];n&&n.focus();return}
 if(e.ctrlKey||e.metaKey||e.altKey)return;
 const onCtl=tg.closest&&tg.closest('button,a,[role=slider],[role=tab],[role=menuitem]');
 switch(e.key){
  case' ':if(onCtl&&tag!=='BODY')return;e.preventDefault();Player.toggle();break;
  case'ArrowRight':if(tg.dataset&&tg.dataset.k==='vol'){Player.setVolume(Store.get().volume+.05);break}e.preventDefault();e.shiftKey?Player.next():Player.seek(engine.pos()+5);break;
  case'ArrowLeft':if(tg.dataset&&tg.dataset.k==='vol'){Player.setVolume(Store.get().volume-.05);break}e.preventDefault();e.shiftKey?Player.prev():Player.seek(engine.pos()-5);break;
  case'ArrowUp':e.preventDefault();Player.setVolume(Store.get().volume+.05);break;
  case'ArrowDown':e.preventDefault();Player.setVolume(Store.get().volume-.05);break;
  case'm':case'M':Player.toggleMute();break;
  case'l':case'L':{const t=Player.track;if(t&&t.kind==='track')Lib.toggleLike(t.id);break}
  case's':case'S':Player.toggleShuffle();break;
  case'r':case'R':Player.cycleRepeat();break;
  case'f':case'F':UI.setFS(!Store.get()._fs);break;
  case'q':case'Q':Actions['queue-toggle']();break;
  case'/':e.preventDefault();{const q=$('#q');q&&q.focus()}break;
  case'?':shortcutsModal();break;
 }
});
/* store-driven UI */
Store.on(['currentId'],()=>{renderPlayer();renderFS();renderMini();renderRight();UI.syncCur()});
Store.on(['queue','qIndex','_rp','followed'],()=>renderRight());
Store.on(['playlists'],()=>renderSidebar());
Store.on(['profile'],()=>{renderTopbar();renderSidebar()});
Store.on(['_sleep'],()=>renderPlayer());
Store.on(['ui','_mini'],()=>UI.applyLayout());
Store.on(['_together'],()=>UI.syncTogether());
Store.on(['settings'],()=>{Motion.apply();Cursor.apply()});
window.addEventListener('resize',debounce(()=>{FX.resize();Viz.resize();if(View.onResize)View.onResize();UI.applyLayout()},150));
document.addEventListener('visibilitychange',()=>{if(document.hidden){Loop.stop();Player.commit();Store.flush()}else Loop.start()});
window.addEventListener('pagehide',()=>{Player.commit();Store.set({position:engine.pos()},{silent:true});Store.flush()});
Motion.mq.addEventListener&&Motion.mq.addEventListener('change',()=>Motion.apply());

/* ===================== ROUTES + INIT ===================== */
Router.add('/home','home',()=>homeView());
Router.add('/search','search',()=>searchView(''));
Router.add('/search/:q','search',p=>searchView(p.q));
Router.add('/browse','browse',()=>browseView());
Router.add('/genre/:id','genre',p=>collectionView('genre',p.id));
Router.add('/mood/:id','mood',p=>collectionView('mood',p.id));
Router.add('/artist/:id','artist',p=>artistView(p.id));
Router.add('/album/:id','album',p=>albumView(p.id));
Router.add('/playlist/:id','playlist',p=>playlistView(p.id));
Router.add('/mix/:id','mix',p=>mixView(p.id));
Router.add('/liked','liked',()=>likedView());
Router.add('/library','library',()=>libraryView());
Router.add('/stats','stats',()=>statsView());
Router.add('/settings','settings',()=>settingsView());
Router.add('/podcasts','podcasts',()=>podcastsView());
Router.add('/show/:id','show',p=>showView(p.id));
Router.add('/track/:id','track',p=>{const t=T(p.id);setTimeout(()=>location.replace('#/'+(t?(t.kind==='ep'?'show/'+t.albumId:'album/'+t.albumId):'home')),0);return{title:'Opening…',html:'<div class="page"></div>'}});
Router.add('/(.*)','notfound',()=>notFound());

function init(){
 const s=Store.get();
 if(s.ui.right&&window.innerWidth<1100)Store.set({ui:{...s.ui,right:false}},{silent:true});
 Motion.apply();Theme.accent(s.profile.accent);
 renderSidebar();renderTopbar();renderTabbar();
 Player.init();renderPlayer();renderFS();renderMini();renderRight();UI.applyLayout();
 Together.init();FX.init();Cursor.init();
 Loop.add(()=>{UI.progress();FX.draw();Viz.draw()});
 Router.start();Loop.start();
 if(!s.profile.onboarded)setTimeout(onboarding,350);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
