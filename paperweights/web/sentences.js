import {matchingSheets,chooseWord} from './sentence-model.js';
const $=s=>document.querySelector(s),params=new URLSearchParams(location.search);
const palette={RED:['#a74638','#d06c58'],BLUE:['#316b8c','#6ca4c4'],AMBER:['#8b681d','#bd9c4e'],GREEN:['#39785c','#75ae8e'],PURPLE:['#72528e','#ad91c4'],PINK:['#a24b7d','#ce83ae']};
let pack,words=[],trace=[],pending=false,loadId=0,theme='dark';
try{theme=localStorage.getItem('paperweights.theme.v1')==='light'?'light':'dark'}catch{}
const split=key=>{const i=key.indexOf(':');return{color:key.slice(0,i),word:key.slice(i+1)}};
const current=()=>words.at(-1),finished=()=>/[.!?]/.test(split(current()).word)&&split(current()).word.length===1;
function render(){
 document.documentElement.dataset.theme=theme;$('#theme').textContent=theme==='dark'?'Light':'Dark';
 if(!pack)return;
 const cue=split(current()),ink=palette[cue.color][theme==='dark'?1:0];
 $('#sentence').replaceChildren();words.forEach((key,i)=>{const v=split(key),span=document.createElement('span');span.textContent=(i&&!/^[.,!?]$/.test(v.word)?' ':'')+(i===0||/^[.!?]$/.test(split(words[i-1]).word)?v.word[0].toUpperCase()+v.word.slice(1):v.word);if(v.word==='i')span.textContent=span.textContent.replace(/i$/, 'I');if(i===words.length-1){span.className='last-word';span.style.setProperty('--word-color',ink)}$('#sentence').append(span)});
 $('.lookup').style.setProperty('--cue',ink);$('#cue-color').textContent=cue.color;$('#cue-word').textContent=cue.word;
 $('#next').disabled=$('#majority').disabled=pending;$('#people').disabled=$('#opening').disabled=pending;
 const last=trace.at(-1),eligible=matchingSheets(pack,current()).length;
 $('#status').textContent=finished()?'Punctuation - keep chaining or Reset':`${eligible} matching sheets - ${last?last.kind==='random'?'last word from one random sheet':`last word from ${last.total} voters${last.tie?' - tie resolved alphabetically':''}`:'ready'}`;
 $('#audit-body').replaceChildren();
 if(last){const heading=document.createElement('p');heading.textContent=`${last.from} -> ${last.chosen} - ${last.kind==='random'?'random sheet':'most votes'}${last.tie?' - tied leaders use alphabetical order':''}`;$('#audit-body').append(heading);
 for(const [key,n] of Object.entries(last.counts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))){const row=document.createElement('p');row.textContent=`${key} - ${n} / ${last.total}`;$('#audit-body').append(row)}
 const people=document.createElement('p');people.textContent=`Sheet IDs: ${last.voterIds.join(', ')}`;$('#audit-body').append(people);for(const ballot of last.ballots){const row=document.createElement('p');row.textContent=`Sheet ${ballot.id} - match ${ballot.matchIndex+1} - ${ballot.next}`;$('#audit-body').append(row)}
 }else $('#audit-body').textContent='Each matching person picks one matching row at random. Next word chooses one person; Majority word counts one vote per person. Leave Voters empty to use everyone matching.';
}
function reset(){if(!pack)return;words=[$('#opening').value||pack.start];trace=[];$('#error').textContent='';render()}
function step(kind){if(!pack||pending)return false;
 const input=$('#voters');let limit=null;
 if(kind==='majority'){if(!input.reportValidity())return false;if(input.value!=='')limit=Number(input.value)}
 const from=current(),result=chooseWord(pack,from,kind,limit);
 if(!result.chosen){$('#error').textContent='No matching sheet for this cue';return false}
 trace.push({...result,from,kind});words.push(result.chosen);$('#error').textContent='';render();return result;
}
async function load(){const id=++loadId;pending=true;if(pack)render();try{const size=Number($('#people').value);const r=await fetch(`sentence-packs/${size}.json`);if(!r.ok)throw Error('Unable to load sheet pack');const data=await r.json();if(id!==loadId)return;pack=data;const previous=$('#opening').value;const starts=pack.starts||[pack.start];const cues=[...new Set(pack.sheets.flatMap(s=>s.map(([left])=>left)))].sort((a,b)=>split(a).word.localeCompare(split(b).word)||a.localeCompare(b));$('#opening').replaceChildren();for(const [label,keys] of [['Sentence openings',starts],['All sheet cues',cues.filter(k=>!starts.includes(k))]]){const group=document.createElement('optgroup');group.label=label;for(const key of keys){const option=document.createElement('option');option.value=key;const v=split(key);option.textContent=`${v.word} - ${v.color}`;group.append(option)}$('#opening').append(group)}if(cues.includes(previous))$('#opening').value=previous;const u=new URL(location.href);u.searchParams.set('scenario','sentences');u.searchParams.set('sheets',size);history.replaceState(null,'',u);pending=false;reset()}catch(e){if(id===loadId){pending=false;$('#people').disabled=false;$('#next').disabled=$('#majority').disabled=true;$('#error').textContent=e.message;}}}
$('#people').value=['15','100','200'].includes(params.get('sheets'))?params.get('sheets'):'200';
$('#opening').onchange=reset;$('#people').onchange=load;$('#next').onclick=()=>step('random');$('#majority').onclick=()=>step('majority');$('#reset').onclick=reset;
$('#theme').onclick=()=>{theme=theme==='dark'?'light':'dark';try{localStorage.setItem('paperweights.theme.v1',theme)}catch{}render()};
$('#scenario').onchange=e=>{const u=new URL('./',location.href);u.search=location.search;u.searchParams.set('scenario',e.target.value);location.assign(u)};
window.sentenceWords={state:()=>({packId:pack?.id,words:[...words],trace:structuredClone(trace),size:pack?.size}),step,reset};
render();await load();
