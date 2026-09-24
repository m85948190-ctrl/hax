import { buildNativeProduct } from 'lib/kai-native-builder';
export const access='public';
export const methods=['POST'];
export default async function(req,res){
 const idea=typeof req.body?.idea==='string'?req.body.idea.trim():'';
 if(!idea||idea.length>12000)return res.status(400).json({error:'Describe the app you want KAI to build.'});
 const result=buildNativeProduct(idea,{appName:req.body?.appName||''});
 return res.json({ok:true,response:result.summary,name:result.name,product:result,kai:{engine:'KAI Native Product Compiler',provider:'none',local:true}});
}