
const ADMIN_PIN = 'JS2026';
const OWNER = {
  name:'Dr. Joko Slamet',
  email:'jokoslamet@cwcu.ac.id',
  wa:'+6282338202233',
  bca:'0183188531',
  mandiri:'1410025957408',
  account:'Joko Slamet'
};
const LS_PROJECTS='aps_pro_projects_v1';
const LS_PACKAGES='aps_pro_packages_v1';
const SS_ACCESS='aps_pro_access';
const SS_ADMIN='aps_pro_admin';
const SS_ACTIVE='aps_pro_active';
let activeProjectId = null;
let docMode = 'invoice';
let lastAnalysis = null;

const $ = id => document.getElementById(id);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const money = n => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const safe = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const now = () => new Date().toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'});
const countWords = text => (String(text||'').trim().match(/\b[\w'-]+\b/g)||[]).length;
const sentences = text => String(text||'').split(/(?<=[.!?])\s+/).filter(Boolean);
const clamp = (n,min,max) => Math.max(min, Math.min(max, Math.round(n)));
const toast = msg => { const t=$('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2300); };
const qr = txt => `https://quickchart.io/qr?size=180&margin=1&text=${encodeURIComponent(txt)}`;

const defaultPackages = [
  {id:'basic',name:'Basic Proofread',price:500000,unit:'up to 1,000 words',featured:false,description:'Grammar, punctuation, spelling, sentence clarity, and basic proofreading.',features:['Grammar and punctuation','Typo and consistency check','Basic clarity feedback','Invoice and receipt']},
  {id:'academic',name:'Academic Proofread',price:1000000,unit:'up to 2,500 words',featured:true,description:'Academic tone, coherence, EFL writing support, and sentence-level revision.',features:['Academic tone enhancement','Cohesion and clarity check','Sentence revision','Proofread tracking report']},
  {id:'manuscript',name:'Manuscript Readiness',price:1750000,unit:'journal article draft, 4,000–6,000 words',featured:false,description:'Full journal-article proofreading with citation and manuscript-readiness scoring.',features:['IMRaD section review','Citation consistency','Journal readiness score','Proofread Passport']},
  {id:'premium',name:'Premium Academic Review',price:2500000,unit:'full manuscript + expert note',featured:false,description:'Comprehensive manuscript review, deep academic editing, and expert editorial note.',features:['Deep academic revision','Reviewer simulation notes','Ethics/AI declaration check','Priority report']},
];

function getPackages(){try{return JSON.parse(localStorage.getItem(LS_PACKAGES))||defaultPackages}catch{return defaultPackages}}
function savePackages(p){localStorage.setItem(LS_PACKAGES,JSON.stringify(p)); renderAll();}
function getProjects(){try{return JSON.parse(localStorage.getItem(LS_PROJECTS))||[]}catch{return[]}}
function setProjects(p){localStorage.setItem(LS_PROJECTS,JSON.stringify(p)); renderAll();}
function getProject(id){return getProjects().find(p=>p.id===id)}
function activeProject(){const ps=getProjects(); if(activeProjectId && getProject(activeProjectId)) return getProject(activeProjectId); activeProjectId=sessionStorage.getItem(SS_ACTIVE)||ps[0]?.id||null; return getProject(activeProjectId)||ps[0]||null}
function setActive(id){if(getProject(id)){activeProjectId=id;sessionStorage.setItem(SS_ACTIVE,id)}}
function newId(){const d=new Date();return `APS-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${Math.random().toString(36).slice(2,7).toUpperCase()}`}
function invoiceNo(p){return `INV-${p.id.replace('APS-','')}`}
function receiptNo(p){return `RCP-${p.id.replace('APS-','')}`}

function analyzeText(text){
  const w=countWords(text), ss=sentences(text), ps=String(text||'').split(/\n\s*\n/).filter(p=>p.trim());
  const issues=[];
  const add=(type,detail,suggestion,severity='medium')=>issues.push({type,detail,suggestion,severity});
  const checks=[
    [/the result show/i,'Grammar','Subject–verb agreement problem.','Revise to “the results show” or “the result shows”.','high'],
    [/tool help/i,'Grammar','Third-person singular verb form needed.','Revise to “the tool helps”.','high'],
    [/very useful|a lot of|things|got better/i,'Academic Tone','Informal or vague expression detected.','Use more formal academic vocabulary and specific nouns.','medium'],
    [/prove(s|d)?/i,'Academic Caution','Overly strong claim detected.','Use cautious reporting verbs such as “indicates” or “suggests”.','medium']
  ];
  checks.forEach(([rx,type,detail,sug,sev])=>{if(rx.test(text)) add(type,detail,sug,sev)});
  ss.forEach((s,i)=>{const cw=countWords(s); if(cw>38)add('Clarity',`Sentence ${i+1} is long (${cw} words).`,'Split into clearer academic units.','medium')});
  if(!/\([A-Za-z][A-Za-z-]+,\s?\d{4}\)|et al\.|\[\d+\]/.test(text)&&w>120)add('Citation','No clear in-text citation pattern detected.','Add source support for claims and literature statements.','high');
  if(!/method|participants|results|discussion|conclusion/i.test(text)&&w>250)add('Journal Readiness','Limited IMRaD markers detected.','Clarify purpose, method, results, discussion, and contribution.','medium');
  if(!/ethic|consent|funding|conflict|AI declaration/i.test(text)&&w>500)add('Submission Checklist','Ethics/funding/AI declaration elements are not visible.','Add required publication statements where appropriate.','low');
  const high=issues.filter(i=>i.severity==='high').length, med=issues.filter(i=>i.severity==='medium').length, low=issues.filter(i=>i.severity==='low').length;
  const grammar=clamp(97-high*10-med*2,45,98);
  const tone=clamp(95-issues.filter(i=>i.type==='Academic Tone').length*6-med*2,42,98);
  const clarity=clamp(95-issues.filter(i=>i.type==='Clarity').length*5,40,98);
  const citation=clamp(/(\([A-Za-z][A-Za-z-]+,\s?\d{4}\)|et al\.|\[\d+\])/.test(text)?92-low:65-high*3,35,96);
  const journal=clamp(93-issues.filter(i=>['Journal Readiness','Submission Checklist'].includes(i.type)).length*8-(w<150?10:0),38,97);
  const overall=Math.round((grammar+tone+clarity+citation+journal)/5);
  return {date:now(),words:w,sentences:ss.length,paragraphs:ps.length,issues,scores:{grammar,tone,clarity,citation,journal,overall},recommendation:overall>=85?'Ready for Submission after final author checking.':overall>=70?'Minor to Moderate Academic Revision Needed.':'Major Academic Revision Needed.',revised:reviseText(text)};
}
function reviseText(t){return String(t||'')
  .replace(/\bThis study aims to investigate\b/gi,'This study investigates')
  .replace(/\bthe result show\b/gi,'the results show')
  .replace(/\btool help\b/gi,'tool helps')
  .replace(/\bgot better\b/gi,'demonstrated measurable improvement')
  .replace(/\bvery useful\b/gi,'pedagogically valuable')
  .replace(/\ba lot of\b/gi,'numerous')
  .replace(/\bthings\b/gi,'aspects')}

function demoProject(){
 const text=`Generative AI for English for Specific Purposes: Undergraduate Students’ Development of Discipline-Specific Vocabulary, Genre Awareness, and Communicative Confidence

Dewi Hidayati
Department of Islamic Education, STAI Diponegoro Tulungagung, Tulungagung, East Java, Indonesia

Abstract
This study investigates the effects of Generative Artificial Intelligence (GenAI)-integrated English for Specific Purposes (ESP) instruction on undergraduate students’ discipline-specific vocabulary acquisition, genre awareness, and communicative confidence. Employing a mixed-methods quasi-experimental design, 45 undergraduate students from the Department of Islamic Education at STAI Diponegoro Tulungagung, Indonesia, were assigned to an experimental group receiving GenAI-assisted ESP instruction over eight weeks and a control group receiving conventional instruction. Quantitative data were collected using a Discipline-Specific Vocabulary Test, a Genre Awareness Assessment Rubric, and a Communicative Confidence Scale administered pre- and post-intervention, supplemented by semi-structured interviews with twelve purposively selected participants.`;
 const analysis=analyzeText(text);
 analysis.scores={grammar:96,tone:95,clarity:94,citation:92,journal:95,overall:95};
 analysis.recommendation='Ready for Submission after final author checking.';
 return {
   id:'APS-DEMO-ESP-2026',createdAt:'07 Jun 2026, 00:05',updatedAt:'07 Jun 2026, 00:32',
   clientName:'Dewi Hidayati',clientEmail:'dewiaansugianto@gmail.com',clientWa:'+628123456789',clientInstitution:'STAI Diponegoro Tulungagung',
   docTitle:'Generative AI for English for Specific Purposes: Undergraduate Students’ Development of Discipline-Specific Vocabulary, Genre Awareness, and Communicative Confidence',
   writingType:'Journal Article',targetStyle:'APA 7th',targetJournal:'JOLIE / International language education journal',deadline:'2026-06-10',
   packageId:'premium',packageName:'Premium Academic Review',packagePrice:2500000,urgency:'Standard',amount:2500000,wordCount:countWords(text),documentText:text,
   paymentStatus:'Paid',proofreadStatus:'Completed',
   tracking:[
    {date:'07 Jun 2026, 00:05',title:'Project Created',detail:'Manuscript metadata and document were submitted.'},
    {date:'07 Jun 2026, 00:07',title:'Invoice Generated',detail:'Invoice was generated and linked to the project.'},
    {date:'07 Jun 2026, 00:11',title:'Payment Verified',detail:'Payment status was marked as Paid.'},
    {date:'07 Jun 2026, 00:18',title:'AI Proofread Completed',detail:'Language, tone, clarity, citation, and journal readiness were checked.'},
    {date:'07 Jun 2026, 00:25',title:'Academic Review Completed',detail:'Final editorial checking was completed.'},
    {date:'07 Jun 2026, 00:32',title:'Report Released',detail:'Receipt and Proofread Passport were released.'}
   ],
   costBreakdown:[
    {stage:'Project intake & metadata check',result:'Completed',amount:250000},
    {stage:'AI-assisted language pass',result:'Completed',amount:650000},
    {stage:'Academic style & coherence review',result:'Completed',amount:700000},
    {stage:'Citation/reference & journal readiness check',result:'Completed',amount:400000},
    {stage:'Final report & release',result:'Completed',amount:500000}
   ],
   revisions:[{date:'07 Jun 2026, 00:18',action:'Automated proofreading completed',score:95,issues:4},{date:'07 Jun 2026, 00:25',action:'Expert editorial polishing completed',score:95,issues:0}],
   analysis,revisedText:analysis.revised
 };
}
function seed(){
 if(!localStorage.getItem(LS_PACKAGES)) localStorage.setItem(LS_PACKAGES,JSON.stringify(defaultPackages));
 if(!getProjects().length) localStorage.setItem(LS_PROJECTS,JSON.stringify([demoProject()]));
 activeProjectId=sessionStorage.getItem(SS_ACTIVE)||getProjects()[0]?.id||null;
}
function showLogin(){ $('loginGate').classList.remove('hidden'); $('appShell').classList.add('hidden'); setTimeout(()=>$('loginPin').focus(),60); }
function showApp(){ $('loginGate').classList.add('hidden'); $('appShell').classList.remove('hidden'); renderAll(); route('home'); }
function unlock(){
 const v=$('loginPin').value.trim();
 if(v===ADMIN_PIN){ sessionStorage.setItem(SS_ACCESS,'1'); sessionStorage.setItem(SS_ADMIN,'1'); $('loginPin').value=''; showApp(); toast('Access granted.'); }
 else { $('loginPin').classList.add('shake'); $('loginPin').focus(); $('loginPin').select(); setTimeout(()=>$('loginPin').classList.remove('shake'),400); toast('Invalid PIN.'); }
}
function logout(){ sessionStorage.removeItem(SS_ACCESS); sessionStorage.removeItem(SS_ADMIN); showLogin(); toast('Logged out.'); }

function route(page){
 $$('.page').forEach(p=>p.classList.toggle('active',p.id===page));
 $$('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
 $('sidebar').classList.remove('open');
 renderPage(page);
 window.scrollTo({top:0,behavior:'smooth'});
}
function renderPage(page){ renderAll(false); if(page==='workspace')loadWorkspace(); if(page==='tracking')renderTracking(); if(page==='payment')renderPayment(); if(page==='documents')renderDocument(); if(page==='reports')renderReport(); if(page==='admin')renderAdmin(); }
function renderAll(includePage=true){ renderSelects(); renderPackages(); renderDashboard(); renderHome(); if(includePage){ const p=document.querySelector('.page.active')?.id||'home'; if(p) renderPage(p); } }

function renderHome(){
 const p=activeProject(); if(!p)return; const ps=getProjects(), paid=ps.filter(x=>x.paymentStatus==='Paid'||x.paymentStatus==='Completed').length, comp=ps.filter(x=>x.proofreadStatus==='Completed').length, s=p.analysis?.scores||{};
 $('homeProjectCount').textContent=ps.length; $('homePaidCount').textContent=paid; $('homeCompleteCount').textContent=comp; $('homeScore').textContent=s.overall??'-'; $('homeRecommendation').textContent=p.analysis?.recommendation||'-';
 $('previewStatus').textContent=p.proofreadStatus; $('previewStatus').className='status '+(p.proofreadStatus==='Completed'?'paid':'pending');
 $('previewTitle').textContent=p.docTitle; $('previewId').textContent=p.id; $('previewClient').textContent=p.clientName; $('previewPackage').textContent=p.packageName; $('previewFee').textContent=money(p.amount); $('previewPayment').textContent=p.paymentStatus; $('previewType').textContent=p.writingType;
 $('miniTimeline').innerHTML=(p.tracking||[]).slice(0,6).map((t,i)=>`<div class="mini-step"><b>${i+1}</b><div><strong>${safe(t.title)}</strong><small>${safe(t.date)}</small><p>${safe(t.detail)}</p></div></div>`).join('');
}
function renderDashboard(){
 const list=$('projectList'); if(!list)return; const ps=getProjects();
 const paid=ps.filter(p=>p.paymentStatus==='Paid'||p.paymentStatus==='Completed').length, comp=ps.filter(p=>p.proofreadStatus==='Completed').length, pending=ps.filter(p=>p.paymentStatus==='Unpaid'||p.paymentStatus==='Pending Confirmation').length;
 $('dashTotal').textContent=ps.length; $('dashPaid').textContent=paid; $('dashCompleted').textContent=comp; $('dashPending').textContent=pending;
 const q=($('projectSearch')?.value||'').toLowerCase(), f=$('projectFilter')?.value||'all';
 let rows=ps.filter(p=>(f==='all'||p.paymentStatus===f||p.proofreadStatus===f)&&[p.id,p.docTitle,p.clientName,p.packageName,p.paymentStatus,p.proofreadStatus].join(' ').toLowerCase().includes(q));
 list.innerHTML=rows.length?rows.map(p=>`<div class="project-row ${p.id===activeProjectId?'active':''}"><div class="project-title"><h3>${safe(p.docTitle)}</h3><p><strong>${safe(p.id)}</strong> · ${safe(p.clientName)} · ${safe(p.packageName)} · ${money(p.amount)}</p><p><span class="status ${statusClass(p.paymentStatus)}">${safe(p.paymentStatus)}</span> <span class="status ${statusClass(p.proofreadStatus)}">${safe(p.proofreadStatus)}</span></p></div><div class="project-actions"><button class="mini-btn" onclick="openProject('${p.id}','workspace')">Proofread</button><button class="mini-btn" onclick="openProject('${p.id}','tracking')">Track</button><button class="mini-btn gold" onclick="openProject('${p.id}','documents')">Invoice</button><button class="mini-btn" onclick="openProject('${p.id}','reports')">Report</button></div></div>`).join(''):'<div class="card">No projects found.</div>';
}
function statusClass(st){ if(st==='Unpaid')return'unpaid'; if(st==='Pending Confirmation'||st==='In Review'||st==='AI Proofread Completed')return'pending'; if(st==='Paid'||st==='Completed')return'paid'; return'info'; }
function openProject(id,page){ setActive(id); route(page); }

function renderSelects(){
 const opts=getProjects().map(p=>`<option value="${p.id}">${safe(p.id)} — ${safe(p.clientName)} — ${safe(p.docTitle.slice(0,54))}</option>`).join('');
 ['workspaceSelect','trackingSelect','paymentSelect','docSelect','reportSelect'].forEach(id=>{const el=$(id); if(!el)return; el.innerHTML=opts; el.value=activeProject()?.id||'';});
}
function renderPackages(){
 const sel=$('packageName'); if(sel){ const cur=sel.value||'premium'; sel.innerHTML=getPackages().map(p=>`<option value="${p.id}">${safe(p.name)} — ${money(p.price)}</option>`).join(''); sel.value=getPackages().some(p=>p.id===cur)?cur:'premium'; updatePackageInfo(); }
 const cards=$('pricingCards'); if(cards)cards.innerHTML=getPackages().map(p=>`<article class="card pricing-card ${p.featured?'featured':''}"><h3>${safe(p.name)}</h3><p>${safe(p.description)}</p><div class="price">${money(p.price)}</div><small>${safe(p.unit)}</small><ul>${p.features.map(f=>`<li>${safe(f)}</li>`).join('')}</ul><button class="btn gold" onclick="choosePackage('${p.id}')">Choose Package</button></article>`).join('');
}
function updatePackageInfo(){ const p=getPackages().find(p=>p.id===$('packageName')?.value)||getPackages()[0]; if($('packageInfo')&&p)$('packageInfo').innerHTML=`<strong>${safe(p.name)}</strong><br>${safe(p.description)}<br><b>${money(p.price)}</b> <small>${safe(p.unit)}</small>`; }
function choosePackage(id){route('create'); setTimeout(()=>{$('packageName').value=id;updatePackageInfo();},50);}

function fillSample(){ const p=demoProject(); ['clientName','clientEmail','clientWa','clientInstitution','docTitle','writingType','targetStyle','targetJournal','deadline','urgency','documentText'].forEach(k=>{if($(k))$(k).value=p[k]||''}); $('packageName').value='premium'; $('wordCount').value=p.wordCount; updatePackageInfo(); toast('Real sample inserted.'); }
function resetForm(){ $('projectForm').reset(); updatePackageInfo(); }
function createProject(e){
 e.preventDefault(); const text=$('documentText').value.trim(); if(!text){toast('Please paste manuscript text.');return;}
 const pkg=getPackages().find(p=>p.id===$('packageName').value)||getPackages()[0], urgency=$('urgency').value, mult=urgency==='Express'?1.5:urgency==='Urgent'?1.25:1, amount=Math.round(pkg.price*mult), analysis=analyzeText(text);
 const p={id:newId(),createdAt:now(),updatedAt:now(),clientName:$('clientName').value.trim(),clientEmail:$('clientEmail').value.trim(),clientWa:$('clientWa').value.trim(),clientInstitution:$('clientInstitution').value.trim(),docTitle:$('docTitle').value.trim(),writingType:$('writingType').value,targetStyle:$('targetStyle').value,targetJournal:$('targetJournal').value.trim(),deadline:$('deadline').value,packageId:pkg.id,packageName:pkg.name,packagePrice:pkg.price,urgency,amount,wordCount:Number($('wordCount').value||countWords(text)),documentText:text,paymentStatus:'Unpaid',proofreadStatus:'AI Proofread Completed',tracking:[{date:now(),title:'Project Created',detail:'Document metadata and manuscript text submitted.'},{date:now(),title:'Invoice Generated',detail:'Invoice was automatically created.'},{date:now(),title:'AI Proofread Completed',detail:`Overall score ${analysis.scores.overall}.`}],costBreakdown:[{stage:'Project intake',result:'Completed',amount:Math.round(amount*.10)},{stage:'AI-assisted language pass',result:'Completed',amount:Math.round(amount*.25)},{stage:'Academic style review',result:'In Queue',amount:Math.round(amount*.28)},{stage:'Citation and journal readiness',result:'Queued',amount:Math.round(amount*.17)},{stage:'Final report',result:'Pending',amount:Math.round(amount*.20)}],revisions:[{date:now(),action:'Automated proofreading completed',score:analysis.scores.overall,issues:analysis.issues.length}],analysis,revisedText:analysis.revised};
 const ps=getProjects(); ps.unshift(p); setActive(p.id); setProjects(ps); resetForm(); toast('Project created and integrated.'); route('dashboard');
}
function updateProject(id,patch){const ps=getProjects(); const i=ps.findIndex(p=>p.id===id); if(i<0)return; ps[i]={...ps[i],...patch,updatedAt:now()}; setProjects(ps);}

function loadWorkspace(){ const p=activeProject(); if(!p)return; $('workspaceSelect').value=p.id; $('workspaceText').value=p.documentText||''; $('revisedText').value=p.revisedText||''; showAnalysis(p.analysis); updateLiveMeta(); }
function updateLiveMeta(){ const t=$('workspaceText').value||''; $('liveWords').textContent=`${countWords(t)} words`; $('liveSentences').textContent=`${sentences(t).length} sentences`; }
function runProof(){ const t=$('workspaceText').value.trim(); if(!t){toast('Paste or select text first.');return;} lastAnalysis=analyzeText(t); showAnalysis(lastAnalysis); $('revisedText').value=lastAnalysis.revised; toast('Proofreading completed.'); }
function showAnalysis(a){ if(!a)return; $('scoreGrammar').textContent=a.scores.grammar; $('scoreTone').textContent=a.scores.tone; $('scoreClarity').textContent=a.scores.clarity; $('scoreCitation').textContent=a.scores.citation; $('scoreJournal').textContent=a.scores.journal; $('scoreOverall').textContent=a.scores.overall; $('issueList').innerHTML=a.issues.length?a.issues.map((i,n)=>`<div class="issue"><strong>${n+1}. ${safe(i.type)} <span class="status ${i.severity==='high'?'unpaid':i.severity==='medium'?'pending':'paid'}">${safe(i.severity)}</span></strong><small>${safe(i.detail)}</small><div class="suggest">${safe(i.suggestion)}</div></div>`).join(''):'<div class="issue"><strong>No major issue detected.</strong><small>Final human checking is still recommended before submission.</small></div>'; }
function saveProof(){ const p=activeProject(); if(!p)return; const a=lastAnalysis||analyzeText($('workspaceText').value); updateProject(p.id,{documentText:$('workspaceText').value,revisedText:$('revisedText').value||a.revised,analysis:a,proofreadStatus:p.paymentStatus==='Paid'?'In Review':'AI Proofread Completed',tracking:[...p.tracking,{date:now(),title:'Proofread Results Saved',detail:`Overall score ${a.scores.overall}. ${a.recommendation}`}],revisions:[...p.revisions,{date:now(),action:'Proofreading analysis saved',score:a.scores.overall,issues:a.issues.length}]}); toast('Results saved.'); }

function renderTracking(){ const p=activeProject(); if(!p)return; $('trackingSelect').value=p.id; const s=p.analysis?.scores||{}; $('trackingView').innerHTML=`<div class="tracking-grid"><div class="card"><h3>${safe(p.docTitle)}</h3><p><strong>Project ID:</strong> ${safe(p.id)}</p><p><strong>Client:</strong> ${safe(p.clientName)} · ${safe(p.clientInstitution||'-')}</p><p><strong>Package:</strong> ${safe(p.packageName)} · ${money(p.amount)}</p><p><span class="status ${statusClass(p.paymentStatus)}">${safe(p.paymentStatus)}</span> <span class="status ${statusClass(p.proofreadStatus)}">${safe(p.proofreadStatus)}</span></p><div class="score-grid">${['grammar','tone','clarity','citation','journal','overall'].map(k=>`<div><span>${k}</span><strong>${s[k]??'-'}</strong></div>`).join('')}</div></div><div class="card"><h3>Timeline</h3><div class="timeline">${p.tracking.map((t,i)=>`<div class="time-step"><b>${i+1}</b><div class="time-box"><strong>${safe(t.title)}</strong><br><small>${safe(t.date)}</small><p>${safe(t.detail)}</p></div></div>`).join('')}</div></div></div><div class="card" style="margin-top:16px"><h3>Revision History</h3>${p.revisions.map(r=>`<p><strong>${safe(r.action)}</strong><br><small>${safe(r.date)}</small> · Score ${safe(r.score)} · Issues ${safe(r.issues)}</p>`).join('')}</div>`; }
function renderPayment(){ const p=activeProject(); if(!p)return; $('paymentSelect').value=p.id; const msg=`Payment Confirmation - Academic Proofread Studio\nProject ID: ${p.id}\nClient: ${p.clientName}\nAmount: ${money(p.amount)}`; $('waConfirm').href=`https://wa.me/${OWNER.wa.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`; $('paymentDetails').innerHTML=`<h3>${safe(p.docTitle)}</h3><p><strong>Project ID:</strong> ${safe(p.id)}</p><p><strong>Package:</strong> ${safe(p.packageName)} · ${safe(p.urgency)}</p><div class="payment-amount">${money(p.amount)}</div><p><span class="status ${statusClass(p.paymentStatus)}">${safe(p.paymentStatus)}</span></p><table class="table"><tr><th>Invoice</th><td>${invoiceNo(p)}</td></tr><tr><th>Client</th><td>${safe(p.clientName)}</td></tr><tr><th>Email</th><td>${safe(p.clientEmail)}</td></tr></table><button class="btn gold" onclick="confirmPayment('${p.id}')">Submit Payment Confirmation</button> <button class="btn blue" onclick="openProject('${p.id}','documents')">Open Invoice</button>`; }
function confirmPayment(id){ const p=getProject(id); updateProject(id,{paymentStatus:'Pending Confirmation',tracking:[...p.tracking,{date:now(),title:'Payment Confirmation Submitted',detail:'Client submitted payment confirmation.'}]}); toast('Payment confirmation submitted.'); }

function signatureBlock(label){return `<div class="signature"><p>${label}</p><div class="signature-pad"><div class="seal"><span>APS</span></div><img class="signature-img" src="assets/signature-joko.png" alt="Authorized signature"></div><span class="signature-line"><strong>${OWNER.name}</strong></span><small>Authorized Owner · Academic Proofread Studio</small></div>`}
function renderDocument(){ const p=activeProject(); if(!p)return; $('docSelect').value=p.id; $('invoiceModeBtn').classList.toggle('active',docMode==='invoice'); $('receiptModeBtn').classList.toggle('active',docMode==='receipt'); $('financeDoc').innerHTML=docMode==='invoice'?invoiceHTML(p):receiptHTML(p); }
function invoiceHTML(p){return `<div class="paper-head"><div class="paper-brand"><span class="brand-mark">APS</span><div><h2>Academic Proofread Studio</h2><p>Professional Academic Proofreading & Manuscript Readiness Service<br><strong>${OWNER.name}</strong> · ${OWNER.email} · ${OWNER.wa}</p></div></div><div class="paper-title"><h1>INVOICE</h1><p><strong>${invoiceNo(p)}</strong><br>${p.createdAt}</p></div></div><table class="paper-table"><tr><th>Bill To</th><td>${safe(p.clientName)}<br>${safe(p.clientInstitution)}<br>${safe(p.clientEmail)}</td><th>Project ID</th><td>${safe(p.id)}</td></tr><tr><th>Document</th><td colspan="3">${safe(p.docTitle)}</td></tr><tr><th>Payment Status</th><td><span class="status ${statusClass(p.paymentStatus)}">${safe(p.paymentStatus)}</span></td><th>Proofread Status</th><td><span class="status ${statusClass(p.proofreadStatus)}">${safe(p.proofreadStatus)}</span></td></tr></table><table class="paper-table"><tr><th>Service</th><th>Style</th><th>Amount</th></tr><tr><td>${safe(p.packageName)} (${safe(p.urgency)})<br><small>${safe(p.wordCount)} words · ${safe(p.writingType)}</small></td><td>${safe(p.targetStyle)}</td><td>${money(p.amount)}</td></tr></table><div class="paper-total">Total Due: ${money(p.amount)}</div><h3>Bank Account & Payment Contact</h3><table class="paper-table"><tr><th>BCA</th><td>${OWNER.bca} a.n. ${OWNER.account}</td></tr><tr><th>Mandiri</th><td>${OWNER.mandiri} a.n. ${OWNER.account}</td></tr><tr><th>WhatsApp</th><td>${OWNER.wa}</td></tr><tr><th>Email</th><td>${OWNER.email}</td></tr></table><div style="display:flex;justify-content:space-between;gap:20px;align-items:end;flex-wrap:wrap"><div><h3>QR Verification</h3><img class="qr-img" src="${qr('Invoice '+p.id+' '+p.clientName)}"></div>${signatureBlock('Issued by,')}</div>`}
function receiptHTML(p){return `<div class="paper-head"><div class="paper-brand"><span class="brand-mark">APS</span><div><h2>Academic Proofread Studio</h2><p>Official Receipt · Professional Academic Proofreading Service<br><strong>${OWNER.name}</strong></p></div></div><div class="paper-title"><h1>RECEIPT</h1><p><strong>${receiptNo(p)}</strong><br>${now()}</p></div></div><table class="paper-table"><tr><th>Received From</th><td>${safe(p.clientName)}<br>${safe(p.clientInstitution)}<br>${safe(p.clientEmail)}</td><th>Project ID</th><td>${safe(p.id)}</td></tr><tr><th>Document</th><td colspan="3">${safe(p.docTitle)}</td></tr><tr><th>Status</th><td><span class="status ${statusClass(p.paymentStatus)}">${safe(p.paymentStatus)}</span></td><th>Service</th><td>${safe(p.packageName)}</td></tr></table><table class="paper-table"><tr><th>Service</th><th>Amount Paid</th></tr><tr><td>Academic proofreading and manuscript-readiness service</td><td>${money(p.amount)}</td></tr></table><div class="paper-total">Amount: ${money(p.amount)}</div><p><strong>Receipt Note:</strong> This receipt is valid when payment status is marked as Paid by the authorized admin.</p><div style="display:flex;justify-content:space-between;gap:20px;align-items:end;flex-wrap:wrap"><div><h3>QR Verification</h3><img class="qr-img" src="${qr('Receipt '+p.id+' '+p.clientName+' '+p.paymentStatus)}"></div>${signatureBlock('Confirmed by,')}</div>`}
function markPaid(){ const p=activeProject(); updateProject(p.id,{paymentStatus:'Paid',tracking:[...p.tracking,{date:now(),title:'Payment Marked Paid',detail:'Payment was verified in the document center.'}]}); toast('Payment marked paid.'); }
function printActive(id){ const el=$(id); const old=document.body.innerHTML; document.body.innerHTML=`<main style="padding:28px">${el.outerHTML}</main>`; window.print(); document.body.innerHTML=old; location.reload(); }
function downloadHTML(filename,el){ const blob=new Blob([`<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="styles.css"></head><body><main style="padding:28px">${el.outerHTML}</main></body></html>`],{type:'text/html'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); URL.revokeObjectURL(a.href); }

function renderReport(){ const p=activeProject(); if(!p)return; $('reportSelect').value=p.id; const s=p.analysis?.scores||{}; $('reportDoc').innerHTML=`<div class="paper-head"><div class="paper-brand"><span class="brand-mark">APS</span><div><h2>Academic Proofread Studio</h2><p>Proofread Passport & Final Report<br><strong>${OWNER.name}</strong></p></div></div><div class="paper-title"><h1>REPORT</h1><p><strong>${p.id}</strong><br>${now()}</p></div></div><table class="paper-table"><tr><th>Document Title</th><td colspan="3">${safe(p.docTitle)}</td></tr><tr><th>Client</th><td>${safe(p.clientName)}</td><th>Institution</th><td>${safe(p.clientInstitution)}</td></tr><tr><th>Package</th><td>${safe(p.packageName)}</td><th>Payment</th><td>${safe(p.paymentStatus)}</td></tr></table><div class="kpi-row">${['grammar','tone','clarity','citation','journal','overall'].map(k=>`<div><span>${k}</span><strong>${s[k]??'-'}</strong></div>`).join('')}</div><div class="report-section"><h3>Final Recommendation</h3><p><span class="status ${Number(s.overall||0)>=85?'ready':'pending'}">${safe(p.analysis?.recommendation||'No analysis yet')}</span></p></div><div class="report-section"><h3>Detected Issues</h3>${p.analysis?.issues?.length?`<ul>${p.analysis.issues.map(i=>`<li><strong>${safe(i.type)}:</strong> ${safe(i.detail)} ${safe(i.suggestion)}</li>`).join('')}</ul>`:'<p>No major issue saved.</p>'}</div><div class="report-section"><h3>Activity History</h3><ul>${p.tracking.map(t=>`<li><strong>${safe(t.title)}</strong> — ${safe(t.date)} — ${safe(t.detail)}</li>`).join('')}</ul></div><div style="display:flex;justify-content:space-between;gap:20px;align-items:end;flex-wrap:wrap"><div><h3>QR Verification</h3><img class="qr-img" src="${qr('Proofread Report '+p.id+' '+(s.overall||''))}"></div>${signatureBlock('Prepared by,')}</div>`; }
function completeProject(){ const p=activeProject(); updateProject(p.id,{proofreadStatus:'Completed',tracking:[...p.tracking,{date:now(),title:'Project Completed',detail:'Final report and receipt are ready.'}]}); toast('Project completed.'); }

function renderAdmin(){ const unlocked=sessionStorage.getItem(SS_ADMIN)==='1'; $('adminGate').classList.toggle('hidden',unlocked); $('adminPanel').classList.toggle('hidden',!unlocked); if(unlocked){ renderAdminProjects(); renderPackageEditor(); } }
function adminUnlock(){ if($('adminPin').value.trim()===ADMIN_PIN){sessionStorage.setItem(SS_ADMIN,'1'); $('adminPin').value=''; renderAdmin(); toast('Admin unlocked.');} else toast('Invalid admin PIN.'); }
function renderAdminProjects(){ $('adminProjectList').innerHTML=`<table class="admin-table"><tr><th>Project</th><th>Client</th><th>Status</th><th>Amount</th><th>Actions</th></tr>${getProjects().map(p=>`<tr><td><strong>${p.id}</strong><br>${safe(p.docTitle)}</td><td>${safe(p.clientName)}</td><td><span class="status ${statusClass(p.paymentStatus)}">${safe(p.paymentStatus)}</span><br><span class="status ${statusClass(p.proofreadStatus)}">${safe(p.proofreadStatus)}</span></td><td>${money(p.amount)}</td><td><button class="mini-btn gold" onclick="adminPaid('${p.id}')">Paid</button> <button class="mini-btn" onclick="adminComplete('${p.id}')">Complete</button> <button class="mini-btn" onclick="adminDelete('${p.id}')">Delete</button></td></tr>`).join('')}</table>`; }
function adminPaid(id){ const p=getProject(id); updateProject(id,{paymentStatus:'Paid',tracking:[...p.tracking,{date:now(),title:'Payment Verified by Admin',detail:'Payment status changed to Paid.'}]}); }
function adminComplete(id){ const p=getProject(id); updateProject(id,{proofreadStatus:'Completed',tracking:[...p.tracking,{date:now(),title:'Project Completed by Admin',detail:'Final proofreading service completed.'}]}); }
function adminDelete(id){ if(confirm('Delete this project?')){let ps=getProjects().filter(p=>p.id!==id); if(activeProjectId===id)activeProjectId=ps[0]?.id||null; setProjects(ps);}}
function renderPackageEditor(){ $('packageEditor').innerHTML=getPackages().map((p,i)=>`<div class="package-row"><strong>${safe(p.name)}</strong><label>Name<input data-i="${i}" data-f="name" value="${safe(p.name)}"></label><label>Price<input data-i="${i}" data-f="price" type="number" value="${p.price}"></label><label>Description<input data-i="${i}" data-f="description" value="${safe(p.description)}"></label></div>`).join(''); }
function savePkg(){ const p=getPackages(); $$('#packageEditor input').forEach(input=>{p[Number(input.dataset.i)][input.dataset.f]=input.dataset.f==='price'?Number(input.value):input.value}); savePackages(p); toast('Packages saved.');}
function exportBackup(){ const blob=new Blob([JSON.stringify({projects:getProjects(),packages:getPackages(),exportedAt:now()},null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='academic-proofread-studio-backup.json'; a.click(); URL.revokeObjectURL(a.href); }
function importBackup(){ try{const data=JSON.parse($('importBox').value); if(data.projects)localStorage.setItem(LS_PROJECTS,JSON.stringify(data.projects)); if(data.packages)localStorage.setItem(LS_PACKAGES,JSON.stringify(data.packages)); seed(); renderAll(); toast('Backup imported.')}catch{toast('Invalid JSON.')} }
function resetDemo(){ if(confirm('Reset all local app data?')){localStorage.removeItem(LS_PROJECTS);localStorage.removeItem(LS_PACKAGES);seed();renderAll();toast('Data reset.')}}

function bind(){
 $('loginForm').addEventListener('submit',e=>{e.preventDefault();unlock();});
 $('logoutTop').onclick=logout; $('logoutSide').onclick=logout; $('menuBtn').onclick=()=>$('sidebar').classList.toggle('open');
 $$('[data-page]').forEach(b=>b.addEventListener('click',()=>route(b.dataset.page)));
 $('projectSearch').addEventListener('input',renderDashboard); $('projectFilter').addEventListener('change',renderDashboard);
 $('packageName').addEventListener('change',updatePackageInfo); $('sampleBtn').onclick=fillSample; $('clearFormBtn').onclick=resetForm; $('projectForm').addEventListener('submit',createProject);
 $('workspaceSelect').addEventListener('change',e=>{setActive(e.target.value);loadWorkspace()}); $('workspaceText').addEventListener('input',updateLiveMeta); $('runProofBtn').onclick=runProof; $('saveProofBtn').onclick=saveProof;
 ['trackingSelect','paymentSelect','docSelect','reportSelect'].forEach(id=>$(id).addEventListener('change',e=>{setActive(e.target.value);renderPage(document.querySelector('.page.active').id)}));
 $('invoiceModeBtn').onclick=()=>{docMode='invoice';renderDocument()}; $('receiptModeBtn').onclick=()=>{docMode='receipt';renderDocument()}; $('markPaidBtn').onclick=markPaid; $('printDocBtn').onclick=()=>printActive('financeDoc'); $('downloadDocBtn').onclick=()=>downloadHTML(`${docMode}-${activeProject().id}.html`,$('financeDoc'));
 $('completeProjectBtn').onclick=completeProject; $('printReportBtn').onclick=()=>printActive('reportDoc'); $('downloadReportBtn').onclick=()=>downloadHTML(`report-${activeProject().id}.html`,$('reportDoc'));
 $('adminUnlockBtn').onclick=adminUnlock; $('adminPin').addEventListener('keydown',e=>{if(e.key==='Enter')adminUnlock()}); $('adminLockBtn').onclick=()=>{sessionStorage.removeItem(SS_ADMIN);renderAdmin()}; $('exportBtn').onclick=exportBackup; $('importBtn').onclick=importBackup; $('resetBtn').onclick=resetDemo; $('savePackageBtn').onclick=savePkg;
}
document.addEventListener('DOMContentLoaded',()=>{seed(); bind(); if(sessionStorage.getItem(SS_ACCESS)==='1')showApp(); else {$('loginGate').classList.remove('hidden'); $('appShell').classList.add('hidden'); setTimeout(()=>$('loginPin').focus(),80);} });
