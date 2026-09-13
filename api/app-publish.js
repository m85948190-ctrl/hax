import { db } from 'hatchable';

export const access = 'public';
export const methods = ['POST'];

const clean = s => String(s || '').replace(/[<>]/g, '').slice(0, 120);

export default async function(req,res){
  const name = clean(req.body?.name) || 'HAxBRO App';
  const files = Array.isArray(req.body?.files) ? req.body.files : [];
  if (!files.length) return res.status(400).json({ok:false,error:'Build an app first.'});
  const safeFiles = files.filter(f => f && typeof f.path === 'string' && typeof f.content === 'string')
    .slice(0,100)
    .map(f => ({path:f.path.split('/').filter(p=>p && p!=='.' && p!=='..').join('/').slice(0,240),content:f.content.slice(0,180000)}))
    .filter(f => f.path);
  if (!safeFiles.length) return res.status(400).json({ok:false,error:'No valid app files.'});
  if (!safeFiles.some(f => f.path.toLowerCase() === 'index.html')) return res.status(400).json({ok:false,error:'Generated app must contain index.html.'});
  const totalBytes = safeFiles.reduce((n,f) => n + f.content.length, 0);
  if (totalBytes > 9000000) return res.status(413).json({ok:false,error:'Generated app is too large to host safely.'});

  try {
    const { rows } = await db.query(
      'INSERT INTO haxbro_generated_apps (name, files) VALUES ($1, $2::jsonb) RETURNING id',
      [name, JSON.stringify(safeFiles)]
    );
    const id = rows[0]?.id;
    if (!id) throw new Error('App record was not created');
    const origin = new URL(req.url,'https://haxbro.hatchable.site').origin;
    const url = `${origin}/apps/${id}`;
    return res.json({ok:true,agent:'HAxBRO App Engine',hosting:'hatchable',provider:'Hatchable App Engine',free:true,public:true,accountRequired:false,url,appUrl:url,publicUrl:url,id});
  } catch (error) {
    return res.status(500).json({ok:false,agent:'HAxBRO App Engine',hosting:'hatchable',error:String(error?.message || error)});
  }
}