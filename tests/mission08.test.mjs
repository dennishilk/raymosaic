import test from 'node:test';
import assert from 'node:assert/strict';
import {aimMirrors,DEFAULT_LIGHT,projectMirror,WALL,withinWall} from '../src/optics.mjs';
import {createMirrorArray} from '../src/mirror-modes.mjs';
import {projectionBounds,projectionFraming,exportCamera} from '../src/export-framing.mjs';
import {renderExportFrame} from '../src/export-renderer.js';

function fixture(count=666){
 const facets=createMirrorArray(count);
 const mirrors=aimMirrors(facets,DEFAULT_LIGHT,facets.map((_,i)=>[.43+.12*(i%9)/8,.43+.14*(i%7)/6]));
 // The forward pass must ignore even deliberately incorrect target metadata.
 for(const m of mirrors)m.goal=[NaN,NaN,NaN];
 return mirrors;
}
test('framing tightly fits actual forward hits for small motifs, all formats and both signature settings',()=>{
 for(const count of [448,666,1337]){
  const mirrors=fixture(count),bounds=projectionBounds([mirrors],DEFAULT_LIGHT);
  assert.ok(bounds.hits>count*.9);
  for(const [w,h] of [[320,320],[180,320],[320,180]])for(const signature of [false,true]){
   const frame=projectionFraming(bounds,w,h,signature),glow=frame.glowLimit*2.1;
   const extentX=(bounds.maxZ-bounds.minZ)*frame.scale;
   const extentY=(bounds.maxY-bounds.minY)*frame.scale;
   assert.ok(extentX>w*.75||extentY>h*.70,'no arbitrary camera or zoom cap keeps a small motif distant');
   for(const mirror of mirrors){
    const hit=projectMirror(DEFAULT_LIGHT,mirror.center,mirror.normal,WALL.x).center;
    if(!withinWall(hit))continue;
    const x=frame.centerX+(hit[2]-frame.centerZ)*frame.scale,y=frame.screenY-(hit[1]-frame.centerY)*frame.scale;
    assert.ok(x-glow>=-1e-6&&x+glow<=w+1e-6);
    assert.ok(y-glow>=-1e-6&&y+glow<=h+1e-6);
   }
  }
 }
});
test('projection export emits only forward light sprites on black, never apparatus paths or text',()=>{
 const mirrors=fixture(),bounds=projectionBounds([mirrors],DEFAULT_LIGHT);
 const calls=[];
 const ctx=new Proxy({}, {get:(target,key)=>key in target?target[key]:(...args)=>calls.push([key,...args])});
 const scene={camera:{yaw:.36,pitch:.46,distance:22,target:[1,2,0]},warm:{sprite:'gold'},cool:{sprite:'ice'}};
 const state={scenes:[mirrors],light:DEFAULT_LIGHT,ice:false,reverseView:true,framing:projectionFraming(bounds,320,320,false)};
 renderExportFrame(ctx,scene,state,20,30,'projection',false,320,320);
 assert.equal(ctx.fillStyle,'#000000');
 assert.ok(calls.filter(c=>c[0]==='drawImage').length>600);
 assert.ok(calls.every(c=>['clearRect','fillRect','save','restore','drawImage'].includes(c[0])),'no mirrors, wall, lamp, labels or typography');
 const original=calls.filter(c=>c[0]==='drawImage').map(c=>c.slice(2));calls.length=0;
 renderExportFrame(ctx,scene,{...state,light:[-2,6,3]},20,30,'projection',false,320,320);
 assert.notDeepEqual(calls.filter(c=>c[0]==='drawImage').map(c=>c.slice(2)),original,'moving the source must move real reflections');
 assert.throws(()=>renderExportFrame(ctx,scene,state,20,30,'typo',false,320,320),/Unknown export/);
});
test('one union of forward hits keeps long sequences at a fixed center and scale',()=>{
 const first=fixture(448),second=aimMirrors(createMirrorArray(448),DEFAULT_LIGHT,Array.from({length:448},(_,i)=>[.2+.6*(i%9)/8,.3+.3*(i%7)/6]));
 const bounds=projectionBounds([first,second],DEFAULT_LIGHT);
 const frame=projectionFraming(bounds,320,320,false);
 for(const scene of [first,second])for(const m of scene){
  const hit=projectMirror(DEFAULT_LIGHT,m.center,m.normal,WALL.x).center;if(!withinWall(hit))continue;
  assert.ok(Math.abs((hit[2]-frame.centerZ)*frame.scale)<160);
 }
 assert.ok(exportCamera(bounds,320,320,{yaw:.36,pitch:.46}).distance>15,'full scene retains its independent apparatus camera');
});
