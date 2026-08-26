/* score an ordering or attribution run against its sample set */
const fs=require('fs'),path=require('path'),D=process.env.RUNGS_OUT||path.join(__dirname,'..','out','rungs');
const kind=process.argv[2], set=process.argv[3], ans=process.argv.slice(4);
const S=JSON.parse(fs.readFileSync(path.join(D,set),'utf8'));
const by={}; S.forEach(x=>by[x.n]=x);
const pairs=(n)=>{const o=[];for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)o.push([i,j]);return o};
const bad={};
ans.forEach(f=>{
  const g={}; JSON.parse(fs.readFileSync(path.join(D,f),'utf8')).forEach(x=>g[x.n]=x);
  if(kind==='order'){
    let pos=0,tot=0,ex=0,taus=[],md=[],miss=[];
    Object.values(by).forEach(b=>{
      const a=b.answer, r=(g[b.n]||{}).order;
      if(!r){tot+=4;miss.push(b.id);return}
      const hit=[0,1,2,3].filter(i=>r[i]===a[i]).length; pos+=hit; tot+=4;
      if(hit===4) ex++; else miss.push(b.id);
      const p=[0,1,2,3].map(i=>r.indexOf(a[i]));
      const c=pairs(4).filter(([i,j])=>p[i]<p[j]).length; taus.push((c-(6-c))/6);
      md.push(Math.max(...[0,1,2,3].map(i=>Math.abs(p[i]-i))));
    });
    miss.forEach(id=>bad[id]=(bad[id]||0)+1);
    console.log('%s  placements %d/%d = %s%%   exact %d/%d = %s%%   tau %s   maxdisp %s',
      f.padEnd(30), pos,tot,(100*pos/tot).toFixed(1), ex,S.length,(100*ex/S.length).toFixed(1),
      (taus.reduce((x,y)=>x+y,0)/taus.length).toFixed(3), [0,1,2,3].map(k=>md.filter(x=>x===k).length).join('/'));
  } else {
    let ok=0, miss=[];
    Object.values(by).forEach(b=>{ const p=((g[b.n]||{}).pick||'').trim();
      if(p===b.answer) ok++; else miss.push(b.id+' r'+b.lv+' (true '+b.answer+', picked '+(p||'blank')+')'); });
    console.log('%s  attribution %d/%d = %s%%', f.padEnd(30), ok,S.length,(100*ok/S.length).toFixed(1));
    miss.forEach(m=>console.log('     miss: '+m));
  }
});
if(kind==='order'&&ans.length>1){
  const both=Object.keys(bad).filter(k=>bad[k]===ans.length).sort();
  console.log('\nmis-ordered by ALL %d runs: %d of %d', ans.length, both.length, S.length);
  console.log('  '+both.join(', '));
  fs.writeFileSync(path.join(D,'ladder-repair.json'), JSON.stringify(both,null,1));
  console.log('  -> ladder-repair.json');
}
