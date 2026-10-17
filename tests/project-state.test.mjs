import test from 'node:test';
import assert from 'node:assert/strict';
import {validateProject,makeShareHash,projectFromHash,projectFile,parseProject,saveLocal,loadLocal} from '../src/project-state.js';
const p={format:'raymosaic',version:1,kind:'text',text:'LUNA',drawing:'',light:[-4.7,6.8,3.8],aimLight:[-4.7,6.8,3.8],camera:{yaw:.36,pitch:.46,distance:22,target:[1.05,2.6,0]},ice:false,rays:false,normals:Array.from({length:448},()=>[0,1,0])};
test('project file preserves version and all 448 mirror normals',async()=>{const out=parseProject(await projectFile(p).text());assert.equal(out.version,1);assert.equal(out.normals.length,448);assert.deepEqual(out.light,p.light);});
test('short text becomes a compressed, recoverable link',async()=>{const hash=await makeShareHash(p);assert.match(hash,/^#p=v1\./);assert.ok(hash.length<1850);const copy=await projectFromHash(hash);assert.equal(copy.text,'LUNA');assert.equal(copy.normals,undefined);assert.deepEqual(copy.aimLight,p.aimLight);});
test('rejects invalid input and future versions',()=>{assert.throws(()=>validateProject({...p,version:2}));assert.throws(()=>validateProject({...p,light:[NaN,4,1]}));assert.throws(()=>validateProject({...p,normals:[]}));});
test('oversized link is rejected',async()=>{await assert.rejects(projectFromHash('#p=v1.'+'a'.repeat(1900)));});
test('local project can be stored and restored',()=>{const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};saveLocal(p);assert.equal(loadLocal().text,'LUNA');});
