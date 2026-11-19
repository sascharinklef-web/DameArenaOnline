import { getStore } from '@netlify/blobs';
const reply=(status,obj)=>new Response(JSON.stringify(obj),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const square=/^[a-h][1-8]$/;
const communityIngest = async (request)=>{
 if(request.method!=='POST')return reply(405,{error:'Method not allowed'});
 const size=Number(request.headers.get('content-length')||0);
 if(size>180000)return reply(413,{error:'Payload too large'});
 let input;try{const raw=await request.text();if(raw.length>180000)return reply(413,{error:'Payload too large'});input=JSON.parse(raw);}catch{return reply(400,{error:'Invalid JSON'});}
 if(input?.schema!=='damearena-community-v2'||input.consent!==true)return reply(400,{error:'Consent/schema required'});
 const g=input.game;
 if(!g||typeof g.game_id!=='string'||!/^[0-9a-f-]{36}$/i.test(g.game_id)||!['white','black','draw'].includes(g.result)||!Array.isArray(g.steps)||g.steps.length<1||g.steps.length>3000||![1,2,3].includes(Number(g.difficulty)))return reply(400,{error:'Invalid game'});
 if(g.steps.some(m=>!m||!square.test(m.from)||!square.test(m.to)||!['w','s'].includes(m.side)||typeof m.capture!=='boolean'||(m.captured_square!==null&&m.captured_square!==undefined&&!square.test(m.captured_square))))return reply(400,{error:'Invalid moves'});
 // Whitelist only anonymous fields; never persist client-supplied identifiers other than game_id.
 const clean={schema:'damearena-community-v2',game_id:g.game_id,result:g.result,difficulty:Number(g.difficulty),ai_version:String(g.ai_version||'unknown').slice(0,60),platform:String(g.platform||'unknown').slice(0,30),started_at:typeof g.started_at==='string'?g.started_at:null,ended_at:typeof g.ended_at==='string'?g.ended_at:null,steps:g.steps.map((m,i)=>({ply:i+1,actor_type:m.side==='w'?'HUMAN':'AI',side:m.side,from:m.from,to:m.to,capture:m.capture,captured_square:m.captured_square||null}))};
 try{
  const store=getStore({name:'damearena-community-games',consistency:'strong'});
  const key='games/'+g.game_id+'.json';
  // One stable object key per game; repeated uploads are idempotent.
  const existing=await store.get(key,{type:'json'});
  if(!existing)await store.setJSON(key,clean);
  return reply(200,{ok:true,game_id:g.game_id,duplicate:!!existing});
 }catch(e){console.error('Community storage failed',e);return reply(503,{error:'Storage unavailable'});}
};

export default communityIngest;

// Compatibility with Netlify's legacy Lambda handler runtime.
export const handler = async (event) => {
  const method = event.httpMethod || 'GET';
  const headers = new Headers(event.headers || {});
  const body = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString('utf8')
    : (event.body || '');
  const request = new Request('https://localhost/.netlify/functions/community-ingest', {
    method, headers, ...(method === 'GET' || method === 'HEAD' ? {} : { body })
  });
  const response = await communityIngest(request);
  return {statusCode: response.status, headers: Object.fromEntries(response.headers), body: await response.text()};
};
