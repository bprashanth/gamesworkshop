// Grammar is an explicit scaffold; every chosen continuation comes from dealt rows.
export function createState(pack,variantId='chain') {
  return decorate(pack,{variant:variantId,slots:[...pack.initialSlots],cueKey:variantId==='scheduled'?pack.initialSlots[0]:pack.startKey,turn:0,done:false,clauses:[],history:[],changedSlot:null});
}
export function options(pack,state) {
  if(state.done)return [];
  const counts=pack.tallies['AB'[state.turn%2]][state.cueKey];
  const ranked=Object.values(counts).filter(n=>n>0).sort((a,b)=>b-a);
  const threshold=ranked[Math.min(1,ranked.length-1)];
  return Object.entries(counts).filter(([,n])=>n>0).map(([toKey,count])=>({toKey,word:pack.nodes[toKey].word,color:pack.nodes[toKey].color,count,isLeader:count>=threshold}));
}
function decorate(pack,state) {
  let tokens=[];
  if(state.variant==='append') {
    tokens=[{word:'The robot',color:null}];
    state.history.forEach((h,i)=>{const n=pack.nodes[h.toKey];tokens.push({word:n.word,color:n.color,slot:n.slot},{word:n.object+(i===state.history.length-1?'.':'; then'),color:null});});
  } else {
    tokens=[{word:'The robot',color:null}];
    state.slots.forEach((key,i)=>{const n=pack.nodes[key];tokens.push({word:n.word,color:n.color,slot:i},{word:pack.grammar.objects[i]+(i===4?'.':i===3?' and':','),color:null});});
  }
  return {...state,tokens,changedSlotIndex:state.changedSlot,changedSlot:state.changedSlot===null?null:state.variant==='append'?tokens.length-2:1+state.changedSlot*2};
}
export function choose(pack,state,toKey,allowAll=false) {
  if(state.done)throw Error('Finished');
  if(!options(pack,state).some(o=>o.toKey===toKey&&(o.isLeader||allowAll)))throw Error('Choose a printed leading continuation');
  const node=pack.nodes[toKey],out={...state,slots:[...state.slots],clauses:[...state.clauses],history:[...state.history],changedSlot:node.slot};
  out.slots[node.slot]=toKey;
  out.clauses.push(node.word+' '+node.object);
  out.history.push({group:'AB'[state.turn%2],cueKey:state.cueKey,toKey,counts:pack.tallies['AB'[state.turn%2]][state.cueKey]});
  out.turn++;out.done=out.turn===pack.roundCount;
  out.cueKey=state.variant==='scheduled'?out.slots[out.turn%5]:toKey;
  return decorate(pack,out);
}
