const $ = id => document.getElementById(id);
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2400)}
function go(page){
 document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id===page));
 document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x.dataset.page===page));
 const titles={home:'Good morning 👋',academic:'Academic Rescue',navigator:'Campus Navigator',lost:'Lost & Found'};
 $('page-title').textContent=titles[page]||'CampusMate';
 if(page==='academic')loadTasks();if(page==='navigator')loadLocations();if(page==='lost')loadReports();
}
document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.page)));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));

$('analyze').addEventListener('click',async()=>{
 const notice=$('notice').value.trim();if(!notice)return toast('Paste a notice first.');
 const btn=$('analyze');btn.disabled=true;btn.textContent='Analyzing…';
 try{
  const r=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({notice})});const d=await r.json();if(!r.ok)throw Error(d.error);
  const dates=d.dates.length?d.dates.map(x=>`<span class="date-chip">${escapeHtml(x)}</span>`).join(''):'<span class="muted">No recognizable dates found.</span>';
  const points=d.key_points.map(x=>`<li>${escapeHtml(x)}</li>`).join('')||'<li>No action keywords found. Review the notice manually.</li>';
  $('analysis-result').innerHTML=`<div class="result-block"><span class="eyebrow">DETECTED NOTICE</span><h4>${escapeHtml(d.title)}</h4><h4>Important dates</h4><div>${dates}</div><h4>Key action points</h4><ul>${points}</ul><div class="save-row"><input id="task-title" placeholder="Task to save (e.g. Submit assignment)"><button class="primary" id="save-task">Save task</button></div></div>`;
  $('save-task').addEventListener('click',saveTask);
 }catch(e){toast(e.message||'Could not analyze notice.')}finally{btn.disabled=false;btn.innerHTML='Analyze notice <span>→</span>'}
});
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
async function saveTask(){
 const title=$('task-title').value.trim();if(!title)return toast('Enter a task name.');
 const source=$('notice').value.slice(0,250);
 const r=await fetch('/api/tasks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title,source})});const d=await r.json();if(!r.ok)return toast(d.error);
 toast('Task saved!');loadTasks();
}
async function loadTasks(){
 const r=await fetch('/api/tasks');const rows=await r.json();
 $('tasks-list').innerHTML=rows.length?rows.map(x=>`<div class="task-item"><b>${escapeHtml(x.title)}</b><small>Saved ${escapeHtml(x.created_at||'')}</small></div>`).join(''):'<p class="muted">No saved tasks yet. Analyze a notice and save an action point.</p>';
}
$('refresh-tasks').addEventListener('click',loadTasks);
async function loadLocations(){
 const r=await fetch('/api/locations');const rows=await r.json();renderLocations(rows);
}
function renderLocations(rows){
 $('locations-list').innerHTML=rows.length?rows.map(x=>`<div class="location-card"><b>⌖ ${escapeHtml(x.name)}</b><p>${escapeHtml(x.hint)}</p><span>${escapeHtml(x.type)}</span></div>`).join(''):'<p class="muted">No matching places.</p>';
}
$('location-search').addEventListener('input',async e=>{
 const r=await fetch('/api/locations');const rows=await r.json();const q=e.target.value.toLowerCase();
 renderLocations(rows.filter(x=>(x.name+' '+x.type+' '+x.hint).toLowerCase().includes(q)));
});
$('post-report').addEventListener('click',async()=>{
 const payload={item:$('item').value,category:$('category').value,place:$('place').value,details:$('details').value,status:$('report-status').value};
 const r=await fetch('/api/reports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const d=await r.json();if(!r.ok)return toast(d.error);
 ['item','category','place','details'].forEach(id=>$(id).value='');toast('Report posted!');loadReports();
});
async function loadReports(q=''){
 const r=await fetch('/api/reports?q='+encodeURIComponent(q));const rows=await r.json();
 $('reports-list').innerHTML=rows.length?rows.map(x=>`<div class="report-item"><span class="tag ${x.status==='Lost'?'lost':''}">${escapeHtml(x.status)}</span> <b>${escapeHtml(x.item)}</b><p>${escapeHtml(x.category||'Other')} · ${escapeHtml(x.place||'Location not specified')}</p><small>${escapeHtml(x.details||'No extra details')}</small></div>`).join(''):'<p class="muted">No reports yet. Add the first one!</p>';
}
$('report-search').addEventListener('input',e=>loadReports(e.target.value));
loadTasks();
