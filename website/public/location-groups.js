'use strict';
// Group only recorded, identical coordinates. Never infer missing locations.
function groupProjectLocations(items){
 const buckets=new Map(),groups=[];
 for(const p of items.flatMap(p=>{const points=projectPoints(p);return points.length?points.map((point,i)=>({...p,lat:point.lat,lng:point.lng,region:point.region??p.region,district:point.district??p.district,pointLabel:point.label,pointPhoto:point.photo||'',pointIndex:i,...(Number.isFinite(point.progress)?{actual:point.progress,manualStatus:point.progress===100?'done':point.status==='late'?'late':'ongoing'}:{})})): [{...p,lat:null,lng:null}]})){const located=Number.isFinite(p.lat)&&Number.isFinite(p.lng),eligible=p.label==='Konstruksi'||p.label==='Supervisi';
 const key=located&&eligible?`${p.lat},${p.lng}`:`${p.kind}:${p.id}:${p.pointIndex??"none"}`;
 if(!buckets.has(key)){const g={items:[],lat:p.lat,lng:p.lng,located};buckets.set(key,g);groups.push(g)}buckets.get(key).items.push(p)}
 return groups.map(g=>({...g,label:[...new Set(g.items.map(p=>p.label))].join(' & ')}));
}
