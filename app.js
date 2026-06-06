const OWNER = {
  name: 'Dr. Joko Slamet',
  bankBca: '0183188531',
  bankMandiri: '1410025957408',
  accountName: 'Joko Slamet',
  whatsapp: '+6282338202233',
  email: 'jokoslamet@cwcu.ac.id',
  copyright: 'Copyright © Dr. Joko Slamet'
};
const ADMIN_PIN = 'JS2026';
const STORAGE_PROJECTS = 'aps_projects_v1';
const STORAGE_PACKAGES = 'aps_packages_v3';
const STORAGE_PORTAL_SEEN = 'aps_portal_seen_v1';
let activeProjectId = null;
let financeMode = 'invoice';
let lastAnalysis = null;

const defaultPackages = [
  { id:'basic', name:'Basic Proofread', price:500000, unit:'up to 1,000 words', featured:false, description:'Professional basic proofreading for abstracts, essays, short reports, and compact academic documents.', features:['Grammar, spelling, punctuation','Typo and consistency check','Basic clarity feedback','Invoice and receipt'] },
  { id:'academic', name:'Academic Proofread', price:1000000, unit:'up to 2,500 words', featured:true, description:'Academic tone, coherence, EFL writing support, and sentence-level improvement for scholarly writing.', features:['Grammar and sentence revision','Academic tone enhancement','Cohesion and clarity check','Tracking results and report'] },
  { id:'manuscript', name:'Manuscript Readiness', price:1750000, unit:'journal article draft, 4,000–6,000 words', featured:false, description:'Full journal article proofreading with citation readiness, submission checklist, and manuscript-readiness scoring.', features:['IMRaD section review','Citation/reference consistency','Journal readiness score','Proofread Passport report'] },
  { id:'premium', name:'Premium Academic Review', price:2500000, unit:'full manuscript + expert note', featured:false, description:'Comprehensive language editing, manuscript-readiness review, and expert editorial recommendations for full manuscripts.', features:['Deep academic revision','Reviewer simulation notes','Ethics/AI declaration check','Priority report and consultation note'] }
];

