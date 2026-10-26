// Scroll section: wireframe line-trace of the hills wallpaper, then a Win95-style stepped/dithered boot fade-in.
// Perf: lines drawn incrementally onto a persistent canvas (no clears), dither steps computed ~8 times total,
// nothing runs per frame outside the ~5s build; runs from the page's single rAF loop (FFC_HOOKS).
(()=>{
const sec=document.getElementById('scene'),sl=document.getElementById('sl'),sf=document.getElementById('sf'),img=document.getElementById('sbg');
const boot=document.getElementById('boot'),bfill=document.getElementById('bfill');
const lc=sl.getContext('2d'),fc=sf.getContext('2d');
let data=null,state=0,t=0,segs=[],total=0,drawnLen=0,step=-1,src=null,SW=0,SH=0,secTop=0,secH=0;
const T_LINES=2.8,T_FADE=1.7,STEPS=9,LS=2;     // line canvas at 1/2 css res (chunky pixels), fade canvas at 1/3
const BAY=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
fetch('scene-lines.json').then(r=>r.json()).then(j=>{data=j;layout();});
function layout(){const r=sec.getBoundingClientRect();secTop=r.top+scrollY;secH=r.height;SW=r.width;SH=r.height;
  sl.width=Math.ceil(SW/LS);sl.height=Math.ceil(SH/LS);sf.width=Math.ceil(SW/3);sf.height=Math.ceil(SH/3);
  if(!data)return;segs=[];total=0;
  const sc=Math.max(sl.width/data.w,sl.height/data.h),ox=(sl.width-data.w*sc)/2,oy=(sl.height-data.h*sc)/2;   // object-fit:cover mapping
  const order={sky:0,cloud:1,hill:2,grass:3};
  const L=data.lines.slice().sort((a,b)=>order[a.k]-order[b.k]);
  for(const ln of L){const col=ln.k==='hill'?'#5dff6e':ln.k==='grass'?'#2fbf4a':ln.k==='cloud'?'#cfe9ff':'#3aa0ff';
    for(let i=0;i<ln.p.length-1;i++){const x0=ox+ln.p[i][0]*data.w*sc,y0=oy+ln.p[i][1]*data.h*sc,x1=ox+ln.p[i+1][0]*data.w*sc,y1=oy+ln.p[i+1][1]*data.h*sc;
      const len=Math.hypot(x1-x0,y1-y0);segs.push({x0,y0,x1,y1,len,start:total,col});total+=len;}}
  if(state>=2)lc.clearRect(0,0,sl.width,sl.height),drawLines(total);
}
let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(layout,150);});
function drawLines(upTo){ // draw only the newly reached part of the path
  for(const s of segs){if(s.start>=upTo)break;if(s.start+s.len<=drawnLen)continue;
    const a=Math.max(0,(drawnLen-s.start)/s.len),b=Math.min(1,(upTo-s.start)/s.len);
    lc.strokeStyle=s.col;lc.lineWidth=1;lc.beginPath();lc.moveTo(s.x0+(s.x1-s.x0)*a,s.y0+(s.y1-s.y0)*a);lc.lineTo(s.x0+(s.x1-s.x0)*b,s.y0+(s.y1-s.y0)*b);lc.stroke();}
  drawnLen=upTo;}
function prepSrc(){src=document.createElement('canvas');src.width=sf.width;src.height=sf.height;const c=src.getContext('2d');
  const sc=Math.max(src.width/img.naturalWidth,src.height/img.naturalHeight);
  c.drawImage(img,(src.width-img.naturalWidth*sc)/2,(src.height-img.naturalHeight*sc)/2,img.naturalWidth*sc,img.naturalHeight*sc);
  try{src=c.getImageData(0,0,src.width,src.height);}catch(e){src=c.createImageData(src.width,src.height);}}
function ditherStep(k){ // Win95-ish: ordered-dither reveal + coarse palette early on
  if(!src)prepSrc();const w=sf.width,h=sf.height,out=fc.createImageData(w,h),d=out.data,s=src.data,th=k/STEPS*16;
  const lv=k<3?2:k<5?4:k<7?8:256,q=255/(lv-1);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(BAY[(y&3)*4+(x&3)]>=th)continue;const i=(y*w+x)*4;
    if(lv<256){d[i]=Math.round(s[i]/q)*q;d[i+1]=Math.round(s[i+1]/q)*q;d[i+2]=Math.round(s[i+2]/q)*q;}else{d[i]=s[i];d[i+1]=s[i+1];d[i+2]=s[i+2];}d[i+3]=255;}
  fc.putImageData(out,0,0);
  sf.classList.toggle('flick',k===2);sf.classList.toggle('flick2',k===5);}
function finish(){state=3;sec.classList.add('done');boot.classList.remove('on');document.dispatchEvent(new Event('scene-start'));}
function hook(dt){
  if(state===3||!data)return;
  const top=secTop-scrollY;
  if(state===0){if(top+secH<=0){layout();drawLines(total);finish();return;}       // loaded already past it
    if(top<innerHeight*.65&&top+secH>0){state=1;t=0;document.dispatchEvent(new Event('scene-start'));}else return;}
  t+=dt;
  if(state===1){const k=Math.min(1,t/T_LINES),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;drawLines(total*e);
    if(t>T_LINES-.4)boot.classList.add('on');bfill.style.width=Math.min(100,(t-(T_LINES-.4))/(T_FADE+.6)*100)+'%';
    if(k>=1){state=2;t=0;}return;}
  if(state===2){if(!img.complete)return;const k=Math.min(STEPS,1+Math.floor(t/T_FADE*STEPS));
    if(k!==step){step=k;ditherStep(k);}bfill.style.width=Math.min(100,(t+.4)/(T_FADE+.6)*100)+'%';
    if(t>T_FADE+.2)finish();}
}
(window.FFC_HOOKS=window.FFC_HOOKS||[]).push(hook);
addEventListener('load',layout);
})();

