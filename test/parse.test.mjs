import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const {ParseBot}=require('../dist/nodes/ParseBot/ParseBot.node.js');const {ParseBotApi}=require('../dist/credentials/ParseBotApi.credentials.js');
function mock(params,result={status:'completed'}) {const calls=[];return {calls,ctx:{getInputData:()=>[{json:{}}],getNode:()=>({name:'Parse.bot',type:'parseBot',typeVersion:1,position:[0,0]}),getNodeParameter:(n,i,d)=>params[n]??d,continueOnFail:()=>false,helpers:{httpRequestWithAuthentication:async(auth,req)=>{calls.push({auth,req});return result;}}}};}
for(const [op,p,url,method,body,qs] of [
 ['dispatch',{url:'https://example.com',task:'Get data',contribute:true},'/dispatch','POST',{url:'https://example.com',task:'Get data',contributes_to_marketplace:true}],
 ['status',{taskId:'a/b',wait:false},'/dispatch/tasks/a%2Fb','GET'],
 ['input',{taskId:'id',response:'{"query":"books"}'},'/dispatch/id','POST',{user_response:{query:'books'}}],
 ['revise',{taskId:'id',revision:'Add title'},'/dispatch/tasks/id/revise','POST',{revision:'Add title'}],
 ['call',{scraperId:'scraper',endpointName:'list',method:'GET',params:'{"page":1}'},'/scraper/scraper/list','GET',undefined,{page:1}],
 ['call',{scraperId:'scraper',endpointName:'run',method:'POST',params:'{"x":1}'},'/scraper/scraper/run','POST',{x:1}],
 ['search',{query:'books'},'/marketplace/apis','GET',undefined,{q:'books'}],
]) test(`${op} maps request`,async()=>{const {ctx,calls}=mock({operation:op,...p});const out=await new ParseBot().execute.call(ctx);assert.equal(calls[0].auth,'parseBotApi');assert.equal(calls[0].req.url,'https://api.parse.bot'+url);assert.equal(calls[0].req.method,method);assert.deepEqual(calls[0].req.body,body);assert.deepEqual(calls[0].req.qs,qs);assert.deepEqual(out[0][0].pairedItem,{item:0});});
test('preserves live scraper response',async()=>{const data={status:'success',data:{books:[{title:'A Light in the Attic',price:'51.77'}]}};const {ctx}=mock({operation:'call',scraperId:'a',endpointName:'b',method:'GET',params:'{}'},data);assert.deepEqual((await new ParseBot().execute.call(ctx))[0][0].json,data)});
test('splits array results',async()=>{const {ctx}=mock({operation:'search',query:'x'},[{a:1},{a:2}]);assert.equal((await new ParseBot().execute.call(ctx))[0].length,2)});
test('credential and tool support',()=>{const c=new ParseBotApi();assert.equal(c.test.request.url,'/dispatch/tasks?limit=1');assert.equal(c.authenticate.properties.headers['X-API-Key'],'={{$credentials.apiKey}}');assert.equal(new ParseBot().description.usableAsTool,true)});
test('continue on fail',async()=>{const {ctx}=mock({operation:'input',taskId:'x',response:'invalid'});ctx.continueOnFail=()=>true;assert.ok((await new ParseBot().execute.call(ctx))[0][0].json.error)});
