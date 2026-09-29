/* ------------------------------------------------------------
 * Tueste Unity · taller "Arma tu café" (portado del HTML original)
 * Se inicializa cuando existe [data-tueste-unity-taller]. WhatsApp, correo y marca por defecto
 * llegan desde los data-attributes de la sección (sections/tueste-unity-taller.liquid).
 * ------------------------------------------------------------ */
(function(){
const ROOT=document.querySelector('[data-tueste-unity-taller]');
if(!ROOT||ROOT.dataset.tuInit)return;ROOT.dataset.tuInit='1';
const WA=(ROOT.dataset.whatsapp||'573102690145').replace(/\D/g,''), MAIL=ROOT.dataset.mail||'tuesteunity@tueste.co';
const PATHS={
  etiqueta:{name:'Edición con etiqueta',min:50,max:1000,step:10,unit:'bolsas',size:true,sca:'±86',scaNote:'café de especialidad, molido, según disponibilidad',hint:'Mínimo del camino: 50 bolsas por pedido. Presentaciones desde 200 g.',colors:true,fixedMood:false},
  '1840':{name:'Tu logo en la 1840',min:100,max:2000,step:50,unit:'bolsas de 340 g / mes',size:false,sca:'89',scaNote:'Aures 1840 · lavado · Castillo · Cañón de Aures',hint:'Mínimo del camino: 100 bolsas al mes.',colors:false,fixedMood:true},
  formula:{name:'Fórmula propia',min:500,max:5000,step:100,unit:'bolsas',size:true,sca:'+90',scaNote:'blend único diseñado para tu marca',hint:'Mínimo del camino: 500 bolsas por pedido. Tarifa preferencial por volumen.',colors:true,fixedMood:false}
};
const MOODS=[
  {id:'amanecer',name:'Amanecer',sub:'luminosa, fresca',notes:['naranja','panela','flores blancas'],v:[82,55,64]},
  {id:'tierra',name:'Tierra',sub:'cálida, profunda',notes:['cacao','nueces tostadas','caramelo'],v:[38,84,78]},
  {id:'noche',name:'Noche',sub:'intensa, elegante',notes:['frutos rojos','vino','chocolate oscuro'],v:[60,80,58]},
  {id:'fiesta',name:'Fiesta',sub:'vibrante, dulce',notes:['frutas tropicales','miel','jazmín'],v:[76,60,86]}
];
const AURES={notes:['nueces caramelizadas','chocolate','cítrico a naranja'],v:[58,74,76]};
const TIMBRES=[
  {id:'cristal',name:'Cristal',sub:'campanas',wave:'triangle',oct:5,dur:.42,gap:.2},
  {id:'madera',name:'Madera',sub:'marimba',wave:'sine',oct:4,dur:.3,gap:.17},
  {id:'bruma',name:'Bruma',sub:'pad suave',wave:'sawtooth',oct:3,dur:1.1,gap:.34},
  {id:'pulso',name:'Pulso',sub:'electrónico',wave:'square',oct:4,dur:.16,gap:.14}
];
const COLORS=[['#1B3B2A','Verde cafetal'],['#E23A5A','Cereza'],['#B694FF','Lila'],['#F58A1F','Naranja'],['#FFE8BF','Crema'],['#15130F','Tostado']];
const SIZES=['250 g','340 g','500 g'];
const S={path:'1840',brand:ROOT.dataset.brand||'Casa Niebla',color:'#1B3B2A',mood:'tierra',timbre:'madera',qty:100,trees:false,size:'340 g',logo:null,logoName:''};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function esc(t){return String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function toast(m){const t=$('#toast');if(!t)return;t.textContent=m;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),2200)}
function lum(hex){const n=parseInt(hex.slice(1),16);const r=n>>16,g=n>>8&255,b=n&255;return (0.299*r+0.587*g+0.114*b)/255}
function fitSize(txt,base,maxW){const l=Math.max(txt.length,1);return Math.max(12,Math.min(base,maxW/(l*0.78)))}

/* ---------- bolsa ---------- */
function pouchSVG(o){
  const P_=o.pfx||'m';
  const name=(o.brand||'Tu marca').toUpperCase();
  const W=594,H=1289;
  const logoBox=(x,y,w,h)=>o.logo?`<image href="${o.logo}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`:null;
  const nameText=(cx,cy,maxW,base,fill)=>{const fs=fitSize(name,base,maxW);const lines=name.length>12&&name.includes(' ')?splitTwo(name):[name];const f2=lines.length>1?fitSize(lines.reduce((p,c)=>c.length>p.length?c:p,''),base,maxW):fs;return lines.map((l,i)=>`<text x="${cx}" y="${cy+(i-(lines.length-1)/2)*f2*1.05+f2*0.36}" text-anchor="middle" font-family="Tueste Typeface, Archivo Black, sans-serif" font-size="${f2}" fill="${fill}" letter-spacing="2">${esc(l)}</text>`).join('')};
  if(o.path==='1840'){
    const lb=logoBox(155,862,290,140);
    return `<use href="#bagArt"/>
    <g fill="#1D1848">
      <text x="300" y="838" text-anchor="middle" font-family="DM Mono, monospace" font-size="14" fill-opacity=".8" letter-spacing="5">EDICIÓN EXCLUSIVA</text>
      ${lb||nameText(300,932,330,62,'#1D1848')}
      <line x1="190" y1="1030" x2="410" y2="1030" stroke="#1D1848" stroke-opacity=".3" stroke-width="2"/>
      <text x="300" y="1066" text-anchor="middle" font-family="Tueste Typeface, Archivo Black, sans-serif" font-size="20" letter-spacing="3">CAFÉ AURES 1840</text>
      <text x="300" y="1094" text-anchor="middle" font-family="DM Mono, monospace" font-size="12" fill-opacity=".85" letter-spacing="3">CAÑÓN DE AURES · 89 SCA · 340 G</text>
      <text x="300" y="1122" text-anchor="middle" font-family="DM Mono, monospace" font-size="11" fill-opacity=".7" letter-spacing="4">BY TUESTE</text>
    </g>`;
  }
  const base=`<g mask="url(#bagMask)">`;
  const shade=`<rect width="${W}" height="${H}" fill="url(#bagShade)"/><rect x="0" y="0" width="${W}" height="118" fill="rgba(0,0,0,.14)"/><g stroke="rgba(0,0,0,.16)" stroke-width="3">${Array.from({length:26},(_,i)=>`<line x1="${40+i*20}" y1="30" x2="${40+i*20}" y2="96"/>`).join('')}</g><circle cx="297" cy="420" r="30" fill="rgba(0,0,0,.22)"/><circle cx="297" cy="420" r="13" fill="rgba(255,255,255,.18)"/>`;
  if(o.path==='etiqueta'){
    const ink=lum(o.color)>.6?'#15130F':'#FFE8BF';
    const lb=logoBox(100,860,394,170);
    return `${base}<rect width="${W}" height="${H}" fill="#C79A62"/><rect width="${W}" height="${H}" fill="url(#kraft)"/>${shade}</g>
    <g><rect x="62" y="800" width="470" height="350" rx="22" fill="${o.color}"/><rect x="78" y="816" width="438" height="318" rx="14" fill="none" stroke="${ink}" stroke-opacity=".45" stroke-width="2.5"/>
    <text x="297" y="858" text-anchor="middle" font-family="DM Mono, monospace" font-size="17" fill="${ink}" fill-opacity=".8" letter-spacing="6">CAFÉ DE ESPECIALIDAD</text>
    ${lb||nameText(297,950,400,80,ink)}
    <text x="297" y="1098" text-anchor="middle" font-family="DM Mono, monospace" font-size="15" fill="${ink}" fill-opacity=".8" letter-spacing="4">${esc(o.size.toUpperCase())} · MOLIDO · RESPALDO TUESTE</text></g>`;
  }
  const ink=lum(o.color)>.6?'#15130F':'#FFE8BF';
  const notes=(o.notes||moodNow().notes).slice(0,2).join(' · ');
  const lb=logoBox(80,300,434,220);
  return `${base}<rect width="${W}" height="${H}" fill="${o.color}"/>
    <g opacity=".95"><circle cx="297" cy="1230" r="420" fill="none" stroke="#FBA922" stroke-width="44"/><circle cx="297" cy="1230" r="350" fill="none" stroke="#E23A5A" stroke-width="44"/><circle cx="297" cy="1230" r="280" fill="none" stroke="#3FBF5A" stroke-width="44"/><circle cx="297" cy="1230" r="210" fill="none" stroke="#B694FF" stroke-width="44"/><circle cx="297" cy="1230" r="150" fill="#FFE8BF"/></g>
    ${shade}</g>
    <text x="297" y="250" text-anchor="middle" font-family="DM Mono, monospace" font-size="19" fill="${ink}" fill-opacity=".85" letter-spacing="7">BLEND ÚNICO · +90 SCA</text>
    ${lb||nameText(297,420,470,96,ink)}
    <text x="297" y="590" text-anchor="middle" font-family="Lora, serif" font-style="italic" font-size="32" fill="${ink}" fill-opacity=".9">${esc(notes)}</text>
    <text x="297" y="1250" text-anchor="middle" font-family="DM Mono, monospace" font-size="17" fill="#15130F" letter-spacing="4">${esc(o.size.toUpperCase())} · BY TUESTE</text>`;
}
function splitTwo(t){const w=t.split(' ');let best=[t],bd=1e9;for(let i=1;i<w.length;i++){const a=w.slice(0,i).join(' '),b=w.slice(i).join(' ');const d=Math.abs(a.length-b.length);if(d<bd){bd=d;best=[a,b]}}return best}
function moodNow(){return S.path==='1840'?AURES:MOODS.find(m=>m.id===S.mood)}

/* ---------- sonido ---------- */
const SCALE=[0,2,4,7,9,12,14,16,19,21];
function motif(name){const L=(name||'tueste').toLowerCase().replace(/[^a-zñáéíóú]/g,'');const arr=[];for(let i=0;i<Math.min(L.length,8);i++){arr.push(SCALE[L.charCodeAt(i)%SCALE.length])}if(arr.length<3)arr.push(0,7,12);return arr}
const NN=['DO','DO#','RE','RE#','MI','FA','FA#','SOL','SOL#','LA','LA#','SI'];
let AC=null,analyser=null,raf=null,playing=false;
function drawStatic(){const c=$('#wave'),x=c.getContext('2d');const m=motif(S.brand);x.clearRect(0,0,c.width,c.height);const cols=['#FBA922','#E23A5A','#3FBF5A','#B694FF'];const n=72;const w=c.width/n;for(let i=0;i<n;i++){const k=m[i%m.length];const h=(Math.abs(Math.sin(i*.45+k*.3))*.7+.18)*(c.height*.8);x.fillStyle=cols[i%4];x.globalAlpha=.8;x.fillRect(i*w+2,(c.height-h)/2,w-4,h)}x.globalAlpha=1}
function drawLive(){const c=$('#wave'),x=c.getContext('2d');const d=new Uint8Array(analyser.frequencyBinCount);(function loop(){analyser.getByteTimeDomainData(d);x.clearRect(0,0,c.width,c.height);x.lineWidth=4;x.strokeStyle='#FBA922';x.beginPath();for(let i=0;i<d.length;i++){const X=i/d.length*c.width,Y=d[i]/255*c.height;i?x.lineTo(X,Y):x.moveTo(X,Y)}x.stroke();if(playing)raf=requestAnimationFrame(loop);else drawStatic()})()}
function play(){
  try{AC=AC||new (window.AudioContext||window.webkitAudioContext)()}catch(e){toast('Tu navegador no permite reproducir audio');return}
  if(AC.state==='suspended')AC.resume();
  const T=TIMBRES.find(t=>t.id===S.timbre),m=motif(S.brand),t0=AC.currentTime+.05,base=440*Math.pow(2,T.oct-4)*Math.pow(2,-9/12);
  analyser=AC.createAnalyser();analyser.fftSize=1024;const master=AC.createGain();master.gain.value=.22;
  const dl=AC.createDelay();dl.delayTime.value=.28;const fb=AC.createGain();fb.gain.value=.28;dl.connect(fb);fb.connect(dl);
  const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=T.wave==='sawtooth'?1400:T.wave==='square'?2200:6000;
  master.connect(lp);lp.connect(analyser);lp.connect(dl);dl.connect(analyser);analyser.connect(AC.destination);
  m.forEach((st,i)=>{const o=AC.createOscillator(),g=AC.createGain();o.type=T.wave;o.frequency.value=base*Math.pow(2,st/12);const s=t0+i*T.gap;g.gain.setValueAtTime(0,s);g.gain.linearRampToValueAtTime(1,s+.012);g.gain.exponentialRampToValueAtTime(.001,s+T.dur);o.connect(g);g.connect(master);o.start(s);o.stop(s+T.dur+.05)});
  const end=m.length*T.gap+T.dur+.9;playing=true;$('#pouchbox').classList.add('playing');drawLive();
  clearTimeout(play._h);play._h=setTimeout(()=>{playing=false;$('#pouchbox').classList.remove('playing')},end*1000);
}

/* ---------- render ---------- */
function renderOpts(){
  $('#moods').innerHTML=MOODS.map(m=>`<button class="opt" data-mood="${m.id}" aria-pressed="${S.mood===m.id}" ${S.path==='1840'?'disabled style="opacity:.4;cursor:not-allowed"':''}><b>${m.name}</b><small>${m.sub}</small></button>`).join('');
  $('#timbres').innerHTML=TIMBRES.map(t=>`<button class="opt" data-timbre="${t.id}" aria-pressed="${S.timbre===t.id}"><b>${t.name}</b><small>${t.sub}</small></button>`).join('');
  const P=PATHS[S.path];
  $('#swatches').innerHTML=COLORS.map(([c,n])=>`<button class="sw" style="background:${c}" data-color="${c}" aria-label="${n}" title="${n}" aria-pressed="${S.color===c}" ${P.colors?'':'disabled'}></button>`).join('')+(P.size?SIZES.map(z=>`<button class="opt" style="padding:.45rem .8rem" data-size="${z}" aria-pressed="${S.size===z}"><b>${z}</b></button>`).join(''):'');
  $('#swHint').textContent=S.path==='1840'?'En la 1840 la bolsa conserva su color tostado; tu marca va en el sello.':S.path==='etiqueta'?'Bolsa kraft; el color es el de tu etiqueta.':'Bolsa 100 % personalizada: el color es de la bolsa completa.';
}
function render(pop){
  const P=PATHS[S.path],M=moodNow();
  $$('[data-path]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.path===S.path));
  $('#pouch').innerHTML=pouchSVG(S);
  if(pop){const p=$('#pouch');p.classList.remove('pop');void p.offsetWidth;p.classList.add('pop');setTimeout(()=>p.classList.remove('pop'),500)}
  $('#stamp').innerHTML='Vista previa · <b>'+esc(P.name)+'</b>';
  $('#notes').innerHTML=M.notes.map(n=>`<span>${esc(n)}</span>`).join('');
  $('#bars').innerHTML=['Acidez','Cuerpo','Dulzor'].map((k,i)=>`<div><span>${k}</span><i style="--v:${M.v[i]}%"></i><em>${Math.round(M.v[i]/10)}/10</em></div>`).join('');
  $('#sca').innerHTML=`<b>${P.sca} SCA</b> · ${esc(P.scaNote)}${S.path==='1840'?' · perfil fijo de la bolsa insignia':''}`;
  const m=motif(S.brand);$('#noteRead').textContent=m.map(s=>NN[s%12]).join(' · ');
  const q=$('#qty');q.min=P.min;q.max=P.max;q.step=P.step;if(S.qty<P.min)S.qty=P.min;if(S.qty>P.max)S.qty=P.max;q.value=S.qty;
  $('#qOut').textContent=S.qty.toLocaleString('es-CO');$('#qUnit').textContent=S.path==='1840'?P.unit:P.unit+' de '+S.size;$('#qHint').textContent=P.hint;
  const T=TIMBRES.find(t=>t.id===S.timbre);
  const rows=[['Camino',P.name],['Marca',S.brand||'—'],['Logo',S.logo?'Subido en la página ('+S.logoName+'); lo envío por este chat':'Sin logo por ahora'],['Bolsa',S.path==='1840'?'Aures 1840 · 340 g · tu marca en la etiqueta azul':(S.path==='etiqueta'?'Kraft con etiqueta ':'Personalizada ')+COLORS.find(c=>c[0]===S.color)[1].toLowerCase()+' · '+S.size],['Taza',(S.path==='1840'?'Aures 1840: ':MOODS.find(m=>m.id===S.mood).name+': ')+M.notes.join(', ')],['Firma sonora',T.name+' · '+m.map(s=>NN[s%12]).join(' ')],['Volumen',S.qty.toLocaleString('es-CO')+' bolsas'+(S.path==='1840'?' al mes':'')],['Tueste Tree',S.trees?'Sí, quiero sumar árboles':'No por ahora']];
  $('#brief').innerHTML=rows.map(r=>`<div><dt>${r[0]}</dt><dd>${esc(r[1])}</dd></div>`).join('');
  S.rows=rows;
  const cmp=$('#fCompany');if(cmp&&!cmp.dataset.touched)cmp.value=S.brand;
  $('#mailBtn').href='mailto:'+MAIL+'?subject='+encodeURIComponent('Tueste Unity · '+(S.brand||'mi marca'))+'&body='+encodeURIComponent(buildMsg());
  if(!playing)drawStatic();
}
function setPath(p,scroll){S.path=p;if(p!=='1840'&&!PATHS[p].size)S.size='340 g';renderOpts();render(true);if(scroll)document.getElementById('taller').scrollIntoView({behavior:'smooth'})}

document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.path){setPath(b.dataset.path)}
  else if(b.dataset.go){setPath(b.dataset.go,true)}
  else if(b.dataset.mood&&S.path!=='1840'){S.mood=b.dataset.mood;renderOpts();render(true)}
  else if(b.dataset.timbre){S.timbre=b.dataset.timbre;renderOpts();render();play()}
  else if(b.dataset.color){S.color=b.dataset.color;renderOpts();render(true)}
  else if(b.dataset.size){S.size=b.dataset.size;renderOpts();render(true)}
  else if(b.id==='playBtn'){play()}
});
$('#brand').addEventListener('input',e=>{S.brand=e.target.value.trim();render()});
$('#qty').addEventListener('input',e=>{S.qty=+e.target.value;render()});
$('#trees').addEventListener('change',e=>{S.trees=e.target.checked;render()});

