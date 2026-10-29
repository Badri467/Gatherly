import test from 'node:test';import assert from 'node:assert/strict';
import {selectProvider} from './backend/provider.mjs';
test('Gemini key enables Gemini when the provider is missing or blank',()=>{for(const AI_PROVIDER of [undefined,'','  '])assert.equal(selectProvider({AI_PROVIDER,GEMINI_API_KEY:'test-key'}),'gemini');assert.equal(selectProvider({}),'demo');});
test('explicit provider remains authoritative and is normalized',()=>{assert.equal(selectProvider({AI_PROVIDER:' GEMINI '}),'gemini');assert.equal(selectProvider({AI_PROVIDER:'demo',GEMINI_API_KEY:'test-key'}),'demo');assert.equal(selectProvider({AI_PROVIDER:'ollama'}),'ollama');assert.throws(()=>selectProvider({AI_PROVIDER:'unknown'}),/AI_PROVIDER/);});
