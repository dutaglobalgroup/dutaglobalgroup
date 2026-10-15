let planningHistoryEditing=null;
const planningHistoryFields=[['period','Periode','date'],['name','Proyek / paket','text'],['start','Mulai kontrak','date'],['end','Akhir kontrak','date'],['coordinator','Koordinator','text'],['week','Minggu','number'],['plan','Rencana (%)','number'],['actual','Realisasi (%)','number']];
function openPlanningHistory(id,index){
 if(!signedIn){openAuth(()=>openPlanningHistory(id,index));return}
 const p=importedRecords.find(p=>p.id===id),entry=p?.history?.[index];if(!entry)return;
 planningHistoryEditing={id,revision:p.revision,index};
 $('history-fields').innerHTML=planningHistoryFields.map(([key,label,type])=>`<label>${label}<input name="${key}" type="${type}" value="${escapeHtml(type==='date'&&!/^\d{4}-\d{2}-\d{2}$/.test(entry[key]||'')?'':entry[key]??'')}" ${['name','period'].includes(key)?'required':''} ${type==='number'?`min="0" max="${key==='week'?1000:100}" step="${key==='week'?1:'any'}"`:'maxlength="5000"'}></label>`).join('')+'<label>Deviasi (pp)<output id="history-deviation"></output></label>';
 $('history-error').textContent='';$('history-form').oninput=updatePlanningDeviation;updatePlanningDeviation();$('history-editor').showModal();
}
function updatePlanningDeviation(){const f=$('history-form'),a=f.elements.actual.value,p=f.elements.plan.value;$('history-deviation').textContent=a===''||p===''?'—':importNumber(Math.round((Number(a)-Number(p))*1e6)/1e6)}
document.addEventListener('click',e=>{const b=e.target.closest('[data-history-project]');if(b)openPlanningHistory(b.dataset.historyProject,Number(b.dataset.historyIndex))});
$('history-close').onclick=$('history-cancel').onclick=()=>{if(!$('history-save').disabled)$('history-editor').close()};
$('history-editor').addEventListener('cancel',e=>{if($('history-save').disabled)e.preventDefault()});
$('history-form').onsubmit=async e=>{
 e.preventDefault();const form=e.currentTarget;if(!form.reportValidity())return;
 const button=$('history-save');button.disabled=true;button.textContent='Menyimpan…';$('history-error').textContent='';importedEpoch++;
 try{
  const entry=Object.fromEntries(planningHistoryFields.map(([k,,type])=>[k,type==='number'?(form.elements[k].value===''?null:Number(form.elements[k].value)):form.elements[k].value.trim()]));
  const r=await fetch('/api/monitoring',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({...planningHistoryEditing,entry})}),data=await r.json();if(!r.ok)throw new Error(data.error||'Belum tersimpan.');
  importedEpoch++;const i=importedRecords.findIndex(p=>p.id===data.record.id);if(i>=0)importedRecords[i]=data.record;
  if(importPeriods.planners&&!data.record.history.some(h=>h.period===importPeriods.planners))importPeriods.planners='';
  if(activeMonitoring!=='construction')renderImportedMonitoring();projectChannel?.postMessage('saved');$('history-editor').close();$('data-status').textContent='Progres perencanaan berhasil disimpan.';
 }catch(e){$('history-error').textContent=e.message}finally{button.disabled=false;button.textContent='Simpan perubahan'}
};
