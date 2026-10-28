import test from 'node:test';
import assert from 'node:assert/strict';
process.env.SUPABASE_URL='https://backend-test.supabase.co';process.env.SUPABASE_PUBLISHABLE_KEY='sb_publishable_test';process.env.AI_PROVIDER='demo';
const {createApp}=await import('./backend/app.mjs');
test('Node API handles auth, enforces ownership and version conflicts, and hides connection keys',async()=>{const original=globalThis.fetch;const upstream=[];globalThis.fetch=async(url,options={})=>{if(!String(url).startsWith(process.env.SUPABASE_URL))return original(url,options);upstream.push({url,options});if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'verified-owner'});if(String(url).includes('/auth/v1/token'))return Response.json({access_token:'test.token',user:{id:'verified-owner'}});if(options.method==='PATCH')return Response.json([]);if(options.method==='POST')return Response.json([JSON.parse(options.body)]);return Response.json([]);};const server=createApp();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;const id='12345678-1234-1234-1234-123456789abc';const headers={'Content-Type':'application/json',Authorization:'Bearer valid.token'};try{
let r=await original(base+'/api/config');const config=await r.json();assert.equal(config.cloudEnabled,true);assert.equal(config.supabaseKey,undefined);
r=await original(base+'/api/events');assert.equal(r.status,401);
r=await original(base+'/api/auth/login',{method:'POST',headers,body:JSON.stringify({email:'invalid',password:'short'})});assert.equal(r.status,400);
r=await original(base+'/api/auth/login',{method:'POST',headers,body:JSON.stringify({email:'demo@example.com',password:'password123'})});assert.equal(r.status,200);
const event={id,name:'Demo',type:'Community',date:'2027-01-01',budget:5000,guests:20,currency:'INR',plan:{budget:[],tasks:[],vendors:[],ideas:[]}};
r=await original(base+'/api/events/'+id,{method:'PUT',headers,body:JSON.stringify({event,owner_id:'forged-owner'})});assert.equal(r.status,200);assert.equal((await r.json()).owner_id,'verified-owner');assert.equal(upstream.at(-1).options.headers.Authorization,'Bearer valid.token');
r=await original(base+'/api/events/'+id,{method:'PUT',headers,body:JSON.stringify({event,version:'old-version'})});assert.equal(r.status,409);
r=await original(base+'/api/events/'+id,{method:'DELETE',headers,body:'{}'});assert.equal(r.status,400);
r=await original(base+'/api/events/'+id,{method:'PUT',headers,body:'not json'});assert.equal(r.status,400);
}finally{globalThis.fetch=original;await new Promise(r=>server.close(r));}});
