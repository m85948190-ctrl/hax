export const access = 'public';
export const methods = ['POST'];

export default async function(req,res){
  const body=req.body||{};
  const html=typeof body.html==='string'?body.html:'';
  const raw=typeof body.filename==='string'?body.filename:'kai-app.html';
  const filename=raw.replace(/[^a-zA-Z0-9._-]/g,'-').slice(0,120)||'kai-app.html';
  if(!html||html.length<30){return res.status(400).json({ok:false,error:'html required'});}
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Content-Disposition',`attachment; filename="${filename}"`);
  res.setHeader('Cache-Control','no-store');
  res.send(html);
}