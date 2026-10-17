import {DEFAULT_LIGHT,createArray,aimMirrors,projectMirror,withinWall,WALL} from './optics.mjs';
import {makeTargetCanvas,paintTarget,sampleTarget} from './targets.js';
import {createScene,drawScene,drawProjectionOnly,easeAlign,cycleAlign,projectPoint} from './scene.js';
const $=id=>document.getElementById(id);
const canvas=$('scene'),context=canvas.getContext('2d',{alpha:false});
const scene=createScene(),baseMirrors=createArray(28,16),targetCanvas=makeTargetCanvas();
let light=[...DEFAULT_LIGHT],targets=[],mirrors=[],preset='heart',ice=false,showRays=false,selected=-1,lightDirty=false;
let introStart=performance.now(),introForce=false,renderWidth=0,renderHeight=0,movingCamera=false;
let messageTimer=0,exportWorker=null,exporting=false,exportBlob=null,exportUrl=null;
$('mirrorCount').textContent=`${baseMirrors.length} MIRRORS`;
function toast(message){const t=$('toast');t.textContent=message;t.classList.remove('hidden');clearTimeout(messageTimer);messageTimer=setTimeout(()=>t.classList.add('hidden'),3200);}
function setTargets(kind,text){paintTarget(targetCanvas,kind,text);targets=sampleTarget(targetCanvas,baseMirrors.length);mirrors=aimMirrors(baseMirrors,light,targets);selected=-1;$('inspector').classList.add('hidden');lightDirty=false;$('recalculate').disabled=true;
 introStart=performance.now();introForce=true;$('motto').textContent=kind==='heart'?'A HEART MADE OF REFLECTIONS':kind==='text'?`YOUR MESSAGE, IN LIGHT`:'EVERY SPOT IS A REFLECTION';
 $('opticsMessage').textContent='Drag the scene to orbit. Scroll to zoom. Click a mirror to inspect it.';
}
setTargets('heart');
function resize(){const rect=canvas.getBoundingClientRect();const dpr=Math.min(window.devicePixelRatio||1,1.35);renderWidth=Math.max(1,Math.round(rect.width*dpr));renderHeight=Math.max(1,Math.round(rect.height*dpr));if(canvas.width!==renderWidth||canvas.height!==renderHeight){canvas.width=renderWidth;canvas.height=renderHeight;}}
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
function currentAlign(now){if(reduceMotion.matches)return 1;const t=Math.min(1,(now-introStart)/2600);return easeAlign(t);}
let lastFrame=0;function tick(now){if(now-lastFrame<32){requestAnimationFrame(tick);return;}lastFrame=now;resize();const align=currentAlign(now);drawScene(context,scene,mirrors,light,{width:renderWidth,height:renderHeight,align,time:reduceMotion.matches?0:now/1000,rays:showRays,selected,ice,showLabels:!window.matchMedia('(max-width:680px)').matches});requestAnimationFrame(tick);}
requestAnimationFrame(tick);
function updatePresetButtons(name){document.querySelectorAll('[data-preset]').forEach(b=>{b.classList.toggle('selected',b.dataset.preset===name);});}
function selectTab(tab){document.querySelectorAll('.tab').forEach(b=>{const active=b.dataset.tab===tab;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));});
 for(const t of ['presets','text','draw'])$(t+'Tab').classList.toggle('hidden',t!==tab);}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>selectTab(b.dataset.tab)));
