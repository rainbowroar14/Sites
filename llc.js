// Pixel layer for the bottom of the page: dithered pixel sky, pixelated floating island (with scroll resistance
// while passing it), and the LLC rift (pre-rendered dimensional cracks that hold the game cards).
// All raster work happens once per resize; per frame only cheap transforms/class toggles. Nothing runs off-screen.
(()=>{
const $=s=>document.querySelector(s);
const L=$('#llc'),I=$('#isl'),IC=$('#islc'),T=$('#tree'),SKY=$('#tsky'),SC=$('#skyc');
let PX=4,ready=0;
const B4=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const hex=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
function getPX(){return parseFloat(getComputedStyle(T).getPropertyValue('--tpx'))||4;}
const imgs={};function img(src){return imgs[src]||(imgs[src]=new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src;}));}

/* ---------- pixel sky: banded + Bayer-dithered gradient ---------- */
function drawSky(){
  const W=Math.ceil(SKY.offsetWidth/PX),H=Math.ceil(SKY.offsetHeight/PX);SC.width=W;SC.height=H;
  const th=T.offsetHeight,ih=I.offsetHeight,lh=L.offsetHeight,Hp=SKY.offsetHeight;
  const st=[[0,[6,7,14],0],[120,[10,16,40],.75],[260,hex('#173a78'),1],[400,hex('#2c66b8'),1],[560,hex('#4f95dc'),1],[440+th,hex('#9fd2f5'),1],
    [440+th+ih*.6,hex('#a9d8f6'),1],[440+th+ih+lh*.2,hex('#7fa3e6'),1],[440+th+ih+lh*.6,hex('#5a48ad'),1],[Hp-700,hex('#2c1958'),1],[Hp,hex('#2c1958'),1]];
  const g=SC.getContext('2d'),id=g.createImageData(W,H),d=id.data,Q=14;let k=0;
  for(let y=0;y<H;y++){const py=y*PX;while(k<st.length-2&&st[k+1][0]<py)k++;const A=st[k],Bb=st[k+1],t=Math.max(0,Math.min(1,(py-A[0])/Math.max(1,Bb[0]-A[0])));
    const c=[0,1,2].map(i=>A[1][i]+(Bb[1][i]-A[1][i])*t),al=A[2]+(Bb[2]-A[2])*t;
    for(let x=0;x<W;x++){const b=(B4[y&3][x&3]+.5)/16,o=(y*W+x)*4;
      for(let i=0;i<3;i++){const v=c[i]/Q;d[o+i]=Math.min(255,(Math.floor(v)+(v%1>b?1:0))*Q);}
      const av=al*4;d[o+3]=Math.min(255,Math.round((Math.floor(av)+(av%1>b?1:0))/4*255));}}
  g.putImageData(id,0,0);
  // clouds move in whole pixel steps
  const n=Math.round(1.4*innerWidth/PX);SKY.querySelectorAll('img').forEach(e=>e.style.animationTimingFunction=`steps(${n})`);
}

/* ---------- pixelated island + rock bits (same pixel size as the trees) ---------- */
async function drawIsland(){
  for(const c of IC.querySelectorAll('canvas[data-src]')){const im=await img(c.dataset.src);if(!im)continue;
    const cw=c.classList.contains('base')?IC.offsetWidth:parseFloat(getComputedStyle(c).width)||40;
    const W=Math.max(2,Math.round(cw/PX)),H=Math.max(2,Math.round(W*im.height/im.width));c.width=W;c.height=H;c.style.width=(W*PX)+'px';c.style.height=(H*PX)+'px';
    const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(im,0,0,W,H);}
  const du=IC.querySelector('.dust');du.width=Math.ceil(IC.offsetWidth/PX);du.height=Math.ceil(IC.offsetHeight/PX);
}

/* ---------- scroll resistance through the island zone (works with wheel, touch, keys, scrollbar) ----------
   #isl is 2.5x taller than the island; #islc is translated so it moves ~40% of scroll speed, eased at both ends. */
