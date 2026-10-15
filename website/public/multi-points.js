'use strict';
function projectPoints(p){return Array.isArray(p.points)?p.points:(Number.isFinite(p.lat)&&Number.isFinite(p.lng)?[{label:'Titik utama',lat:p.lat,lng:p.lng}]:[])}
function mountPointEditor(form,p){
 form.querySelector('[data-point-editor]')?.remove();
 for(const name of ['lat','lng']){const input=form.elements.namedItem(name);if(input){input.disabled=true;input.closest('label').hidden=true}}
 const box=document.createElement('fieldset');box.className='point-editor';box.dataset.pointEditor='';box.innerHTML='<legend>Titik koordinat proyek</legend><p>Tambahkan satu atau beberapa lokasi. Gunakan derajat desimal: latitude −90–90 dan longitude −180–180. Kosongkan daftar jika lokasi belum tersedia.</p><div data-point-rows></div><button type="button" class="subtle" data-point-add>+ Tambah titik koordinat</button>';
 const actions=form.querySelector('.editor-actions');if(actions)actions.before(box);else form.append(box);
 const add=(p={})=>{const row=document.createElement('div');row.className='point-row';row.innerHTML=`<label>Nama titik<input data-point="label" maxlength="200" placeholder="Contoh: Lokasi pekerjaan 1" value="${escapeHtml(p.label||'')}"></label><label>Latitude<input data-point="lat" type="number" min="-90" max="90" step="any" required value="${p.lat??''}"></label><label>Longitude<input data-point="lng" type="number" min="-180" max="180" step="any" required value="${p.lng??''}"></label><button type="button" class="subtle report-delete">Hapus titik</button>`;row.querySelector('button').onclick=()=>row.remove();mountPointLocation(row,p);mountPointStatus(row,p);mountPointPhoto(row,p);box.querySelector('[data-point-rows]').append(row)};
 projectPoints(p).forEach(point=>add({...point,region:point.region??p.region??'',district:point.district??p.district??''}));box.querySelector('[data-point-add]').onclick=()=>{if(box.querySelectorAll('.point-row').length>=200){alert('Maksimal 200 titik per proyek.');return}add();box.querySelector('.point-row:last-child input').focus()};
}
function mountPointPhoto(row,p){
 row.dataset.photo=p.photo||'';
 const box=document.createElement('div');box.className='point-photo-editor';box.innerHTML='<img class="point-photo-preview" alt="Foto lokasi titik" hidden><div><label>Tambah / ganti foto titik<input type="file" data-point-photo accept="image/jpeg,image/png,image/webp"></label><small>JPG, PNG, atau WebP · Maksimal 5 MB. Foto disimpan bersama perubahan proyek.</small><p data-photo-error role="alert"></p><button type="button" class="subtle report-delete" data-clear-photo>Hapus foto titik</button></div>';
 row.append(box);const input=box.querySelector('input'),preview=box.querySelector('img'),clear=box.querySelector('button');
 const draw=()=>{preview.hidden=!row.dataset.photo;if(row.dataset.photo)preview.src=row.dataset.photo;else preview.removeAttribute('src');clear.hidden=!row.dataset.photo};draw();
 input.onchange=()=>{const file=input.files[0];box.querySelector('[data-photo-error]').textContent='';if(!file){draw();return}if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){box.querySelector('[data-photo-error]').textContent='Pilih JPG, PNG, atau WebP maksimal 5 MB.';input.value='';draw();return}const reader=new FileReader();reader.onload=()=>{if(input.files[0]===file){preview.src=reader.result;preview.hidden=false;clear.hidden=false}};reader.readAsDataURL(file)};
 clear.onclick=()=>{input.value='';row.dataset.photo='';box.querySelector('[data-photo-error]').textContent='';draw()};
}
async function readPointPayload(form){
 const rows=[...form.querySelectorAll('.point-row')];
 const points=rows.map(row=>{const value=k=>row.querySelector(`[data-point="${k}"]`).value.trim(),lat=Number(value('lat')),lng=Number(value('lng'));if(value('lat')===''||value('lng')===''||!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180)throw new Error('Lengkapi latitude dan longitude yang valid pada setiap titik.');const progress=value('progress')===''?null:Number(value('progress')),status=progress===100?'done':value('status');return {label:value('label'),region:value('region'),district:value('district'),lat,lng,progress,status,photo:row.dataset.photo||''}});
 // Capture selections before upload and lock the editor until all photos are ready.
 const files=rows.map(row=>row.querySelector('[data-point-photo]')?.files[0]);
 const controls=[...form.querySelectorAll('[data-point-editor] input,[data-point-editor] select,[data-point-editor] button')],disabled=controls.map(c=>c.disabled);controls.forEach(c=>c.disabled=true);
 try{for(let i=0;i<rows.length;i++){if(!files[i])continue;const body=new FormData();body.set('photo',files[i]);const response=await fetch('/api/photos',{method:'POST',body}),data=await response.json();if(!response.ok)throw new Error(`Foto titik ${i+1}: ${data.error||'Gagal diunggah. Coba kembali.'}`);points[i].photo=data.url;rows[i].dataset.photo=data.url;rows[i].querySelector('[data-point-photo]').value='';}return {points,lat:points[0]?.lat??null,lng:points[0]?.lng??null}}
 finally{controls.forEach((c,i)=>c.disabled=disabled[i])}
}

