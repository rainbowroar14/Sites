// Rift: crack forms in one section of the sky, a jagged hole shatters open and reveals a peek at Archive of Things.
// Perf: runs from the page's single rAF loop (FFC_HOOKS), does nothing off-screen, all glows/scars/sky baked once.
(()=>{
const el=document.getElementById('rift'),fx=document.getElementById('fx'),g=fx.getContext('2d');
let PX=1,W=0,H=0,state=0,t0=0,time=0,crack=[],shards=[],seed=1,dirty=false;
let pr={x:0,y:0,w:0,h:0};           // panel rect in page css px (cached; no per-frame layout reads)
let hole=[],scars=[],layer=null,LM=0; // hole polygon (region-local canvas px), baked sky/scar layer
const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function measure(){PX=window.FFC_PX||1;W=Math.ceil(innerWidth/PX);H=Math.ceil(innerHeight/PX);fx.width=W;fx.height=H;
  const r=el.getBoundingClientRect();pr={x:r.left,y:r.top+scrollY,w:r.width,h:r.height};
  if(state>=2){layer=null;}}  // rebuild baked layer at new scale
addEventListener('resize',()=>setTimeout(measure,50));
const R=()=>({x:pr.x/PX,y:pr.y/PX,w:pr.w/PX,h:pr.h/PX});
// ---------- geometry
function buildHole(Rg){ // irregular jagged opening, roughly centred, ~60% x 70% of the window; big sky chunks stay
  hole=[];seed=31;const cx=Rg.w*.5,cy=Rg.h*.54,N=34;
  for(let i=0;i<N;i++){const a=i/N*6.283-1.57;
    let k=(i%2?.78:1)*(.86+rnd()*.26);if(rnd()<.12)k*=.72;            // jagged teeth + occasional deep notch
    const rx=Rg.w*.33*k,ry=Rg.h*.41*k;hole.push([cx+Math.cos(a)*rx,cy+Math.sin(a)*ry]);}
}
function inHole(x,y){let c=false;for(let i=0,j=hole.length-1;i<hole.length;j=i++){const [xi,yi]=hole[i],[xj,yj]=hole[j];
  if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))c=!c;}return c;}
function buildCrack(Rg){
  crack=[];seed=7;const cx=Rg.w*.5,cy=Rg.h*.54;
  function branch(x,y,ang,len,t,depth){let px=x,py=y;const steps=Math.max(4,len/9|0);
    for(let i=0;i<steps;i++){ang+=(rnd()-.5)*.9;const L=len/steps;const nx=px+Math.cos(ang)*L,ny=py+Math.sin(ang)*L;
      crack.push({x0:px,y0:py,x1:nx,y1:ny,t:t+i*.05,w:depth?1:2});
      if(depth<2&&rnd()<.28)branch(nx,ny,ang+(rnd()<.5?1:-1)*(.6+rnd()*.7),len*.45,t+i*.05+.05,depth+1);px=nx;py=ny;}}
  branch(cx,cy,Math.PI+(rnd()-.5)*.3,Rg.w*.42,0,0);branch(cx,cy,(rnd()-.5)*.3,Rg.w*.42,0,0);
  branch(cx,cy,-Math.PI/2+(rnd()-.5)*.6,Rg.h*.45,.2,1);branch(cx,cy,Math.PI/2+(rnd()-.5)*.6,Rg.h*.45,.25,1);
}
function buildScars(Rg){ // fracture lines radiating from the hole's rim out across the sky (over the hidden window parts)
  scars=[];seed=23;const cx=Rg.w*.5,cy=Rg.h*.54;
  for(let k=0;k<14;k++){const v=hole[(rnd()*hole.length)|0];let [px,py]=v,ang=Math.atan2(py-cy,px-cx)+(rnd()-.5)*.6;
    const len=(30+rnd()*90)/PX*1.5,steps=Math.max(3,len/7|0),path=[[px,py]];
    for(let i=0;i<steps;i++){ang+=(rnd()-.5)*.8;px+=Math.cos(ang)*len/steps;py+=Math.sin(ang)*len/steps;path.push([px,py]);
      if(rnd()<.16){let a2=ang+(rnd()<.5?1:-1)*(.7+rnd()*.6),bx=px,by=py;const sub=[[bx,by]];for(let j=0;j<3;j++){a2+=(rnd()-.5)*.8;bx+=Math.cos(a2)*len/steps;by+=Math.sin(a2)*len/steps;sub.push([bx,by]);}scars.push({p:sub,t:.3+rnd()*.3});}}
    scars.push({p:path,t:rnd()*.3,seed:[v[0],v[1],Math.atan2(v[1]-cy,v[0]-cx)]});}
}
function line(c,x0,y0,x1,y1,w){x0|=0;y0|=0;x1|=0;y1|=0;const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let e=dx+dy;
  for(let n=0;n<4000;n++){c.fillRect(x0,y0,w,w);if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx;}if(e2<=dx){e+=dx;y0+=sy;}}}
