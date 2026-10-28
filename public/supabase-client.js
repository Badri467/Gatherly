// Supabase REST transport: publishable key + user JWT; row policies enforce ownership.
export class SupabaseClient {
 constructor(url,key,fetcher=fetch){this.url=url.replace(/\/$/,'');this.key=key;this.fetcher=fetcher;this.session=null;this.refreshing=null;}
 async request(path,{method='GET',body,headers={},auth=true}={}){if(auth)await this.refresh();const r=await this.fetcher(this.url+path,{method,headers:{apikey:this.key,'Content-Type':'application/json',...(auth&&this.session?{Authorization:'Bearer '+this.session.access_token}:{}),...headers},...(body!==undefined?{body:JSON.stringify(body)}:{})});const data=await r.json().catch(()=>null);if(!r.ok)throw Error(data?.msg||data?.error_description||data?.message||data?.error||'Cloud request failed ('+r.status+').');return data;}
 setSession(s){this.session=s?.access_token?{...s,expires_at:s.expires_at||Math.floor(Date.now()/1000)+(s.expires_in||3600)}:null;}
 async refresh(){if(!this.session)throw Error('Sign in to continue.');if(this.session.expires_at>Date.now()/1000+60)return;if(!this.refreshing)this.refreshing=this.request('/auth/v1/token?grant_type=refresh_token',{method:'POST',auth:false,body:{refresh_token:this.session.refresh_token}}).then(s=>this.setSession(s)).finally(()=>this.refreshing=null);await this.refreshing;}
 async login(email,password){const s=await this.request('/auth/v1/token?grant_type=password',{method:'POST',auth:false,body:{email,password}});this.setSession(s);return s;}
 signup(email,password){return this.request('/auth/v1/signup',{method:'POST',auth:false,body:{email,password}});}
 async user(){return this.request('/auth/v1/user');}
 async logout(){await this.request('/auth/v1/logout',{method:'POST'});this.session=null;}
 list(){return this.request('/rest/v1/events?select=id,data,updated_at&order=updated_at.desc');}
 async store(event,previous){const body={id:event.id,owner_id:this.session.user.id,data:event,updated_at:new Date().toISOString()};if(!previous)return (await this.request('/rest/v1/events',{method:'POST',body,headers:{Prefer:'return=representation'}}))[0];const rows=await this.request('/rest/v1/events?id=eq.'+encodeURIComponent(event.id)+'&updated_at=eq.'+encodeURIComponent(previous.updated_at),{method:'PATCH',body,headers:{Prefer:'return=representation'}});if(!rows.length)throw Error('This event changed on another device. Your edits are backed up here. Sign out and sign in to reload before retrying.');return rows[0];}
 async remove(id,previous){const rows=await this.request('/rest/v1/events?id=eq.'+encodeURIComponent(id)+'&updated_at=eq.'+encodeURIComponent(previous.updated_at),{method:'DELETE',headers:{Prefer:'return=representation'}});if(!rows.length)throw Error('This event changed on another device. Reload your cloud plans before deleting.');}
}
