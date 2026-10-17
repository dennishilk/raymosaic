import test from 'node:test';
import assert from 'node:assert/strict';
import {createMirrorArray,mirrorModeLabel,MIRROR_COUNTS} from '../src/mirror-modes.mjs';
import {projectionBounds,projectionFraming,exportCamera} from '../src/export-framing.mjs';
import {DEFAULT_LIGHT,aimMirrors,projectMirror,WALL,withinWall} from '../src/optics.mjs';
import {validateProject,projectFile,parseProject,makeShareHash,projectFromHash} from '../src/project-state.js';
import {opticalCapacity,buildMessageScenes} from '../src/message-sequence.mjs';
import {orientDrawingTargets} from '../src/targets.js';

const base={format:'raymosaic',version:1,kind:'text',text:'OVERDRIVE',drawing:'',light:[...DEFAULT_LIGHT],aimLight:[...DEFAULT_LIGHT],camera:{yaw:.36,pitch:.46,distance:22,target:[1.05,2.6,0]},ice:false,rays:false};
test('exactly three official density choices and physically unique facets',()=>{
 assert.deepEqual(MIRROR_COUNTS,[448,666,1337]);
 for(const count of MIRROR_COUNTS){
  const mirrors=createMirrorArray(count);
  assert.equal(mirrors.length,count);
  assert.equal(new Set(mirrors.map(m=>m.id)).size,count);
  assert.equal(new Set(mirrors.map(m=>m.center.join(','))).size,count);
  assert.deepEqual(mirrors.map(m=>m.id),Array.from({length:count},(_,i)=>i));
  assert.ok(mirrors.every(m=>m.size>0&&Number.isFinite(m.center[2])));
 }
 assert.equal(createMirrorArray(1337).length,51*27-40);
 assert.match(mirrorModeLabel(666,'de'),/DOOM of Love/);
 assert.match(mirrorModeLabel(1337,'en'),/OVERDRIVE/);
 assert.throws(()=>createMirrorArray(1024));
});
test('448, 666 and 1337 normal solvers preserve forward optical physics for asymmetric targets',()=>{
 for(const count of MIRROR_COUNTS){
  const baseMirrors=createMirrorArray(count);
  const targets=orientDrawingTargets(baseMirrors.map((m,i)=>[.2+.6*(i%11)/10,.24+.52*((i*17)%13)/12]),true);
  const result=aimMirrors(baseMirrors,DEFAULT_LIGHT,targets);
  const good=result.filter(m=>m.valid);
  assert.ok(good.length>count*.35, 'meaningful independently aimed coverage '+count);
  let verified=0;
  for(const m of good){
   const hit=projectMirror(DEFAULT_LIGHT,m.center,m.normal,WALL.x).center;
   if(!withinWall(hit))continue;
   for(const axis of [0,1,2])assert.ok(Math.abs(hit[axis]-m.goal[axis])<1e-6);
   verified++;
  }
  assert.ok(verified>count*.3);
 }
});
test('projection framing uses forward hits and a single coherent geometry transform across scenes',()=>{
 const facets=createMirrorArray(666);
 const first=aimMirrors(facets,DEFAULT_LIGHT,facets.map((_,i)=>[.25+.45*(i%9)/8,.2+.5*(i%7)/6]));
 const last=aimMirrors(facets,DEFAULT_LIGHT,facets.map((_,i)=>[.15+.65*(i%7)/6,.3+.35*(i%11)/10]));
 const bounds=projectionBounds([first,last],DEFAULT_LIGHT);
 assert.ok(bounds.hits>800);
 assert.ok(bounds.minZ<bounds.maxZ&&bounds.minY<bounds.maxY);
 for(const [w,h] of [[320,320],[180,320],[320,180]]){
  const frame=projectionFraming(bounds,w,h);
  assert.ok(Number.isFinite(frame.scale)&&frame.scale>0);
  // All accepted ray hits fit inside the clean illuminated image area.
  for(const m of [...first,...last]){
   if(!m.valid)continue;
   const hit=projectMirror(DEFAULT_LIGHT,m.center,m.normal,WALL.x).center;
   if(!withinWall(hit))continue;
   const sx=frame.centerX+(hit[2]-frame.centerZ)*frame.scale;
   const sy=frame.screenY-(hit[1]-frame.centerY)*frame.scale;
   assert.ok(sx>w*.08&&sx<w*.92,'glow margin x');
   assert.ok(sy>h*.08&&sy<h*.82,'glow and signature margin y');
  }
  const camera=exportCamera(bounds,w,h,{yaw:.36,pitch:.46,distance:22,target:[1,2,0]});
  assert.ok(camera.distance<22&&camera.focalScale>.69);
 }
});
test('v1 legacy projects default to visible labels, new 1337 project and link roundtrip',async()=>{
 const old=validateProject(base);assert.equal(old.mirrorCount,448);assert.equal(old.showLabels,true);
 const novel={...base,mirrorCount:1337,showLabels:false,text:'LOVE YOU FOREVER ❤️',mirrorText:true,normals:createMirrorArray(1337).map(()=>[0,1,0])};
 const parsed=parseProject(await projectFile(novel).text());
 assert.equal(parsed.mirrorCount,1337);assert.equal(parsed.showLabels,false);assert.equal(parsed.normals.length,1337);
 const hash=await makeShareHash(novel),loaded=await projectFromHash(hash);
 assert.equal(loaded.mirrorCount,1337);assert.equal(loaded.showLabels,false);assert.equal(loaded.text,novel.text);
 assert.equal(opticalCapacity(1337),17);
 assert.ok(buildMessageScenes('ICH LIEBE DICH MEIN SCHATZ KATHARINA',17).length>1);
});
