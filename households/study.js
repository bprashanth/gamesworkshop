const data=await(await fetch('assets/icons.json')).json();
const families={harvest:['good','weak','failed'],cash:['enough','low','loan'],attendance:['regular','irregular','dropout'],weather:['sun','rain','storm']};
const colors={harvest:'amber',cash:'blue',attendance:'purple',weather:'green'};

const glyph=(cat,state)=>data.primary[cat][state];
function card(cat,state,color){return `<div class="cardbox" style="--context:var(--${color})"><div class="cardlabel"><span>${color.toUpperCase()}</span><span>${cat.toUpperCase()}</span></div><div class="card">${glyph(cat,state)}<span class="state">${state.toUpperCase()}</span></div></div>`}
function render(){document.querySelector('#icons').innerHTML=Object.entries(families).map(([cat,states])=>`<div><h2>${cat.toUpperCase()}</h2><div class="family">${states.map(s=>card(cat,s,colors[cat])).join('')}</div></div>`).join('');document.querySelector('#context').innerHTML=card('harvest','weak','red')+card('harvest','weak','blue')+card('attendance','irregular','amber')+card('attendance','irregular','purple')}
document.querySelector('#theme').onclick=()=>{const light=document.documentElement.dataset.theme!=='light';document.documentElement.dataset.theme=light?'light':'dark';document.querySelector('#theme').textContent=light?'Dark':'Light'};render();
