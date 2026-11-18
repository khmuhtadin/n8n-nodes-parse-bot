import type { IAuthenticateGeneric, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';
export class ParseBotApi implements ICredentialType {
 name = 'parseBotApi'; displayName = 'Parse.bot API';
 icon = {light:'file:../nodes/ParseBot/parse.svg',dark:'file:../nodes/ParseBot/parse.dark.svg'} as const;
 documentationUrl = 'https://docs.parse.bot/authentication';
 properties: INodeProperties[] = [{displayName:'API Key',name:'apiKey',type:'string',typeOptions:{password:true},default:'',required:true}];
 authenticate: IAuthenticateGeneric = {type:'generic',properties:{headers:{'X-API-Key':'={{$credentials.apiKey}}'}}};
 // https://docs.parse.bot/api-reference/dispatch/list-your-apis
 test: ICredentialTestRequest = {request:{baseURL:'https://api.parse.bot',url:'/dispatch/tasks?limit=1',method:'GET',json:true}};
}
