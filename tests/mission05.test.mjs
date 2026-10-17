import test from 'node:test';
import assert from 'node:assert/strict';
import {orientDrawingTargets} from '../src/targets.js';
import {createArray,aimMirrors,projectMirror,wallPoint,WALL} from '../src/optics.mjs';
import {publicPageUrl,shareServiceUrl,mastodonShareUrl} from '../src/public-share.js';
import {validateProject,makeShareHash,projectFromHash,parseProject,projectFile} from '../src/project-state.js';

const base={format:'raymosaic',version:1,kind:'draw',text:'',drawing:'A'.repeat(4800),light:[-4.7,6.8,3.8],aimLight:[-4.7,6.8,3.8],camera:{yaw:.36,pitch:.46,distance:22,target:[1.05,2.6,0]},ice:false,rays:false};
const old={...base,kind:'text',text:'LUNA',drawing:''};
test('asymmetric arrow and letters are corrected exactly once without mutating input',()=>{
 const arrow=[[.1,.3],[.3,.3],[.7,.65],[.9,.3]],copy=arrow.map(p=>[...p]);
 const corrected=orientDrawingTargets(arrow,true);
 for(let i=0;i<arrow.length;i++){assert.ok(Math.abs(corrected[i][0]-(1-arrow[i][0]))<1e-12);assert.equal(corrected[i][1],arrow[i][1]);}
 assert.deepEqual(arrow,copy);
 assert.deepEqual(orientDrawingTargets(arrow,false),arrow);
 const letters=[[.17,.4],[.82,.4],[.28,.7]];
 const twice=orientDrawingTargets(orientDrawingTargets(letters,true),true);for(let i=0;i<letters.length;i++)for(let k=0;k<2;k++)assert.ok(Math.abs(twice[i][k]-letters[i][k])<1e-12);
});
test('asymmetric corrected target remains optically consistent in forward reflection',()=>{
 const facets=createArray();
 for(const correction of [false,true]){
   const uv=orientDrawingTargets([[.23,.41]],correction)[0];
   const aimed=aimMirrors(facets,[-4.7,6.8,3.8],facets.map(()=>uv)).find(m=>m.valid);
   assert.ok(aimed,'at least one mirror must reach the asymmetric target');
   const hit=projectMirror([-4.7,6.8,3.8],aimed.center,aimed.normal,WALL.x).center;
   assert.ok(hit);
   const goal=wallPoint(...uv);
   for(let i=0;i<3;i++)assert.ok(Math.abs(hit[i]-goal[i])<1e-6);
 }
});
test('old projects stay unmirrored; new projects retain orientation in file and share hash',async()=>{
 const previous=validateProject(old);assert.equal(previous.mirrorDrawing,false);
 const fresh={...old,mirrorDrawing:true};
 assert.equal(parseProject(await projectFile(fresh).text()).mirrorDrawing,true);
 const hash=await makeShareHash(fresh);
 assert.equal((await projectFromHash(hash)).mirrorDrawing,true);
});
test('public links never include user message, fragment or personal data',()=>{
 for(const lang of ['en','de']){
   const url=publicPageUrl(lang);
   assert.ok(url.startsWith('https://www.dennishilk.com/'));
   assert.ok(!url.includes('#')&&!url.includes('?'));
   for(const service of ['whatsapp','facebook','x','email']){
     const share=decodeURIComponent(shareServiceUrl(service,lang));
     assert.ok(share.includes(url));assert.ok(!share.includes('LUNA_PRIVATE_SECRET'));
   }
 }
});
test('Mastodon redirects only to a valid explicitly selected instance',()=>{
 assert.match(mastodonShareUrl('social.dennishilk.com','de'),/^https:\/\/social\.dennishilk\.com\/share\?text=/);
 for(const invalid of ['https://evil.com','evil.com/redirect','foo@evil.com','localhost','foo.example:444','evil.com?u=x','abc..xyz'])assert.throws(()=>mastodonShareUrl(invalid,'en'));
});