let lastY=scrollY,dust=[],dustG=null;
function islandFrame(dt){
  const r=I.getBoundingClientRect(),Z=I.offsetHeight,ic=IC.offsetHeight,span=Z-ic;
  let p=(innerHeight*.5-r.top)/Z;p=Math.max(0,Math.min(1,p));
  const f=.7*p+.3*p*p*(3-2*p),off=Math.round(span*f/PX)*PX;IC.style.translate=`0 ${off}px`;T.style.translate=`0 ${off}px`;  // tree rides along so the island stays attached
  const v=Math.abs(scrollY-lastY);lastY=scrollY;
  const g=dustG||(dustG=IC.querySelector('.dust').getContext('2d')),W=g.canvas.width,H=g.canvas.height;
  if(p>0&&p<1&&v>2&&dust.length<90){const n=Math.min(6,v/8|0)+1;for(let i=0;i<n;i++){const x=(.15+Math.random()*.7)*W;dust.push({x,y:H*(.05+Math.random()*.55),vx:(Math.random()-.5)*6,vy:6+Math.random()*10,l:1+Math.random()});}
    IC.classList.toggle('push',v>18);}else IC.classList.remove('push');
  g.clearRect(0,0,W,H);g.fillStyle='rgba(150,118,84,.9)';
  dust=dust.filter(q=>(q.l-=dt)>0);for(const q of dust){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=20*dt;g.globalAlpha=Math.min(1,q.l);g.fillRect(q.x|0,q.y|0,1,1);}g.globalAlpha=1;
}

/* ---------- LLC rift ---------- */
const RF=L.querySelector('.rift'),RG=L.querySelector('.riftg'),RX=L.querySelector('.riftfx'),SH=L.querySelector('.shards'),FL=L.querySelector('.flash');
let stages=[],cardsAt=[],stage=-1,rt=0,started=0;
function crackPath(rnd,x0,y0,x1,y1,w0,w1){ // jagged polyline with width profile
  const pts=[],len=Math.hypot(x1-x0,y1-y0),n=Math.max(4,Math.round(len/5)),nx=-(y1-y0)/len,ny=(x1-x0)/len;let j=0;
  for(let i=0;i<=n;i++){const t=i/n;j=j*.5+(rnd()-.5)*Math.min(7,len*.06);const e=Math.sin(Math.PI*t);pts.push({x:x0+(x1-x0)*t+nx*j*e,y:y0+(y1-y0)*t+ny*j*e,w:w0+(w1-w0)*Math.pow(t,2.2),d:len*t});}
  return pts;}
