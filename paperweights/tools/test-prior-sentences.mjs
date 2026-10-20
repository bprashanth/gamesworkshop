import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {chromium} from '../../space/rover-run/src/node_modules/playwright/index.mjs';
const source=await readFile('paperweights/web/sentence-model.js','utf8');
const {chooseWord}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const pack=JSON.parse(await readFile('paperweights/robot-majority/prior-duplex.json','utf8'));
const served=JSON.parse(await readFile('paperweights/out/rover-review/paperweights/web/sentence-packs/prior-duplex.json','utf8'));
assert.deepEqual(served,pack);assert.equal(pack.size,15);assert.equal(pack.sheets.flat().length,360);
assert.equal(pack.sheets[0].filter(([a])=>a==='RED:the').length,2);
assert.deepEqual(pack.sheets[0].filter(([a])=>a==='RED:the').map(([,b])=>b),['RED:hat','GREEN:old']);
assert.ok(pack.sheets.every(s=>s.length===24));
const cues=[...new Set(pack.sheets.flatMap(s=>s.map(([a])=>a)))];
assert.ok(pack.sheets.flat().every(([,b])=>cues.includes(b)));
function rng(seed){return()=>((seed=Math.imul(1664525,seed)+1013904223>>>0)/4294967296)}
function audit(result,cue){
 assert.equal(new Set(result.voterIds).size,result.total);const counts={};
 for(const ballot of result.ballots){const match=pack.sheets[ballot.id-1].filter(([a])=>a===cue)[ballot.matchIndex];assert.equal(match[1],ballot.next);counts[ballot.next]=(counts[ballot.next]||0)+1}
 assert.deepEqual(counts,result.counts);
}
const report={packId:pack.id,cues:cues.length,starts:{}};
for(const start of pack.starts){const data={};
 for(const kind of ['random','majority']){const runs=[];
  for(let seed=0;seed<100;seed++){let cue=start,run=[cue];const random=rng(seed+1);
   for(let i=0;i<40;i++){const result=chooseWord(pack,cue,kind,null,random);audit(result,cue);cue=result.chosen;assert.ok(cue);run.push(cue)}runs.push(run.map(c=>c.split(':')[1]).join(' ').replace(/ ([.,!?])/g,'$1'));
  }data[kind]={distinct:new Set(runs).size,examples:runs.slice(0,3)};
 }report.starts[start]=data;
}
for(const cue of cues)for(const kind of ['random','majority'])audit(chooseWord(pack,cue,kind,5,rng(7)),cue);
await writeFile('paperweights/robot-majority/out/prior-report.json',JSON.stringify(report,null,2)+'\n');
const b=await chromium.launch(),page=await b.newPage({viewport:{width:1366,height:768}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://localhost:8684/paperweights/web/sentences.html?deck=prior');
await page.waitForFunction(()=>window.sentenceWords?.state().packId?.startsWith('PW2'));
assert.equal(await page.locator('#people').inputValue(),'15');assert.ok(await page.locator('#people').isDisabled());
assert.equal(await page.locator('#opening option').count(),cues.length);
for(let i=0;i<20;i++)await page.locator('#next').click();
let state=await page.evaluate(()=>sentenceWords.state());for(const t of state.trace)audit(t,t.from);
await page.screenshot({path:'paperweights/robot-majority/out/prior-random.png',fullPage:true});
await page.locator('#reset').click();assert.deepEqual((await page.evaluate(()=>sentenceWords.state())).words,[pack.start]);
await page.locator('#voters').fill('200');for(let i=0;i<20;i++)await page.locator('#majority').click();
state=await page.evaluate(()=>sentenceWords.state());for(const t of state.trace){audit(t,t.from);assert.equal(t.total,t.eligible)}
await page.screenshot({path:'paperweights/robot-majority/out/prior-majority.png',fullPage:true});
await page.reload();await page.waitForFunction(()=>window.sentenceWords?.state().packId?.startsWith('PW2'));
await page.selectOption('#deck','mixed');await page.waitForFunction(()=>sentenceWords.state().packId.startsWith('RM4'));
assert.ok(await page.locator('#people').isEnabled());await page.selectOption('#people','200');await page.waitForFunction(()=>sentenceWords.state().size===200);
await page.selectOption('#deck','prior');await page.waitForFunction(()=>sentenceWords.state().packId.startsWith('PW2'));assert.equal((await page.evaluate(()=>sentenceWords.state())).size,15);
await page.setViewportSize({width:680,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
assert.deepEqual(errors,[]);await b.close();console.log(JSON.stringify(report,null,2));console.log('PASS exact prior pack, 600 forty-step chains, all cues, distinct voters, browser deck switch, reset, refresh, quota cap and layout');
