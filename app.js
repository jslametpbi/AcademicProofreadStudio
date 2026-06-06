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
const STORAGE_PROJECTS = 'aps_projects_v4';
const STORAGE_PACKAGES = 'aps_packages_v6';
const STORAGE_ACCESS = 'aps_secure_access_v3';
const STORAGE_ACTIVE = 'aps_active_project_v1';

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
function countWords(text){ return (String(text||'').trim().match(/\b[\w'-]+\b/g) || []).length; }
function splitSentences(text){ return String(text||'').split(/(?<=[.!?])\s+/).map(s=>s.trim()).filter(Boolean); }
function clamp(n,min,max){ return Math.max(min, Math.min(max, Math.round(n))); }
function idShort(){ const d=new Date(); return `APS-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${Math.random().toString(36).slice(2,7).toUpperCase()}`; }
function invoiceNo(project){ return `INV-${project.id.replace('APS-','')}`; }
function receiptNo(project){ return `RCP-${project.id.replace('APS-','')}`; }
function qrUrl(text){ return `https://quickchart.io/qr?size=180&margin=1&text=${encodeURIComponent(text)}`; }
function toast(msg){ const t=$('toast'); if(!t) return; t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2600); }

function getProjects(){ try { return JSON.parse(localStorage.getItem(STORAGE_PROJECTS)) || []; } catch { return []; } }
function getProject(id){ return getProjects().find(p => p.id === id); }
function saveProjects(projects){ localStorage.setItem(STORAGE_PROJECTS, JSON.stringify(projects)); localStorage.setItem(STORAGE_ACTIVE, activeProjectId || ''); refreshAll(); }
function getPackages(){ try { return JSON.parse(localStorage.getItem(STORAGE_PACKAGES)) || defaultPackages; } catch { return defaultPackages; } }
function savePackages(packages){ localStorage.setItem(STORAGE_PACKAGES, JSON.stringify(packages)); refreshAll(); }
function updateProject(id, patch){
  const projects = getProjects();
  const idx = projects.findIndex(p => p.id === id);
  if(idx < 0) return null;
  projects[idx] = { ...projects[idx], ...patch, updatedAt: datetime() };
  saveProjects(projects);
  return projects[idx];
}

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

function demoProjectTemplate(){
  const documentText = `Generative AI for English for Specific Purposes: Undergraduate Students’ Development of Discipline-Specific Vocabulary, Genre Awareness, and Communicative Confidence

Dewi Hidayati

Department of Islamic Education, STAI Diponegoro Tulungagung, Tulungagung, East Java, Indonesia

Correspondence: Dewi Hidayati | Email: dewiaansugianto@gmail.com

Abstract

This study investigates the effects of Generative Artificial Intelligence (GenAI)-integrated English for Specific Purposes (ESP) instruction on undergraduate students’ discipline-specific vocabulary acquisition, genre awareness, and communicative confidence. Employing a mixed-methods quasi-experimental design, 45 undergraduate students from the Department of Islamic Education at STAI Diponegoro Tulungagung, Indonesia, were assigned to an experimental group (n = 23) receiving GenAI-assisted ESP instruction over eight weeks and a control group (n = 22) receiving conventional instruction. Quantitative data were collected using a Discipline-Specific Vocabulary Test, a Genre Awareness Assessment Rubric, and a Communicative Confidence Scale administered pre- and post-intervention, supplemented by semi-structured interviews with twelve purposively selected participants.`;
  const analysis = analyzeText(documentText);
  return {
    id:'APS-DEMO-ESP-2026',
    createdAt:'07 Jun 2026, 00:05',
    updatedAt:'07 Jun 2026, 00:32',
    clientName:'Dewi Hidayati',
    clientEmail:'dewiaansugianto@gmail.com',
    clientWa:'+628123456789',
    clientInstitution:'STAI Diponegoro Tulungagung',
    docTitle:'Generative AI for English for Specific Purposes: Undergraduate Students’ Development of Discipline-Specific Vocabulary, Genre Awareness, and Communicative Confidence',
    writingType:'Journal Article',
    targetStyle:'APA 7th',
    targetJournal:'JOLIE / International language education journal',
    deadline:'2026-06-10',
    packageId:'premium',
    packageName:'Premium Academic Review',
    packagePrice:2500000,
    urgency:'Standard',
    amount:2500000,
    wordCount: countWords(documentText),
    documentText,
    paymentStatus:'Paid',
    proofreadStatus:'Completed',
    costBreakdown:[
      {stage:'Project intake & metadata check', result:'Completed', amount:250000},
      {stage:'AI-assisted language pass', result:'Completed', amount:650000},
      {stage:'Academic style & coherence review', result:'Completed', amount:700000},
      {stage:'Citation, reference & journal readiness check', result:'Completed', amount:400000},
      {stage:'Final proofreading report & release', result:'Completed', amount:500000}
    ],
    tracking:[
      {date:'07 Jun 2026, 00:05', title:'Project Created', detail:'Manuscript metadata, author details, and document were entered into Academic Proofread Studio.'},
      {date:'07 Jun 2026, 00:07', title:'Invoice Generated', detail:'Invoice INV-DEMO-ESP-2026 was issued for Premium Academic Review.'},
      {date:'07 Jun 2026, 00:11', title:'Payment Confirmed', detail:'Transfer verification was completed and the project status changed to Paid.'},
      {date:'07 Jun 2026, 00:18', title:'AI Proofread Completed', detail:'The manuscript was reviewed for grammar, academic tone, clarity, citation consistency, and journal readiness.'},
      {date:'07 Jun 2026, 00:25', title:'Academic Editor Review Completed', detail:'The proofread output was reviewed, polished, and approved for final release.'},
      {date:'07 Jun 2026, 00:32', title:'Final Report & Receipt Released', detail:'The receipt, proofread passport, and final recommendation were generated and archived.'}
    ],
    revisions:[
      {date:'07 Jun 2026, 00:18', action:'Automated proofreading completed', score:analysis.scores.overall, issues:analysis.issues.length},
      {date:'07 Jun 2026, 00:25', action:'Human refinement and editorial polishing completed', score:95, issues:4}
    ],
    analysis: {
      ...analysis,
      date:'07 Jun 2026, 00:18',
      scores:{grammar:96,tone:95,clarity:94,citation:92,journal:95,overall:95},
      recommendation:'Ready for Submission after final author checking.'
    },
    revisedText: analysis.revised
  };
}

function seedInitialData(){
  if(!localStorage.getItem(STORAGE_PACKAGES)) localStorage.setItem(STORAGE_PACKAGES, JSON.stringify(defaultPackages));
  let projects = getProjects();
  if(!projects.length){
    projects = [demoProjectTemplate()];
    localStorage.setItem(STORAGE_PROJECTS, JSON.stringify(projects));
  }
  const remembered = localStorage.getItem(STORAGE_ACTIVE);
  activeProjectId = remembered && getProject(remembered) ? remembered : projects[0]?.id || null;
}

function showAccessPortal(){ $('accessPortal')?.classList.remove('hidden'); document.body.classList.add('portal-open'); }
function hideAccessPortal(){ $('accessPortal')?.classList.add('hidden'); document.body.classList.remove('portal-open'); }
function grantAccess(){ localStorage.setItem(STORAGE_ACCESS,'1'); hideAccessPortal(); }
function portalUnlock(){
  const val = ($('portalPin')?.value || '').trim();
  if(val === ADMIN_PIN){
    grantAccess();
    sessionStorage.setItem('aps_admin','1');
    if($('portalPin')) $('portalPin').value = '';
    toast('Access granted.');
  } else {
    toast('Invalid PIN.');
  }
}

function route(name){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const page = $(name);
  if(page) page.classList.add('active');
  document.querySelectorAll('.sidebar nav button').forEach(b=>b.classList.toggle('active', b.dataset.route === name));
  $('sidebar')?.classList.remove('open');
  renderCurrentPage(name);
  window.scrollTo({top:0, behavior:'smooth'});
}

function renderCurrentPage(name){
  refreshGlobalUI();
  if(name === 'workspace') loadActiveProject();
  if(name === 'tracking') renderTracking();
  if(name === 'payment') renderPayment();
  if(name === 'invoice') renderInvoice();
  if(name === 'reports') renderReport();
  if(name === 'dashboard') renderProjects();
}

function refreshAll(){ refreshGlobalUI(); }

function refreshGlobalUI(){
  renderPackageSelect();
  renderPricing();
  renderMetrics();
  renderProjectSelects();
  renderHomeShowcase();
  renderProjects();
  renderAdminState();
  renderPayment();
  renderTracking();
  renderInvoice();
  renderReport();
  if($('activeProjectSelect')) loadActiveProject();
}

function init(){
  seedInitialData();
  $('menuToggle')?.addEventListener('click', ()=>$('sidebar')?.classList.toggle('open'));
  $('projectForm')?.addEventListener('submit', createProject);
  $('workspaceText')?.addEventListener('input', updateLiveMeta);
  refreshGlobalUI();
  route('home');
  if(localStorage.getItem(STORAGE_ACCESS)==='1') hideAccessPortal();
  else showAccessPortal();
}

function getActiveProject(){
  const projects = getProjects();
  if(activeProjectId && getProject(activeProjectId)) return getProject(activeProjectId);
  activeProjectId = projects[0]?.id || null;
  localStorage.setItem(STORAGE_ACTIVE, activeProjectId || '');
  return activeProjectId ? getProject(activeProjectId) : null;
}
function setActiveProject(id){ if(getProject(id)){ activeProjectId = id; localStorage.setItem(STORAGE_ACTIVE, id); } }

function renderMetrics(){
  const projects = getProjects();
  const paid = projects.filter(p=>['Paid','Completed'].includes(p.paymentStatus)).length;
  const completed = projects.filter(p=>p.proofreadStatus==='Completed' || p.paymentStatus==='Completed').length;
  const pending = projects.filter(p=>['Unpaid','Pending Confirmation'].includes(p.paymentStatus)).length;
  const set=(id,val)=>{ if($(id)) $(id).textContent = val; };
  set('metricProjects', projects.length);
  set('metricPaid', paid);
  set('metricReady', completed);
  set('dashTotal', projects.length);
  set('dashPending', pending);
  set('dashPaid', paid);
  set('dashCompleted', completed);
}

function renderHomeShowcase(){
  const p = getActiveProject();
  if(!p) return;
  const scores = p.analysis?.scores || {};
  const set = (id,val)=>{ if($(id)) $(id).textContent = val; };
  set('homeScore', scores.overall ?? '-');
  set('homeRecommendation', p.analysis?.recommendation || 'Proofread results will appear here.');
  set('featuredStatus', p.proofreadStatus);
  set('featuredTitle', p.docTitle);
  set('featuredMeta', `${p.clientName} · ${p.clientInstitution || '-'}`);
  set('featuredProjectId', p.id);
  set('featuredPackage', p.packageName);
  set('featuredAmount', money(p.amount));
  set('featuredWords', `${Number(p.wordCount||0).toLocaleString('id-ID')} words`);
  set('featuredPayment', p.paymentStatus);
  set('featuredStyle', p.targetStyle);
  if($('homeTimeline')) $('homeTimeline').innerHTML = (p.tracking||[]).slice(0,6).map((t,i)=>`<div class="mini-step"><span>${i+1}</span><div><strong>${safe(t.title)}</strong><small>${safe(t.date)}</small><p>${safe(t.detail)}</p></div></div>`).join('');
  if($('homeResults')) $('homeResults').innerHTML = `
    <div><span>Grammar</span><strong>${scores.grammar ?? '-'}</strong></div>
    <div><span>Tone</span><strong>${scores.tone ?? '-'}</strong></div>
    <div><span>Clarity</span><strong>${scores.clarity ?? '-'}</strong></div>
    <div><span>Citation</span><strong>${scores.citation ?? '-'}</strong></div>
    <div><span>Journal</span><strong>${scores.journal ?? '-'}</strong></div>
    <div><span>Overall</span><strong>${scores.overall ?? '-'}</strong></div>`;
  if($('homeCostTable')) $('homeCostTable').innerHTML = `<thead><tr><th>Workflow Stage</th><th>Result</th><th>Amount</th></tr></thead><tbody>${(p.costBreakdown||[]).map(r=>`<tr><td>${safe(r.stage)}</td><td>${safe(r.result)}</td><td>${money(r.amount)}</td></tr>`).join('')}</tbody><tfoot><tr><th colspan="2">Total Project Fee</th><th>${money(p.amount)}</th></tr></tfoot>`;
}

function renderPackageSelect(){
  const sel = $('packageName');
  if(!sel) return;
  const current = sel.value || getPackages()[0]?.id;
  sel.innerHTML = getPackages().map(p=>`<option value="${safe(p.id)}">${safe(p.name)} — ${money(p.price)}</option>`).join('');
  sel.value = current;
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
function selectPackageAndCreate(id){ route('create'); setTimeout(()=>{ $('packageName').value=id; updatePackageInfo(); },30); }

function createProject(e){
  e.preventDefault();
  const text = $('documentText').value.trim();
  if(!text){ toast('Please enter manuscript text or upload a file.'); return; }
  const wc = Number($('wordCount').value || countWords(text));
  const pkg = getPackages().find(p=>p.id === $('packageName').value) || getPackages()[0];
  const urgency = $('urgency').value;
  const multiplier = urgency === 'Express' ? 1.5 : urgency === 'Urgent' ? 1.25 : 1;
  const amount = Math.round(pkg.price * multiplier);
  const analysis = analyzeText(text);
  const project = {
    id: idShort(),
    createdAt: datetime(), updatedAt: datetime(),
    clientName: $('clientName').value.trim(), clientEmail: $('clientEmail').value.trim(), clientWa: $('clientWa').value.trim(), clientInstitution: $('clientInstitution').value.trim(),
    docTitle: $('docTitle').value.trim(), writingType: $('writingType').value, targetStyle: $('targetStyle').value, targetJournal: $('targetJournal').value.trim(), deadline: $('deadline').value || todayISO(),
    packageId: pkg.id, packageName: pkg.name, packagePrice: pkg.price, urgency, amount, wordCount: wc,
    documentText: text,
    paymentStatus: 'Unpaid', proofreadStatus: 'AI Proofread Completed',
    costBreakdown:[
      {stage:'Project intake & metadata check', result:'Completed', amount:Math.round(amount*0.10)},
      {stage:'AI-assisted language pass', result:'Completed', amount:Math.round(amount*0.25)},
      {stage:'Academic style & coherence review', result:'In Queue', amount:Math.round(amount*0.28)},
      {stage:'Citation, reference & journal readiness check', result:'Queued', amount:Math.round(amount*0.17)},
      {stage:'Final proofreading report & release', result:'Pending', amount:amount - (Math.round(amount*0.10)+Math.round(amount*0.25)+Math.round(amount*0.28)+Math.round(amount*0.17))}
    ],
    tracking: [
      { date: datetime(), title:'Project Created', detail:'Document metadata submitted and project profile created.' },
      { date: datetime(), title:'Invoice Generated', detail:`Invoice prepared for ${pkg.name} and linked to the project profile.` },
      { date: datetime(), title:'AI Proofread Completed', detail:`Initial proofreading finished with overall score ${analysis.scores.overall}.` }
    ],
    revisions: [{date: datetime(), action:'Automated proofreading completed', score:analysis.scores.overall, issues:analysis.issues.length}],
    analysis,
    revisedText: analysis.revised
  };
  const projects = getProjects();
  projects.unshift(project);
  activeProjectId = project.id;
  localStorage.setItem(STORAGE_ACTIVE, project.id);
  saveProjects(projects);
  resetForm();
  toast('Project created and integrated across all sections.');
  financeMode = 'invoice';
  route('dashboard');
}
function resetForm(){ $('projectForm')?.reset(); updatePackageInfo(); if($('documentText')) $('documentText').value=''; if($('wordCount')) $('wordCount').value=''; }
function fillSample(){
  const p = demoProjectTemplate();
  $('clientName').value=p.clientName; $('clientEmail').value=p.clientEmail; $('clientWa').value=p.clientWa; $('clientInstitution').value=p.clientInstitution;
  $('docTitle').value=p.docTitle; $('writingType').value=p.writingType; $('targetStyle').value=p.targetStyle; $('targetJournal').value=p.targetJournal;
  $('deadline').value=p.deadline; $('packageName').value=p.packageId; $('wordCount').value=String(p.wordCount); $('urgency').value=p.urgency; $('documentText').value=p.documentText;
  updatePackageInfo(); toast('Real manuscript sample inserted.');
}
function readUploadedText(){
  const file = $('fileUpload').files[0];
  if(!file){ toast('Please choose a text file first.'); return; }
  const reader = new FileReader();
  reader.onload = e => { $('documentText').value = String(e.target.result || '').replace(/[{}\\]/g,' ').trim(); $('wordCount').value = countWords($('documentText').value); toast('Uploaded text has been loaded.'); };
  reader.readAsText(file);
}

function badgeClass(status){
  if(status==='Unpaid') return 'unpaid';
  if(status==='Pending Confirmation' || status==='Uploaded' || status==='Queued' || status==='Pending') return 'pending';
  if(status==='Paid' || status==='In Review' || status==='AI Proofread Completed') return 'paid';
  if(status==='Completed' || status==='Ready for Download') return 'completed';
  return 'pending';
}

function openProject(id, page){ setActiveProject(id); route(page); }
function renderProjects(){
  const list = $('projectList'); if(!list) return;
  const q = ($('projectSearch')?.value || '').toLowerCase();
  const f = $('projectFilter')?.value || 'all';
  let projects = getProjects();
  if(f !== 'all') projects = projects.filter(p=>p.paymentStatus===f || p.proofreadStatus===f);
  if(q) projects = projects.filter(p=>[p.id,p.docTitle,p.clientName,p.paymentStatus,p.proofreadStatus,p.packageName].join(' ').toLowerCase().includes(q));
  if(!projects.length){ list.innerHTML = '<div class="empty-state">No projects found. Create a new proofreading project to begin.</div>'; return; }
  list.innerHTML = projects.map(p=>`
    <div class="project-row ${activeProjectId===p.id?'active':''}">
      <div class="project-title">
        <span class="brand-mark">${safe(p.id.slice(-2))}</span>
        <div>
          <h3>${safe(p.docTitle)}</h3>
          <p><strong>${safe(p.id)}</strong> · ${safe(p.clientName)} · ${safe(p.packageName)} · ${money(p.amount)}</p>
          <p>${safe(p.writingType)} · ${safe(p.targetStyle)} · Created ${safe(p.createdAt)}</p>
          <div class="inline-badges"><span class="badge ${badgeClass(p.paymentStatus)}">${safe(p.paymentStatus)}</span><span class="badge ${badgeClass(p.proofreadStatus)}">${safe(p.proofreadStatus)}</span></div>
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

function renderProjectSelects(){
  const projects = getProjects();
  if(!activeProjectId && projects[0]) activeProjectId = projects[0].id;
  const html = projects.map(p=>`<option value="${safe(p.id)}">${safe(p.id)} — ${safe(p.clientName)} — ${safe(p.docTitle.slice(0,60))}</option>`).join('');
  ['activeProjectSelect','trackingProjectSelect','paymentProjectSelect','invoiceProjectSelect','reportProjectSelect'].forEach(id => {
    const el = $(id); if(!el) return;
    const current = el.value || activeProjectId;
    el.innerHTML = html;
    el.value = current && getProject(current) ? current : (projects[0]?.id || '');
  });
}

function loadActiveProject(){
  const id = $('activeProjectSelect')?.value || activeProjectId;
  const p = getProject(id);
  if(!p){ clearAnalysis(); return; }
  setActiveProject(p.id);
  $('workspaceText').value = p.documentText || '';
  $('revisedText').value = p.revisedText || '';
  p.analysis ? showAnalysis(p.analysis) : clearAnalysis();
  updateLiveMeta();
}
function updateLiveMeta(){ const text=$('workspaceText')?.value || ''; if($('liveWords')) $('liveWords').textContent=`${countWords(text)} words`; if($('liveSentences')) $('liveSentences').textContent=`${splitSentences(text).length} sentences`; }
function clearAnalysis(){ ['scoreGrammar','scoreTone','scoreClarity','scoreCitation','scoreJournal','scoreOverall'].forEach(id=>{ if($(id)) $(id).textContent='-'; }); if($('issueList')){ $('issueList').innerHTML='Run proofreading to see detailed issues and suggestions.'; $('issueList').className='issue-list empty-state'; } }

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
  const grammar = clamp(96 - high*8 - med*3, 45, 98);
  const tone = clamp(94 - issues.filter(i=>i.type==='Academic Tone').length*5 - (lower.match(/\b(very|a lot|thing|good|bad|big)\b/g)||[]).length*3, 42, 98);
  const clarity = clamp(95 - issues.filter(i=>['Clarity','Cohesion','Organization'].includes(i.type)).length*5, 40, 98);
  const citation = clamp(/\([A-Za-z][A-Za-z\-]+,\s?\d{4}\)|\bet al\.\b|\[\d+\]/.test(text) ? 88 - lowc : 62 - high*2, 35, 96);
  const journal = clamp(90 - issues.filter(i=>['Journal Readiness','Submission Checklist'].includes(i.type)).length*10 - (words<150?12:0), 38, 97);
  const overall = Math.round((grammar+tone+clarity+citation+journal)/5);
  const recommendation = overall >= 85 ? 'Ready for Submission after Minor Checking' : overall >= 70 ? 'Minor to Moderate Academic Revision Needed' : 'Major Academic Revision Needed';
  return { date: datetime(), words, sentences: sentences.length, paragraphs: paragraphs.length, issues, scores:{grammar,tone,clarity,citation,journal,overall}, revised, recommendation };
}
function makeAcademicRevision(text){
  let out = text;
  [
    [/\bThis study aims to investigate\b/gi,'This study investigates'],
    [/\bgot better\b/gi,'demonstrated measurable improvement'],
    [/\bget many benefits\b/gi,'gain several pedagogical benefits'],
    [/\bthe tool help\b/gi,'the tool helps'],
    [/\bThe result show\b/gi,'The results show'],
    [/\bdiscussion still need\b/gi,'discussion still needs'],
    [/\bvery useful\b/gi,'pedagogically valuable'],
    [/\ba lot of\b/gi,'numerous'],
    [/\bthings\b/gi,'aspects'],
    [/\bIn conclusion, AI is\b/gi,'In conclusion, AI-assisted support appears to be']
  ].forEach(([rx,r])=>out = out.replace(rx,r));
  if(out === text) out = text.replace(/\bshow\b/g,'indicate').replace(/\bshows\b/g,'indicates');
  return out;
}
function runProofread(){
  const text = $('workspaceText').value.trim();
  if(!text){ toast('Please paste or select text first.'); return; }
  const analysis = analyzeText(text);
  lastAnalysis = analysis;
  showAnalysis(analysis);
  $('revisedText').value = analysis.revised;
  toast('Proofreading analysis completed.');
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
  renderCurrentPage('workspace');
  toast('Proofreading results saved to project.');
}

function renderTracking(){
  const id = $('trackingProjectSelect')?.value || activeProjectId;
  const p = getProject(id); const box=$('trackingView');
  if(!box) return;
  if(!p){ box.className='tracking-view empty-state'; box.innerHTML='Select a project to view tracking results.'; return; }
  setActiveProject(p.id);
  const scores = p.analysis?.scores;
  box.className='tracking-view';
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
        <div class="timeline">${(p.tracking||[]).map((t,i)=>`<div class="time-step done"><div class="time-dot">${i+1}</div><div class="time-box"><strong>${safe(t.title)}</strong><br><small>${safe(t.date)}</small><p>${safe(t.detail)}</p></div></div>`).join('')}</div>
      </div>
    </div>
    <div class="card" style="margin-top:18px"><h3>Revision History</h3><div class="revision-log">${(p.revisions||[]).map(r=>`<div><strong>${safe(r.action || r.section || 'Revision')}</strong><br><small>${safe(r.date || '')}</small><p>Score: ${safe(r.score ?? '-')} · Issues: ${safe(r.issues ?? '-')}</p></div>`).join('') || '<div>No revision record yet.</div>'}</div></div>`;
}

function renderPayment(){
  const id = $('paymentProjectSelect')?.value || activeProjectId;
  const p = getProject(id); const box=$('paymentDetails'); const wa = $('waConfirm');
  if(!box) return;
  if(!p){ box.className='card empty-state'; box.innerHTML='Select a project to view payment details.'; if(wa) wa.href=`https://wa.me/${OWNER.whatsapp.replace(/\D/g,'')}`; return; }
  setActiveProject(p.id);
  const message = `Payment Confirmation - Academic Proofread Studio\nProject ID: ${p.id}\nDocument: ${p.docTitle}\nClient: ${p.clientName}\nAmount: ${money(p.amount)}`;
  if(wa) wa.href = `https://wa.me/${OWNER.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(message)}`;
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
  toast('Payment confirmation submitted. Please send proof by WhatsApp or email.');
}

function renderInvoice(){
  const id = $('invoiceProjectSelect')?.value || activeProjectId;
  const p = getProject(id); const box=$('financeDoc');
  if(!box) return;
  if(!p){ box.className='paper empty-state'; box.innerHTML='Select a project to generate invoice or receipt.'; return; }
  setActiveProject(p.id);
  box.className='paper';
  box.innerHTML = financeMode === 'invoice' ? invoiceHTML(p) : receiptHTML(p);
  if($('financeModeBtn')) $('financeModeBtn').textContent = financeMode === 'invoice' ? 'Switch to Receipt' : 'Switch to Invoice';
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
  <div style="display:flex;justify-content:space-between;gap:20px;align-items:end;flex-wrap:wrap"><div><h3>Verification</h3><img class="qr-img" src="${qrUrl('Academic Proofread Studio Invoice '+p.id+' '+p.clientName+' '+p.docTitle)}" alt="Invoice verification QR"><p><small>Scan to verify project reference text.</small></p></div>${signatureBlock('Issued by,')}</div>`;
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
  <div style="display:flex;justify-content:space-between;gap:20px;align-items:end;flex-wrap:wrap"><div><h3>Receipt Verification</h3><img class="qr-img" src="${qrUrl('Academic Proofread Studio Receipt '+p.id+' '+p.clientName+' '+p.paymentStatus)}" alt="Receipt verification QR"><p><small>Verification Code: ${safe(receiptNo(p))}</small></p></div>${signatureBlock('Confirmed by,')}</div>`;
}

function renderReport(){
  const id = $('reportProjectSelect')?.value || activeProjectId;
  const p = getProject(id); const box=$('reportDoc');
  if(!box) return;
  if(!p){ box.className='paper empty-state'; box.innerHTML='Select a project to generate a proofread report.'; return; }
  setActiveProject(p.id);
  const a = p.analysis;
  const scores = a?.scores || {grammar:'-',tone:'-',clarity:'-',citation:'-',journal:'-',overall:'-'};
  const ready = Number(scores.overall||0) >= 85;
  box.className='paper';
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
    <div class="report-section"><h3>Activity History</h3><ul>${(p.tracking||[]).map(t=>`<li><strong>${safe(t.title)}</strong> — ${safe(t.date)} — ${safe(t.detail)}</li>`).join('')}</ul></div>
    <div class="report-section"><h3>Academic Integrity & AI-Use Note</h3><p>This report documents language-focused proofreading and manuscript-readiness support. Authors remain responsible for content accuracy, originality, citations, ethical compliance, and journal-specific declarations.</p></div>
    <div style="display:flex;justify-content:space-between;gap:20px;align-items:end;flex-wrap:wrap"><div><h3>QR Verification</h3><img class="qr-img" src="${qrUrl('Academic Proofread Studio Report '+p.id+' '+p.docTitle+' Overall '+scores.overall)}" alt="Report verification QR"><p><small>Verification Code: ${safe(p.id)}</small></p></div>${signatureBlock('Prepared by,')}</div>`;
}

function printSection(id){ const el=$(id); if(!el) return; const original=document.body.innerHTML; document.body.innerHTML=`<main style="padding:28px">${el.outerHTML}</main>`; window.print(); document.body.innerHTML=original; location.reload(); }
function downloadHTML(filename, content){ const blob = new Blob([`<!doctype html><html><head><meta charset="utf-8"><title>${safe(filename)}</title><link rel="stylesheet" href="styles.css"></head><body><main style="padding:28px">${content}</main></body></html>`], {type:'text/html'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); URL.revokeObjectURL(a.href); }
function downloadFinanceHTML(){ const p=getActiveProject(); if(!p){toast('Select a project first.');return;} downloadHTML(`${financeMode}-${p.id}.html`, $('financeDoc').outerHTML); }
function downloadReportHTML(){ const p=getActiveProject(); if(!p){toast('Select a project first.');return;} downloadHTML(`proofread-report-${p.id}.html`, $('reportDoc').outerHTML); }

function adminLogin(){ if(($('adminPin').value || '') === ADMIN_PIN){ sessionStorage.setItem('aps_admin','1'); grantAccess(); $('adminPin').value=''; renderAdminState(); toast('Admin unlocked.'); } else toast('Invalid admin PIN.'); }
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
function adminDeleteProject(id){ if(!confirm('Delete this project permanently from this browser?')) return; const next = getProjects().filter(p=>p.id!==id); if(activeProjectId===id) activeProjectId = next[0]?.id || null; saveProjects(next); toast('Project deleted.'); }
function clearDemoData(){ if(!confirm('Clear all local projects and settings?')) return; localStorage.removeItem(STORAGE_PROJECTS); localStorage.removeItem(STORAGE_PACKAGES); localStorage.removeItem(STORAGE_ACTIVE); seedInitialData(); refreshGlobalUI(); toast('All local data reset.'); }
function renderPackageEditor(){ const box=$('packageEditor'); if(!box) return; box.innerHTML = getPackages().map((p,i)=>`<div class="package-editor-row"><strong>${safe(p.name)}</strong><label>Name<input data-pkg="${i}" data-field="name" value="${safe(p.name)}"></label><label>Price<input data-pkg="${i}" data-field="price" type="number" value="${safe(p.price)}"></label><label>Description<input data-pkg="${i}" data-field="description" value="${safe(p.description)}"></label></div>`).join(''); }
function savePackageSettings(){ const packages=getPackages(); document.querySelectorAll('#packageEditor input').forEach(inp=>{ const i=Number(inp.dataset.pkg); const f=inp.dataset.field; packages[i][f] = f==='price' ? Number(inp.value||0) : inp.value; }); savePackages(packages); toast('Package settings saved.'); }
function exportAllData(){ const data = { exportedAt: datetime(), owner: OWNER.name, projects:getProjects(), packages:getPackages() }; const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='academic-proofread-studio-backup.json'; a.click(); URL.revokeObjectURL(a.href); toast('Backup exported.'); }
function importAllData(){ try{ const data=JSON.parse($('importBox').value); if(data.projects) localStorage.setItem(STORAGE_PROJECTS, JSON.stringify(data.projects)); if(data.packages) localStorage.setItem(STORAGE_PACKAGES, JSON.stringify(data.packages)); seedInitialData(); refreshGlobalUI(); toast('Backup imported successfully.'); }catch(e){ toast('Invalid JSON backup.'); } }

window.addEventListener('DOMContentLoaded', init);
