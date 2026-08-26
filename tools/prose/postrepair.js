/* post-repair validation: evidence gone, mechanics clean, no duplicate sentences */
const fs=require('fs'),path=require('path'),D=process.env.RUNGS_OUT||path.join(__dirname,'..','out','rungs');
const book=process.argv[2];
const f=JSON.parse(fs.readFileSync(path.join(D,'verify',book+'.json'),'utf8'));
const d=JSON.parse(fs.readFileSync(path.join(D,'drafts',book+'.json'),'utf8'));
const get=(v,fl)=>fl==='desc'?v.desc:v.rungs[+fl.slice(-1)-1];
let left=0;
/* THE WHOLE EVIDENCE STRING, NOT A PREFIX. A 60-char prefix test reported
   three repairs as unrepaired on the fifth batch: each had kept the opening
   clause and surgically replaced the offending one later in the sentence,
   which is exactly the right repair. The question this asks is "is the
   reported text still there verbatim", so it must compare the whole of it. */
f.forEach(x=>{ const t=get(d[x.id],x.field);
  if(t.includes(x.evidence.trim())){ console.log('  STILL PRESENT '+x.id+' '+x.field); left++; } });
const bad=[]; let L=[];
for(const [k,v] of Object.entries(d)){
  if(v.rungs.length!==4) bad.push(k+' rungs='+v.rungs.length);
  [v.desc,...v.rungs].forEach((t,i)=>{
    if(/[^\x00-\x7F]/.test(t)) bad.push(k+' '+i+' nonascii');
    if(/\d/.test(t)) bad.push(k+' '+i+' digit');
    if(/[<>&#{}]/.test(t)) bad.push(k+' '+i+' markup');
    const n=t.trim().split(/(?<=[.!?])\s+/).filter(Boolean).length;
    if(i>0&&(n<2||n>5)) bad.push(k+' rung'+i+' sentences='+n);
    if(i>0&&(t.length<90||t.length>340)) bad.push(k+' rung'+i+' len='+t.length);
  });
  L=L.concat(v.rungs.map(x=>x.length));
}
const seen=new Map(); let dup=0;
for(const [k,v] of Object.entries(d)) v.rungs.forEach((t,i)=>
  t.trim().split(/(?<=[.!?])\s+/).forEach(s=>{ s=s.trim();
    if(s.length>25){ if(seen.has(s)){ console.log('  DUP '+k+' rung'+(i+1)+' vs '+seen.get(s)); dup++; } seen.set(s,k+' rung'+(i+1)); }}));
console.log(book.padEnd(12)+' keys '+Object.keys(d).length+
  '  findings '+f.length+' unrepaired '+left+
  '  mechanical '+bad.length+(bad.length?' '+bad.slice(0,4).join('; '):'')+
  '  dup '+dup+'  mean '+Math.round(L.reduce((a,b)=>a+b,0)/L.length));