document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{const name=b.dataset.preset;preset=name;updatePresetButtons(name);setTargets(name==='hello'?'text':name,'HELLO');}));
$('applyText').addEventListener('click',()=>{preset='custom';updatePresetButtons('none');setTargets('text',$('customText').value);});
$('customText').addEventListener('keydown',e=>{if(e.key==='Enter')$('applyText').click();});
$('replay').addEventListener('click',()=>{introStart=performance.now();toast('Replaying mirror alignment');});
$('showRays').addEventListener('change',e=>{showRays=e.target.checked;});
$('coolLight').addEventListener('change',e=>{ice=e.target.checked;});
for(const [id,i] of [['lightX',0],['lightY',1],['lightZ',2]])$(id).addEventListener('input',e=>{light[i]=Number(e.target.value);lightDirty=true;$('recalculate').disabled=false;$('lightCoordinates').textContent=light.map(x=>x.toFixed(1)).join(' / ');
 $('opticsMessage').textContent='The mirrors are still aiming at the old source. Watch the image shift, then recalculate.';$('motto').textContent='THE LIGHT MOVED. THE PHYSICS FOLLOWED.';});
$('recalculate').addEventListener('click',()=>{mirrors=aimMirrors(baseMirrors,light,targets);lightDirty=false;$('recalculate').disabled=true;introStart=performance.now();$('opticsMessage').textContent='Normals recalculated for the new light source.';toast('Mirrors recalculated from the reflection law');});
$('reset').addEventListener('click',()=>{light=[...DEFAULT_LIGHT];$('lightX').value=String(light[0]);$('lightY').value=String(light[1]);$('lightZ').value=String(light[2]);$('lightCoordinates').textContent=light.map(x=>x.toFixed(1)).join(' / ');scene.camera=createScene().camera;
 $('showRays').checked=false;showRays=false;$('coolLight').checked=false;ice=false;preset='heart';updatePresetButtons('heart');selectTab('presets');setTargets('heart');toast('Instrument reset');});
// Orbit camera by dragging the scene; inspect a facet with a click.
let pointer=null;
canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,dragged:false};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(Math.hypot(e.clientX-pointer.startX,e.clientY-pointer.startY)>5)pointer.dragged=true;
 if(pointer.dragged){scene.camera.yaw+=dx*.0055;scene.camera.pitch=Math.max(.16,Math.min(1.22,scene.camera.pitch-dy*.0055));}
 pointer.x=e.clientX;pointer.y=e.clientY;});
canvas.addEventListener('pointerup',e=>{if(!pointer||pointer.id!==e.pointerId)return;if(!pointer.dragged){const rect=canvas.getBoundingClientRect();const x=(e.clientX-rect.left)*(canvas.width/rect.width),y=(e.clientY-rect.top)*(canvas.height/rect.height);let closest=-1,best=(Math.max(18,canvas.width*.015))**2;
 for(const m of mirrors){const q=projectPoint(scene.camera,canvas.width,canvas.height,m.center);if(!q)continue;const d=(q[0]-x)**2+(q[1]-y)**2;if(d<best){best=d;closest=m.id;}}
 selected=closest;if(selected>=0){const m=mirrors[selected];const hits=projectMirror(light,m.center,m.normal,WALL.x,m.size);$('mirrorId').textContent=`MIRROR ${String(selected+1).padStart(3,'0')}`;
 $('mirrorInfo').textContent=`Normal: ${m.normal.map(n=>n.toFixed(3)).join(' / ')}\nTilt: ${m.tilt?.toFixed(1)??'invalid'}°\nForward ray: ${withinWall(hits.center)?'intersects wall':'misses wall'}\nCoordinates: ${m.center.map(a=>a.toFixed(2)).join(' / ')}`;
 $('inspector').classList.remove('hidden');}else $('inspector').classList.add('hidden');}
 pointer=null;});
