const data = await (await fetch('./research/attendance.json')).json();
const svg = document.querySelector('#map');
const NS = 'http://www.w3.org/2000/svg';
function add(tag, attrs, text) {const e=document.createElementNS(NS,tag); for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(text)e.textContent=text;svg.append(e);return e;}
const X=x=>220+x*225, Y=y=>45+y*130;
function render(){
 svg.replaceChildren();const sector=document.querySelector('#sector').value, a=data[sector];
 const sample=(x,y)=>{const i=Math.min(3,Math.floor(x)),j=Math.min(2,Math.floor(y)),u=x-i,v=y-j;return a[j][i]*(1-u)*(1-v)+a[j][i+1]*u*(1-v)+a[j+1][i]*(1-u)*v+a[j+1][i+1]*u*v;};
 // Uniform dot lattice: brightness comes only from the measured attendance surface.
 for(let y=0;y<=3;y+=.045)for(let x=0;x<=4;x+=.035){const n=sample(x,y);add('circle',{cx:X(x),cy:Y(y),r:.75,fill:'#e5e5df',opacity:.07+n/250});}
 // Marching squares, 5 percentage point contours, no procedural terrain noise.
 for(let level=30;level<=90;level+=5){let d='';for(let y=0;y<3-.001;y+=.05)for(let x=0;x<4-.001;x+=.05){const p=[[x,y],[x+.05,y],[x+.05,y+.05],[x,y+.05]],v=p.map(([u,w])=>sample(u,w)),hits=[];for(let k=0;k<4;k++){const l=(k+1)%4;if((v[k]<level)!==(v[l]<level)){const t=(level-v[k])/(v[l]-v[k]);hits.push([X(p[k][0]+t*(p[l][0]-p[k][0])),Y(p[k][1]+t*(p[l][1]-p[k][1]))]);}}for(let k=0;k+1<hits.length;k+=2)d+=`M${hits[k]}L${hits[k+1]}`;}add('path',{d,fill:'none',stroke:'#e5e5df','stroke-width':level%10?1:1.7,opacity:level%10?.28:.65});}
 data.columns.forEach((s,i)=>add('text',{x:X(i),y:478,'text-anchor':'middle',fill:'#aaa','font-size':14},s));
 add('text',{x:670,y:511,'text-anchor':'middle',fill:'#aaa','font-size':14},'HOUSEHOLD SPENDING GROUP');
 data.rows.forEach((s,j)=>{add('text',{x:5,y:Y(j)+5,fill:'#aaa','font-size':14},s);a[j].forEach((n,i)=>{const e=add('g',{tabindex:0,role:'button','aria-label':`${s}, ${data.columns[i]}: ${n}%`});const c=document.createElementNS(NS,'circle');Object.entries({cx:X(i),cy:Y(j),r:6,fill:'#bd9c4e',stroke:'#090a0b','stroke-width':2}).forEach(([k,v])=>c.setAttribute(k,v));e.append(c);const show=()=>document.querySelector('#readout').textContent=`${sector.toUpperCase()} - ${s} - ${data.columns[i]} - ${n}%`;e.onclick=show;e.onfocus=show;e.onkeydown=ev=>{if(ev.key==='Enter'||ev.key===' ')show();};});});
 document.querySelector('#values').innerHTML=`<tr><th>Education stage</th>${data.columns.map(s=>`<th>${s}</th>`).join('')}</tr>`+data.rows.map((s,j)=>`<tr><th>${s}</th>${a[j].map(n=>`<td>${n}%</td>`).join('')}</tr>`).join('');
 document.querySelector('#readout').textContent='Select a measured point to inspect its value';
}
document.querySelector('#source').innerHTML=`<a href="${data.source}">MoSPI Report 585 - ${data.table}</a>`;
document.querySelector('#sector').onchange=render;render();
