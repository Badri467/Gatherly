import {createApp} from './backend/app.mjs';
const port=Number(process.env.PORT)||3000;
const server=createApp();
server.listen(port,process.env.HOST||'127.0.0.1',()=>console.log('Gatherly running on port '+port));
server.requestTimeout=120000;
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{server.close(()=>process.exit(0));setTimeout(()=>process.exit(1),10000).unref();});