/* ---------- contacto con asesor ---------- */
let FTYPE='Marca',REF='';
function val(id){return ($('#'+id).value||'').trim()}
function buildMsg(){
  const rows=S.rows||[];
  const name=val('fName')||'—',comp=val('fCompany')||S.brand||'—',city=val('fCity')||'—';
  return 'Hola, soy '+name+' de '+comp+' ('+FTYPE.toLowerCase()+', '+city+'). Armé mi café en la página de Tueste Unity y quiero hablar con un asesor.\n\n'
   +'*Lo que escogí*\n'+rows.map(r=>'• '+r[0]+': '+r[1]).join('\n')
   +'\n\n*Mis datos*\n• Celular: '+(val('fPhone')||'—')+'\n• Correo: '+(val('fEmail')||'—')+'\n• Lo necesito: '+$('#fWhen').value
   +(val('fNote')?'\n• Nota: '+val('fNote'):'')
   +(REF?'\n\nRef: '+REF:'');
}
function setErr(id,bad){const f=$('#'+id).closest('.field');if(f)f.classList.toggle('invalid',bad);else $('.err[data-for="'+id+'"]').classList.toggle('show',bad)}
function validate(){
  const bad={fName:val('fName').length<2,fCompany:val('fCompany').length<2,fPhone:val('fPhone').replace(/\D/g,'').length<10,fCity:val('fCity').length<2,fEmail:!!val('fEmail')&&!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(val('fEmail')),fConsent:!$('#fConsent').checked};
  Object.entries(bad).forEach(([k,v])=>setErr(k,v));
  const first=Object.keys(bad).find(k=>bad[k]);if(first)$('#'+first).focus();
  return !first;
}
['fName','fCompany','fPhone','fCity','fEmail'].forEach(id=>$('#'+id).addEventListener('input',()=>{setErr(id,false);if(id==='fCompany')$('#fCompany').dataset.touched=1;render()}));
$('#fConsent').addEventListener('change',()=>setErr('fConsent',false));
$('#fType').addEventListener('click',e=>{const b=e.target.closest('[data-ftype]');if(!b)return;FTYPE=b.dataset.ftype;$$('[data-ftype]').forEach(x=>x.setAttribute('aria-pressed',x===b))});
$('#leadForm').addEventListener('submit',e=>{
  e.preventDefault();
  if(!validate()){toast('Revisa los campos marcados');return}
  REF='UNITY-'+Date.now().toString(36).slice(-5).toUpperCase();
  const msg=buildMsg(),url='https://wa.me/'+WA+'?text='+encodeURIComponent(msg);
  $('#waAgain').href=url;$('#msgPreview').textContent=msg;$('#refOut').textContent=REF;
  $('#leadForm').hidden=true;$('#sent').hidden=false;
  const w=window.open(url,'_blank','noopener');
  if(!w)toast('Toca “Abrir WhatsApp” para continuar');
  $('#sent').scrollIntoView({behavior:'smooth',block:'center'});
});
$('#editBtn').addEventListener('click',()=>{$('#sent').hidden=true;$('#leadForm').hidden=false;REF=''});


