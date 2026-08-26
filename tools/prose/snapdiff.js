/* what changed between the snapshot and the current draft */
const fs=require('fs'),path=require('path'),D=process.env.RUNGS_OUT||path.join(__dirname,'..','out','rungs'),b=process.argv[2];
const a=JSON.parse(fs.readFileSync(path.join(D,'snapshot',b+'.json'),'utf8'));
const c=JSON.parse(fs.readFileSync(path.join(D,'drafts',b+'.json'),'utf8'));
const ka=Object.keys(a),kc=Object.keys(c);
if(ka.length!==kc.length||ka.some(k=>!c[k])) console.log('  KEY SET CHANGED');
let desc=0,rung=0,stat=new Set();
ka.forEach(k=>{
  if(a[k].desc!==c[k].desc){desc++;stat.add(k);console.log('  desc changed: '+k)}
  a[k].rungs.forEach((t,i)=>{ if(t!==c[k].rungs[i]){rung++;stat.add(k)} });
});
console.log(b.padEnd(12)+' statutes touched '+stat.size+'  rung fields '+rung+'  desc fields '+desc);
