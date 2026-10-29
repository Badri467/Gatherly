import {runtimeSettings} from './runtime.mjs';
import {plannerRoutes} from './routes/planner.mjs';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {verifiedUser} from '../cloud-security.mjs';
import {supabaseUrl,supabaseKey,cloudConfigured,aiLimit,totalLimit,provider} from './config.mjs';
import {cloudRoutes} from './routes/cloud.mjs';
import {sendJson} from './middleware/http.mjs';
export function createApp(){return http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');if(req.url?.startsWith('/api/'))res.setHeader('Cache-Control','no-store');
 const json=(code,data)=>sendJson(res,code,data);
 try {
 if(await cloudRoutes(req,res))return;
 if(req.url==='/api/config'&&req.method==='GET')return json(200,{cloudEnabled:cloudConfigured});
 if(req.method==='POST'&&['/api/plan','/api/chat','/api/import'].includes(req.url)&&(provider!=='demo'||req.url==='/api/import')){
 if(cloudConfigured){let user;try{user=await verifiedUser(req,{url:supabaseUrl,key:supabaseKey});}catch(e){return json(401,{error:e.message});}if(!aiLimit(user.id)||!totalLimit('all'))return json(429,{error:'AI usage limit reached. Please try again in an hour.'});}
 else if(runtimeSettings().publicServer)return json(503,{error:'Configure Supabase authentication before using public AI endpoints.'});
 }
 if(req.url==='/api/health')return json(200,{ok:true,provider,model:provider==='ollama'?(process.env.OLLAMA_MODEL||'gemma3:4b'):provider==='gemini'?(process.env.GEMINI_MODEL||'gemini-3.1-flash-lite'):'Rule-based demo',imports:Boolean(process.env.GEMINI_API_KEY)});
 if(await plannerRoutes(req,res))return;
 if(req.method!=='GET')return json(405,{error:'Method not allowed.'});
 const files={'/':'index.html','/app.js':'app.js','/enhancements.js':'enhancements.js','/style.css':'style.css','/studio.css':'studio.css','/import.css':'import.css','/import-ui.js':'import-ui.js','/exports.js':'exports.js','/event-tools.js':'event-tools.js','/event-features.js':'event-features.js','/features.css':'features.css','/cloud.js':'cloud.js','/supabase-client.js':'supabase-client.js','/home.js':'home.js','/polish.js':'polish.js','/polish.css':'polish.css','/validation.js':'validation.js'};const file=files[req.url?.split('?')[0]];if(!file)return json(404,{error:'Not found'});
 res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html','X-Content-Type-Options':'nosniff'});res.end(await readFile(fileURLToPath(new URL('../public/'+file,import.meta.url))));
 }catch(error){json(error.status||400,{error:error.name==='TimeoutError'?'The request timed out. Please try again.':error.message});}
});}
