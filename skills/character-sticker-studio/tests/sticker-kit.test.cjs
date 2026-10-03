'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const sharp=require('sharp');
const cli=path.resolve(__dirname,'../scripts/sticker-kit.cjs');
const {zipStore,crc32,gallery}=require(cli);
function run(root,command,extra=[]){return cp.spawnSync(process.execPath,[cli,command,'--project',root,...extra],{encoding:'utf8',env:process.env});}
function load(root){return JSON.parse(fs.readFileSync(path.join(root,'project.json')));}
function save(root,c){fs.writeFileSync(path.join(root,'project.json'),JSON.stringify(c,null,2));}
async function project(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'sticker-synthetic-'));assert.equal(run(root,'init').status,0);
 const comps=[];
 for(let n=0;n<4;n++){
  const b=Buffer.alloc(96*96*4);
  for(let y=18;y<80;y++)for(let x=30;x<64;x++){const k=(y*96+x)*4;b[k]=80+n*30;b[k+1]=100;b[k+2]=180-n*25;b[k+3]=255;}
  comps.push({input:await sharp(b,{raw:{width:96,height:96,channels:4}}).png().toBuffer(),left:n%2*96,top:Math.floor(n/2)*96});
 }
 await sharp({create:{width:192,height:192,channels:4,background:'#00000000'}}).composite(comps).png().toFile(path.join(root,'source/01.png'));
 return root;
}
function approveFixture(root){
 const c=load(root),report=JSON.parse(fs.readFileSync(path.join(root,'renders/01/v1/render-report.json')));
 c.items[0].visual_review={status:'passed',gif_sha256:report.gif.sha256,notes:['Synthetic fixture accepted only for automated pipeline testing, not a character visual approval.']};save(root,c);
}
test('real GIF, transparent frames, pending review blocks release, package and Unicode archive',async()=>{
 const root=await project();try{
  const e=run(root,'export',['--id','01']);assert.equal(e.status,0,e.stderr);
  const r=JSON.parse(e.stdout);assert.equal(r.gif.width,240);assert.equal(r.gif.loop,0);assert.equal(r.gif.uniqueFrames,4);assert.ok(r.gif.minimumMargin>=5);
  assert.equal(run(root,'validate').status,2);assert.match(run(root,'package').stderr,/visual review/);
  approveFixture(root);assert.equal(run(root,'validate').status,0);
  const p=run(root,'package');assert.equal(p.status,0,p.stderr);const info=JSON.parse(p.stdout);assert.ok(fs.existsSync(info.zip));assert.ok(fs.existsSync(path.join(info.folder,'使用说明.md')));
  assert.ok(!fs.existsSync(path.join(info.folder,'上传说明.md')));
  const guide=fs.readFileSync(path.join(info.folder,'使用说明.md'),'utf8');
  for(const [,rel] of guide.matchAll(/\]\(([^)]+)\)/g)) assert.ok(fs.existsSync(path.join(info.folder,rel)), 'Guide link must resolve: '+rel);
  const html=fs.readFileSync(path.join(info.folder,'preview.html'),'utf8');assert.match(html,/data:image\/gif;base64/);
  const zip=fs.readFileSync(info.zip);let off=0,n=0;while(zip.readUInt32LE(off)===0x04034b50){const len=zip.readUInt32LE(off+18),nameLen=zip.readUInt16LE(off+26),extraLen=zip.readUInt16LE(off+28),start=off+30+nameLen+extraLen;assert.equal(crc32(zip.subarray(start,start+len)),zip.readUInt32LE(off+14));off=start+len;n++;}assert.equal(n,info.archive.files);assert.ok(n>=7);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('existing render is immutable and stale visual signature blocks release',async()=>{
 const root=await project();try{
  assert.equal(run(root,'export',['--id','01']).status,0);approveFixture(root);
  const before=fs.readFileSync(path.join(root,'renders/01/v1/sticker.gif'));
  assert.match(run(root,'export',['--id','01']).stderr,/already exists/);assert.deepEqual(before,fs.readFileSync(path.join(root,'renders/01/v1/sticker.gif')));
  const c=load(root);c.items[0].visual_review.gif_sha256='0'.repeat(64);save(root,c);assert.equal(run(root,'validate').status,2);assert.match(run(root,'package').stderr,/stale/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('opacity, wrong timing and lack of animated change are rejected',async()=>{
 const root=await project();try{
  let c=load(root);c.items[0].delays_ms=[11];save(root,c);assert.match(run(root,'export',['--id','01']).stderr,/Delays/);
  c.items[0].order=[1,1];c.items[0].delays_ms=[100,100];save(root,c);assert.notEqual(run(root,'export',['--id','01']).status,0);
  await sharp({create:{width:192,height:192,channels:3,background:'#ffffff'}}).png().toFile(path.join(root,'source/opaque.png'));
  c.items[0].source='source/opaque.png';save(root,c);assert.match(run(root,'export',['--id','01']).stderr,/alpha/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('selected frame order and source-boundary rejection',async()=>{
 const root=await project();try{
  const c=load(root);c.items[0].order=[1,2,4,2];save(root,c);const e=run(root,'export',['--id','01']);assert.equal(e.status,0,e.stderr);const r=JSON.parse(e.stdout);assert.equal(r.gif.uniqueFrames,3);assert.deepEqual(r.selected_source_frames,[1,2,4,2]);
  c.items[0].revision='v2';c.items[0].source='../outside.png';save(root,c);assert.match(run(root,'export',['--id','01']).stderr,/leaves project/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('WeChat mode blocks incomplete album, support assets and unverified rules',async()=>{
 const root=await project();try{
  assert.equal(run(root,'export',['--id','01']).status,0);approveFixture(root);const c=load(root);c.target='wechat_album';save(root,c);
  const v=run(root,'validate');assert.equal(v.status,2);assert.match(v.stdout,/8–24/);assert.match(v.stdout,/review date/);assert.match(v.stdout,/Missing support/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('modified PNG backup cannot be packaged as the checked render',async()=>{
 const root=await project();try{
  assert.equal(run(root,'export',['--id','01']).status,0);approveFixture(root);
  await sharp({create:{width:240,height:240,channels:4,background:'#ffffff00'}}).png().toFile(path.join(root,'renders/01/v1/preview.png'));
  assert.match(run(root,'package').stderr,/Static preview differs/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('preview escapes untrusted title and metadata without injecting script',()=>{
 const x='</script><script>alert(1)</script>';const h=gallery([{id:'01',name:x,gif:'data:...',png:'data:...'}],x);
 assert.ok(!h.includes('<script>alert(1)</script>'));assert.match(h,/\\u003c\/script/);
});
test('complete WeChat synthetic album validates support assets and packages locally',async()=>{
 const root=await project();try{
  const c=load(root);c.target='wechat_album';c.platform={reviewed_on:new Date().toISOString().slice(0,10),source:'https://sticker.weixin.qq.com/cgi-bin/mmemoticon-bin/readtemplate?t=guide/index'};
  const labels=['一','二','三','四','五','六','七','八'];
  const first=c.items[0];c.items=[];
  for(let n=0;n<8;n++){
   const id=String(n+1).padStart(2,'0');if(n)await sharp(path.join(root,'source/01.png')).modulate({hue:n*25}).png().toFile(path.join(root,'source',id+'.png'));
   c.items.push({...first,id,meaning:'测试'+labels[n],source:'source/'+id+'.png',visual_review:{status:'pending',gif_sha256:'',notes:[]}});
  }
  save(root,c);
  for(const i of c.items){
   const e=run(root,'export',['--id',i.id]);assert.equal(e.status,0,e.stderr);i.visual_review={status:'passed',gif_sha256:JSON.parse(e.stdout).gif.sha256,notes:['Synthetic geometry fixture, no real identity approval.']};
  }
  c.support={};
  for(const [key,w,h,alpha] of [['cover',240,240,true],['icon',50,50,true],['banner',750,400,false]]){
   const p=path.join(root,'source',key+'.png');let op=sharp({create:{width:w,height:h,channels:4,background:alpha?'#00000000':'#668877'}});
   if(alpha){const block=await sharp({create:{width:Math.floor(w*.6),height:Math.floor(h*.6),channels:4,background:'#cc8877'}}).png().toBuffer();op=op.composite([{input:block,left:Math.floor(w*.2),top:Math.floor(h*.2)}]);}
   await op.png().toFile(p);
   c.support[key]={source:'source/'+key+'.png',visual_review:{status:'passed',file_sha256:require('node:crypto').createHash('sha256').update(fs.readFileSync(p)).digest('hex'),notes:['Synthetic format fixture only.']}};
  }
  save(root,c);const v=run(root,'validate');assert.equal(v.status,0,v.stdout);const p=run(root,'package');assert.equal(p.status,0,p.stderr);assert.ok(fs.existsSync(path.join(root,'delivery/v1/assets/banner.png')));
  const delivered=path.join(root,'delivery/v1');
  assert.ok(fs.existsSync(path.join(delivered,'上传说明.md')));
  const guide=fs.readFileSync(path.join(delivered,'使用说明.md'),'utf8');
  for(const [,rel] of guide.matchAll(/\]\(([^)]+)\)/g)) assert.ok(fs.existsSync(path.join(delivered,rel)), 'Album guide link must resolve: '+rel);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