canvas.addEventListener('pointercancel',()=>pointer=null);
canvas.addEventListener('wheel',e=>{e.preventDefault();scene.camera.distance=Math.max(12,Math.min(38,scene.camera.distance+e.deltaY*.019));},{passive:false});
$('closeInspector').addEventListener('click',()=>{selected=-1;$('inspector').classList.add('hidden');});
// Drawing surface with undo and erase.
const draw=$('drawCanvas'),drawctx=draw.getContext('2d');let stroke=false,erase=false,lastPoint=null,history=[];
function saveHistory(){history.push(drawctx.getImageData(0,0,draw.width,draw.height));if(history.length>25)history.shift();}
function pointOnDraw(e){const r=draw.getBoundingClientRect();return [(e.clientX-r.left)*draw.width/r.width,(e.clientY-r.top)*draw.height/r.height];}
draw.addEventListener('pointerdown',e=>{stroke=true;saveHistory();draw.setPointerCapture(e.pointerId);lastPoint=pointOnDraw(e);drawctx.lineJoin='round';drawctx.lineCap='round';drawctx.lineWidth=erase?21:9;drawctx.globalCompositeOperation=erase?'destination-out':'source-over';drawctx.strokeStyle='#ffffff';drawctx.beginPath();drawctx.arc(...lastPoint,drawctx.lineWidth*.5,0,Math.PI*2);drawctx.fillStyle='#ffffff';if(erase)drawctx.clearRect(lastPoint[0]-11,lastPoint[1]-11,22,22);else drawctx.fill();});
draw.addEventListener('pointermove',e=>{if(!stroke)return;const q=pointOnDraw(e);drawctx.beginPath();drawctx.moveTo(...lastPoint);drawctx.lineTo(...q);drawctx.stroke();lastPoint=q;});
function endStroke(){stroke=false;drawctx.globalCompositeOperation='source-over';}
draw.addEventListener('pointerup',endStroke);draw.addEventListener('pointercancel',endStroke);
$('brush').addEventListener('click',()=>{erase=false;$('brush').classList.add('active');$('eraser').classList.remove('active');});
$('eraser').addEventListener('click',()=>{erase=true;$('eraser').classList.add('active');$('brush').classList.remove('active');});
$('undoDraw').addEventListener('click',()=>{const previous=history.pop();if(previous)drawctx.putImageData(previous,0,0);});
$('clearDraw').addEventListener('click',()=>{saveHistory();drawctx.clearRect(0,0,draw.width,draw.height);});
$('applyDraw').addEventListener('click',()=>{preset='custom';updatePresetButtons('none');setTargets('draw',draw);});
// PNG uses exactly the same independently computed forward renderer.
$('savePng').addEventListener('click',()=>{const c=document.createElement('canvas');c.width=1600;c.height=900;const ctx=c.getContext('2d');drawScene(ctx,scene,mirrors,light,{width:c.width,height:c.height,align:1,time:1,ice,selected:-1,rays:showRays});c.toBlob(blob=>{if(!blob){toast('PNG generation failed');return;}download(blob,'raymosaic.png');},'image/png');});
function download(blob,filename){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
const modal=$('exportDialog');$('shareGif').addEventListener('click',()=>{modal.showModal();});$('closeExport').addEventListener('click',()=>{cancelGif();modal.close();});
modal.addEventListener('cancel',()=>cancelGif());
function cancelGif(){if(exportWorker){exportWorker.terminate();exportWorker=null;}exporting=false;$('exportProgress').classList.add('hidden');$('startExport').disabled=false;$('startExport').textContent='Create animated GIF ↗';}
$('cancelExport').addEventListener('click',()=>{cancelGif();modal.close();});
function resetPreviousExport(){if(exportUrl){URL.revokeObjectURL(exportUrl);exportUrl=null;}exportBlob=null;$('exportPreview').classList.add('hidden');$('downloadGif').classList.add('hidden');$('nativeShare').classList.add('hidden');}
function formatSize(n){return n>1000000?`${(n/1000000).toFixed(2)} MB`:`${Math.round(n/1024)} KB`;}
function exportDimensions(aspect,quality){const short=quality==='compact'?320:quality==='high'?768:512;if(aspect==='portrait')return [Math.round(short*9/16),short];if(aspect==='landscape')return [short,Math.round(short*9/16)];return [short,short];}
function createFrameBuffer(c,frameContext,idx,total,mode){const t=idx/total,align=cycleAlign(t),opts={width:c.width,height:c.height,align,time:t*5,ice,selected:-1,rays:false,showLabels:false,low:mode==='projection'};
 if(mode==='projection')drawProjectionOnly(frameContext,scene,mirrors,light,opts);
 else {const original=scene.camera;
  const portrait=c.width<c.height,landscape=c.width>c.height;
  scene.camera={...original,target:portrait?[5,3,0]:landscape?[2,2.8,0]:[4.5,3,0],distance:portrait?17.5:landscape?19:15};
  drawScene(frameContext,scene,mirrors,light,opts);scene.camera=original;}
 return frameContext.getImageData(0,0,c.width,c.height).data.buffer;
}
$('startExport').addEventListener('click',async()=>{
 if(exporting)return;resetPreviousExport();exporting=true;$('startExport').disabled=true;
 const quality=$('quality').value,[width,height]=exportDimensions($('aspect').value,quality),fps=quality==='compact'?10:quality==='high'?15:12,duration=Number($('duration').value),total=Math.round(fps*duration),mode=$('projectionOnly').checked?'projection':'scene';
 const bufferCanvas=document.createElement('canvas');bufferCanvas.width=width;bufferCanvas.height=height;
 const frameCtx=bufferCanvas.getContext('2d',{willReadFrequently:true});
 const prog=$('exportProgress'),status=$('progressStatus'),fill=$('progressFill'),pct=$('progressPct');prog.classList.remove('hidden');status.textContent='Encoding animation…';fill.style.width='0%';pct.textContent='0%';
 try{const worker=new Worker('./src/gif-worker.js');exportWorker=worker;let index=0;
  worker.onmessage=e=>{
   if(worker!==exportWorker)return;
   const msg=e.data;
   if(msg.type==='ready'){const frame=createFrameBuffer(bufferCanvas,frameCtx,index,total,mode);worker.postMessage({type:'frame',buffer:frame},[frame]);}
   else if(msg.type==='progress'){
    index=msg.done;const progress=Math.round(index/total*100);fill.style.width=progress+'%';pct.textContent=progress+'%';status.textContent=`Rendering frame ${index} of ${total}`;
    if(index>=total){worker.postMessage({type:'finish'});return;}
    // Yield to the main thread so the UI can repaint and the Cancel button remains responsive.
    requestAnimationFrame(()=>{if(worker!==exportWorker)return;const frame=createFrameBuffer(bufferCanvas,frameCtx,index,total,mode);worker.postMessage({type:'frame',buffer:frame},[frame]);});
   }else if(msg.type==='complete'){exportBlob=msg.blob;exportUrl=URL.createObjectURL(exportBlob);$('gifPreview').src=exportUrl;$('exportSize').textContent=`${width} × ${height} · ${msg.frames} frames · ${formatSize(msg.size)}`;
    $('exportPreview').classList.remove('hidden');$('downloadGif').classList.remove('hidden');if(navigator.share&&navigator.canShare&&navigator.canShare({files:[new File([exportBlob],'raymosaic.gif',{type:'image/gif'})]}))$('nativeShare').classList.remove('hidden');
    status.textContent='Animated GIF created';fill.style.width='100%';pct.textContent='100%';worker.terminate();exportWorker=null;exporting=false;$('startExport').disabled=false;$('startExport').textContent='Create another GIF ↗';
   }else if(msg.type==='error'){toast(`GIF error: ${msg.message}`);cancelGif();}
  };worker.onerror=e=>{toast(`GIF encoding error: ${e.message}`);cancelGif();};worker.postMessage({type:'init',width,height,fps,total});
 }catch(e){toast(`Export unavailable: ${e.message}`);cancelGif();}
});
$('downloadGif').addEventListener('click',()=>{if(exportBlob)download(exportBlob,'raymosaic.gif');});
$('nativeShare').addEventListener('click',async()=>{if(!exportBlob)return;try{await navigator.share({files:[new File([exportBlob],'raymosaic.gif',{type:'image/gif'})],title:'RAYMOSAIC',text:'I made this with simulated reflected light.'});}catch(e){if(e.name!=='AbortError')toast('Direct sharing unavailable. Please download the GIF instead.');}});