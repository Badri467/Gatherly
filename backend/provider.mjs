export function selectProvider(env=process.env){
 const requested=(env.AI_PROVIDER||'').trim().toLowerCase();
 const provider=requested||(env.GEMINI_API_KEY?.trim()?'gemini':'demo');
 if(!['demo','gemini','ollama'].includes(provider))throw Error('AI_PROVIDER must be demo, gemini, or ollama.');
 return provider;
}