function drawRift(){
  const W=Math.ceil(L.offsetWidth/PX),H=Math.ceil(L.offsetHeight/PX);
  for(const c of[RF,RG,RX]){c.width=W;c.height=H;}
  const rnd=rng(77),core=L.querySelector('.core'),cx=W/2,cy=(core.offsetTop)/PX; // .core is translate(-50%,-50%) at its top/left
  const lw=core.offsetWidth/PX,lh=lw*314/588;
  const cracks=[];cardsAt=[];
  const cards=[...L.querySelectorAll('.st')].filter(e=>e.offsetParent);
  for(const c of cards){const x=(c.offsetLeft+c.offsetWidth/2)/PX,y=(c.offsetTop+c.offsetHeight*.45)/PX;
    const a=Math.atan2(y-cy,x-cx),sx=cx+Math.cos(a)*lw*.36,sy=cy+Math.sin(a)*lh*.36;
    const open=Math.max(c.offsetWidth,c.offsetHeight)/PX*.42;const p=crackPath(rnd,sx,sy,x,y,1.2,open);
    cracks.push(p);cardsAt.push({el:c,d:p[p.length-1].d,x,y,w:c.offsetWidth/PX,h:c.offsetHeight/PX});
    for(let b=0;b<3;b++){const k=2+(rnd()*(p.length-4)|0),q=p[k],ang=a+(rnd()<.5?-1:1)*(.6+rnd()*.9),l=6+rnd()*Math.min(26,W*.05);
      const br=crackPath(rnd,q.x,q.y,q.x+Math.cos(ang)*l,q.y+Math.sin(ang)*l,Math.max(.8,q.w*.5),.4);br.forEach(z=>z.d+=q.d);cracks.push(br);}}
  for(let i=0;i<5;i++){const a=rnd()*Math.PI*2,l=Math.min(W,H)*(.22+rnd()*.2),sx=cx+Math.cos(a)*lw*.4,sy=cy+Math.sin(a)*lh*.4;cracks.push(crackPath(rnd,sx,sy,sx+Math.cos(a)*l,sy+Math.sin(a)*l,1.6,.4));}
  const maxD=Math.max(...cracks.map(p=>p[p.length-1].d));
  // dimensional hole behind the logo (dark void so the purple logo reads on the sky)
  const hole=[];{const n=40;for(let i=0;i<n;i++){const a=i/n*Math.PI*2,k=.86+rnd()*.28;hole.push([cx+Math.cos(a)*lw*.56*k,cy+Math.sin(a)*lh*.66*k]);}}
  // software raster: L[] holds a layer id per pixel; later (inner) layers overwrite outer ones
  const N=W*H;
  function disc(L,x,y,r,v){const x0=Math.max(0,Math.floor(x-r)),x1=Math.min(W-1,Math.ceil(x+r)),y0=Math.max(0,Math.floor(y-r)),y1=Math.min(H-1,Math.ceil(y+r)),rr=r*r;
    for(let yy=y0;yy<=y1;yy++)for(let xx=x0;xx<=x1;xx++){const dx=xx+.5-x,dy=yy+.5-y;if(dx*dx+dy*dy<=rr&&L[yy*W+xx]<v)L[yy*W+xx]=v;}}
  function seg(L,a,q,pad,v){const n=Math.max(1,Math.ceil(Math.hypot(q.x-a.x,q.y-a.y)));for(let i=0;i<=n;i++){const t=i/n;disc(L,a.x+(q.x-a.x)*t,a.y+(q.y-a.y)*t,(a.w+(q.w-a.w)*t)/2+pad,v);}}
  function poly(L,pts,v){let y0=H,y1=0;for(const p of pts){y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);}
    for(let y=Math.max(0,y0|0);y<=Math.min(H-1,y1|0);y++){const xs=[];for(let i=0;i<pts.length;i++){const [ax,ay]=pts[i],[bx,by]=pts[(i+1)%pts.length];if((ay<=y+.5)!==(by<=y+.5))xs.push(ax+(y+.5-ay)/(by-ay)*(bx-ax));}
      xs.sort((p,q)=>p-q);for(let k=0;k+1<xs.length;k+=2)for(let x=Math.max(0,Math.ceil(xs[k]-.5));x<=Math.min(W-1,Math.floor(xs[k+1]-.5));x++)if(L[y*W+x]<v)L[y*W+x]=v;}}
  function paint(L,lim,pads){ // pads: [[pad,value],...] outer->inner
    for(const [pad,v] of pads){
      if(pad>=0&&v>=0){const grow=pad;const hp=hole.map(([x,y])=>{const dx=x-cx,dy=y-cy,l=Math.hypot(dx,dy)||1;return[x+dx/l*grow,y+dy/l*grow];});poly(L,hp,v);}
      for(const p of cracks)for(let i=1;i<p.length;i++){if(p[i].d>lim)break;seg(L,p[i-1],p[i],pad,v);}}}
  const PAL={1:[176,64,255],2:[195,60,255],3:[255,110,230],4:[255,255,255]};
  stages=[];const r2=rng(5),starMask=new Uint8Array(N);for(let i=0;i<N;i++)starMask[i]=r2()<.012?1:0;
  for(let s=1;s<=4;s++){const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),lim=maxD*s/4,Lb=new Uint8Array(N);
    paint(Lb,lim,[[2.4,2],[1.4,3],[.7,4],[0,5]]);
    const id=g.createImageData(W,H),d=id.data;
    for(let i=0;i<N;i++){const v=Lb[i];if(!v)continue;const o=i*4;d[o+3]=255;
      if(v===5){const x=i%W,y=i/W|0,n=Math.sin(x*.21+y*.13)+Math.sin(x*.07-y*.19)+Math.sin((x+y)*.05);let c3=[10,3,22];
        if(n>1.2&&B4[y&3][x&3]<8)c3=[58,18,92];else if(n>.6&&B4[y&3][x&3]<4)c3=[34,10,66];if(starMask[i])c3=[255,240,255];d[o]=c3[0];d[o+1]=c3[1];d[o+2]=c3[2];}
      else{const c3=PAL[v];d[o]=c3[0];d[o+1]=c3[1];d[o+2]=c3[2];}}
    g.putImageData(id,0,0);stages.push(c);}
  // pixel glow (dithered halo), pulses via CSS opacity
  {const Lg=new Uint8Array(N);paint(Lg,maxD,[[7,1]]);const g=RG.getContext('2d'),id=g.createImageData(W,H),d=id.data;
   for(let i=0;i<N;i++){const x=i%W,y=i/W|0;if(Lg[i]&&B4[y&3][x&3]<6){const o=i*4;d[o]=176;d[o+1]=64;d[o+2]=255;d[o+3]=200;}}g.putImageData(id,0,0);}
  // crack fragments over card corners (above the cards)
  {const Lf=new Uint8Array(N);for(const c of cardsAt){for(const [sx,sy] of [[-1,-1],[1,1]]){const x=c.x+sx*c.w/2,y=c.y+sy*c.h*.45;
      const p=crackPath(rnd,x-sx*6,y-sy*5,x+sx*5,y+sy*4,1.6,.3);for(const [pad,v] of [[1.2,3],[.5,4],[0,5]])for(let i=1;i<p.length;i++)seg(Lf,p[i-1],p[i],pad,v);}}
   const g=RX.getContext('2d'),id=g.createImageData(W,H),d=id.data;for(let i=0;i<N;i++){const v=Lf[i];if(!v)continue;const c3=v===5?[10,3,22]:PAL[v],o=i*4;d[o]=c3[0];d[o+1]=c3[1];d[o+2]=c3[2];d[o+3]=255;}g.putImageData(id,0,0);}
  // shards near crack points
  SH.innerHTML='';const all=cracks.flat();for(let i=0;i<16;i++){const q=all[(rnd()*all.length)|0],e=document.createElement('i');
    e.style.cssText=`left:${(q.x*PX).toFixed(0)}px;top:${(q.y*PX).toFixed(0)}px;--s:${PX*(1+(rnd()<.4))}px;--c:${['#fff','#ff6ee6','#c33cff'][i%3]};--d:${(2+rnd()*2).toFixed(1)}s;--dl:-${(rnd()*3).toFixed(1)}s;--dx:${((rnd()-.5)*80).toFixed(0)}px;--dy:${((rnd()-.5)*80).toFixed(0)}px`;SH.appendChild(e);}
  cardsAt.forEach(c=>c.stage=Math.min(3,Math.floor(c.d/maxD*4-1e-6)));
  const g=RF.getContext('2d');g.clearRect(0,0,W,H);if(stage>=0)g.drawImage(stages[Math.min(3,stage)],0,0);
  if(stage>=3)cardsAt.forEach(c=>c.el.classList.add('out'));
}
function setStage(s){stage=s;const g=RF.getContext('2d');g.clearRect(0,0,RF.width,RF.height);g.drawImage(stages[s],0,0);
  cardsAt.forEach(c=>{if(c.stage<=s)c.el.classList.add('out');});
  L.classList.remove('shk');FL.classList.remove('go');void L.offsetWidth;L.classList.add('shk');FL.classList.add('go');
  if(s===3)setTimeout(()=>L.classList.add('done'),300);}

