#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
let sharp;
const fail=m=>{throw new Error(m)};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const hashFile=p=>hash(fs.readFileSync(p));
const saveJSON=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const safeName=s=>{if(typeof s!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(s))fail('Use an ASCII id/revision: letters, digits, _ or -');return s};
const length=s=>[...String(s||'')].length;
function inside(root,rel,mustExist=true){
 if(typeof rel!=='string'||!rel||path.isAbsolute(rel))fail('Expected a relative project path');
 const p=path.resolve(root,rel),prefix=path.resolve(root)+path.sep;
 if(!p.startsWith(prefix))fail('Path leaves project');
 const rr=fs.realpathSync(root)+path.sep;
 if(mustExist){const real=fs.realpathSync(p);if(!real.startsWith(rr))fail('Symlink leaves project');}
 else {let ancestor=path.dirname(p);while(!fs.existsSync(ancestor))ancestor=path.dirname(ancestor);const real=fs.realpathSync(ancestor);if(real!==fs.realpathSync(root)&&!real.startsWith(rr))fail('Output parent leaves project');}
 return p;
}
function args(argv){
 const command=argv.shift(),out={command};
 while(argv.length){const k=argv.shift();if(!['--project','--id'].includes(k)||!argv.length)fail('Unknown or incomplete option '+k);out[k.slice(2)]=argv.shift();}
 if(!out.project)fail('--project is required');out.project=path.resolve(out.project);return out;
}
function config(root){
 const c=JSON.parse(fs.readFileSync(path.join(root,'project.json'),'utf8'));
 if(c.schema!==1||!['personal','wechat_album'].includes(c.target))fail('Unsupported schema or target');
 if(!Array.isArray(c.items)||!c.items.length||c.items.length>100)fail('Expected 1–100 items');
 const ids=new Set(),names=new Set();
 for(const i of c.items){safeName(i.id);safeName(i.revision);if(ids.has(i.id))fail('Duplicate id');ids.add(i.id);if(typeof i.meaning!=='string'||!i.meaning.trim())fail('Meaning is required');if(names.has(i.meaning))fail('Duplicate meaning');names.add(i.meaning);}
 return c;
}
function init(root){
 if(fs.existsSync(root)&&fs.readdirSync(root).length)fail('Project directory must be empty');
 fs.mkdirSync(root,{recursive:true});
 for(const d of ['source','references','renders','delivery'])fs.mkdirSync(path.join(root,d));
 const c={schema:1,target:'personal',release:'v1',album:{name:'日常表情',description:'日常聊天的情绪与回应',creator:''},platform:{reviewed_on:'',source:'',note:''},items:[{id:'01',meaning:'你好',revision:'v1',source:'source/01.png',grid:[2,2],order:[1,2,3,4],delays_ms:[350,200,200,350],anchor:'head',cleanup_min_pixels:0,allow_edge_touch:false,visual_review:{status:'pending',gif_sha256:'',notes:[]}}],support:{}};
 saveJSON(path.join(root,'project.json'),c);
 fs.copyFileSync(path.join(__dirname,'../assets/character-brief.md'),path.join(root,'角色规范.md'));
 return {created:root,next:'Fill the brief, add source frames, and edit project.json. No artwork has been generated.'};
}
function analyze(data,w,h,minComponent=0){
 const visited=new Uint8Array(w*h),queue=new Int32Array(w*h);
 let primary=[],removed=0,components=0;
 for(let p=0;p<w*h;p++){
  if(visited[p]||data[p*4+3]<16)continue;
  let n=1,k=0;queue[0]=p;visited[p]=1;
  while(k<n){const p=queue[k++],x=p%w,y=Math.floor(p/w);
   for(const a of [x?p-1:-1,x<w-1?p+1:-1,y?p-w:-1,y<h-1?p+w:-1]){
    if(a>=0&&!visited[a]&&data[a*4+3]>=16){visited[a]=1;queue[n++]=a;}
   }
  }
  if(n<minComponent){for(let j=0;j<n;j++)data[queue[j]*4+3]=0;removed+=n;}
  else {components++;if(n>primary.length)primary=Array.from(queue.subarray(0,n));}
 }
 let x0=w,y0=h,x1=-1,y1=-1,transparent=0;
 for(let p=0;p<w*h;p++){
  if(data[p*4+3]<16){data[p*4+3]=0;transparent++;continue;}
  const x=p%w,y=Math.floor(p/w);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
 }
 if(x1<0||!primary.length)fail('An empty frame was found');
 if(!transparent)fail('Frame is opaque; supply genuine alpha, not a painted checkerboard');
 let py0=h,py1=0;
 for(const p of primary){py0=Math.min(py0,Math.floor(p/w));py1=Math.max(py1,Math.floor(p/w));}
 let sx=0,nx=0;
 for(const p of primary){const y=Math.floor(p/w);if(y>=py0+(py1-py0)*.07&&y<=py0+(py1-py0)*.28){sx+=p%w;nx++;}}
 return {left:x0,top:y0,width:x1-x0+1,height:y1-y0+1,anchorX:nx?sx/nx:(x0+x1)/2,anchorY:py0,margin:Math.min(x0,y0,w-1-x1,h-1-y1),components,removedPixels:removed};
}
async function sourceTiles(root,item){
 const min=item.cleanup_min_pixels??0;
 if(!Number.isInteger(min)||min<0||min>10000)fail('Invalid cleanup_min_pixels');
 const tiles=[],sourceHashes=[];
 async function add(p,region){
  const meta=await sharp(p).metadata();if(!meta.hasAlpha)fail('Source has no alpha channel');
  let op=sharp(p,{limitInputPixels:16000000});if(region)op=op.extract(region);
  const {data,info}=await op.toColourspace('srgb').ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const bbox=analyze(data,info.width,info.height,min);
  const crop=await sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).extract({left:bbox.left,top:bbox.top,width:bbox.width,height:bbox.height}).png().toBuffer();
  tiles.push({crop,bbox,w:info.width,h:info.height});
 }
 if(Array.isArray(item.frames)){
  if(item.frames.length<2||item.frames.length>48)fail('Expected 2–48 source frames');
  for(const rel of item.frames){const p=inside(root,rel);sourceHashes.push({path:rel,sha256:hashFile(p)});await add(p);}
 }else{
  const p=inside(root,item.source),m=await sharp(p).metadata(),g=item.grid||[2,2];
  if(g.length!==2||g.some(x=>!Number.isInteger(x)||x<1)||g[0]*g[1]<2||g[0]*g[1]>48)fail('Invalid grid [columns, rows]');
  sourceHashes.push({path:item.source,sha256:hashFile(p)});
  for(let y=0;y<g[1];y++)for(let x=0;x<g[0];x++){
   const left=Math.round(x*m.width/g[0]),top=Math.round(y*m.height/g[1]);
   await add(p,{left,top,width:Math.round((x+1)*m.width/g[0])-left,height:Math.round((y+1)*m.height/g[1])-top});
  }
 }
 const order=item.order||tiles.map((_,i)=>i+1);
 if(order.length<2||order.length>64||order.some(n=>!Number.isInteger(n)||n<1||n>tiles.length))fail('Invalid 1-based frame order');
 const selected=order.map(n=>tiles[n-1]);
 for(const t of selected){if(t.bbox.margin<1&&!item.allow_edge_touch)fail('Source touches a cell edge: repair the crop or document intentional cropping');}
 if(item.anchors){
  if(!Array.isArray(item.anchors)||item.anchors.length!==tiles.length||item.anchors.some(a=>!Array.isArray(a)||a.length!==2||a.some(v=>!Number.isFinite(v))))fail('Invalid manual anchors');
  tiles.forEach((t,i)=>{t.bbox.anchorX=item.anchors[i][0];t.bbox.anchorY=item.anchors[i][1];});
 }else if(item.anchor==='canvas'){tiles.forEach(t=>{t.bbox.anchorX=t.w/2;t.bbox.anchorY=0;});}
 else if(item.anchor&&item.anchor!=='head')fail('anchor must be head or canvas');
 return {selected,order,sourceHashes};
}
async function gifCheck(p){
 const bytes=fs.statSync(p).size,m=await sharp(p,{animated:true}).metadata();
 if(m.format!=='gif'||m.width!==240||m.pageHeight!==240||(m.pages||1)<2||m.loop!==0||bytes>500000)fail('GIF format/size/loop validation failed: '+path.basename(p));
 const hashes=[],margins=[],transparentFractions=[];
 for(let page=0;page<m.pages;page++){
  const b=await sharp(p,{page,pages:1}).toColourspace('srgb').ensureAlpha().raw().toBuffer();
  let x0=240,y0=240,x1=-1,y1=-1,clear=0;
  for(let q=0;q<240*240;q++){if(!b[q*4+3]){clear++;continue;}const x=q%240,y=Math.floor(q/240);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
  if(x1<0||clear===0)fail('Empty or opaque output frame');
  margins.push(Math.min(x0,y0,239-x1,239-y1));transparentFractions.push(clear/(240*240));hashes.push(hash(b));
 }
 const uniqueFrames=new Set(hashes).size;
 if(uniqueFrames<2)fail('Not a real multi-frame animation');
 if(Math.min(...margins)<5)fail('Output has insufficient edge margin');
 return {bytes,width:240,height:240,frames:m.pages,uniqueFrames,loop:m.loop,delay:m.delay,minimumMargin:Math.min(...margins),transparentFractions,sha256:hashFile(p)};
}
async function exportOne(root,c,id){
 const item=c.items.find(i=>i.id===id);if(!item)fail('Unknown item id');
 const dest=inside(root,'renders/'+safeName(id)+'/'+safeName(item.revision),false);
 if(fs.existsSync(dest))fail('Revision already exists; choose a new revision rather than overwrite');
 const {selected:tiles,order,sourceHashes}=await sourceTiles(root,item);
 const delays=item.delays_ms||order.map(()=>250);
 if(delays.length!==order.length||delays.some(x=>!Number.isInteger(x)||x<40||x>10000||x%10))fail('Delays must match order and be multiples of 10 ms, from 40 to 10000');
 const x0=Math.min(...tiles.map(t=>t.bbox.left-t.bbox.anchorX)),x1=Math.max(...tiles.map(t=>t.bbox.left+t.bbox.width-t.bbox.anchorX));
 const y0=Math.min(...tiles.map(t=>t.bbox.top-t.bbox.anchorY)),y1=Math.max(...tiles.map(t=>t.bbox.top+t.bbox.height-t.bbox.anchorY));
 const scale=Math.min(222/(x1-x0),222/(y1-y0)),ax=(240-(x1-x0)*scale)/2-x0*scale,ay=(240-(y1-y0)*scale)/2-y0*scale;
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 const staging=fs.mkdtempSync(path.join(path.dirname(dest),'.export-')),frames=[];
 try{
  for(let j=0;j<tiles.length;j++){
   const t=tiles[j],b=t.bbox,w=Math.max(1,Math.round(b.width*scale)),h=Math.max(1,Math.round(b.height*scale));
   const tile=await sharp(t.crop).resize(w,h).png().toBuffer(),left=Math.round(ax+(b.left-b.anchorX)*scale),top=Math.round(ay+(b.top-b.anchorY)*scale);
   const rgba=await sharp({create:{width:240,height:240,channels:4,background:'#00000000'}}).composite([{input:tile,left,top}]).raw().toBuffer();
   frames.push(rgba);await sharp(rgba,{raw:{width:240,height:240,channels:4}}).png().toFile(path.join(staging,'frame-'+String(j+1).padStart(2,'0')+'.png'));
  }
  await sharp(Buffer.concat(frames),{raw:{width:240,height:240*frames.length,channels:4,pageHeight:240}}).gif({loop:0,delay:delays,colours:256,dither:.7,effort:7}).toFile(path.join(staging,'sticker.gif'));
  await sharp(frames[0],{raw:{width:240,height:240,channels:4}}).png().toFile(path.join(staging,'preview.png'));
  const gif=await gifCheck(path.join(staging,'sticker.gif'));
  const report={schema:1,id,revision:item.revision,technical_pass:true,visual_review:'pending',created_at:new Date().toISOString(),sources:sourceHashes,selected_source_frames:order,bounds:tiles.map(t=>t.bbox),preview_sha256:hashFile(path.join(staging,'preview.png')),gif};
  saveJSON(path.join(staging,'render-report.json'),report);fs.renameSync(staging,dest);
  return report;
 }catch(e){fs.rmSync(staging,{recursive:true,force:true});throw e;}
}
async function supportCheck(root,key,item){
 if(!item||!item.source)fail('Missing support asset: '+key);
 const p=inside(root,item.source),m=await sharp(p).metadata(),spec={cover:[240,240,500000],icon:[50,50,100000],banner:[750,400,500000]}[key];
 const bytes=fs.statSync(p).size;
 if(m.width!==spec[0]||m.height!==spec[1]||bytes>spec[2]||!((key==='banner'?['png','jpeg']:['png']).includes(m.format)))fail('Invalid '+key+' format/dimensions/bytes');
 const {data,info}=await sharp(p).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let clear=0;for(let n=info.channels-1;n<data.length;n+=info.channels)if(data[n]<255)clear++;
 if(key==='banner'&&clear)fail('Banner must be fully opaque');
 if(key!=='banner'&&clear===0)fail(key+' must have transparency');
 return {source:item.source,format:m.format,bytes,width:m.width,height:m.height,sha256:hashFile(p)};
}
function reviewOK(r,digest,key){
 return r&&r.status==='passed'&&r[key]===digest&&Array.isArray(r.notes)&&r.notes.some(x=>typeof x==='string'&&x.trim());
}
async function validate(root,c){
 const items=[],support={},blocking=[],seenGIF=new Map();
 if(c.target==='wechat_album'){
  if(c.items.length<8||c.items.length>24)blocking.push('WeChat snapshot requires 8–24 items');
  if(!c.album||length(c.album.name)>8||!c.album.name||!(/^[\p{L}\p{N}]+$/u.test(c.album.name)))blocking.push('Album name must be 1–8 characters without punctuation');
  if(length(c.album?.description)>80)blocking.push('Description exceeds 80 characters');
  if(length(c.album?.creator)>10)blocking.push('Creator exceeds 10 characters');
  const date=c.platform?.reviewed_on,epoch=Date.parse(date||'');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date||'')||!Number.isFinite(epoch)||epoch>Date.now()+86400000||!/^https:\/\//.test(c.platform?.source||''))blocking.push('Record the actual current official rule review date and HTTPS source');
 }
 for(const i of c.items){
  if(c.target==='wechat_album'&&(length(i.meaning)>4||!(/^[\p{L}\p{N}]+$/u.test(i.meaning))))blocking.push(i.id+': meaning must be 1–4 characters without punctuation');
  try{
   const p=inside(root,'renders/'+i.id+'/'+i.revision+'/sticker.gif');
   const g=await gifCheck(p),rp=inside(root,'renders/'+i.id+'/'+i.revision+'/render-report.json');
   const report=JSON.parse(fs.readFileSync(rp));
   if(report.id!==i.id||report.revision!==i.revision)fail('Render report belongs to a different item or revision');
   if(g.sha256!==report.gif?.sha256)fail('Render differs from recorded export');
   if(seenGIF.has(g.sha256))blocking.push(i.id+': identical GIF already used by '+seenGIF.get(g.sha256));else seenGIF.set(g.sha256,i.id);
   const preview=inside(root,'renders/'+i.id+'/'+i.revision+'/preview.png');if(hashFile(preview)!==report.preview_sha256)fail('Static preview differs from recorded export');
   const visual=reviewOK(i.visual_review,g.sha256,'gif_sha256');
   if(!visual)blocking.push(i.id+': visual review missing or stale');
   items.push({id:i.id,revision:i.revision,meaning:i.meaning,gif:g,visual_review:visual?'passed':'pending'});
  }catch(e){blocking.push(i.id+': '+e.message);}
 }
 if(c.target==='wechat_album'){
  for(const key of ['cover','icon','banner']){
   try{
    const r=await supportCheck(root,key,c.support?.[key]);support[key]=r;
    if(!reviewOK(c.support[key].visual_review,r.sha256,'file_sha256'))blocking.push(key+': visual review missing or stale');
   }catch(e){blocking.push(e.message);}
  }
 }
 return {checked_at:new Date().toISOString(),target:c.target,items,support,blocking,ready_for_packaging:blocking.length===0,platform_acceptance:'not_submitted_or_guaranteed'};
}
function htmlEscape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function csv(v){return '"'+String(v).replace(/"/g,'""')+'"';}
function gallery(items,title,target='personal'){
 const json=JSON.stringify(items).replace(/</g,'\\u003c').replace(/>/g,'\\u003e');
 const guidance=target==='personal'?'先保存一张GIF，发送到自己的文件传输助手，再使用微信的添加到表情功能。添加成功后继续其余文件；截图和PNG不会保留动画。':'本页用于预览和保存GIF；正式投稿的配套素材及填写要求见上传说明。';
 return '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+htmlEscape(title)+'</title><style>body{margin:0;padding:28px;font:16px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f3f0e8;color:#304231}h1{font-size:30px}nav{display:flex;gap:12px;margin:22px 0}button,select,a{font:inherit}button,select{padding:10px;border:1px solid #acb8a2;border-radius:8px;background:#fff}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;max-width:1440px}.card{border:1px solid #d1d6c7;border-radius:12px;overflow:hidden;background:#fff}.card img{display:block;width:100%;aspect-ratio:1;object-fit:contain;background:var(--stage,#e5e5df)}.cap{padding:12px;display:flex;justify-content:space-between}.cap a{color:#476645}p{color:#63755e;line-height:1.8}@media(max-width:500px){body{padding:14px}main{grid-template-columns:repeat(2,minmax(0,1fr))}}</style><h1>'+htmlEscape(title)+'</h1><p>'+items.length+' 张动态表情 · 名称只用于标记文件</p><p>'+guidance+'</p><nav><button id="play">暂停</button><select id="bg"><option value="#e5e5df">浅色背景</option><option value="#262a27">深色背景</option><option value="#ffffff">白色背景</option></select></nav><main id="grid"></main><p>文件已本地打包；未代为提交或发布。动态图片嵌入本页，可离线打开。</p><script>const data='+json+';let playing=true;const grid=document.getElementById("grid");function draw(){grid.replaceChildren();for(const i of data){const c=document.createElement("div");c.className="card";const img=document.createElement("img");img.alt=i.name;img.src=playing?i.gif:i.png;const cap=document.createElement("div");cap.className="cap";const label=document.createElement("span");label.textContent=i.id+" "+i.name;const a=document.createElement("a");a.textContent="保存GIF";a.download=i.id+".gif";a.href=i.gif;cap.append(label,a);c.append(img,cap);grid.append(c)}}document.getElementById("play").onclick=()=>{playing=!playing;document.getElementById("play").textContent=playing?"暂停":"播放";draw()};document.getElementById("bg").onchange=e=>document.documentElement.style.setProperty("--stage",e.target.value);draw();</script></html>';
}
const crcTable=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0});
function crc32(b){let c=0xffffffff;for(const n of b)c=crcTable[(c^n)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
function zipStore(root,out){
 const list=[];function walk(p,rel=''){for(const n of fs.readdirSync(p).sort()){const full=path.join(p,n),r=rel?rel+'/'+n:n,st=fs.lstatSync(full);if(st.isSymbolicLink())fail('Symlinks are excluded from delivery');if(st.isDirectory())walk(full,r);else if(st.isFile())list.push({name:r,data:fs.readFileSync(full)});}}walk(root);
 let offset=0,total=0;const parts=[],central=[];
 for(const {name,data} of list){
  total+=data.length;if(data.length>64000000||total>256000000)fail('Delivery too large for this lightweight ZIP writer');
  const n=Buffer.from(name),crc=crc32(data),l=Buffer.alloc(30);
  l.writeUInt32LE(0x04034b50,0);l.writeUInt16LE(20,4);l.writeUInt16LE(0x800,6);l.writeUInt16LE(33,12);l.writeUInt32LE(crc,14);l.writeUInt32LE(data.length,18);l.writeUInt32LE(data.length,22);l.writeUInt16LE(n.length,26);
  const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50,0);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt16LE(0x800,8);c.writeUInt16LE(33,14);c.writeUInt32LE(crc,16);c.writeUInt32LE(data.length,20);c.writeUInt32LE(data.length,24);c.writeUInt16LE(n.length,28);c.writeUInt32LE(offset,42);
  parts.push(l,n,data);central.push(c,n);offset+=l.length+n.length+data.length;
 }
 const cd=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(list.length,8);end.writeUInt16LE(list.length,10);end.writeUInt32LE(cd.length,12);end.writeUInt32LE(offset,16);
 fs.writeFileSync(out,Buffer.concat([...parts,cd,end]),{flag:'wx'});
 return {files:list.length,bytes:fs.statSync(out).size,sha256:hashFile(out)};
}
async function packageProject(root,c){
 const report=await validate(root,c);if(report.blocking.length)fail('Packaging blocked:\n'+report.blocking.join('\n'));
 const rel=safeName(c.release||'v1'),out=inside(root,'delivery/'+rel,false),zip=inside(root,'delivery/'+rel+'.zip',false);
 if(fs.existsSync(out)||fs.existsSync(zip))fail('Delivery release already exists; choose a new release');
 fs.mkdirSync(path.dirname(out),{recursive:true});const staging=fs.mkdtempSync(path.join(path.dirname(out),'.package-'));
 try{
  for(const d of ['stickers','static','assets'])fs.mkdirSync(path.join(staging,d));
  const entries=[],csvRows=[['序号','含义词','GIF文件']];
  for(const i of c.items){
   const dir=inside(root,'renders/'+i.id+'/'+i.revision),gif=fs.readFileSync(path.join(dir,'sticker.gif')),png=fs.readFileSync(path.join(dir,'preview.png'));
   const pm=await sharp(png).metadata();if(pm.width!==240||pm.height!==240||!pm.hasAlpha)fail('Invalid static preview for '+i.id);
   fs.writeFileSync(path.join(staging,'stickers',i.id+'.gif'),gif);fs.writeFileSync(path.join(staging,'static',i.id+'.png'),png);
   entries.push({id:i.id,name:i.meaning,gif:'data:image/gif;base64,'+gif.toString('base64'),png:'data:image/png;base64,'+png.toString('base64')});csvRows.push([i.id,i.meaning,'stickers/'+i.id+'.gif']);
  }
  for(const [key,s] of Object.entries(report.support)){fs.copyFileSync(inside(root,s.source),path.join(staging,'assets',key+'.'+(s.format==='jpeg'?'jpg':'png')));}
  fs.writeFileSync(path.join(staging,'meanings.csv'),'\ufeff'+csvRows.map(r=>r.map(csv).join(',')).join('\n')+'\n');
  fs.writeFileSync(path.join(staging,'preview.html'),gallery(entries,c.album?.name||'表情预览',c.target));
  saveJSON(path.join(staging,'checks.json'),report);
  const cols=Math.min(6,c.items.length),rows=Math.ceil(c.items.length/cols),composites=[];
  for(let n=0;n<c.items.length;n++){const i=c.items[n],x=(n%cols)*240,y=Math.floor(n/cols)*276;composites.push({input:inside(root,'renders/'+i.id+'/'+i.revision+'/preview.png'),left:x,top:y});composites.push({input:Buffer.from('<svg width="240" height="36"><text x="120" y="25" text-anchor="middle" font-size="18" font-family="sans-serif" fill="#304231">'+htmlEscape(i.id+' '+i.meaning)+'</text></svg>'),left:x,top:y+240});}
  await sharp({create:{width:cols*240,height:rows*276,channels:3,background:'#f3f0e8'}}).composite(composites).jpeg({quality:90}).toFile(path.join(staging,'overview.jpg'));
  if(c.target==='wechat_album') fs.writeFileSync(path.join(staging,'上传说明.md'),'# '+String(c.album?.name||'表情素材').replace(/[\r\n]/g,' ')+'\n\n主表情：stickers/。static/是预览备份，不混入动态专辑。preview.html可离线打开。\n\n横幅：assets/banner.jpg 或 banner.png；封面：assets/cover.png；图标：assets/icon.png（个人用途可能无配套）。meanings.csv提供含义词。\n\n尚未提交平台。作者／工作室：'+(c.album?.creator||'需实际填写')+'。介绍草稿：'+(c.album?.description||'需实际填写')+'。\n\n由使用者按实际平台要求提供肖像证明／授权和AI辅助创作声明。本工具不保证版权状态或平台通过。\n');
  const first=c.items[0];
  const links='[查看动态预览](preview.html) · [保存第一张GIF](stickers/'+first.id+'.gif) · [查看整套总览](overview.jpg)';
  const useGuide=c.target==='personal'
   ? fs.readFileSync(path.join(__dirname,'../assets/personal-use.md'),'utf8')
   : '# 微信投稿素材使用说明\n\n主表情在stickers/，PNG备份在static/，配套图片在assets/。填写与规范注意事项见[上传说明](上传说明.md)。尚未提交或保证审核通过。\n';
  fs.writeFileSync(path.join(staging,'使用说明.md'),links+'\n\n本包共 '+c.items.length+' 张动态表情。\n\n'+useGuide);
  const archive=zipStore(staging,zip);fs.renameSync(staging,out);
  return {folder:out,zip,archive,submitted:false};
 }catch(e){fs.rmSync(staging,{recursive:true,force:true});if(fs.existsSync(zip))fs.rmSync(zip);throw e;}
}
async function main(){
 if(process.argv.includes('--help')){console.log('sticker-kit.cjs init|export|validate|package --project DIR [--id ID]\nRequires Node >=20.9 and sharp for image operations. See references/tooling.md.');return;}
 const a=args(process.argv.slice(2));
 if(a.command==='init'){console.log(JSON.stringify(init(a.project),null,2));return;}
 if(!['export','validate','package'].includes(a.command))fail('Unknown command');
 try{sharp=require('sharp')}catch{fail('Missing sharp. Use the host bundled runtime/NODE_PATH or install the package.json dependency after explaining the requirement. No global installation needed.');}
 const c=config(a.project);
 let result;
 if(a.command==='export'){if(!a.id)fail('--id is required');result=await exportOne(a.project,c,a.id);}
 else if(a.command==='validate'){result=await validate(a.project,c);saveJSON(path.join(a.project,'validation-report.json'),result);if(result.blocking.length)process.exitCode=2;}
 else result=await packageProject(a.project,c);
 console.log(JSON.stringify(result,null,2));
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={analyze,gallery,zipStore,inside,crc32};
