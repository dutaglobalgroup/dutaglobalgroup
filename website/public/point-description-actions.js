/* EDIT MODULE: point-description-actions.js */
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-edit-point-description]');if(!button)return;
 openCoordinates(button.dataset.pointKind,button.dataset.pointProject);
 const row=document.querySelectorAll('#coordinate-form .point-row')[Number(button.dataset.editPointDescription)];
 if(row){const editor=row.querySelector('.point-description-editor');const toggle=editor?.querySelector('button');if(toggle?.getAttribute('aria-expanded')==='false')toggle.click();row.scrollIntoView({block:'nearest',behavior:'smooth'});editor?.querySelector('textarea')?.focus()}
});