function layout(){PX=getPX();for(const f of [drawSky,drawIsland,drawRift]){try{const p=f();if(p&&p.catch)p.catch(e=>console.warn(e));}catch(e){console.warn('llc layout step failed',e);if(f===drawRift){L.classList.add('fail','in','done');}}}}
let la=null,lb=null;
(window.FFC_HOOKS=window.FFC_HOOKS||[]).push(dt=>{
  if(!ready)return;
  const vis=e=>{const r=e.getBoundingClientRect();return r.bottom>-50&&r.top<innerHeight+50;};
  const lv=vis(L),iv=vis(I)||vis(T);
  if(lv!==la){la=lv;L.classList.toggle('idle',!lv);}if(iv!==lb){lb=iv;I.classList.toggle('idle',!iv);T.classList.toggle('idle',!iv);}
  if(iv)islandFrame(Math.min(dt,.05));
  if(lv){if(!started&&L.getBoundingClientRect().top<innerHeight*.5){started=1;L.classList.add('in');rt=0;}
    if(started&&stage<3){rt+=dt;const want=Math.min(3,Math.floor((rt-.5)/.45));if(want>stage&&want>=0)setStage(stage+1);}}
});
let rz;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{if(ready)layout();},120);});
addEventListener('ffc-trees',()=>{const p=getPX();if(!ready){ready=1;layout();}else if(p!==PX)layout();});
setTimeout(()=>{if(!ready){ready=1;layout();}},1500);
})();
