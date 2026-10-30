/* ───────── Rabona shared helpers ───────── */
(function(){
const ICONS={
home:'<path d="M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
cap:'<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5M22 9v6"/>',
cal:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',
user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
heart:'<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>',
chat:'<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12z"/>',
share:'<path d="M4 12v7h16v-7M12 3v12M7 8l5-5 5 5"/>',
bell:'<path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4zM10 21h4"/>',
search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.5-4.5"/>',
plus:'<path d="M12 5v14M5 12h14"/>',
dots:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
ball:'<circle cx="12" cy="12" r="9"/><path d="m12 8 3.5 2.5-1.3 4h-4.4l-1.3-4zM12 3v5M3.5 9.5 8.5 10.5M20.5 9.5l-5 1M7 19l2.8-4.5M17 19l-2.8-4.5"/>',
pin:'<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
users:'<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c2.4.6 4 2.2 4 5.2"/>',
star:'<path d="m12 2 3 6.5 7 .9-5.2 4.8 1.4 7L12 17.6 5.8 21.2l1.4-7L2 9.4l7-.9z"/>',
gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
out:'<path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H9"/>',
clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
check:'<path d="m5 12 5 5 9-10"/>',
back:'<path d="m9 6 6 6-6 6"/>',
whistle:'<circle cx="9" cy="14" r="6"/><path d="M15 12h7M9 14h.01M9 8V5h6"/>',
shield:'<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
flame:'<path d="M12 22c4 0 7-3 7-7 0-3-2-5-3-7-1 2-2 3-3 3 0-3-1-6-4-8 0 4-4 6-4 12 0 4 3 7 7 7z"/>',
gift:'<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M12 9v12M3 13h18M12 9c-3 0-5-1-5-3s3-3 5 0c2-3 5-2 5 0s-2 3-5 3z"/>',
trophy:'<path d="M8 4h8v6a4 4 0 0 1-8 0zM8 6H4v2a3 3 0 0 0 4 3M16 6h4v2a3 3 0 0 1-4 3M12 14v4M8 21h8"/>',
phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'
};
const sprite='<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'+
Object.keys(ICONS).map(k=>`<symbol id="${k}" viewBox="0 0 24 24">${ICONS[k]}</symbol>`).join('')+
'<linearGradient id="half"><stop offset="50%" stop-color="#00C853"/><stop offset="50%" stop-color="#262626"/></linearGradient></defs></svg>';

const NAV=[['home','index.html','home','الرئيسية'],['academies','academies.html','cap','أكاديميات'],['bookings','bookings.html','cal','المواعيد'],['profile','profile.html','user','حسابي'],['settings','settings.html','gear','الإعدادات']];
function rail(a){return `<aside class="rail"><a href="index.html" class="brand">RABON<b>A</b><span class="slashes" aria-hidden="true"><i></i><i></i><i></i></span></a><nav>${NAV.map(n=>`<a href="${n[1]}" ${a===n[0]?'class="on"':''}>${ic(n[2])}${n[3]}</a>`).join('')}</nav><a class="btn lg" href="new-post.html">${ic('plus')}منشور جديد</a><a class="me" href="profile.html">${av('أحمد محمود',9,40)}<span><b>أحمد محمود</b><small>لاعب</small></span></a></aside>`}
const ic=(n,c)=>`<svg class="i${c?' '+c:''}"><use href="#${n}"/></svg>`;

/* deterministic pseudo-random */
const rnd=(seed,n)=>{const x=Math.sin(seed*97.13+n*12.9898)*43758.5453;return x-Math.floor(x)};

/* generated floodlit-pitch artwork. seed varies hue, light, ball, line layout */
let _a=0;
function art(seed=0){
  const id='a'+(++_a),r=n=>rnd(seed+1,n);
  const h=138+Math.floor(r(1)*28),lx=70+r(2)*260,bx=110+r(3)*180,by=205+r(4)*50,flip=r(5)>.5?-1:1;
  const bands=[150,160,174,194,222,258,300].map((y,k,a)=>k<a.length-1&&k%2===0?`<rect x="0" y="${y}" width="400" height="${a[k+1]-y}" fill="#fff" opacity=".045"/>`:'').join('');
  return `<svg class="art" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
<defs>
<linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${h},55%,4%)"/><stop offset="1" stop-color="hsl(${h},55%,13%)"/></linearGradient>
<linearGradient id="${id}p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${h},65%,14%)"/><stop offset="1" stop-color="hsl(${h},75%,27%)"/></linearGradient>
<linearGradient id="${id}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eaffee" stop-opacity=".6"/><stop offset="1" stop-color="#eaffee" stop-opacity="0"/></linearGradient>
<radialGradient id="${id}g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#7dffb0" stop-opacity=".35"/><stop offset="1" stop-color="#7dffb0" stop-opacity="0"/></radialGradient>
</defs>
<rect width="400" height="300" fill="url(#${id}s)"/>
<ellipse cx="${lx}" cy="165" rx="190" ry="60" fill="url(#${id}g)"/>
<polygon points="${lx-5},-10 ${lx+5},-10 ${lx+95},172 ${lx-95},172" fill="url(#${id}l)" opacity=".45"/>
<polygon points="${lx+flip*140-4},-10 ${lx+flip*140+4},-10 ${lx+flip*140+70},172 ${lx+flip*140-70},172" fill="url(#${id}l)" opacity=".22"/>
<rect y="150" width="400" height="150" fill="url(#${id}p)"/>${bands}
<g fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="1.6">
<line x1="0" y1="191" x2="400" y2="191"/><ellipse cx="200" cy="191" rx="72" ry="19"/>
<path d="M95 300 L125 232 H275 L305 300"/><path d="M150 300 L162 268 H238 L250 300"/></g>
<ellipse cx="${bx}" cy="${by+9}" rx="12" ry="3.4" fill="#000" opacity=".4"/>
<circle cx="${bx}" cy="${by}" r="9" fill="#f5f5f5"/><path d="m${bx} ${by-4} 3.8 2.8-1.4 4.4h-4.8l-1.4-4.4z" fill="#0b0b0b"/>
<path d="M-20 ${290-r(6)*20} L420 ${210+r(7)*40} L420 300 L-20 300z" fill="#00C853" opacity=".07"/>
</svg>`;
}
/* avatar: art background + initial; img = optional photo URL */
const init=n=>{const w=n.startsWith('أكاديمية')?n.split(' ')[1]:n;return (w.startsWith('ال')&&w.length>2?w[2]:w[0])};
function av(name,seed,size,img){
  const s=size?`width:${size}px;height:${size}px;font-size:${Math.round(size*.4)}px`:'';
  return `<div class="av" style="${s}">${img?`<img src="${img}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`:art(seed)}<span>${init(name)}</span></div>`;
}
function stars(r){
  let o='';for(let i=1;i<=5;i++){const c=r>=i?'f':(r>=i-.5?'h':'');o+=`<svg class="${c}" viewBox="0 0 24 24"><use href="#star"/></svg>`}
  return `<span class="stars" role="img" aria-label="${r} من 5">${o}</span>`;
}
function sendToApp(m){const s=JSON.stringify(m);
  if(window.ReactNativeWebView)ReactNativeWebView.postMessage(s);
  else if(window.AndroidBridge)AndroidBridge.postMessage(s);
  else if(window.webkit&&webkit.messageHandlers&&webkit.messageHandlers.app)webkit.messageHandlers.app.postMessage(s);
  else console.log('app bridge not found',m)}

/* header + bottom bar. active: home | academies | bookings | profile */
function chrome(active,opts){
  opts=opts||{};
  applyPrefs();
  document.body.insertAdjacentHTML('afterbegin',sprite+`
<header class="top"><div>
  <a href="index.html" class="brand">RABON<b>A</b><span class="slashes" aria-hidden="true"><i></i><i></i><i></i></span></a>
  <nav class="dnav">
    <a href="index.html" ${active==='home'?'class="on"':''}>${ic('home')}الرئيسية</a>
    <a href="academies.html" ${active==='academies'?'class="on"':''}>${ic('cap')}أكاديميات</a>
    <a href="bookings.html" ${active==='bookings'?'class="on"':''}>${ic('cal')}المواعيد</a>
    <a href="profile.html" ${active==='profile'?'class="on"':''}>${ic('user')}حسابي</a>
  </nav>
  ${opts.search?`<label class="dsearch">${ic('search')}<input type="search" placeholder="ابحث عن لاعب أو أكاديمية"></label><button class="ib ms" aria-label="بحث">${ic('search')}</button>`:''}
  <button class="ib" aria-label="الإشعارات">${ic('bell')}<i class="dot"></i></button>
  <a class="ib" href="settings.html" aria-label="الإعدادات" ${active==='settings'?'style="color:var(--green)"':''}>${ic('gear')}</a>
</div></header>`);
  document.body.insertAdjacentHTML('beforeend',`
<nav class="bar"><div>
  <a href="index.html" ${active==='home'?'class="on"':''}>${ic('home')}الرئيسية</a>
  <a href="academies.html" ${active==='academies'?'class="on"':''}>${ic('cap')}أكاديميات</a>
  <a href="new-post.html" class="fab" aria-label="منشور جديد"><span>${ic('plus')}</span></a>
  <a href="bookings.html" ${active==='bookings'?'class="on"':''}>${ic('cal')}المواعيد</a>
  <a href="profile.html" ${active==='profile'?'class="on"':''}>${ic('user')}حسابي</a>
</div></nav>`);
  document.body.insertAdjacentHTML('beforeend',rail(active));
}
/* applies saved user settings (settings.html) on every page: reduce motion + text size */
function applyPrefs(){try{
  const s=JSON.parse(localStorage.getItem('rabona-settings')||'{}'),m=document.getElementById('rm-style');
  if(s.reduceMotion&&!m)document.head.insertAdjacentHTML('beforeend','<style id="rm-style">*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}</style>');
  if(!s.reduceMotion&&m)m.remove();
  document.documentElement.style.zoom=s.textSize==='lg'?'1.1':'';
}catch(e){}}
/* simulates async load: shows skeleton, then calls done (replace with Firestore promise) */
function load(skelHtml,target,done,ms){
  target.innerHTML=skelHtml;
  setTimeout(done,ms==null?450:ms);
}
window.Rabona={ic,art,av,stars,init,sendToApp,chrome,load,rnd,applyPrefs};
})();