import {inflateRawSync} from 'node:zlib';
import {validateEvent,createPlan} from './planner.mjs';
const MAX=8*1024*1024;
const decode=s=>s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
// Read only bounded worksheet XML. Never execute formulas, macros, or external links.
export function spreadsheetText(buffer){
 let end=-1;for(let i=buffer.length-22;i>=Math.max(0,buffer.length-65557);i--)if(buffer.readUInt32LE(i)===0x06054b50){end=i;break;}
 if(end<0)throw Error('Invalid XLSX file. Try saving the spreadsheet as CSV.');
 const count=buffer.readUInt16LE(end+10);if(count>1000)throw Error('Workbook contains too many entries.');
 let pos=buffer.readUInt32LE(end+16),total=0;const files={};
 for(let i=0;i<count;i++){
 if(buffer.readUInt32LE(pos)!==0x02014b50)throw Error('Invalid XLSX directory.');
 const flags=buffer.readUInt16LE(pos+8),method=buffer.readUInt16LE(pos+10),size=buffer.readUInt32LE(pos+20),plain=buffer.readUInt32LE(pos+24),n=buffer.readUInt16LE(pos+28),extra=buffer.readUInt16LE(pos+30),comment=buffer.readUInt16LE(pos+32),off=buffer.readUInt32LE(pos+42),name=buffer.subarray(pos+46,pos+46+n).toString();pos+=46+n+extra+comment;
 if(!/^xl\/(sharedStrings\.xml|worksheets\/sheet\d+\.xml|workbook\.xml)$/.test(name))continue;
 if(flags&1)throw Error('Encrypted workbooks are not supported.');total+=plain;if(total>MAX)throw Error('Workbook expands beyond 8 MB. Export a smaller CSV.');
 if(buffer.readUInt32LE(off)!==0x04034b50)throw Error('Invalid XLSX entry.');const start=off+30+buffer.readUInt16LE(off+26)+buffer.readUInt16LE(off+28),data=buffer.subarray(start,start+size);
 const xml=method===0?data:method===8?inflateRawSync(data,{maxOutputLength:MAX}):null;if(!xml)throw Error('Unsupported workbook compression.');files[name]=xml.toString('utf8');
 }
 const strings=[...(files['xl/sharedStrings.xml']||'').matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map(x=>[...x[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(t=>decode(t[1])).join(''));
 const sheets=Object.entries(files).filter(([name])=>name.includes('/worksheets/'));if(!sheets.length)throw Error('No readable worksheets found.');if(sheets.length>12)throw Error('Import up to 12 worksheets at a time.');
 const text=sheets.map(([name,xml])=>name+'\n'+[...xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map(row=>[...row[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)].map(c=>{const v=c[2].match(/<v\b[^>]*>([\s\S]*?)<\/v>/)?.[1]||'';const value=/\bt="s"/.test(c[1])?strings[Number(v)]||'':/\bt="inlineStr"/.test(c[1])?[...c[2].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(t=>decode(t[1])).join(''):decode(v);return (c[1].match(/\br="([^"]+)"/)?.[1]||'')+': '+value;}).join(' | ')).join('\n')).join('\n\n');
 if(text.length>100000)throw Error('Workbook is too large. Import fewer rows (up to 100,000 text characters).');return text;
}
export function fileParts(file){
 if(!file||typeof file.name!=='string'||typeof file.data!=='string'||file.name.length>200)throw Error('Choose a supported file.');
 if(file.data.length>Math.ceil(MAX*4/3)+8||!/^[A-Za-z0-9+/]*={0,2}$/.test(file.data))throw Error('File must be valid and under 8 MB.');
 const bytes=Buffer.from(file.data,'base64');if(!bytes.length||bytes.length>MAX)throw Error('Choose a non-empty file under 8 MB.');const ext=file.name.split('.').at(-1).toLowerCase();
 if(ext==='xlsx')return [{text:'Spreadsheet values (Excel numeric dates may be serial dates, epoch 1899-12-30):\n'+spreadsheetText(bytes)}];
 if(['csv','tsv','txt'].includes(ext)){const text=bytes.toString('utf8');if(text.length>100000)throw Error('Text imports are limited to 100,000 characters.');return [{text:'Source document:\n'+text}];}
 const types={pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp'};const mimeType=types[ext];if(!mimeType)throw Error('Use XLSX, CSV, TSV, PDF, PNG, JPG, or WebP.');
 const valid=ext==='pdf'?bytes.subarray(0,5).toString()==='%PDF-':ext==='png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):['jpg','jpeg'].includes(ext)?bytes[0]===255&&bytes[1]===216:bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';if(!valid)throw Error('File contents do not match its extension.');
 return [{inlineData:{mimeType,data:file.data}}];
}
export const importSchema={type:'object',properties:{event:{type:'object',properties:{name:{type:'string'},type:{type:'string',enum:['Wedding','Birthday','Community']},date:{type:'string'},budget:{type:'number'},guests:{type:'integer'},currency:{type:'string',enum:['INR','USD','EUR','GBP']},location:{type:'string'},theme:{type:'string'}},required:['name','type','date','budget','guests','currency','location','theme']},budget:{type:'array',items:{type:'object',properties:{category:{type:'string'},allocated:{type:'number'},spent:{type:'number'}},required:['category','allocated','spent']}},tasks:{type:'array',items:{type:'object',properties:{title:{type:'string'},date:{type:'string'}},required:['title','date']}},assumptions:{type:'array',items:{type:'string'}},summary:{type:'string'}},required:['event','budget','tasks','assumptions','summary']};
export function normalizeImport(d){
 const e=validateEvent(d?.event),plan=createPlan(e);const text=(s,max)=>{if(typeof s!=='string'||!s.trim()||s.length>max)throw Error('The AI returned invalid text. Please try again.');return s.trim();};
 if(!Array.isArray(d.budget)||!d.budget.length||d.budget.length>30||!Array.isArray(d.tasks)||!d.tasks.length||d.tasks.length>60)throw Error('The AI returned an incomplete plan. Please try again.');
 plan.budget=d.budget.map((b,i)=>{for(const v of [b.allocated,b.spent])if(!Number.isFinite(v)||v<0||v>1e9)throw Error('The AI returned an invalid budget amount.');return {id:'b'+i,category:text(b.category,120),allocated:Math.round(b.allocated*100)/100,spent:Math.round(b.spent*100)/100};});
 plan.tasks=d.tasks.map((t,i)=>{validateEvent({...e,date:t.date});return {id:'t'+i,title:text(t.title,200),date:t.date,done:false};});
 const assumptions=(Array.isArray(d.assumptions)?d.assumptions:[]).slice(0,20).map(s=>text(s,1000));const allocated=plan.budget.reduce((s,b)=>s+b.allocated,0);if(Math.abs(allocated-e.budget)>.01)assumptions.push(`Category allocations total ${allocated} ${e.currency}; event budget is ${e.budget} ${e.currency}. Review this difference.`);
 plan.aiNotes=text(d.summary,10000);plan.importAssumptions=assumptions;plan.provider='gemini';return {event:e,plan,assumptions};
}
