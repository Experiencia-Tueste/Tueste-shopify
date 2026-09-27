(function(){
  const root=document.querySelector('[data-tueste-tree-mockup]');
  if(!root) return;
  const TOTAL=Number(root.dataset.total)||10200, TAKEN=Number(root.dataset.taken)||3570;
  const $=s=>root.querySelector(s);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state={step:0,tree:null,variety:'',guardian:'',treename:'',qty:1};
  const VARIANT=root.dataset.variant||'', MAXQ=30, PRICE=Number(root.dataset.price)||100, PRICE_LABEL=root.dataset.priceLabel||('USD '+PRICE), WA='https://wa.me/'+(root.dataset.whatsapp||'573102682677')+'?text=';
  const varieties=['Caturra','Castillo','Geisha','Bourbon rosado','Tabi','Pink Bourbon','Colombia','Típica'];

  /* counters */
  function countTo(el,target,ms){ if(reduce){el.textContent=target.toLocaleString('es-CO');return;} const start=performance.now(), from=Math.max(0,target-480); (function f(t){const k=Math.min(1,(t-start)/ms); const v=Math.round(from+(target-from)*(1-Math.pow(1-k,3))); el.textContent=v.toLocaleString('es-CO'); if(k<1) requestAnimationFrame(f);})(start); }
  countTo($('#cHero'),TAKEN,1500); countTo($('#cTop'),TAKEN,1500);
  requestAnimationFrame(()=>{ $('#meter').style.width=(TAKEN/TOTAL*100)+'%'; });

  /* steps */
  function go(n){ state.step=n; const s=$('#s'+n); s.hidden=false; s.classList.add('reveal'); root.querySelectorAll('.steps i').forEach(i=>{const k=+i.dataset.s; i.classList.toggle('done',k<n); i.classList.toggle('on',k===n);}); setTimeout(()=>s.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'}),40); }
  $('#enter').addEventListener('click',()=>go(1));

  /* lote grid */
  const grid=$('#grid'); const N=200; const rnd=mulberry(1840);
  const cells=[]; for(let i=0;i<N;i++){ const b=document.createElement('button'); b.className='tree'; b.type='button'; const taken=rnd()<0.35; b.classList.add(taken?'taken':'free'); b.setAttribute('aria-label',taken?'Árbol con guardián':'Árbol libre'); if(taken){b.disabled=true;} b.dataset.i=i; grid.appendChild(b); cells.push(b); }
  grid.addEventListener('click',e=>{ const b=e.target.closest('.tree.free'); if(!b) return; cells.forEach(c=>c.classList.remove('mine')); b.classList.add('mine'); const i=+b.dataset.i; state.tree=TAKEN+1+Math.floor((i/N)*(TOTAL-TAKEN-1)); state.variety=varieties[i%varieties.length]; $('#selNum').textContent='Árbol N.° '+String(state.tree).padStart(6,'0'); $('#selVar').textContent=state.variety; $('#toPlant').disabled=false; });
  $('#toPlant').addEventListener('click',()=>go(2));

  /* siembra hold */
  const hold=$('#hold'), prog=$('#prog'), C=571, DUR=reduce?600:2400; let pressing=false,t0=0,raf=0,done=false;
  function frame(t){ if(!pressing) return; const k=Math.min(1,(t-t0)/DUR); prog.style.strokeDashoffset=C*(1-k); if(navigator.vibrate && k>0 && Math.floor(k*10)!==Math.floor(((t-16-t0)/DUR)*10)) navigator.vibrate(6); if(k>=1){finish();return;} raf=requestAnimationFrame(frame); }
  function start(e){ if(done) return; e.preventDefault(); pressing=true; hold.classList.add('pressing'); t0=performance.now(); prog.style.transition='none'; raf=requestAnimationFrame(frame); }
  function stop(){ if(done||!pressing) return; pressing=false; hold.classList.remove('pressing'); cancelAnimationFrame(raf); prog.style.transition='stroke-dashoffset .5s ease'; prog.style.strokeDashoffset=C; }
  function finish(){ done=true; pressing=false; hold.classList.remove('pressing'); $('#siembra').classList.add('planted'); $('#s2').classList.add('planted-msg'); burst(); if(navigator.vibrate) navigator.vibrate([20,40,60]); setTimeout(()=>$('#toName').focus({preventScroll:true}),800); }
  hold.addEventListener('pointerdown',start); ['pointerup','pointercancel','pointerleave'].forEach(ev=>hold.addEventListener(ev,stop));
  hold.addEventListener('keydown',e=>{ if((e.key===' '||e.key==='Enter')&&!pressing) start(e); });
  hold.addEventListener('keyup',e=>{ if(e.key===' '||e.key==='Enter') stop(); });
  hold.addEventListener('contextmenu',e=>e.preventDefault());
  $('#toName').addEventListener('click',()=>go(3));

  /* seeds burst */
  function burst(){ if(reduce) return; const cv=$('#seeds'), box=cv.parentElement, ctx=cv.getContext('2d'); cv.width=box.clientWidth; cv.height=box.clientHeight; const cx=cv.width/2, cy=cv.height/2+20; const cols=['#FBA922','#E23A5A','#3FBF5A','#B694FF','#FFE8BF']; const P=[]; for(let i=0;i<90;i++){const a=Math.random()*Math.PI*2, v=2+Math.random()*6; P.push({x:cx,y:cy,vx:Math.cos(a)*v,vy:Math.sin(a)*v-3,r:2+Math.random()*4,c:cols[i%cols.length],l:1});} let t=0; (function f(){ ctx.clearRect(0,0,cv.width,cv.height); let alive=false; P.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.16;p.vx*=.985;p.l-=.011; if(p.l>0){alive=true; ctx.globalAlpha=Math.max(0,p.l); ctx.fillStyle=p.c; ctx.beginPath(); ctx.ellipse(p.x,p.y,p.r,p.r*1.5,p.vx*.3,0,Math.PI*2); ctx.fill();}}); if(alive&&t++<220) requestAnimationFrame(f); else ctx.clearRect(0,0,cv.width,cv.height); })(); }

  /* nombre */
  const g=$('#guardian'), tn=$('#treename');
  try{ const saved=localStorage.getItem('tt_guardian'); if(saved) g.value=saved; }catch(e){}
  function check(){ state.guardian=g.value.trim(); state.treename=tn.value.trim(); $('#toCert').disabled=state.guardian.length<2; }
  g.addEventListener('input',check); tn.addEventListener('input',check); check();
  $('#toCert').addEventListener('click',()=>{ try{localStorage.setItem('tt_guardian',state.guardian);}catch(e){} renderCert(); go(4); });

  /* cantidad */
  const qI=$('#qInput');
  function setQty(n){ n=Math.max(1,Math.min(MAXQ,Math.round(Number(n)||1))); state.qty=n; qI.value=n; $('#qTotal').textContent=moneyFor(n); $('#qLabel').textContent='· '+n+(n===1?' árbol fundacional':' árboles fundacionales'); $('#qMinus').disabled=n<=1; $('#qPlus').disabled=n>=MAXQ; $('#qty').classList.toggle('max',n>=MAXQ); $('#buy').textContent=n===1?'Activar mi árbol · '+moneyFor(n):'Activar '+n+' árboles · '+moneyFor(n); renderCert(); if(typeof renderTier==='function') renderTier(n); }
  $('#qMinus').addEventListener('click',()=>setQty(state.qty-1)); $('#qPlus').addEventListener('click',()=>setQty(state.qty+1));
  qI.addEventListener('change',()=>setQty(qI.value)); qI.addEventListener('input',()=>{ if(Number(qI.value)>MAXQ){ setQty(MAXQ); toast('Máximo 30 en línea. Para más, habla con nuestro agente.'); } });

  function moneyFor(n){ return n===1 ? PRICE_LABEL : (root.dataset.currency||'USD')+' '+(n*PRICE).toLocaleString('es-CO'); }

  /* certificado */
  function renderCert(){ const first=state.tree||TAKEN+1, q=state.qty||1, last=Math.min(TOTAL,first+q-1); const num=String(first).padStart(6,'0'), numL=String(last).padStart(6,'0'); $('#certNum').textContent=q>1?'ÁRBOLES N.° '+num+' – '+numL:'ÁRBOL N.° '+num; $('#certName').textContent=state.guardian||'—'; $('#certTree').textContent=state.treename||'Sin nombre aún'; $('#certDate').textContent=new Date().toLocaleDateString('es-CO',{day:'numeric',month:'long',year:'numeric'}); const u=new URL(root.dataset.cartUrl||'/cart',window.location.origin); u.pathname=u.pathname.replace(/\/$/,'')+'/'+VARIANT+':'+q; u.searchParams.set('attributes[Árbol]',q>1?num+'–'+numL:num); if(state.guardian) u.searchParams.set('attributes[Guardián]',state.guardian); if(state.treename) u.searchParams.set('attributes[Nombre del árbol]',state.treename); if(typeof TIERS!=='undefined'){ let t=0; TIERS.forEach((x,i)=>{ if(q>=x.min) t=i; }); u.searchParams.set('attributes[Insignia]',TIERS[t].n.charAt(0)+TIERS[t].n.slice(1).toLowerCase()); } u.searchParams.set('utm_source','landing-tree'); $('#buy').href=u.toString(); $('#agentBtn').href=WA+encodeURIComponent('Hola, quiero adoptar más de 30 árboles en Tueste Tree'+(state.guardian?' — '+state.guardian:'')); }
  $('#share').addEventListener('click',async()=>{ const num=String(state.tree||0).padStart(6,'0'); const text=`Acabo de sembrar ${state.qty>1?state.qty+' árboles':'el árbol N.° '+num} en la Finca Tres Esquinas con Tueste Tree. Soy parte de los primeros 10.200 fundadores. 🌱 tueste.co/tree`; try{ if(navigator.share){ await navigator.share({title:'Mi árbol Tueste Tree',text}); } else { await navigator.clipboard.writeText(text); toast('Texto copiado para compartir'); } }catch(e){ toast('No se pudo compartir'); } });
  function toast(m){ const t=$('#toast'); t.textContent=m; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2200); }
  // insignias
  const TIERS=[{n:'SEMILLA',min:1},{n:'PLATA',min:10},{n:'ORO',min:20},{n:'HOLOGRÁFICA',min:30}];
  const tierImgs=[...root.querySelectorAll('#badges .badge img')].map(i=>i.src);
  function tierOf(q){ let t=0; TIERS.forEach((x,i)=>{ if(q>=x.min) t=i; }); return t; }
  function renderTier(q){
    const t=tierOf(q), el=$('#tier'), img=$('#tierImg');
    if(img.dataset.t!==String(t)){ img.src=tierImgs[t]; img.dataset.t=t; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); setTimeout(()=>el.classList.remove('pop'),600); }
    $('#tierName').textContent='INSIGNIA '+TIERS[t].n;
    const next=TIERS[t+1];
    $('#tierDesc').innerHTML = next ? 'Con '+q+(q===1?' árbol':' árboles')+'. <b>'+(next.min-q===1?'Falta 1 árbol':'Faltan '+(next.min-q)+' árboles')+'</b> para la insignia '+next.n.charAt(0)+next.n.slice(1).toLowerCase()+'.' : 'Con '+q+' árboles o más eres <b>socio fundador</b>. La insignia más alta del proyecto.';
    root.querySelectorAll('#badges .badge').forEach(b=>b.classList.toggle('on',Number(b.dataset.tier)===t));
  }
  root.querySelectorAll('#badges .badge').forEach(b=>b.addEventListener('click',()=>{ setQty(Number(b.dataset.q)); if(!$('#s4').hidden){ $('#qty').scrollIntoView({behavior:'smooth',block:'center'}); } else { toast('Cantidad guardada: '+b.dataset.q+(b.dataset.q==='1'?' árbol':' árboles')+'. Entra a la finca para sembrar.'); } }));
  setQty(1);
  function mulberry(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; } }
})();