function $(id){ return document.getElementById(id); }
function money(n){ return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }
function todayISO(){ return new Date().toISOString().slice(0,10); }
function datetime(){ return new Date().toLocaleString('en-GB', { dateStyle:'medium', timeStyle:'short' }); }
function safe(s){ return String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function idShort(){
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  return `APS-${stamp}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
}
function invoiceNo(project){ return `INV-${project.id.replace('APS-','')}`; }
function receiptNo(project){ return `RCP-${project.id.replace('APS-','')}`; }
function qrUrl(text){ return `https://quickchart.io/qr?size=180&margin=1&text=${encodeURIComponent(text)}`; }
function signatureBlock(label){
  return `<div class="signature cert-signature">
    <p>${safe(label)}</p>
    <div class="signature-pad">
      <div class="official-seal"><span>ACADEMIC</span><strong>APS</strong><em>VERIFIED</em></div>
      <img class="signature-img" src="assets/signature-joko.png" alt="Authorized signature of Dr. Joko Slamet">
    </div>
    <span class="signature-line"><strong>${safe(OWNER.name)}</strong></span>
    <small>Authorized Owner · Academic Proofread Studio</small>
  </div>`;
}
function getProjects(){ try { return JSON.parse(localStorage.getItem(STORAGE_PROJECTS)) || []; } catch { return []; } }
function saveProjects(projects){ localStorage.setItem(STORAGE_PROJECTS, JSON.stringify(projects)); refreshAll(); }
function getPackages(){ try { return JSON.parse(localStorage.getItem(STORAGE_PACKAGES)) || defaultPackages; } catch { return defaultPackages; } }
function savePackages(packages){ localStorage.setItem(STORAGE_PACKAGES, JSON.stringify(packages)); refreshAll(); }
function getProject(id){ return getProjects().find(p => p.id === id); }
function updateProject(id, patch){
  const projects = getProjects();
  const idx = projects.findIndex(p => p.id === id);
  if(idx >= 0){ projects[idx] = { ...projects[idx], ...patch, updatedAt: datetime() }; saveProjects(projects); return projects[idx]; }
  return null;
}
function toast(msg){ const t=$('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2600); }


function showAccessPortal(){
  if(!$('accessPortal')) return;
  $('accessPortal').classList.remove('hidden');
  document.body.classList.add('portal-open');
}
function hideAccessPortal(){
  if(!$('accessPortal')) return;
  $('accessPortal').classList.add('hidden');
  document.body.classList.remove('portal-open');
  togglePortalAdmin(false);
}
function enterStudio(){
  localStorage.setItem(STORAGE_PORTAL_SEEN,'1');
  hideAccessPortal();
  route('home');
}
function openAdminPortal(){
  showAccessPortal();
  togglePortalAdmin(true);
}
function togglePortalAdmin(show){
  if(!$('portalAdminBox')) return;
  $('portalAdminBox').classList.toggle('hidden', !show);
  if(!show && $('portalAdminPin')) $('portalAdminPin').value='';
}
function portalAdminLogin(){
  const val = ($('portalAdminPin')?.value || '').trim();
  if(val === ADMIN_PIN){
    localStorage.setItem(STORAGE_PORTAL_SEEN,'1');
    sessionStorage.setItem('aps_admin','1');
    hideAccessPortal();
    renderAdminState();
    route('admin');
    toast('Admin unlocked.');
  } else {
    toast('Invalid admin PIN.');
  }
}

function route(name){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const page = $(name);
  if(page) page.classList.add('active');
  document.querySelectorAll('.sidebar nav button').forEach(b=>b.classList.toggle('active', b.dataset.route === name));
  $('sidebar').classList.remove('open');
  refreshAll();
  window.scrollTo({top:0, behavior:'smooth'});
}

function init(){
  if(!localStorage.getItem(STORAGE_PACKAGES)) savePackages(defaultPackages);
  $('menuToggle').addEventListener('click', ()=>$('sidebar').classList.toggle('open'));
  $('projectForm').addEventListener('submit', createProject);
  $('workspaceText').addEventListener('input', updateLiveMeta);
  renderPackageSelect();
  refreshAll();
  route('home');
  if(!localStorage.getItem(STORAGE_PORTAL_SEEN)) showAccessPortal();
}

function refreshAll(){
  renderPackageSelect();
  renderPricing();
  renderMetrics();
  renderProjects();
  renderProjectSelects();
  renderAdminState();
}

function renderMetrics(){
  const projects = getProjects();
  const paid = projects.filter(p=>['Paid','Completed'].includes(p.paymentStatus)).length;
  const completed = projects.filter(p=>p.proofreadStatus==='Completed' || p.paymentStatus==='Completed').length;
  const pending = projects.filter(p=>['Unpaid','Pending Confirmation'].includes(p.paymentStatus)).length;
  const set=(id,val)=>{ if($(id)) $(id).textContent = val; };
  set('metricProjects', projects.length); set('metricPaid', paid); set('metricReady', completed);
  set('dashTotal', projects.length); set('dashPending', pending); set('dashPaid', paid); set('dashCompleted', completed);
}

function renderPackageSelect(){
  const sel = $('packageName');
  if(!sel) return;
  const current = sel.value;
  sel.innerHTML = getPackages().map(p=>`<option value="${safe(p.id)}">${safe(p.name)} — ${money(p.price)}</option>`).join('');
  if(current) sel.value = current;
  updatePackageInfo();
}
function updatePackageInfo(){
  const sel = $('packageName');
  const info = $('packageInfo');
  if(!sel || !info) return;
  const pkg = getPackages().find(p=>p.id===sel.value) || getPackages()[0];
  if(!pkg) return;
  info.innerHTML = `<strong>${safe(pkg.name)}</strong><br>${safe(pkg.description)}<br><strong>${money(pkg.price)}</strong> <small>${safe(pkg.unit)}</small>`;
}
function renderPricing(){
  const box = $('pricingCards'); if(!box) return;
  box.innerHTML = getPackages().map(p=>`
    <article class="card pricing-card ${p.featured?'featured':''}">
      <h3>${safe(p.name)}</h3>
      <p>${safe(p.description)}</p>
      <div class="price">${money(p.price)}</div>
      <small>${safe(p.unit)}</small>
      <ul>${(p.features||[]).map(f=>`<li>${safe(f)}</li>`).join('')}</ul>
      <button class="primary" onclick="selectPackageAndCreate('${safe(p.id)}')">Choose Package</button>
    </article>`).join('');
}
function selectPackageAndCreate(id){ route('create'); setTimeout(()=>{ $('packageName').value=id; updatePackageInfo(); },50); }

function createProject(e){
  e.preventDefault();
  const text = $('documentText').value.trim();
  const wc = Number($('wordCount').value || countWords(text));
  const pkg = getPackages().find(p=>p.id === $('packageName').value) || getPackages()[0];
  const urgency = $('urgency').value;
  let multiplier = urgency === 'Express' ? 1.5 : urgency === 'Urgent' ? 1.25 : 1;
  const amount = Math.round(pkg.price * multiplier);
  const project = {
    id: idShort(),
    createdAt: datetime(), updatedAt: datetime(),
    clientName: $('clientName').value.trim(), clientEmail: $('clientEmail').value.trim(), clientWa: $('clientWa').value.trim(), clientInstitution: $('clientInstitution').value.trim(),
    docTitle: $('docTitle').value.trim(), writingType: $('writingType').value, targetStyle: $('targetStyle').value, targetJournal: $('targetJournal').value.trim(), deadline: $('deadline').value,
    packageId: pkg.id, packageName: pkg.name, packagePrice: pkg.price, urgency, amount, wordCount: wc,
    documentText: text,
    paymentStatus: 'Unpaid', proofreadStatus: 'Uploaded',
    tracking: [ { date: datetime(), title:'Project Created', detail:'Document metadata submitted and invoice generated.' } ],
    revisions: [], analysis: null, revisedText: ''
  };
  const projects = getProjects(); projects.unshift(project); saveProjects(projects);
  activeProjectId = project.id;
  resetForm();
  toast('Project created and invoice generated.');
  route('invoice');
  financeMode = 'invoice';
  setTimeout(()=>{ $('invoiceProjectSelect').value = project.id; renderInvoice(); },80);
}

function resetForm(){ $('projectForm').reset(); updatePackageInfo(); $('documentText').value=''; }
function fillSample(){
  $('clientName').value='Sample Client'; $('clientEmail').value='sample@email.com'; $('clientWa').value='+628123456789'; $('clientInstitution').value='Cipta Wacana University';
  $('docTitle').value='Enhancing EFL Students Academic Writing through AI-Assisted Feedback'; $('writingType').value='Journal Article'; $('targetStyle').value='APA 7th'; $('targetJournal').value='Scopus-indexed language education journal';
  $('deadline').value=todayISO(); $('packageName').value='academic'; $('wordCount').value='850'; $('urgency').value='Standard';
  $('documentText').value='This study aims to investigate the use of AI feedback in academic writing class. The students get many benefits because the tool help them revise grammar and vocabulary. The result show that students are more confident. However, the discussion still need more critical explanation and relation with previous studies. In conclusion, AI is very useful for students.';
  updatePackageInfo(); toast('Sample project data inserted.');
}
function readUploadedText(){
  const file = $('fileUpload').files[0];
  if(!file){ toast('Please choose a text file first.'); return; }
  const reader = new FileReader();
  reader.onload = e => { $('documentText').value = String(e.target.result || '').replace(/[{}\\]/g,' ').trim(); $('wordCount').value = countWords($('documentText').value); toast('Uploaded text has been loaded.'); };
  reader.readAsText(file);
}

function renderProjects(){
  const list = $('projectList'); if(!list) return;
  const q = ($('projectSearch')?.value || '').toLowerCase();
  const f = $('projectFilter')?.value || 'all';
  let projects = getProjects();
  if(f !== 'all') projects = projects.filter(p=>p.paymentStatus===f || p.proofreadStatus===f);
  if(q) projects = projects.filter(p=>[p.id,p.docTitle,p.clientName,p.paymentStatus,p.proofreadStatus,p.packageName].join(' ').toLowerCase().includes(q));
  if(!projects.length){ list.innerHTML = '<div class="empty-state">No projects found. Create a new proofreading project to begin.</div>'; return; }
  list.innerHTML = projects.map(p=>`
    <div class="project-row">
      <div class="project-title">
        <span class="brand-mark">${safe(p.id.slice(-2))}</span>
        <div>
          <h3>${safe(p.docTitle)}</h3>
          <p><strong>${safe(p.id)}</strong> · ${safe(p.clientName)} · ${safe(p.packageName)} · ${money(p.amount)}</p>
          <p>${safe(p.writingType)} · ${safe(p.targetStyle)} · Created ${safe(p.createdAt)}</p>
          <div style="margin-top:8px"><span class="badge ${badgeClass(p.paymentStatus)}">${safe(p.paymentStatus)}</span> <span class="badge ${badgeClass(p.proofreadStatus)}">${safe(p.proofreadStatus)}</span></div>
        </div>
      </div>
      <div class="project-actions">
        <button class="mini-btn" onclick="openProject('${safe(p.id)}','workspace')">Proofread</button>
        <button class="mini-btn" onclick="openProject('${safe(p.id)}','tracking')">Track</button>
        <button class="mini-btn gold" onclick="openProject('${safe(p.id)}','invoice')">Invoice</button>
        <button class="mini-btn" onclick="openProject('${safe(p.id)}','reports')">Report</button>
      </div>
    </div>`).join('');
}
function badgeClass(status){
  if(status==='Unpaid') return 'unpaid';
  if(status==='Pending Confirmation') return 'pending';
  if(status==='Paid') return 'paid';
  if(status==='Completed') return 'completed';
  if(status==='Ready for Download') return 'completed';
  if(status==='Uploaded') return 'pending';
  if(status==='In Review') return 'paid';
  return 'pending';
}
function openProject(id, page){
  activeProjectId = id; route(page);
  setTimeout(()=>{
    ['activeProjectSelect','trackingProjectSelect','paymentProjectSelect','invoiceProjectSelect','reportProjectSelect'].forEach(s=>{ if($(s)) $(s).value=id; });
    if(page==='workspace') loadActiveProject();
    if(page==='tracking') renderTracking();
    if(page==='payment') renderPayment();
    if(page==='invoice') renderInvoice();
    if(page==='reports') renderReport();
  },80);
}
function renderProjectSelects(){
  const projects = getProjects();
  const html = '<option value="">Select project...</option>' + projects.map(p=>`<option value="${safe(p.id)}">${safe(p.id)} — ${safe(p.docTitle.slice(0,55))}</option>`).join('');
  ['activeProjectSelect','trackingProjectSelect','paymentProjectSelect','invoiceProjectSelect','reportProjectSelect'].forEach(id=>{ if($(id)){ const old=$(id).value; $(id).innerHTML=html; if(old) $(id).value=old; else if(activeProjectId) $(id).value=activeProjectId; }});
}
function loadActiveProject(){
  const id = $('activeProjectSelect').value; activeProjectId = id;
  const p = getProject(id); if(!p) return;
  $('workspaceText').value = p.documentText || '';
  $('revisedText').value = p.revisedText || '';
  if(p.analysis) showAnalysis(p.analysis);
  else clearAnalysis();
  updateLiveMeta();
}

function countWords(text){ return (String(text||'').trim().match(/\b[\w'-]+\b/g) || []).length; }
function splitSentences(text){ return String(text||'').split(/(?<=[.!?])\s+/).map(s=>s.trim()).filter(Boolean); }
function updateLiveMeta(){ const text=$('workspaceText')?.value || ''; $('liveWords').textContent=`${countWords(text)} words`; $('liveSentences').textContent=`${splitSentences(text).length} sentences`; }
function clearAnalysis(){ ['scoreGrammar','scoreTone','scoreClarity','scoreCitation','scoreJournal','scoreOverall'].forEach(id=>$(id).textContent='-'); $('issueList').innerHTML='Run proofreading to see detailed issues and suggestions.'; $('issueList').className='issue-list empty-state'; }

function runProofread(){
  const text = $('workspaceText').value.trim();
  if(!text){ toast('Please paste or select text first.'); return; }
  const analysis = analyzeText(text);
  lastAnalysis = analysis;
  showAnalysis(analysis);
  $('revisedText').value = analysis.revised;
  toast('Proofreading analysis completed.');
}
function analyzeText(text){
  const words = countWords(text);
  const sentences = splitSentences(text);
  const paragraphs = text.split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean);
  const issues = [];
  const lower = text.toLowerCase();
  const add = (type, detail, suggestion, severity='medium') => issues.push({type, detail, suggestion, severity});

  const replacements = [
    [/\bgot better\b/gi,'demonstrated improvement','Use a more precise academic verb phrase.'],
    [/\bget many benefits\b/gi,'gain several pedagogical benefits','Avoid informal wording.'],
    [/\bvery useful\b/gi,'pedagogically valuable','Use a more formal academic expression.'],
    [/\ba lot of\b/gi,'numerous','Use concise academic vocabulary.'],
    [/\bkids\b/gi,'children','Use formal terminology.'],
    [/\bthings\b/gi,'aspects','Avoid vague nouns.'],
    [/\bbig problem\b/gi,'significant challenge','Use academic register.'],
    [/\bshow\b/gi,'indicate','Use cautious academic reporting where appropriate.']
  ];
  replacements.forEach(([regex, repl, note])=>{ if(regex.test(text)){ add('Academic Tone', `Expression detected: “${regex.source.replace(/\\b|\\/g,'')}”`, `${note} Suggested replacement: “${repl}”.`, 'medium'); } regex.lastIndex=0; });

  const grammarPatterns = [
    {rx:/\bthe result show\b/gi, sug:'the results show / the result shows', msg:'Subject–verb agreement problem.'},
    {rx:/\bthe findings shows\b/gi, sug:'the findings show', msg:'Plural subject requires base verb.'},
    {rx:/\bdata shows\b/gi, sug:'data show / the data indicate', msg:'Use consistent academic agreement.'},
    {rx:/\btool help\b/gi, sug:'tool helps', msg:'Third-person singular verb form needed.'},
    {rx:/\bstudents was\b/gi, sug:'students were', msg:'Plural subject requires were.'},
    {rx:/\bneed more\b/gi, sug:'needs further / requires more', msg:'Check subject–verb agreement and academic word choice.'}
  ];
  grammarPatterns.forEach(g=>{ if(g.rx.test(text)){ add('Grammar', g.msg, `Consider revising to “${g.sug}”.`, 'high'); } g.rx.lastIndex=0; });

  sentences.forEach((s,i)=>{
    const wc = countWords(s);
    if(wc > 38) add('Clarity', `Sentence ${i+1} is long (${wc} words).`, 'Split the sentence or clarify the main clause.', 'medium');
    if(wc < 6 && sentences.length > 3) add('Clarity', `Sentence ${i+1} is very short.`, 'Combine with surrounding explanation or develop the idea more fully.', 'low');
    if(/\b(this|that|it|they)\b/i.test(s) && !/\b(this study|this finding|this result|this paper|this article)\b/i.test(s) && wc>12) add('Cohesion', `Sentence ${i+1} may contain unclear reference.`, 'Replace vague pronouns with specific nouns such as “this finding” or “the intervention”.', 'low');
  });
  if(paragraphs.length < 2 && words > 180) add('Organization', 'The text appears as one long paragraph.', 'Divide it into focused academic paragraphs with clear topic sentences.', 'medium');
  if(!/\b(however|nevertheless|although|therefore|moreover|furthermore|consequently|in contrast)\b/i.test(text) && sentences.length > 5) add('Cohesion', 'Few academic transition markers detected.', 'Add logical connectors to strengthen argument flow.', 'low');
  if(/\bprove(s|d)?\b/i.test(text)) add('Academic Caution', 'Strong claim detected: “prove”.', 'Use cautious language such as “suggests”, “indicates”, or “provides evidence”.', 'medium');
  if(!/\([A-Za-z][A-Za-z\-]+,\s?\d{4}\)|\bet al\.\b|\[\d+\]/.test(text) && words > 120) add('Citation', 'No clear in-text citation pattern was detected.', 'Add relevant citations to support claims and literature-based statements.', 'high');
  if(!/\b(method|participants|instrument|data analysis|findings|results|discussion|conclusion)\b/i.test(text) && words > 250) add('Journal Readiness', 'Limited IMRaD manuscript markers detected.', 'Clarify research purpose, method, results, discussion, and conclusion.', 'medium');
  if(!/\b(ethic|consent|approval|conflict of interest|funding|ai declaration)\b/i.test(text) && words > 500) add('Submission Checklist', 'Ethics/funding/AI declaration elements are not visible.', 'Add required publication statements where appropriate.', 'low');

  const revised = makeAcademicRevision(text);
  const high = issues.filter(i=>i.severity==='high').length;
  const med = issues.filter(i=>i.severity==='medium').length;
  const lowc = issues.filter(i=>i.severity==='low').length;
  let grammar = clamp(96 - high*8 - med*3, 45, 98);
  let tone = clamp(94 - issues.filter(i=>i.type==='Academic Tone').length*5 - (lower.match(/\b(very|a lot|thing|good|bad|big)\b/g)||[]).length*3, 42, 98);
  let clarity = clamp(95 - issues.filter(i=>['Clarity','Cohesion','Organization'].includes(i.type)).length*5, 40, 98);
  let citation = clamp(/\([A-Za-z][A-Za-z\-]+,\s?\d{4}\)|\bet al\.\b|\[\d+\]/.test(text) ? 88 - lowc : 62 - high*2, 35, 96);
  let journal = clamp(90 - issues.filter(i=>['Journal Readiness','Submission Checklist'].includes(i.type)).length*10 - (words<150?12:0), 38, 97);
  let overall = Math.round((grammar+tone+clarity+citation+journal)/5);
  const recommendation = overall >= 85 ? 'Ready for Submission after Minor Checking' : overall >= 70 ? 'Minor to Moderate Academic Revision Needed' : 'Major Academic Revision Needed';
  return { date: datetime(), words, sentences: sentences.length, paragraphs: paragraphs.length, issues, scores:{grammar,tone,clarity,citation,journal,overall}, revised, recommendation };
}
function clamp(n,min,max){ return Math.max(min, Math.min(max, Math.round(n))); }
function makeAcademicRevision(text){
  let out = text;
  const reps = [
    [/\bThis study aims to investigate\b/gi,'This study investigates'],
    [/\bgot better\b/gi,'demonstrated measurable improvement'],
    [/\bget many benefits\b/gi,'gain several pedagogical benefits'],
    [/\bthe tool help\b/gi,'the tool helps'],
    [/\bThe result show\b/gi,'The results show'],
    [/\bdiscussion still need\b/gi,'discussion still needs'],
    [/\bvery useful\b/gi,'pedagogically valuable'],
    [/\ba lot of\b/gi,'numerous'],
    [/\bthings\b/gi,'aspects'],
    [/\bIn conclusion, AI is\b/gi,'In conclusion, AI-assisted support appears to be'],
    [/\bthe students\b/gi,'the students'],
  ];
  reps.forEach(([rx,r])=>out = out.replace(rx,r));
  out = out.replace(/\b(because)\b/gi,'because');
  if(out === text){
    out = text.replace(/\bshow\b/g,'indicate').replace(/\bshows\b/g,'indicates');
  }
  return out;
}
function showAnalysis(a){
  $('scoreGrammar').textContent=a.scores.grammar; $('scoreTone').textContent=a.scores.tone; $('scoreClarity').textContent=a.scores.clarity; $('scoreCitation').textContent=a.scores.citation; $('scoreJournal').textContent=a.scores.journal; $('scoreOverall').textContent=a.scores.overall;
  const list=$('issueList'); list.className='issue-list';
  if(!a.issues.length){ list.innerHTML='<div class="issue"><strong>No major issue detected</strong><small>The text appears generally clear. Final human checking is still recommended for publication.</small></div>'; return; }
  list.innerHTML = a.issues.map((i,idx)=>`<div class="issue"><strong>${idx+1}. ${safe(i.type)} <span class="badge ${i.severity==='high'?'unpaid':i.severity==='medium'?'pending':'paid'}">${safe(i.severity)}</span></strong><small>${safe(i.detail)}</small><div class="suggest">${safe(i.suggestion)}</div></div>`).join('');
}
function copyRevisedText(){ navigator.clipboard?.writeText($('revisedText').value || ''); toast('Revised text copied.'); }
function saveProofreadToProject(){
  const id = $('activeProjectSelect').value || activeProjectId;
  const p = getProject(id);
  if(!p){ toast('Please select a project first.'); return; }
  const analysis = lastAnalysis || analyzeText($('workspaceText').value);
  const revised = $('revisedText').value || analysis.revised;
  const tracking = [...(p.tracking||[]), {date: datetime(), title:'Proofread Results Saved', detail:`Overall score ${analysis.scores.overall}. Recommendation: ${analysis.recommendation}.`}];
  const revisions = [...(p.revisions||[]), {date: datetime(), action:'Proofreading analysis saved', score:analysis.scores.overall, issues:analysis.issues.length }];
  updateProject(p.id, { documentText:$('workspaceText').value, revisedText:revised, analysis, revisions, tracking, proofreadStatus: p.paymentStatus==='Paid' ? 'In Review' : 'AI Proofread Completed' });
  toast('Proofreading results saved to project.');
}

function renderTracking(){
  const id = $('trackingProjectSelect').value || activeProjectId;
  const p = getProject(id); const box=$('trackingView');
  if(!p){ box.className='tracking-view empty-state'; box.innerHTML='Select a project to view tracking results.'; return; }
  box.className='tracking-view';
  const steps = [
    ['Uploaded', 'Document Uploaded', true],
    ['Payment', 'Payment Confirmed', ['Paid','Completed'].includes(p.paymentStatus)],
    ['AI', 'AI Proofread Completed', !!p.analysis],
    ['Review', 'Academic Review / Admin Verification', ['In Review','Completed','Ready for Download'].includes(p.proofreadStatus) || p.paymentStatus==='Completed'],
    ['Final', 'Final Report Ready', p.proofreadStatus==='Completed' || p.paymentStatus==='Completed']
  ];
  const scores = p.analysis?.scores;
  box.innerHTML = `
    <div class="tracking-grid">
      <div class="card">
        <h3>${safe(p.docTitle)}</h3>
        <p><strong>Project ID:</strong> ${safe(p.id)}</p>
        <p><strong>Client:</strong> ${safe(p.clientName)} · ${safe(p.clientInstitution||'-')}</p>
        <p><strong>Package:</strong> ${safe(p.packageName)} · ${money(p.amount)}</p>
        <p><span class="badge ${badgeClass(p.paymentStatus)}">${safe(p.paymentStatus)}</span> <span class="badge ${badgeClass(p.proofreadStatus)}">${safe(p.proofreadStatus)}</span></p>
        ${scores ? `<div class="score-grid small"><div><span>Grammar</span><strong>${scores.grammar}</strong></div><div><span>Tone</span><strong>${scores.tone}</strong></div><div><span>Clarity</span><strong>${scores.clarity}</strong></div><div><span>Citation</span><strong>${scores.citation}</strong></div><div><span>Journal</span><strong>${scores.journal}</strong></div><div><span>Overall</span><strong>${scores.overall}</strong></div></div>` : '<div class="empty-state">No proofread score saved yet.</div>'}
      </div>
      <div class="card">
        <h3>Progress Timeline</h3>
        <div class="timeline">${steps.map((s,i)=>`<div class="time-step ${s[2]?'done':''}"><div class="time-dot">${i+1}</div><div class="time-box"><strong>${safe(s[1])}</strong><br><small>${s[2]?'Completed':'Pending'}</small></div></div>`).join('')}</div>
      </div>
    </div>
    <div class="card" style="margin-top:18px"><h3>Revision & Activity Log</h3><div class="revision-log">${(p.tracking||[]).map(t=>`<div><strong>${safe(t.title)}</strong><br><small>${safe(t.date)}</small><p>${safe(t.detail)}</p></div>`).join('') || '<div>No tracking log yet.</div>'}</div></div>`;
}

function renderPayment(){
  const id = $('paymentProjectSelect').value || activeProjectId;
  const p = getProject(id); const box=$('paymentDetails');
  const wa = $('waConfirm');
  if(!p){ box.className='card empty-state'; box.innerHTML='Select a project to view payment details.'; if(wa) wa.href=`https://wa.me/${OWNER.whatsapp.replace(/\D/g,'')}`; return; }
  const message = `Payment Confirmation - Academic Proofread Studio%0AProject ID: ${encodeURIComponent(p.id)}%0ADocument: ${encodeURIComponent(p.docTitle)}%0AClient: ${encodeURIComponent(p.clientName)}%0AAmount: ${encodeURIComponent(money(p.amount))}`;
  if(wa) wa.href = `https://wa.me/${OWNER.whatsapp.replace(/\D/g,'')}?text=${message}`;
  box.className='card payment-status-card';
  box.innerHTML = `
    <h3>${safe(p.docTitle)}</h3>
    <p><strong>Project ID:</strong> ${safe(p.id)}</p>
    <p><strong>Package:</strong> ${safe(p.packageName)} · ${safe(p.urgency)}</p>
    <div class="payment-amount">${money(p.amount)}</div>
    <p><span class="badge ${badgeClass(p.paymentStatus)}">${safe(p.paymentStatus)}</span></p>
    <table class="paper-table"><tr><th>Invoice</th><td>${safe(invoiceNo(p))}</td></tr><tr><th>Client</th><td>${safe(p.clientName)}</td></tr><tr><th>Email</th><td>${safe(p.clientEmail)}</td></tr><tr><th>Created</th><td>${safe(p.createdAt)}</td></tr></table>
    <button class="primary" onclick="submitPaymentConfirmation('${safe(p.id)}')">I Have Paid / Submit Confirmation</button>
    <button class="secondary" onclick="openProject('${safe(p.id)}','invoice')">Open Invoice</button>`;
}
function submitPaymentConfirmation(id){
  const p=getProject(id); if(!p) return;
  const tracking=[...(p.tracking||[]),{date:datetime(),title:'Payment Confirmation Submitted',detail:'Client marked payment as transferred and should send proof through WhatsApp or email.'}];
  updateProject(id,{paymentStatus:'Pending Confirmation',tracking});
  renderPayment(); toast('Payment confirmation submitted. Please send proof by WhatsApp or email.');
}

function renderInvoice(){
  const id = $('invoiceProjectSelect').value || activeProjectId;
  const p = getProject(id); const box=$('financeDoc');
  if(!p){ box.className='paper empty-state'; box.innerHTML='Select a project to generate invoice or receipt.'; return; }
  box.className='paper';
  box.innerHTML = financeMode === 'invoice' ? invoiceHTML(p) : receiptHTML(p);
  $('financeModeBtn').textContent = financeMode === 'invoice' ? 'Switch to Receipt' : 'Switch to Invoice';
}
function toggleFinanceMode(){ financeMode = financeMode === 'invoice' ? 'receipt' : 'invoice'; renderInvoice(); }
function invoiceHTML(p){
  return `
  <div class="paper-head">
    <div class="paper-brand"><span class="brand-mark large">APS</span><div><h2>Academic Proofread Studio</h2><p>Professional Academic Proofreading & Manuscript Readiness Service<br><strong>${safe(OWNER.name)}</strong><br>${safe(OWNER.email)} · ${safe(OWNER.whatsapp)}</p></div></div>
    <div class="paper-title"><h1>INVOICE</h1><p><strong>${safe(invoiceNo(p))}</strong><br>${safe(p.createdAt)}</p></div>
  </div>
  <table class="paper-table"><tr><th>Bill To</th><td>${safe(p.clientName)}<br>${safe(p.clientInstitution||'')}<br>${safe(p.clientEmail)} · ${safe(p.clientWa||'')}</td><th>Project ID</th><td>${safe(p.id)}</td></tr><tr><th>Document</th><td colspan="3">${safe(p.docTitle)}</td></tr><tr><th>Payment Status</th><td>${safe(p.paymentStatus)}</td><th>Proofread Status</th><td>${safe(p.proofreadStatus)}</td></tr></table>
  <table class="paper-table"><thead><tr><th>Description</th><th>Writing Type</th><th>Target Style</th><th>Amount</th></tr></thead><tbody><tr><td>${safe(p.packageName)} (${safe(p.urgency)})<br><small>Estimated words: ${safe(p.wordCount)}</small></td><td>${safe(p.writingType)}</td><td>${safe(p.targetStyle)}</td><td>${money(p.amount)}</td></tr></tbody></table>
  <div class="paper-total">Total Due: ${money(p.amount)}</div>
  <div class="report-section"><h3>Bank Account & Payment Contact</h3><table class="paper-table"><tr><th>BCA</th><td>${safe(OWNER.bankBca)} a.n. ${safe(OWNER.accountName)}</td></tr><tr><th>Mandiri</th><td>${safe(OWNER.bankMandiri)} a.n. ${safe(OWNER.accountName)}</td></tr><tr><th>WhatsApp Confirmation</th><td>${safe(OWNER.whatsapp)}</td></tr><tr><th>Email</th><td>${safe(OWNER.email)}</td></tr></table></div>
  <div style="display:flex;justify-content:space-between;gap:20px;align-items:end"><div><h3>Verification</h3><img class="qr-img" src="${qrUrl('Academic Proofread Studio Invoice '+p.id+' '+p.clientName+' '+p.docTitle)}" alt="Invoice verification QR"><p><small>Scan to verify project reference text.</small></p></div>${signatureBlock('Issued by,')}</div>`;
}
function receiptHTML(p){
  return `
  <div class="paper-head">
    <div class="paper-brand"><span class="brand-mark large">APS</span><div><h2>Academic Proofread Studio</h2><p>Professional Academic Proofreading & Manuscript Readiness Service<br><strong>${safe(OWNER.name)}</strong><br>${safe(OWNER.email)} · ${safe(OWNER.whatsapp)}</p></div></div>
    <div class="paper-title"><h1>RECEIPT</h1><p><strong>${safe(receiptNo(p))}</strong><br>${safe(datetime())}</p></div>
  </div>
  <table class="paper-table"><tr><th>Received From</th><td>${safe(p.clientName)}<br>${safe(p.clientInstitution||'')}<br>${safe(p.clientEmail)}</td><th>Project ID</th><td>${safe(p.id)}</td></tr><tr><th>Document</th><td colspan="3">${safe(p.docTitle)}</td></tr><tr><th>Payment Status</th><td>${safe(p.paymentStatus)}</td><th>Proofread Status</th><td>${safe(p.proofreadStatus)}</td></tr></table>
  <table class="paper-table"><thead><tr><th>Service</th><th>Package</th><th>Amount Paid</th></tr></thead><tbody><tr><td>Academic proofreading and manuscript readiness service</td><td>${safe(p.packageName)} (${safe(p.urgency)})</td><td>${money(p.amount)}</td></tr></tbody></table>
  <div class="paper-total">Amount: ${money(p.amount)}</div>
  <p class="note"><strong>Receipt Note:</strong> This receipt is valid when the payment status is marked as Paid or Completed by the authorized admin.</p>
  <div style="display:flex;justify-content:space-between;gap:20px;align-items:end"><div><h3>Receipt Verification</h3><img class="qr-img" src="${qrUrl('Academic Proofread Studio Receipt '+p.id+' '+p.clientName+' '+p.paymentStatus)}" alt="Receipt verification QR"><p><small>Verification Code: ${safe(receiptNo(p))}</small></p></div>${signatureBlock('Confirmed by,')}</div>`;
}

function renderReport(){
  const id = $('reportProjectSelect').value || activeProjectId;
  const p = getProject(id); const box=$('reportDoc');
  if(!p){ box.className='paper empty-state'; box.innerHTML='Select a project to generate a proofread report.'; return; }
  box.className='paper';
  const a = p.analysis;
  const scores = a?.scores || {grammar:'-',tone:'-',clarity:'-',citation:'-',journal:'-',overall:'-'};
  const ready = Number(scores.overall||0) >= 85;
  box.innerHTML = `
    <div class="paper-head">
      <div class="paper-brand"><span class="brand-mark large">APS</span><div><h2>Academic Proofread Studio</h2><p>Proofread Passport & Manuscript Readiness Report<br><strong>${safe(OWNER.name)}</strong></p></div></div>
      <div class="paper-title"><h1>REPORT</h1><p><strong>${safe(p.id)}</strong><br>${safe(datetime())}</p></div>
    </div>
    <table class="paper-table"><tr><th>Document Title</th><td colspan="3">${safe(p.docTitle)}</td></tr><tr><th>Client</th><td>${safe(p.clientName)}</td><th>Institution</th><td>${safe(p.clientInstitution||'-')}</td></tr><tr><th>Writing Type</th><td>${safe(p.writingType)}</td><th>Target Style</th><td>${safe(p.targetStyle)}</td></tr><tr><th>Package</th><td>${safe(p.packageName)}</td><th>Payment</th><td>${safe(p.paymentStatus)}</td></tr></table>
    <div class="kpi-row"><div><span>Grammar</span><strong>${scores.grammar}</strong></div><div><span>Academic Tone</span><strong>${scores.tone}</strong></div><div><span>Clarity</span><strong>${scores.clarity}</strong></div><div><span>Citation</span><strong>${scores.citation}</strong></div><div><span>Journal</span><strong>${scores.journal}</strong></div><div><span>Overall</span><strong>${scores.overall}</strong></div></div>
    <div class="report-section"><h3>Final Recommendation</h3><p><span class="status-pill ${ready?'ready':'revise'}">${safe(a?.recommendation || 'Proofreading analysis has not been saved yet')}</span></p></div>
    <div class="report-section"><h3>Detected Issues</h3>${a?.issues?.length ? `<ul>${a.issues.slice(0,18).map(i=>`<li><strong>${safe(i.type)}:</strong> ${safe(i.detail)} ${safe(i.suggestion)}</li>`).join('')}</ul>` : '<p>No saved proofreading issues yet. Run and save proofreading analysis first.</p>'}</div>
    <div class="report-section"><h3>Revision Summary</h3><p>${safe(p.revisedText ? 'A revised academic version has been generated and saved in the proofreading workspace.' : 'No revised text has been saved yet.')}</p></div>
    <div class="report-section"><h3>Academic Integrity & AI-Use Note</h3><p>This report documents language-focused proofreading and manuscript-readiness support. Authors remain responsible for content accuracy, originality, citations, ethical compliance, and journal-specific declarations.</p></div>
    <div style="display:flex;justify-content:space-between;gap:20px;align-items:end"><div><h3>QR Verification</h3><img class="qr-img" src="${qrUrl('Academic Proofread Studio Report '+p.id+' '+p.docTitle+' Overall '+scores.overall)}" alt="Report verification QR"><p><small>Verification Code: ${safe(p.id)}</small></p></div>${signatureBlock('Prepared by,')}</div>`;
}

function printSection(id){
  const el = $(id); if(!el) return;
  const original = document.body.innerHTML;
  document.body.innerHTML = `<main style="padding:28px">${el.outerHTML}</main>`;
  window.print();
  document.body.innerHTML = original;
  location.reload();
}
function downloadHTML(filename, content){
  const blob = new Blob([`<!doctype html><html><head><meta charset="utf-8"><title>${safe(filename)}</title><link rel="stylesheet" href="styles.css"></head><body><main style="padding:28px">${content}</main></body></html>`], {type:'text/html'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); URL.revokeObjectURL(a.href);
}
function downloadFinanceHTML(){ const id=$('invoiceProjectSelect').value || activeProjectId; const p=getProject(id); if(!p){toast('Select a project first.');return;} downloadHTML(`${financeMode}-${p.id}.html`, $('financeDoc').outerHTML); }
function downloadReportHTML(){ const id=$('reportProjectSelect').value || activeProjectId; const p=getProject(id); if(!p){toast('Select a project first.');return;} downloadHTML(`proofread-report-${p.id}.html`, $('reportDoc').outerHTML); }

function adminLogin(){
  if(($('adminPin').value || '') === ADMIN_PIN){ sessionStorage.setItem('aps_admin','1'); $('adminPin').value=''; renderAdminState(); toast('Admin unlocked.'); }
  else toast('Invalid admin PIN.');
}
function adminLogout(){ sessionStorage.removeItem('aps_admin'); renderAdminState(); toast('Admin locked.'); }
function renderAdminState(){
  if(!$('adminGate')) return;
  const unlocked = sessionStorage.getItem('aps_admin') === '1';
  $('adminGate').classList.toggle('hidden', unlocked);
  $('adminPanel').classList.toggle('hidden', !unlocked);
  if(unlocked){ renderAdminProjects(); renderPackageEditor(); }
}
function renderAdminProjects(){
  const box=$('adminProjectList'); if(!box) return;
  const projects=getProjects();
  if(!projects.length){ box.innerHTML='<div class="empty-state">No projects yet.</div>'; return; }
  box.innerHTML = `<table class="admin-table"><thead><tr><th>Project</th><th>Client</th><th>Payment</th><th>Proofread</th><th>Amount</th><th>Actions</th></tr></thead><tbody>${projects.map(p=>`
    <tr><td><strong>${safe(p.id)}</strong><br>${safe(p.docTitle)}</td><td>${safe(p.clientName)}<br><small>${safe(p.clientEmail)}</small></td><td><span class="badge ${badgeClass(p.paymentStatus)}">${safe(p.paymentStatus)}</span></td><td><span class="badge ${badgeClass(p.proofreadStatus)}">${safe(p.proofreadStatus)}</span></td><td>${money(p.amount)}</td><td><div class="admin-actions"><button class="mini-btn gold" onclick="adminSetPayment('${safe(p.id)}','Paid')">Mark Paid</button><button class="mini-btn" onclick="adminSetReview('${safe(p.id)}','In Review')">In Review</button><button class="mini-btn" onclick="adminSetComplete('${safe(p.id)}')">Complete</button><button class="mini-btn danger" onclick="adminDeleteProject('${safe(p.id)}')">Delete</button></div></td></tr>`).join('')}</tbody></table>`;
}
function adminSetPayment(id,status){ const p=getProject(id); if(!p)return; updateProject(id,{paymentStatus:status, tracking:[...(p.tracking||[]),{date:datetime(),title:'Payment Verified by Admin',detail:`Payment status changed to ${status}.`}]}); toast('Payment status updated.'); }
function adminSetReview(id,status){ const p=getProject(id); if(!p)return; updateProject(id,{proofreadStatus:status, tracking:[...(p.tracking||[]),{date:datetime(),title:'Proofreading Status Updated',detail:`Proofread status changed to ${status}.`}]}); toast('Proofread status updated.'); }
function adminSetComplete(id){ const p=getProject(id); if(!p)return; updateProject(id,{paymentStatus:p.paymentStatus==='Unpaid'?'Pending Confirmation':p.paymentStatus, proofreadStatus:'Completed', tracking:[...(p.tracking||[]),{date:datetime(),title:'Project Completed',detail:'Final proofreading report and receipt are ready for download.'}]}); toast('Project completed.'); }
function adminDeleteProject(id){ if(!confirm('Delete this project permanently from this browser?')) return; saveProjects(getProjects().filter(p=>p.id!==id)); toast('Project deleted.'); }
function clearDemoData(){ if(!confirm('Clear all local projects and settings?')) return; localStorage.removeItem(STORAGE_PROJECTS); localStorage.removeItem(STORAGE_PACKAGES); savePackages(defaultPackages); toast('All local data cleared.'); }
function renderPackageEditor(){
  const box=$('packageEditor'); if(!box) return;
  box.innerHTML = getPackages().map((p,i)=>`<div class="package-editor-row"><strong>${safe(p.name)}</strong><label>Name<input data-pkg="${i}" data-field="name" value="${safe(p.name)}"></label><label>Price<input data-pkg="${i}" data-field="price" type="number" value="${safe(p.price)}"></label><label>Description<input data-pkg="${i}" data-field="description" value="${safe(p.description)}"></label></div>`).join('');
}
function savePackageSettings(){
  const packages=getPackages();
  document.querySelectorAll('#packageEditor input').forEach(inp=>{ const i=Number(inp.dataset.pkg); const f=inp.dataset.field; packages[i][f] = f==='price' ? Number(inp.value||0) : inp.value; });
  savePackages(packages); toast('Package settings saved.');
}
function exportAllData(){
  const data = { exportedAt: datetime(), owner: OWNER.name, projects:getProjects(), packages:getPackages() };
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='academic-proofread-studio-backup.json'; a.click(); URL.revokeObjectURL(a.href); toast('Backup exported.');
}
function importAllData(){
  try{
    const data=JSON.parse($('importBox').value);
    if(data.projects) localStorage.setItem(STORAGE_PROJECTS, JSON.stringify(data.projects));
    if(data.packages) localStorage.setItem(STORAGE_PACKAGES, JSON.stringify(data.packages));
    refreshAll(); toast('Backup imported successfully.');
  }catch(e){ toast('Invalid JSON backup.'); }
}

window.addEventListener('DOMContentLoaded', init);