$('#logoIn').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;if(f.size>4e6){toast('El logo pesa más de 4 MB; prueba con uno más liviano');return}const r=new FileReader();r.onload=()=>{S.logo=r.result;S.logoName=f.name;$('#logoName').textContent=f.name;$('#logoClear').hidden=false;render(true);toast('Logo en la bolsa')};r.readAsDataURL(f)});
$('#logoClear').addEventListener('click',()=>{S.logo=null;S.logoName='';$('#logoIn').value='';$('#logoName').textContent='PNG o SVG con fondo transparente se ve mejor. Va en la etiqueta azul de la 1840.';$('#logoClear').hidden=true;render(true)});

/* ---------- taller por pasos en móvil ---------- */
(function(){
  const steps=$('.steps'),stps=$$('.steps > .stp'),dots=$('#wDots'),mq=matchMedia('(max-width:900px)');let cur=0;
  dots.innerHTML=stps.map(()=>'<i></i>').join('');
  function show(i,scroll){cur=Math.max(0,Math.min(stps.length-1,i));stps.forEach((s,k)=>s.classList.toggle('on',k===cur));
    [...dots.children].forEach((d,k)=>{d.className=k===cur?'on':k<cur?'done':''});
    $('#wPrev').disabled=cur===0;$('#wNext').hidden=cur===stps.length-1;
    if(scroll)document.getElementById('taller').scrollIntoView({behavior:'smooth',block:'start'})}
  function apply(){steps.classList.toggle('wizard',mq.matches);$('#wiz').classList.toggle('show',mq.matches);if(mq.matches)show(cur)}
  $('#wPrev').addEventListener('click',()=>show(cur-1,true));
  $('#wNext').addEventListener('click',()=>show(cur+1,true));
  document.addEventListener('click',e=>{if(e.target.closest('[data-go]'))show(0)});
  (mq.addEventListener?mq.addEventListener('change',apply):mq.addListener(apply));apply();
})();
if(matchMedia('(max-width:720px)').matches){const h=$('.railhint');if(h)h.hidden=false}
/* bolsa ilustrada para la tarjeta de fórmula propia */
const pathBag=$('#pathBag');if(pathBag)pathBag.innerHTML='<svg viewBox="0 0 594 1289" style="height:86%;width:auto;filter:drop-shadow(0 24px 30px rgba(0,0,0,.5))">'+pouchSVG({path:'formula',brand:'Tu marca',color:'#1B3B2A',size:'340 g',pfx:'c',notes:['tu perfil','tu atmósfera']})+'</svg>';
renderOpts();render();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>render());
})();
