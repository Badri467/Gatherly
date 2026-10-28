export const fail=(status,message)=>Object.assign(new Error(message),{status});
export function sendJson(res,status,data){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
export async function readJson(req,max=100000){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>max)throw fail(413,'Request is too large.');chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw fail(400,'Enter a valid JSON request.');}}
