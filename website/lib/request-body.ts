// Enforce byte limits while streaming, including chunked bodies without Content-Length.
export class RequestBodyError extends Error {
 constructor(public status:number,message:string){super(message)}
}
export async function readLimitedBytes(request:Request,limit:number):Promise<Uint8Array>{
 const declared=request.headers.get('content-length');
 if(declared!==null&&Number(declared)>limit)throw new RequestBodyError(413,'Data terlalu besar. Kurangi ukuran data atau foto.');
 if(!request.body)return new Uint8Array();
 const reader=request.body.getReader(),chunks:Uint8Array[]=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw new RequestBodyError(413,'Data terlalu besar. Kurangi ukuran data atau foto.')}chunks.push(value)}}finally{reader.releaseLock()}
 const output=new Uint8Array(size);let offset=0;for(const chunk of chunks){output.set(chunk,offset);offset+=chunk.byteLength}return output;
}
export async function readLimitedText(request:Request,limit:number){return new TextDecoder().decode(await readLimitedBytes(request,limit))}
export function bodyErrorResponse(error:unknown):Response|null{
 const status=error instanceof RequestBodyError?error.status:error instanceof SyntaxError?400:0;
 return status?Response.json({error:error instanceof RequestBodyError?error.message:'Format data tidak valid.'},{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}}):null;
}
