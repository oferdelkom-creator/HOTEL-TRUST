import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {join} from 'node:path';
export async function GET(_request:Request,{params}:{params:Promise<{bank:string}>}){
 const {bank}=await params;
 if(!['hotel-tests.json','neighbourhood-tests.json'].includes(bank))return new Response('Not found',{status:404});
 const content=gunzipSync(await readFile(join(process.cwd(),'public','learning',bank+'.gz')));
 return new Response(content,{headers:{'Content-Type':'application/json; charset=utf-8','Content-Disposition':`attachment; filename="${bank}"`,'Cache-Control':'public, max-age=86400'}});
}
