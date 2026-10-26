// Deep Sea section: pixel ocean with crashing waves. Procedural fillRect / putImageData only
// (no getImageData/toDataURL). Delta time; idle while off-screen. One section failing won't kill others.
(()=>{
const sec=document.getElementById('waves'),cv=document.getElementById('wcv');
if(!sec||!cv)return;
const g=cv.getContext('2d');
const B4=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
let W=0,H=0,PX=4,t=0,ready=0,idle=1,bg=null,foam=[],spray=[],booms=[];
const PAL={sky:[[8,14,32],[18,40,78],[40,90,140],[90,160,200]],
  deep:[6,28,58],mid:[12,70,110],lite:[40,140,180],foam:[220,240,255],crest:[180,220,240]};

function size(){
  const r=sec.getBoundingClientRect();
  PX=Math.max(3,Math.round(Math.min(r.width,900)/225));
  W=Math.ceil(r.width/PX);H=Math.ceil(r.height/PX);
  cv.width=W;cv.height=H;g.imageSmoothingEnabled=false;
  bakeBg();ready=1;
}
function bakeBg(){
  // write-only ImageData (Brave-safe)
  try{
    const c=document.createElement('canvas');c.width=W;c.height=H;
    const x=c.getContext('2d'),id=x.createImageData(W,H),d=id.data;
    const horizon=Math.floor(H*.38);
    for(let y=0;y<H;y++){
      let c3;
      if(y<horizon){
        const u=y/horizon,k=u*u;const a=PAL.sky[Math.min(3,u*4|0)],b=PAL.sky[Math.min(3,(u*4|0)+1)];
        const f=(u*4)%1;c3=[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f];
        // dither sky
        for(let xx=0;xx<W;xx++){const b4=(B4[y&3][xx&3]+.5)/16,o=(y*W+xx)*4,Q=18;
          for(let i=0;i<3;i++){const v=c3[i]/Q;d[o+i]=Math.min(255,(Math.floor(v)+(v%1>b4?1:0))*Q);}d[o+3]=255;}
      }else{
        const u=(y-horizon)/(H-horizon);
        c3=[PAL.deep[0]+(PAL.mid[0]-PAL.deep[0])*u*.4,
            PAL.deep[1]+(PAL.mid[1]-PAL.deep[1])*u*.5,
            PAL.deep[2]+(PAL.mid[2]-PAL.deep[2])*u*.55];
        for(let xx=0;xx<W;xx++){const b4=(B4[y&3][xx&3]+.5)/16,o=(y*W+xx)*4,Q=14;
          // slight horizontal banding noise
          const n=((xx*17+y*31)&7)*.4;
          for(let i=0;i<3;i++){const v=(c3[i]+n)/Q;d[o+i]=Math.min(255,(Math.floor(v)+(v%1>b4?1:0))*Q);}d[o+3]=255;}
      }
    }
    // sun/moon glint disc (dithered)
    {const sx=W*.78,sy=H*.16,R=Math.max(4,W*.035);
     for(let y=sy-R|0;y<=sy+R;y++)for(let x0=sx-R|0;x0<=sx+R;x0++){
       if(x0<0||y<0||x0>=W||y>=H)continue;const dx=x0+.5-sx,dy=y+.5-sy;if(dx*dx+dy*dy>R*R)continue;
       const o=(y*W+x0)*4;d[o]=255;d[o+1]=230;d[o+2]=160;d[o+3]=255;}}
    x.putImageData(id,0,0);bg=c;
  }catch(e){console.warn('waves bakeBg',e);bg=null;}
}

// layered sine waves; amplitude rises then "crashes" near shore band
const LAYERS=[
  {amp:7,len:48,spd:.55,y:.52,col:[10,50,88],thick:18},
  {amp:9,len:36,spd:.85,y:.58,col:[16,78,120],thick:16},
  {amp:11,len:28,spd:1.15,y:.66,col:[28,110,155],thick:14},
  {amp:8,len:22,spd:1.55,y:.74,col:[50,150,185],thick:11},
  {amp:6,len:16,spd:2.05,y:.82,col:[90,185,210],thick:8}
];

function waveY(L,x,tt){
  const base=H*L.y;
  const s1=Math.sin((x/L.len)*6.283+tt*L.spd);
  const s2=Math.sin((x/(L.len*.55))*6.283-tt*L.spd*1.3)*.35;
  // crash swell: periodic taller crest that breaks
  const phase=((tt*L.spd*.35+x*.02)%6.283+6.283)%6.283;
  const crash=phase<1.2?Math.sin(phase/1.2*Math.PI)*L.amp*1.6:0;
  return base - (s1+s2)*L.amp - crash;
}

function spawnCrash(x,y,pow){
  const n=6+(pow*10|0);
  for(let i=0;i<n;i++){
    foam.push({x,y,vx:(Math.random()-.5)*22*pow,vy:-(6+Math.random()*18)*pow,life:.4+Math.random()*.7,s:1+(Math.random()*2|0)});
  }
  for(let i=0;i<(4*pow|0);i++){
    spray.push({x:x+(Math.random()-.5)*6,y,vx:(Math.random()-.5)*10,vy:-(14+Math.random()*22),life:.3+Math.random()*.5,s:1});
  }
  booms.push({x,y,r:2,life:.35,max:.35});
}

let lastCrash=0;
function maybeCrash(tt){
  // every ~0.55s pick a crest near mid-lower band and splash
  if(tt-lastCrash<.45)return;
  const L=LAYERS[2+(Math.random()*2|0)];
  const x=8+Math.random()*(W-16);
  const phase=((tt*L.spd*.35+x*.02)%6.283+6.283)%6.283;
  if(phase>.15&&phase<.55){
    lastCrash=tt;
    const y=waveY(L,x,tt);
    spawnCrash(x,y,.7+Math.random()*.8);
  }
}

function drawWaves(tt){
  g.imageSmoothingEnabled=false;
  if(bg)g.drawImage(bg,0,0);else{g.fillStyle='#0a1e3a';g.fillRect(0,0,W,H);}

  // fill below each wave surface (back to front)
  for(const L of LAYERS){
    g.fillStyle=`rgb(${L.col[0]},${L.col[1]},${L.col[2]})`;
    // draw as vertical strips for pixel look
    let prev=waveY(L,0,tt)|0;
    for(let x=0;x<W;x++){
      const y=waveY(L,x,tt)|0;
      const top=Math.min(prev,y);
      g.fillRect(x,top,1,H-top);
      // foam lip on crest
      if(x>0){
        const dy=y-prev;
        if(dy<=-1){ // rising face → brighter
          g.fillStyle=`rgb(${PAL.lite[0]},${PAL.lite[1]},${PAL.lite[2]})`;
          g.fillRect(x,y,1,2);
          g.fillStyle=`rgb(${L.col[0]},${L.col[1]},${L.col[2]})`;
        }else if(Math.abs(dy)<=1&&(B4[y&3][x&3]<6)){
          g.fillStyle=`rgb(${PAL.crest[0]},${PAL.crest[1]},${PAL.crest[2]})`;
          g.fillRect(x,y,1,1);
          g.fillStyle=`rgb(${L.col[0]},${L.col[1]},${L.col[2]})`;
        }
      }
      prev=y;
    }
  }

  // white crest highlights on front layer
  {const L=LAYERS[LAYERS.length-1];g.fillStyle='#e8f6ff';
   for(let x=0;x<W;x++){const y=waveY(L,x,tt)|0;const y2=waveY(L,x+1,tt)|0;
     if(y2-y>=1||(B4[y&3][x&3]<4&&Math.sin(x*.4+tt*3)>0.6))g.fillRect(x,y,1,1);}}

  // crash rings
  for(const b of booms){
    const a=b.life/b.max;g.fillStyle=`rgba(230,245,255,${a})`;
    const R=Math.round((1-a)*12+2);const n=Math.max(8,R*3);
    for(let i=0;i<n;i++){const ang=i/n*6.283;g.fillRect(Math.round(b.x+Math.cos(ang)*R),Math.round(b.y+Math.sin(ang)*R*.55),1,1);}
  }

  // foam / spray particles
  g.fillStyle='#f2fbff';
  for(const p of foam){g.globalAlpha=Math.min(1,p.life*2);g.fillRect(p.x|0,p.y|0,p.s,p.s);}
  g.fillStyle='#cfefff';
  for(const p of spray){g.globalAlpha=Math.min(1,p.life*2.5);g.fillRect(p.x|0,p.y|0,p.s,p.s);}
  g.globalAlpha=1;

  // subtle seabed pebbles near bottom
  g.fillStyle='#1a3a4a';
  for(let i=0;i<18;i++){const x=((i*47+9)%W),y=H-2-((i*13)%3);if(B4[y&3][x&3]<8)g.fillRect(x,y,1+(i&1),1);}
}

function step(dt){
  t+=dt;
  maybeCrash(t);
  foam=foam.filter(p=>(p.life-=dt)>0);
  for(const p of foam){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=28*dt;p.vx*=Math.exp(-1.2*dt);}
  spray=spray.filter(p=>(p.life-=dt)>0);
  for(const p of spray){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=40*dt;}
  booms=booms.filter(b=>(b.life-=dt)>0);
  drawWaves(t);
}

function visible(){const r=sec.getBoundingClientRect();return r.bottom>-40&&r.top<innerHeight+40;}

(window.FFC_HOOKS=window.FFC_HOOKS||[]).push(dt=>{
  try{
    if(!ready)return;
    const v=visible();
    if(v!==!idle){idle=!v;sec.classList.toggle('idle',idle);}
    if(!v)return;
    // reveal CTA when section is mid-view
    const r=sec.getBoundingClientRect();
    if(r.top<innerHeight*.55)sec.classList.add('on');
    step(Math.min(dt,.05));
  }catch(e){if(!step._e){step._e=1;console.warn('waves hook failed',e);sec.classList.add('on','fail');}}
});

let rz;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(size,120);});
// layout after fonts/layout settle
if(document.readyState==='complete')size();else addEventListener('load',size);
setTimeout(()=>{if(!ready)size();},800);
})();
