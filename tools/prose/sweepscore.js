/* Score a whole-book sweep. Merges each reader's part files, joins on the key,
   and reports per-book and per-reader, plus the ladders both readers failed. */
const fs=require('fs'),path=require('path'),D=process.env.RUNGS_OUT||path.join(__dirname,'..','out','rungs');
const key=JSON.parse(fs.readFileSync(path.join(D,(process.env.TAG||'sweep')+'-key.json'),'utf8'));
const K={}; key.forEach(k=>K[k.n]=k);
const readers=process.argv.slice(2);          // e.g. sweepA sweepB
const pairs=(n)=>{const o=[];for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)o.push([i,j]);return o};
const failed={};
readers.forEach(r=>{
  const g={};
  fs.readdirSync(D).filter(f=>f.startsWith(r+'-')&&f.endsWith('.json')).sort().forEach(f=>{
    JSON.parse(fs.readFileSync(path.join(D,f),'utf8')).forEach(x=>{ g[x.n]=x.order; });
  });
  let pos=0,tot=0,ex=0,miss=0; const taus=[],md=[]; const byBook={};
  key.forEach(k=>{
    const a=k.answer, o=g[k.n];
    byBook[k.book]=byBook[k.book]||[0,0];
    if(!o){ tot+=4; miss++; byBook[k.book][1]++; (failed[k.id]=failed[k.id]||new Set()).add(r); return; }
    const h=[0,1,2,3].filter(i=>o[i]===a[i]).length; pos+=h; tot+=4;
    byBook[k.book][1]++;
    if(h===4){ ex++; byBook[k.book][0]++; } else (failed[k.id]=failed[k.id]||new Set()).add(r);
    const p=[0,1,2,3].map(i=>o.indexOf(a[i]));
    const c=pairs(4).filter(([i,j])=>p[i]<p[j]).length; taus.push((c-(6-c))/6);
    md.push(Math.max(...[0,1,2,3].map(i=>Math.abs(p[i]-i))));
  });
  console.log('%s  answered %d/%d  placements %s%%  exact %d/%d = %s%%  tau %s  maxdisp %s',
    r.padEnd(8), key.length-miss, key.length, (100*pos/tot).toFixed(1), ex, key.length,
    (100*ex/key.length).toFixed(1), (taus.reduce((a,b)=>a+b,0)/taus.length).toFixed(3),
    [0,1,2,3].map(k=>md.filter(x=>x===k).length).join('/'));
  if(process.env.BOOKS) Object.keys(byBook).sort().forEach(b=>
    console.log('      %-16s %3d/%3d = %5.1f%%',b,byBook[b][0],byBook[b][1],100*byBook[b][0]/byBook[b][1]));
});
const both=Object.keys(failed).filter(id=>failed[id].size===readers.length).sort();
console.log('\nmis-ordered by ALL %d readers: %d of %d (%.1f%%)',readers.length,both.length,key.length,100*both.length/key.length);
fs.writeFileSync(path.join(D,'sweep-repair.json'),JSON.stringify(both,null,1));
console.log('  -> sweep-repair.json');
