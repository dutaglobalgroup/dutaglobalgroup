'use strict';
const monitoringFilterState={};
const filterKeys=['search','region','sector','year','status','sort'];
function switchMonitoringFilters(view){
 monitoringFilterState[activeMonitoring]=Object.fromEntries(filterKeys.map(key=>[key,$(key).value]));
 populateMonitoringFilterOptions(view);
 activeMonitoring=view;const state=monitoringFilterState[view]||{};
 for(const key of filterKeys)$(key).value=state[key]||(key==='sort'?'priority':'');
 $('filters-'+view).append($('section-filters'));
 const hint=view==='consultants'?'Cari proyek, personil, tenaga ahli, atau produk…':view==='planners'?'Cari proyek atau laporan perencana…':'Cari nama, kode, atau pelaksana proyek…';
 $('search').placeholder=hint;$('search').setAttribute('aria-label',hint);
}
function projectSearchText(p){
 const base=[p.name,p.id,p.region,p.contractor,p.district];
 if(activeMonitoring==='consultants')base.push(p.teamLeader,p.consultantAdmin,p.experts,p.expertise,...consultantProducts(p).flatMap(r=>[r.product,r.status,r.position,r.notes]));
 if(activeMonitoring==='planners')base.push(p.plannerReport);
 return base.filter(Boolean).join(' ').toLowerCase();
}
function setSummaryExpanded(expanded){
 $('summary-subnav').hidden=!expanded;$('mobile-subnav').hidden=!expanded;
 document.querySelectorAll('.summary-toggle').forEach(el=>el.setAttribute('aria-expanded',String(expanded)));
}
document.querySelectorAll('.summary-toggle').forEach(el=>el.addEventListener('click',()=>setSummaryExpanded(el.getAttribute('aria-expanded')!=='true')));
function renderStatusChart(counts){
 const entries=Object.entries(counts),max=Math.max(1,...entries.map(([,n])=>Number(n)||0));
 $('status-chart').innerHTML='<div class="construction-columns dashboard-column-chart" role="list" aria-label="Jumlah paket per status">'+entries.map(([label,value])=>{const n=Number(value)||0;return `<div class="dashboard-chart-column" role="listitem"><div class="dashboard-column-plot"><div class="dashboard-column-fill" style="height:${n/max*100}%;background:${colors[label]||'#a6b5bf'}"><strong>${n}</strong></div></div><span>${escapeHtml(label)}</span></div>`}).join('')+'</div><p class="chart-caption">Jumlah paket · sesuai filter proyek</p>';
}

