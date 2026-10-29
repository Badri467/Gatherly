import {selectProvider} from './provider.mjs';
import {createLimiter} from '../cloud-security.mjs';
export const supabaseUrl=(process.env.SUPABASE_URL||'').replace(/\/$/,'');
export const supabaseKey=process.env.SUPABASE_PUBLISHABLE_KEY||'';
if(supabaseKey.startsWith('sb_secret_'))throw Error('Use the Supabase publishable key, never a secret key.');
if(supabaseKey.startsWith('eyJ')){try{if(JSON.parse(Buffer.from(supabaseKey.split('.')[1],'base64url')).role==='service_role')throw Error('Service role keys are not allowed. Use a publishable key.');}catch(e){if(e.message.includes('Service role'))throw e;}}
if(supabaseUrl&&!/^https:\/\/[a-z0-9.-]+(?::[0-9]+)?$/.test(supabaseUrl))throw Error('SUPABASE_URL must be your HTTPS project URL without a path.');
export const cloudConfigured=Boolean(supabaseUrl&&supabaseKey);
export const aiLimit=createLimiter({limit:Number(process.env.AI_REQUESTS_PER_HOUR)||20});
export const totalLimit=createLimiter({limit:Number(process.env.AI_TOTAL_REQUESTS_PER_HOUR)||200});
export const provider=selectProvider();
