import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError, sleep } from 'n8n-workflow';
const prop = (displayName:string,name:string,show:string[],description:string):INodeProperties => ({displayName,name,type:'string',default:'',description,displayOptions:{show:{operation:show}}});
export class ParseBot implements INodeType {
 description: INodeTypeDescription = {
  displayName:'Parse.bot',name:'parseBot',icon:{light:'file:parse.svg',dark:'file:parse.dark.svg'},group:['transform'],version:1,description:'Build and call website APIs with Parse.bot',subtitle:'={{$parameter.operation}}',defaults:{name:'Parse.bot'},inputs:[NodeConnectionTypes.Main],outputs:[NodeConnectionTypes.Main],usableAsTool:true,credentials:[{name:'parseBotApi',required:true}],properties:[
   {displayName:'Resource',name:'resource',type:'options',noDataExpression:true,default:'task',options:[{name:'Marketplace',value:'marketplace'},{name:'Scraper',value:'scraper'},{name:'Task',value:'task'}]},
   {displayName:'Operation',name:'operation',type:'options',default:'dispatch',noDataExpression:true,displayOptions:{show:{resource:['task']}},options:[
    {name:'Dispatch',value:'dispatch',action:'Dispatch a task'},
    {name:'Get Task Status',value:'status',action:'Get task status'},
    {name:'Provide Task Input',value:'input',action:'Provide requested task input'},
    {name:'Revise',value:'revise',action:'Revise a completed task'},
   ]},
   {displayName:'Operation',name:'operation',type:'options',default:'call',noDataExpression:true,displayOptions:{show:{resource:['scraper']}},options:[{name:'Call Endpoint',value:'call',action:'Call a scraper endpoint'}]},
   {displayName:'Operation',name:'operation',type:'options',default:'search',noDataExpression:true,displayOptions:{show:{resource:['marketplace']}},options:[{name:'Search APIs',value:'search',action:'Search marketplace apis'}]},
   {...prop('Website URL','url',['dispatch'],'The website URL to turn into an API'),required:true},
   prop('Task Description','task',['dispatch'],'Describe the data or actions you need'),
   {displayName:'Contribute to Marketplace',name:'contribute',type:'boolean',default:true,description:'Whether to contribute this API to the marketplace. Private builds cost credits.',displayOptions:{show:{operation:['dispatch']}}},
   {...prop('Task ID','taskId',['status','input','revise'],'The ID returned by dispatch'),required:true},
   {displayName:'Wait Until Finished',name:'wait',type:'boolean',default:false,description:'Whether to poll until completed, failed, cancelled, or input is needed',displayOptions:{show:{operation:['status']}}},
   {displayName:'Maximum Wait Seconds',name:'maxWait',type:'number',default:120,typeOptions:{minValue:5,maxValue:600},description:'Maximum time to poll before returning the latest status',displayOptions:{show:{operation:['status'],wait:[true]}}},
   {...prop('User Response JSON','response',['input'],'JSON object containing answers requested by the task'),default:'{}',required:true},
   {...prop('Revision','revision',['revise'],'Describe the desired change'),required:true},
   {...prop('Scraper ID','scraperId',['call'],'The scraper ID from a completed task or marketplace detail'),required:true},
   {...prop('Endpoint Name','endpointName',['call'],'The endpoint name from the API specification'),required:true},
   {displayName:'Method',name:'method',type:'options',default:'POST',options:[{name:'GET',value:'GET'},{name:'POST',value:'POST'}],displayOptions:{show:{operation:['call']}}},
   {...prop('Parameters JSON','params',['call'],'JSON object of endpoint parameters; sent as query for GET and body for POST'),default:'{}'},
   prop('Search Query','query',['search'],'Search for a website or API'),
  ]};
 async execute(this:IExecuteFunctions):Promise<INodeExecutionData[][]> {
  const out:INodeExecutionData[]=[];
  for(let i=0;i<this.getInputData().length;i++) { try {
   const op=String(this.getNodeParameter('operation',i)); const p=(n:string)=>String(this.getNodeParameter(n,i)); const enc=(n:string)=>encodeURIComponent(p(n));
   let path=''; let method:'GET'|'POST'='GET'; let body:IDataObject|undefined; let qs:IDataObject|undefined;
   // https://docs.parse.bot/api-reference/dispatch/create-a-new-api-from-a-url
   if(op==='dispatch') {path='/dispatch'; method='POST'; body={url:p('url'),contributes_to_marketplace:this.getNodeParameter('contribute',i)}; const task=p('task'); if(task) body.task=task;}
   // https://docs.parse.bot/api-reference/dispatch/get-task-detail
   else if(op==='status') path=`/dispatch/tasks/${enc('taskId')}`;
   // https://docs.parse.bot/api-reference/dispatch/respond-to-input-prompts
   else if(op==='input') {path=`/dispatch/${enc('taskId')}`;method='POST';body={user_response:JSON.parse(p('response'))};}
   // https://docs.parse.bot/api-reference/dispatch/revise-a-completed-api
   else if(op==='revise') {path=`/dispatch/tasks/${enc('taskId')}/revise`;method='POST';body={revision:p('revision')};}
   // https://docs.parse.bot/api-reference/execute/execute-an-api-endpoint-get and https://docs.parse.bot/api-reference/execute/execute-an-api-endpoint-post
   else if(op==='call') {path=`/scraper/${enc('scraperId')}/${enc('endpointName')}`;method=p('method') as 'GET'|'POST'; const params=JSON.parse(p('params')) as IDataObject; if(method==='GET') qs=params; else body=params;}
   // https://docs.parse.bot/api-reference/marketplace/search-and-browse-the-marketplace
   else if(op==='search') {path='/marketplace/apis'; qs={q:p('query')};}
   else throw new NodeOperationError(this.getNode(),'Unknown operation',{itemIndex:i});
   const request=async()=>this.helpers.httpRequestWithAuthentication.call(this,'parseBotApi',{method,url:`https://api.parse.bot${path}`,...(body?{body}:{}),...(qs?{qs}:{}),json:true}) as Promise<IDataObject>;
   let result=await request();
   if(op==='status' && this.getNodeParameter('wait',i,false)) { const deadline=Date.now()+Number(this.getNodeParameter('maxWait',i,120))*1000; while(['queued','running'].includes(String(result.status)) && Date.now()+15000<=deadline) {await sleep(15000); result=await request();} }
   if(Array.isArray(result)) for(const item of result) out.push({json:typeof item==='object'&&item!==null?item:{value:item},pairedItem:{item:i}}); else out.push({json:result,pairedItem:{item:i}});
  } catch(error) {if(!this.continueOnFail()) throw error instanceof NodeOperationError?error:new NodeOperationError(this.getNode(),error as Error,{itemIndex:i});out.push({json:{error:(error as Error).message},pairedItem:{item:i}});} }
  return [out];
 }
}
