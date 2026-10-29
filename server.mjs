import {createApp} from './backend/app.mjs';
import {runtimeSettings} from './backend/runtime.mjs';
const {host,port}=runtimeSettings();
const server=createApp();
server.listen(port,host,()=>console.log('Gatherly listening on http://'+host+':'+server.address().port));
server.requestTimeout=120000;
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{server.close(()=>process.exit(0));setTimeout(()=>process.exit(1),10000).unref();});
