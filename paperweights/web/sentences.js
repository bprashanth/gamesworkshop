import {matchingSheets,chooseWord} from './sentence-model.js';
import * as live from './room-client.js';
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
 $('#next').disabled=$('#majority').disabled=pending;$('#majority').textContent=liveVote?'Accept':'Majority word';$('#people').hidden=!!live.room;$('#voters').parentElement.style.display=live.room?'none':'';$('#people').disabled=pending||$('#deck').value==='prior';$('#opening').disabled=pending;$('.source').textContent=pack.source+' - '+pack.size+' sheets';
 const last=trace.at(-1),eligible=matchingSheets(pack,current()).length;
 $('#status').textContent=finished()?'Punctuation - keep chaining or Reset':`${eligible} matching sheets - ${last?last.kind==='random'?'last word from one random sheet':`majority choice${last.tie?' - tie resolved alphabetically':''}`:'ready'}`;
 $('#audit-body').replaceChildren();
 if(last){const heading=document.createElement('p');heading.textContent=`${last.from} -> ${last.chosen} - ${last.kind==='random'?'random sheet':'most votes'}${last.tie?' - tied leaders use alphabetical order':''}`;$('#audit-body').append(heading);
 for(const [key,n] of Object.entries(last.counts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))){const row=document.createElement('p');row.textContent=`${key} - ${Math.round(100*n/last.total)}%`;$('#audit-body').append(row)}
 const people=document.createElement('p');people.textContent=`Sheet IDs: ${last.voterIds.join(', ')}`;$('#audit-body').append(people);for(const ballot of last.ballots){const row=document.createElement('p');const label=pack.sheetLabels?.[ballot.id-1];row.textContent=`Sheet ${label?label.id+' - Team '+label.team:ballot.id} - match ${ballot.matchIndex+1} - ${ballot.next}`;$('#audit-body').append(row)}
 }else $('#audit-body').textContent='Each matching person picks one matching row at random. Next word chooses one person; Majority word counts one vote per person. Leave Voters empty to use everyone matching.';
}
let liveVote=null,roomSize=live.room?.size;if(live.room)live.close('word');
function closeVote(){if(liveVote){live.close('word');liveVote=null;$('#live-votes').replaceChildren()}}
function paintVote(v){const el=$('#live-votes');el.replaceChildren();if(!liveVote)return;const counts=v?.counts||{},entries=Object.entries(counts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])),total=Math.max(1,entries.reduce((sum,e)=>sum+e[1],0));for(const [key,n] of entries){const w=split(key),row=document.createElement('button');row.className='vote-row';row.style.setProperty('--word-color',palette[w.color][theme==='dark'?1:0]);row.innerHTML=`<span></span><i><b style="width:${100*n/total}%"></b></i><em>${Math.round(100*n/total)}%</em>`;row.firstChild.textContent=w.word;row.onclick=()=>accept(key,counts);el.append(row)}if(!entries.length){const message=document.createElement('p');message.setAttribute('role','status');message.textContent=v?.status==='no-data'?'No matching data':'Waiting for votes';el.append(message)}liveVote.counts=counts}
function accept(key,counts){const from=current();closeVote();trace.push({kind:'majority',from,chosen:key,counts,total:Object.values(counts).reduce((a,b)=>a+b,0),voterIds:[],ballots:[],tie:false});words.push(key);render()}
const cueLabel=key=>{const v=split(key);return `${v.word} - ${v.color}`};
function reset(){if(!pack)return;const text=$('#opening').value.trim();const cues=[...new Set(pack.sheets.flatMap(s=>s.map(([left])=>left)))];let candidates=cues.filter(k=>k===text||cueLabel(k).toLowerCase()===text.toLowerCase());if(!candidates.length)candidates=cues.filter(k=>split(k).word.toLowerCase()===text.toLowerCase());if(candidates.length!==1){$('#error').textContent=candidates.length?'Choose the word and its color':'Choose a word from the sheets';return}const start=candidates[0];$('#opening').value=cueLabel(start);closeVote();words=[start];trace=[];$('#error').textContent='';render()}
function step(kind){if(!pack||pending)return false;
 if(live.room&&kind==='majority'){if(liveVote){const e=Object.entries(liveVote.counts||{}).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));if(e.length)accept(e[0][0],liveVote.counts);return true}liveVote={cue:current(),counts:{}};live.open('word','word',{cue:current(),deck:$('#deck').value});render();paintVote();return true}
 closeVote();
 const input=$('#voters');let limit=null;
 if(kind==='majority'){if(!input.reportValidity())return false;if(input.value!=='')limit=Number(input.value)}
 const from=current(),result=chooseWord(pack,from,kind,limit);
 if(!result.chosen){$('#error').textContent='No matching sheet for this cue';return false}
 trace.push({...result,from,kind});words.push(result.chosen);$('#error').textContent='';render();return result;
}
async function load(){const id=++loadId;pending=true;if(pack)render();try{const prior=$('#deck').value==='prior';const size=prior?15:Number($('#people').value);const r=await fetch(live.room?`/api/room/sentence-pack?deck=${prior?'prior':'mixed'}`:prior?'sentence-packs/prior-duplex.json':`sentence-packs/${size}.json`);if(!r.ok)throw Error('Unable to load sheet pack');const data=await r.json();if(id!==loadId)return;const sameDeck=pack&&(pack.id.startsWith('RM4-')===data.id.startsWith('RM4-'));pack=data;$('#people').value=String(pack.size);const previous=$('#opening').value;const starts=pack.starts||[pack.start];const cues=[...new Set(pack.sheets.flatMap(s=>s.map(([left])=>left)))].sort((a,b)=>split(a).word.localeCompare(split(b).word)||a.localeCompare(b));$('#opening-options').replaceChildren();for(const key of [...starts,...cues.filter(k=>!starts.includes(k))]){const option=document.createElement('option');option.value=cueLabel(key);$('#opening-options').append(option)}$('#opening').value=sameDeck&&cues.some(k=>cueLabel(k)===previous)?previous:cueLabel(pack.start);const u=new URL(location.href);u.searchParams.set('scenario','sentences');u.searchParams.set('sheets',pack.size);u.searchParams.set('deck',prior?'prior':'mixed');history.replaceState(null,'',u);pending=false;reset()}catch(e){if(id===loadId){pending=false;$('#people').disabled=false;$('#next').disabled=$('#majority').disabled=true;$('#error').textContent=e.message;}}}
$('#deck').value=params.get('deck')==='prior'?'prior':'mixed';
$('#people').value=['15','100','200'].includes(params.get('sheets'))?params.get('sheets'):'200';
$('#opening').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();reset()}};$('#deck').onchange=load;$('#opening').onchange=reset;$('#people').onchange=load;$('#next').onclick=()=>step('random');$('#majority').onclick=()=>step('majority');$('#reset').onclick=reset;
$('#theme').onclick=()=>{theme=theme==='dark'?'light':'dark';try{localStorage.setItem('paperweights.theme.v1',theme)}catch{}render()};
$('#scenario').onchange=e=>{const u=new URL('./',location.href);u.search=location.search;u.searchParams.set('scenario',e.target.value);location.assign(u)};
window.sentenceWords={state:()=>({packId:pack?.id,words:[...words],trace:structuredClone(trace),size:pack?.size}),step,reset};
render();await load();
live.watch(async sum=>{if(liveVote&&sum.votes.word?.cue===liveVote.cue)paintVote(sum.votes.word);if(sum.size!==roomSize&&!pending){roomSize=sum.size;const r=await fetch(`/api/room/sentence-pack?deck=${$('#deck').value}`);if(r.ok){pack=await r.json();render()}}});
