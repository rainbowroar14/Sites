// "Sprout" section. Trees use the real Sprout (rainbowroar14.github.io/Tree) generator, assets, idle sway,
// gust spring and leaf flutter, but are rendered to a low-res canvas upscaled with image-rendering:pixelated.
// Grown trees are baked once into a static layer; per frame only the rotated layer + fluttering leaves are drawn.
// Delta time; no work while off-screen.
(()=>{
const sec=document.getElementById('tree'),cv=document.getElementById('tcv'),g=cv.getContext('2d'),sign=document.getElementById('gh');
const A='sprout/';
const STICKS=['stick_dl_1','stick_dl_2','stick_dl_3','stick_dl_4','stick_dl_5','stick_dl_6','stick_gen_1','stick_gen_2'].map(n=>A+'sticks/'+n+'.png?v=1');
const LEAVES=['leaf_dl_1','leaf_dl_2','leaf_dl_3','leaf_dl_4','leaf_dl_5','leaf_dl_6','leaf_dl_7','leaf_dl_8','leaf_dl_9','leaf_dl_10','leaf_dl_11','leaf_dl_12','leaf_gen_1','leaf_gen_2','leaf_gen_3'].map(n=>A+'leaves/'+n+'.png?v=1');
// ---- verbatim Sprout helpers ----
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
let rnd;const R=(a,b)=>a+(b-a)*rnd(),pick=a=>a[(rnd()*a.length)|0];
const easeOut=x=>1-Math.pow(1-x,3),easeBack=x=>{const c=1.6;x-=1;return 1+(c+1)*x*x*x+c*x*x;};
const load=src=>new Promise(res=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>res(null);i.src=src;});
const mkCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=Math.max(1,Math.ceil(w));c.height=Math.max(1,Math.ceil(h));return c;};
let IMG={},leafTints=[];
function bakeLeafTints(img){return[null,'rgba(170,160,30,.16)','rgba(10,55,25,.20)','rgba(255,250,200,.13)'].map(col=>{const c=mkCanvas(img.width,img.height),x=c.getContext('2d');x.drawImage(img,0,0);
  if(col){x.globalCompositeOperation='source-atop';x.fillStyle=col;x.fillRect(0,0,c.width,c.height);}return c;});}
function buildTree(maxDepth){
  const branches=[],leaves=[];
  function grow(len,w,ang,depth,start,x,y){
    const dur=1.9*Math.pow(0.72,depth)+R(-.15,.15);const img=depth<2?pick(IMG.thick):pick(IMG.thin);
    branches.push({x,y,ang,len,w,img,flip:rnd()<.5,start,dur,depth});
    const at=f=>[x+Math.sin(ang)*len*f,y-Math.cos(ang)*len*f];
    if(depth<maxDepth){const n=depth===0?2+(rnd()<.5?1:0):2+(rnd()<.3?1:0),spread=R(.45,.75);const[ex,ey]=at(.97);
      for(let i=0;i<n;i++){const a=-spread+2*spread*(i/(n-1))+R(-.15,.15);grow(len*R(.62,.8),w*R(.62,.74),ang+a,depth+1,start+dur*.97,ex,ey);}
      if(depth>=1&&rnd()<.6){const f=R(.35,.7),[sx,sy]=at(f);grow(len*R(.4,.55),w*.5,ang+(rnd()<.5?-1:1)*R(.7,1.1),depth+1,start+dur*f,sx,sy);}}
    if(depth>=maxDepth-1){const n=depth===maxDepth?3+(rnd()*2|0):1+(rnd()*2|0);
      for(let i=0;i<n;i++){const tip=depth===maxDepth&&i===0,f=tip?1:depth===maxDepth?R(.3,1):R(.4,.95);const[lx,ly]=at(f),side=tip?0:(rnd()<.5?-1:1);
        leaves.push({x:lx,y:ly,ang:ang+side*R(.5,1.1),size:R(.75,1.15),li:(rnd()*LEAVES.length)|0,ti:(rnd()*4)|0,start:start+dur*f+R(.15,.8),dur:.7,tip});}}}
  const t0=R(0,.3);grow(R(150,200),R(26,34),R(-.12,.12),0,t0,0,0);return{branches,leaves,start:t0};}
