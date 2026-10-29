export function runtimeSettings(env=process.env){
 const hosted=env.RENDER==='true'||env.NODE_ENV==='production';
 const host=hosted?'0.0.0.0':env.HOST||'127.0.0.1';
 const port=env.PORT===undefined?3000:Number(env.PORT);
 if(!Number.isInteger(port)||port<0||port>65535)throw Error('PORT must be a number between 0 and 65535.');
 return {host,port,publicServer:hosted||!['127.0.0.1','localhost','::1'].includes(host)};
}
