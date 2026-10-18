import {chromium} from '../../space/rover-run/src/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
const b=await chromium.launch();const p=await b.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://localhost:8684/paperweights/web/');await p.waitForFunction(()=>window.paperweights);
const report=[];
for(const [width,height]of [[800,600],[1024,768],[1280,720],[1280,800],[1366,768],[1440,900],[1920,1080],[1920,1200],[2560,1440]]){
 await p.setViewportSize({width,height});await p.evaluate(()=>{paperweights.reset();for(let i=0;i<4;i++)paperweights.poll(i)});
 // Stress the panel height with every possible poll row plus an outcome.
 await p.evaluate(()=>{for(const el of document.querySelectorAll('.team')){const poll=el.querySelector('.poll');while(poll.children.length<6)poll.append(poll.lastElementChild.cloneNode(true));el.querySelector('.outcome').textContent='OUT'}});
 await p.waitForTimeout(150);
 const geometry=await p.evaluate(()=>{const r=e=>{const b=e.getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom}};return{w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight,map:r(document.querySelector('#shared-canvas')),panels:[...document.querySelectorAll('.team')].map(r),controls:[...document.querySelectorAll('.team .easy-actions button,.team .tokens,.team .poll-row')].map(r)}});
 assert.ok(geometry.w<=width&&geometry.h<=height,`${width}x${height} scroll ${JSON.stringify(geometry)}`);assert.ok(geometry.map.h>100,`${width}x${height} map too small`);
 for(const r of [...geometry.panels,...geometry.controls])assert.ok(r.x>=0&&r.y>=0&&r.right<=width+1&&r.bottom<=height+1,`${width}x${height} clipped ${JSON.stringify(r)}`);
 report.push({width,height,mapHeight:Math.round(geometry.map.h)});
 if(width===1024||width===1366)await p.screenshot({path:`paperweights/out/projector-${width}x${height}.png`});
}
assert.deepEqual(errors,[]);console.log(JSON.stringify(report));await b.close();
