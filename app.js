
const PIN='JS2026';
const OWNER={name:'Dr. Joko Slamet',email:'jokoslamet@cwcu.ac.id',wa:'+6282338202233',bca:'0183188531',mandiri:'1410025957408',account:'Joko Slamet'};
const LSP='aps_v14_projects', LSK='aps_v14_packages', LSA='aps_v14_access', LSACT='aps_v14_active', LSNEXT='aps_v14_next_id';
let activeId=null, currentInvoiceId=null, currentReceiptId=null, currentReportId=null, lastAnalysis=null;
const $=id=>document.getElementById(id), $$=s=>Array.from(document.querySelectorAll(s));
const money=n=>'Rp '+Number(n||0).toLocaleString('id-ID');
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const now=()=>new Date().toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'});
const words=t=>(String(t||'').trim().match(/\b[\w'-]+\b/g)||[]).length;
const sents=t=>String(t||'').split(/(?<=[.!?])\s+/).filter(Boolean);
const clamp=(n,min,max)=>Math.max(min,Math.min(max,Math.round(n)));
const toast=m=>{const t=$('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2400)};
const qr=t=>`https://quickchart.io/qr?size=180&margin=1&text=${encodeURIComponent(t)}`;
const pkgs=[{id:'basic',name:'Basic Proofread',price:500000,unit:'up to 1,000 words',featured:false,description:'Grammar, punctuation, spelling, sentence clarity, and basic proofreading.',features:['Grammar and punctuation','Typo and consistency check','Basic clarity feedback','Invoice and receipt']},{id:'academic',name:'Academic Proofread',price:1000000,unit:'up to 2,500 words',featured:true,description:'Academic tone, coherence, EFL writing support, and sentence-level revision.',features:['Academic tone enhancement','Cohesion and clarity check','Sentence revision','Proofread tracking report']},{id:'manuscript',name:'Manuscript Readiness',price:1750000,unit:'journal article draft, 4,000–6,000 words',featured:false,description:'Full journal-article proofreading with citation and manuscript-readiness scoring.',features:['IMRaD section review','Citation consistency','Journal readiness score','Proofread Passport']},{id:'premium',name:'Premium Academic Review',price:2500000,unit:'full manuscript + expert note',featured:false,description:'Comprehensive manuscript review, deep academic editing, and expert editorial note.',features:['Deep academic revision','Reviewer simulation notes','Ethics/AI declaration check','Priority report']}];
function packages(){try{return JSON.parse(localStorage.getItem(LSK))||pkgs}catch{return pkgs}}
function projects(){try{return JSON.parse(localStorage.getItem(LSP))||[]}catch{return[]}}
function saveProjects(p){localStorage.setItem(LSP,JSON.stringify(p));renderAll()}
function project(id){return projects().find(p=>p.id===id)}
function active(){let ps=projects();if(activeId&&project(activeId))return project(activeId);activeId=localStorage.getItem(LSACT)||ps[0]?.id||null;return project(activeId)||ps[0]||null}
function setActive(id){if(project(id)){activeId=id;localStorage.setItem(LSACT,id)}}
function nextProjectId(){
  const d=new Date(), y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0');
  const key=`${y}${m}${day}`;
  const existing=projects().map(p=>p.id).filter(id=>id.startsWith(`APS-${key}-`)).length;
  const stored=Number(localStorage.getItem(LSNEXT+'_'+key)||0);
  const n=Math.max(existing+1,stored+1);
  localStorage.setItem(LSNEXT+'_'+key,String(n));
  return `APS-${key}-${String(n).padStart(3,'0')}`;
}
function previewProjectId(){ if($('projectIdPreview') && !$('projectIdPreview').value) $('projectIdPreview').value=nextProjectId(); }
function inv(p){return `INV-${p.id.replace('APS-','')}`}function rcp(p){return `RCP-${p.id.replace('APS-','')}`}
function analyze(t){
  const w=words(t),ss=sents(t),issues=[];
  const add=(type,detail,suggestion,severity='medium')=>issues.push({type,detail,suggestion,severity});
  if(/the result show/i.test(t))add('Grammar','Subject–verb agreement problem.','Revise to “the results show” or “the result shows”.','high');
  if(/tool help/i.test(t))add('Grammar','Third-person singular verb form needed.','Revise to “the tool helps”.','high');
  if(/very useful|a lot of|things|got better/i.test(t))add('Academic Tone','Informal or vague expression detected.','Use more formal academic vocabulary and specific nouns.','medium');
  if(/\bprove(s|d)?\b/i.test(t))add('Academic Caution','Overly strong claim detected.','Use cautious reporting verbs such as “indicates” or “suggests”.','medium');
  ss.forEach((x,i)=>{if(words(x)>38)add('Clarity',`Sentence ${i+1} is long (${words(x)} words).`,'Split into clearer academic units.','medium')});
  if(!/\([A-Za-z][A-Za-z-]+,\s?\d{4}\)|et al\.|\[\d+\]/.test(t)&&w>120)add('Citation','No clear in-text citation pattern detected.','Add source support for claims and literature statements.','high');
  if(!/method|participants|results|discussion|conclusion/i.test(t)&&w>250)add('Journal Readiness','Limited IMRaD markers detected.','Clarify purpose, method, results, discussion, and contribution.','medium');
  const hi=issues.filter(i=>i.severity==='high').length,me=issues.filter(i=>i.severity==='medium').length;
  const grammar=clamp(97-hi*10-me*2,45,98),tone=clamp(95-issues.filter(i=>i.type==='Academic Tone').length*6-me*2,42,98),clarity=clamp(95-issues.filter(i=>i.type==='Clarity').length*5,40,98),citation=clamp(/\([A-Za-z][A-Za-z-]+,\s?\d{4}\)|et al\.|\[\d+\]/.test(t)?92:65-hi*3,35,96),journal=clamp(93-issues.filter(i=>i.type==='Journal Readiness').length*8,38,97),overall=Math.round((grammar+tone+clarity+citation+journal)/5);
  return{date:now(),words:w,sentences:ss.length,issues,scores:{grammar,tone,clarity,citation,journal,overall},recommendation:overall>=85?'Ready for Submission after final author checking.':overall>=70?'Minor to Moderate Academic Revision Needed.':'Major Academic Revision Needed.',revised:revise(t)}
}
function revise(t){return String(t||'').replace(/\bThis study aims to investigate\b/gi,'This study investigates').replace(/\bthe result show\b/gi,'the results show').replace(/\btool help\b/gi,'tool helps').replace(/\bgot better\b/gi,'demonstrated measurable improvement').replace(/\bvery useful\b/gi,'pedagogically valuable').replace(/\ba lot of\b/gi,'numerous').replace(/\bthings\b/gi,'aspects')}
function parseSections(text){
  const lines=String(text||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
  const joined=String(text||'');
  const headings=['abstract','introduction','literature review','review of literature','methodology','method','methods','results','findings','results and discussion','discussion','conclusion','conclusions','references','bibliography'];
  let sections=[], current={name:'Title / Front Matter',text:''};
  lines.forEach((line,idx)=>{
    const normalized=line.toLowerCase().replace(/[:.]+$/,'');
    const isHeading=headings.includes(normalized)||/^chapter\s+\d+/i.test(line);
    if(isHeading && current.text.trim()){
      sections.push(current);
      current={name:headingName(normalized),text:''};
    }else if(isHeading){
      current.name=headingName(normalized);
    }else{
      current.text += (current.text?'\n':'')+line;
    }
  });
  if(current.text.trim())sections.push(current);
  if(sections.length<2){
    const first=lines[0]||'Untitled Manuscript';
    sections=[{name:'Title / Front Matter',text:first},{name:'Main Manuscript Body',text:joined.replace(first,'').trim()||joined}];
  }
  return sections.map((s,i)=>({id:'sec'+i,name:s.name,text:s.text,analysis:analyze(s.text)}));
}
function headingName(h){const map={'abstract':'Abstract','introduction':'Introduction','literature review':'Literature Review','review of literature':'Literature Review','methodology':'Methodology','method':'Methodology','methods':'Methodology','results':'Results','findings':'Findings','results and discussion':'Results and Discussion','discussion':'Discussion','conclusion':'Conclusion','conclusions':'Conclusion','references':'References','bibliography':'References'};return map[h]||h.replace(/\b\w/g,c=>c.toUpperCase())}
function demo(){
 const text=`Generative AI for English for Specific Purposes: Undergraduate Students’ Development of Discipline-Specific Vocabulary, Genre Awareness, and Communicative Confidence

Dewi Hidayati
Department of Islamic Education, STAI Diponegoro Tulungagung, Tulungagung, East Java, Indonesia

Abstract
This study investigates the effects of Generative Artificial Intelligence (GenAI)-integrated English for Specific Purposes (ESP) instruction on undergraduate students’ discipline-specific vocabulary acquisition, genre awareness, and communicative confidence. Employing a mixed-methods quasi-experimental design, 45 undergraduate students from the Department of Islamic Education at STAI Diponegoro Tulungagung, Indonesia, were assigned to an experimental group receiving GenAI-assisted ESP instruction over eight weeks and a control group receiving conventional instruction. Quantitative data were collected using a Discipline-Specific Vocabulary Test, a Genre Awareness Assessment Rubric, and a Communicative Confidence Scale administered pre- and post-intervention, supplemented by semi-structured interviews with twelve purposively selected participants.

Introduction
Generative AI has increasingly entered English language education. In ESP contexts, students need vocabulary, genre awareness, and confidence to communicate disciplinary knowledge. However, empirical classroom evidence remains limited in Indonesian Islamic higher education.

Methodology
This study employed a mixed-methods quasi-experimental design. Forty-five undergraduate students participated in an eight-week intervention. Quantitative data were collected through vocabulary, genre awareness, and confidence measures, while qualitative data were obtained through interviews.

Results
The experimental group demonstrated improvement in discipline-specific vocabulary, genre awareness, and communicative confidence. Interview data indicated that AI-supported prompts helped students notice terminology, genre moves, and revision possibilities.

Discussion
The findings suggest that GenAI can support ESP learning when used with teacher guidance, reflective activities, and critical AI literacy. The tool does not replace teaching but can expand opportunities for feedback and rehearsal.

Conclusion
GenAI-integrated ESP instruction appears pedagogically valuable for supporting discipline-specific language development, but responsible use, teacher mediation, and contextual adaptation remain essential.`;
 let a=analyze(text);a.scores={grammar:96,tone:95,clarity:94,citation:92,journal:95,overall:95};a.recommendation='Ready for Submission after final author checking.';
 return{id:'APS-DEMO-ESP-2026',createdAt:'07 Jun 2026, 00:05',updatedAt:'07 Jun 2026, 00:32',clientName:'Dewi Hidayati',clientEmail:'dewiaansugianto@gmail.com',clientWa:'+628123456789',clientInstitution:'STAI Diponegoro Tulungagung',docTitle:'Generative AI for English for Specific Purposes: Undergraduate Students’ Development of Discipline-Specific Vocabulary, Genre Awareness, and Communicative Confidence',writingType:'Journal Article',targetStyle:'APA 7th',targetJournal:'JOLIE / International language education journal',deadline:'2026-06-10',packageId:'premium',packageName:'Premium Academic Review',packagePrice:2500000,urgency:'Standard',amount:2500000,wordCount:words(text),documentText:text,paymentStatus:'Paid',proofreadStatus:'Completed',tracking:[{date:'07 Jun 2026, 00:05',title:'Project Created',detail:'Manuscript metadata and document were submitted.'},{date:'07 Jun 2026, 00:07',title:'Invoice Generated',detail:'Invoice was generated and linked to the project.'},{date:'07 Jun 2026, 00:11',title:'Payment Verified',detail:'Payment status was marked as Paid.'},{date:'07 Jun 2026, 00:18',title:'AI Proofread Completed',detail:'Language, tone, clarity, citation, and journal readiness were checked section by section.'},{date:'07 Jun 2026, 00:25',title:'Academic Review Completed',detail:'Final editorial checking was completed.'},{date:'07 Jun 2026, 00:32',title:'Report Released',detail:'Receipt and Proofread Passport were released.'}],costBreakdown:[{stage:'Project intake & metadata check',result:'Completed',amount:250000},{stage:'AI-assisted language pass',result:'Completed',amount:650000},{stage:'Academic style & coherence review',result:'Completed',amount:700000},{stage:'Citation/reference & journal readiness check',result:'Completed',amount:400000},{stage:'Final report & release',result:'Completed',amount:500000}],revisions:[{date:'07 Jun 2026, 00:18',action:'Automated section-by-section proofreading completed',score:95,issues:4},{date:'07 Jun 2026, 00:25',action:'Expert editorial polishing completed',score:95,issues:0}],analysis:a,sections:parseSections(text),revisedText:a.revised}
}
function seed(){if(!localStorage.getItem(LSK))localStorage.setItem(LSK,JSON.stringify(pkgs));if(!projects().length)localStorage.setItem(LSP,JSON.stringify([demo()]));activeId=localStorage.getItem(LSACT)||projects()[0]?.id||null}
function showApp(){ $('loginGate').classList.add('hidden');$('appShell').classList.remove('hidden');renderAll();route('home')}function showLogin(){ $('loginGate').classList.remove('hidden');$('appShell').classList.add('hidden');setTimeout(()=>$('loginPin').focus(),80)}function unlock(){if($('loginPin').value.trim()===PIN){localStorage.setItem(LSA,'1');$('loginPin').value='';showApp();toast('Access granted.')}else{toast('Invalid PIN');$('loginPin').focus();$('loginPin').select()}}function logout(){localStorage.removeItem(LSA);showLogin();toast('Logged out.')}
function route(page){$$('.page').forEach(p=>p.classList.toggle('active',p.id===page));$$('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===page));$('sidebar').classList.remove('open');renderPage(page);window.scrollTo({top:0,behavior:'smooth'})}
function renderPage(p){if(p==='workspace')renderWorkspaceTable();if(p==='tracking')renderTrackingTable();if(p==='payment')renderPaymentTable();if(p==='invoice')renderInvoiceTable();if(p==='receipt')renderReceiptTable();if(p==='reports')renderReportsTable();if(p==='cashflow')renderCashflow();if(p==='admin')renderAdmin();if(p==='dashboard')renderDashboard();if(p==='create')previewProjectId()}
function renderAll(){renderStats();renderHomeTable();renderDashboard();renderPricing();renderPackageSelect();if($('cashflowTable'))renderCashflow(false)}
function renderStats(){const ps=projects(),paid=ps.filter(p=>p.paymentStatus==='Paid'||p.paymentStatus==='Completed').length,comp=ps.filter(p=>p.proofreadStatus==='Completed').length,pend=ps.filter(p=>p.paymentStatus==='Unpaid'||p.paymentStatus==='Pending Confirmation').length,rev=ps.filter(p=>p.paymentStatus==='Paid'||p.paymentStatus==='Completed').reduce((a,p)=>a+p.amount,0);['homeTotal','dashTotal'].forEach(id=>{if($(id))$(id).textContent=ps.length});$('homePaid').textContent=paid;$('homeCompleted').textContent=comp;$('homeRevenue').textContent=money(rev);$('dashPaid').textContent=paid;$('dashCompleted').textContent=comp;$('dashPending').textContent=pend}
function st(c){return c==='Unpaid'?'unpaid':c==='Pending Confirmation'||c==='AI Proofread Completed'||c==='In Review'?'pending':c==='Paid'||c==='Completed'?'paid':'info'}
function orderRows(ps){return `<table class="data-table"><thead><tr><th>Project ID</th><th>Title / Client</th><th>Package</th><th>Payment</th><th>Proofread</th><th>Amount</th><th>Actions</th></tr></thead><tbody>${ps.map(p=>`<tr><td><strong>${safe(p.id)}</strong><br><small>${safe(p.createdAt)}</small></td><td class="title-cell">${safe(p.docTitle)}<br><small>${safe(p.clientName)} · ${safe(p.clientInstitution||'-')}</small></td><td>${safe(p.packageName)}<br><small>${safe(p.targetStyle)}</small></td><td><span class="status ${st(p.paymentStatus)}">${safe(p.paymentStatus)}</span></td><td><span class="status ${st(p.proofreadStatus)}">${safe(p.proofreadStatus)}</span></td><td><strong>${money(p.amount)}</strong></td><td><div class="actions"><button class="mini-btn" onclick="openProject('${p.id}','workspace')">Proofread</button><button class="mini-btn" onclick="openProject('${p.id}','tracking')">Track</button><button class="mini-btn blue" onclick="openProject('${p.id}','payment')">Payment</button><button class="mini-btn gold" onclick="viewInvoice('${p.id}')">Invoice</button><button class="mini-btn gold" onclick="viewReceipt('${p.id}')">Receipt</button><button class="mini-btn" onclick="viewReport('${p.id}')">Report</button></div></td></tr>`).join('')}</tbody></table>`}
function filtered(){let ps=projects(),q=($('projectSearch')?.value||'').toLowerCase(),f=$('projectFilter')?.value||'all';return ps.filter(p=>(f==='all'||p.paymentStatus===f||p.proofreadStatus===f)&&[p.id,p.docTitle,p.clientName,p.packageName,p.paymentStatus,p.proofreadStatus].join(' ').toLowerCase().includes(q))}
function renderHomeTable(){$('homeTable').innerHTML=orderRows(projects().slice(0,8))}function renderDashboard(){$('dashboardTable').innerHTML=orderRows(filtered())}
function renderPackageSelect(){let sel=$('packageName');if(!sel)return;let cur=sel.value||'premium';sel.innerHTML=packages().map(p=>`<option value="${p.id}">${safe(p.name)} — ${money(p.price)}</option>`).join('');sel.value=packages().some(p=>p.id===cur)?cur:'premium';updatePkg()}
function renderPricing(){let box=$('pricingCards');if(!box)return;box.innerHTML=packages().map(p=>`<article class="card pricing-card ${p.featured?'featured':''}"><h2>${safe(p.name)}</h2><p>${safe(p.description)}</p><div class="price">${money(p.price)}</div><small>${safe(p.unit)}</small><ul>${p.features.map(f=>`<li>${safe(f)}</li>`).join('')}</ul><button class="btn gold" onclick="choosePkg('${p.id}')">Choose Package</button></article>`).join('')}
function updatePkg(){let p=packages().find(x=>x.id===$('packageName')?.value)||packages()[0];if($('packageInfo'))$('packageInfo').innerHTML=`<strong>${safe(p.name)}</strong><br>${safe(p.description)}<br><b>${money(p.price)}</b> <small>${safe(p.unit)}</small>`}function choosePkg(id){route('create');setTimeout(()=>{$('packageName').value=id;updatePkg()},50)}
function fillSample(){let p=demo();['clientName','clientEmail','clientWa','clientInstitution','docTitle','writingType','targetStyle','targetJournal','deadline','urgency','documentText'].forEach(k=>{if($(k))$(k).value=p[k]||''});$('packageName').value='premium';$('wordCount').value=p.wordCount;$('projectIdPreview').value=nextProjectId();updatePkg();toast('Real sample inserted.')}
function clearForm(){$('projectForm').reset();$('projectIdPreview').value=nextProjectId();updatePkg()}
function createProject(e){e.preventDefault();let text=$('documentText').value.trim();if(!text){toast('Please paste manuscript text.');return}let pkg=packages().find(p=>p.id===$('packageName').value)||packages()[0],u=$('urgency').value,m=u==='Express'?1.5:u==='Urgent'?1.25:1,amount=Math.round(pkg.price*m),a=analyze(text),secs=parseSections(text),id=$('projectIdPreview').value||nextProjectId();let p={id,createdAt:now(),updatedAt:now(),clientName:$('clientName').value.trim(),clientEmail:$('clientEmail').value.trim(),clientWa:$('clientWa').value.trim(),clientInstitution:$('clientInstitution').value.trim(),docTitle:$('docTitle').value.trim(),writingType:$('writingType').value,targetStyle:$('targetStyle').value,targetJournal:$('targetJournal').value.trim(),deadline:$('deadline').value,packageId:pkg.id,packageName:pkg.name,packagePrice:pkg.price,urgency:u,amount,wordCount:Number($('wordCount').value||words(text)),documentText:text,paymentStatus:'Unpaid',proofreadStatus:'AI Proofread Completed',tracking:[{date:now(),title:'Project Created',detail:'Project ID, metadata, and manuscript text were submitted.'},{date:now(),title:'Invoice Generated',detail:'Invoice was automatically created and linked to project ID.'},{date:now(),title:'AI-Assisted Proofread Completed',detail:`Section-by-section overall score ${a.scores.overall}.`}],costBreakdown:[{stage:'Project intake',result:'Completed',amount:Math.round(amount*.1)},{stage:'AI-assisted section review',result:'Completed',amount:Math.round(amount*.25)},{stage:'Academic style review',result:'In Queue',amount:Math.round(amount*.28)},{stage:'Citation and journal readiness',result:'Queued',amount:Math.round(amount*.17)},{stage:'Final report',result:'Pending',amount:Math.round(amount*.2)}],revisions:[{date:now(),action:'AI-assisted section-by-section proofreading completed',score:a.scores.overall,issues:a.issues.length}],analysis:a,sections:secs,revisedText:a.revised};let ps=projects();ps.unshift(p);setActive(p.id);saveProjects(ps);clearForm();toast('Project order created and integrated.');route('dashboard')}
function updateProject(id,patch){let ps=projects(),i=ps.findIndex(p=>p.id===id);if(i<0)return;ps[i]={...ps[i],...patch,updatedAt:now()};saveProjects(ps)}
function openProject(id,page){setActive(id);route(page);if(page==='workspace')openWorkspace(id);if(page==='tracking')viewTracking(id);if(page==='payment')viewPayment(id)}
function renderWorkspaceTable(){$('workspaceTable').innerHTML=orderRows(projects())}
function openWorkspace(id){let p=project(id);if(!p)return;let secs=p.sections&&p.sections.length?p.sections:parseSections(p.documentText);p.sections=secs;setActive(id);$('workspacePanel').classList.remove('hidden');$('workspacePanel').innerHTML=`<div class="doc-panel-head"><div><span class="eyebrow">Selected Project · ${safe(p.id)}</span><h2>${safe(p.docTitle)}</h2></div><button class="btn danger" onclick="$('workspacePanel').classList.add('hidden')">Close</button></div><div class="local-ai-note"><strong>AI-Assisted Local Engine:</strong> No API key is required. This workspace checks each manuscript section separately for grammar, academic tone, clarity, citation readiness, and journal-readiness indicators.</div><div class="section-tabs">${secs.map((s,i)=>`<button class="${i===0?'active':''}" onclick="showSection('${p.id}',${i})">${safe(s.name)}</button>`).join('')}</div><div id="sectionDetail"></div><div class="form-actions"><button class="btn blue" onclick="runAllSections('${p.id}')">Run AI-Assisted Check for All Sections</button><button class="btn gold" onclick="saveSectionResults('${p.id}')">Save Section Results</button></div>`;showSection(id,0);$('workspacePanel').scrollIntoView({behavior:'smooth'})}
function showSection(id,index){let p=project(id),secs=p.sections&&p.sections.length?p.sections:parseSections(p.documentText),s=secs[index];$$('.section-tabs button').forEach((b,i)=>b.classList.toggle('active',i===index));$('sectionDetail').innerHTML=`<div class="workspace-grid"><div class="section-card"><h3>${safe(s.name)}</h3><textarea id="sectionText" rows="14">${safe(s.text)}</textarea><div class="word-meta"><span>${words(s.text)} words</span><span>${sents(s.text).length} sentences</span></div><button class="btn blue" onclick="runCurrentSection('${id}',${index})">Run This Section</button></div><div class="section-card"><h3>Section Scores</h3><div class="score-grid">${['grammar','tone','clarity','citation','journal','overall'].map(k=>`<div><span>${k}</span><strong id="score-${k}">${s.analysis?.scores?.[k]??'-'}</strong></div>`).join('')}</div><div id="issueList" class="issue-list"></div></div></div><div class="section-card"><h3>Suggested Revision for ${safe(s.name)}</h3><textarea id="revisedText" rows="8">${safe(s.analysis?.revised||'')}</textarea></div>`;showAnalysis(s.analysis)}
function runCurrentSection(id,index){let p=project(id),secs=p.sections&&p.sections.length?p.sections:parseSections(p.documentText),txt=$('sectionText').value;secs[index].text=txt;secs[index].analysis=analyze(txt);lastAnalysis=secs[index].analysis;p.sections=secs;showSection(id,index);toast('Section checked.')}
function runAllSections(id){let p=project(id),secs=parseSections(p.documentText);secs=secs.map(s=>({...s,analysis:analyze(s.text)}));let overall=Math.round(secs.reduce((a,s)=>a+s.analysis.scores.overall,0)/Math.max(1,secs.length));p.sections=secs;p.analysis={...analyze(p.documentText),scores:{...analyze(p.documentText).scores,overall},recommendation:overall>=85?'Ready for Submission after final author checking.':overall>=70?'Minor to Moderate Academic Revision Needed.':'Major Academic Revision Needed.'};updateProject(id,{sections:secs,analysis:p.analysis,revisedText:secs.map(s=>s.analysis.revised).join('\\n\\n'),tracking:[...p.tracking,{date:now(),title:'AI-Assisted Section Check Completed',detail:`${secs.length} manuscript sections were checked. Overall score ${overall}.`}],revisions:[...p.revisions,{date:now(),action:'All manuscript sections checked',score:overall,issues:secs.reduce((a,s)=>a+s.analysis.issues.length,0)}]});openWorkspace(id);toast('All sections checked and saved.')}
function saveSectionResults(id){let p=project(id);updateProject(id,{sections:p.sections||parseSections(p.documentText),tracking:[...p.tracking,{date:now(),title:'Section Results Saved',detail:'Section-by-section proofreading results were saved to the project.'}]});toast('Section results saved.')}
function showAnalysis(a){if(!a||!$('issueList'))return;['grammar','tone','clarity','citation','journal','overall'].forEach(k=>{let el=$('score-'+k);if(el)el.textContent=a.scores[k]});$('issueList').innerHTML=a.issues.length?a.issues.map((i,n)=>`<div class="issue"><strong>${n+1}. ${safe(i.type)} <span class="status ${i.severity==='high'?'unpaid':i.severity==='medium'?'pending':'paid'}">${safe(i.severity)}</span></strong><small>${safe(i.detail)}</small><div class="suggest">${safe(i.suggestion)}</div></div>`).join(''):'<div class="issue"><strong>No major issue detected.</strong><small>Final human checking is still recommended before submission.</small></div>'}
function renderTrackingTable(){$('trackingTable').innerHTML=orderRows(projects())}function viewTracking(id){setActive(id);let p=active();$('trackingPanel').classList.remove('hidden');$('trackingPanel').innerHTML=`<div class="doc-panel-head"><div><span class="eyebrow">Tracking Detail · ${safe(p.id)}</span><h2>${safe(p.docTitle)}</h2></div><button class="btn danger" onclick="$('trackingPanel').classList.add('hidden')">Close</button></div><div class="timeline">${p.tracking.map((t,i)=>`<div class="time-step"><b>${i+1}</b><div class="time-box"><strong>${safe(t.title)}</strong><br><small>${safe(t.date)}</small><p>${safe(t.detail)}</p></div></div>`).join('')}</div><h3>Revision History</h3>${p.revisions.map(r=>`<p><strong>${safe(r.action)}</strong><br><small>${safe(r.date)}</small> · Score ${safe(r.score)} · Issues ${safe(r.issues)}</p>`).join('')}`;$('trackingPanel').scrollIntoView({behavior:'smooth'})}
function renderPaymentTable(){$('paymentTable').innerHTML=orderRows(projects())}function viewPayment(id){setActive(id);let p=active();$('paymentPanel').classList.remove('hidden');$('paymentPanel').innerHTML=`<div class="doc-panel-head"><div><span class="eyebrow">Payment Detail · ${safe(p.id)}</span><h2>${safe(p.clientName)}</h2></div><button class="btn danger" onclick="$('paymentPanel').classList.add('hidden')">Close</button></div><h3>${safe(p.docTitle)}</h3><p><strong>Project ID:</strong> ${safe(p.id)}</p><div class="payment-amount">${money(p.amount)}</div><p><span class="status ${st(p.paymentStatus)}">${safe(p.paymentStatus)}</span></p><div class="bank-line"><span>BCA</span><strong>0183188531</strong><small>a.n. Joko Slamet</small></div><div class="bank-line"><span>Mandiri</span><strong>1410025957408</strong><small>a.n. Joko Slamet</small></div><button class="btn gold" onclick="confirmPayment('${p.id}')">Submit Payment Confirmation</button> <button class="btn blue" onclick="markPaid('${p.id}')">Mark Paid</button>`;$('paymentPanel').scrollIntoView({behavior:'smooth'})}function confirmPayment(id){let p=project(id);updateProject(id,{paymentStatus:'Pending Confirmation',tracking:[...p.tracking,{date:now(),title:'Payment Confirmation Submitted',detail:'Client submitted payment confirmation.'}]});viewPayment(id)}function markPaid(id){let p=project(id);updateProject(id,{paymentStatus:'Paid',tracking:[...p.tracking,{date:now(),title:'Payment Marked Paid',detail:'Payment was verified and added to monthly cashflow.'}]});viewPayment(id)}
function renderInvoiceTable(){$('invoiceTable').innerHTML=`<table class="data-table"><thead><tr><th>Project</th><th>Client</th><th>Payment</th><th>Invoice No.</th><th>Actions</th></tr></thead><tbody>${projects().map(p=>`<tr><td class="title-cell"><strong>${safe(p.id)}</strong><br>${safe(p.docTitle)}</td><td>${safe(p.clientName)}<br><small>${safe(p.clientEmail)}</small></td><td><span class="status ${st(p.paymentStatus)}">${safe(p.paymentStatus)}</span></td><td><strong>${inv(p)}</strong></td><td><div class="actions"><button class="mini-btn gold" onclick="viewInvoice('${p.id}')">View</button><button class="mini-btn" onclick="printInvoice('${p.id}')">Print/Save</button><button class="mini-btn blue" onclick="downloadInvoice('${p.id}')">HTML</button></div></td></tr>`).join('')}</tbody></table>`}
function renderReceiptTable(){$('receiptTable').innerHTML=`<table class="data-table"><thead><tr><th>Project</th><th>Client</th><th>Payment</th><th>Receipt No.</th><th>Actions</th></tr></thead><tbody>${projects().map(p=>`<tr><td class="title-cell"><strong>${safe(p.id)}</strong><br>${safe(p.docTitle)}</td><td>${safe(p.clientName)}<br><small>${safe(p.clientEmail)}</small></td><td><span class="status ${st(p.paymentStatus)}">${safe(p.paymentStatus)}</span></td><td><strong>${rcp(p)}</strong></td><td><div class="actions"><button class="mini-btn gold" onclick="viewReceipt('${p.id}')">View</button><button class="mini-btn" onclick="printReceipt('${p.id}')">Print/Save</button><button class="mini-btn blue" onclick="downloadReceipt('${p.id}')">HTML</button></div></td></tr>`).join('')}</tbody></table>`}
function signoff(label){return`<div class="aps-signoff"><div class="aps-signoff-label">${safe(label)}</div><div class="aps-signoff-art"><div class="aps-seal">APS</div><img class="aps-signature-img" src="assets/signature-joko.png" alt="Authorized signature"></div><div class="aps-signoff-line"></div><div class="aps-signoff-name">${safe(OWNER.name)}</div><div class="aps-signoff-role">Authorized Owner<br>Academic Proofread Studio</div></div>`}
function invoiceHTML(p){return `<div class="paper-head"><div class="paper-brand"><span class="brand-mark">APS</span><div><h2>Academic Proofread Studio</h2><p>Professional Academic Proofreading & Manuscript Readiness Service<br><strong>${OWNER.name}</strong> · ${OWNER.email} · ${OWNER.wa}</p></div></div><div class="paper-title"><h1>INVOICE</h1><p><strong>${inv(p)}</strong><br>${p.createdAt}</p></div></div><table class="paper-table"><tr><th>Bill To</th><td>${safe(p.clientName)}<br>${safe(p.clientInstitution)}<br>${safe(p.clientEmail)}</td><th>Project ID</th><td>${safe(p.id)}</td></tr><tr><th>Document</th><td colspan="3">${safe(p.docTitle)}</td></tr><tr><th>Payment Status</th><td><span class="status ${st(p.paymentStatus)}">${safe(p.paymentStatus)}</span></td><th>Proofread Status</th><td><span class="status ${st(p.proofreadStatus)}">${safe(p.proofreadStatus)}</span></td></tr></table><table class="paper-table"><tr><th>Service</th><th>Style</th><th>Amount</th></tr><tr><td>${safe(p.packageName)} (${safe(p.urgency)})<br><small>${safe(p.wordCount)} words · ${safe(p.writingType)}</small></td><td>${safe(p.targetStyle)}</td><td>${money(p.amount)}</td></tr></table><div class="paper-total">Total Due: ${money(p.amount)}</div><h3>Bank Account & Payment Contact</h3><table class="paper-table"><tr><th>BCA</th><td>${OWNER.bca} a.n. ${OWNER.account}</td></tr><tr><th>Mandiri</th><td>${OWNER.mandiri} a.n. ${OWNER.account}</td></tr><tr><th>WhatsApp</th><td>${OWNER.wa}</td></tr><tr><th>Email</th><td>${OWNER.email}</td></tr></table><div style="display:flex;justify-content:space-between;gap:20px;align-items:end;flex-wrap:wrap"><div><h3>QR Verification</h3><img class="qr-img" src="${qr('Invoice '+p.id+' '+p.clientName)}"></div>${signoff('Issued by,')}</div>`}
function receiptHTML(p){return `<div class="paper-head"><div class="paper-brand"><span class="brand-mark">APS</span><div><h2>Academic Proofread Studio</h2><p>Official Receipt · Professional Academic Proofreading Service<br><strong>${OWNER.name}</strong></p></div></div><div class="paper-title"><h1>RECEIPT</h1><p><strong>${rcp(p)}</strong><br>${now()}</p></div></div><table class="paper-table"><tr><th>Received From</th><td>${safe(p.clientName)}<br>${safe(p.clientInstitution)}<br>${safe(p.clientEmail)}</td><th>Project ID</th><td>${safe(p.id)}</td></tr><tr><th>Document</th><td colspan="3">${safe(p.docTitle)}</td></tr><tr><th>Status</th><td><span class="status ${st(p.paymentStatus)}">${safe(p.paymentStatus)}</span></td><th>Service</th><td>${safe(p.packageName)}</td></tr></table><table class="paper-table"><tr><th>Service</th><th>Amount Paid</th></tr><tr><td>Academic proofreading and manuscript-readiness service</td><td>${money(p.amount)}</td></tr></table><div class="paper-total">Amount: ${money(p.amount)}</div><p><strong>Receipt Note:</strong> This receipt is valid when payment status is marked as Paid by the authorized admin.</p><div style="display:flex;justify-content:space-between;gap:20px;align-items:end;flex-wrap:wrap"><div><h3>QR Verification</h3><img class="qr-img" src="${qr('Receipt '+p.id+' '+p.clientName+' '+p.paymentStatus)}"></div>${signoff('Confirmed by,')}</div>`}
function viewInvoice(id){setActive(id);currentInvoiceId=id;$('invoicePanel').classList.remove('hidden');$('invoicePanelTitle').textContent=`Invoice · ${id}`;$('invoiceDoc').innerHTML=invoiceHTML(project(id));route('invoice');setTimeout(()=>$('invoicePanel').scrollIntoView({behavior:'smooth'}),80)}
function viewReceipt(id){setActive(id);currentReceiptId=id;$('receiptPanel').classList.remove('hidden');$('receiptPanelTitle').textContent=`Receipt · ${id}`;$('receiptDoc').innerHTML=receiptHTML(project(id));route('receipt');setTimeout(()=>$('receiptPanel').scrollIntoView({behavior:'smooth'}),80)}
function printInvoice(id){viewInvoice(id);setTimeout(()=>printArea('invoiceDoc'),140)}function printReceipt(id){viewReceipt(id);setTimeout(()=>printArea('receiptDoc'),140)}function downloadInvoice(id){downloadHTML(`invoice-${id}.html`,invoiceHTML(project(id)))}function downloadReceipt(id){downloadHTML(`receipt-${id}.html`,receiptHTML(project(id)))}
function renderReportsTable(){$('reportsTable').innerHTML=`<table class="data-table"><thead><tr><th>Project</th><th>Client</th><th>Score</th><th>Status</th><th>Report Actions</th></tr></thead><tbody>${projects().map(p=>`<tr><td class="title-cell"><strong>${safe(p.id)}</strong><br>${safe(p.docTitle)}</td><td>${safe(p.clientName)}</td><td><strong>${p.analysis?.scores?.overall??'-'}</strong></td><td><span class="status ${st(p.proofreadStatus)}">${safe(p.proofreadStatus)}</span></td><td><div class="actions"><button class="mini-btn gold" onclick="viewReport('${p.id}')">View</button><button class="mini-btn" onclick="printReport('${p.id}')">Print/Save</button><button class="mini-btn blue" onclick="downloadReport('${p.id}')">HTML</button><button class="mini-btn" onclick="completeProject('${p.id}')">Set Complete</button></div></td></tr>`).join('')}</tbody></table>`}
function reportHTML(p){let s=p.analysis?.scores||{},secs=p.sections&&p.sections.length?p.sections:parseSections(p.documentText);return`<div class="paper-head"><div class="paper-brand"><span class="brand-mark">APS</span><div><h2>Academic Proofread Studio</h2><p>Detailed Proofread Passport & Final Report<br><strong>${OWNER.name}</strong></p></div></div><div class="paper-title"><h1>REPORT</h1><p><strong>${p.id}</strong><br>${now()}</p></div></div><table class="paper-table"><tr><th>Document Title</th><td colspan="3">${safe(p.docTitle)}</td></tr><tr><th>Client</th><td>${safe(p.clientName)}</td><th>Institution</th><td>${safe(p.clientInstitution)}</td></tr><tr><th>Package</th><td>${safe(p.packageName)}</td><th>Payment</th><td>${safe(p.paymentStatus)}</td></tr><tr><th>Writing Type</th><td>${safe(p.writingType)}</td><th>Target Style</th><td>${safe(p.targetStyle)}</td></tr></table><div class="kpi-row">${['grammar','tone','clarity','citation','journal','overall'].map(k=>`<div><span>${k}</span><strong>${s[k]??'-'}</strong></div>`).join('')}</div><div class="report-section"><h3>Final Recommendation</h3><p><span class="status ${Number(s.overall||0)>=85?'ready':'pending'}">${safe(p.analysis?.recommendation||'No analysis yet')}</span></p></div><div class="report-section"><h3>Section-by-Section Results</h3><table class="paper-table"><tr><th>Section</th><th>Words</th><th>Overall</th><th>Main Issues</th><th>Recommendation</th></tr>${secs.map(sec=>`<tr><td>${safe(sec.name)}</td><td>${words(sec.text)}</td><td><strong>${sec.analysis?.scores?.overall??'-'}</strong></td><td>${(sec.analysis?.issues||[]).slice(0,3).map(i=>safe(i.type)).join(', ')||'No major issue'}</td><td>${safe(sec.analysis?.recommendation||'-')}</td></tr>`).join('')}</table></div><div class="report-section"><h3>Detected Issues</h3>${p.analysis?.issues?.length?`<ul>${p.analysis.issues.map(i=>`<li><strong>${safe(i.type)}:</strong> ${safe(i.detail)} ${safe(i.suggestion)}</li>`).join('')}</ul>`:'<p>No major issue saved in the overall project analysis.</p>'}</div><div class="report-section"><h3>Activity History</h3><ul>${p.tracking.map(t=>`<li><strong>${safe(t.title)}</strong> — ${safe(t.date)} — ${safe(t.detail)}</li>`).join('')}</ul></div><div class="report-section"><h3>Cashflow & Document Record</h3><table class="paper-table"><tr><th>Invoice</th><td>${inv(p)}</td><th>Receipt</th><td>${rcp(p)}</td></tr><tr><th>Amount</th><td>${money(p.amount)}</td><th>Payment Status</th><td>${safe(p.paymentStatus)}</td></tr></table></div><div style="display:flex;justify-content:space-between;gap:20px;align-items:end;flex-wrap:wrap"><div><h3>QR Verification</h3><img class="qr-img" src="${qr('Proofread Report '+p.id+' '+(s.overall||''))}"></div>${signoff('Prepared by,')}</div>`}
function viewReport(id){setActive(id);currentReportId=id;$('reportPanel').classList.remove('hidden');$('reportDoc').innerHTML=reportHTML(project(id));route('reports');setTimeout(()=>$('reportPanel').scrollIntoView({behavior:'smooth'}),80)}function printReport(id){viewReport(id);setTimeout(()=>printArea('reportDoc'),140)}function downloadReport(id){downloadHTML(`report-${id}.html`,reportHTML(project(id)))}function completeProject(id){let p=project(id);updateProject(id,{proofreadStatus:'Completed',tracking:[...p.tracking,{date:now(),title:'Project Completed',detail:'Final report and receipt are ready.'}]});viewReport(id)}
function monthKeyFromDate(dateText){const parsed=new Date(dateText);if(!Number.isNaN(parsed.getTime()))return`${parsed.getFullYear()}-${String(parsed.getMonth()+1).padStart(2,'0')}`;const m=String(dateText||'').match(/(\d{2})\s+([A-Za-z]{3})\s+(\d{4})/);if(m){const idx=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(m[2]);if(idx>=0)return`${m[3]}-${String(idx+1).padStart(2,'0')}`}const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function monthLabel(key){const [y,m]=String(key).split('-').map(Number);return y&&m?new Date(y,m-1,1).toLocaleString('en-GB',{month:'long',year:'numeric'}):key}
function cashRows(){const map={};projects().forEach(p=>{const k=monthKeyFromDate(p.createdAt);if(!map[k])map[k]={month:k,projects:0,paidProjects:0,completed:0,income:0,pending:0,balance:0};map[k].projects++;if(p.paymentStatus==='Paid'||p.paymentStatus==='Completed'){map[k].paidProjects++;map[k].income+=+p.amount||0}else map[k].pending+=+p.amount||0;if(p.proofreadStatus==='Completed')map[k].completed++;map[k].balance=map[k].income});return Object.values(map).sort((a,b)=>b.month.localeCompare(a.month))}
function renderCashflow(){if(!$('cashflowTable'))return;const rows=cashRows(),sel=$('cashflowMonth'),cur=sel.value||rows[0]?.month||monthKeyFromDate(new Date().toISOString());sel.innerHTML=rows.map(r=>`<option value="${safe(r.month)}">${safe(monthLabel(r.month))}</option>`).join('')||`<option value="${cur}">${monthLabel(cur)}</option>`;sel.value=rows.some(r=>r.month===cur)?cur:(rows[0]?.month||cur);const selected=rows.find(r=>r.month===sel.value)||{month:cur,projects:0,paidProjects:0,completed:0,income:0,pending:0,balance:0};$('cashIncome').textContent=money(selected.income);$('cashPending').textContent=money(selected.pending);$('cashCompleted').textContent=selected.completed;$('cashBalance').textContent=money(selected.balance);$('cashflowPeriod').textContent=monthLabel(selected.month);const max=Math.max(1,...rows.map(r=>r.income));$('cashflowChart').innerHTML=rows.length?rows.slice(0,12).map(r=>`<div class="cash-bar-row"><span>${safe(monthLabel(r.month))}</span><div class="cash-bar"><i style="width:${Math.max(4,Math.round((r.income/max)*100))}%"></i></div><strong>${money(r.income)}</strong></div>`).join(''):'<div class="card">No cashflow data yet.</div>';$('cashflowTable').innerHTML=`<table class="data-table"><thead><tr><th>Month</th><th>Total Orders</th><th>Paid Orders</th><th>Completed</th><th>Income</th><th>Pending</th><th>Estimated Balance</th></tr></thead><tbody>${rows.map(r=>`<tr><td><strong>${safe(monthLabel(r.month))}</strong></td><td>${r.projects}</td><td>${r.paidProjects}</td><td>${r.completed}</td><td><strong>${money(r.income)}</strong></td><td>${money(r.pending)}</td><td><strong>${money(r.balance)}</strong></td></tr>`).join('')}</tbody></table>`;let ps=projects().filter(p=>monthKeyFromDate(p.createdAt)===selected.month);$('cashflowDetail').innerHTML=`<table class="data-table"><thead><tr><th>Project ID</th><th>Client / Title</th><th>Payment</th><th>Amount</th></tr></thead><tbody>${ps.map(p=>`<tr><td><strong>${safe(p.id)}</strong></td><td>${safe(p.clientName)}<br><small>${safe(p.docTitle)}</small></td><td><span class="status ${st(p.paymentStatus)}">${safe(p.paymentStatus)}</span></td><td><strong>${money(p.amount)}</strong></td></tr>`).join('')||'<tr><td colspan="4">No projects for this month.</td></tr>'}</tbody></table>`}
function exportCashCSV(){const rows=cashRows(),csv=[['Month','Total Orders','Paid Orders','Completed','Income','Pending Receivable','Estimated Balance'],...rows.map(r=>[monthLabel(r.month),r.projects,r.paidProjects,r.completed,r.income,r.pending,r.balance])].map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\\n');let blob=new Blob([csv],{type:'text/csv'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='academic-proofread-studio-cashflow.csv';a.click();URL.revokeObjectURL(a.href)}
function printArea(id){let old=document.body.innerHTML;document.body.innerHTML=`<main style="padding:28px">${$(id).outerHTML}</main>`;window.print();document.body.innerHTML=old;location.reload()}function downloadHTML(name,html){let blob=new Blob([`<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="styles.css?v=10.0.0"></head><body><main style="padding:28px"><div class="paper">${html}</div></main></body></html>`],{type:'text/html'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();URL.revokeObjectURL(a.href)}
function renderAdmin(){let ok=sessionStorage.getItem('aps_admin')==='1';$('adminGate').classList.toggle('hidden',ok);$('adminPanel').classList.toggle('hidden',!ok);if(ok){$('adminProjectList').innerHTML=orderRows(projects());$('packageEditor').innerHTML=packages().map((p,i)=>`<div class="package-row"><strong>${safe(p.name)}</strong><label>Name<input data-i="${i}" data-f="name" value="${safe(p.name)}"></label><label>Price<input data-i="${i}" data-f="price" type="number" value="${p.price}"></label><label>Description<input data-i="${i}" data-f="description" value="${safe(p.description)}"></label></div>`).join('')}}function adminUnlock(){if($('adminPin').value.trim()===PIN){sessionStorage.setItem('aps_admin','1');$('adminPin').value='';renderAdmin();toast('Admin unlocked.')}else toast('Invalid PIN.')}function savePkgs(){let ps=packages();$$('#packageEditor input').forEach(i=>{ps[+i.dataset.i][i.dataset.f]=i.dataset.f==='price'?+i.value:i.value});localStorage.setItem(LSK,JSON.stringify(ps));renderAll();toast('Packages saved.')}function exportBackup(){let b=new Blob([JSON.stringify({projects:projects(),packages:packages(),exportedAt:now()},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='academic-proofread-studio-backup.json';a.click();URL.revokeObjectURL(a.href)}function importBackup(){try{let d=JSON.parse($('importBox').value);if(d.projects)localStorage.setItem(LSP,JSON.stringify(d.projects));if(d.packages)localStorage.setItem(LSK,JSON.stringify(d.packages));seed();renderAll();toast('Imported.')}catch{toast('Invalid JSON.')}}function resetData(){if(confirm('Reset local data?')){localStorage.removeItem(LSP);localStorage.removeItem(LSK);seed();renderAll();toast('Data reset.')}}
function bind(){$('loginForm').onsubmit=e=>{e.preventDefault();unlock()};$('topLogout').onclick=logout;$('sideLogout').onclick=logout;$('menuBtn').onclick=()=>$('sidebar').classList.toggle('open');$$('[data-page]').forEach(b=>b.onclick=()=>route(b.dataset.page));$('projectSearch').oninput=renderDashboard;$('projectFilter').onchange=renderDashboard;$('packageName').onchange=updatePkg;$('sampleBtn').onclick=fillSample;$('clearFormBtn').onclick=clearForm;$('regenProjectId').onclick=()=>{$('projectIdPreview').value=nextProjectId()};$('projectForm').onsubmit=createProject;$('invoicePrintBtn').onclick=()=>currentInvoiceId&&printArea('invoiceDoc');$('invoiceDownloadBtn').onclick=()=>currentInvoiceId&&downloadInvoice(currentInvoiceId);$('invoiceCloseBtn').onclick=()=>$('invoicePanel').classList.add('hidden');$('receiptPrintBtn').onclick=()=>currentReceiptId&&printArea('receiptDoc');$('receiptDownloadBtn').onclick=()=>currentReceiptId&&downloadReceipt(currentReceiptId);$('receiptCloseBtn').onclick=()=>$('receiptPanel').classList.add('hidden');$('reportPrintBtn').onclick=()=>currentReportId&&printArea('reportDoc');$('reportDownloadBtn').onclick=()=>currentReportId&&downloadReport(currentReportId);$('reportCloseBtn').onclick=()=>$('reportPanel').classList.add('hidden');$('cashflowMonth').onchange=renderCashflow;$('cashflowPrintBtn').onclick=()=>window.print();$('cashflowExportBtn').onclick=exportCashCSV;$('adminUnlockBtn').onclick=adminUnlock;$('adminPin').onkeydown=e=>{if(e.key==='Enter')adminUnlock()};$('adminLockBtn').onclick=()=>{sessionStorage.removeItem('aps_admin');renderAdmin()};$('exportBtn').onclick=exportBackup;$('importBtn').onclick=importBackup;$('resetBtn').onclick=resetData;$('savePackageBtn').onclick=savePkgs}
document.addEventListener('DOMContentLoaded',()=>{seed();bind();renderAll();previewProjectId();if(localStorage.getItem(LSA)==='1'){showApp()}else{showLogin()}});


/* ===== V11 professional overrides: role portal, separated workflow tables, payment editor, detailed sections, cashflow range ===== */
const LSROLE_V11='aps_v11_role';
const LSCLIENT_V11='aps_v11_client';
let currentRole='admin';
let clientProfile={name:'',email:''};

function clientLogin(startOrder=false){
  const name=($('clientLoginName')?.value||'').trim();
  const email=($('clientLoginEmail')?.value||'').trim().toLowerCase();
  clientProfile={name,email};
  localStorage.setItem(LSCLIENT_V11,JSON.stringify(clientProfile));
  localStorage.setItem(LSA,'1');
  localStorage.setItem(LSROLE_V11,'client');
  showApp('client');
  if(startOrder) route('create');
  toast('User portal opened.');
}
function loadClientProfile(){
  try{clientProfile=JSON.parse(localStorage.getItem(LSCLIENT_V11))||{name:'',email:''}}catch{clientProfile={name:'',email:''}}
}
function applyRole(){
  loadClientProfile();
  currentRole=localStorage.getItem(LSROLE_V11)||'admin';
  document.body.dataset.role=currentRole;
  $$('.nav button').forEach(btn=>{
    const p=btn.dataset.page;
    const adminOnly=['admin','cashflow'];
    btn.classList.toggle('hidden',currentRole==='client' && adminOnly.includes(p));
  });
  if($('clientName') && currentRole==='client' && clientProfile.name && !$('clientName').value) $('clientName').value=clientProfile.name;
  if($('clientEmail') && currentRole==='client' && clientProfile.email && !$('clientEmail').value) $('clientEmail').value=clientProfile.email;
}
function visibleProjects(){
  const ps=projects();
  if(currentRole!=='client') return ps;
  loadClientProfile();
  if(!clientProfile.email) return [];
  return ps.filter(p=>String(p.clientEmail||'').toLowerCase()===clientProfile.email);
}
function showApp(role){
  currentRole=role||localStorage.getItem(LSROLE_V11)||'admin';
  localStorage.setItem(LSROLE_V11,currentRole);
  $('loginGate').classList.add('hidden');
  $('appShell').classList.remove('hidden');
  applyRole();
  renderAll();
  route(currentRole==='client'?'dashboard':'home');
}
function unlock(){
  if($('loginPin').value.trim()===PIN){
    localStorage.setItem(LSA,'1');
    localStorage.setItem(LSROLE_V11,'admin');
    $('loginPin').value='';
    showApp('admin');
    toast('Admin access granted.');
  }else{
    toast('Invalid PIN');
    $('loginPin').focus();
    $('loginPin').select();
  }
}
function logout(){
  localStorage.removeItem(LSA);
  localStorage.removeItem(LSROLE_V11);
  showLogin();
  toast('Logged out.');
}
function renderStats(){
  const ps=visibleProjects(), all=projects();
  const paid=ps.filter(p=>isPaidStatus(p.paymentStatus)).length;
  const comp=ps.filter(p=>p.proofreadStatus==='Completed').length;
  const pend=ps.filter(p=>['Unpaid','Pending Confirmation','Half Payment'].includes(p.paymentStatus)).length;
  const rev=ps.filter(p=>isPaidStatus(p.paymentStatus)).reduce((a,p)=>a+(Number(p.amountPaid)||Number(p.amount)||0),0);
  ['homeTotal','dashTotal'].forEach(id=>{if($(id))$(id).textContent=ps.length});
  if($('homePaid')) $('homePaid').textContent=paid;
  if($('homeCompleted')) $('homeCompleted').textContent=comp;
  if($('homeRevenue')) $('homeRevenue').textContent=money(rev);
  if($('dashPaid')) $('dashPaid').textContent=paid;
  if($('dashCompleted')) $('dashCompleted').textContent=comp;
  if($('dashPending')) $('dashPending').textContent=pend;
}
function isPaidStatus(st){return ['Paid','Paid in Full','Full Payment'].includes(st)}
function st(c){
  if(c==='Unpaid')return'unpaid';
  if(c==='Pending Confirmation'||c==='AI Proofread Completed'||c==='In Review'||c==='Half Payment')return'pending';
  if(c==='Paid'||c==='Paid in Full'||c==='Full Payment'||c==='Completed')return'paid';
  return'info';
}
function filtered(){
  let ps=visibleProjects(),q=($('projectSearch')?.value||'').toLowerCase(),f=$('projectFilter')?.value||'all';
  return ps.filter(p=>(f==='all'||p.paymentStatus===f||p.proofreadStatus===f)&&[p.id,p.docTitle,p.clientName,p.packageName,p.paymentStatus,p.proofreadStatus].join(' ').toLowerCase().includes(q));
}
function orderRows(ps){
  if(!ps.length){
    return `<div class="card"><h2>${currentRole==='client'?'No order found for this email.':'No project orders yet.'}</h2><p>${currentRole==='client'?'Create a new order or login with the email used for your order.':'Create a new project order to begin.'}</p><button class="btn gold" data-page="create" onclick="route('create')">Create Project</button></div>`;
  }
  return `<table class="data-table"><thead><tr><th>Project ID</th><th>Title / Client</th><th>Package</th><th>Payment</th><th>Proofread</th><th>Amount</th><th>Actions</th></tr></thead><tbody>${ps.map(p=>`<tr><td><strong>${safe(p.id)}</strong><br><small>${safe(p.createdAt)}</small></td><td class="title-cell">${safe(p.docTitle)}<br><small>${safe(p.clientName)} · ${safe(p.clientInstitution||'-')}</small></td><td>${safe(p.packageName)}<br><small>${safe(p.targetStyle)}</small></td><td><span class="status ${st(p.paymentStatus)}">${safe(p.paymentStatus)}</span></td><td><span class="status ${st(p.proofreadStatus)}">${safe(p.proofreadStatus)}</span></td><td><strong>${money(p.amount)}</strong></td><td><div class="actions"><button class="mini-btn" onclick="openProject('${p.id}','workspace')">Proofread</button><button class="mini-btn" onclick="openProject('${p.id}','tracking')">Track</button><button class="mini-btn blue" onclick="openProject('${p.id}','payment')">Payment</button><button class="mini-btn gold" onclick="viewInvoice('${p.id}')">Invoice</button><button class="mini-btn gold" onclick="viewReceipt('${p.id}')">Receipt</button><button class="mini-btn" onclick="viewReport('${p.id}')">Report</button></div></td></tr>`).join('')}</tbody></table>`;
}
function renderHomeTable(){$('homeTable').innerHTML=orderRows(visibleProjects().slice(0,8))}
function renderDashboard(){
  if(currentRole==='client'){
    const email=clientProfile.email||'';
    document.querySelector('#dashboard .page-head h1').textContent='User Order Dashboard';
    document.querySelector('#dashboard .page-head p').textContent=`Track project progress, payment status, invoice, receipt, and report for ${email || 'your registered email'}.`;
  }else{
    document.querySelector('#dashboard .page-head h1').textContent='Project Order Pivot';
    document.querySelector('#dashboard .page-head p').textContent='Manage all project IDs, clients, payment status, proofreading status, and action buttons in one integrated table.';
  }
  $('dashboardTable').innerHTML=orderRows(filtered());
}

function parseSections(text){
  const required=['Title / Front Matter','Abstract','Introduction','Literature Review','Methodology','Results','Discussion','Conclusion','References','Appendix'];
  const aliases={
    'abstract':'Abstract',
    'introduction':'Introduction',
    'literature review':'Literature Review',
    'review of literature':'Literature Review',
    'related literature':'Literature Review',
    'theoretical framework':'Literature Review',
    'method':'Methodology',
    'methods':'Methodology',
    'methodology':'Methodology',
    'research method':'Methodology',
    'results':'Results',
    'findings':'Results',
    'result':'Results',
    'discussion':'Discussion',
    'results and discussion':'Discussion',
    'conclusion':'Conclusion',
    'conclusions':'Conclusion',
    'references':'References',
    'reference':'References',
    'bibliography':'References',
    'appendix':'Appendix',
    'appendices':'Appendix'
  };
  const bucket=Object.fromEntries(required.map(k=>[k,'']));
  let current='Title / Front Matter';
  String(text||'').split(/\n+/).forEach(line=>{
    const raw=line.trim();
    if(!raw) return;
    const norm=raw.toLowerCase().replace(/^[\d.]+\s*/,'').replace(/[:.]+$/,'').trim();
    if(aliases[norm]){
      current=aliases[norm];
      return;
    }
    bucket[current]+=(bucket[current]?'\n':'')+raw;
  });
  if(!bucket['Title / Front Matter'] && String(text||'').trim()){
    const first=String(text).split(/\n+/).find(Boolean)||'';
    bucket['Title / Front Matter']=first;
  }
  return required.map((name,i)=>({id:'sec'+i,name,text:bucket[name]||'',comment:'',analysis:analyze(bucket[name]||'')}));
}
function renderWorkspaceTable(){$('workspaceTable').innerHTML=orderRows(visibleProjects())}
function openWorkspace(id){
  const p=project(id); if(!p)return;
  const secs=p.sections&&p.sections.length>=10?p.sections:parseSections(p.documentText);
  updateProject(id,{sections:secs});
  setActive(id);
  $('workspacePanel').classList.remove('hidden');
  $('workspacePanel').innerHTML=`<div class="doc-panel-head"><div><span class="eyebrow">Selected Project · ${safe(p.id)}</span><h2>${safe(p.docTitle)}</h2></div><button class="btn danger" onclick="$('workspacePanel').classList.add('hidden')">Close</button></div><div class="section-tabs">${secs.map((s,i)=>`<button class="${i===0?'active':''}" onclick="showSection('${p.id}',${i})">${safe(s.name)}</button>`).join('')}</div><div id="sectionDetail"></div><div class="form-actions"><button class="btn blue" onclick="runAllSections('${p.id}')">Run Proofread for All Sections</button><button class="btn gold" onclick="saveSectionResults('${p.id}')">Save to Report</button></div>`;
  showSection(id,0);
  $('workspacePanel').scrollIntoView({behavior:'smooth'});
}
function showSection(id,index){
  const p=project(id),secs=p.sections&&p.sections.length?p.sections:parseSections(p.documentText),s=secs[index];
  $$('.section-tabs button').forEach((b,i)=>b.classList.toggle('active',i===index));
  $('sectionDetail').innerHTML=`<div class="workspace-grid"><div class="section-card"><h3>${safe(s.name)}</h3><textarea id="sectionText" rows="14">${safe(s.text)}</textarea><div class="section-mini-meta"><div><span>Words</span><strong>${words(s.text)}</strong></div><div><span>Sentences</span><strong>${sents(s.text).length}</strong></div><div><span>Issues</span><strong>${s.analysis?.issues?.length||0}</strong></div><div><span>Overall</span><strong>${s.analysis?.scores?.overall??'-'}</strong></div></div><button class="btn blue" onclick="runCurrentSection('${id}',${index})">Run Section Proofread</button></div><div class="section-card"><h3>Section Scores</h3><div class="score-grid">${['grammar','tone','clarity','citation','journal','overall'].map(k=>`<div><span>${k}</span><strong id="score-${k}">${s.analysis?.scores?.[k]??'-'}</strong></div>`).join('')}</div><div id="issueList" class="issue-list"></div></div></div><div class="section-card"><h3>Suggested Revision for ${safe(s.name)}</h3><textarea id="revisedText" rows="8">${safe(s.analysis?.revised||'')}</textarea><div class="proofreader-comment"><label>Proofreader Detailed Comments<textarea id="proofreaderComment" rows="5" placeholder="Write professional proofreader comments, revision notes, or section-specific feedback here.">${safe(s.comment||'')}</textarea></label></div></div>`;
  showAnalysis(s.analysis);
}
function runCurrentSection(id,index){
  const p=project(id),secs=p.sections&&p.sections.length?p.sections:parseSections(p.documentText);
  const txt=$('sectionText').value, comment=$('proofreaderComment')?.value||'';
  secs[index].text=txt;
  secs[index].comment=comment;
  secs[index].analysis=analyze(txt);
  const newDoc=secs.map(s=>s.text).join('\n\n');
  updateProject(id,{sections:secs,documentText:newDoc,tracking:[...p.tracking,{date:now(),title:`Proofread Section: ${secs[index].name}`,detail:`Section score ${secs[index].analysis.scores.overall}. Proofreader comments saved.`}],revisions:[...p.revisions,{date:now(),action:`Section checked: ${secs[index].name}`,score:secs[index].analysis.scores.overall,issues:secs[index].analysis.issues.length}]});
  showSection(id,index);
  toast('Section proofread completed.');
}
function runAllSections(id){
  const p=project(id),secs=(p.sections&&p.sections.length?p.sections:parseSections(p.documentText)).map(s=>({...s,analysis:analyze(s.text||''),comment:s.comment||''}));
  const overall=Math.round(secs.reduce((a,s)=>a+(s.analysis.scores.overall||0),0)/Math.max(1,secs.length));
  const base=analyze(secs.map(s=>s.text).join('\n\n'));
  base.scores.overall=overall;
  base.recommendation=overall>=85?'Ready for Submission after final author checking.':overall>=70?'Minor to Moderate Academic Revision Needed.':'Major Academic Revision Needed.';
  updateProject(id,{sections:secs,analysis:base,revisedText:secs.map(s=>s.analysis.revised).join('\\n\\n'),proofreadStatus:p.paymentStatus==='Paid'?'In Review':'AI Proofread Completed',tracking:[...p.tracking,{date:now(),title:'Full Section Proofread Completed',detail:`${secs.length} manuscript sections checked. Overall score ${overall}.`}],revisions:[...p.revisions,{date:now(),action:'Full section-by-section proofreading completed',score:overall,issues:secs.reduce((a,s)=>a+s.analysis.issues.length,0)}]});
  openWorkspace(id);
  toast('All sections proofread and saved.');
}
function saveSectionResults(id){
  const p=project(id),secs=p.sections||parseSections(p.documentText);
  updateProject(id,{sections:secs,tracking:[...p.tracking,{date:now(),title:'Proofreader Comments Saved',detail:'Section-level proofreading comments were saved into the final report.'}]});
  toast('Workspace results saved into Report Center.');
}

function renderTrackingTable(){
  const ps=visibleProjects();
  $('trackingTable').innerHTML=`<table class="data-table"><thead><tr><th>Project ID</th><th>Title / Client</th><th>Progress</th><th>Last Activity</th><th>Score</th><th>Actions</th></tr></thead><tbody>${ps.map(p=>{const prog=p.proofreadStatus==='Completed'?100:p.proofreadStatus==='In Review'?75:p.proofreadStatus==='AI Proofread Completed'?55:25;const last=p.tracking[p.tracking.length-1]||{};return`<tr><td><strong>${safe(p.id)}</strong></td><td class="title-cell">${safe(p.docTitle)}<br><small>${safe(p.clientName)}</small></td><td class="tracking-progress"><span class="status ${st(p.proofreadStatus)}">${safe(p.proofreadStatus)}</span><div class="progress-bar"><i style="width:${prog}%"></i></div></td><td><strong>${safe(last.title||'-')}</strong><br><small>${safe(last.date||'-')}</small></td><td><strong>${p.analysis?.scores?.overall??'-'}</strong></td><td><button class="mini-btn gold" onclick="viewTracking('${p.id}')">View Timeline</button><button class="mini-btn" onclick="viewReport('${p.id}')">Report</button></td></tr>`}).join('')||'<tr><td colspan="6">No tracking data.</td></tr>'}</tbody></table>`;
}
function renderPaymentTable(){
  const ps=visibleProjects();
  $('paymentTable').innerHTML=`<table class="data-table"><thead><tr><th>Project ID</th><th>Client / Title</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead><tbody>${ps.map(p=>{const paid=Number(p.amountPaid||0),bal=Math.max(0,Number(p.amount||0)-paid);return`<tr><td><strong>${safe(p.id)}</strong></td><td class="title-cell">${safe(p.clientName)}<br><small>${safe(p.docTitle)}</small></td><td>${money(p.amount)}</td><td>${money(paid)}</td><td><strong>${money(bal)}</strong></td><td><span class="status ${st(p.paymentStatus)}">${safe(p.paymentStatus)}</span></td><td><button class="mini-btn gold" onclick="viewPayment('${p.id}')">Edit Payment</button><button class="mini-btn" onclick="viewInvoice('${p.id}')">Invoice</button><button class="mini-btn" onclick="viewReceipt('${p.id}')">Receipt</button></td></tr>`}).join('')||'<tr><td colspan="7">No payment data.</td></tr>'}</tbody></table>`;
}
function viewPayment(id){
  setActive(id);
  const p=project(id), paid=Number(p.amountPaid||0), bal=Math.max(0,Number(p.amount||0)-paid);
  $('paymentPanel').classList.remove('hidden');
  $('paymentPanel').innerHTML=`<div class="doc-panel-head"><div><span class="eyebrow">Payment Editor · ${safe(p.id)}</span><h2>${safe(p.clientName)}</h2></div><button class="btn danger" onclick="$('paymentPanel').classList.add('hidden')">Close</button></div><h3>${safe(p.docTitle)}</h3><div class="payment-control-grid"><label>Total Amount<input value="${money(p.amount)}" readonly></label><label>Amount Paid<input id="payAmountPaid" type="number" min="0" value="${paid}"></label><label>Payment Status<select id="payStatus">${['Unpaid','Half Payment','Pending Confirmation','Paid','Paid in Full'].map(s=>`<option ${p.paymentStatus===s?'selected':''}>${s}</option>`).join('')}</select></label><label>Payment Method<select id="payMethod">${['Bank Transfer - BCA','Bank Transfer - Mandiri','Cash','Other'].map(s=>`<option ${p.paymentMethod===s?'selected':''}>${s}</option>`).join('')}</select></label><label class="span-2">Payment Note<textarea id="payNote" rows="4">${safe(p.paymentNote||'')}</textarea></label></div><div class="payment-note"><strong>Balance:</strong> ${money(bal)}<br><strong>Payment Contact:</strong> BCA ${OWNER.bca} / Mandiri ${OWNER.mandiri} a.n. ${OWNER.account}</div><div class="form-actions"><button class="btn gold" onclick="updatePayment('${p.id}')">Save Payment Status</button><button class="btn blue" onclick="viewInvoice('${p.id}')">Open Invoice</button><button class="btn soft" onclick="viewReceipt('${p.id}')">Open Receipt</button></div>`;
  $('paymentPanel').scrollIntoView({behavior:'smooth'});
}
function updatePayment(id){
  const p=project(id);
  const status=$('payStatus').value, paid=Number($('payAmountPaid').value||0), method=$('payMethod').value, note=$('payNote').value;
  updateProject(id,{paymentStatus:status,amountPaid:paid,paymentMethod:method,paymentNote:note,tracking:[...p.tracking,{date:now(),title:'Payment Updated',detail:`Status: ${status}; amount paid: ${money(paid)}; method: ${method}.`}]});
  renderPaymentTable();
  viewPayment(id);
  toast('Payment status updated.');
}
function confirmPayment(id){const p=project(id);updateProject(id,{paymentStatus:'Pending Confirmation',tracking:[...p.tracking,{date:now(),title:'Payment Confirmation Submitted',detail:'Client submitted payment confirmation.'}]});viewPayment(id)}
function markPaid(id){const p=project(id);updateProject(id,{paymentStatus:'Paid',amountPaid:p.amount,tracking:[...p.tracking,{date:now(),title:'Payment Marked Paid',detail:'Payment was verified and added to monthly cashflow.'}]});viewPayment(id)}

function reportHTML(p){
  let s=p.analysis?.scores||{},secs=p.sections&&p.sections.length?p.sections:parseSections(p.documentText);
  return`<div class="paper-head"><div class="paper-brand"><span class="brand-mark">APS</span><div><h2>Academic Proofread Studio</h2><p>Detailed Proofread Passport & Final Report<br><strong>${OWNER.name}</strong></p></div></div><div class="paper-title"><h1>REPORT</h1><p><strong>${p.id}</strong><br>${now()}</p></div></div><table class="paper-table"><tr><th>Document Title</th><td colspan="3">${safe(p.docTitle)}</td></tr><tr><th>Client</th><td>${safe(p.clientName)}</td><th>Institution</th><td>${safe(p.clientInstitution)}</td></tr><tr><th>Package</th><td>${safe(p.packageName)}</td><th>Payment</th><td>${safe(p.paymentStatus)}</td></tr><tr><th>Writing Type</th><td>${safe(p.writingType)}</td><th>Target Style</th><td>${safe(p.targetStyle)}</td></tr></table><div class="kpi-row">${['grammar','tone','clarity','citation','journal','overall'].map(k=>`<div><span>${k}</span><strong>${s[k]??'-'}</strong></div>`).join('')}</div><div class="report-section"><h3>Final Recommendation</h3><p><span class="status ${Number(s.overall||0)>=85?'ready':'pending'}">${safe(p.analysis?.recommendation||'No analysis yet')}</span></p></div><div class="report-section"><h3>Section-by-Section Proofreader Results</h3><table class="paper-table"><tr><th>Section</th><th>Words</th><th>Overall</th><th>Detected Issues</th><th>Proofreader Comments</th></tr>${secs.map(sec=>`<tr><td>${safe(sec.name)}</td><td>${words(sec.text)}</td><td><strong>${sec.analysis?.scores?.overall??'-'}</strong></td><td>${(sec.analysis?.issues||[]).slice(0,4).map(i=>safe(i.type+': '+i.detail)).join('<br>')||'No major issue'}</td><td>${safe(sec.comment||'No proofreader comment saved yet.')}</td></tr>`).join('')}</table></div><div class="report-section"><h3>Suggested Revision Summary</h3><ul>${secs.map(sec=>`<li><strong>${safe(sec.name)}:</strong> ${safe((sec.analysis?.revised||'').slice(0,240))}${(sec.analysis?.revised||'').length>240?'...':''}</li>`).join('')}</ul></div><div class="report-section"><h3>Activity History</h3><ul>${p.tracking.map(t=>`<li><strong>${safe(t.title)}</strong> — ${safe(t.date)} — ${safe(t.detail)}</li>`).join('')}</ul></div><div class="report-section"><h3>Cashflow & Document Record</h3><table class="paper-table"><tr><th>Invoice</th><td>${inv(p)}</td><th>Receipt</th><td>${rcp(p)}</td></tr><tr><th>Amount</th><td>${money(p.amount)}</td><th>Payment Status</th><td>${safe(p.paymentStatus)}</td></tr><tr><th>Paid Amount</th><td>${money(p.amountPaid||0)}</td><th>Balance</th><td>${money(Math.max(0,(+p.amount||0)-(+p.amountPaid||0)))}</td></tr></table></div><div style="display:flex;justify-content:space-between;gap:20px;align-items:end;flex-wrap:wrap"><div><h3>QR Verification</h3><img class="qr-img" src="${qr('Proofread Report '+p.id+' '+(s.overall||''))}"></div>${signoff('Prepared by,')}</div>`;
}

function projectDate(p){const d=new Date(p.createdAt);if(!Number.isNaN(d.getTime()))return d;const k=monthKeyFromDate(p.createdAt);return new Date(k+'-01T00:00:00')}
function inDateRange(p,start,end){const d=projectDate(p);if(start&&d<new Date(start+'T00:00:00'))return false;if(end&&d>new Date(end+'T23:59:59'))return false;return true}
function cashRowsByRange(){
  const start=$('cashflowStart')?.value||'', end=$('cashflowEnd')?.value||'';
  const map={};
  projects().filter(p=>inDateRange(p,start,end)).forEach(p=>{
    const k=monthKeyFromDate(p.createdAt);
    if(!map[k])map[k]={month:k,projects:0,paidProjects:0,completed:0,income:0,pending:0,balance:0};
    map[k].projects++;
    const paid=Number(p.amountPaid||0);
    if(isPaidStatus(p.paymentStatus)||paid>0){map[k].paidProjects++;map[k].income+=paid||Number(p.amount||0)}else map[k].pending+=Number(p.amount||0);
    if(p.proofreadStatus==='Completed')map[k].completed++;
    map[k].balance=map[k].income;
  });
  return Object.values(map).sort((a,b)=>b.month.localeCompare(a.month));
}
function renderCashflow(){
  if(!$('cashflowTable'))return;
  if(!$('cashflowStart').value||!$('cashflowEnd').value){
    const d=new Date(), first=new Date(d.getFullYear(),d.getMonth(),1), last=new Date(d.getFullYear(),d.getMonth()+1,0);
    $('cashflowStart').value=first.toISOString().slice(0,10);
    $('cashflowEnd').value=last.toISOString().slice(0,10);
  }
  const rows=cashRowsByRange(), selectedProjects=projects().filter(p=>inDateRange(p,$('cashflowStart').value,$('cashflowEnd').value));
  const income=selectedProjects.reduce((a,p)=>a+(isPaidStatus(p.paymentStatus)||Number(p.amountPaid||0)>0?(Number(p.amountPaid)||Number(p.amount)||0):0),0);
  const pending=selectedProjects.reduce((a,p)=>a+(!isPaidStatus(p.paymentStatus)&&!Number(p.amountPaid||0)?Number(p.amount||0):0),0);
  const completed=selectedProjects.filter(p=>p.proofreadStatus==='Completed').length;
  $('cashIncome').textContent=money(income);$('cashPending').textContent=money(pending);$('cashCompleted').textContent=completed;$('cashBalance').textContent=money(income);$('cashflowPeriod').textContent=`${$('cashflowStart').value} to ${$('cashflowEnd').value}`;
  const max=Math.max(1,...rows.map(r=>r.income));
  $('cashflowChart').innerHTML=rows.length?rows.map(r=>`<div class="cash-bar-row"><span>${safe(monthLabel(r.month))}</span><div class="cash-bar"><i style="width:${Math.max(4,Math.round((r.income/max)*100))}%"></i></div><strong>${money(r.income)}</strong></div>`).join(''):'<div class="card">No cashflow data in selected range.</div>';
  $('cashflowTable').innerHTML=`<table class="data-table"><thead><tr><th>Month</th><th>Total Orders</th><th>Paid Orders</th><th>Completed</th><th>Income</th><th>Pending</th><th>Estimated Balance</th></tr></thead><tbody>${rows.map(r=>`<tr><td><strong>${safe(monthLabel(r.month))}</strong></td><td>${r.projects}</td><td>${r.paidProjects}</td><td>${r.completed}</td><td><strong>${money(r.income)}</strong></td><td>${money(r.pending)}</td><td><strong>${money(r.balance)}</strong></td></tr>`).join('')||'<tr><td colspan="7">No data available.</td></tr>'}</tbody></table>`;
  $('cashflowDetail').innerHTML=`<table class="data-table"><thead><tr><th>Project ID</th><th>Client / Title</th><th>Payment</th><th>Paid</th><th>Amount</th></tr></thead><tbody>${selectedProjects.map(p=>`<tr><td><strong>${safe(p.id)}</strong></td><td>${safe(p.clientName)}<br><small>${safe(p.docTitle)}</small></td><td><span class="status ${st(p.paymentStatus)}">${safe(p.paymentStatus)}</span></td><td>${money(p.amountPaid||0)}</td><td><strong>${money(p.amount)}</strong></td></tr>`).join('')||'<tr><td colspan="5">No projects in selected range.</td></tr>'}</tbody></table>`;
}
function exportCashCSV(){
  const rows=cashRowsByRange();
  const csv=[['Range Start',$('cashflowStart').value],['Range End',$('cashflowEnd').value],[],['Month','Total Orders','Paid Orders','Completed','Income','Pending Receivable','Estimated Balance'],...rows.map(r=>[monthLabel(r.month),r.projects,r.paidProjects,r.completed,r.income,r.pending,r.balance])].map(row=>row.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\\n');
  const blob=new Blob([csv],{type:'text/csv'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='academic-proofread-studio-cashflow-range.csv';a.click();URL.revokeObjectURL(a.href);
}

function bind(){
  $('loginForm').onsubmit=e=>{e.preventDefault();unlock()};
  $('clientPortalBtn').onclick=()=>clientLogin(true);
  $('clientTrackBtn').onclick=()=>clientLogin(false);
  $('topLogout').onclick=logout;$('sideLogout').onclick=logout;$('menuBtn').onclick=()=>$('sidebar').classList.toggle('open');
  $$('[data-page]').forEach(b=>b.onclick=()=>route(b.dataset.page));
  $('projectSearch').oninput=renderDashboard;$('projectFilter').onchange=renderDashboard;$('packageName').onchange=updatePkg;
  $('sampleBtn').onclick=fillSample;$('clearFormBtn').onclick=clearForm;$('projectForm').onsubmit=createProject;
  $('invoicePrintBtn').onclick=()=>currentInvoiceId&&printArea('invoiceDoc');$('invoiceDownloadBtn').onclick=()=>currentInvoiceId&&downloadInvoice(currentInvoiceId);$('invoiceCloseBtn').onclick=()=>$('invoicePanel').classList.add('hidden');
  $('receiptPrintBtn').onclick=()=>currentReceiptId&&printArea('receiptDoc');$('receiptDownloadBtn').onclick=()=>currentReceiptId&&downloadReceipt(currentReceiptId);$('receiptCloseBtn').onclick=()=>$('receiptPanel').classList.add('hidden');
  $('reportPrintBtn').onclick=()=>currentReportId&&printArea('reportDoc');$('reportDownloadBtn').onclick=()=>currentReportId&&downloadReport(currentReportId);$('reportCloseBtn').onclick=()=>$('reportPanel').classList.add('hidden');
  $('cashflowViewBtn').onclick=renderCashflow;$('cashflowPrintBtn').onclick=()=>window.print();$('cashflowExportBtn').onclick=exportCashCSV;
  $('adminUnlockBtn').onclick=adminUnlock;$('adminPin').onkeydown=e=>{if(e.key==='Enter')adminUnlock()};$('adminLockBtn').onclick=()=>{sessionStorage.removeItem('aps_admin');renderAdmin()};$('exportBtn').onclick=exportBackup;$('importBtn').onclick=importBackup;$('resetBtn').onclick=resetData;$('savePackageBtn').onclick=savePkgs;
}


/* ===== V12 override: user must register before dashboard login ===== */
const LS_REGISTERED_USERS_V12 = 'aps_v12_registered_users';

function registeredUsersV12(){
  try{return JSON.parse(localStorage.getItem(LS_REGISTERED_USERS_V12)) || []}catch{return []}
}
function saveRegisteredUsersV12(users){
  localStorage.setItem(LS_REGISTERED_USERS_V12, JSON.stringify(users));
}
function getUserInputV12(){
  return {
    name:($('clientLoginName')?.value || '').trim(),
    email:($('clientLoginEmail')?.value || '').trim().toLowerCase()
  };
}
function validEmailV12(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function setClientNoticeV12(message, type='info'){
  const el=$('clientPortalNotice');
  if(!el) return;
  el.textContent=message;
  el.style.borderColor = type==='error' ? 'rgba(252,165,165,.45)' : type==='success' ? 'rgba(125,211,252,.45)' : 'rgba(255,255,255,.10)';
  el.style.color = type==='error' ? '#fecaca' : type==='success' ? '#dff7ff' : '#d5e1ef';
}
function markClientFieldsV12(ok){
  ['clientLoginName','clientLoginEmail'].forEach(id=>{
    const el=$(id);
    if(!el) return;
    el.classList.toggle('invalid', !ok);
    el.classList.toggle('valid', ok);
  });
}
function requireRegistrationFieldsV12(){
  const u=getUserInputV12();
  const ok = !!u.name && validEmailV12(u.email);
  markClientFieldsV12(ok);
  if(!ok){
    setClientNoticeV12('Please enter full name and valid email to register first.', 'error');
    (!u.name ? $('clientLoginName') : $('clientLoginEmail'))?.focus();
  }
  return ok ? u : null;
}
function clientLogin(startOrder=false){
  const u=requireRegistrationFieldsV12();
  if(!u) return;

  const users=registeredUsersV12();
  const existing=users.find(x=>x.email===u.email);
  if(existing){
    existing.name = u.name || existing.name;
    existing.lastLogin = now();
  }else{
    users.push({name:u.name,email:u.email,registeredAt:now(),lastLogin:now()});
  }
  saveRegisteredUsersV12(users);

  clientProfile={name:u.name,email:u.email};
  localStorage.setItem(LSCLIENT_V11,JSON.stringify(clientProfile));
  localStorage.setItem(LSA,'1');
  localStorage.setItem(LSROLE_V11,'client');

  setClientNoticeV12('Registration confirmed. Opening user order area...', 'success');
  setTimeout(()=>{
    showApp('client');
    if(startOrder) route('create');
    toast(existing ? 'User dashboard opened.' : 'Registration completed.');
  }, 250);
}
function openRegisteredUserDashboardV12(){
  const input=getUserInputV12();
  const email=input.email;
  const users=registeredUsersV12();

  if(!validEmailV12(email)){
    markClientFieldsV12(false);
    setClientNoticeV12('Enter the email you registered first.', 'error');
    $('clientLoginEmail')?.focus();
    return;
  }
  const existing=users.find(x=>x.email===email);
  if(!existing){
    markClientFieldsV12(false);
    setClientNoticeV12('This email is not registered yet. Please register first before opening the dashboard.', 'error');
    $('clientLoginName')?.focus();
    return;
  }

  clientProfile={name:input.name || existing.name,email:existing.email};
  localStorage.setItem(LSCLIENT_V11,JSON.stringify(clientProfile));
  localStorage.setItem(LSA,'1');
  localStorage.setItem(LSROLE_V11,'client');
  existing.lastLogin=now();
  saveRegisteredUsersV12(users);
  markClientFieldsV12(true);
  setClientNoticeV12('Registered user verified. Opening dashboard...', 'success');
  setTimeout(()=>{
    showApp('client');
    route('dashboard');
    toast('User dashboard opened.');
  }, 250);
}
function bind(){
  $('loginForm').onsubmit=e=>{e.preventDefault();unlock()};
  $('clientPortalBtn').onclick=()=>clientLogin(true);
  $('clientTrackBtn').onclick=openRegisteredUserDashboardV12;
  $('clientLoginEmail')?.addEventListener('keydown', e=>{ if(e.key==='Enter') openRegisteredUserDashboardV12(); });
  $('clientLoginName')?.addEventListener('input', ()=>markClientFieldsV12(true));
  $('clientLoginEmail')?.addEventListener('input', ()=>markClientFieldsV12(true));

  $('topLogout').onclick=logout;$('sideLogout').onclick=logout;$('menuBtn').onclick=()=>$('sidebar').classList.toggle('open');
  $$('[data-page]').forEach(b=>b.onclick=()=>route(b.dataset.page));
  $('projectSearch').oninput=renderDashboard;$('projectFilter').onchange=renderDashboard;$('packageName').onchange=updatePkg;
  $('sampleBtn').onclick=fillSample;$('clearFormBtn').onclick=clearForm;$('projectForm').onsubmit=createProject;
  $('invoicePrintBtn').onclick=()=>currentInvoiceId&&printArea('invoiceDoc');$('invoiceDownloadBtn').onclick=()=>currentInvoiceId&&downloadInvoice(currentInvoiceId);$('invoiceCloseBtn').onclick=()=>$('invoicePanel').classList.add('hidden');
  $('receiptPrintBtn').onclick=()=>currentReceiptId&&printArea('receiptDoc');$('receiptDownloadBtn').onclick=()=>currentReceiptId&&downloadReceipt(currentReceiptId);$('receiptCloseBtn').onclick=()=>$('receiptPanel').classList.add('hidden');
  $('reportPrintBtn').onclick=()=>currentReportId&&printArea('reportDoc');$('reportDownloadBtn').onclick=()=>currentReportId&&downloadReport(currentReportId);$('reportCloseBtn').onclick=()=>$('reportPanel').classList.add('hidden');
  $('cashflowViewBtn').onclick=renderCashflow;$('cashflowPrintBtn').onclick=()=>window.print();$('cashflowExportBtn').onclick=exportCashCSV;
  $('adminUnlockBtn').onclick=adminUnlock;$('adminPin').onkeydown=e=>{if(e.key==='Enter')adminUnlock()};$('adminLockBtn').onclick=()=>{sessionStorage.removeItem('aps_admin');renderAdmin()};$('exportBtn').onclick=exportBackup;$('importBtn').onclick=importBackup;$('resetBtn').onclick=resetData;$('savePackageBtn').onclick=savePkgs;
}


/* ===== V13 separated login/register with project metadata integration ===== */
const LS_REGISTERED_USERS_V13 = 'aps_v13_registered_users';
const LSCLIENT_V13 = 'aps_v13_client_profile';

function registeredUsersV13(){
  try{return JSON.parse(localStorage.getItem(LS_REGISTERED_USERS_V13)) || []}catch{return []}
}
function saveRegisteredUsersV13(users){
  localStorage.setItem(LS_REGISTERED_USERS_V13, JSON.stringify(users));
}
function validEmailV13(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email||'').trim());
}
function noticeV13(id,msg,type='info'){
  const el=$(id);
  if(!el) return;
  el.textContent=msg;
  el.classList.remove('error','success');
  if(type==='error') el.classList.add('error');
  if(type==='success') el.classList.add('success');
}
function userRegistrationDataV13(){
  return {
    name:($('regFullName')?.value||'').trim(),
    email:($('regEmail')?.value||'').trim().toLowerCase(),
    wa:($('regWhatsApp')?.value||'').trim(),
    institution:($('regInstitution')?.value||'').trim()
  };
}
function setClientProfileV13(profile){
  clientProfile={
    name:profile.name||'',
    email:(profile.email||'').toLowerCase(),
    wa:profile.wa||'',
    institution:profile.institution||''
  };
  localStorage.setItem(LSCLIENT_V11, JSON.stringify(clientProfile));
  localStorage.setItem(LSCLIENT_V13, JSON.stringify(clientProfile));
}
function loadClientProfile(){
  try{clientProfile=JSON.parse(localStorage.getItem(LSCLIENT_V13)) || JSON.parse(localStorage.getItem(LSCLIENT_V11)) || {name:'',email:'',wa:'',institution:''}}catch{clientProfile={name:'',email:'',wa:'',institution:''}}
}
function applyRole(){
  loadClientProfile();
  currentRole=localStorage.getItem(LSROLE_V11)||'admin';
  document.body.dataset.role=currentRole;
  $$('.nav button').forEach(btn=>{
    const p=btn.dataset.page;
    const adminOnly=['admin','cashflow'];
    btn.classList.toggle('hidden',currentRole==='client' && adminOnly.includes(p));
  });
  // Integrate registered user data directly into project metadata fields
  if(currentRole==='client'){
    if($('clientName')){ $('clientName').value=clientProfile.name||''; $('clientName').readOnly=!!clientProfile.name; }
    if($('clientEmail')){ $('clientEmail').value=clientProfile.email||''; $('clientEmail').readOnly=!!clientProfile.email; }
    if($('clientWa')){ $('clientWa').value=clientProfile.wa||''; }
    if($('clientInstitution')){ $('clientInstitution').value=clientProfile.institution||''; }
  }else{
    ['clientName','clientEmail'].forEach(id=>{ if($(id)) $(id).readOnly=false; });
  }
}
function registerUserAndOrderV13(e){
  e?.preventDefault();
  const u=userRegistrationDataV13();
  if(!u.name || !validEmailV13(u.email)){
    noticeV13('registerNotice','Please complete full name and a valid email before registering.','error');
    (!u.name ? $('regFullName') : $('regEmail'))?.focus();
    return;
  }
  const users=registeredUsersV13();
  const existing=users.find(x=>x.email===u.email);
  if(existing){
    existing.name=u.name;
    existing.wa=u.wa;
    existing.institution=u.institution;
    existing.lastLogin=now();
  }else{
    users.push({...u,registeredAt:now(),lastLogin:now()});
  }
  saveRegisteredUsersV13(users);
  setClientProfileV13(u);
  localStorage.setItem(LSA,'1');
  localStorage.setItem(LSROLE_V11,'client');
  noticeV13('registerNotice', existing ? 'Profile updated. Opening order area...' : 'Registration saved. Opening order area...', 'success');
  setTimeout(()=>{ showApp('client'); route('create'); applyRole(); toast(existing?'User profile updated.':'User registered.'); },250);
}
function loginRegisteredUserV13(e){
  e?.preventDefault();
  const email=($('userLoginEmail')?.value||'').trim().toLowerCase();
  if(!validEmailV13(email)){
    noticeV13('userLoginNotice','Enter a valid registered email.','error');
    $('userLoginEmail')?.focus();
    return;
  }
  const user=registeredUsersV13().find(x=>x.email===email);
  if(!user){
    noticeV13('userLoginNotice','This email is not registered. Please use User Registration first.','error');
    $('regEmail').value=email;
    $('regFullName')?.focus();
    return;
  }
  user.lastLogin=now();
  const users=registeredUsersV13().map(x=>x.email===email?user:x);
  saveRegisteredUsersV13(users);
  setClientProfileV13(user);
  localStorage.setItem(LSA,'1');
  localStorage.setItem(LSROLE_V11,'client');
  noticeV13('userLoginNotice','Registered email verified. Opening user dashboard...','success');
  setTimeout(()=>{ showApp('client'); route('dashboard'); toast('User dashboard opened.'); },250);
}
function bind(){
  $('loginForm').onsubmit=e=>{e.preventDefault();unlock()};
  if($('userRegisterForm')) $('userRegisterForm').onsubmit=registerUserAndOrderV13;
  if($('userLoginForm')) $('userLoginForm').onsubmit=loginRegisteredUserV13;

  $('topLogout').onclick=logout;$('sideLogout').onclick=logout;$('menuBtn').onclick=()=>$('sidebar').classList.toggle('open');
  $$('[data-page]').forEach(b=>b.onclick=()=>route(b.dataset.page));
  $('projectSearch').oninput=renderDashboard;$('projectFilter').onchange=renderDashboard;$('packageName').onchange=updatePkg;
  $('sampleBtn').onclick=fillSample;$('clearFormBtn').onclick=clearForm;$('projectForm').onsubmit=createProject;
  $('invoicePrintBtn').onclick=()=>currentInvoiceId&&printArea('invoiceDoc');$('invoiceDownloadBtn').onclick=()=>currentInvoiceId&&downloadInvoice(currentInvoiceId);$('invoiceCloseBtn').onclick=()=>$('invoicePanel').classList.add('hidden');
  $('receiptPrintBtn').onclick=()=>currentReceiptId&&printArea('receiptDoc');$('receiptDownloadBtn').onclick=()=>currentReceiptId&&downloadReceipt(currentReceiptId);$('receiptCloseBtn').onclick=()=>$('receiptPanel').classList.add('hidden');
  $('reportPrintBtn').onclick=()=>currentReportId&&printArea('reportDoc');$('reportDownloadBtn').onclick=()=>currentReportId&&downloadReport(currentReportId);$('reportCloseBtn').onclick=()=>$('reportPanel').classList.add('hidden');
  $('cashflowViewBtn').onclick=renderCashflow;$('cashflowPrintBtn').onclick=()=>window.print();$('cashflowExportBtn').onclick=exportCashCSV;
  $('adminUnlockBtn').onclick=adminUnlock;$('adminPin').onkeydown=e=>{if(e.key==='Enter')adminUnlock()};$('adminLockBtn').onclick=()=>{sessionStorage.removeItem('aps_admin');renderAdmin()};$('exportBtn').onclick=exportBackup;$('importBtn').onclick=importBackup;$('resetBtn').onclick=resetData;$('savePackageBtn').onclick=savePkgs;
}
function createProject(e){
  e.preventDefault();
  applyRole();
  let text=$('documentText').value.trim();
  if(!text){toast('Please paste manuscript text.');return}
  let pkg=packages().find(p=>p.id===$('packageName').value)||packages()[0],u=$('urgency').value,m=u==='Express'?1.5:u==='Urgent'?1.25:1,amount=Math.round(pkg.price*m),a=analyze(text),secs=parseSections(text),id=$('projectIdPreview').value||nextProjectId();
  let p={id,createdAt:now(),updatedAt:now(),userRole:currentRole,registeredUserEmail:currentRole==='client'?clientProfile.email:'',clientName:$('clientName').value.trim(),clientEmail:$('clientEmail').value.trim(),clientWa:$('clientWa').value.trim(),clientInstitution:$('clientInstitution').value.trim(),docTitle:$('docTitle').value.trim(),writingType:$('writingType').value,targetStyle:$('targetStyle').value,targetJournal:$('targetJournal').value.trim(),deadline:$('deadline').value,packageId:pkg.id,packageName:pkg.name,packagePrice:pkg.price,urgency:u,amount,amountPaid:0,paymentMethod:'',paymentNote:'',wordCount:Number($('wordCount').value||words(text)),documentText:text,paymentStatus:'Unpaid',proofreadStatus:'AI Proofread Completed',tracking:[{date:now(),title:'Project Created',detail:'Project ID, registered user metadata, and manuscript text were submitted.'},{date:now(),title:'Invoice Generated',detail:'Invoice was automatically created and linked to project ID.'},{date:now(),title:'AI-Assisted Proofread Completed',detail:`Section-by-section overall score ${a.scores.overall}.`}],costBreakdown:[{stage:'Project intake',result:'Completed',amount:Math.round(amount*.1)},{stage:'AI-assisted section review',result:'Completed',amount:Math.round(amount*.25)},{stage:'Academic style review',result:'In Queue',amount:Math.round(amount*.28)},{stage:'Citation and journal readiness',result:'Queued',amount:Math.round(amount*.17)},{stage:'Final report',result:'Pending',amount:Math.round(amount*.2)}],revisions:[{date:now(),action:'AI-assisted section-by-section proofreading completed',score:a.scores.overall,issues:a.issues.length}],analysis:a,sections:secs,revisedText:a.revised};
  let ps=projects();ps.unshift(p);setActive(p.id);saveProjects(ps);clearForm();toast('Project order created and integrated with user metadata.');route('dashboard');
}
function visibleProjects(){
  const ps=projects();
  if(currentRole!=='client') return ps;
  loadClientProfile();
  if(!clientProfile.email) return [];
  return ps.filter(p=>String(p.clientEmail||p.registeredUserEmail||'').toLowerCase()===clientProfile.email);
}


/* ===== V14 final-ready overrides: no demo data, editable project ID, DOC/DOCX upload only ===== */
function seed(){
  if(!localStorage.getItem(LSK)) localStorage.setItem(LSK, JSON.stringify(pkgs));
  if(!localStorage.getItem(LSP)) localStorage.setItem(LSP, JSON.stringify([]));
  activeId = localStorage.getItem(LSACT) || projects()[0]?.id || null;
}
function nextProjectId(){
  const d=new Date(), y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0');
  const prefix=`APS-${y}${m}${day}`;
  const nums=projects().map(p=>String(p.id||'')).filter(id=>id.startsWith(prefix+'-')).map(id=>Number(id.split('-').pop())).filter(n=>!Number.isNaN(n));
  const next=(nums.length?Math.max(...nums):0)+1;
  return `${prefix}-${String(next).padStart(3,'0')}`;
}
function previewProjectId(){
  if($('projectIdPreview') && !$('projectIdPreview').value) $('projectIdPreview').value=nextProjectId();
}
function sanitizeProjectIdV14(id){
  return String(id||'').trim().replace(/\s+/g,'-').replace(/[^A-Za-z0-9._-]/g,'').toUpperCase();
}
function validateProjectIdV14(raw){
  const id=sanitizeProjectIdV14(raw || nextProjectId());
  if(!id){
    toast('Project ID is required.');
    return null;
  }
  if(projects().some(p=>String(p.id).toUpperCase()===id)){
    toast('Project ID already exists. Please edit the ID.');
    $('projectIdPreview')?.focus();
    return null;
  }
  return id;
}
function manuscriptFileV14(){
  const input=$('manuscriptFile');
  const file=input?.files?.[0];
  if(!file) return null;
  const name=file.name || '';
  const ok=/\.(doc|docx)$/i.test(name);
  if(!ok){
    if(input) input.value='';
    const n=$('fileUploadNotice');
    if(n){n.textContent='Invalid file. Please upload .doc or .docx only. PDF is not accepted.'; n.className='file-notice error';}
    toast('Only .doc or .docx files are accepted.');
    return null;
  }
  return {name:file.name,size:file.size,type:file.type||'Word document'};
}
function handleManuscriptFileV14(){
  const f=manuscriptFileV14();
  const n=$('fileUploadNotice');
  if(!n) return;
  if(f){
    n.textContent=`Selected Word file: ${f.name}`;
    n.className='file-notice success';
  }else if($('manuscriptFile') && !$('manuscriptFile').value){
    n.textContent='No file selected.';
    n.className='file-notice';
  }
}
function clearForm(){
  $('projectForm').reset();
  $('projectIdPreview').value=nextProjectId();
  if($('fileUploadNotice')){
    $('fileUploadNotice').textContent='No file selected.';
    $('fileUploadNotice').className='file-notice';
  }
  applyRole();
  updatePkg();
}
function createProject(e){
  e.preventDefault();
  applyRole();
  const file=manuscriptFileV14();
  if($('manuscriptFile')?.value && !file) return;
  let text=$('documentText').value.trim();
  if(!text && !file){
    toast('Please paste manuscript text or upload a .doc/.docx manuscript file.');
    return;
  }
  if(!text && file){
    text=`Uploaded manuscript file: ${file.name}\n\nText extraction is pending. Paste manuscript text in the workspace for instant section-by-section proofreading.`;
  }
  const customId=validateProjectIdV14($('projectIdPreview').value);
  if(!customId) return;
  $('projectIdPreview').value=customId;

  let pkg=packages().find(p=>p.id===$('packageName').value)||packages()[0],
      u=$('urgency').value,
      m=u==='Express'?1.5:u==='Urgent'?1.25:1,
      amount=Math.round(pkg.price*m),
      a=analyze(text),
      secs=parseSections(text),
      id=customId;
  let p={id,createdAt:now(),updatedAt:now(),userRole:currentRole,registeredUserEmail:currentRole==='client'?clientProfile.email:'',clientName:$('clientName').value.trim(),clientEmail:$('clientEmail').value.trim(),clientWa:$('clientWa').value.trim(),clientInstitution:$('clientInstitution').value.trim(),docTitle:$('docTitle').value.trim(),writingType:$('writingType').value,targetStyle:$('targetStyle').value,targetJournal:$('targetJournal').value.trim(),deadline:$('deadline').value,packageId:pkg.id,packageName:pkg.name,packagePrice:pkg.price,urgency:u,amount,amountPaid:0,paymentMethod:'',paymentNote:'',wordCount:Number($('wordCount').value||words(text)),manuscriptFileName:file?.name||'',manuscriptFileSize:file?.size||0,documentText:text,paymentStatus:'Unpaid',proofreadStatus:'AI Proofread Completed',tracking:[{date:now(),title:'Project Created',detail:'Project ID, registered user metadata, manuscript file/text, and order details were submitted.'},{date:now(),title:'Invoice Generated',detail:'Invoice was automatically created and linked to project ID.'},{date:now(),title:'Proofreading Scan Prepared',detail:`Section-by-section workspace prepared with overall score ${a.scores.overall}.`}],costBreakdown:[{stage:'Project intake',result:'Completed',amount:Math.round(amount*.1)},{stage:'Section proofreading preparation',result:'Completed',amount:Math.round(amount*.25)},{stage:'Academic style review',result:'In Queue',amount:Math.round(amount*.28)},{stage:'Citation and journal readiness',result:'Queued',amount:Math.round(amount*.17)},{stage:'Final report',result:'Pending',amount:Math.round(amount*.2)}],revisions:[{date:now(),action:'Section-by-section proofreading workspace prepared',score:a.scores.overall,issues:a.issues.length}],analysis:a,sections:secs,revisedText:a.revised};
  let ps=projects();ps.unshift(p);setActive(p.id);saveProjects(ps);clearForm();toast('Project order created and integrated with user metadata.');route('dashboard');
}
function fillSample(){
  toast('Demo sample is removed in the ready-to-use version.');
}
function bind(){
  $('loginForm').onsubmit=e=>{e.preventDefault();unlock()};
  if($('userRegisterForm')) $('userRegisterForm').onsubmit=registerUserAndOrderV13;
  if($('userLoginForm')) $('userLoginForm').onsubmit=loginRegisteredUserV13;

  $('topLogout').onclick=logout;$('sideLogout').onclick=logout;$('menuBtn').onclick=()=>$('sidebar').classList.toggle('open');
  $$('[data-page]').forEach(b=>b.onclick=()=>route(b.dataset.page));
  $('projectSearch').oninput=renderDashboard;$('projectFilter').onchange=renderDashboard;$('packageName').onchange=updatePkg;
  if($('sampleBtn')) $('sampleBtn').onclick=fillSample;
  $('clearFormBtn').onclick=clearForm;
  if($('manuscriptFile')) $('manuscriptFile').onchange=handleManuscriptFileV14;
  $('projectForm').onsubmit=createProject;
  $('invoicePrintBtn').onclick=()=>currentInvoiceId&&printArea('invoiceDoc');$('invoiceDownloadBtn').onclick=()=>currentInvoiceId&&downloadInvoice(currentInvoiceId);$('invoiceCloseBtn').onclick=()=>$('invoicePanel').classList.add('hidden');
  $('receiptPrintBtn').onclick=()=>currentReceiptId&&printArea('receiptDoc');$('receiptDownloadBtn').onclick=()=>currentReceiptId&&downloadReceipt(currentReceiptId);$('receiptCloseBtn').onclick=()=>$('receiptPanel').classList.add('hidden');
  $('reportPrintBtn').onclick=()=>currentReportId&&printArea('reportDoc');$('reportDownloadBtn').onclick=()=>currentReportId&&downloadReport(currentReportId);$('reportCloseBtn').onclick=()=>$('reportPanel').classList.add('hidden');
  $('cashflowViewBtn').onclick=renderCashflow;$('cashflowPrintBtn').onclick=()=>window.print();$('cashflowExportBtn').onclick=exportCashCSV;
  $('adminUnlockBtn').onclick=adminUnlock;$('adminPin').onkeydown=e=>{if(e.key==='Enter')adminUnlock()};$('adminLockBtn').onclick=()=>{sessionStorage.removeItem('aps_admin');renderAdmin()};$('exportBtn').onclick=exportBackup;$('importBtn').onclick=importBackup;$('resetBtn').onclick=resetData;$('savePackageBtn').onclick=savePkgs;
}