function bakeLayer(Rg){ // sky fragments covering the window (with stars), scars with glow, glowing rim lip. Built once.
  LM=Math.ceil(130/PX*1.5);layer=document.createElement('canvas');layer.width=Math.ceil(Rg.w+LM*2);layer.height=Math.ceil(Rg.h+LM*2);
  const c=layer.getContext('2d'),o=LM;seed=99;
  // sky over the window except the hole (slightly larger than the window so its edges never peek out)
  c.beginPath();c.rect(o-2,o-2,Rg.w+4,Rg.h+4);c.moveTo(o+hole[0][0],o+hole[0][1]);for(let i=hole.length-1;i>=0;i--)c.lineTo(o+hole[i][0],o+hole[i][1]);c.closePath();
  c.fillStyle='#07060d';c.fill('evenodd');
  c.save();c.clip('evenodd');for(let i=0;i<Rg.w*Rg.h/215;i++){const l=80+(rnd()*175|0);c.fillStyle=`rgb(${l},${l},${Math.min(255,l+30)})`;c.fillRect(o+rnd()*Rg.w|0,o+rnd()*Rg.h|0,PX<2?2:1,PX<2?2:1);}c.restore();
  // scars: soft glow (wide faint line, blurred once) + bright core + displaced stars
  const gl=document.createElement('canvas');gl.width=layer.width;gl.height=layer.height;const q=gl.getContext('2d');q.fillStyle='rgba(90,175,255,.9)';
  for(const s of scars)for(let i=0;i<s.p.length-1;i++)line(q,o+s.p[i][0],o+s.p[i][1],o+s.p[i+1][0],o+s.p[i+1][1],3);
  q.beginPath();q.moveTo(o+hole[0][0],o+hole[0][1]);for(const p of hole)q.lineTo(o+p[0],o+p[1]);q.closePath();q.strokeStyle='rgba(90,175,255,.9)';q.lineWidth=3;q.stroke();
  c.save();c.filter='blur(3px)';c.globalAlpha=.7;c.drawImage(gl,0,0);c.restore();
  for(const s of scars)for(let i=0;i<s.p.length-1;i++){c.fillStyle=`rgba(205,235,255,${.85-.55*i/s.p.length})`;line(c,o+s.p[i][0],o+s.p[i][1],o+s.p[i+1][0],o+s.p[i+1][1],1);
    if(rnd()<.45){c.fillStyle='rgba(240,244,255,.9)';c.fillRect(o+s.p[i][0]+(rnd()-.5)*5|0,o+s.p[i][1]+(rnd()-.5)*5|0,1,1);}}
  c.beginPath();c.moveTo(o+hole[0][0],o+hole[0][1]);for(const p of hole)c.lineTo(o+p[0],o+p[1]);c.closePath();c.strokeStyle='rgba(185,225,255,.95)';c.lineWidth=1;c.stroke();
}
function buildShards(Rg){ // only the sky inside the hole shatters; plus small rim debris along the scars
  shards=[];seed=11;const C=11,Rw=7,pts=[];
  for(let j=0;j<=Rw;j++){pts.push([]);for(let i=0;i<=C;i++){const e=i===0||j===0||i===C||j===Rw;pts[j].push([i/C*Rg.w+(e?0:(rnd()-.5)*Rg.w/C*.8),j/Rw*Rg.h+(e?0:(rnd()-.5)*Rg.h/Rw*.8)]);}}
  const cx=Rg.w/2,cy=Rg.h*.54,DD=Math.hypot(cx,cy);
  for(let j=0;j<Rw;j++)for(let i=0;i<C;i++){const a=pts[j][i],b=pts[j][i+1],c=pts[j+1][i+1],d=pts[j+1][i];
    for(const tr of (rnd()<.5?[[a,b,c],[a,c,d]]:[[a,b,d],[b,c,d]])){const mx=(tr[0][0]+tr[1][0]+tr[2][0])/3,my=(tr[0][1]+tr[1][1]+tr[2][1])/3;
      if(!inHole(mx,my))continue;const dx=mx-cx,dy=my-cy,dd=Math.hypot(dx,dy)||1,sp=(120+rnd()*220)*(1.2-dd/DD*.5)/PX*1.5;
      const st=[];for(let k=0;k<2;k++)if(rnd()<.6)st.push([(rnd()-.5)*6,(rnd()-.5)*6]);
      shards.push({pts:tr.map(p=>[p[0]-mx,p[1]-my]),x:mx,y:my,vx:dx/dd*sp+(rnd()-.5)*40,vy:dy/dd*sp+(rnd()-.5)*40-30,r:0,vr:(rnd()-.5)*7,delay:dd/DD*.12,st});}}
  for(const s of scars){if(!s.seed)continue;const [x,y,ang]=s.seed;
    for(let k=0;k<2;k++){const d=(2+k*5+rnd()*3)/PX*1.5,mx=x+Math.cos(ang)*d,my=y+Math.sin(ang)*d,z=(2.5+rnd()*2.5)/PX*1.5,sp=(60+rnd()*110)/PX*1.5;
      shards.push({pts:[[-z,-z*.6],[z,-z*.3],[(rnd()-.5)*z,z]],x:mx,y:my,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp-20,r:rnd()*6,vr:(rnd()-.5)*9,delay:.08+rnd()*.35,st:[]});}}
}
const T_CRACK=1.5,T_HOLD=.35,T_SHARD=1.8;
function reveal(){el.classList.add('open');document.dispatchEvent(new Event('rift-open'));}
window.RIFT_HIT=(clientX,clientY)=>{ // is a click inside the opening? (sky fragments block the rest)
  if(state<2||!hole.length)return false;const x=(clientX-pr.x)/PX,y=(clientY+scrollY-pr.y)/PX;return inHole(x,y);};
