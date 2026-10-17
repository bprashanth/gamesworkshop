import {chromium} from '../../space/rover-run/src/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
await page.clock.install();await page.goto(process.env.PAPERWEIGHTS_URL||'http://localhost:8684/paperweights/web/');await page.waitForFunction(()=>window.paperweights);
const pack=await page.evaluate(async()=>{const id=new URLSearchParams(location.search).get('pack');return(await fetch(id?`packs/${id}.json`:'pack.json')).json()});if(pack.version!==3)throw Error('Stale pack');
fs.mkdirSync('paperweights/out',{recursive:true});
const snapshot=()=>page.evaluate(()=>paperweights.state());
const same=isDeepStrictEqual;
function checkGeometry(state){for(const t of state.teams){if(t.status==='moving'){if(t.activeBand!==null)throw Error('Band visible during transit');continue}if(t.status!=='deciding')continue;const b=t.activeBand;if(state.mode==='medium'&&!(t.rover.x>b.left&&t.rover.x<b.right))throw Error('Current band misses rover');if(state.mode==='easy'&&!(b.left>t.rover.x))throw Error('Next band not ahead')}}
if((await snapshot()).mode!=='easy')throw Error('Default must be Easy');if(await page.locator('#duration').count())throw Error('Old timer remains');
for(const mode of ['easy','medium']){
 await page.selectOption('#difficulty',mode);const initial=await snapshot();checkGeometry(initial);
 for(let i=0;i<4;i++){const expected=mode==='easy'?pack.teams[i].rounds[0].target:pack.teams[i].rounds[0].source;if(!same(initial.teams[i].cards,expected))throw Error(`Wrong ${mode} cards`)}
 if(await page.locator('.card.up').count()!==16)throw Error('Not all four cards up');
 for(const width of [1440,1000,390]){await page.setViewportSize({width,height:900});await page.clock.runFor(40);const size=await page.evaluate(()=>({w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight}));if(size.w>width||(width>700&&size.h>900))throw Error(`Overflow ${mode}/${width}: ${JSON.stringify(size)}`);await page.screenshot({path:`paperweights/out/prediction-${mode}-${width}-${pack.packId}.png`,fullPage:true})}
 await page.setViewportSize({width:1440,height:900});
 // Oracle actions only exercise transition correctness; Medium paper play is separate below.
 for(let r=0;r<4;r++)for(let i=0;i<4;i++){
  const action=pack.teams[i].rounds[r].fatal?'avoid':'go';await page.locator(`.team:nth-child(${i+1}) [data-action=${action}]`).click();
  if(await page.evaluate(({i,action})=>paperweights.act(i,action),{i,action}))throw Error('Double click accepted during motion');checkGeometry(await snapshot());
  await page.clock.runFor(700);const st=await snapshot();checkGeometry(st);const t=st.teams[i];if(r<3){if(t.round!==r+2||t.status!=='deciding')throw Error('Landing did not advance');if(mode==='medium'&&!same(t.cards,pack.teams[i].rounds[r].target))throw Error('Next source differs from prior target')}else if(t.status!=='finished'||!same(t.cards,pack.teams[i].rounds[3].target))throw Error('Final target off by one')
 }
}
const paperLog=[];await page.selectOption('#difficulty','medium');
for(let step=0;step<4;step++)for(let i=0;i<4;i++){
 const st=(await snapshot()).teams[i];if(st.status!=='deciding')continue;const votes={go:0,avoid:0,abstain:0};
 for(const sheet of pack.sheets.filter(s=>s.team===st.id)){const own={go:0,avoid:0};for(const cue of Object.values(st.cues)){const entry=sheet.entries.find(e=>e.key===cue.key);if(!entry)throw Error('No sheet observation for source card');own[entry.nextAction]++}votes[own.go===own.avoid?'abstain':own.go>own.avoid?'go':'avoid']++}
 if(!same(votes,pack.teams[i].rounds[st.round-1].paperVotes))throw Error('Paper votes differ from manifest');const action=votes.avoid>votes.go?'avoid':'go';await page.locator(`.team:nth-child(${i+1}) [data-action=${action}]`).click();await page.clock.runFor(700);const after=(await snapshot()).teams[i];paperLog.push({team:st.id,round:st.round,cards:st.cards,votes,action,status:after.status});
}
const paperResults=(await snapshot()).teams.map(t=>({id:t.id,status:t.status,round:t.round}));
// Both wrong decisions are fatal, in either mode.
for(const mode of ['easy','medium'])for(const fatal of [false,true]){await page.selectOption('#difficulty',mode);const i=pack.teams.findIndex(t=>t.rounds.some(r=>r.fatal===fatal)),r=pack.teams[i].rounds.findIndex(r=>r.fatal===fatal);for(let j=0;j<r;j++){await page.evaluate(({i,a})=>paperweights.act(i,a),{i,a:pack.teams[i].rounds[j].fatal?'avoid':'go'});await page.clock.runFor(700)}await page.evaluate(({i,a})=>paperweights.act(i,a),{i,a:fatal?'go':'avoid'});if((await snapshot()).teams[i].status!=='eliminated')throw Error('Wrong action not fatal');await page.clock.runFor(3500);const hasPixels=await page.locator('.team canvas').nth(i).evaluate(c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,k)=>k%4!==3&&v));if(hasPixels)throw Error('Dissolve did not clear eliminated map')}
await page.selectOption('#difficulty','easy');await page.locator('#theme').click();await page.screenshot({path:`paperweights/out/prediction-light-${pack.packId}.png`});await page.reload();await page.waitForFunction(()=>window.paperweights);if((await snapshot()).theme!=='light')throw Error('Theme not retained');await page.locator('#theme').click();
if(errors.length)throw Error(errors.join('\n'));const report={packId:pack.packId,paperResults,paperLog,errors};fs.writeFileSync(`paperweights/out/prediction-playtest-${pack.packId}.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({packId:pack.packId,paperResults,errors},null,2));await browser.close();
