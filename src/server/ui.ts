/* Premium self-contained control-panel SPA (Ubuntu, dark, no build step). */

const MARK = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="18" r="2" fill="currentColor" stroke="none"/><path d="M6 12a6 6 0 0 1 6 6"/><path d="M6 6a12 12 0 0 1 12 12"/></svg>`;
const ICON = (p: string) => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const ICONS = {
  dashboard: ICON('<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>'),
  generate: ICON('<path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="9"/>'),
  schedule: ICON('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  queue: ICON('<path d="M4 6h16M4 12h16M4 18h10"/>'),
  history: ICON('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 8v4l3 2"/>'),
  analytics: ICON('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
};

export function renderPanel(f: { regular: string; medium: string; bold: string }, icon = ''): string {
  const brandMark = icon
    ? `<img src="data:image/png;base64,${icon}" width="26" height="26" style="border-radius:7px;display:block"/>`
    : MARK;
  const favicon = icon ? `<link rel="icon" type="image/png" href="data:image/png;base64,${icon}"/>` : '';
  const iconSrc = icon ? `data:image/png;base64,${icon}` : '';
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Tabligh</title>${favicon}
<style>
@font-face{font-family:'Ubuntu';src:url(data:font/ttf;base64,${f.regular}) format('truetype');font-weight:400;font-display:swap}
@font-face{font-family:'Ubuntu';src:url(data:font/ttf;base64,${f.medium}) format('truetype');font-weight:500;font-display:swap}
@font-face{font-family:'Ubuntu';src:url(data:font/ttf;base64,${f.bold}) format('truetype');font-weight:700;font-display:swap}
:root{--bg:#0a0c10;--surface:#12161d;--surface2:#171d26;--border:#232b36;--soft:#1b222c;--text:#e7ecf3;--dim:#8b97a7;--faint:#586374;--gold:#fed351;--goldd:rgba(254,211,81,.13);--green:#34d399;--red:#f87171;--r:12px}
*{box-sizing:border-box}html,body{margin:0;height:100%}
body{background:var(--bg);color:var(--text);font-family:'Ubuntu',system-ui,sans-serif;font-size:14.5px;-webkit-font-smoothing:antialiased}
a{color:var(--gold);text-decoration:none}
button{font-family:inherit;cursor:pointer}
::selection{background:var(--goldd)}
.mark{color:var(--gold);display:flex}
.brand{display:flex;align-items:center;gap:10px;font-weight:700;font-size:19px;letter-spacing:-.2px}
/* auth screens */
.center{min-height:100%;display:grid;place-items:center;padding:24px}
.auth{width:380px;max-width:100%;background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:28px;box-shadow:0 24px 60px -20px rgba(0,0,0,.6)}
.auth h1{font-size:16px;margin:18px 0 4px}.sub{color:var(--dim);font-size:13.5px;margin:0 0 6px}
.authbrand{display:flex;flex-direction:column;align-items:center;gap:14px;margin-bottom:12px}
.authicon{width:80px;height:80px;border-radius:20px;display:block}
.authname{font-weight:700;font-size:22px;letter-spacing:-.3px}
.auth h1{text-align:center;font-size:17px;margin:14px 0 4px}.auth .sub{text-align:center}
/* app shell */
.shell{display:grid;grid-template-columns:248px 1fr;min-height:100vh}
.side{background:var(--surface);border-right:1px solid var(--border);padding:22px 16px;display:flex;flex-direction:column;gap:6px;position:sticky;top:0;height:100vh}
.side .brand{padding:4px 8px 18px}
.nav{display:flex;align-items:center;gap:11px;padding:10px 12px;border-radius:10px;color:var(--dim);font-weight:500;border:1px solid transparent;transition:.15s;width:100%;background:none;text-align:left}
.nav:hover{background:var(--soft);color:var(--text)}
.nav.on{background:var(--goldd);color:var(--gold);border-color:rgba(254,211,81,.25)}
.nav svg{opacity:.9}
.spacer{flex:1}
.langsel{width:calc(100% - 24px);margin:6px 12px;padding:7px 10px;font-size:12.5px}
.credit{display:block;padding:12px 12px 2px;font-size:11px;color:var(--faint);letter-spacing:.3px}
.credit:hover{color:var(--dim)}
.main{padding:34px 40px;max-width:1080px;width:100%}
.head{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:24px}
.head h1{font-size:23px;margin:0;letter-spacing:-.4px}.head p{margin:4px 0 0;color:var(--dim);font-size:13.5px}
/* cards + tiles */
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:20px}
.card+.card{margin-top:16px}
.card h3{margin:0 0 14px;font-size:12px;font-weight:600;letter-spacing:.7px;text-transform:uppercase;color:var(--faint)}
.grid{display:grid;gap:16px}.g2{grid-template-columns:1fr 1fr}.g3{grid-template-columns:repeat(3,1fr)}.g4{grid-template-columns:repeat(4,1fr)}
@media(max-width:820px){.shell{grid-template-columns:1fr}.side{position:static;height:auto;flex-direction:row;overflow:auto}.g2,.g3,.g4{grid-template-columns:1fr}.main{padding:22px}}
.tile{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:18px}
.tile .k{color:var(--dim);font-size:12.5px;font-weight:500}.tile .v{font-size:30px;font-weight:700;margin-top:6px;letter-spacing:-.5px}
.tile .v.g{color:var(--gold)}.tile .v.gr{color:var(--green)}.tile .v.rd{color:var(--red)}
/* form */
label{display:block;margin:14px 0 6px;font-size:12.5px;color:var(--dim);font-weight:500}
input,select{width:100%;padding:11px 13px;background:#0c1117;border:1px solid var(--border);border-radius:10px;color:var(--text);font-family:inherit;font-size:14px;transition:.15s}
input:focus,select:focus{outline:none;border-color:var(--gold);box-shadow:0 0 0 3px var(--goldd)}
input[type=time]{width:auto}
.row{display:flex;gap:12px;flex-wrap:wrap}.row>.f{flex:1;min-width:130px}
.btn{background:var(--gold);color:#1c1403;border:0;border-radius:10px;padding:11px 18px;font-weight:700;font-size:14px;transition:.15s}
.btn:hover{filter:brightness(1.06)}.btn:active{transform:translateY(1px)}.btn:disabled{opacity:.45;cursor:not-allowed}
.btn.ghost{background:transparent;color:var(--text);border:1px solid var(--border)}.btn.ghost:hover{background:var(--soft)}
.btn.sm{padding:8px 13px;font-size:13px}
.btn.danger{background:transparent;color:var(--red);border:1px solid rgba(248,113,113,.3)}
/* switch */
.sw{display:inline-flex;align-items:center;gap:10px;cursor:pointer;user-select:none}
.sw input{display:none}.sw .track{width:40px;height:23px;background:var(--border);border-radius:999px;position:relative;transition:.2s}
.sw .track:after{content:'';position:absolute;top:3px;left:3px;width:17px;height:17px;border-radius:50%;background:#fff;transition:.2s}
.sw input:checked+.track{background:var(--gold)}.sw input:checked+.track:after{transform:translateX(17px)}
/* chips (times) */
.chips{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.chip{display:inline-flex;align-items:center;gap:6px;background:var(--surface2);border:1px solid var(--border);border-radius:999px;padding:5px 6px 5px 12px}
.chip input{background:none;border:0;color:var(--text);padding:2px;width:74px}.chip input:focus{box-shadow:none}
.chip .x{background:none;border:0;color:var(--faint);font-size:16px;line-height:1;padding:0 4px}.chip .x:hover{color:var(--red)}
.addbtn{background:var(--soft);border:1px dashed var(--border);color:var(--dim);border-radius:999px;padding:7px 14px;font-size:13px}
/* misc */
.tag{display:inline-flex;padding:3px 10px;border-radius:999px;font-size:11.5px;font-weight:600}
.tag.ok{background:rgba(52,211,153,.14);color:var(--green)}.tag.no{background:rgba(248,113,113,.14);color:var(--red)}.tag.n{background:var(--soft);color:var(--dim)}
table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:11px 10px;border-bottom:1px solid var(--soft);font-size:13.5px}
th{color:var(--faint);font-weight:600;font-size:11.5px;letter-spacing:.4px;text-transform:uppercase}
video{width:100%;border-radius:12px;background:#000;max-height:66vh;margin-top:8px}
.logbox{background:#0c1117;border:1px solid var(--border);border-radius:10px;padding:14px;font-family:ui-monospace,monospace;font-size:12px;color:var(--dim);max-height:320px;overflow:auto;white-space:pre-wrap}
.toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%) translateY(8px);background:var(--surface2);border:1px solid var(--border);padding:12px 20px;border-radius:11px;opacity:0;transition:.25s;box-shadow:0 12px 30px -8px rgba(0,0,0,.5);z-index:50}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
.fade{animation:f .3s ease}@keyframes f{from{opacity:0;transform:translateY(6px)}to{opacity:1}}
</style></head>
<body><div id="app" class="center"><div class="sub">Loading…</div></div><div id="toast" class="toast"></div>
<script>
const MARK=\`${brandMark}\`, IC=${JSON.stringify(ICONS)};
const ICON_SRC=${JSON.stringify(iconSrc)};
function authBrand(){return '<div class="authbrand">'+(ICON_SRC?'<img class="authicon" src="'+ICON_SRC+'"/>':'<span class="mark">'+MARK+'</span>')+'<div class="authname">Tabligh</div></div>'}
const el=(h)=>{const d=document.createElement('div');d.innerHTML=h.trim();return d.firstElementChild};
const app=document.getElementById('app');const esc=(s)=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const T={en:{dashboard:'Dashboard',generate:'Generate',settings:'Settings',queue:'Queue',history:'History',analytics:'Analytics',signout:'Sign out',welcome:'Welcome back',signin_sub:'Sign in to your control panel.',password:'Password',signin:'Sign in',lang:'Language'},
ar:{dashboard:'الرئيسية',generate:'إنشاء',settings:'الإعدادات',queue:'قائمة الانتظار',history:'السجل',analytics:'التحليلات',signout:'تسجيل الخروج',welcome:'مرحباً بعودتك',signin_sub:'سجّل الدخول إلى لوحة التحكم.',password:'كلمة المرور',signin:'دخول',lang:'اللغة'},
fr:{dashboard:'Tableau de bord',generate:'Générer',settings:'Paramètres',queue:'File',history:'Historique',analytics:'Analytique',signout:'Déconnexion',welcome:'Bon retour',signin_sub:'Connectez-vous à votre panneau.',password:'Mot de passe',signin:'Se connecter',lang:'Langue'}};
let LANG=localStorage.getItem('lang')||'en';
const t=(k)=>(T[LANG]&&T[LANG][k])||T.en[k]||k;
function applyLang(){document.documentElement.lang=LANG;document.documentElement.dir=LANG==='ar'?'rtl':'ltr'}
function setLang(l){LANG=l;localStorage.setItem('lang',l);applyLang();boot()}

let S={},SET={},_minio={};
function tzSel(id,val){const zs=(Intl.supportedValuesOf&&Intl.supportedValuesOf('timeZone'))||[val||'UTC'];if(val&&!zs.includes(val))zs.unshift(val);return '<select id="'+id+'">'+zs.map(z=>'<option '+(z===val?'selected':'')+'>'+z+'</option>').join('')+'</select>'}
async function api(p,m,b){const r=await fetch(p,{method:m||'GET',headers:b?{'content-type':'application/json'}:{},body:b?JSON.stringify(b):undefined});const t=await r.text();let j={};try{j=t?JSON.parse(t):{}}catch{}if(!r.ok)throw new Error(j.error||('HTTP '+r.status));return j}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2400)}

async function boot(){applyLang();S=await api('/api/status');if(!S.setupComplete)return setupView();if(!S.authed)return loginView();await load();dash('dashboard')}
let EDITIONS=[];
async function load(){SET=await api('/api/settings');_minio=SET.minioPublic||{};EDITIONS=await api('/api/editions').catch(()=>[])}
function trSelect(val){return '<select id="c_tr">'+EDITIONS.map(g=>'<optgroup label="'+esc(g.language)+'">'+g.editions.map(e=>'<option value="'+esc(e.id)+'" '+(e.id===val?'selected':'')+'>'+esc(e.name)+'</option>').join('')+'</optgroup>').join('')+'</select>'}

function loginView(){app.className='center';app.innerHTML='';app.append(el(\`<div class="auth fade">\${authBrand()}<h1>\${t('welcome')}</h1><p class="sub">\${t('signin_sub')}</p><label>\${t('password')}</label><input id="pw" type="password" autofocus/><button class="btn" style="width:100%;margin-top:18px" id="go">\${t('signin')}</button></div>\`));
  const go=async()=>{try{await api('/api/login','POST',{password:pw.value});location.reload()}catch(e){toast(e.message)}};
  document.getElementById("go").onclick=go;pw.onkeydown=e=>e.key==='Enter'&&go();}
function setupView(){app.className='center';app.innerHTML='';app.append(el(\`<div class="auth fade">\${authBrand()}<h1>Set up your panel</h1><p class="sub">Choose a password. Add API keys later in Settings.</p><label>Panel password</label><input id="pw" type="password"/><label>Timezone</label>\${tzSel("tz","Africa/Tunis")}<button class="btn" style="width:100%;margin-top:18px" id="go">Create panel</button></div>\`));
  document.getElementById("go").onclick=async()=>{try{await api('/api/setup','POST',{password:pw.value,settings:{schedule:{tz:tz.value,times:['07:00','13:00','19:00'],enabled:true}}});location.reload()}catch(e){toast(e.message)}};}

const NAV=[['dashboard','dashboard'],['generate','generate'],['schedule','settings'],['queue','queue'],['history','history'],['analytics','analytics']];
function shell(active,title,desc,body){app.className='';app.innerHTML='';
  app.append(el(\`<div class="shell"><aside class="side"><div class="brand"><span class="mark">\${MARK}</span>Tabligh</div>
    \${NAV.map(([v,l])=>\`<button class="nav \${v===active?'on':''}" data-v="\${v}">\${IC[v]||''}<span>\${t(l)}</span></button>\`).join('')}
    <div class="spacer"></div><button class="nav" id="out">\${IC.history}<span>\${t('signout')}</span></button>
    <select class="langsel" onchange="setLang(this.value)">\${['en','ar','fr'].map(l=>'<option value="'+l+'" '+(l===LANG?'selected':'')+'>'+{en:'English',ar:'العربية',fr:'Français'}[l]+'</option>').join('')}</select><a class="credit" href="https://github.com/911RS/tabligh" target="_blank" rel="noopener">github.com/911RS/tabligh</a></aside>
    <main class="main fade"><div class="head"><div><h1>\${title}</h1><p>\${desc||''}</p></div><div id="hact"></div></div><div id="body"></div></main></div>\`));
  document.getElementById('out').onclick=async()=>{await api('/api/logout','POST');location.reload()};
  app.querySelectorAll('.nav[data-v]').forEach(b=>b.onclick=()=>dash(b.dataset.v));
  document.getElementById('body').append(body);}
function dash(v){({dashboard:viewDashboard,generate:viewGenerate,schedule:viewSettings,queue:viewQueue,history:viewHistory,analytics:viewAnalytics}[v]||viewDashboard)()}

async function viewDashboard(){S=await api('/api/status');const sp=S.secretsPresent;
  const body=el(\`<div><div class="grid g4">
    <div class="tile"><div class="k">Scheduler</div><div class="v \${S.schedule.enabled?'gr':'rd'}">\${S.schedule.enabled?'On':'Off'}</div></div>
    <div class="tile"><div class="k">Publishing</div><div class="v \${S.publishConfigured?'gr':''}" style="font-size:20px;padding-top:8px">\${S.publishConfigured?'Configured':'Not set'}</div></div>
    <div class="tile"><div class="k">Post times</div><div class="v" style="font-size:18px;padding-top:10px">\${esc(S.schedule.times.join('  '))}</div></div>
    <div class="tile"><div class="k">Runner</div><div class="v" style="font-size:18px;padding-top:10px">\${esc(S.status)}</div></div></div>
    <div class="card" style="margin-top:16px"><h3>Quick actions</h3><div class="row"><button class="btn" id="gen">Generate now</button><button class="btn ghost" id="genpub" \${S.publishConfigured?'':'disabled'}>Generate + publish</button></div></div>
    <div class="card"><h3>Latest preview</h3><video id="prev" controls></video></div></div>\`);
  shell('dashboard','Dashboard','Overview & quick actions',body);loadPreview();
  const run=async(p)=>{try{await api('/api/generate','POST',{publish:p});toast('Rendering…');poll()}catch(e){toast(e.message)}};
  document.getElementById('gen').onclick=()=>run(false);document.getElementById('genpub').onclick=()=>run(true);}
function loadPreview(){const v=document.getElementById('prev');if(v)v.src='/api/preview?t='+Date.now()}
async function poll(){for(let i=0;i<100;i++){await new Promise(r=>setTimeout(r,3000));try{const s=await api('/api/status');if(!s.busy){toast('Done');loadPreview();return}}catch{}}}

function viewGenerate(){const body=el(\`<div class="card"><h3>Compose</h3><p class="sub">Leave surah empty for a random passage.</p>
  <div class="row"><div class="f"><label>Surah</label><input id="surah" type="number" min="1" max="114" placeholder="1–114"/></div><div class="f"><label>From ayah</label><input id="from" type="number" min="1"/></div><div class="f"><label>To ayah</label><input id="to" type="number" min="1"/></div></div>
  <label>Reciter</label><input id="reciter" placeholder="husary, minshawy, abdulbasit…"/>
  <div style="margin-top:16px"><label class="sw"><input type="checkbox" id="pub"/><span class="track"></span><span>Publish after render</span></label></div>
  <div style="margin-top:18px"><button class="btn" id="go">Generate</button></div><video id="prev" controls></video></div>\`);
  shell('generate','Generate','Render a reel on demand',body);
  document.getElementById('go').onclick=async()=>{const b={publish:pub.checked};if(surah.value){b.surah=+surah.value;b.from=+from.value||1;b.to=+to.value||b.from}if(reciter.value)b.reciter=reciter.value;
    try{await api('/api/generate','POST',b);toast('Rendering…');for(let i=0;i<100;i++){await new Promise(x=>setTimeout(x,3000));const s=await api('/api/status');if(!s.busy){document.getElementById('prev').src='/api/preview?t='+Date.now();toast('Done');break}}}catch(e){toast(e.message)}};}

function timesEditor(times){const box=el('<div class="chips" id="times"></div>');
  const add=(v)=>{const c=el(\`<span class="chip"><input type="time" value="\${v||'12:00'}"/><button class="x">×</button></span>\`);c.querySelector('.x').onclick=()=>c.remove();box.insertBefore(c,box.lastElementChild)};
  const plus=el('<button class="addbtn">+ Add time</button>');plus.onclick=()=>add('12:00');box.append(plus);(times||[]).forEach(add);return box}
function getTimes(){return [...document.querySelectorAll('#times input[type=time]')].map(i=>i.value).filter(Boolean).sort()}

function fld(l,id,v,t){return \`<label>\${l}</label><input id="\${id}" type="\${t||'text'}" value="\${esc(v??'')}"/>\`}
function sw(id,on,l){return \`<label class="sw"><input type="checkbox" id="\${id}" \${on?'checked':''}/><span class="track"></span><span>\${t(l)}</span></label>\`}
function viewSettings(){const s=SET;const body=el(\`<div>
  <div class="card"><h3>Schedule</h3><div style="margin-bottom:14px">\${sw('sch_en',s.schedule.enabled,'Scheduler enabled')}</div>
    <label>Post times</label><div id="times_m"></div><label>Timezone</label>\${tzSel('sch_tz',s.schedule.tz)}</div>
  <div class="card"><h3>Content</h3><div class="row"><div class="f"><label>Translation</label>\${trSelect(s.content.translationEdition)}</div><div class="f">\${fld('Min ayahs','c_min',s.content.randomMinAyahs,'number')}</div><div class="f">\${fld('Max ayahs','c_max',s.content.randomMaxAyahs,'number')}</div><div class="f">\${fld('Max length s (0=off)','c_maxdur',s.content.maxDurationSeconds,'number')}</div></div></div>
  <div class="card"><h3>Branding</h3><div class="row" style="margin-bottom:6px"><div class="f">\${sw('b_kar',s.branding.karaokeEnabled,'Karaoke fill')}</div><div class="f">\${sw('b_wm',s.branding.watermarkEnabled,'Corner watermark')}</div></div>
    <div class="row" style="margin-bottom:6px"><div class="f">\${sw('b_part',s.branding.particlesEnabled,'Particles')}</div><div class="f">\${sw('b_bganim',s.branding.bgAnimationEnabled,'Animated background')}</div><div class="f">\${sw('b_credit',s.branding.projectCreditEnabled,'Promote project (outro)')}</div></div>
    <div class="row"><div class="f"><label>Fill color</label><input id="b_fill" type="color" value="\${esc(s.branding.textFillColor||'#ffffff')}" style="height:44px;padding:4px"/></div><div class="f">\${fld('Watermark handle','b_h',s.branding.watermarkHandle)}</div></div>\${fld('Outro text','b_out',s.branding.outroText)}</div>
  <div class="card"><h3>Publishing channels</h3>\${['tiktok','instagram','facebook','youtube'].map(p=>fld(p[0].toUpperCase()+p.slice(1)+' channel ids','p_'+p,(s.publish.channels[p]||[]).join(', '))).join('')}</div>
  <div class="card"><h3>API keys & storage</h3><p class="sub">Blank = keep current.</p><div class="row"><div class="f">\${fld('Pexels key','k_px','','password')}</div><div class="f">\${fld('Unsplash key','k_us','','password')}</div></div>\${fld('Buffer access token','k_bf','','password')}
    <div class="row"><div class="f">\${fld('Storage endpoint','m_ep',_minio.endpoint)}</div><div class="f">\${fld('Port','m_port',_minio.port||9000,'number')}</div></div>
    <div class="row"><div class="f">\${fld('Access key','m_ak','','password')}</div><div class="f">\${fld('Secret key','m_sk','','password')}</div></div>
    <div class="row"><div class="f">\${fld('Bucket','m_bk',_minio.bucket||'tabligh')}</div><div class="f">\${fld('Public URL','m_url',_minio.publicUrl)}</div></div></div>
  <div style="margin:20px 0"><button class="btn" id="save">Save changes</button></div></div>\`);
  shell('schedule','Settings','Everything is applied live',body);
  document.getElementById('times_m').append(timesEditor(s.schedule.times));
  document.getElementById('save').onclick=save;}
function save(){const g=id=>document.getElementById(id),ids=id=>g(id).value.split(',').map(x=>x.trim()).filter(Boolean);
  const patch={schedule:{enabled:g('sch_en').checked,tz:g('sch_tz').value,times:getTimes()},content:{translationEdition:g('c_tr').value,randomMinAyahs:+g('c_min').value,randomMaxAyahs:+g('c_max').value,maxDurationSeconds:+g('c_maxdur').value},branding:{karaokeEnabled:g('b_kar').checked,watermarkEnabled:g('b_wm').checked,textFillColor:g('b_fill').value,watermarkHandle:g('b_h').value,outroText:g('b_out').value,particlesEnabled:g('b_part').checked,bgAnimationEnabled:g('b_bganim').checked,projectCreditEnabled:g('b_credit').checked},publish:{channels:{tiktok:ids('p_tiktok'),instagram:ids('p_instagram'),facebook:ids('p_facebook'),youtube:ids('p_youtube')}}};
  const sec={};if(g('k_px').value)sec.pexelsKey=g('k_px').value;if(g('k_us').value)sec.unsplashKey=g('k_us').value;if(g('k_bf').value)sec.bufferToken=g('k_bf').value;const m={endpoint:g('m_ep').value,port:+g('m_port').value,bucket:g('m_bk').value,publicUrl:g('m_url').value};if(g('m_ak').value)m.accessKey=g('m_ak').value;if(g('m_sk').value)m.secretKey=g('m_sk').value;sec.minio=m;
  Promise.all([api('/api/settings','PUT',patch),api('/api/secrets','PUT',sec)]).then(async()=>{await load();toast('Saved')}).catch(e=>toast(e.message));}

async function viewQueue(){const q=await api('/api/queue');
  const rows=q.map(i=>\`<tr><td>\${esc(i.surah)}:\${esc(i.ayahFrom)}-\${esc(i.ayahTo)}</td><td>\${esc(i.reciter||'random')}</td><td class="muted">\${esc((i.addedAt||'').slice(0,10))}</td><td><button class="btn danger sm" data-id="\${esc(i.id)}">Remove</button></td></tr>\`).join('');
  const body=el(\`<div><div class="card"><h3>Add to queue</h3><div class="row"><div class="f"><label>Surah</label><input id="q_s" type="number" min="1" max="114"/></div><div class="f"><label>From</label><input id="q_f" type="number" min="1"/></div><div class="f"><label>To</label><input id="q_t" type="number" min="1"/></div><div class="f"><label>Reciter (optional)</label><input id="q_r"/></div></div><div style="margin-top:14px"><button class="btn" id="q_add">Add</button></div></div>
    <div class="card"><h3>Upcoming (played before random)</h3><table><thead><tr><th>Passage</th><th>Reciter</th><th>Added</th><th></th></tr></thead><tbody>\${rows||'<tr><td colspan=4 class=sub>Queue is empty — the scheduler picks random passages.</td></tr>'}</tbody></table></div></div>\`);
  shell('queue','Queue','Plan specific passages; the scheduler plays these first',body);
  document.getElementById('q_add').onclick=async()=>{const b={surah:+q_s.value,ayahFrom:+q_f.value||1,ayahTo:+q_t.value||(+q_f.value||1)};if(q_r.value)b.reciter=q_r.value;if(!b.surah)return toast('Enter a surah');try{await api('/api/queue','POST',b);toast('Added');viewQueue()}catch(e){toast(e.message)}};
  body.querySelectorAll('[data-id]').forEach(b=>b.onclick=async()=>{await api('/api/queue?id='+b.dataset.id,'DELETE');viewQueue()});}

async function viewHistory(){const posts=await api('/api/history');
  const rows=posts.map(p=>\`<tr><td>\${esc(p.ts.replace('T',' ').slice(0,16))}</td><td>\${esc(p.surah)}:\${esc(p.ayahFrom)}-\${esc(p.ayahTo)}</td><td>\${esc(p.reciterName||p.reciter)}</td><td><span class="tag \${p.status==='published'?'ok':p.status==='failed'?'no':'n'}">\${esc(p.status)}</span></td><td class="sub">\${esc((p.postIds||[]).join(', '))}</td></tr>\`).join('');
  const body=el(\`<div class="card"><table><thead><tr><th>When</th><th>Passage</th><th>Reciter</th><th>Status</th><th>Post ids</th></tr></thead><tbody>\${rows||'<tr><td colspan=5 class=sub>No posts yet.</td></tr>'}</tbody></table></div>\`);
  shell('history','History','Every render and post',body);}

async function viewAnalytics(){const[st,logs]=await Promise.all([api('/api/stats'),api('/api/logs')]);
  const body=el(\`<div><div class="grid g4">
    <div class="tile"><div class="k">Total</div><div class="v">\${st.total}</div></div>
    <div class="tile"><div class="k">Published</div><div class="v gr">\${st.published}</div></div>
    <div class="tile"><div class="k">Failed</div><div class="v rd">\${st.failed}</div></div>
    <div class="tile"><div class="k">This week</div><div class="v g">\${st.week}</div></div></div>
    <div class="card" style="margin-top:16px"><h3>By platform</h3><div class="row">\${Object.entries(st.byPlatform).map(([k,v])=>\`<div class="f tile"><div class="k">\${esc(k)}</div><div class="v" style="font-size:22px">\${v}</div></div>\`).join('')||'<span class="sub">No published posts yet.</span>'}</div></div>
    <div class="card"><h3>Recent activity</h3><div class="logbox">\${logs.map(esc).join('\\n')||'—'}</div></div></div>\`);
  shell('analytics','Analytics','Activity & logs',body);}

boot().catch(e=>{app.innerHTML='<div class="sub">'+esc(e.message)+'</div>'});
</script></body></html>`;
}