// ---- cloud lettering (rendered ONCE, animated with CSS transforms only) + click reveal
(()=>{
const scr=document.getElementById('scr'),cv=document.getElementById('clouds'),cv2=document.getElementById('clouds2');
const TEXT='Archive of Things';let built=false;
function puffSprite(seed){const S=96,o=document.createElement('canvas');o.width=o.height=S;const x=o.getContext('2d');let r=seed;const R=()=>(r=(r*16807)%2147483647)/2147483647;
  for(let i=0;i<46;i++){const a=R()*6.283,d=Math.pow(R(),.7)*S*.3,px=S/2+Math.cos(a)*d,py=S/2+Math.sin(a)*d*.8,rr=S*(.08+R()*.16);
    const gr=x.createRadialGradient(px,py,0,px,py,rr);gr.addColorStop(0,'rgba(255,255,255,.55)');gr.addColorStop(.6,'rgba(255,255,255,.22)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,S,S);}
  x.globalCompositeOperation='source-atop';const sh=x.createLinearGradient(0,S*.15,0,S*.9);
  sh.addColorStop(0,'rgba(255,255,255,0)');sh.addColorStop(.55,'rgba(225,232,242,.25)');sh.addColorStop(1,'rgba(150,162,182,.85)');x.fillStyle=sh;x.fillRect(0,0,S,S);return o;}
function render(canvas,seed0){
  const r=scr.getBoundingClientRect();if(r.width<10)return false;const DPR=Math.min(1.5,devicePixelRatio||1),W=r.width,H=r.height;
  canvas.width=Math.round(W*DPR);canvas.height=Math.round(H*DPR);const c=canvas.getContext('2d');c.setTransform(DPR,0,0,DPR,0,0);
  const sprites=[];for(let i=0;i<10;i++)sprites.push(puffSprite(seed0+i*7919));
  const m=document.createElement('canvas'),mw=Math.round(W),mh=Math.round(H);m.width=mw;m.height=mh;const x=m.getContext('2d');
  let fs=Math.min(mh*.17,mw*.085);x.font=`800 ${fs}px "Baloo 2", system-ui, sans-serif`;
  while(x.measureText(TEXT).width>mw*.6){fs*=.95;x.font=`800 ${fs}px "Baloo 2", system-ui, sans-serif`;}
  x.textAlign='center';x.textBaseline='middle';x.fillStyle='#fff';x.fillText(TEXT,mw/2,mh*.25);
  let d;try{d=x.getImageData(0,0,mw,mh).data;}catch(e){d=new Uint8ClampedArray(mw*mh*4);}const step=Math.max(2.5,fs/17);let s=seed0;const R=()=>(s=(s*16807)%2147483647)/2147483647;const P=[];
  for(let y=0;y<mh;y+=step)for(let xx=0;xx<mw;xx+=step){const jx=xx+(R()-.5)*step,jy=y+(R()-.5)*step,i=((jy|0)*mw+(jx|0))*4;
    if(jx>=0&&jy>=0&&jx<mw&&jy<mh&&d[i+3]>128)P.push({x:jx,y:jy,r:step*(1.05+R()*.75),sp:sprites[R()*sprites.length|0],a:.55+R()*.35});}
  P.sort((a,b)=>a.y-b.y);
  // puffs drawn without per-draw filters; one blur pass over the finished bitmap
  for(const p of P){const r2=p.r*1.1;c.globalAlpha=p.a*.35;c.drawImage(p.sp,p.x-r2,p.y-r2+p.r*.35,r2*2,r2*2);}
  for(const p of P){const r2=p.r*.9;c.globalAlpha=p.a;c.drawImage(p.sp,p.x-r2,p.y-r2,r2*2,r2*2);}
  c.globalAlpha=1;const tmp=document.createElement('canvas');tmp.width=canvas.width;tmp.height=canvas.height;tmp.getContext('2d').drawImage(canvas,0,0);
  c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,canvas.width,canvas.height);c.filter='blur(0.6px)';c.drawImage(tmp,0,0);c.filter='none';return true;}
function build(){if(built)return;built=render(cv,7);if(built)setTimeout(()=>render(cv2,4242),1200);} // stagger 2nd variant
let started=false;const start=()=>{if(started)return;started=true;(document.fonts?document.fonts.load('800 40px "Baloo 2"'):Promise.resolve()).finally(()=>{built=false;setTimeout(build,60);});};
document.addEventListener('scene-start',start);
let rt=null;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{if(built){built=false;build();}},200);});
// click sequence (only inside the opening)
const h=document.getElementById('cae'),go=document.getElementById('go');
h.innerHTML=[...'Create and Explore'].map(ch=>`<span>${ch===' '?'&nbsp;':ch}</span>`).join('');
let played=false;
function play(){if(played)return;played=true;scr.classList.add('played');
  [...h.children].forEach((sp,i)=>setTimeout(()=>sp.classList.add('on'),i*55));setTimeout(()=>go.classList.add('on'),18*55+350);}
scr.addEventListener('click',e=>{if(e.target===go)return;if(!document.getElementById('scene').classList.contains('done'))return;play();});
scr.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();play();}});
})();
