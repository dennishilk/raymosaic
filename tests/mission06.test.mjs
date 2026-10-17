import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMessageScenes,messageLength,opticalCapacity,exportSequencePlan,sequenceFrame} from '../src/message-sequence.mjs';
import {createArray,aimMirrors,projectMirror,WALL,wallPoint} from '../src/optics.mjs';
import {orientDrawingTargets} from '../src/targets.js';
import {validateProject,parseProject,projectFile,makeShareHash,projectFromHash} from '../src/project-state.js';

const sample='Seit du in meinem Leben bist, ist alles ein bisschen heller geworden. Ich liebe dich von ganzem Herzen, mein Schatz Katharina. ❤️ '+('Und jeder Tag mit dir ist besonders schön. ');
test('long German text, accents, punctuation, newlines and emoji are never truncated',()=>{
 const input=sample+'\nÄpfel, Grüße! →';
 assert.ok(messageLength(input)>=150);
 for(const count of [448,666]){
  const scenes=buildMessageScenes(input,opticalCapacity(count));
  assert.ok(scenes.length>4);assert.ok(scenes.every(x=>messageLength(x)<=opticalCapacity(count)));
  assert.ok(scenes.join(' ').includes('Katharina.'));
  assert.ok(scenes.join(' ').includes('Grüße!'));
  assert.ok(scenes.at(-1).includes('→'));
  assert.ok(scenes.join(' ').includes('❤️'));
 }
 assert.deepEqual(buildMessageScenes('HELLO',13),['HELLO']);
 assert.deepEqual(buildMessageScenes('NEBU KATZ',13),['NEBU KATZ']);
 assert.throws(()=>buildMessageScenes('A'.repeat(401),13),/length/);
});
test('666 individually solved mirrors and 448 originals reach a real wall',()=>{
 for(const [nx,nz] of [[28,16],[37,18]]){
  const base=createArray(nx,nz);assert.equal(base.length,nx*nz);
  assert.equal(new Set(base.map(m=>m.id)).size,nx*nz);
  const uv=orientDrawingTargets(Array.from({length:base.length},()=>[.45,.49]),true);
  const actual=aimMirrors(base,[-4.7,6.8,3.8],uv);
  const valid=actual.filter(x=>x.valid);assert.ok(valid.length>100,'must have useful live reflections');
  for(const facet of valid.slice(0,30)){
   const hit=projectMirror([-4.7,6.8,3.8],facet.center,facet.normal,WALL.x).center;
   const target=wallPoint(.55,.49);
   for(let axis=0;axis<3;axis++)assert.ok(Math.abs(hit[axis]-target[axis])<1e-6);
  }
 }
});
test('complete message is distributed across real GIF frame segments and automatically extended',()=>{
 const scenes=buildMessageScenes(sample,15);assert.ok(scenes.length>1);
 const plan=exportSequencePlan(scenes.length,3,'compact');
 assert.equal(plan.adjusted,true);assert.ok(plan.seconds>3);assert.ok(plan.total>30);
 const touched=new Set(),held=new Set();
 for(let i=0;i<plan.total;i++){const state=sequenceFrame(i,plan.total,scenes.length);touched.add(state.index);if(state.hold)held.add(state.index);}
 assert.equal(touched.size,scenes.length);assert.equal(held.size,scenes.length);
 const old=exportSequencePlan(1,3,'compact');assert.equal(old.total,30);assert.equal(old.adjusted,false);
});
const baseProject={format:'raymosaic',version:1,kind:'text',text:'LUNA',drawing:'',light:[-4.7,6.8,3.8],aimLight:[-4.7,6.8,3.8],camera:{yaw:.36,pitch:.46,distance:22,target:[1,2,0]},ice:false,rays:false};
test('old v1 project and original share hash stay compatible',async()=>{
 const legacy=validateProject(baseProject);assert.equal(legacy.mirrorCount,448);assert.equal(legacy.mirrorText,false);assert.equal(legacy.sceneIndex,0);
 const hash=await makeShareHash(baseProject);
 assert.equal((await projectFromHash(hash)).text,'LUNA');
});
test('long 666 project file and compressed share hash retain full message',async()=>{
 const project={...baseProject,mirrorCount:666,mirrorText:true,mirrorDrawing:true,sceneIndex:4,text:sample,normals:Array.from({length:666},()=>[0,1,0])};
 const roundtrip=parseProject(await projectFile(project).text());
 assert.equal(roundtrip.text,sample);assert.equal(roundtrip.normals.length,666);assert.equal(roundtrip.sceneIndex,4);
 const hash=await makeShareHash(project),linked=await projectFromHash(hash);
 assert.equal(linked.text,sample);assert.equal(linked.mirrorCount,666);assert.equal(linked.mirrorText,true);assert.equal(linked.sceneIndex,4);
 assert.ok(hash.length<=1850);
});
