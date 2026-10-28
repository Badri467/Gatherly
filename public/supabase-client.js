// Same-origin Node API client. Supabase credentials and database calls stay on the server.
export class SupabaseClient {
 constructor(_url,_key,fetcher=fetch){this.fetcher=fetcher.bind(globalThis);this.session=null;this.refreshing=null;}
 async request(path,{method='GET',body,auth=true}={}){if(auth)await this.refresh();const r=await this.fetcher(path,{method,headers:{'Content-Type':'application/json',...(auth&&this.session?{Authorization:'Bearer '+this.session.access_token}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})});const data=await r.json().catch(()=>null);if(!r.ok)throw Error(data?.error||'Request failed ('+r.status+').');return data;}
 setSession(s){this.session=s?.access_token?{...s,expires_at:s.expires_at||Math.floor(Date.now()/1000)+(s.expires_in||3600)}:null;}
 async refresh(){if(!this.session)throw Error('Sign in to continue.');if(this.session.expires_at>Date.now()/1000+60)return;if(!this.refreshing)this.refreshing=this.request('/api/auth/refresh',{method:'POST',auth:false,body:{refresh_token:this.session.refresh_token}}).then(s=>this.setSession(s)).finally(()=>this.refreshing=null);await this.refreshing;}
 async login(email,password){const s=await this.request('/api/auth/login',{method:'POST',auth:false,body:{email,password}});this.setSession(s);return s;}
 signup(email,password){return this.request('/api/auth/register',{method:'POST',auth:false,body:{email,password}});}
 user(){return this.request('/api/auth/me');}
 async logout(){await this.request('/api/auth/logout',{method:'POST'});this.session=null;}
 list(){return this.request('/api/events');}
 store(event,previous){return this.request('/api/events/'+encodeURIComponent(event.id),{method:'PUT',body:{event,...(previous?{version:previous.updated_at}:{})}});}
 remove(id,previous){return this.request('/api/events/'+encodeURIComponent(id),{method:'DELETE',body:{version:previous.updated_at}});}
}
