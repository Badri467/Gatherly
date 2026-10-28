import {sendJson,readJson,fail} from '../middleware/http.mjs';
import {supabase} from '../services/supabase.mjs';
import {supabaseUrl,supabaseKey,cloudConfigured} from '../config.mjs';
import {createLimiter,verifiedUser} from '../../cloud-security.mjs';
import {validateEvent} from '../../planner.mjs';
const authLimit=createLimiter({limit:30,windowMs:15*60000});
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export async function cloudRoutes(req,res){const url=new URL(req.url,'http://localhost');const path=url.pathname;if(!path.startsWith('/api/auth/')&&path!=='/api/events'&&!path.startsWith('/api/events/'))return false;
 try{
 if(!cloudConfigured)throw fail(503,'Supabase is not configured on the server.');
 const token=req.headers.authorization;
 if(path.startsWith('/api/auth/')){
 if(!authLimit(req.socket.remoteAddress||'unknown'))throw fail(429,'Too many account requests. Please try again later.');
 if(req.method==='POST'&&['/api/auth/login','/api/auth/register'].includes(path)){const {email,password}=await readJson(req);if(typeof email!=='string'||email.length>254||!/^\S+@\S+\.\S+$/.test(email))throw fail(400,'Enter a valid email address.');if(typeof password!=='string'||password.length<8||password.length>128)throw fail(400,'Use a password from 8 to 128 characters.');const register=path.endsWith('/register');sendJson(res,200,await supabase(register?'/auth/v1/signup':'/auth/v1/token?grant_type=password',{method:'POST',body:{email:email.trim(),password}}));return true;}
 if(path==='/api/auth/refresh'&&req.method==='POST'){const {refresh_token}=await readJson(req);if(typeof refresh_token!=='string'||!refresh_token||refresh_token.length>4096)throw fail(400,'Invalid session refresh token.');sendJson(res,200,await supabase('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token}}));return true;}
 if(path==='/api/auth/me'&&req.method==='GET'){sendJson(res,200,await verifiedUser(req,{url:supabaseUrl,key:supabaseKey}));return true;}
 if(path==='/api/auth/logout'&&req.method==='POST'){await supabase('/auth/v1/logout',{method:'POST',token});sendJson(res,200,{ok:true});return true;}
 throw fail(405,'Method not allowed.');
 }
 let user;try{user=await verifiedUser(req,{url:supabaseUrl,key:supabaseKey});}catch{throw fail(401,'Sign in to access your events.');}
 if(path==='/api/events'&&req.method==='GET'){sendJson(res,200,await supabase('/rest/v1/events?select=id,data,updated_at&order=updated_at.desc',{token}));return true;}
 const id=path.split('/')[3];if(!uuid.test(id||''))throw fail(400,'Invalid event ID.');
 if(req.method==='PUT'){const {event,version}=await readJson(req,1000000);validateEvent(event);if(event.id!==id)throw fail(400,'Event ID does not match.');if(!event.plan||!Array.isArray(event.plan.budget)||!Array.isArray(event.plan.tasks)||!Array.isArray(event.plan.vendors)||!Array.isArray(event.plan.ideas))throw fail(400,'The event must include a complete plan.');const body={id,owner_id:user.id,data:event,updated_at:new Date().toISOString()};if(version!==undefined&&typeof version!=='string')throw fail(400,'Invalid event version.');const query=version?'?id=eq.'+id+'&updated_at=eq.'+encodeURIComponent(version):'';const records=await supabase('/rest/v1/events'+query,{method:version?'PATCH':'POST',token,body,headers:{Prefer:'return=representation'}});if(!records?.length)throw fail(409,'This event changed on another device. Review your backup and reload cloud plans.');sendJson(res,200,records[0]);return true;}
 if(req.method==='DELETE'){const {version}=await readJson(req);if(typeof version!=='string'||!version)throw fail(400,'An event version is required.');const records=await supabase('/rest/v1/events?id=eq.'+id+'&updated_at=eq.'+encodeURIComponent(version),{method:'DELETE',token,headers:{Prefer:'return=representation'}});if(!records?.length)throw fail(409,'This event changed on another device. Reload before deleting.');sendJson(res,200,{ok:true});return true;}
 throw fail(405,'Method not allowed.');
 }catch(e){sendJson(res,e.status||400,{error:e.message});}return true;
}
