import assert from "node:assert/strict";
import {clamp,eyeCenters,shiftEyes} from "./core.mjs";
assert.equal(clamp(-2,0,1),0);
assert.equal(clamp(3,0,1),1);
assert.deepEqual(eyeCenters(100,50,[[.2,.4]]),[{x:20,y:20}]);
const w=100,h=50,src=new Uint8ClampedArray(w*h*4);
for(let y=0;y<h;y++)for(let x=0;x<w;x++){let i=(y*w+x)*4;src[i]=x*2;src[i+1]=y*4;src[i+3]=255;}
const points=[[.3,.5],[.7,.5]];
const zero=shiftEyes(src,w,h,points,.2,0,0);
assert.deepEqual(zero,src);
const changed=shiftEyes(src,w,h,points,.2,.5,0);
assert.notDeepEqual(changed,src);
assert.equal(changed[0],src[0]);
assert.equal(changed[(25*w+50)*4],src[(25*w+50)*4]);
assert.ok(changed[(25*w+30)*4]<src[(25*w+30)*4]);
const vertical=shiftEyes(src,w,h,points,.2,0,.5);
assert.ok(vertical[(25*w+30)*4+1]<src[(25*w+30)*4+1]);
assert.throws(()=>shiftEyes(new Uint8ClampedArray(4),100,50,points,.2,0,0));
console.log("9 kontrol geçti");