const monitoringViews=['construction','consultants','planners'];
function selectMonitoring(view,updateHash=false){
 if(!monitoringViews.includes(view))view='construction';
 switchMonitoringFilters(view);
 monitoringViews.forEach(key=>{
  $('monitor-'+key).hidden=key!==view;
  $('tab-'+key).setAttribute('aria-selected',String(key===view));
  $('tab-'+key).tabIndex=key===view?0:-1;
  document.querySelectorAll(`.monitor-subnav [data-monitor="${key}"]`).forEach(el=>el.classList.toggle('active',key===view));
 });
 if(updateHash)history.replaceState(null,'','#monitor-'+view);
 $('add-project').textContent=view==='construction'?'+ Tambah paket':'+ Tambah proyek';
 if(window.dashboardReady)render();
 if(view==='construction')requestAnimationFrame(()=>map?.invalidateSize({pan:false}));
}
document.querySelectorAll('[data-monitor]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();selectMonitoring(el.dataset.monitor,true);if(el.closest('.sidebar'))$('monitor-'+el.dataset.monitor).scrollIntoView({block:'start'})}));
document.querySelector('.monitor-tabs').addEventListener('keydown',e=>{
 const tabs=[...document.querySelectorAll('.monitor-tabs button')],index=tabs.indexOf(document.activeElement);if(index<0)return;
 let next;if(e.key==='ArrowRight')next=(index+1)%tabs.length;else if(e.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=tabs.length-1;else return;
 e.preventDefault();selectMonitoring(tabs[next].dataset.monitor,true);tabs[next].focus();
});
function followMonitoringHash(){const hash=location.hash.slice(1);if(hash.startsWith('monitor-'))selectMonitoring(hash.slice(8));else if(['map-section','projects','overview'].includes(hash)){selectMonitoring('construction');requestAnimationFrame(()=>$(hash)?.scrollIntoView())}}
window.addEventListener('hashchange',followMonitoringHash);
document.querySelectorAll('nav a[href="#map-section"],nav a[href="#projects"]').forEach(el=>el.addEventListener('click',()=>selectMonitoring('construction')));
followMonitoringHash();populateMonitoringFilterOptions(activeMonitoring);
const monitoringValue=value=>value?.trim()?escapeHtml(value):'<span class="missing-value">Belum diisi</span>';
const monitoringEdit=p=>`<button class="subtle" data-monitor-edit="${escapeHtml(p.id)}" aria-label="Edit monitoring ${escapeHtml(p.name)}">Edit proyek</button><button class="subtle report-delete" data-project-kind="projects" data-project-remove="${escapeHtml(p.id)}">Hapus proyek</button>`;
function renderReports(field){return filtered.map(p=>`<article class="report-item"><div><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.region)}</p></div><div class="report-content">${monitoringValue(p[field])}</div>${monitoringEdit(p)}</article>`).join('')||'<p class="monitor-note">Tidak ada proyek yang sesuai dengan filter.</p>'}
function renderMonitoring(){
 const today=jakartaDate();$('deadline-date').textContent=`Per ${today.split('-').reverse().join('/')} · WIB · Mengikuti filter proyek`;
 const values=filtered.map(p=>({p,...projectDeadline(p,today)}));
 const max=Math.max(1,...values.map(v=>Math.abs(v.days||0)));
 $('deadline-chart').innerHTML=values.map(v=>`<article class="deadline-row"><div class="deadline-label"><button class="project-name" data-monitor-detail="${escapeHtml(v.p.id)}"><strong>${escapeHtml(v.p.name)}</strong></button><small>Target: ${escapeHtml(v.p.end||'Belum diisi')}</small></div><div class="deadline-plot"><div class="deadline-status ${v.kind}">${v.label}</div><div class="deadline-track" role="img" aria-label="${escapeHtml(v.p.name)}: ${v.label}"><i class="${v.kind}" style="width:${Math.abs(v.days||0)/max*100}%"></i></div></div>${monitoringEdit(v.p)}</article>`).join('')||'<p class="monitor-note">Tidak ada proyek yang sesuai dengan filter.</p>';
 const fields=[['teamLeader','Team leader'],['consultantAdmin','Admin'],['experts','Personil'],['consultantReport','Laporan']];
 $('consultant-summary').innerHTML=fields.map(([key,label])=>`<article><div>${label}</div><strong>${filtered.filter(p=>key==='consultantReport'?consultantProducts(p).length:p[key]?.trim()).length}<small> / ${filtered.length} proyek</small></strong><small>Proyek dengan data terisi</small></article>`).join('');
 if($('consultant-rows'))$('consultant-rows').innerHTML=filtered.map(p=>`<tr><td><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.region)}</small></td><td class="personnel">${monitoringValue(p.teamLeader)}</td><td class="personnel">${monitoringValue(p.consultantAdmin)}</td><td class="personnel">${monitoringValue(p.experts)}</td><td class="personnel">${monitoringValue(p.expertise)}</td><td>${monitoringEdit(p)}</td></tr>`).join('');
 if($('consultant-empty'))$('consultant-empty').hidden=filtered.length>0;
 $('consultant-reports').innerHTML=renderConsultantProducts();
 $('planner-summary').innerHTML=`<article><div>Laporan perencana</div><strong>${filtered.filter(p=>p.plannerReport?.trim()).length}<small> / ${filtered.length} proyek</small></strong><small>Proyek dengan laporan terisi</small></article>`;
 $('planner-reports').innerHTML=renderReports('plannerReport');
}
document.addEventListener('click',e=>{const edit=e.target.closest('[data-monitor-edit]');if(edit)openEditor(edit.dataset.monitorEdit);const detailButton=e.target.closest('[data-monitor-detail]');if(detailButton)detail(detailButton.dataset.monitorDetail)});
let monitoringDay=jakartaDate();setInterval(()=>{const today=jakartaDate();if(today!==monitoringDay){monitoringDay=today;mapSnapshot="";render();if(typeof updateGeneral==="function")updateGeneral()}},60000);
