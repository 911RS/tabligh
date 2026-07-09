/* Self-contained control-panel SPA (no build step). Talks to /api/*. */
export const PANEL_HTML = `<!doctype html><html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Tabligh · Control Panel</title>
<style>
:root{--bg:#0b0f14;--card:#141b23;--line:#232c37;--ink:#e8eef4;--dim:#8b98a8;--gold:#fed351;--green:#2ea16a;--red:#e5534b}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
a{color:var(--gold)}button{cursor:pointer;font:inherit}input,select{font:inherit}
.wrap{max-width:1040px;margin:0 auto;padding:20px}
.center{min-height:100vh;display:grid;place-items:center;padding:20px}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:22px}
.card h2{margin:0 0 4px}.muted{color:var(--dim)}
.brand{font-weight:800;font-size:26px}.brand b{color:var(--gold)}
label{display:block;margin:12px 0 4px;font-size:13px;color:var(--dim)}
input,select{width:100%;padding:10px 12px;background:#0e141b;border:1px solid var(--line);border-radius:9px;color:var(--ink)}
.btn{background:var(--gold);color:#1a1206;border:0;border-radius:9px;padding:10px 16px;font-weight:700}
.btn.ghost{background:transparent;color:var(--ink);border:1px solid var(--line)}
.btn.sm{padding:7px 12px;font-size:13px}
.row{display:flex;gap:12px;flex-wrap:wrap}.row>*{flex:1;min-width:120px}
.nav{display:flex;gap:6px;margin:0 0 18px;flex-wrap:wrap}
.nav button{background:transparent;border:1px solid var(--line);color:var(--dim);border-radius:999px;padding:7px 16px}
.nav button.on{background:var(--gold);color:#1a1206;border-color:var(--gold);font-weight:700}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}@media(max-width:760px){.grid{grid-template-columns:1fr}}
.tag{display:inline-block;padding:2px 9px;border-radius:999px;font-size:12px;font-weight:600}
.tag.ok{background:rgba(46,161,106,.15);color:#5fd39b}.tag.no{background:rgba(229,83,75,.15);color:#f0827b}
table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:9px 8px;border-bottom:1px solid var(--line);font-size:14px}
th{color:var(--dim);font-weight:600}
video{width:100%;border-radius:12px;background:#000;margin-top:12px;max-height:70vh}
.toast{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:var(--card);border:1px solid var(--line);padding:11px 18px;border-radius:10px;opacity:0;transition:.3s}
.toast.show{opacity:1}.switch{display:flex;align-items:center;gap:8px}
h3{margin:22px 0 4px;font-size:14px;letter-spacing:.4px;text-transform:uppercase;color:var(--gold)}
</style></head>
<body><div id="app" class="center"><div class="muted">Loading…</div></div><div id="toast" class="toast"></div>
<script>
const $=(h)=>{const d=document.createElement('div');d.innerHTML=h.trim();return d.firstElementChild};
const app=document.getElementById('app');
let S={}, SET={};
async function api(p,m,b){const r=await fetch(p,{method:m||'GET',headers:b?{'content-type':'application/json'}:{},body:b?JSON.stringify(b):undefined});const t=await r.text();let j={};try{j=t?JSON.parse(t):{}}catch{}if(!r.ok)throw new Error(j.error||r.status);return j}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
const esc=(s)=>String(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

async function boot(){ S=await api('/api/status'); if(!S.setupComplete) return setupView(); if(!S.authed) return loginView(); await loadSettings(); dash('dashboard'); }
async function loadSettings(){ SET=await api('/api/settings'); _minio=SET.minioPublic||{}; }

function loginView(){
  app.className='center';
  app.innerHTML='';app.append($(\`<div class="card" style="width:360px"><div class="brand">🕌 <b>Tabligh</b></div><p class="muted">Enter your control-panel password.</p><label>Password</label><input id="pw" type="password"/><div style="margin-top:16px"><button class="btn" style="width:100%" id="go">Sign in</button></div></div>\`));
  const go=async()=>{try{await api('/api/login','POST',{password:document.getElementById('pw').value});location.reload()}catch(e){toast(e.message)}};
  document.getElementById('go').onclick=go; document.getElementById('pw').onkeydown=e=>e.key==='Enter'&&go();
}
function setupView(){
  app.className='center';
  app.innerHTML='';app.append($(\`<div class="card" style="width:460px"><div class="brand">🕌 <b>Tabligh</b> · Setup</div><p class="muted">Create a password for this panel. You can add API keys later in Settings.</p>
  <label>Panel password</label><input id="pw" type="password"/>
  <label>Timezone</label><input id="tz" value="Africa/Tunis"/>
  <label>Post times (comma-separated HH:MM)</label><input id="times" value="07:00,13:00,19:00"/>
  <div style="margin-top:16px"><button class="btn" style="width:100%" id="go">Create panel</button></div></div>\`));
  document.getElementById('go').onclick=async()=>{try{
    await api('/api/setup','POST',{password:document.getElementById('pw').value,settings:{schedule:{tz:document.getElementById('tz').value,times:document.getElementById('times').value.split(',').map(x=>x.trim()).filter(Boolean),enabled:true}}});
    location.reload()}catch(e){toast(e.message)}};
}

function shell(active,body){
  app.className='';
  app.innerHTML='';
  app.append($(\`<div class="wrap">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div class="brand">🕌 <b>Tabligh</b></div>
      <button class="btn ghost sm" id="logout">Sign out</button></div>
    <div class="nav">\${['dashboard','generate','settings','history'].map(v=>\`<button data-v="\${v}" class="\${v===active?'on':''}">\${v[0].toUpperCase()+v.slice(1)}</button>\`).join('')}</div>
    <div id="body"></div></div>\`));
  document.getElementById('logout').onclick=async()=>{await api('/api/logout','POST');location.reload()};
  app.querySelectorAll('.nav button').forEach(b=>b.onclick=()=>dash(b.dataset.v));
  document.getElementById('body').append(body);
}
function dash(v){ if(v==='dashboard')return viewDashboard(); if(v==='generate')return viewGenerate(); if(v==='settings')return viewSettings(); if(v==='history')return viewHistory(); }

async function viewDashboard(){
  S=await api('/api/status');
  const sp=S.secretsPresent;
  const body=$(\`<div>
    <div class="grid">
      <div class="card"><h2>Status</h2>
        <p>Scheduler: <span class="tag \${S.schedule.enabled?'ok':'no'}">\${S.schedule.enabled?'on':'off'}</span> · \${esc(S.schedule.times.join(', '))} <span class="muted">\${esc(S.schedule.tz)}</span></p>
        <p>Publishing: <span class="tag \${S.publishConfigured?'ok':'no'}">\${S.publishConfigured?'configured':'not configured'}</span></p>
        <p>Runner: <span class="muted" id="st">\${esc(S.status)}</span></p>
        <div style="margin-top:10px"><button class="btn" id="gen">Generate now</button> <button class="btn ghost" id="genpub" \${S.publishConfigured?'':'disabled'}>Generate + publish</button></div>
      </div>
      <div class="card"><h2>Keys</h2>
        <p>Pexels <span class="tag \${sp.pexels?'ok':'no'}">\${sp.pexels?'set':'—'}</span> · Unsplash <span class="tag \${sp.unsplash?'ok':'no'}">\${sp.unsplash?'set':'—'}</span></p>
        <p>Buffer <span class="tag \${sp.buffer?'ok':'no'}">\${sp.buffer?'set':'—'}</span> · Storage <span class="tag \${sp.minio?'ok':'no'}">\${sp.minio?'set':'—'}</span></p>
      </div>
    </div>
    <div class="card" style="margin-top:16px"><h2>Latest preview</h2><video id="prev" controls></video><p class="muted" id="pmsg"></p></div></div>\`);
  shell('dashboard',body);
  loadPreview();
  const run=async(pub)=>{try{await api('/api/generate','POST',{publish:pub});toast('Started — rendering…');pollStatus()}catch(e){toast(e.message)}};
  document.getElementById('gen').onclick=()=>run(false);
  document.getElementById('genpub').onclick=()=>run(true);
}
function loadPreview(){const v=document.getElementById('prev');if(v)v.src='/api/preview?t='+Date.now();}
async function pollStatus(){for(let i=0;i<90;i++){await new Promise(r=>setTimeout(r,3000));try{const s=await api('/api/status');const st=document.getElementById('st');if(st)st.textContent=s.status;if(!s.busy){toast('Done');loadPreview();return}}catch{}}}

function viewGenerate(){
  const body=$(\`<div class="card"><h2>Generate a reel</h2><p class="muted">Leave surah empty for a random passage.</p>
    <div class="row"><div><label>Surah (1–114)</label><input id="surah" type="number" min="1" max="114"/></div>
    <div><label>From ayah</label><input id="from" type="number" min="1"/></div>
    <div><label>To ayah</label><input id="to" type="number" min="1"/></div></div>
    <label>Reciter</label><input id="reciter" placeholder="husary, minshawy, abdulbasit…"/>
    <div class="switch" style="margin-top:12px"><input type="checkbox" id="pub" style="width:auto"/> <label style="margin:0">Publish after render</label></div>
    <div style="margin-top:16px"><button class="btn" id="go">Generate</button></div>
    <video id="prev" controls></video><p class="muted" id="st"></p></div>\`);
  shell('generate',body);
  document.getElementById('go').onclick=async()=>{
    const b={publish:document.getElementById('pub').checked};
    const s=document.getElementById('surah').value; if(s){b.surah=+s;b.from=+document.getElementById('from').value||1;b.to=+document.getElementById('to').value||b.from;}
    const r=document.getElementById('reciter').value; if(r)b.reciter=r;
    try{await api('/api/generate','POST',b);toast('Rendering…');const st=document.getElementById('st');
      for(let i=0;i<90;i++){await new Promise(x=>setTimeout(x,3000));const s2=await api('/api/status');st.textContent=s2.status;if(!s2.busy){document.getElementById('prev').src='/api/preview?t='+Date.now();toast('Done');break}}}
    catch(e){toast(e.message)}};
}

function field(label,id,val,type){return \`<label>\${label}</label><input id="\${id}" type="\${type||'text'}" value="\${esc(val)}"/>\`}
function viewSettings(){
  const s=SET;
  const body=$(\`<div>
    <div class="card"><h3>Schedule</h3>
      <div class="switch"><input type="checkbox" id="sch_en" style="width:auto" \${s.schedule.enabled?'checked':''}/> <label style="margin:0">Scheduler enabled</label></div>
      \${field('Timezone','sch_tz',s.schedule.tz)}\${field('Times (HH:MM, comma)','sch_times',s.schedule.times.join(','))}</div>
    <div class="card" style="margin-top:14px"><h3>Content</h3>
      <div class="row"><div>\${field('Translation edition','c_tr',s.content.translationEdition)}</div>
      <div>\${field('Min ayahs','c_min',s.content.randomMinAyahs,'number')}</div>
      <div>\${field('Max ayahs','c_max',s.content.randomMaxAyahs,'number')}</div></div></div>
    <div class="card" style="margin-top:14px"><h3>Branding</h3>
      <div class="switch"><input type="checkbox" id="b_kar" style="width:auto" \${s.branding.karaokeEnabled?'checked':''}/> <label style="margin:0">Karaoke fill</label></div>
      <div class="switch" style="margin-top:8px"><input type="checkbox" id="b_wm" style="width:auto" \${s.branding.watermarkEnabled?'checked':''}/> <label style="margin:0">Corner logo watermark</label></div>
      <div class="row">\${field('Fill color','b_fill',s.branding.textFillColor||'#ffffff')}\${field('Watermark handle','b_h',s.branding.watermarkHandle)}</div>
      \${field('Outro text','b_out',s.branding.outroText)}</div>
    <div class="card" style="margin-top:14px"><h3>Publishing channels (Buffer)</h3>
      \${['tiktok','instagram','facebook','youtube'].map(p=>field(p+' channel ids','p_'+p,(s.publish.channels[p]||[]).join(','))).join('')}</div>
    <div class="card" style="margin-top:14px"><h3>API keys & storage</h3><p class="muted">Leave blank to keep the current value.</p>
      <div class="row">\${field('Pexels API key','k_px','','password')}\${field('Unsplash key','k_us','','password')}</div>
      \${field('Buffer access token','k_bf','','password')}
      <div class="row">\${field('Storage endpoint','m_ep',secretsMinio().endpoint||'')}\${field('Port','m_port',secretsMinio().port||9000,'number')}</div>
      <div class="row">\${field('Access key','m_ak','','password')}\${field('Secret key','m_sk','','password')}</div>
      <div class="row">\${field('Bucket','m_bk',secretsMinio().bucket||'tabligh')}\${field('Public URL','m_url',secretsMinio().publicUrl||'')}</div></div>
    <div style="margin:18px 0"><button class="btn" id="save">Save all settings</button></div></div>\`);
  shell('settings',body);
  document.getElementById('save').onclick=save;
}
let _minio={};function secretsMinio(){return _minio}
function save(){
  const g=(id)=>document.getElementById(id);
  const patch={schedule:{enabled:g('sch_en').checked,tz:g('sch_tz').value,times:g('sch_times').value.split(',').map(x=>x.trim()).filter(Boolean)},
    content:{translationEdition:g('c_tr').value,randomMinAyahs:+g('c_min').value,randomMaxAyahs:+g('c_max').value},
    branding:{karaokeEnabled:g('b_kar').checked,watermarkEnabled:g('b_wm').checked,textFillColor:g('b_fill').value,watermarkHandle:g('b_h').value,outroText:g('b_out').value},
    publish:{channels:{tiktok:ids('p_tiktok'),instagram:ids('p_instagram'),facebook:ids('p_facebook'),youtube:ids('p_youtube')}}};
  const sec={};if(g('k_px').value)sec.pexelsKey=g('k_px').value;if(g('k_us').value)sec.unsplashKey=g('k_us').value;if(g('k_bf').value)sec.bufferToken=g('k_bf').value;
  const m={endpoint:g('m_ep').value,port:+g('m_port').value,bucket:g('m_bk').value,publicUrl:g('m_url').value};if(g('m_ak').value)m.accessKey=g('m_ak').value;if(g('m_sk').value)m.secretKey=g('m_sk').value;sec.minio=m;
  Promise.all([api('/api/settings','PUT',patch),api('/api/secrets','PUT',sec)]).then(async()=>{await loadSettings();toast('Saved')}).catch(e=>toast(e.message));
  function ids(id){return g(id).value.split(',').map(x=>x.trim()).filter(Boolean)}
}

async function viewHistory(){
  const posts=await api('/api/history');
  const rows=posts.map(p=>\`<tr><td>\${esc(p.ts.replace('T',' ').slice(0,16))}</td><td>\${esc(p.surah)}:\${esc(p.ayahFrom)}-\${esc(p.ayahTo)}</td><td>\${esc(p.reciterName||p.reciter)}</td><td><span class="tag \${p.status==='published'?'ok':p.status==='failed'?'no':''}">\${esc(p.status)}</span></td><td class="muted">\${esc((p.postIds||[]).join(', '))}</td></tr>\`).join('');
  const body=$(\`<div class="card"><h2>History</h2><table><thead><tr><th>When</th><th>Passage</th><th>Reciter</th><th>Status</th><th>Post ids</th></tr></thead><tbody>\${rows||'<tr><td colspan=5 class=muted>No posts yet.</td></tr>'}</tbody></table></div>\`);
  shell('history',body);
}

boot().catch(e=>{app.innerHTML='<div class="muted">'+esc(e.message)+'</div>'});
</script></body></html>`;
