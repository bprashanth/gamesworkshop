// Measured values control height only. Spatial arrangement and routes are illustration.
const data=await(await fetch('./research/attendance.json')).json();
const canvas=document.querySelector('#terrain'),ctx=canvas.getContext('2d');
import {reliefField,W,H,NX,NY} from './terrain.js';
let zoom=1,showRoutes=true,field,paths;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function build(){
 const values=data[document.querySelector('#sector').value],relief=+document.querySelector('#relief').value;
 field=reliefField(values,relief);
 // Terrain-aware illustrative traverses. Their cost is designed, not inferred.
 paths=Array.from({length:4},(_,team)=>{
  const cols=151,rows=81,cost=Array.from({length:cols},()=>new Float64Array(rows).fill(Infinity)),back=Array.from({length:cols},()=>new Int16Array(rows));
  cost[0][40]=0;
  for(let x=1;x<cols;x++)for(let y=0;y<rows;y++){
   const target=15+team*16+Math.sin(x/11+team*.8)*7+Math.sin(x/23)*8;
   const z=field[Math.round((y*9+90)/5)*NX+Math.round((x*9+125)/5)];
   const local=z*.36+Math.pow((y-target)/13,2)*.7;
   for(let py=Math.max(0,y-2);py<=Math.min(rows-1,y+2);py++){
    const n=cost[x-1][py]+local+Math.abs(y-py)*.07;
    if(n<cost[x][y]){cost[x][y]=n;back[x][y]=py;}
   }
  }
  let y=cost.at(-1).indexOf(Math.min(...cost.at(-1)));const path=[];
  for(let x=cols-1;x>=0;x--){path.push([x*9+125,y*9+90]);y=back[x][y];}
  return path.reverse();
 });
 draw();
}
function draw(){
 const rect=canvas.getBoundingClientRect(),dpr=devicePixelRatio||1;
 canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#080909';ctx.fillRect(0,0,rect.width,rect.height);
 const s=Math.min(rect.width/W,rect.height/H)*zoom,ox=(rect.width-W*s)/2,oy=(rect.height-H*s)/2;
 ctx.translate(ox,oy);ctx.scale(s,s);ctx.lineCap='round';
 // Sparse luminous dots form the topographic lines, matching the Rover map.
 for(let level=.07;level<1.65;level+=.033){
  const major=Math.round(level/.033)%4===0;ctx.fillStyle=major?'#c0c1b8':'#6c716b';ctx.globalAlpha=major?.76:.6;
  for(let y=0;y<NY-1;y++)for(let x=0;x<NX-1;x++){
   const p=[[x*5,y*5],[(x+1)*5,y*5],[(x+1)*5,(y+1)*5],[x*5,(y+1)*5]],v=[field[y*NX+x],field[y*NX+x+1],field[(y+1)*NX+x+1],field[(y+1)*NX+x]],hits=[];
   for(let k=0;k<4;k++){const n=(k+1)%4;if((v[k]<level)!==(v[n]<level)){const t=(level-v[k])/(v[n]-v[k]);hits.push([p[k][0]+t*(p[n][0]-p[k][0]),p[k][1]+t*(p[n][1]-p[k][1])]);}}
   for(let k=0;k+1<hits.length;k+=2){const a=hits[k],b=hits[k+1],len=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=Math.max(1,Math.ceil(len/3));for(let q=0;q<steps;q++){const t=q/steps;ctx.fillRect(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,major?1.45:1.05,major?1.45:1.05);}}
  }
 }
 ctx.globalAlpha=1;
 if(showRoutes)paths.forEach((path,team)=>{
  ctx.strokeStyle=['#e6e6e1','#75ae8e','#bd9c4e','#6ca4c4'][team];ctx.lineWidth=2.4;ctx.beginPath();path.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
  const index=[65,90,112,136][team],[x,y]=path[index];ctx.fillStyle='#080909';ctx.fillRect(x-13,y-13,26,26);ctx.strokeRect(x-13,y-13,26,26);ctx.font='bold 18px monospace';ctx.fillStyle=ctx.strokeStyle;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('ABCD'[team],x,y);
 });
}
document.querySelector('#sector').onchange=build;document.querySelector('#relief').oninput=build;
document.querySelector('#zoom').onclick=()=>{zoom=zoom===1?.72:1;document.querySelector('#zoom').textContent=zoom===1?'Zoom out':'Zoom in';document.querySelector('#scale').textContent=zoom===1?'WIDE VIEW':'REGIONAL VIEW';draw();};
document.querySelector('#routes').onclick=e=>{showRoutes=!showRoutes;e.target.textContent=`Routes ${showRoutes?'on':'off'}`;e.target.setAttribute('aria-pressed',String(showRoutes));draw();};
new ResizeObserver(()=>field&&draw()).observe(canvas);build();
