import {chromium} from '../../space/rover-run/src/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
const base=process.env.PAPERWEIGHTS_URL||'http://localhost:8684/paperweights/web/';
await page.clock.install();await page.goto(base);await page.waitForFunction(()=>window.paperweights);await page.waitForFunction(()=>{const c=document.querySelector('canvas');return c&&c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4!==3&&v>0)});
const pack=await page.evaluate(async()=>{const id=new URLSearchParams(location.search).get('pack');return (await fetch(id?`packs/${id}.json`:'pack.json')).json()});
const panelText=await page.locator('#teams').innerText();if(/MATCH|C0[1-6]|PAPER|JEZERO|TRAVERSE|CHECKPOINT|SEC|\bGo\b|\bAvoid\b|\bNext\b/.test(panelText))throw Error('Removed interface text remains');
const suffix='-'+pack.packId;fs.mkdirSync('paperweights/out',{recursive:true});
for(const [width,height] of [[1440,900],[1000,900],[390,844]]){await page.setViewportSize({width,height});await page.waitForTimeout(80);const dims=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight,w:innerWidth,h:innerHeight}));if(dims.sw>width||(width>700&&dims.sh>height))throw Error(`Overflow: ${JSON.stringify(dims)}`);await page.screenshot({path:`paperweights/out/competitive-dark-${width}${suffix}.png`,fullPage:true})}
await page.setViewportSize({width:1440,height:900});await page.evaluate(()=>paperweights.setTheme('light'));await page.screenshot({path:`paperweights/out/competitive-light-1440${suffix}.png`});await page.reload();await page.waitForFunction(()=>window.paperweights);if((await page.evaluate(()=>paperweights.state().theme))!=='light')throw Error('Theme not restored');await page.evaluate(()=>paperweights.setTheme('dark'));
if(await page.evaluate(()=>paperweights.inspect(0,'dust')))throw Error('Input allowed during bootstrap');
for(const sec of [20,30,10]){await page.selectOption('#duration',String(sec));if((await page.evaluate(()=>paperweights.state())).duration!==sec)throw Error('Duration failed')}
const initial=await page.evaluate(()=>paperweights.state());for(const t of initial.teams)if(Object.values(t.cards).filter(v=>v!==null).length!==1)throw Error('Bootstrap must show exactly onecard');
await page.evaluate(()=>[0,1,2,3].forEach(i=>paperweights.expire(i)));
let turns=0;const paperPlay=[];
for(let step=0;step<4;step++)for(let i=0;i<4;i++){
 const team=(await page.evaluate(()=>paperweights.state())).teams[i];if(team.status!=='waiting')continue;
 if(Object.values(team.cards).some(v=>v!==null))throw Error('Expired card remains visible');
 // The only decision input is the printed entries matching the card just seen.
 const counts={battery:0,slope:0,dust:0,ground:0};for(const sheet of pack.sheets.filter(s=>s.team===team.id)){const e=sheet.entries.find(e=>e.key===team.lastCue.key);if(!e)throw Error('Missing printed lookup');counts[e.nextCategory]++}
 const choice=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0];
 await page.locator(`.team:nth-child(${i+1}) [data-category=${choice}]`).click();
 const shown=(await page.evaluate(()=>paperweights.state())).teams[i];if(Object.values(shown.cards).filter(v=>v!==null).length!==1)throw Error('Not exactly one reveal');if(await page.evaluate(i=>paperweights.inspect(i,'battery'),i))throw Error('Double flip allowed');
 await page.evaluate(i=>paperweights.expire(i),i);turns++;
 const after=(await page.evaluate(()=>paperweights.state())).teams[i];if(JSON.stringify(shown.visible)!==JSON.stringify(after.lastCue))throw Error('Cue chain jumped');
 paperPlay.push({team:team.id,round:team.round,cue:team.lastCue,votes:counts,choice,revealed:shown.visible,status:after.status});
}
const final=await page.evaluate(()=>paperweights.state());if(final.teams.some(t=>['waiting','revealing','bootstrap'].includes(t.status)))throw Error('Game did not end');const beforeDissolve=await page.evaluate(()=>[...document.querySelectorAll('canvas')].map(c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4!==3&&v>0)));if(!beforeDissolve.some(Boolean))throw Error('Map display lists missing');await page.clock.fastForward(4000);await page.evaluate(()=>new Promise(requestAnimationFrame));const afterDissolve=await page.evaluate(()=>[...document.querySelectorAll('canvas')].map(c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4!==3&&v>0)));for(let i=0;i<4;i++)if(afterDissolve[i]!== (final.teams[i].status==='finished'))throw Error('Death dissolve did not clear only eliminated map');if(!final.teams.some(t=>t.legs.includes('avoid'))||!final.teams.some(t=>t.legs.includes('go')))throw Error('Route go/avoid history missing');await page.screenshot({path:`paperweights/out/competitive-result${suffix}.png`});
await page.locator('#reset').click();if((await page.evaluate(()=>paperweights.state())).teams.some(t=>t.round!==1||t.status!=='bootstrap'))throw Error('Reset failed');
if(process.env.PAPERWEIGHTS_REAL_CLOCK==='1'){await page.evaluate(()=>{paperweights.setDuration(10);paperweights.reset()});const start=Date.now();await page.waitForFunction(()=>paperweights.state().teams.every(t=>t.status==='waiting'),{},{timeout:12500});const elapsed=Date.now()-start;if(elapsed<9800||elapsed>12000)throw Error(`Unexpected real timer: ${elapsed}`);console.log(`Real bootstrap timer: ${elapsed} ms`)}
// Verify actual elapsed time uses the same transition, without waiting ten seconds.
await page.evaluate(()=>paperweights.reset());await page.clock.fastForward(5000);await page.evaluate(()=>paperweights.setDuration(30));await page.clock.fastForward(20000);if((await page.evaluate(()=>paperweights.state())).teams.some(t=>t.status!=='bootstrap'))throw Error('Duration extension did not retain original start');await page.clock.fastForward(5001);if((await page.evaluate(()=>paperweights.state())).teams.some(t=>t.status!=='waiting'))throw Error('Bootstrap did not expire');await page.evaluate(()=>{paperweights.setDuration(10);paperweights.inspect(0,'dust')});await page.clock.fastForward(10001);if((await page.evaluate(()=>paperweights.state())).teams[0].status==='revealing')throw Error('Reveal did not expire');
if(errors.length)throw Error(errors.join('\n'));const report={packId:pack.packId,turns,results:final.teams.map(t=>({id:t.id,status:t.status,round:t.round})),paperPlay,errors};fs.writeFileSync(`paperweights/out/playtest${suffix}.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({packId:pack.packId,turns,results:report.results,errors},null,2));await browser.close();
