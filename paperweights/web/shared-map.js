// Shared reference terrain, with independent team positions and hazard rows.
import {Screen,contourDots,routeDots,DH} from './screen.js';
const map=await(await fetch('map.json')).json();
const canvas=document.querySelector('#shared-canvas'),screen=new Screen(canvas),contours=contourDots(map),route=routeDots(map);
let active='A';
document.querySelector('#teams').addEventListener('pointerdown',e=>{const team=e.target.closest('.team');if(team)active=team.dataset.team});
function draw(){
 if(window.paperweights){
  const state=paperweights.state(),list=[],selected=state.teams.find(t=>t.id===active),band=selected?.activeBand;
  document.querySelectorAll('.team').forEach(el=>el.classList.toggle('map-focus',el.dataset.team===active));
  for(const d of contours){const[x,y]=screen.px(d.dx,d.dy);list.push({x,y,c:d.c,a:.6})}
  if(band)for(const dx of[band.left,band.right])for(let dy=0;dy<DH;dy+=2){const[x,y]=screen.px(dx,dy);list.push({x,y,c:'#e6e6e1',a:.65,s:1})}
  for(const d of route){const[x,y]=screen.px(d.dx,d.dy);list.push({x,y,c:'#8a8a86',s:1})}
  state.teams.forEach(t=>{const[x,y]=screen.px(t.rover.x,t.rover.y);list.push({x,y,c:t.status==='eliminated'?'#d06c58':'#e6e6e1',s:3})});
  screen.draw(list);
  const ctx=screen.ctx;
  state.teams.forEach((t,i)=>{const[x,y]=screen.px(t.rover.x,t.rover.y),dx=i%2?25:-25,dy=i<2?-24:24,lx=x+dx,ly=y+dy,color=t.status==='eliminated'?'#d06c58':'#e6e6e1';ctx.globalAlpha=1;ctx.strokeStyle=color;ctx.lineWidth=t.id===active?2:1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(lx,ly);ctx.stroke();ctx.fillStyle='#000';ctx.fillRect(lx-11,ly-10,22,20);ctx.strokeRect(lx-11,ly-10,22,20);ctx.fillStyle=color;ctx.font='12px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(t.id,lx,ly);ctx.textAlign='start';ctx.textBaseline='alphabetic'});
 }
 requestAnimationFrame(draw);
}
function fitMap(){
 const box=document.querySelector('.shared-map'),holder=canvas.parentElement;
 if(innerWidth>=760){const width=Math.max(1,Math.min(box.clientWidth-4,(box.clientHeight-4)/(26*1.9/100)));holder.style.width=`${width}px`}
 else holder.style.removeProperty('width');
 screen.resize();
}
new ResizeObserver(fitMap).observe(document.querySelector('.shared-map'));
window.addEventListener('resize',fitMap);fitMap();draw();
