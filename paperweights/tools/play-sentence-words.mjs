import {chromium} from '../../space/rover-run/src/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
await mkdir('paperweights/robot-majority/out',{recursive:true});
const b=await chromium.launch(),p=await b.newPage({viewport:{width:1366,height:768}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto('http://localhost:8684/paperweights/web/?scenario=households&mode=medium');await p.waitForFunction(()=>window.paperweights);await p.selectOption('#scenario','sentences');await p.waitForFunction(()=>window.sentenceWords?.state().packId);
assert.equal((await p.evaluate(()=>sentenceWords.state())).size,200);
for(let i=0;i<7;i++)await p.locator('#next').click();let s=await p.evaluate(()=>sentenceWords.state());assert.equal(s.words.length,8);assert.equal(s.words.at(-1),'BLUE:robot');
for(const t of s.trace){assert.equal(t.total,1);assert.equal(t.voterIds.length,1)}
await p.screenshot({path:'paperweights/robot-majority/out/random-seven.png'});
await p.locator('#reset').click();assert.deepEqual((await p.evaluate(()=>sentenceWords.state())).words,['RED:one']);await p.locator('#voters').fill('5');
for(let i=0;i<14;i++)await p.locator('#majority').click();s=await p.evaluate(()=>sentenceWords.state());assert.equal(s.words.at(-1),'AMBER:.');assert.equal(s.trace.length,14);
const pack=await p.evaluate(()=>fetch('sentence-packs/200.json').then(r=>r.json()));
for(const t of s.trace){assert.equal(t.total,5);assert.equal(new Set(t.voterIds).size,5);const counts={};for(const id of t.voterIds){const pair=pack.sheets[id-1].find(([from])=>from===t.from);assert.ok(pair);counts[pair[1]]=(counts[pair[1]]||0)+1}assert.deepEqual(t.counts,counts);assert.equal(t.counts[t.chosen],Math.max(...Object.values(counts)))}
assert.ok(await p.locator('#next').isDisabled());assert.ok(await p.locator('#majority').isDisabled());
await p.locator('#reset').click();await p.locator('#voters').fill('');for(let i=0;i<14;i++)await p.locator('#majority').click();assert.equal(await p.locator('#sentence').innerText(),'One night the old man found his robot checking every boat by the harbour.');await p.screenshot({path:'paperweights/robot-majority/out/majority-complete.png'});
await p.selectOption('#people','15');await p.waitForFunction(()=>sentenceWords.state().size===15);assert.equal((await p.evaluate(()=>sentenceWords.state())).words.length,1);await p.locator('#voters').fill('200');await p.locator('#majority').click();s=await p.evaluate(()=>sentenceWords.state());assert.equal(s.trace[0].total,s.trace[0].eligible);assert.ok(s.trace[0].total<15);
await p.locator('#theme').click();await p.setViewportSize({width:680,height:900});await p.screenshot({path:'paperweights/robot-majority/out/words-half-light.png'});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await p.selectOption('#scenario','rover');await p.waitForFunction(()=>window.paperweights?.state().scenario==='rover');assert.equal(await p.evaluate(()=>paperweights.state().mode),'medium');
await p.goto('http://localhost:8684/paperweights/web/?scenario=sentences');await p.waitForFunction(()=>window.sentenceWords?.state().packId);assert.deepEqual(errors,[]);await b.close();console.log('PASS seven random words, 5-voter majorities, exact sheet audit, full majority, reset, pack switch, quota clamp, navigation, theme and half-screen');
