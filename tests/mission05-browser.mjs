import {chromium,firefox} from 'playwright';
import assert from 'node:assert/strict';
const root='http://127.0.0.1:8000/';
for(const [label,engine] of [['Chromium',chromium],['Firefox',firefox]]){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
 try{
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(root,{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('#mirrorDrawing').isChecked(),true);
  const first=await page.locator('#scene').boundingBox();
  assert.ok(first.y>110&&first.height>=350,'mobile optical scene is framed beneath intro');
  await page.locator('[data-tab="draw"]').click();
  await page.evaluate(()=>{
   const c=document.querySelector('#drawCanvas'),x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);
   x.fillStyle='#fff';x.fillRect(26,27,12,68);x.fillRect(26,83,102,12);
   x.beginPath();x.moveTo(175,37);x.lineTo(217,60);x.lineTo(175,84);x.closePath();x.fill();
  });
  const sketchBefore=await page.locator('#drawCanvas').evaluate(e=>e.toDataURL());
  await page.locator('#applyDraw').click();
  const projectionMirrored=await page.locator('#projectionPreview').evaluate(e=>e.toDataURL());
  await page.locator('#mirrorDrawing').uncheck();
  const projectionUnmirrored=await page.locator('#projectionPreview').evaluate(e=>e.toDataURL());
  const sketchAfter=await page.locator('#drawCanvas').evaluate(e=>e.toDataURL());
  assert.equal(sketchBefore,sketchAfter,'checkbox does not flip drawing preview');
  assert.notEqual(projectionMirrored,projectionUnmirrored,'asymmetric projected rays respond to correction');
  await page.locator('#mirrorDrawing').check();
  const snapshot=await page.locator('#projectionPreview').evaluate(e=>e.toDataURL());
  assert.equal(snapshot,projectionMirrored,'toggling correction twice creates no double mirror');
  const next=page.waitForEvent('download');
  await page.locator('#downloadProject').click();
  const project=JSON.parse((await (await next).path())?await (await import('node:fs/promises')).readFile(await (await next).path(),'utf8'):'{}');
  assert.equal(project.mirrorDrawing,true);
  assert.equal(project.normals.length,448);
  await page.locator('#saveProject').click();
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#loadLocal').click();
  assert.equal(await page.locator('#mirrorDrawing').isChecked(),true);
  await page.locator('#shareProject').click();
  // Public share must explicitly omit private URL fragment and artwork.
  await page.evaluate(()=>{window.__publicCopied='';Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async v=>{window.__publicCopied=v;}}});window.__opened=[];window.open=(u)=>{window.__opened.push(u);return {};};});
  await page.locator('#shareRaymosaic').click();
  assert.equal(await page.locator('#shareDialog').isVisible(),true);
  assert.equal((await page.locator('#shareDialogIntro').innerText()).includes('not your private'),true);
  await page.locator('#publicCopy').click();
  const copied=await page.evaluate(()=>window.__publicCopied);
  assert.equal(copied,'https://www.dennishilk.com/lab/raymosaic/');
  assert.ok(!copied.includes('#p='));
  await page.locator('#publicWhatsApp').click();
  await page.locator('#mastodonInstance').fill('social.dennishilk.com');
  await page.locator('#publicMastodon').click();
  const destinations=await page.evaluate(()=>window.__opened);
  assert.equal(destinations.length,2);
  assert.match(destinations[0],/^https:\/\/api\.whatsapp\.com\/send/);
  assert.match(destinations[1],/^https:\/\/social\.dennishilk\.com\/share/);
  await page.locator('#closePublicShare').click();
  for(const [w,h] of [[390,844],[360,740],[844,390]]){
   await page.setViewportSize({width:w,height:h});
   const fit=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
   assert.ok(fit.scroll<=fit.viewport+2,'no horizontal overflow '+w+'×'+h);
   await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
   const control=await page.locator('#downloadProject').boundingBox();
   const toolbar=await page.locator('.toolbar').boundingBox();
   assert.ok(control.y+control.height<toolbar.y+2,'bottom toolbar does not cover project control '+w+'×'+h);
  }
  await page.goto(root+'?lang=de',{waitUntil:'domcontentloaded'});
  assert.equal((await page.locator('#mirrorDrawingTitle').innerText()).includes('Motiv automatisch spiegeln'),true);
  assert.equal((await page.locator('#shareRaymosaic').innerText()).includes('RAYMOSAIC teilen'),true);
  assert.deepEqual(errors,[]);
  console.log(label+': drawing orientation roundtrip, save project, public privacy, Mastodon, German and 3 responsive viewports PASS (emulated viewport, not device)');
 }finally{await context.close();await browser.close();}
}
