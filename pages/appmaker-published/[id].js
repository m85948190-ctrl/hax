import { db } from "hatchable";
export const access = "public";
function esc(s){return String(s).replace(/[&<>\\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\"':'&quot;',"'":'&#39;'}[c]));}
export default async function(req,res){
  const id=req.params.id;
  const {rows}=await db.query("SELECT name, html FROM generated_apps WHERE id = $1",[id]);
  if(!rows.length) return res.status(404).send("App not found");
  const html=rows[0].html;
  res.setHeader("Content-Type","text/html; charset=utf-8");
  res.setHeader("X-HAxBRO-App",esc(rows[0].name));
  res.send(html);
}