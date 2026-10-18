// Decision trails through the existing terrain. Geometry is a visual metaphor,
// not a numeric reading of the Mars contour elevations or a forecast of hidden risk.
export function projectRoute(route,anchors,actions){
 const offsets=[0];for(const action of actions)offsets.push(Math.max(-34,Math.min(34,offsets.at(-1)+(action==='avoid'?-14:8))));
 let segment=0;
 return route.map((p,i)=>{while(segment<anchors.length-2&&i>anchors[segment+1])segment++;
  const start=offsets[Math.min(segment,offsets.length-1)],end=offsets[Math.min(segment+1,offsets.length-1)];
  const t=Math.max(0,Math.min(1,(i-anchors[segment])/(anchors[segment+1]-anchors[segment]||1))),smooth=t*t*(3-2*t);
  return{...p,dy:Math.max(5,Math.min(144,p.dy+start+(end-start)*smooth))};
 });
}
