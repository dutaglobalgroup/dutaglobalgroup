let activeMonitoring='construction';
'use strict';
// Data dari template_proyek_aceh.csv. Nilai dalam rupiah; plan null berarti belum tersedia.
let projects = [];
const regions=['Aceh Barat','Aceh Barat Daya','Aceh Besar','Aceh Jaya','Aceh Selatan','Aceh Singkil','Aceh Tamiang','Aceh Tengah','Aceh Tenggara','Aceh Timur','Aceh Utara','Bener Meriah','Bireuen','Gayo Lues','Nagan Raya','Pidie','Pidie Jaya','Simeulue','Banda Aceh','Langsa','Lhokseumawe','Sabang','Subulussalam'];
const $=id=>document.getElementById(id), fmt=n=>new Intl.NumberFormat('id-ID',{maximumFractionDigits:1}).format(n), status=p=>p.status;
const money=n=>'Rp '+new Intl.NumberFormat('id-ID',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
const deviation=p=>p.plan===null?'Belum tersedia':`${p.actual>p.plan?'+':''}${fmt(p.actual-p.plan)} pp`;
const colors={Berjalan:'#2b8064',Terlambat:'#dc8a44',Selesai:'#5483b5'};
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
$('region').innerHTML+=regions.map(r=>`<option>${r}</option>`).join('');

let map,layer,filtered=[], markers=new Map();
let activeTiles, tileTimer, tileGeneration=0;
const basemaps=[
 {name:'OpenStreetMap',url:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'},
 {name:'CARTO',url:'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'}
];
function loadBasemap(index=0){
 if(!map)return;const generation=++tileGeneration;clearTimeout(tileTimer);
 if(activeTiles){activeTiles.off();map.removeLayer(activeTiles)}
 $('map-error').hidden=true;$('retry-map').hidden=true;
 let loaded=0,errors=0,cycle=0,switched=false;
 const failed=()=>{if(generation!==tileGeneration||switched)return;if(index+1<basemaps.length){switched=true;loadBasemap(index+1);return}$('map-error').textContent='Peta dasar belum tersedia. Titik lokasi tetap dapat dibuka. Coba lagi.';$('map-error').hidden=false;$('retry-map').hidden=false};
 const source=basemaps[index];
 // Tile providers require the real site origin; override no-referrer only for map images.
 activeTiles=L.tileLayer(source.url,{referrerPolicy:'strict-origin-when-cross-origin',attribution:source.attribution,minZoom:2,maxZoom:19,maxNativeZoom:19,noWrap:true,keepBuffer:3,updateWhenIdle:true,updateWhenZooming:false,errorTileUrl:'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='});
 const current=e=>generation===tileGeneration&&(!e.coords||e.coords.z===Math.round(map.getZoom()));
 activeTiles.on('loading',()=>{loaded=0;errors=0;const c=++cycle;clearTimeout(tileTimer);$('map-error').hidden=true;$('retry-map').hidden=true;tileTimer=setTimeout(()=>{if(c===cycle&&loaded===0)failed()},12000)});
 activeTiles.on('tileload',e=>{if(!current(e))return;loaded++;$('map-error').hidden=true;$('retry-map').hidden=true});
 activeTiles.on('tileerror',e=>{if(current(e))errors++});
 activeTiles.on('load',()=>{clearTimeout(tileTimer);const c=cycle;tileTimer=setTimeout(()=>{if(c!==cycle||generation!==tileGeneration)return;if(errors>0&&(loaded===0||errors>=3))failed()},500)});
 activeTiles.addTo(map);
}
if(window.L){
 map=L.map('map',{zoomControl:false,minZoom:2,maxZoom:19,worldCopyJump:false}).setView([4.307614,96.179031],12);
 L.control.zoom({position:'topright'}).addTo(map);
 layer=L.layerGroup().addTo(map);loadBasemap();
 if(window.ResizeObserver)new ResizeObserver(()=>map.invalidateSize({pan:false})).observe($('map'));
 window.addEventListener('load',()=>map.invalidateSize({pan:false}));
}else{$('map-error').hidden=false;$('map-error').textContent='Komponen peta belum berhasil dimuat. Muat ulang halaman untuk mencoba kembali.';}
$('retry-map').onclick=()=>{loadBasemap();map?.invalidateSize({pan:false});fit()};
const badge=p=>`<span class="badge ${status(p)==='Terlambat'?'late':status(p)==='Selesai'?'done':''}">${status(p)}</span>`;
function track(p){return `<div class="progress-text"><span>${p.actual}%</span><small>${p.plan===null?'Rencana belum tersedia':`Rencana ${p.plan}%`}</small></div><div class="track"><i style="width:${p.actual}%;background:${colors[status(p)]}"></i>${p.plan===null?'':`<b style="left:${p.plan}%" title="Rencana ${p.plan}%"></b>`}</div>`}
function render(){
if(activeMonitoring!=='construction'){renderImportedMonitoring();return}
renderProgressMonitoring();return;

const selectedYear=$('year').value;$('year').innerHTML='<option value="">Semua tahun</option>'+[...new Set(projects.map(p=>p.year))].sort((a,b)=>b-a).map(y=>`<option>${y}</option>`).join('');$('year').value=selectedYear;
const selectedSector=$('sector').value;$('sector').innerHTML='<option value="">Semua jenis pekerjaan</option>'+[...new Set(projects.map(p=>p.sector))].map(s=>`<option>${escapeHtml(s)}</option>`).join('');$('sector').value=selectedSector;
const q=$('search').value.trim().toLowerCase();filtered=projects.filter(p=>(!q||projectSearchText(p).includes(q))&&(!$('region').value||p.region===$('region').value)&&(!$('sector').value||p.sector===$('sector').value)&&(!$('year').value||p.year===Number($('year').value))&&(!$('status').value||status(p)===$('status').value));
const sort=$('sort').value;filtered.sort((a,b)=>sort==='name'?a.name.localeCompare(b.name,'id'):sort==='progress'?b.actual-a.actual:sort==='budget'?b.budget-a.budget:(a.plan===null?Infinity:a.actual-a.plan)-(b.plan===null?Infinity:b.actual-b.plan));
$('export').disabled=filtered.length===0;$('export-pdf').disabled=filtered.length===0;
const n=filtered.length,avg=n?filtered.reduce((a,p)=>a+p.actual,0)/n:0,counts={Berjalan:0,Terlambat:0,Selesai:0};filtered.forEach(p=>counts[status(p)]++);
$('total').textContent=n;$('total-note').textContent=$('region').value||'di seluruh wilayah Aceh';$('budget').textContent=money(filtered.reduce((a,p)=>a+p.budget,0));$('progress').textContent=fmt(avg)+'%';$('avg-bar').style.width=avg+'%';$('late').textContent=counts.Berjalan;$('map-count').textContent=n;$('table-count').textContent=n;
renderStatusChart(counts);
$('status-list').innerHTML=Object.entries(counts).map(([s,c])=>`<div class="status-line"><i class="dot" style="background:${colors[s]}"></i>${s}<strong>${c}</strong><em>${n?Math.round(c/n*100):0}%</em></div>`).join('');$('attention-title').textContent=n?'Data proyek tersimpan online':'Tidak ada proyek terpilih';
$('rows').innerHTML=filtered.map(p=>`<tr><td><button class="project-name" data-id="${p.id}"><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.region)}</small></button></td><td>${escapeHtml(p.sector)}</td><td>${money(p.budget)}</td><td>${track(p)}</td><td class="${p.actual<p.plan?'negative':''}">${deviation(p)}</td><td>${badge(p)}</td><td><div class="row-actions"><button class="edit-project subtle" data-edit="${p.id}">Edit</button><button class="delete-project" data-delete="${p.id}" aria-label="Hapus ${escapeHtml(p.name)}">Hapus</button></div></td></tr>`).join('');$('empty').hidden=!!n;$('result-count').textContent=`Menampilkan ${n} dari ${projects.length} proyek`;
const planned=filtered.filter(p=>p.plan!==null);const planAvg=planned.length?planned.reduce((sum,p)=>sum+p.plan,0)/planned.length:null;
$('progress-summary').innerHTML=`<div class="summary-bar"><span>Realisasi <strong>${n?fmt(avg)+'%':'—'}</strong></span><div><i style="width:${avg}%"></i></div></div><div class="summary-bar planned"><span>Rencana <strong>${planAvg===null?'Belum tersedia':fmt(planAvg)+'%'}</strong></span><div><i style="width:${planAvg||0}%"></i></div></div><small>${planned.length} dari ${n} proyek memiliki progres rencana. Rata-rata rencana dan realisasi bisa mencakup jumlah proyek berbeda.</small>`;
const sectors={};filtered.forEach(p=>sectors[p.sector]=(sectors[p.sector]||0)+p.budget);const max=Math.max(...Object.values(sectors),1);$('sector-summary').innerHTML=Object.entries(sectors).sort((a,b)=>b[1]-a[1]).map(([name,value])=>`<div class="summary-bar"><span>${escapeHtml(name)}<strong>${money(value)}</strong></span><div><i style="width:${value/max*100}%"></i></div></div>`).join('')||'<p class="no-results">Tidak ada proyek terpilih.</p>';
renderMonitoring();
if(layer){layer.clearLayers();markers.clear();filtered.forEach(p=>{const marker=L.marker([p.lat,p.lng],{icon:L.divIcon({className:'pin',html:'',iconSize:[23,23],iconAnchor:[11,11]}),title:p.name}).addTo(layer);marker.getElement()?.style.setProperty('--pin',colors[status(p)]);const content=document.createElement('div');content.innerHTML=`<strong>${escapeHtml(p.name)}</strong><br>${escapeHtml(p.region)} · ${p.actual}%<br>${badge(p)}<br>`;const button=document.createElement('button');button.textContent='Lihat detail';button.className='popup-btn';button.onclick=()=>detail(p.id);content.append(button);marker.bindPopup(content);markers.set(p.id,marker)})}
}
function fit(){if(!map)return;const points=typeof mapItems==='function'?mapItems().filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng)):projects.filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng));if(points.length)map.fitBounds(points.map(p=>[p.lat,p.lng]),{padding:[48,48],maxZoom:12});else map.setView([4.67,96.65],7)}
function detail(id){const p=projects.find(p=>p.id===id);if(!p)return;$('detail-content').innerHTML=`<h2>${escapeHtml(p.name)}</h2><p>${escapeHtml(p.region)}</p>${badge(p)}<dl><dt>Kecamatan</dt><dd>${escapeHtml(p.district)}</dd><dt>Tahun anggaran</dt><dd>${p.year}</dd><dt>Jenis pekerjaan</dt><dd>${escapeHtml(p.sector)}</dd><dt>Nilai kontrak</dt><dd>${money(p.budget)}</dd><dt>Pelaksana</dt><dd>${escapeHtml(p.contractor)}</dd><dt>Target selesai</dt><dd>${escapeHtml(p.end||'Belum tersedia')}</dd><dt>Deviasi progres</dt><dd>${deviation(p)}</dd><dt>Koordinat</dt><dd>${p.lat}, ${p.lng}</dd></dl><div class="detail-progress">${track(p)}</div><p><strong>Deskripsi</strong><br>${escapeHtml(p.description||'Belum tersedia')}</p><p><strong>Foto proyek</strong><br>${p.photo?`<img class="project-photo" src="${escapeHtml(p.photo)}" alt="Foto proyek" loading="lazy">`:'Belum tersedia'}</p><p style="font-size:12px">${p.plan===null?'Progres rencana belum tersedia; deviasi belum dapat dihitung.':'Deviasi = progres realisasi dikurangi progres rencana.'} ${p.updatedAt?'Disimpan: '+new Date(p.updatedAt).toLocaleString('id-ID'):'Data awal dari template_proyek_aceh.csv.'}</p><a class="button" href="https://www.google.com/maps?q=${p.lat},${p.lng}" target="_blank" rel="noopener noreferrer">Buka lokasi di Google Maps</a>`;$('detail').showModal();if(map&&Number.isFinite(p.lat)&&Number.isFinite(p.lng)){map.setView([p.lat,p.lng],10);markers.get(p.id)?.openPopup()}}
$('rows').addEventListener('click',e=>{const del=e.target.closest('[data-delete]');if(del){openDelete(del.dataset.delete);return}const edit=e.target.closest('[data-edit]');if(edit){openEditor(edit.dataset.edit);return}const b=e.target.closest('[data-id]');if(b)detail(b.dataset.id)});$('close').onclick=()=>$('detail').close();$('detail').addEventListener('click',e=>{if(e.target===$('detail')){const r=$('detail').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('detail').close()}});
['region','sector','status','year'].forEach(id=>$(id).addEventListener('change',()=>{render();fit()}));$('search').addEventListener('input',render);$('sort').addEventListener('change',render);$('reset').onclick=()=>{['search','region','sector','status','year'].forEach(id=>$(id).value='');$('sort').value='priority';render();fit()};$('fit').onclick=fit;
document.querySelectorAll('nav a').forEach(a=>a.onclick=()=>{document.querySelectorAll('nav a').forEach(x=>x.classList.remove('active'));a.classList.add('active')});
