import {chromium} from '../../space/rover-run/src/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto(process.env.PAPERWEIGHTS_URL||'http://localhost:8684/paperweights/web/');
await page.waitForFunction(()=>window.paperweights);
const pack=await page.evaluate(async()=> (await fetch('pack.json')).json());
const state=()=>page.evaluate(()=>paperweights.state());
const others=JSON.stringify((await state()).teams.slice(1));
let changed=false,previous;
for(let step=0;step<4;step++){
 await page.locator('[data-team=A] [data-poll=ai]').click();
 const team=(await state()).teams[0],p=team.polls.ai,expected={go:0,avoid:0};
 for(const sheet of pack.sheets.filter(s=>s.team==='A')){
  const entry=sheet.entries.find(e=>e.key===p.key),o=pack.observations.find(o=>o.id===entry.historyId);
  expected[o.source.battery==='dead'||o.source.dust==='storm'||o.source.ground==='sand'?'avoid':'go']++;
 }
 assert.deepEqual(p.counts,expected);assert.equal(p.total,expected.go+expected.avoid);
 assert.equal(await page.locator('[data-team=A] .poll-row').count(),2);
 if(previous&&JSON.stringify(previous)!==JSON.stringify(p.counts))changed=true;
 previous=p.counts;
 if(step===3)break;
 await page.locator('[data-team=A] [data-poll=audience]').click();
 const votes=(await state()).teams[0].polls.audience;
 assert.ok(!('go' in votes.counts)&&!('avoid' in votes.counts));
 assert.equal(votes.total,Object.values(votes.counts).reduce((a,b)=>a+b,0));
 assert.ok(Object.keys(votes.counts).every(c=>!team.revealed.includes(c)));
 const next=Object.entries(votes.counts).sort((a,b)=>b[1]-a[1])[0][0];
 await page.locator(`[data-team=A] [data-category=${next}]`).click();
 assert.deepEqual((await state()).teams[0].polls,{});
 assert.equal((await state()).teams[0].tokens,2-step);
}
assert.ok(changed,'AI must respond to additional evidence');
assert.equal(await page.locator('[data-team=A] [data-poll=audience]').isDisabled(),true);
assert.equal(JSON.stringify((await state()).teams.slice(1)),others);
for(const size of[{width:1024,height:768},{width:1280,height:720},{width:1920,height:1080}]){
 await page.setViewportSize(size);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth));
}
await page.setViewportSize({width:1366,height:768});
await page.locator('#reset').click();
await page.locator('[data-team=A] [data-poll=ai]').click();
await page.locator('[data-team=B] [data-poll=audience]').click();
await page.screenshot({path:'paperweights/out/medium-ai-handoff.png',fullPage:true});
await page.selectOption('#difficulty','easy');
assert.equal(await page.locator('.card.up').count(),16);
assert.equal(await page.locator('[data-team=A] [data-poll=ai]').isVisible(),false);
assert.equal(await page.locator('[data-team=A] [data-poll=audience]').isVisible(),false);
assert.deepEqual(errors,[]);
console.log('Passed: exact historical AI counts, audience flip-only normalization, cumulative evidence, 3-check budget, stale poll clearing, independent teams, Easy unchanged, projector fit');
await browser.close();
