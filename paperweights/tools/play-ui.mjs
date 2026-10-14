import {chromium} from '../../space/rover-run/src/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});page.on('pageerror',e=>errors.push(e.message));
const base=process.env.PAPERWEIGHTS_URL||'http://localhost:8684/paperweights/web/';
await page.goto(base);await page.waitForFunction(()=>window.paperweights);
fs.mkdirSync('paperweights/out',{recursive:true});
const suffix='-'+(await page.evaluate(()=>paperweights.state().packId));
for(const [width,height] of [[1440,900],[1000,900],[390,844]]){await page.setViewportSize({width,height});await page.waitForTimeout(120);const dims=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight,w:innerWidth,h:innerHeight}));if(dims.sw>width||(width>700&&dims.sh>height))throw Error(`Overflow: ${JSON.stringify(dims)}`);await page.screenshot({path:`paperweights/out/competitive-dark-${width}${suffix}.png`,fullPage:true})}
await page.setViewportSize({width:1440,height:900});await page.evaluate(()=>paperweights.setTheme('light'));await page.screenshot({path:`paperweights/out/competitive-light-1440${suffix}.png`});await page.reload();await page.waitForFunction(()=>window.paperweights);if((await page.evaluate(()=>paperweights.state().theme))!=='light')throw Error('Theme not restored');await page.evaluate(()=>paperweights.setTheme('dark'));
const pack=await page.evaluate(async()=>{const id=new URLSearchParams(location.search).get('pack');return (await fetch(id?`packs/${id}.json`:'pack.json')).json()});
let turns=0;const paperPlay=[];
for(let step=0;step<4;step++)for(let i=0;i<4;i++){
 const team=(await page.evaluate(()=>paperweights.state())).teams[i];if(team.status!=='playing')continue;
 if(Object.values(team.cards).some(v=>v!==null))throw Error('Hidden target leaked');
 const choice=Object.entries(team.votes).sort((a,b)=>b[1]-a[1])[0][0];
 await page.locator(`.team:nth-child(${i+1}) [data-category=${choice}]`).click();
 const state=(await page.evaluate(()=>paperweights.state())).teams[i];
 const value=state.cards[choice];const hazard=value==='dead'||value==='storm'||value==='sand';
 await page.locator(`.team:nth-child(${i+1}) [data-action=${hazard?'avoid':'go'}]`).click();turns++;
 const after=(await page.evaluate(()=>paperweights.state())).teams[i];paperPlay.push({team:team.id,round:team.round,cue:team.cue,votes:team.votes,choice,value,action:hazard?'avoid':'go',status:after.status});if(after.status==='crossed')await page.locator(`.team:nth-child(${i+1}) [data-action=next]`).click();
}
const final=await page.evaluate(()=>paperweights.state());if(final.teams.some(t=>t.status==='playing'||t.status==='crossed'))throw Error('Game did not end');await page.screenshot({path:`paperweights/out/competitive-result${suffix}.png`});
await page.locator('#reset').click();if((await page.evaluate(()=>paperweights.state())).teams.some(t=>t.round!==1||t.selected!==null||t.status!=='playing'))throw Error('Reset failed');
// Explicitly reject a second flip and disallow a decision without inspecting.
if(await page.evaluate(()=>paperweights.act(0,'go')))throw Error('Allowed blind action');await page.evaluate(()=>paperweights.inspect(0,'dust'));if(await page.evaluate(()=>paperweights.inspect(0,'battery')))throw Error('Allowed two flips');
// Every team can finish with correct decisions; this exercises Next and final states.
await page.evaluate(()=>paperweights.reset());for(let step=0;step<4;step++)for(let i=0;i<4;i++){await page.evaluate(({i})=>paperweights.inspect(i,'dust'),{i});await page.evaluate(({i,a})=>paperweights.act(i,a),{i,a:pack.teams[i].rounds[step].fatal?'avoid':'go'});if(step<3)await page.evaluate(i=>paperweights.next(i),i)}if((await page.evaluate(()=>paperweights.state())).teams.some(t=>t.status!=='finished'))throw Error('Correct play failed');
// False avoidance and missed hazards end a run immediately.
for(const wanted of [false,true]){const ti=pack.teams.findIndex(t=>t.rounds.some(r=>r.fatal===wanted));const ri=pack.teams[ti].rounds.findIndex(r=>r.fatal===wanted);await page.evaluate(()=>paperweights.reset());for(let k=0;k<ri;k++){await page.evaluate(i=>paperweights.inspect(i,'battery'),ti);await page.evaluate(({i,a})=>paperweights.act(i,a),{i:ti,a:pack.teams[ti].rounds[k].fatal?'avoid':'go'});await page.evaluate(i=>paperweights.next(i),ti)}await page.evaluate(i=>paperweights.inspect(i,'battery'),ti);await page.evaluate(({i,a})=>paperweights.act(i,a),{i:ti,a:wanted?'go':'avoid'});if((await page.evaluate(()=>paperweights.state())).teams[ti].status!=='eliminated')throw Error('Sudden death failed');}
if(errors.length)throw Error(errors.join('\n'));const report={packId:pack.packId,turns,results:final.teams.map(t=>({id:t.id,status:t.status,round:t.round})),paperPlay,errors};fs.writeFileSync(`paperweights/out/playtest${suffix}.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({packId:report.packId,turns,results:report.results,errors},null,2));await page.goto(new URL('/space/rover-run/src/web/',base).href);await page.waitForTimeout(400);await page.screenshot({path:'paperweights/out/collaborative-1440.png'});await browser.close();