function bboxOf(tr){let x0=1e9,x1=-1e9,y0=1e9,y1=6;
  for(const b of tr.branches){const ex=b.x+Math.sin(b.ang)*b.len,ey=b.y-Math.cos(b.ang)*b.len;x0=Math.min(x0,b.x-b.w,ex-b.w);x1=Math.max(x1,b.x+b.w,ex+b.w);y0=Math.min(y0,ey-b.w);}
  for(const l of tr.leaves){const r=55*l.size*1.12;x0=Math.min(x0,l.x-r);x1=Math.max(x1,l.x+r);y0=Math.min(y0,l.y-r);}return{x0,x1,y0,y1};}
function preStick(img,wPx,lenPx,flip){const pad=wPx*.16,c=mkCanvas(wPx+2,lenPx+pad+2),x=c.getContext('2d');x.translate(c.width/2,c.height/2);x.scale(flip?-1:1,1);
  x.drawImage(img,-wPx/2,-c.height/2+1,wPx,c.height-2);return c;}
const leafCache=new Map();
function preLeaf(li,ti,hPx){const hb=Math.max(3,Math.round(hPx)),key=li+'_'+ti+'_'+hb;let c=leafCache.get(key);
  if(!c){const src=leafTints[li][ti],w=hb*src.width/src.height;c=mkCanvas(w,hb);c.getContext('2d').drawImage(src,0,0,c.width,c.height);leafCache.set(key,c);}return c;}
function drawStick(ctx,s,gr,M){const c=s.pre,sh=Math.max(1,c.height*gr),cs=Math.cos(s.ang),sn=Math.sin(s.ang);
  M(ctx,cs,sn,s.x*s.k,s.y*s.k);ctx.drawImage(c,0,c.height-sh,c.width,sh,-c.width/2,s.w*s.k*.08-sh,c.width,sh);}
function drawLeaf(ctx,l,sc,ang,M){const c=l.pre,cs=Math.cos(ang)*sc,sn=Math.sin(ang)*sc;M(ctx,cs,sn,l.x*l.k,l.y*l.k);ctx.drawImage(c,-c.width/2,-c.height);}
// ---- section state ----
let W=0,H=0,PX=4,GY=0,trees=[],fall=[],ready=false,started=false,gt=0,t=0,windBase=0,gust=null,nextGust=1e9,leafRate=1;
function makeGust(){const gg={t0:t,dir:Math.random()<.6?1:-1,s:.45+Math.random()*.55,rise:.7,hold:.8+Math.random()*1.6,fall:1.6+Math.random()*1.2};
  gg.len=gg.rise+gg.hold+gg.fall;gg.ph=Math.random()*6.28;
  gg.env=u=>u<0?0:u<gg.rise?Math.sin(u/gg.rise*Math.PI/2)**2:u<gg.rise+gg.hold?1:u<gg.len?.5+.5*Math.cos((u-gg.rise-gg.hold)/gg.fall*Math.PI):0;
  gg.wind=u=>windBase+gg.dir*gg.s*gg.env(u)*(1+.22*Math.sin(u*6.3+gg.ph)+.12*Math.sin(u*13.7));return gg;}
