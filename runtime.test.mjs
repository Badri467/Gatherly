import test from 'node:test';
import assert from 'node:assert/strict';
import {runtimeSettings} from './backend/runtime.mjs';
test('Render binds to all interfaces even without HOST or with a stale localhost HOST',()=>{for(const HOST of [undefined,'127.0.0.1'])assert.deepEqual(runtimeSettings({RENDER:'true',PORT:'10000',HOST}),{host:'0.0.0.0',port:10000,publicServer:true});});
test('local development stays local and production is publicly reachable',()=>{assert.equal(runtimeSettings({}).host,'127.0.0.1');assert.equal(runtimeSettings({NODE_ENV:'production'}).host,'0.0.0.0');assert.throws(()=>runtimeSettings({PORT:'bad'}),/PORT/);});
