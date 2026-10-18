import {chromium} from '../space/rover-run/src/node_modules/playwright/index.mjs';
import{writeFile}from'node:fs/promises';const b=await chromium.launch();const p=await b.newPage({viewport:{width:1366,height:768}});await p.goto('http://localhost:8684/paperweights/web/?mode=medium');await p.waitForFunction(()=>window.paperweights);const log=[];
for(let turn=0;turn<6;turn++)for(let i=0;i<4;i++){
 let t=await p.evaluate(i=>paperweights.state().teams[i],i);if(t.status!=='deciding')continue;
 const panel=p.locator(`[data-team=${t.id}]`);await panel.locator('[data-poll]').click();t=await p.evaluate(i=>paperweights.state().teams[i],i);
 while(t.tokens>0){const best=Object.entries(t.polls.audience.counts).sort((a,b)=>b[1]-a[1])[0][0];if(['go','avoid'].includes(best))break;await panel.locator(`[data-category=${best}]`).click();await panel.locator('[data-poll]').click();t=await p.evaluate(i=>paperweights.state().teams[i],i)}
 const action=t.polls.audience.counts.avoid>t.polls.audience.counts.go?'avoid':'go';await panel.locator(`[data-action=${action}]`).click();await p.waitForFunction(i=>paperweights.state().teams[i].status!=='moving',i);const next=await p.evaluate(i=>paperweights.state().teams[i],i);log.push({team:t.id,turn:turn+1,revealed:t.revealed,poll:t.polls.audience.counts,action,status:next.status});
}
await p.screenshot({path:'households/out/medium-comparison.png'});const teams=await p.evaluate(()=>paperweights.state().teams.map(t=>({id:t.id,round:t.round,status:t.status})));await writeFile('households/out/medium-playtest.json',JSON.stringify({teams,log},null,2));console.log(teams);await b.close();