function hook(dt){
  time+=dt;if(window.FFC_PX&&window.FFC_PX!==PX)measure();
  const top=pr.y-scrollY,vis=top<innerHeight+200&&top+pr.h>-200;
  if(state===0){ if(top<innerHeight*.7&&top+pr.h>0){const Rg=R();buildHole(Rg);buildCrack(Rg);buildScars(Rg);state=1;t0=time;document.dispatchEvent(new Event('rift-open'));}
    else if(top+pr.h<=0){const Rg=R();buildHole(Rg);buildCrack(Rg);buildScars(Rg);state=3;reveal();} }
  if(state===0){if(dirty){g.clearRect(0,0,W,H);dirty=false;}return;}
  if(!vis&&state!==1&&state!==2){if(dirty){g.clearRect(0,0,W,H);dirty=false;}return;}   // off-screen: no work
  if(state===2&&!vis){}                                                                  // keep simulating briefly
  g.clearRect(0,0,W,H);dirty=true;
  const Rg=R(),ox=Rg.x,oy=Rg.y-scrollY/PX,t=time-t0;
  if(state===1){const k=t/T_CRACK;
    const rg=g.createRadialGradient(ox+Rg.w/2,oy+Rg.h*.54,0,ox+Rg.w/2,oy+Rg.h*.54,Rg.w*.5);
    rg.addColorStop(0,`rgba(120,190,255,${.22*clamp(k)})`);rg.addColorStop(1,'rgba(0,128,128,0)');g.fillStyle=rg;g.fillRect(ox,oy,Rg.w,Rg.h);
    const fl=t>T_CRACK?(.7+.3*Math.sin(t*60)):1;
    g.fillStyle=`rgba(90,170,255,${.35*fl})`;
    for(const s of crack){const p=clamp((k*1.15-s.t)/.12);if(p>0)line(g,ox+s.x0-1,oy+s.y0-1,ox+s.x0+(s.x1-s.x0)*p-1,oy+s.y0+(s.y1-s.y0)*p-1,s.w+2);}
    g.fillStyle=`rgba(235,246,255,${fl})`;
    for(const s of crack){const p=clamp((k*1.15-s.t)/.12);if(p>0)line(g,ox+s.x0,oy+s.y0,ox+s.x0+(s.x1-s.x0)*p,oy+s.y0+(s.y1-s.y0)*p,s.w);}
    // scars start creeping out late in the crack phase
    const age=clamp((k-.55)/.45);g.fillStyle='rgba(200,232,255,.7)';
    for(const s of scars){const q=clamp((age-s.t)/.5);const n=Math.round((s.p.length-1)*q);for(let i=0;i<n;i++)line(g,ox+s.p[i][0],oy+s.p[i][1],ox+s.p[i+1][0],oy+s.p[i+1][1],1);}
    if(t>T_CRACK+T_HOLD){state=2;t0=time;buildShards(Rg);reveal();}
    return;}
  if(!layer)bakeLayer(Rg);
  g.drawImage(layer,ox-LM,oy-LM);
  if(state===2){
    if(t<.35){g.globalAlpha=(1-t/.35)*.85;g.fillStyle='rgb(220,240,255)';g.beginPath();g.moveTo(ox+hole[0][0],oy+hole[0][1]);for(const p of hole)g.lineTo(ox+p[0],oy+p[1]);g.fill();g.globalAlpha=1;}
    let alive=0;g.strokeStyle='rgba(150,210,255,.9)';g.lineWidth=1;
    for(const s of shards){const lt=t-s.delay;
      if(lt>0){s.vy+=160*dt/PX*1.5;const dr=Math.exp(-.6*dt);s.vx*=dr;s.vy*=dr;s.x+=s.vx*dt;s.y+=s.vy*dt;s.r+=s.vr*dt;}
      const a=clamp(1-Math.max(0,lt)/T_SHARD);if(a<=0)continue;alive++;
      const c=Math.cos(s.r),sn=Math.sin(s.r),X=ox+s.x,Y=oy+s.y,P=s.pts;
      g.globalAlpha=a;g.beginPath();
      g.moveTo(X+P[0][0]*c-P[0][1]*sn,Y+P[0][0]*sn+P[0][1]*c);g.lineTo(X+P[1][0]*c-P[1][1]*sn,Y+P[1][0]*sn+P[1][1]*c);g.lineTo(X+P[2][0]*c-P[2][1]*sn,Y+P[2][0]*sn+P[2][1]*c);g.closePath();
      g.fillStyle='#07060d';g.fill();if(lt>0)g.stroke();
      if(s.st.length){g.fillStyle='#dfe6ff';for(const q of s.st)g.fillRect(X+q[0]|0,Y+q[1]|0,1,1);}}
    g.globalAlpha=1;if(!alive||t>T_SHARD+.5)state=3;}
}
(window.FFC_HOOKS=window.FFC_HOOKS||[]).push(hook);
addEventListener('load',measure);measure();
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
  while(x.measureText(TEXT).width>mw*.62){fs*=.95;x.font=`800 ${fs}px "Baloo 2", system-ui, sans-serif`;}
  x.textAlign='center';x.textBaseline='middle';x.fillStyle='#fff';x.fillText(TEXT,mw/2,mh*.33);
  const d=x.getImageData(0,0,mw,mh).data,step=Math.max(2.5,fs/17);let s=seed0;const R=()=>(s=(s*16807)%2147483647)/2147483647;const P=[];
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
document.addEventListener('rift-open',start);if(document.getElementById('rift').classList.contains('open'))start();
let rt=null;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{if(built){built=false;build();}},200);});
// click sequence (only inside the opening)
const h=document.getElementById('cae'),go=document.getElementById('go');
h.innerHTML=[...'Create and Explore'].map(ch=>`<span>${ch===' '?'&nbsp;':ch}</span>`).join('');
let played=false;
function play(){if(played)return;played=true;scr.classList.add('played');
  [...h.children].forEach((sp,i)=>setTimeout(()=>sp.classList.add('on'),i*55));setTimeout(()=>go.classList.add('on'),18*55+350);}
scr.addEventListener('click',e=>{if(e.target===go)return;if(window.RIFT_HIT&&!window.RIFT_HIT(e.clientX,e.clientY))return;play();});
scr.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();play();}});
})();
