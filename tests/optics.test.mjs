import assert from 'node:assert/strict';
import {test} from 'node:test';
import {reflect,intersectWall,solveNormal,unit,dot,sub,length,projectMirror,createArray,aimMirrors,wallPoint,WALL,withinWall,DEFAULT_LIGHT} from '../src/optics.mjs';
const near=(a,b,e=1e-7)=>assert.ok(Math.abs(a-b)<e,`${a} ≠ ${b}`);
const vectorNear=(a,b,e=1e-7)=>a.forEach((v,i)=>near(v,b[i],e));
test('specular reflection at an upward-facing mirror',()=>vectorNear(reflect([0,-1,0],[0,1,0]),[0,1,0]));
test('known 45 degree mirror normal',()=>vectorNear(reflect([1,0,0],unit([1,-1,0])),[0,1,0]));
test('intersection forward only',()=>{vectorNear(intersectWall([0,2,4],[1,0,0],8),[8,2,4]);assert.equal(intersectWall([0,0,0],[-1,0,0],8),null);assert.equal(intersectWall([0,0,0],[0,1,0],8),null);});
test('inverse bisector yields the requested independent forward projection',()=>{
 for(const target of [[8,2,-1],[8,6,3],[8,3,-3],[8,7,0]]){
  const light=[-4,8,5],origin=[0,0,0],s=solveNormal(light,origin,target);assert.ok(s,`solver failed for ${target}`);
  const result=projectMirror(light,origin,s.normal,8,.15);vectorNear(result.center,target,1e-6);
  const incoming=unit(sub(origin,light)),outgoing=unit(sub(target,origin));near(dot(reflect(incoming,s.normal),outgoing),1,1e-7);
 }
});
test('reject degenerate normals and impossible tilt',()=>{
 assert.equal(solveNormal([0,0,0],[0,0,0],[8,2,2]),null);
 assert.equal(solveNormal([1,2,0],[0,0,0],[-9,-8,0],20),null);
});
test('an asymmetric target is reconstructed from the geometry, not a texture',()=>{
 const a=createArray(9,7);const sample=a.map((m,i)=>[.15+(i%9)*.07,.2+((Math.floor(i/9)*5+i%3)%7)*.10]);const mirrors=aimMirrors(a,DEFAULT_LIGHT,sample);
 assert.equal(mirrors.length,63);let valid=0;
 for(let i=0;i<mirrors.length;i++){
  const m=mirrors[i];if(!m.valid)continue;valid++;
  const result=projectMirror(DEFAULT_LIGHT,m.center,m.normal,WALL.x,m.size);
  assert.ok(withinWall(result.center));vectorNear(result.center,wallPoint(...sample[i]),1e-6);
 }
 assert.ok(valid>55,`Only ${valid} valid mirrors`);
});