// Separate layout prototype. Uses the existing game; production layout is unchanged.
import {Screen,contourDots,routeDots} from './screen.js';
const map=await(await fetch('map.json')).json();
const canvas=document.querySelector('#shared-canvas'),screen=new Screen(canvas),contours=contourDots(map),route=routeDots(map);
function draw(){
 if(window.paperweights){
  const state=paperweights.state(),list=[];
  for(const d of contours){const[x,y]=screen.px(d.dx,d.dy);list.push({x,y,c:d.c,a:.6})}
  for(const d of route){const[x,y]=screen.px(d.dx,d.dy);list.push({x,y,c:'#8a8a86',s:1})}
  // All rovers share the route. Label leaders separate coincident positions;
  // the cross stays at the real position rather than inventing separate lanes.
  state.teams.forEach((t,i)=>{const[x,y]=screen.px(t.rover.x,t.rover.y),ctx=screen.ctx;list.push({x,y,c:'#e6e6e1',s:3});});
  screen.draw(list);
  const ctx=screen.ctx;
  state.teams.forEach((t,i)=>{const[x,y]=screen.px(t.rover.x,t.rover.y),dx=i%2?25:-25,dy=i<2?-24:24,lx=x+dx,ly=y+dy;ctx.globalAlpha=1;ctx.strokeStyle='#e6e6e1';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(lx,ly);ctx.stroke();ctx.fillStyle='#000';ctx.fillRect(lx-11,ly-10,22,20);ctx.strokeRect(lx-11,ly-10,22,20);ctx.fillStyle='#e6e6e1';ctx.font='12px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(t.id,lx,ly);ctx.textAlign='start';ctx.textBaseline='alphabetic';});
 }
 requestAnimationFrame(draw);
}
window.addEventListener('resize',()=>screen.resize());draw();
