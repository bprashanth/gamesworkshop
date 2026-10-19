import {chromium} from '../../space/rover-run/src/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
await mkdir('paperweights/robot-majority/out',{recursive:true});
const b=await chromium.launch(),p=await b.newPage({viewport:{width:1366,height:768}}),errors=[];
p.on('pageerror',e=>errors.push(e.message));
await p.goto('http://localhost:8684/paperweights/web/?scenario=households&mode=medium');
await p.waitForFunction(()=>window.paperweights);await p.selectOption('#scenario','sentences');
await p.waitForFunction(()=>window.sentenceWords?.state().packId);
const pack=await p.evaluate(()=>fetch('sentence-packs/200.json').then(r=>r.json()));
const cues=[...new Set(pack.sheets.flatMap(s=>s.map(([left])=>left)))];
assert.equal(await p.locator('#opening option').count(),cues.length);
for(const cue of cues){
  await p.selectOption('#opening',cue);
  assert.deepEqual((await p.evaluate(()=>sentenceWords.state())).words,[cue]);
  await p.locator('#next').click();
  const s=await p.evaluate(()=>sentenceWords.state());
  assert.equal(s.words.length,2);
  assert.ok(pack.sheets.some(sheet=>sheet.some(([a,b])=>a===cue&&b===s.words[1])));
}
await p.selectOption('#opening',pack.start);
for(let i=0;i<40;i++)await p.locator('#next').click();
let s=await p.evaluate(()=>sentenceWords.state());assert.equal(s.words.length,41);
for(const t of s.trace){assert.equal(t.total,1);assert.equal(t.voterIds.length,1)}
await p.screenshot({path:'paperweights/robot-majority/out/random-open-chain.png',fullPage:true});
await p.locator('#reset').click();assert.deepEqual((await p.evaluate(()=>sentenceWords.state())).words,[pack.start]);
await p.locator('#voters').fill('5');
for(let i=0;i<30;i++)await p.locator('#majority').click();
s=await p.evaluate(()=>sentenceWords.state());
for(const t of s.trace){
  assert.equal(t.total,5);assert.equal(new Set(t.voterIds).size,5);const counts={};
  for(const id of t.voterIds){const pair=pack.sheets[id-1].find(([from])=>from===t.from);assert.ok(pair);counts[pair[1]]=(counts[pair[1]]||0)+1}
  assert.deepEqual(t.counts,counts);assert.equal(t.counts[t.chosen],Math.max(...Object.values(counts)));
}
await p.locator('#voters').fill('');
const expected=[
 'One night the old man found his robot checking every boat by the harbour.',
 'Each morning a young nurse watched her robot sorting every file inside our clinic.',
 'That evening a quiet farmer saw his robot counting each seed beside his barn.'
];
for(let i=0;i<pack.starts.length;i++){
 await p.selectOption('#opening',pack.starts[i]);await p.locator('#reset').click();
 for(let j=0;j<14;j++)await p.locator('#majority').click();
 assert.equal(await p.locator('#sentence').innerText(),expected[i]);
 assert.ok(await p.locator('#next').isEnabled());await p.locator('#majority').click();
 assert.equal((await p.evaluate(()=>sentenceWords.state())).words.at(-1),pack.start);
}
await p.selectOption('#opening','BLUE:,');await p.locator('#majority').click();
assert.equal(await p.locator('#sentence').innerText(),', one');
await p.locator('#reset').click();assert.equal(await p.locator('#sentence').innerText(),',');
await p.selectOption('#opening',cues.find(c=>c.endsWith(':robot')));
await p.selectOption('#people','15');await p.waitForFunction(()=>sentenceWords.state().size===15);
assert.equal((await p.evaluate(()=>sentenceWords.state())).words[0].split(':')[1],'robot');
await p.locator('#voters').fill('200');await p.locator('#majority').click();s=await p.evaluate(()=>sentenceWords.state());
assert.equal(s.trace[0].total,s.trace[0].eligible);assert.ok(s.trace[0].total<15);
await p.locator('#theme').click();await p.setViewportSize({width:680,height:900});
await p.screenshot({path:'paperweights/robot-majority/out/words-half-light.png'});
assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await p.selectOption('#scenario','rover');await p.waitForFunction(()=>window.paperweights?.state().scenario==='rover');
assert.equal(await p.evaluate(()=>paperweights.state().mode),'medium');
assert.deepEqual(errors,[]);await b.close();
console.log('PASS every starting cue, punctuation continuation, 40 random choices, exact sampled votes, three majority routes, reset, pack changes, navigation and narrow layout');
