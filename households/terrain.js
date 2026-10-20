// Shared illustrative NSS relief. Geometry is designed, not a measured risk map.
export const W=1600,H=900,NX=321,NY=181;
export function reliefField(values,relief=1.8){
 const peaks=[];
 for(let stage=0;stage<4;stage++)for(let quintile=0;quintile<5;quintile++){
  const i=stage*5+quintile;
  peaks.push({x:190+quintile*286+Math.sin(stage*2.1+quintile)*80,y:135+stage*205+Math.cos(quintile*1.4+stage)*68,
   amplitude:Math.pow((100-values[stage][quintile])/75,relief),sx:100+(i%3)*20,sy:74+(i%4)*10});
 }
 const field=new Float32Array(NX*NY);
 for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){
  const x=i*5,y=j*5;
  // Fixed folds add texture without pretending to add measured observations.
  const u=x+35*Math.sin(y/88)+20*Math.sin((x+y)/61),v=y+29*Math.sin(x/106)+12*Math.cos((x-y)/43);
  let z=0;
  for(const p of peaks){const dx=(u-p.x)/p.sx,dy=(v-p.y)/p.sy;z+=p.amplitude*Math.exp(-.5*(dx*dx+dy*dy));}
  const grain=1+.07*Math.sin(x/17+y/29)+.035*Math.cos(y/11-x/23);
  field[j*NX+i]=z*grain;
 }
 return field;
}
export function reliefDots(values,width,height){
 const field=reliefField(values),dots=[];
 for(let level=.07;level<1.65;level+=.033){
  const major=Math.round(level/.033)%4===0;
  for(let y=0;y<NY-1;y++)for(let x=0;x<NX-1;x++){
   const p=[[x*5,y*5],[(x+1)*5,y*5],[(x+1)*5,(y+1)*5],[x*5,(y+1)*5]],v=[field[y*NX+x],field[y*NX+x+1],field[(y+1)*NX+x+1],field[(y+1)*NX+x]],hits=[];
   for(let k=0;k<4;k++){const n=(k+1)%4;if((v[k]<level)!==(v[n]<level)){const t=(level-v[k])/(v[n]-v[k]);hits.push([p[k][0]+t*(p[n][0]-p[k][0]),p[k][1]+t*(p[n][1]-p[k][1])]);}}
   for(let k=0;k+1<hits.length;k+=2){const a=hits[k],b=hits[k+1],steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/5));for(let q=0;q<steps;q++){const t=q/steps;dots.push({dx:(a[0]+(b[0]-a[0])*t)/W*(width-1),dy:(a[1]+(b[1]-a[1])*t)/H*(height-1),c:major?'#c0c1b8':'#6c716b',s:major?.85:.65});}}
  }
 }
 return dots;
}
