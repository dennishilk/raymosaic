// Real UI → Worker → downloaded GIF matrix. Pillow independently decodes outputs.
import {chromium,firefox} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const out='tests/artifacts';await mkdir(out,{recursive:true});
const manifest=[];
for(const [name,engine] of [['chromium',chromium],['firefox',firefox]]){
 const browser=await engine.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:8000/');
  await page.emulateMedia({reducedMotion:'reduce'});
  const generate=async({count=666,aspect='square',mode='projection',signature=false,text='NEBU',suffix=''})=>{
   if(await page.locator('#exportDialog').isVisible())await page.locator('#closeExport').click();
   await page.locator('#mirrorDensity').selectOption(String(count));await page.locator('#customText').fill(text);await page.locator('#applyText').click();
   const segments=Math.max(1,await page.locator('#sceneList button').count());
   await page.locator('#shareGif').click();await page.locator('#quality').selectOption('compact');await page.locator('#duration').selectOption('3');
   await page.locator('#aspect').selectOption(aspect);await page.locator('#projectionOnly').setChecked(mode==='projection');await page.locator('#brandGif').setChecked(signature);
   await page.locator('#startExport').click();
   assert.equal(await page.locator('#projectionOnly').isDisabled(),true,'freeze export settings while rendering');
   await page.locator('#downloadGif').waitFor({state:'visible',timeout:180000});
   assert.equal(await page.locator('#projectionOnly').isEnabled(),true);
   const file=`mission08-${name}-${count}-${aspect}-${mode}-${signature?'signed':'clean'}${suffix}.gif`;
   const download=page.waitForEvent('download');await page.locator('#downloadGif').click();await(await download).saveAs(out+'/'+file);
   manifest.push({file,browser:name,count,aspect,mode,signature,segments,text});
   return file;
  };
  for(const count of [448,666,1337])for(const aspect of ['square','portrait','landscape'])for(const mode of ['projection','scene']){
   await generate({count,aspect,mode});
  }
  // Pair signatures on/off with the exact same geometry and frame sequence.
  for(const mode of ['projection','scene'])await generate({mode,signature:true});
  // A completed full-scene file must disappear when projection is selected.
  await page.locator('#projectionOnly').check();
  assert.equal(await page.locator('#downloadGif').isVisible(),false);
  assert.equal(await page.locator('#exportPreview').isVisible(),false);
  assert.equal(await page.locator('#gifPreview').getAttribute('src'),null);
  assert.equal(await page.locator('#startExport').innerText(),'Create animated GIF ↗');
  await page.locator('#startExport').click();await page.locator('#downloadGif').waitFor({state:'visible'});
  for(const [id,value] of [['aspect','portrait'],['quality','standard'],['duration','5']]){
   await page.locator('#'+id).selectOption(value);assert.equal(await page.locator('#downloadGif').isVisible(),false,'invalidate '+id);
  }
  await page.locator('#brandGif').uncheck();assert.equal(await page.locator('#downloadGif').isVisible(),false);
  await page.locator('#closeExport').click();
  const message='Ich liebe dich, mein Schatz Katharina ❤️. Du bist mein Licht und meine Freude. Wir strahlen weiter, ein Spiegel nach dem anderen.';
  for(const mode of ['projection','scene'])await generate({text:message,mode,suffix:'-sequence'});
  assert.ok(manifest.at(-1).segments>=7);
  await page.locator('#closeExport').click();
  const png=page.waitForEvent('download');await page.locator('#savePng').click();await(await png).saveAs(out+`/mission08-${name}-scene.png`);
  // Public sharing is intercepted; no message is sent to an external service.
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.__copy=value;}}}));
  await page.locator('#shareRaymosaic').click();await page.locator('#publicCopy').click();
  assert.equal(await page.evaluate(()=>window.__copy),'https://www.dennishilk.com/lab/raymosaic/');await page.locator('#closePublicShare').click();
  for(const lang of ['en','de']){
   await page.goto('http://127.0.0.1:8000/?lang='+lang);
   await page.locator('#customText').fill('NEBU');await page.locator('#applyText').click();
   await page.locator('#shareGif').click();await page.locator('#quality').selectOption('compact');await page.locator('#duration').selectOption('3');await page.locator('#projectionOnly').check();
   const create=lang==='de'?'Animiertes GIF erstellen ↗':'Create animated GIF ↗';
   assert.equal(await page.locator('#startExport').innerText(),create);
   assert.equal(await page.locator('#closeExport').getAttribute('aria-label'),lang==='de'?'Exporteinstellungen schließen':'Close export settings');
   assert.match(await page.locator('#gifPreview').getAttribute('alt'),lang==='de'?/Vorschau/:/Preview/);
   await page.locator('#startExport').click();await page.locator('#downloadGif').waitFor({state:'visible'});
   assert.equal(await page.locator('#startExport').innerText(),lang==='de'?'Weiteres GIF erstellen ↗':'Create another GIF ↗');
   assert.match(await page.locator('#exportSize').innerText(),lang==='de'?/30 Bilder/:/30 frames/);
   await page.locator('#aspect').selectOption('portrait');assert.equal(await page.locator('#downloadGif').isVisible(),false);
   await page.locator('#duration').selectOption('8');await page.locator('#startExport').click();await page.locator('#cancelExport').click();
   assert.equal(await page.locator('#exportDialog').isVisible(),false);assert.equal(await page.locator('#startExport').innerText(),create);
   assert.equal(await page.locator('#projectionOnly').isEnabled(),true);
   // Worker error paths restore usable localized controls.
   await page.evaluate(()=>{window.Worker=class {constructor(){throw Error('TEST_ENCODER');}};});
   await page.locator('#shareGif').click();await page.locator('#startExport').click();
   assert.match(await page.locator('#toast').innerText(),lang==='de'?/Export nicht verfügbar: TEST_ENCODER/:/Export unavailable: TEST_ENCODER/);
   assert.equal(await page.locator('#startExport').isEnabled(),true);await page.locator('#closeExport').click();
  }
  assert.deepEqual(errors,[]);
  console.log(name+': 18 mode/density/aspect GIFs + 2 signature pairs + 2 complete sequences, stale-file regression, PNG, sharing, EN/DE, cancel and error paths PASS');
 }finally{await browser.close();}
}
await writeFile(out+'/mission08-manifest.json',JSON.stringify(manifest,null,2)+'\n');