const windNow=()=>gust?gust.wind(t-gust.t0):windBase;
function layout(){
  const r=sec.getBoundingClientRect();PX=Math.max(3,Math.round(r.height/120));W=Math.ceil(r.width/PX);H=Math.ceil(r.height/PX);cv.width=W;cv.height=H;
  sec.style.setProperty('--tpx',PX+'px');sky.style.setProperty('--tpx',PX+'px');document.getElementById('tgnd').style.height=(32*PX)+'px';{const tm=document.getElementById('tmid'),gh=document.getElementById('tgnd').getBoundingClientRect().height,tb=r.height*.33+tm.offsetHeight*.44,avail=r.height-gh*.42-tb-16;
   const sw=Math.round(Math.max(96,Math.min(225,Math.max(135,r.width*.145),avail*64/85)));sec.style.setProperty('--sw',sw+'px');}GY=H-16;sec.style.setProperty('--sb',Math.round(32*PX*.42)+'px');if(!ready)return;
  rnd=mulberry(20261023);leafCache.clear();trees=[];const mob=false;  // same composition on every device
  const spots=mob?[[.15,.3,1,0],[.85,.3,1,.3]]:[[.11,.24,1,0],[.89,.24,1,.25],[.27,.15,.7,.6],[.73,.15,.7,.85]];
  for(const[fx,fw,sz,delay]of spots){
    const tr=buildTree(4),cap=Math.floor(260*sz);if(tr.leaves.length>cap){tr.leaves.sort((a,b)=>(b.tip-a.tip)||(rnd()-.5));tr.leaves.length=cap;}
    tr.branches.forEach(b=>b.start+=delay);tr.leaves.forEach(l=>l.start+=delay);
    const bb=bboxOf(tr),bw=bb.x1-bb.x0,bh=-bb.y0;
    const k=Math.min(W*fw/bw,(GY-H*.14)*(mob?.55:.95)*sz/bh);             // canvas px per tree unit
    const cx=Math.round(W*fx-(bb.x0+bb.x1)/2*k);
    for(const b of tr.branches){b.k=k;b.pre=preStick(b.img,Math.max(1,b.w*k),Math.max(1,b.len*k),b.flip);}
    const nf=Math.floor(tr.leaves.length*.4);
    tr.leaves.map(l=>({l,sc:(l.tip?1e6:0)+Math.hypot(l.x,l.y)+rnd()*40})).sort((a,b)=>b.sc-a.sc).forEach((e,j)=>{const l=e.l;l.flutter=j<nf;l.famp=[4,5.5,7][j%3]*Math.PI/180;l.fw=R(1.8,3.4);l.fph=R(0,6.28);});
    for(const l of tr.leaves){l.k=k;l.pre=preLeaf(l.li,l.ti,55*l.size*k);}
    const end=Math.max(...tr.branches.map(b=>b.start+b.dur),...tr.leaves.map(l=>l.start+l.dur));
    trees.push({...tr,bb,k,cx,end,baked:null,fl:tr.leaves.filter(l=>l.flutter),
      d:R(6,9),a:R(.35,.6)*Math.PI/180,ph:R(0,6.28),b:0,v:0,flex:R(.8,1.2)});}
}
function bake(tr){ // static layer: every branch + non-fluttering leaf, origin at trunk base
  const bb=tr.bb,k=tr.k,pad=4,c=mkCanvas((bb.x1-bb.x0)*k+pad*2,(bb.y1-bb.y0)*k+pad*2),x=c.getContext('2d');
  const ox=-bb.x0*k+pad,oy=-bb.y0*k+pad,M=(ctx,cs,sn,px,py)=>ctx.setTransform(cs,sn,-sn,cs,px+ox,py+oy);
  for(const b of tr.branches)drawStick(x,b,1,M);for(const l of tr.leaves)if(!l.flutter)drawLeaf(x,l,1,l.ang,M);
  tr.baked={c,ox,oy};}