function legacyReportCard(p){
 const meta=fields=>`<dl class="import-meta">${fields.map(([key,label])=>`<div><dt>${label}</dt><dd>${escapeHtml(importText(p[key]))}</dd></div>`).join('')}</dl>`;
 return `<details class="product-report import-card consultant-report" data-report-id="${escapeHtml(p.id)}"${openConsultantReports.has(p.id)?' open':''}><summary><span><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(importText(p.region))}</small><small>Desa: ${escapeHtml(importText(p.village))}</small></span><span class="report-expand" aria-hidden="true">⌄</span></summary><div class="report-content"><div class="product-heading"><h4>Informasi proyek</h4><div class="report-actions">${monitoringEdit(p)}<button class="subtle" data-coordinate-kind="projects" data-coordinate-id="${escapeHtml(p.id)}">Edit koordinat</button></div></div>${meta([['client','Klien'],['supervisionName','Nama supervisi'],['region','Kabupaten/Kota'],['district','Kecamatan'],['village','Nama desa'],['contractor','Pelaksana'],['end','Tanggal selesai'],['description','Deskripsi']])}<div class="product-heading"><h4>Personel konsultan</h4></div>${meta([['teamLeader','Team leader'],['consultantAdmin','Admin']])}${personnelExpertiseTable(p)}<div class="product-heading"><h4>Produk laporan</h4></div>${productTable(p)}${p.plannerReport?`<p>${escapeHtml(p.plannerReport)}</p>`:''}</div></details>`;
}

function mountPointStatus(row,p){
 const box=document.createElement('div');box.className='point-status-editor';box.innerHTML=`<label>Progres titik<select data-point="progress"><option value="">Belum diisi</option>${[25,50,75,100].map(n=>`<option value="${n}"${p.progress===n?' selected':''}>${n}%</option>`).join('')}</select></label><label>Status progres<select data-point="status"><option value="ongoing">Sedang berjalan</option><option value="late">Terlambat</option><option value="done">Selesai</option></select></label><small>100% berarti selesai. Pada 25–75%, pilih sedang berjalan atau terlambat sesuai kondisi pelaksanaan.</small>`;row.append(box);
 const progress=box.querySelector('[data-point="progress"]'),status=box.querySelector('[data-point="status"]');status.value=p.progress===100?'done':p.status==='late'?'late':'ongoing';
 progress.onchange=()=>{if(progress.value==='100')status.value='done';else if(status.value==='done')status.value='ongoing'};
 status.onchange=()=>{if(status.value==='done')progress.value='100';else if(progress.value==='100')progress.value='75'};
}

function mountPointLocation(row,p){
 const box=document.createElement('div');box.className='point-location-editor';box.innerHTML=`<label>Kabupaten / Kota<select data-point="region">${indonesiaRegionOptions(p.region||'')}</select></label><label>Kecamatan<select data-point="district"></select></label>`;
 row.append(box);bindAdministrativeFields(box.querySelector('[data-point="region"]'),box.querySelector('[data-point="district"]'),p.district||'');
}

function personnelExpertiseTable(p){
 const lines=value=>String(value??'').replace(/\r/g,'').split('\n').map(s=>s.trim());
 const names=lines(p.experts),roles=lines(p.expertise),count=Math.max(names.length,roles.length);
 return `<div class="table-wrap personnel-pairs"><table class="personnel-pairs-table" aria-label="Personel dan tenaga ahli"><thead><tr><th scope="col">Personel</th><th scope="col">Tenaga ahli</th></tr></thead><tbody>${Array.from({length:count},(_,i)=>`<tr><td>${escapeHtml(names[i]||'Belum diisi')}</td><td>${escapeHtml(roles[i]||'Belum diisi')}</td></tr>`).join('')}</tbody></table></div>`;
}
