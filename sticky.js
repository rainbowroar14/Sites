// Sticky Board section: cursor-"mice" carry letter notes in, smooth splat reveals the board. Delta-time, idle off-screen.
(()=>{
const SB='https://rainbowroar14.github.io/FinleyChang.com-Unblocked24/';
const COLORS=['#FFE566','#FFB4A2','#B8F2E6','#A0C4FF','#CDB4DB','#FFD6A5','#CAFFBF','#FF8FAB','#9BF6FF'];
const NAMES=['Finyey','Guest','Cooper','Maxwell','Doge','Cheems','Pog','Kappa','Guest','Finley'];
const sec=document.getElementById('sticky'),cv=document.getElementById('splat'),cx=cv.getContext('2d');
const board=document.getElementById('sboard'),word=document.getElementById('sword'),extras=document.getElementById('sextras');
const ease=t=>1-Math.pow(1-t,3),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const elastic=t=>{t=clamp(t);const c1=2.4,c3=c1+1,u=t-1;return 1+c3*u*u*u+c1*u*u;}; // ease-out-back: overshoot then settle
let state=0,t=0,items=[],W=0,H=0,DPR=1,pat=null,blobs=[],drops=[];
// --- letter notes + their cursor carriers
const LET='STICKY BOARD';
function rnd(a,b){return a+Math.random()*(b-a);}
function build(){
  [...LET].forEach((ch,i)=>{if(ch===' ')return;
    const n=document.createElement('div');n.className='lnote';n.textContent=ch;
    n.style.background=COLORS[i%COLORS.length];n.dataset.tilt=rnd(-9,9).toFixed(1);
    const m=document.createElement('div');m.className='mouse';m.innerHTML='<span class="mc"></span><span class="mn">'+NAMES[i%NAMES.length]+'</span>';
    word.append(n);sec.append(m);items.push({ch,i,n,m});});
}
function targets(){
  const r=sec.getBoundingClientRect();W=r.width;H=r.height;
  const two=true,sz=Math.round(Math.min(W/7.6,H/11,96));
  sec.style.setProperty('--ns',sz+'px');
  const rows=two?[[0,6],[7,12]]:[[0,12]];let k=0;
  rows.forEach(([a,b],ri)=>{const cnt=b-a,step=sz*1.12,x0=W/2-(cnt-1)*step/2,y=H/2+(ri-(rows.length-1)/2)*sz*1.25;
    for(let j=a;j<b;j++){const it=items.find(o=>o.i===j);if(!it){continue;}it.tx=x0+(j-a)*step;it.ty=y;}});
  items.forEach((it,j)=>{const e=j%4;const far=Math.max(W,H)*.65;
    it.sx=e==0?-80:e==1?W+80:it.tx+rnd(-200,200);it.sy=e==2?-80:e==3?H+80:it.ty+rnd(-150,150);
    if(e>=2&&false)it.sy=0;
    it.ex=it.tx<W/2?-120:W+120;it.ey=it.ty+rnd(-H*.4,H*.4);it.d=.15+j*.17;});
}
function place(it,x,y,rot,s){it.n.style.transform=`translate(${x}px,${y}px) translate(-50%,-50%) rotate(${rot}deg) scale(${s})`;}
function mouse(it,x,y,sq,show){it.m.style.opacity=show?1:0;it.m.style.transform=`translate(${x}px,${y}px) scale(${1+sq},${1-sq})`;}
// --- splat (smooth closed curve through lobed points + metaball-ish satellite blobs)
const backE=(t,c=1.6)=>{t=clamp(t);const u=t-1;return 1+(c+1)*u*u*u+c*u*u;};
// ---- polygon reveal: a cream triangle forms at the centre, then rounds of cursor-mice grab each edge's midpoint and drag it
// outward (new vertex, elastic snap on release): 3 -> 6 -> 12 -> 24 points, growing until it spans the section.
const R_T=.46,ROUNDS=[.7,.9,1.06],T0=.6,RD=1.7;           // triangle radius, per-round pull radius, timings (s)
const V=[];                                                // vertices: {a,born,round}
[-90,30,150].forEach(d=>V.push({a:d*Math.PI/180,born:0}));
for(let k=1;k<=ROUNDS.length;k++){const old=V.filter(v=>v.born<k).sort((p,q)=>p.a-q.a);
  for(let i=0;i<old.length;i++){const A=old[i],B=old[(i+1)%old.length];let b=B.a;if(b<=A.a)b+=6.283;
    V.push({a:(A.a+b)/2,born:k,A,B,name:NAMES[(i+k*3)%NAMES.length]});}}
V.sort((p,q)=>((p.a%6.283)+6.283)%6.283-((q.a%6.283)+6.283)%6.283);
const springE=s=>s<=0?0:1+Math.exp(-5.5*s)*Math.sin(16*s)*.09;  // elastic snap after release
const smooth3=x=>{x=clamp(x);return x*x*(3-2*x);};
// fixed-seed RNG: every mouse gets its own start time, approach direction/distance, speed and pull length
const RNG=(s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;})(20261023);
const rr=(a,b)=>a+RNG()*(b-a);
V.forEach(v=>{if(!v.born){v.rel=T0;v.tgt=R_T;}});
for(let k=1;k<=ROUNDS.length;k++)V.filter(v=>v.born===k).sort(()=>RNG()-.5).forEach(v=>{
  v.run=rr(.35,.95);v.drag=rr(.45,.8);v.s=Math.max(v.A.rel,v.B.rel)+rr(0,1.1)-(k===1?.0:.25);  // staggered, overlapping arrivals
  v.s=Math.max(v.s,Math.max(v.A.rel,v.B.rel)-.2);
  v.g0=v.s+v.run;v.rel=v.g0+v.drag;v.tgt=ROUNDS[k-1]*rr(.82,1.14);                                   // each pulls a different length
  v.ang=v.a+rr(-.75,.75);v.far=rr(.45,1.05);});
// per-round drift window for the older vertices (they ease outward while that round's pulls happen)
const WIN=ROUNDS.map((R,k)=>{const vs=V.filter(v=>v.born===k+1);return [Math.min(...vs.map(v=>v.g0)),Math.max(...vs.map(v=>v.rel))];});
V.forEach(v=>v.drift=ROUNDS.map(()=>rr(.88,1.04)));
function rAt(v,u){ // radius (ellipse-normalised) of vertex v at time u; null = not yet grabbed (sits on its edge midpoint)
  let r;
  if(!v.born)r=R_T*backE(u/T0,1.4);
  else{if(u<v.g0)return null;const g=smooth3((u-v.g0)/v.drag),m=lerpR(v,u);r=m+(v.tgt-m)*g;if(u>v.rel)r=v.tgt*springE(u-v.rel);}
  for(let k=Math.max(1,v.born+1);k<=ROUNDS.length;k++){const [a,b]=WIN[k-1],g=smooth3((u-a)/(b-a+.001)),tgt=Math.max(r,ROUNDS[k-1]*.96*v.drift[k-1]);r=r+(tgt-r)*g;}
  return r;}
const RX=()=>W*.5,RY=()=>H*.46;
function pos(v,u){const r=rAt(v,u);if(r===null){const a=pos(v.A,u),b=pos(v.B,u);return [(a[0]+b[0])/2,(a[1]+b[1])/2];}
  return [W/2+Math.cos(v.a)*r*RX(),H/2+Math.sin(v.a)*r*RY()];}
function lerpR(v,u){const a=pos(v.A,u),b=pos(v.B,u),x=(a[0]+b[0])/2-W/2,y=(a[1]+b[1])/2-H/2;return Math.hypot(x/RX(),y/RY());}
function polyPath(u){const P=new Path2D();const live=V.filter(v=>!v.born||u>=v.s);
  live.forEach((v,i)=>{const p=pos(v,u);i?P.lineTo(p[0],p[1]):P.moveTo(p[0],p[1]);});P.closePath();return P;}
// grab-mice: one per new vertex (pooled DOM nodes, same style as the letter mice)
const GM=V.filter(v=>v.born>0).map(v=>{const m=document.createElement('div');m.className='mouse';
  m.innerHTML='<span class="mc"></span><span class="mn">'+v.name+'</span>';sec.append(m);return {v,m};});
function grabMice(u){for(const g of GM){const v=g.v,k=u-v.s,out=u-v.rel;
  if(k<0||out>.9){if(g.on){g.m.style.opacity=0;g.on=0;}continue;}
  const p=pos(v,u),dx=Math.cos(v.ang),dy=Math.sin(v.ang),far=Math.max(W,H)*v.far;let x,y,sq;
  if(u<v.g0){const e=ease(k/v.run);x=p[0]+dx*far*(1-e);y=p[1]+dy*far*(1-e);sq=Math.sin(k*30/v.run*.5)*.12;}   // scurry in (own speed/direction)
  else if(out<0){x=p[0];y=p[1];sq=-.12;}                                                                   // grab + drag outward
  else{const e=clamp(out/.9),ox=Math.cos(v.a),oy=Math.sin(v.a);x=p[0]+ox*far*e*e;y=p[1]+oy*far*e*e;sq=Math.sin(out*34)*.14;}  // let go, run off
  g.m.style.opacity=1;g.on=1;g.m.style.transform=`translate(${x-3}px,${y-3}px) scale(${1.5*(1+sq)},${1.5*(1-sq)})`;}}
const T_END=Math.max(...V.map(v=>v.rel||0))+.9;
const ANCH=[[-.74,.08],[-.5,.62],[.62,-.36],[.3,-.68],[.6,.5],[-.4,-.66],[-.72,-.3],[.04,.74]];
function SPS(){return Math.min(H/459,W/300);}
function mkPat(c2){const c=document.createElement('canvas');c.width=c.height=28;const g=c.getContext('2d');g.fillStyle='#e7e5e4';g.beginPath();g.arc(14,14,1.3,0,7);g.fill();return c2.createPattern(c,'repeat');}
function paint(g,paths,soft){ // glossy cream: drop shadow (blurred only in the one-off final bake), board dots, inner shade, white rim
  g.save();g.lineJoin='round';
  if(soft){g.shadowColor='rgba(0,0,0,.45)';g.shadowBlur=24;g.shadowOffsetY=10;}
  else{g.fillStyle='rgba(0,0,0,.28)';g.save();g.translate(0,9);for(const P of paths)g.fill(P);g.restore();}
  g.fillStyle='#fffef8';for(const P of paths)g.fill(P);g.shadowColor='transparent';g.shadowBlur=0;g.shadowOffsetY=0;
  for(const P of paths){g.save();g.clip(P);g.fillStyle=pat;g.fillRect(0,0,W,H);
    g.strokeStyle='rgba(120,110,100,.13)';g.lineWidth=18;g.translate(-6,-8);g.stroke(P);g.translate(6,8);
    g.strokeStyle='rgba(255,255,255,.95)';g.lineWidth=10;g.translate(6,7);g.stroke(P);g.translate(-6,-7);g.restore();}
  g.restore();}
function drawSplat(u,final){if(!pat)pat=mkPat(cx);cx.setTransform(DPR,0,0,DPR,0,0);cx.clearRect(0,0,W,H);
  paint(cx,[polyPath(Math.min(u,T_END))],!!final);if(!final)grabMice(u);else GM.forEach(g=>g.m.style.opacity=0);}
// ---- responsive collision-checked layout: every note, meme and doodle sits fully inside the board's safe ellipse and the
// section (which is one viewport tall), clear of the STICKY BOARD letters and of each other.
let RECTS=[],LET_R=null,FREE=[];
const SAFE=.8,MG=10;
function inSafe(x,y){const nx=(x-W/2)/RX(),ny=(y-H/2)/RY();return nx*nx+ny*ny<=SAFE*SAFE;}
function rectOK(r,list){if(r.x<MG||r.y<MG||r.x+r.w>W-MG||r.y+r.h>H-MG)return false;
  if(!(inSafe(r.x,r.y)&&inSafe(r.x+r.w,r.y)&&inSafe(r.x,r.y+r.h)&&inSafe(r.x+r.w,r.y+r.h)))return false;
  for(const o of list)if(r.x<o.x+o.w+MG&&r.x+r.w+MG>o.x&&r.y<o.y+o.h+MG&&r.y+r.h+MG>o.y)return false;return true;}
function findSpot(w,h,pref,list){let best=null,bd=1e18;const st=Math.max(8,Math.min(W,H)/60);
  for(let y=MG;y+h<=H-MG;y+=st)for(let x=MG;x+w<=W-MG;x+=st){const r={x,y,w,h};if(!rectOK(r,list))continue;
    const d=(x+w/2-pref[0])**2+(y+h/2-pref[1])**2;if(d<bd){bd=d;best=r;}}return best;}
function letterRect(){const sz=Math.round(Math.min(W/7.6,H/11,96)),w=6*sz*1.12+sz*.3,h=sz*2.25+sz*.35;return {x:W/2-w/2,y:H/2-h/2-sz*.05,w,h};}
const DOODLE_SZ=[[76,76],[58,58],[60,56],[92,56]]; // smiley, star, heart, lol! (css px at S=1)
function layoutExtras(){
  LET_R=letterRect();let es=Math.max(.45,Math.min(1,W/1100,H/800));
  for(let tries=0;tries<12;tries++){const list=[LET_R],out=[];let ok=true;
    [...extras.children].forEach((el,k)=>{if(!ok)return;if(getComputedStyle(el).display==='none'){out.push(null);return;}
      const a=ANCH[k%ANCH.length],w=el.offsetWidth*es*1.1,h=el.offsetHeight*es*1.1+14*es; // +rotation slack, +tape
      const r=findSpot(w,h,[W/2+a[0]*RX()*.8,H/2+a[1]*RY()*.8],list);if(!r){ok=false;return;}list.push(r);out.push(r);});
    if(ok){extras.style.setProperty('--es',es.toFixed(3));RECTS=list;
      [...extras.children].forEach((el,k)=>{const r=out[k];if(!r)return;el.style.left=(r.x+r.w/2)+'px';el.style.top=(r.y+r.h/2+7*es)+'px';});
      return;}
    es*=.9;}
  extras.style.setProperty('--es',es.toFixed(3));RECTS=[LET_R];}
function doodleSpots(S){const list=RECTS.slice(),spots=[];const pref=[[W/2,LET_R.y-60*S],[W/2+LET_R.w*.6,LET_R.y],[W/2-LET_R.w*.3,LET_R.y+LET_R.h+60*S],[W/2+LET_R.w*.3,LET_R.y+LET_R.h+50*S]];
  DOODLE_SZ.forEach(([w,h],i)=>{const r=findSpot(w*S+8,h*S+8,pref[i],list);if(r){list.push(r);spots.push([r.x+r.w/2,r.y+r.h/2]);}else spots.push(null);});
  FREE=list;return spots;}
function resize(){const r=sec.getBoundingClientRect();W=r.width;H=r.height;DPR=Math.min(1.5,devicePixelRatio||1);cv.width=W*DPR;cv.height=H*DPR;layoutExtras();}
function finalState(){state=3;sec.classList.add('done');targets();resize();drawSplat(T_END,true);buildDoodles();dragIn(0,true);doodle(0,true);
  items.forEach(it=>{place(it,it.tx,it.ty,+it.n.dataset.tilt,1);it.n.style.opacity=1;mouse(it,0,0,0,false);});}
// ---- phase 3: mice drag each meme/note in by a corner (swing, squash drop, tape slap), then a marker-mouse doodles on the board
[...extras.querySelectorAll(':scope>img')].forEach(img=>{const w=document.createElement('div');w.className='memew'+(img.classList.contains('hide-sm')?' hide-sm':'');
  w.setAttribute('style',img.getAttribute('style'));w.dataset.alt=img.alt;img.removeAttribute('style');img.classList.remove('hide-sm');img.replaceWith(w);w.append(img);});
const EX=[...extras.children];
EX.forEach((el,k)=>{const tp=document.createElement('i');tp.className='tape';tp.style.setProperty('--tr',(rr(-14,14)).toFixed(1)+'deg');el.append(tp);
  const m=document.createElement('div');m.className='mouse';m.innerHTML='<span class="mc"></span><span class="mn">'+NAMES[(k+4)%NAMES.length]+'</span>';sec.append(m);
  el._d={m,s:rr(0,2.4),dur:rr(.9,1.4),ang:rr(0,6.283),far:rr(.6,1),cx:RNG()<.5?-1:1,sw:rr(5,10)};});
EX.sort((a,b)=>a._d.s-b._d.s);
const DOODLE_T0=1.2,MARK=document.createElement('div');MARK.className='mouse marker';MARK.innerHTML='<span class="mc"></span><span class="pen"></span><span class="mn">Finley</span>';sec.append(MARK);
const SVGN='http://www.w3.org/2000/svg',svg=document.getElementById('doodle');let strokes=[],DT_END=0;
const jit=()=>rr(-1.6,1.6);
function buildDoodles(){svg.innerHTML='';strokes=[];svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const S=Math.max(.55,Math.min(1.1,Math.min(W,H)/850)),P=(x,y)=>[W/2+x*RX(),H/2+y*RY()];
  const add=(d,w=4.2)=>{const p=document.createElementNS(SVGN,'path');p.setAttribute('d',d);p.setAttribute('stroke-width',w*S);svg.append(p);strokes.push({p,L:0});};
  const circ=(cx,cy,r,turn=1.08)=>{let d='';const n=26;for(let i=0;i<=n*turn;i++){const a=-1.9+i/n*6.283,rr_=r*(1+.04*Math.sin(i*1.7));d+=(i?'L':'M')+(cx+Math.cos(a)*rr_+jit()*.4).toFixed(1)+' '+(cy+Math.sin(a)*rr_+jit()*.4).toFixed(1);}return d;};
  const W_=W<600,SPOT=doodleSpots(S);
  // smiley
  if(SPOT[0]){const [x,y]=SPOT[0],r=34*S;add(circ(x,y,r));add(`M${x-12*S} ${y-9*S}l${1*S} ${7*S}`);add(`M${x+12*S} ${y-9*S}l${1*S} ${7*S}`);
   add(`M${x-18*S} ${y+8*S}Q${x} ${y+28*S} ${x+19*S} ${y+6*S}`);}
  // arrows pointing at memes (cat + doge)
  const arrow=(from,to)=>{const [x0,y0]=from,[x1,y1]=to,mx=(x0+x1)/2+(y1-y0)*.25,my=(y0+y1)/2-(x1-x0)*.25;add(`M${x0} ${y0}Q${mx} ${my} ${x1} ${y1}`);
    const a=Math.atan2(y1-my,x1-mx),h=16*S;add(`M${x1-Math.cos(a-.5)*h} ${y1-Math.sin(a-.5)*h}L${x1} ${y1}L${x1-Math.cos(a+.5)*h} ${y1-Math.sin(a+.5)*h}`);};
  const at=(el,dx,dy)=>[parseFloat(el.style.left)+dx,parseFloat(el.style.top)+dy];
  const cat=EX.find(e=>e.dataset.alt==='maxwell'),doge=EX.find(e=>e.dataset.alt==='doge');
  const es=+extras.style.getPropertyValue('--es')||1,inR=(x,y)=>FREE.some(o=>x>o.x-6&&x<o.x+o.w+6&&y>o.y-6&&y<o.y+o.h+6);
  const point=(el)=>{if(!el||getComputedStyle(el).display==='none')return;const cx0=parseFloat(el.style.left),cy0=parseFloat(el.style.top),hw=el.offsetWidth*es/2,hh=el.offsetHeight*es/2;
    let dx=W/2-cx0,dy=H/2-cy0;const m=Math.hypot(dx,dy)||1;dx/=m;dy/=m;const k=Math.min(hw/Math.max(.01,Math.abs(dx)),hh/Math.max(.01,Math.abs(dy)))+8,t=[cx0+dx*k,cy0+dy*k];
    for(const th of [0,.45,-.45,.9,-.9,1.3,-1.3])for(const L of [110*S,80*S,60*S]){const ax=Math.cos(th)*dx-Math.sin(th)*dy,ay=Math.sin(th)*dx+Math.cos(th)*dy,p0=[t[0]+ax*L,t[1]+ay*L];
      let ok=inSafe(p0[0],p0[1]);for(let q=.25;q<=1&&ok;q+=.25)if(inR(t[0]+ax*L*q,t[1]+ay*L*q))ok=false;if(ok){arrow(p0,t);return;}}};
  point(cat);point(doge);
  // heart
  if(SPOT[2]){const [x,y]=[SPOT[2][0],SPOT[2][1]-4*S],s=22*S;add(`M${x} ${y+s*1.1}C${x-s*2.2} ${y-s*.2} ${x-s*1.1} ${y-s*1.7} ${x} ${y-s*.5}C${x+s*1.1} ${y-s*1.7} ${x+s*2.2} ${y-s*.2} ${x+jit()} ${y+s*1.1}`);}
  // star
  if(SPOT[1]){const [x,y]=SPOT[1],r=26*S;let d='';for(let i=0;i<=5;i++){const a=-Math.PI/2+i*4*Math.PI/5;d+=(i?'L':'M')+(x+Math.cos(a)*r+jit()).toFixed(1)+' '+(y+Math.sin(a)*r+jit()).toFixed(1);}add(d);}
  // 'lol!' scribble
  if(SPOT[3]){const [x,y]=[SPOT[3][0]-30*S,SPOT[3][1]+6*S],s=S;add(`M${x} ${y-26*s}Q${x-3*s} ${y-6*s} ${x+2*s} ${y+6*s}`,4.6);add(circ(x+20*s,y-2*s,9*s,1.05),4.6);
   add(`M${x+40*s} ${y-28*s}Q${x+37*s} ${y-6*s} ${x+43*s} ${y+6*s}`,4.6);add(`M${x+56*s} ${y-28*s}L${x+54*s} ${y-6*s}`,4.6);add(`M${x+53*s} ${y+3*s}l${1*s} ${1.5*s}`,6);
   add(`M${x-6*s} ${y+16*s}Q${x+30*s} ${y+24*s} ${x+66*s} ${y+13*s}`,3.4);}
  let tt=DOODLE_T0;for(const s of strokes){s.L=s.p.getTotalLength();s.p.style.strokeDasharray=s.L+' '+(s.L+2);s.p.style.strokeDashoffset=s.L;
    s.t0=tt+.18;s.t1=s.t0+Math.max(.12,s.L/520);tt=s.t1;}DT_END=tt+.6;}
let lastTip=null;
function doodle(u,final){ // u = seconds since the drag phase started
  for(const s of strokes){const k=final?1:clamp((u-s.t0)/(s.t1-s.t0));s.p.style.strokeDashoffset=(s.L*(1-k)).toFixed(1);}
  if(final){MARK.style.opacity=0;return;}
  const cur=strokes.find(s=>u<s.t1)||null;let x,y;
  if(!cur){const e=clamp((u-DT_END+.6)/.6),p=lastTip||[W,H];x=p[0]+e*e*W*.6;y=p[1]+e*e*H*.3;MARK.style.opacity=e<1?1:0;}
  else if(u<cur.t0){const prev=strokes[strokes.indexOf(cur)-1],a=prev?prev.p.getPointAtLength(prev.L):{x:W*1.1,y:H*.2},b=cur.p.getPointAtLength(0),e=smooth3((u-(prev?prev.t1:DOODLE_T0-.8))/(cur.t0-(prev?prev.t1:DOODLE_T0-.8)));x=a.x+(b.x-a.x)*e;y=a.y+(b.y-a.y)*e;MARK.style.opacity=1;}
  else{const q=cur.p.getPointAtLength(cur.L*clamp((u-cur.t0)/(cur.t1-cur.t0)));x=q.x;y=q.y;MARK.style.opacity=1;}
  lastTip=[x,y];MARK.style.transform=`translate(${x-26}px,${y-26}px) scale(1.4)`;}
function dragIn(u,final){ // drag each extra in from off-screen
  const es=+extras.style.getPropertyValue('--es')||1;
  for(const el of EX){const d=el._d,k=final?9:u-d.s,r0=parseFloat(el.style.getPropertyValue('--r'))||0,hw=el.offsetWidth*es/2,hh=el.offsetHeight*es/2;
    if(k<0){el.style.opacity=0;d.m.style.opacity=0;continue;}el.style.opacity=1;
    let dx=0,dy=0,rot=r0,sx=1,sy=1,mo=0;
    if(k<d.dur){const e=ease(k/d.dur),far=Math.max(W,H)*d.far*(1-e);dx=Math.cos(d.ang)*far;dy=Math.sin(d.ang)*far;
      const vx=-Math.cos(d.ang)*(1-e);rot=d.cx*d.sw+Math.sin(k*9)*4*(1-e)+vx*8;mo=1;}       // held by a corner: tilt + swing
    else if(k<d.dur+.45){const s=(k-d.dur)/.45;rot=d.cx*d.sw*(1-smooth3(s*1.6))+r0*smooth3(s*1.6);  // drop: squash bounce + rotate to final tilt
      const b=Math.exp(-6*s)*Math.sin(s*20);sx=1+.12*b;sy=1-.12*b;mo=s<.6?1:0;if(!el._taped&&s>.25){el._taped=1;el.classList.add('taped');}}
    else{if(!el._taped){el._taped=1;el.classList.add('taped');}}
    el.style.transform=`translate(-50%,-50%) translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${(es*sx).toFixed(3)},${(es*sy).toFixed(3)})`;
    if(mo){const c=(rot*Math.PI/180),ox=d.cx*hw*.85,oy=-hh*.85,mx=parseFloat(el.style.left)+dx+ox*Math.cos(c)-oy*Math.sin(c),my=parseFloat(el.style.top)+dy+ox*Math.sin(c)+oy*Math.cos(c);
      d.m.style.opacity=1;d.m.style.transform=`translate(${mx-3}px,${my-3}px) scale(1.4)`;d.last=[mx,my];}
    else if(d.last&&k<d.dur+1.2){const e=clamp((k-d.dur-.25)/.9);d.m.style.opacity=e<1?1:0;d.m.style.transform=`translate(${d.last[0]+Math.cos(d.ang)*W*e*e}px,${d.last[1]+Math.sin(d.ang)*H*e*e}px) scale(1.4)`;}
    else d.m.style.opacity=0;}}
const DRAG_END=()=>Math.max(...EX.map(e=>e._d.s+e._d.dur))+1.3;
function visible(){const r=sec.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight;}
function hook(dt){
  if(state===3)return;
  if(state===0){const r=sec.getBoundingClientRect();
    if(r.bottom<0){finalState();return;}           // loaded scrolled past it
    if(r.top<innerHeight*.55&&r.bottom>innerHeight*.3){state=1;t=0;resize();targets();drawSplat(0);items.forEach(it=>it.n.style.opacity=1);}else return;}
  if(!visible())return;                             // skip all work off-screen
  t+=Math.min(dt,.05);
  if(state===1){let done=true;
    for(const it of items){const k=t-it.d;
      if(k<0){place(it,it.sx,it.sy,0,1);it.n.style.opacity=0;done=false;continue;}it.n.style.opacity=1;
      const tilt=+it.n.dataset.tilt;
      if(k<1.1){const e=ease(clamp(k/1.1)),x=it.sx+(it.tx-it.sx)*e,y=it.sy+(it.ty-it.sy)*e-Math.sin(e*Math.PI)*40+Math.sin(k*28)*2;
        place(it,x,y,tilt*e+Math.sin(k*20)*3,1.06);mouse(it,x+12,y+8,Math.sin(k*30)*.12,true);done=false;}
      else if(k<1.4){const s=(k-1.1)/.3,sq=Math.sin(s*Math.PI)*(1-s);place(it,it.tx,it.ty,tilt,1+(s<.3?-.14*Math.sin(s/.3*Math.PI):sq*.1));mouse(it,it.tx+12,it.ty+8,-.15*(1-s),true);done=false;}
      else if(k<2.3){const e=ease(clamp((k-1.4)/.9)),x=it.tx+12+(it.ex-it.tx)*e,y=it.ty+8+(it.ey-it.ty)*e;place(it,it.tx,it.ty,tilt,1);mouse(it,x,y,Math.sin(k*34)*.15,e<1);if(e<1)done=false;}
      else mouse(it,0,0,0,false);}
    if(done){state=2;t=0;}}
  else if(state===2){if(t<T_END)drawSplat(t);else{drawSplat(T_END,true);sec.classList.add('done');state=4;t=0;buildDoodles();EX.forEach(e=>e.style.opacity=0);}}
  else if(state===4){dragIn(t);doodle(t);if(t>Math.max(DRAG_END(),DT_END)){finalState();}}
}
build();
(window.FFC_HOOKS=window.FFC_HOOKS||[]).push(hook);
addEventListener('resize',()=>{if(state===3)targets(),finalState();else if(state>0){resize();targets();}});
// tic-tac-toe
const g=document.getElementById('ttt'),st=document.getElementById('tttst');let b=Array(9).fill(''),p='X',over=false;
const L3=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
function draw(){g.querySelectorAll('button').forEach((c,i)=>c.textContent=b[i]);}
g.querySelectorAll('button').forEach((c,i)=>c.onclick=()=>{if(over||b[i])return;b[i]=p;draw();
  const w=L3.find(l=>l.every(j=>b[j]===p));if(w){over=true;st.textContent=p+' wins!';}else if(b.every(Boolean)){over=true;st.textContent='Draw';}else{p=p==='X'?'O':'X';st.textContent=p+' to move';}});
document.getElementById('tttr').onclick=()=>{b=Array(9).fill('');p='X';over=false;st.textContent='X to move';draw();};
})();