function frame(dt){
  t+=dt;if(started)gt+=dt;
  if(t>nextGust){gust=makeGust();nextGust=t+9+Math.random()*12;leafRate=2.6;const n=Math.round(gust.s*(2+Math.random()*4));
    for(let i=0;i<n;i++)setTimeout(()=>blowLeaf(),(gust.rise*.8+Math.random()*(gust.hold+.5))*1000);}
  if(gust){const u=t-gust.t0;leafRate=u<gust.rise+gust.hold?2.6:u<gust.len?1.7:1;if(u>gust.len+4)gust=null;}
  const wnd=windNow();
  g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,W,H);
  
  for(const tr of trees){
    // gust spring, as in Sprout (lagged by position)
    const lag=gust?(gust.dir>0?tr.cx/W:1-tr.cx/W)*.35:0,e=gust?gust.env(t-gust.t0-lag):0;
    const target=((gust?gust.dir*gust.s*e*(1+.2*Math.sin((t-(gust?gust.t0:0))*5.1+tr.cx)):0)+windBase*.3)*7*tr.flex;
    tr.v+=((target-tr.b)*16-tr.v*3.2)*dt;tr.b+=tr.v*dt;
    const grown=gt>tr.end+.1,rot=grown?(Math.sin(t*6.283/tr.d+tr.ph)*tr.a+tr.b*.8*Math.PI/180):0,cs=Math.cos(rot),sn=Math.sin(rot);
        const M=(ctx,c2,s2,px,py)=>{const X=px*cs-py*sn+tr.cx,Y=px*sn+py*cs+GY;ctx.setTransform(c2*cs-s2*sn,c2*sn+s2*cs,-(c2*sn+s2*cs),c2*cs-s2*sn,X,Y);};
    if(!grown){g.imageSmoothingEnabled=true;
      for(const b of tr.branches){const p=(gt-b.start)/b.dur;if(p>0)drawStick(g,b,easeOut(Math.min(1,p)),M);}
      for(const l of tr.leaves){const p=(gt-l.start)/l.dur;if(p>0)drawLeaf(g,l,easeBack(Math.min(1,p)),l.ang,M);}
    }else{if(!tr.baked)bake(tr);const B=tr.baked;g.imageSmoothingEnabled=false;
      g.setTransform(cs,sn,-sn,cs,tr.cx,GY);g.drawImage(B.c,-B.ox,-B.oy);g.imageSmoothingEnabled=true;
      for(const l of tr.fl){const fa=l.famp*Math.sin(t*l.fw*leafRate+l.fph);drawLeaf(g,l,1,l.ang+fa,M);}}}
  for(let i=fall.length-1;i>=0;i--){const f=fall[i];f.vx+=(wnd*40-f.vx)*dt*1.2;f.x+=f.vx*dt+Math.sin(t*2.6+i)*.25;
    if(f.y<GY-1){f.y+=f.vy*dt;f.a+=f.va*dt;}else{f.vx*=.9;f.life-=dt;}
    if(f.life<0||f.x<-10||f.x>W+10){fall.splice(i,1);continue;}
    g.globalAlpha=Math.min(1,f.life);g.setTransform(Math.cos(f.a),Math.sin(f.a),-Math.sin(f.a),Math.cos(f.a),f.x,f.y);g.drawImage(f.c,-f.c.width/2,-f.c.height/2);g.globalAlpha=1;}
  sign.style.transform=`rotate(${(wnd*2.2).toFixed(2)}deg)`;
}
function blowLeaf(){const tr=trees[(Math.random()*trees.length)|0];if(!tr||!tr.fl.length||fall.length>30)return;const l=tr.fl[(Math.random()*tr.fl.length)|0];
  fall.push({x:tr.cx+l.x*tr.k,y:GY+l.y*tr.k,vx:0,vy:8+Math.random()*6,a:l.ang,va:(Math.random()-.5)*4,c:l.pre,life:3});}
function visible(){const r=sec.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight;}
const sky=document.getElementById('tsky'),cla=document.getElementById('cla'),clb=document.getElementById('clb');let skyIdle=null;
// Sky parallax like the fixed star field: it lags the page (moves at ~half speed); clouds lag a little less, per layer, for depth.
const KS=.5,KA=.42,KB=.32;
function skyPar(){const tr=sec.getBoundingClientRect(),c=innerHeight/2-tr.height/2,d=c-tr.top;
  sky.style.transform=`translate3d(0,${Math.max(-300,d*KS).toFixed(1)}px,0)`;cla.style.transform=`translate3d(0,${(d*(KA-KS)).toFixed(1)}px,0)`;clb.style.transform=`translate3d(0,${(d*(KB-KS)).toFixed(1)}px,0)`;}
function hook(dt){{const r=sky.getBoundingClientRect(),on=r.bottom>0&&r.top<innerHeight;if(on!==skyIdle){skyIdle=on;sky.classList.toggle('idle',!on);}if(on||Math.abs(sec.getBoundingClientRect().top)<innerHeight*2)skyPar();}
  if(!ready||!visible())return;if(!trees.length)layout();
  if(!started){const r=sec.getBoundingClientRect();if(r.top<innerHeight*.6){started=true;gt=0;sec.classList.add('on');nextGust=t+Math.max(...trees.map(x=>x.end))+1;}}
  frame(Math.min(dt,.05));}
Promise.all([Promise.all(STICKS.map(load)),Promise.all(LEAVES.map(load))]).then(([st,lv])=>{
  st=st.filter(Boolean);IMG.thick=st.filter(i=>i.width/i.height>.17);IMG.thin=st.filter(i=>i.width/i.height<=.17);
  if(!IMG.thick.length)IMG.thick=st;if(!IMG.thin.length)IMG.thin=st;leafTints=lv.filter(Boolean).map(bakeLeafTints);ready=true;layout();});
(window.FFC_HOOKS=window.FFC_HOOKS||[]).push(hook);addEventListener('resize',()=>{if(ready)layout();});
const _lay=layout;layout=function(){_lay();if(trees.length){window.FFC_TREE_X=trees.map(t=>t.cx/W);dispatchEvent(new Event('ffc-trees'));}};
})();
