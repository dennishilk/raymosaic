// Browser-scale acceptance: all screenshots and GIFs come from the real canvas optics.
import {chromium,firefox} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const artifacts='tests/artifacts';
await mkdir(artifacts,{recursive:true});
for(const [name,engine] of [['chromium',chromium],['firefox',firefox]]){
 const browser=await engine.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:800},acceptDownloads:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('http://127.0.0.1:8000/',{waitUntil:'domcontentloaded'});
  const options=await page.locator('#mirrorDensity option').allTextContents();
  assert.deepEqual(options,['448 mirrors · Classic','666 mirrors · DOOM of Love ❤️','1337 mirrors · OVERDRIVE 🚀']);
  assert.equal(await page.locator('#showLabels').isChecked(),true);
  await page.waitForTimeout(180);
  const labelled=await page.locator('#scene').evaluate(el=>el.toDataURL());
  await page.locator('#showLabels').uncheck();
  await page.waitForTimeout(180);
  const unlabelled=await page.locator('#scene').evaluate(el=>el.toDataURL());
  assert.notEqual(labelled,unlabelled,'live 3D scene annotations must visually disappear');
  await page.locator('#mirrorDensity').selectOption('1337');
  assert.match(await page.locator('#mirrorCount').innerText(),/1337/);
  assert.equal(await page.locator('#overdriveMessage').isVisible(),true);
  await page.locator('#customText').fill('NEBU');
  await page.locator('#applyText').click();
  const perf=await page.evaluate(async()=>{
    const {createMirrorArray}=await import('./src/mirror-modes.mjs');
    const {aimMirrors,DEFAULT_LIGHT}=await import('./src/optics.mjs');
    const {createScene,drawScene}=await import('./src/scene.js');
    const out={};
    for(const count of [448,666,1337]){
      const mirrors=aimMirrors(createMirrorArray(count),DEFAULT_LIGHT,Array.from({length:count},()=>[.5,.5]));
      const canvas=document.createElement('canvas');canvas.width=390;canvas.height=390;
      const ctx=canvas.getContext('2d'),scene=createScene();
      const start=performance.now();
      for(let i=0;i<3;i++)drawScene(ctx,scene,mirrors,DEFAULT_LIGHT,{width:390,height:390,align:1,time:0,showLabels:false,exportClean:true});
      out[count]=Math.round((performance.now()-start)/3*10)/10;
    }
    return out;
  });
  console.log(name+' forward optical render per 390px frame, milliseconds:',JSON.stringify(perf));
  // Create legacy-style baseline from the SAME source and facet normals,
  // but WITHOUT the new forward-ray framing transform.
  const oldImage=await page.evaluate(async()=>{
    const {createMirrorArray}=await import('./src/mirror-modes.mjs');
    const {aimMirrors,DEFAULT_LIGHT}=await import('./src/optics.mjs');
    const {makeTargetCanvas,paintTarget,sampleTarget,orientDrawingTargets}=await import('./src/targets.js');
    const {createScene,drawProjectionOnly}=await import('./src/scene.js');
    const array=createMirrorArray(1337),target=makeTargetCanvas();
    paintTarget(target,'text','NEBU');
    const points=orientDrawingTargets(sampleTarget(target,1337),true);
    const mirrors=aimMirrors(array,DEFAULT_LIGHT,points);
    const canvas=document.createElement('canvas');canvas.width=320;canvas.height=320;
    drawProjectionOnly(canvas.getContext('2d'),createScene(),mirrors,DEFAULT_LIGHT,{width:320,height:320,align:1,time:0,reverseView:true});
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await writeFile(artifacts+'/overdrive-baseline-'+name+'.png',Buffer.from(oldImage,'base64'));
  const projectWait=page.waitForEvent('download');await page.locator('#downloadProject').click();
  const projectFile=await projectWait;
  const project=JSON.parse(await readFile(await projectFile.path(),'utf8'));
  assert.equal(project.normals.length,1337);
  assert.equal(project.showLabels,false);
  assert.equal(project.mirrorCount,1337);
  await page.evaluate(()=>{window.__copied='';Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async s=>{window.__copied=s;}}});});
  await page.locator('#shareProject').click();
  await page.waitForFunction(()=>Boolean(window.__copied));
  const link=await page.evaluate(()=>window.__copied);
  await page.goto(link,{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('#mirrorDensity').inputValue(),'1337');
  assert.equal(await page.locator('#showLabels').isChecked(),false);
  await page.waitForTimeout(2500);
  await page.locator('#mirrorDensity').selectOption('448');
  await page.locator('#mirrorDensity').selectOption('1337');
  assert.equal(await page.locator('#overdriveMessage').isVisible(),false,'easter egg must not repeat every selection');
  await page.locator('#shareGif').click();
  await page.locator('#quality').selectOption('compact');
  await page.locator('#brandGif').uncheck();
  await page.locator('#projectionOnly').check();
  for(const aspect of name==='chromium'?['square','portrait','landscape']:['square']){
    await page.locator('#aspect').selectOption(aspect);
    await page.locator('#startExport').click();
    await page.locator('#downloadGif').waitFor({state:'visible',timeout:180000});
    const ready=page.waitForEvent('download');
    await page.locator('#downloadGif').click();
    await (await ready).saveAs(artifacts+'/overdrive-'+name+'-'+aspect+'.gif');
  }
  await page.locator('#projectionOnly').uncheck();
  await page.locator('#aspect').selectOption('square');
  await page.locator('#startExport').click();
  await page.locator('#downloadGif').waitFor({state:'visible',timeout:180000});
  let ready=page.waitForEvent('download');await page.locator('#downloadGif').click();
  await (await ready).saveAs(artifacts+'/overdrive-'+name+'-scene.gif');
  await page.locator('#closeExport').click();
  await page.locator('#customText').fill('Ich liebe dich, mein Schatz Katharina ❤️');
  await page.locator('#applyText').click();
  assert.ok(await page.locator('#sceneList button').count()>1);
  await page.locator('#shareGif').click();
  await page.locator('#projectionOnly').check();
  await page.locator('#aspect').selectOption('square');
  await page.locator('#startExport').click();
  await page.locator('#downloadGif').waitFor({state:'visible',timeout:180000});
  ready=page.waitForEvent('download');await page.locator('#downloadGif').click();
  await (await ready).saveAs(artifacts+'/overdrive-'+name+'-love.gif');
  await page.locator('#closeExport').click();
  // Launch a real export and cancel while the worker is active.
  await page.locator('#customText').fill('NEBU');
  await page.locator('#applyText').click();
  await page.locator('#shareGif').click();
  await page.locator('#duration').selectOption('8');
  await page.locator('#startExport').click();
  await page.locator('#exportProgress').waitFor({state:'visible'});
  await page.locator('#cancelExport').click();
  assert.equal(await page.locator('#startExport').isEnabled(),true);
  assert.equal(await page.locator('#exportDialog').isVisible(),false);
  for(const [w,h] of [[390,844],[844,390]]){
    await page.setViewportSize({width:w,height:h});
    const fit=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
    assert.ok(fit.scroll<=fit.width+2,'OVERDRIVE mobile layout must not overflow '+w+'×'+h);
  }
  await page.goto('http://127.0.0.1:8000/?lang=de',{waitUntil:'domcontentloaded'});
  assert.match(await page.locator('#showLabelsText').innerText(),/Beschriftungen anzeigen/);
  assert.match((await page.locator('#mirrorDensity option').allTextContents()).join(' '),/1337 Spiegel · OVERDRIVE/);
  assert.equal(await page.locator('#physicsDialog').count(),1);
  assert.deepEqual(errors,[]);
  console.log(name+' OVERDRIVE full scene + projection GIFs, 1337 projects, labels, compact phone viewports, cancel, DE: PASS');
 }finally{await page.close();await browser.close();}
}
