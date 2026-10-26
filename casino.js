// Sol's RNG-style roll for the RNG site ("Test Your Luck"): rarities flick by and slow down, then a rare-aura cutscene
// (darken, light beam, ring shockwave, particles, flash) reveals 'Test Your Luck  1 / ∞'. Delta time; idle while off-screen.
(()=>{
const sec=document.getElementById('casino'),roll=document.getElementById('rroll'),nm=roll.querySelector('.nm'),od=roll.querySelector('.od');
const cv=document.getElementById('rfx'),g=cv.getContext('2d');
const R=[['common','1 / 2','#f4f4f4'],['uncommon','1 / 4','#8fff9a'],['rare','1 / 16','#78d2ff'],['epic','1 / 64','#c084fc'],['legendary','1 / 256','#ffc440'],['mythic','1 / 1,024','#ff5c8a'],
 ['paradox','1 / 25,000,000','#2de65f'],['divinity','1 / 100,000,000','#fff7c2'],['rapture','1 / 200,000,000','#ffb3f0'],['apocalypse','1 / 250,000,000','#ff4d2e'],['eschaton','1 / 500,000,000','#9b8cff'],['oblivion','1 / 1,000,000,000','#b4b4b4']];
let state=0,t=0,next=0,gap=.055,k=0,seq=[],W=0,H=0,DPR=1,parts=[],cs=0;
function mkSeq(){seq=[];for(let i=0;i<26;i++){const p=i/26,max=Math.min(R.length-1,1+Math.floor(p*p*R.length*1.15));seq.push(R[Math.floor(Math.random()*(max+1))]);}
  seq.push(R[9],R[10],R[11]);}
function show(r){nm.textContent=r[0];nm.style.color=r[2];nm.style.textShadow='4px 4px 0 #000,-2px -2px 0 #000';od.textContent=r[1];roll.classList.remove('tick');void roll.offsetWidth;roll.classList.add('tick');}
const PX=5;let PAT=[];   // chunky pixel effects: canvas drawn at 1/PX res and upscaled with image-rendering:pixelated
function mkPat(col){const B=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];return [4,8,12,16].map(n=>{const c=document.createElement('canvas');c.width=c.height=4;const x=c.getContext('2d');x.fillStyle=col;
  for(let i=0;i<16;i++)if(B[i]<n)x.fillRect(i%4,i>>2,1,1);return g.createPattern(c,'repeat');});}
function size(){const r=sec.getBoundingClientRect();W=Math.ceil(r.width/PX);H=Math.ceil(r.height/PX);DPR=1;cv.width=W;cv.height=H;g.imageSmoothingEnabled=false;PAT=mkPat('#fff7c8');PATG=mkPat('#ffc440');}
let PATG=[];
function start(){state=1;t=0;next=0;gap=.045;k=0;mkSeq();sec.classList.remove('dark','reveal','done');size();}
function fx(u){ // cutscene, all in low-res pixels: dithered beam, square particles, stepped rings, dithered flash
  g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,W,H);const cx=W>>1,cy=H>>1,M=Math.max(W,H);
  const bw=Math.round(Math.min(1,u/.6)*Math.min(W*.22,44)*(u<1.5?1:Math.max(0,1-(u-1.5)/.3)));
  if(bw>0)for(let i=0;i<4;i++){const w=Math.max(1,Math.round(bw*(1-i*.24)));g.fillStyle=i<1?PATG[1]:PAT[i];g.fillRect(cx-w,0,w*2,H);}
  for(const p of parts){let x,y;if(u<1.3){const e=Math.min(1,u/1.3),r=p.r*(1-e*e),a=p.a+e*4;x=cx+Math.cos(a)*r;y=cy+Math.sin(a)*r;}
    else{const e=(u-1.3)*1.6;x=cx+Math.cos(p.a)*e*M*p.v;y=cy+Math.sin(p.a)*e*M*p.v;}
    g.fillStyle=p.c;g.fillRect(Math.round(x),Math.round(y),p.s,p.s);}
  for(const [t0,col] of [[1.3,'#ffc440'],[1.45,'#2de65f']]){const e=(u-t0)/.7;if(e>0&&e<1){const R=Math.round(e*M*.6/2)*2,th=e<.5?2:1,n=Math.max(16,R*3|0);g.fillStyle=col;
    for(let i=0;i<n;i++){const a=i/n*6.283;g.fillRect(Math.round(cx+Math.cos(a)*R),Math.round(cy+Math.sin(a)*R),th,th);}}}
  const f=u<1.3?0:Math.max(0,1-(u-1.3)/.45);if(f>0){const lv=Math.ceil(f*4)-1;g.fillStyle=lv>=3?'#fff':PAT[lv];g.fillRect(0,0,W,H);}}
function visible(){const r=sec.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight;}
function hook(dt){
  if(state===3||!visible())return;                      // done, or off-screen: no work
  if(state===0){const r=sec.getBoundingClientRect();if(r.top<innerHeight*.45)start();else return;}
  t+=Math.min(dt,.05);
  if(state===1){if(t>=next){show(seq[k]);k++;next=t+gap;gap*=1.075;if(k>=seq.length){state=2;cs=0;sec.classList.add('dark');
      parts=[...Array(110)].map((_,i)=>({a:Math.random()*6.283,r:Math.max(W,H)*(.35+Math.random()*.5),v:.3+Math.random()*.8,s:1+(Math.random()*2|0),c:i%3?'#ffc440':(i%2?'#2de65f':'#fff')}));}}}
  else if(state===2){cs+=Math.min(dt,.05);if(cs>.25)sec.classList.add('reveal');fx(cs-.25);if(cs>1.6&&!sec.classList.contains('done')){sec.classList.add('done');}
    if(cs>2.6){g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,cv.width,cv.height);sec.classList.remove('dark');state=3;}}}

(window.FFC_HOOKS=window.FFC_HOOKS||[]).push(hook);addEventListener('resize',size);
})();
