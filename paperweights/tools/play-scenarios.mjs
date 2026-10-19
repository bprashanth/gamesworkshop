import {chromium} from '../../space/rover-run/src/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.PAPERWEIGHTS_URL||'http://localhost:8684/paperweights/web/';
const out='households/out/shared-stages';await mkdir(out,{recursive:true});
const browser=await chromium.launch(),results=[];
for(const width of [680,1024,1366])for(const scenario of ['rover','households'])for(const mode of ['easy','medium','hard']){
 const page=await browser.newPage({viewport:{width,height:width===680?900:768}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));const url=new URL(base);url.searchParams.set('scenario',scenario);url.searchParams.set('mode',mode);
 await page.goto(url.href);await page.waitForFunction(()=>window.paperweights);await page.waitForTimeout(150);
 if(mode!=='easy')await page.evaluate(()=>{for(let i=0;i<4;i++)paperweights.poll(i,'ai')});
 const fit=await page.evaluate(()=>({doc:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],view:[innerWidth,innerHeight],overflows:[...document.querySelectorAll('.team,.cards,.cardbox,.bar,.controls')].filter(e=>e.scrollWidth>e.clientWidth+2).map(e=>e.className),state:paperweights.state()}));
 assert.deepEqual(errors,[]);assert.deepEqual(fit.doc,fit.view);assert.deepEqual(fit.overflows,[]);assert.equal(fit.state.mode,mode);assert.equal(fit.state.scenario,scenario);assert.equal(await page.locator('.cards').count(),4);
 if(mode==='easy'){assert.equal(await page.locator('.card.up').count(),16);assert.equal(await page.locator('.tokens').first().isVisible(),false)}else assert.equal(await page.locator('.card.up').count(),4);
 if(scenario==='households'&&mode==='easy'){assert.equal(await page.locator('.indicator').count(),0);assert.equal(await page.locator('.hazard:not([data-category=attendance])').count(),0);for(const team of fit.state.teams)assert.equal(team.cards.attendance==='dropout',team.cards.harvest==='failed'&&team.cards.cash==='loan')}
 if(scenario==='households'&&mode==='medium'){assert.equal(await page.locator('.hazard').count(),0);assert.ok(fit.state.teams.every(t=>t.cards.attendance!=='dropout'))}
 assert.equal(await page.locator('.team-name .tokens').count(),4);
 if(mode==='hard'){assert.equal(await page.locator('.hazard,.indicator').count(),0);const initial=fit.state.teams[0];await page.locator('[data-team=A] [data-poll=audience]').click();const after=await page.evaluate(()=>paperweights.state().teams[0]);assert.equal(after.judgements,initial.judgements-1);assert.equal(after.tokens,initial.tokens)}
 await page.screenshot({path:`${out}/${scenario}-${mode}-${width}.png`});results.push({width,scenario,mode,doc:fit.doc,errors});await page.close();
}
const page=await browser.newPage();await page.goto(base);await page.waitForFunction(()=>window.paperweights);await page.selectOption('#difficulty','hard');await page.selectOption('#scenario','households');await page.waitForFunction(()=>window.paperweights?.state().scenario==='households');assert.equal(await page.evaluate(()=>paperweights.state().mode),'hard');await page.selectOption('#difficulty','easy');await page.selectOption('#scenario','rover');await page.waitForFunction(()=>window.paperweights?.state().scenario==='rover');assert.equal(await page.evaluate(()=>paperweights.state().mode),'easy');await page.reload();await page.waitForFunction(()=>window.paperweights);assert.equal(await page.evaluate(()=>paperweights.state().mode),'easy');await page.close();await browser.close();await writeFile(`${out}/layout-checks.json`,JSON.stringify(results,null,2));console.log('18 scenario/stage/viewport combinations fit; mode survives scenario changes and reload');
