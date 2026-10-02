const STORAGE_KEY="vanGingerSeniorCareV1";
const STORAGE_VERSION=2;
const APP_ID="van-ginger-senior-care";
const $=id=>document.getElementById(id);
const dogMeta={
  van:{name:"Van",accent:"#6f8291",soft:"#dce4e8",headerMain:"#596164",headerEdge:"#454b4d",headerLift:"#747574",headerText:"#f4efe6"},
  ginger:{name:"Ginger",accent:"#aa684b",soft:"#f0d8ca",headerMain:"#5e4c42",headerEdge:"#40342d",headerLift:"#7a685d",headerText:"#f4efe6"}
};
function uid(){return globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2)}
function todayISO(){const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)}
function prettyDate(v){if(!v)return"No date";const d=new Date(v+"T12:00:00");return Number.isNaN(d.getTime())?v:d.toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"})}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function blankSitter(){return{pottyRoutine:"",sleepRoutine:"",emergencyVet:"",instructions:""}}
function blankSitterSession(){return{active:false,activatedAt:"",sessionId:"",checklist:{}}}
function blankDog(name){return{profile:{name,age:"",breed:"",sex:"",veterinarian:"",emergencyContact:"",notes:""},treatments:[],feedingItems:[],weights:[],heights:[],cautions:[],careNotes:[],history:[],sitter:blankSitter()}}
function defaultState(){return{version:STORAGE_VERSION,appId:APP_ID,activeDogId:"van",dogs:{van:blankDog("Van"),ginger:blankDog("Ginger")},sitterSession:blankSitterSession()}}
function normalizeDog(raw,name){const base=blankDog(name);raw=raw&&typeof raw==="object"?raw:{};return{profile:{...base.profile,...(raw.profile||{}),name:raw.profile?.name||name},treatments:Array.isArray(raw.treatments)?raw.treatments:[],feedingItems:Array.isArray(raw.feedingItems)?raw.feedingItems:[],weights:Array.isArray(raw.weights)?raw.weights:[],heights:Array.isArray(raw.heights)?raw.heights:[],cautions:Array.isArray(raw.cautions)?raw.cautions:[],careNotes:Array.isArray(raw.careNotes)?raw.careNotes:[],history:Array.isArray(raw.history)?raw.history:[],sitter:{...base.sitter,...(raw.sitter&&typeof raw.sitter==="object"?raw.sitter:{})}}}
function normalizeState(raw){if(!raw||typeof raw!=="object")return defaultState();const baseSession=blankSitterSession(),incoming=raw.sitterSession&&typeof raw.sitterSession==="object"?raw.sitterSession:{};const checklist=incoming.checklist&&typeof incoming.checklist==="object"&&!Array.isArray(incoming.checklist)?incoming.checklist:{};return{version:STORAGE_VERSION,appId:APP_ID,activeDogId:raw.activeDogId==="ginger"?"ginger":"van",dogs:{van:normalizeDog(raw.dogs?.van,"Van"),ginger:normalizeDog(raw.dogs?.ginger,"Ginger")},sitterSession:{...baseSession,...incoming,active:Boolean(incoming.active),checklist:{...checklist}}}}
const Store={load(){try{return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)||"null"))}catch(e){console.error(e);return defaultState()}},save(value){try{const n=normalizeState(value),s=JSON.stringify(n);localStorage.setItem(STORAGE_KEY,s);if(localStorage.getItem(STORAGE_KEY)!==s)throw new Error("Verification failed");return true}catch(e){console.error(e);alert("Van and Ginger’s information could not be saved on this device.");return false}},clear(){localStorage.removeItem(STORAGE_KEY)}};
let state=Store.load();let editing={treatment:null,food:null,weight:null,height:null,caution:null,note:null};let logFilter="all";
function dog(){return state.dogs[state.activeDogId]}
function dogName(){return dog().profile.name||dogMeta[state.activeDogId].name}
function persist(){return Store.save(state)}
function addHistory(type,title,detail="",date=todayISO(),sourceId=""){dog().history.unshift({id:uid(),type,title,detail,date,createdAt:new Date().toISOString(),sourceId})}
function setTheme(){const meta=dogMeta[state.activeDogId];document.documentElement.style.setProperty("--active",meta.accent);document.documentElement.style.setProperty("--active-soft",meta.soft);document.documentElement.style.setProperty("--header-main",meta.headerMain);document.documentElement.style.setProperty("--header-edge",meta.headerEdge);document.documentElement.style.setProperty("--header-lift",meta.headerLift);document.documentElement.style.setProperty("--header-text",meta.headerText);document.body.classList.toggle("dog-van",state.activeDogId==="van");document.body.classList.toggle("dog-ginger",state.activeDogId==="ginger")}
function setTodayDefaults(){["treatmentStart","foodStart","noteDate","weightDate","heightDate"].forEach(id=>{if($(id)&&!$(id).value)$(id).value=todayISO()})}
function dismissSplash(){const splash=$("splashScreen");if(!splash)return;splash.classList.add("hide");splash.setAttribute("aria-hidden","true");setTimeout(showSitterEntryAlert,140)}
function showSplash(){const splash=$("splashScreen");if(!splash||document.documentElement.classList.contains("install-required"))return;splash.classList.remove("hide");splash.setAttribute("aria-hidden","false")}
function switchDog(id){if(!state.dogs[id])return;state.activeDogId=id;cancelAllEdits();persist();renderAll();document.querySelector(".app-shell").scrollTop=0}
function showScreen(id,btn){document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));$(id)?.classList.add("active");document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.screen===id));document.querySelector(".app-shell").scrollTop=0;if(id==="more"&&!document.querySelector(".more-panel.active"))showMorePanel("profile")}
function showMorePanel(id,btn){document.querySelectorAll(".more-panel").forEach(x=>x.classList.toggle("active",x.id===id+"Panel"));document.querySelectorAll("#moreTabs button").forEach(x=>x.classList.toggle("active",x.dataset.panel===id));}
function renderIdentity(){setTheme();document.querySelectorAll(".dog-tab").forEach(x=>x.classList.toggle("active",x.dataset.dog===state.activeDogId));const name=dogName();const meta=dogMeta[state.activeDogId];$("homeAvatar").textContent=name.charAt(0).toUpperCase();$("homeDogName").textContent=name;$("homeEyebrow").textContent=`${name}’s care overview`;$("homeProfileLine").textContent=[dog().profile.age&&`Age ${dog().profile.age}`,dog().profile.breed].filter(Boolean).join(" · ")||"Add age and breed in the profile.";["medDogChip","foodDogChip","logDogChip","profileDogChip","measurementDogChip","cautionDogChip"].forEach(id=>$(id).textContent=name);$("medPageTitle").textContent=`${name}’s medications & treatments`;$("activeTreatmentsTitle").textContent=`${name}’s active medications and treatments`;$("foodPageTitle").textContent=`${name}’s food & feeding`;$("activeFoodsTitle").textContent=`${name}’s active foods`;$("logPageTitle").textContent=`${name}’s timeline`;$("profileTitle").textContent=`${name}’s profile`;$("measurementTitle").textContent=`${name}’s measurements`;$("cautionTitle").textContent=`${name}’s cautions`;$("homeMedsTitle").textContent=`${name}’s medications`;$("homeFoodsTitle").textContent=`${name}’s foods`;$("homeCautionTitle").textContent=`${name}’s caution`;$("homeNoteTitle").textContent=`${name}’s note`;$("sharePdfBtn").textContent=`Share ${name} PDF`;}
function renderHome(){const d=dog();$("medCount").textContent=d.treatments.length;$("foodCount").textContent=d.feedingItems.length;$("historyCount").textContent=allEntries().length;const w=[...d.weights].sort(sortByDate)[0];$("latestWeight").textContent=w?.value||"—";$("latestWeightDate").textContent=w?prettyDate(w.date):"No entry";$("homeMeds").innerHTML=miniList(d.treatments,x=>x.name,["dosage","frequency","timeOfDay"],"No active medications or treatments.");$("homeFoods").innerHTML=miniList(d.feedingItems,x=>x.name,["type","amount","schedule"],"No active food items.");const c=[...d.cautions].sort(sortByDate)[0];$("homeCaution").innerHTML=c?`<div class="mini-item"><strong>${esc(c.text)}</strong><small>${esc(c.type)}</small></div>`:'<p class="empty">No cautions added.</p>';const n=[...d.careNotes].sort(sortByDate)[0];$("homeNote").innerHTML=n?`<div class="mini-item"><strong>${esc(n.title)}</strong><small>${prettyDate(n.date)}${n.note?" · "+esc(n.note):""}</small></div>`:'<p class="empty">No care notes added.</p>'}
function miniList(items,titleFn,fields,empty){return items.length?`<div class="mini-list">${items.slice(0,3).map(x=>`<div class="mini-item"><strong>${esc(titleFn(x))}</strong><small>${fields.map(k=>x[k]).filter(Boolean).map(esc).join(" · ")}</small></div>`).join("")}</div>`:`<p class="empty">${empty}</p>`}
function sortByDate(a,b){return new Date((b.date||b.startDate||"1970-01-01")+"T12:00:00")-new Date((a.date||a.startDate||"1970-01-01")+"T12:00:00")}
function setEditButtons(kind,isEdit){const map={treatment:["treatmentSaveBtn","treatmentCancelBtn","Add medication or treatment","Save changes"],food:["foodSaveBtn","foodCancelBtn","Add food item","Save changes"],weight:["weightSaveBtn","weightCancelBtn","Add weight","Save changes"],height:["heightSaveBtn","heightCancelBtn","Add height","Save changes"],caution:["cautionSaveBtn","cautionCancelBtn","Add caution","Save changes"],note:["noteSaveBtn","noteCancelBtn","Add care note","Save changes"]},m=map[kind];$(m[0]).textContent=isEdit?m[3]:m[2];$(m[1]).classList.toggle("hidden",!isEdit)}
const TREATMENT_FREQUENCY_PRESETS=["Once daily","Twice daily","Three times daily","Every 8 hours","Every 12 hours","Every other day","As needed (PRN)","Weekly","Monthly"];
const TREATMENT_DAYPART_PRESETS=["Morning (AM)","Afternoon (PM)","Evening (PM)","Bedtime (PM)","Anytime / as needed"];
function formatClock(value){
  if(!value)return "";
  const match=/^(\d{1,2}):(\d{2})$/.exec(value);
  if(!match)return value;
  let hour=Number(match[1]);const minute=match[2],period=hour>=12?"PM":"AM";
  hour=hour%12||12;
  return hour+":"+minute+" "+period;
}
function cleanDaypartLabel(value){return (value||"").replace(/\s*\((AM|PM)\)\s*$/i,"").trim()}
function updateTreatmentScheduleFields(){
  $("treatmentFrequencyOtherWrap")?.classList.toggle("hidden",$("treatmentFrequencyChoice")?.value!=="Other");
  $("treatmentDaypartOtherWrap")?.classList.toggle("hidden",$("treatmentDaypartChoice")?.value!=="Other");
}
function readTreatmentFrequency(){
  const choice=$("treatmentFrequencyChoice")?.value||"";
  const custom=$("treatmentFrequencyOther")?.value.trim()||"";
  return {choice:choice,custom:choice==="Other"?custom:"",display:choice==="Other"?custom:choice};
}
function readTreatmentWhen(){
  const choice=$("treatmentDaypartChoice")?.value||"";
  const custom=$("treatmentDaypartOther")?.value.trim()||"";
  const exactTime=$("treatmentExactTime")?.value||"";
  const base=choice==="Other"?custom:choice;
  const display=[cleanDaypartLabel(base),exactTime&&formatClock(exactTime)].filter(Boolean).join(" · ");
  return {choice:choice,custom:choice==="Other"?custom:"",exactTime:exactTime,display:display};
}
function treatmentEditorFrequency(x){
  if(x?.frequencyChoice)return {choice:x.frequencyChoice,custom:x.frequencyCustom||""};
  const legacy=(x?.frequency||"").trim();
  if(!legacy)return {choice:"",custom:""};
  if(TREATMENT_FREQUENCY_PRESETS.includes(legacy))return {choice:legacy,custom:""};
  return {choice:"Other",custom:legacy};
}
function treatmentEditorDaypart(x){
  if(x?.daypartChoice)return {choice:x.daypartChoice,custom:x.daypartCustom||"",exactTime:x.exactTime||""};
  const legacy=(x?.timeOfDay||"").trim();
  if(!legacy)return {choice:"",custom:"",exactTime:x?.exactTime||""};
  for(const preset of TREATMENT_DAYPART_PRESETS){
    const clean=cleanDaypartLabel(preset);
    if(legacy===preset||legacy===clean||legacy.startsWith(clean+" · "))return {choice:preset,custom:"",exactTime:x?.exactTime||""};
  }
  return {choice:"Other",custom:legacy,exactTime:x?.exactTime||""};
}
function treatmentStartText(x){
  if(!x.startDate&&!x.startTime)return "";
  const bits=[];
  if(x.startDate)bits.push(prettyDate(x.startDate));
  if(x.startTime)bits.push(formatClock(x.startTime));
  return "Started / given "+bits.join(" · ");
}
function treatmentDueText(x){
  if(!x.dueDate&&!x.dueTime)return "";
  const bits=[];
  if(x.dueDate)bits.push(prettyDate(x.dueDate));
  if(x.dueTime)bits.push(formatClock(x.dueTime));
  return "Next due "+bits.join(" · ");
}
function treatmentDetail(x){return [x.dosage,x.frequency,x.timeOfDay,treatmentDueText(x),x.instructions,x.note].filter(Boolean).join(" · ")}
function saveTreatment(){
  const name=$("treatmentName").value.trim();
  if(!name)return alert("Add a medication or treatment name.");
  const old=dog().treatments.find(x=>x.id===editing.treatment);
  const frequency=readTreatmentFrequency(),when=readTreatmentWhen();
  const item={...(old||{}),id:editing.treatment||uid(),type:$("treatmentType").value,name:name,dosage:$("treatmentDosage").value.trim(),frequency:frequency.display,frequencyChoice:frequency.choice,frequencyCustom:frequency.custom,timeOfDay:when.display,daypartChoice:when.choice,daypartCustom:when.custom,exactTime:when.exactTime,startDate:$("treatmentStart").value,startTime:$("treatmentStartTime").value,dueDate:$("treatmentDue").value,dueTime:$("treatmentDueTime").value,endDate:$("treatmentEnd").value,veterinarian:$("treatmentVet").value.trim(),instructions:$("treatmentInstructions").value.trim(),note:$("treatmentNote").value.trim()};
  if(old){dog().treatments=dog().treatments.map(x=>x.id===old.id?item:x);addHistory("treatment",item.type+" updated: "+item.name,treatmentDetail(item),todayISO(),item.id)}
  else{dog().treatments.unshift(item);addHistory("treatment",item.type+" added: "+item.name,treatmentDetail(item),item.startDate||todayISO(),item.id)}
  persist();cancelTreatmentEdit();renderAll();
}
function editTreatment(id){
  const x=dog().treatments.find(v=>v.id===id);if(!x)return;
  editing.treatment=id;
  $("treatmentType").value=x.type;$("treatmentName").value=x.name;$("treatmentDosage").value=x.dosage||"";
  const frequency=treatmentEditorFrequency(x);$("treatmentFrequencyChoice").value=frequency.choice;$("treatmentFrequencyOther").value=frequency.custom;
  const when=treatmentEditorDaypart(x);$("treatmentDaypartChoice").value=when.choice;$("treatmentDaypartOther").value=when.custom;$("treatmentExactTime").value=when.exactTime||"";
  $("treatmentStart").value=x.startDate||"";$("treatmentStartTime").value=x.startTime||"";$("treatmentDue").value=x.dueDate||"";$("treatmentDueTime").value=x.dueTime||"";$("treatmentEnd").value=x.endDate||"";$("treatmentVet").value=x.veterinarian||"";$("treatmentInstructions").value=x.instructions||"";$("treatmentNote").value=x.note||"";
  updateTreatmentScheduleFields();setEditButtons("treatment",true);$("treatmentName").focus();
}
function cancelTreatmentEdit(){
  editing.treatment=null;
  ["treatmentName","treatmentDosage","treatmentFrequencyOther","treatmentDaypartOther","treatmentExactTime","treatmentStartTime","treatmentDue","treatmentDueTime","treatmentEnd","treatmentVet","treatmentInstructions","treatmentNote"].forEach(id=>{if($(id))$(id).value=""});
  $("treatmentType").value="Medication";$("treatmentFrequencyChoice").value="";$("treatmentDaypartChoice").value="";$("treatmentStart").value=todayISO();updateTreatmentScheduleFields();setEditButtons("treatment",false);
}
function stopTreatment(id){
  const x=dog().treatments.find(v=>v.id===id);if(!x)return;
  if(!confirm("Stop or remove "+x.name+" from "+dogName()+"’s active list? Its history will remain."))return;
  dog().treatments=dog().treatments.filter(v=>v.id!==id);
  const title=x.type==="Medication"?"Medication stopped":x.type==="Vaccination"?"Vaccination record removed":x.type==="Supplement"?"Supplement stopped":"Treatment discontinued";
  addHistory("treatment",title+": "+x.name,treatmentDetail(x));if(editing.treatment===id)cancelTreatmentEdit();persist();renderAll();
}
function medFact(label,value){return value?'<div class="med-fact"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong></div>':""}
function renderTreatments(){
  const items=dog().treatments;
  $("treatmentList").innerHTML=items.length?items.map(x=>{
    const facts=[medFact("Dosage",x.dosage),medFact("Frequency",x.frequency),medFact("When",x.timeOfDay)].join("");
    const tracking=[treatmentStartText(x),treatmentDueText(x),x.endDate&&("Ends "+prettyDate(x.endDate)),x.veterinarian&&("Vet: "+x.veterinarian)].filter(Boolean).map(esc).join(" · ");
    return '<div class="entry medication-entry"><div class="entry-top"><div class="med-card-copy"><span class="status">'+esc(x.type)+'</span><strong class="med-name">'+esc(x.name)+'</strong>'+(facts?'<div class="med-facts">'+facts+'</div>':"")+(tracking?'<small class="med-tracking">'+tracking+'</small>':"")+(x.instructions?'<small class="med-instructions"><b>Instructions:</b> '+esc(x.instructions)+'</small>':"")+(x.note?'<small class="med-note">'+esc(x.note)+'</small>':"")+'</div><div class="entry-actions"><button onclick="editTreatment(\''+x.id+'\')">Edit</button><button class="stop" onclick="stopTreatment(\''+x.id+'\')">Stop</button></div></div></div>';
  }).join(""):'<p class="empty">No active medications or treatments.</p>';
}
function saveFood(){const name=$("foodName").value.trim();if(!name)return alert("Add a food or item name.");const old=dog().feedingItems.find(x=>x.id===editing.food);const item={id:editing.food||uid(),type:$("foodType").value,name,amount:$("foodAmount").value.trim(),schedule:$("foodSchedule").value.trim(),whenUsed:$("foodWhen").value.trim(),startDate:$("foodStart").value,note:$("foodNote").value.trim()};if(old){dog().feedingItems=dog().feedingItems.map(x=>x.id===old.id?item:x);addHistory("feeding",`Food updated: ${item.name}`,foodDetail(item))}else{dog().feedingItems.unshift(item);addHistory("feeding",`Food added: ${item.name}`,foodDetail(item),item.startDate||todayISO())}persist();cancelFoodEdit();renderAll()}
function foodDetail(x){return [x.type,x.amount,x.schedule,x.whenUsed,x.note].filter(Boolean).join(" · ")}
function editFood(id){const x=dog().feedingItems.find(v=>v.id===id);if(!x)return;editing.food=id;$("foodType").value=x.type;$("foodName").value=x.name;$("foodAmount").value=x.amount||"";$("foodSchedule").value=x.schedule||"";$("foodWhen").value=x.whenUsed||"";$("foodStart").value=x.startDate||"";$("foodNote").value=x.note||"";setEditButtons("food",true);$("foodName").focus()}
function cancelFoodEdit(){editing.food=null;$("foodType").value="Main meal";["foodName","foodAmount","foodSchedule","foodWhen","foodNote"].forEach(id=>$(id).value="");$("foodStart").value=todayISO();setEditButtons("food",false)}
function stopFood(id){const x=dog().feedingItems.find(v=>v.id===id);if(!x)return;if(!confirm(`Remove ${x.name} from ${dogName()}’s active food list? Its history will remain.`))return;dog().feedingItems=dog().feedingItems.filter(v=>v.id!==id);const label=x.type==="Prescription food"?"Prescription food discontinued":x.type.includes("treat")?"Treat removed":"Food stopped";addHistory("feeding",`${label}: ${x.name}`,foodDetail(x));if(editing.food===id)cancelFoodEdit();persist();renderAll()}
function renderFoods(){const items=dog().feedingItems;$("foodList").innerHTML=items.length?items.map(x=>`<div class="entry"><div class="entry-top"><div><span class="status">${esc(x.type)}</span><strong>${esc(x.name)}</strong><small>${[x.amount,x.schedule,x.whenUsed,x.startDate&&`Started ${prettyDate(x.startDate)}`].filter(Boolean).map(esc).join(" · ")}</small>${x.note?`<small>${esc(x.note)}</small>`:""}</div><div class="entry-actions"><button onclick="editFood('${x.id}')">Edit</button><button class="stop" onclick="stopFood('${x.id}')">Stop</button></div></div></div>`).join(""):'<p class="empty">No active food items.</p>'}
function saveProfile(){const p=dog().profile;const next={name:$("profileName").value.trim()||dogMeta[state.activeDogId].name,age:$("profileAge").value.trim(),breed:$("profileBreed").value.trim(),sex:$("profileSex").value,veterinarian:$("profileVet").value.trim(),emergencyContact:$("profileEmergency").value.trim(),notes:$("profileNotes").value.trim()};dog().profile=next;addHistory("profile","Profile updated",[next.age&&`Age ${next.age}`,next.breed,next.veterinarian&&`Vet: ${next.veterinarian}`].filter(Boolean).join(" · "));persist();renderAll();alert(`${next.name}’s profile has been saved.`)}
function loadProfile(){const p=dog().profile;$("profileName").value=p.name||dogMeta[state.activeDogId].name;$("profileAge").value=p.age||"";$("profileBreed").value=p.breed||"";$("profileSex").value=p.sex||"";$("profileVet").value=p.veterinarian||"";$("profileEmergency").value=p.emergencyContact||"";$("profileNotes").value=p.notes||""}
function saveMeasurement(type){const value=$(type+"Value").value.trim();if(!value)return alert(`Add ${dogName()}’s ${type}.`);const arr=type==="weight"?dog().weights:dog().heights;const id=editing[type];const item={id:id||uid(),date:$(type+"Date").value||todayISO(),value,note:$(type+"Note").value.trim()};if(id){if(type==="weight")dog().weights=arr.map(x=>x.id===id?item:x);else dog().heights=arr.map(x=>x.id===id?item:x);addHistory(type,`${type[0].toUpperCase()+type.slice(1)} updated: ${value}`,item.note,item.date,item.id)}else{arr.unshift(item);addHistory(type,`${type[0].toUpperCase()+type.slice(1)}: ${value}`,item.note,item.date,item.id)}persist();cancelMeasurementEdit(type);renderAll()}
function editMeasurement(type,id){const arr=type==="weight"?dog().weights:dog().heights,x=arr.find(v=>v.id===id);if(!x)return;editing[type]=id;$(type+"Date").value=x.date||todayISO();$(type+"Value").value=x.value;$(type+"Note").value=x.note||"";setEditButtons(type,true);$(type+"Value").focus()}
function cancelMeasurementEdit(type){editing[type]=null;$(type+"Date").value=todayISO();$(type+"Value").value="";$(type+"Note").value="";setEditButtons(type,false)}
function deleteMeasurement(type,id){const arr=type==="weight"?dog().weights:dog().heights,x=arr.find(v=>v.id===id);if(!x)return;if(!confirm(`Delete this ${type} entry? A history record will remain.`))return;if(type==="weight")dog().weights=arr.filter(v=>v.id!==id);else dog().heights=arr.filter(v=>v.id!==id);addHistory(type,`${type[0].toUpperCase()+type.slice(1)} entry removed`,[x.value,prettyDate(x.date),x.note].filter(Boolean).join(" · "));persist();renderAll()}
function renderMeasurements(){["weight","height"].forEach(type=>{const arr=type==="weight"?dog().weights:dog().heights;$(type+"List").innerHTML=arr.length?arr.slice().sort(sortByDate).map(x=>`<div class="entry"><div class="entry-top"><div><strong>${esc(x.value)}</strong><small>${prettyDate(x.date)}${x.note?" · "+esc(x.note):""}</small></div><div class="entry-actions"><button onclick="editMeasurement('${type}','${x.id}')">Edit</button><button class="stop" onclick="deleteMeasurement('${type}','${x.id}')">Delete</button></div></div></div>`).join(""):`<p class="empty">No ${type} entries.</p>`})}
function showMeasurementType(type,btn){$("weightForm").classList.toggle("hidden",type!=="weight");$("heightForm").classList.toggle("hidden",type!=="height");document.querySelectorAll("#measurementTabs button").forEach(x=>x.classList.toggle("active",x===btn))}
function saveCaution(){const text=$("cautionText").value.trim();if(!text)return alert("Add a caution.");const old=dog().cautions.find(x=>x.id===editing.caution);const item={id:editing.caution||uid(),type:$("cautionType").value,text,date:old?.date||todayISO()};if(old){dog().cautions=dog().cautions.map(x=>x.id===old.id?item:x);addHistory("caution",`Caution updated: ${text}`,item.type)}else{dog().cautions.unshift(item);addHistory("caution",`Caution added: ${text}`,item.type)}persist();cancelCautionEdit();renderAll()}
function editCaution(id){const x=dog().cautions.find(v=>v.id===id);if(!x)return;editing.caution=id;$("cautionType").value=x.type;$("cautionText").value=x.text;setEditButtons("caution",true);$("cautionText").focus()}
function cancelCautionEdit(){editing.caution=null;$("cautionType").value="Allergy";$("cautionText").value="";setEditButtons("caution",false)}
function deleteCaution(id){const x=dog().cautions.find(v=>v.id===id);if(!x)return;if(!confirm("Remove this caution? Its history will remain."))return;dog().cautions=dog().cautions.filter(v=>v.id!==id);addHistory("caution",`Sensitivity removed: ${x.text}`,x.type);persist();renderAll()}
function renderCautions(){const a=dog().cautions;$("cautionList").innerHTML=a.length?a.map(x=>`<div class="entry"><div class="entry-top"><div><span class="status">${esc(x.type)}</span><strong>${esc(x.text)}</strong></div><div class="entry-actions"><button onclick="editCaution('${x.id}')">Edit</button><button class="stop" onclick="deleteCaution('${x.id}')">Delete</button></div></div></div>`).join(""):'<p class="empty">No allergies or cautions.</p>'}
function saveCareNote(){const title=$("noteTitle").value.trim(),note=$("noteText").value.trim();if(!title&&!note)return alert("Add a title or note.");const old=dog().careNotes.find(x=>x.id===editing.note);const item={id:editing.note||uid(),date:$("noteDate").value||todayISO(),title:title||"Care note",note};if(old){dog().careNotes=dog().careNotes.map(x=>x.id===old.id?item:x);addHistory("note",`Care note updated: ${item.title}`,item.note,item.date,item.id)}else{dog().careNotes.unshift(item);addHistory("note",item.title,item.note,item.date,item.id)}persist();cancelCareNoteEdit();renderAll()}
function editCareNote(id){const x=dog().careNotes.find(v=>v.id===id);if(!x)return;editing.note=id;$("noteDate").value=x.date;$("noteTitle").value=x.title;$("noteText").value=x.note||"";setEditButtons("note",true);showScreen("log");$("noteTitle").focus()}
function cancelCareNoteEdit(){editing.note=null;$("noteDate").value=todayISO();$("noteTitle").value="";$("noteText").value="";setEditButtons("note",false)}
function archiveCareNote(id){const x=dog().careNotes.find(v=>v.id===id);if(!x)return;if(!confirm("Archive this care note? A removal record will remain in the timeline."))return;dog().careNotes=dog().careNotes.filter(v=>v.id!==id);addHistory("note",`Care note archived: ${x.title}`,x.note);persist();renderAll()}
function allEntries(){return dog().history.slice().sort((a,b)=>new Date(b.createdAt||b.date)-new Date(a.createdAt||a.date))}
function renderTimeline(){const entries=allEntries().filter(x=>logFilter==="all"||x.type===logFilter);$("timelineList").innerHTML=entries.length?entries.map(x=>`<div class="timeline-item"><div class="type">${esc(x.type)}</div><strong>${esc(x.title)}</strong><div class="date">${prettyDate(x.date)}</div>${x.detail?`<small>${esc(x.detail)}</small>`:""}${x.type==="note"&&x.sourceId&&dog().careNotes.some(n=>n.id===x.sourceId)?`<div class="timeline-actions"><button onclick="editCareNote('${x.sourceId}')">Edit current note</button> <button onclick="archiveCareNote('${x.sourceId}')">Archive</button></div>`:""}</div>`).join(""):'<p class="empty">No entries in this category.</p>'}
function setLogFilter(type,btn){logFilter=type;document.querySelectorAll("#logFilters button").forEach(x=>x.classList.toggle("active",x===btn));renderTimeline()}
function cancelAllEdits(){cancelTreatmentEdit();cancelFoodEdit();cancelMeasurementEdit("weight");cancelMeasurementEdit("height");cancelCautionEdit();cancelCareNoteEdit()}
function renderAll(){renderIdentity();loadProfile();renderTreatments();renderFoods();renderMeasurements();renderCautions();renderTimeline();renderHome();renderSitterSetup();renderSitterBanner();setTodayDefaults()}
function hasData(s=state){return Object.values(s.dogs||{}).some(d=>d.treatments?.length||d.feedingItems?.length||d.weights?.length||d.heights?.length||d.cautions?.length||d.careNotes?.length||d.history?.length||Object.values(d.sitter||{}).some(Boolean)||Object.values(d.profile||{}).some((v,i)=>i>0&&v))}
function downloadBackup(){persist();const payload={appId:APP_ID,app:"Van & Ginger Senior Care",schemaVersion:STORAGE_VERSION,exportedAt:new Date().toISOString(),data:normalizeState(state)};downloadBlob(new Blob([JSON.stringify(payload,null,2)],{type:"application/json;charset=utf-8"}),`van-ginger-care-backup-${todayISO()}.json`)}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
async function restoreBackup(event){const input=event.target,file=input.files?.[0];if(!file)return;try{const parsed=JSON.parse((await file.text()).replace(/^\uFEFF/,"").trim());if(parsed.appId!==APP_ID&&!parsed.data?.dogs&&!parsed.dogs)throw new Error("This JSON file is not a Van & Ginger Senior Care backup.");const candidate=normalizeState(parsed.data||parsed);if(hasData()&&!confirm("Replace all Van and Ginger information currently stored on this device with this backup?"))return;state=candidate;if(!persist())throw new Error("The restored data could not be saved.");logFilter="all";cancelAllEdits();renderAll();showScreen("home");alert("Van and Ginger’s backup has been restored.")}catch(e){console.error(e);alert(e.message||"That backup could not be restored.")}finally{input.value=""}}
function pdfSafe(v){return String(v??"").replace(/[‘’‚‛]/g,"'").replace(/[“”„‟]/g,'"').replace(/[–—−]/g,"-").replace(/…/g,"...").replace(/[•·]/g,"-").replace(/½/g,"1/2").replace(/¼/g,"1/4").replace(/¾/g,"3/4").replace(/⅓/g,"1/3").replace(/⅔/g,"2/3").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^\x20-\x7E\n\r\t]/g,"").replace(/[\t\r\n]+/g," ")}
function pdfEscape(v){return pdfSafe(v).replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)")}
function wrap(v,n=82){const words=pdfSafe(v).trim().split(/\s+/).filter(Boolean),lines=[];let line="";for(const w of words){if(!line)line=w;else if((line+" "+w).length<=n)line+=" "+w;else{lines.push(line);line=w}}if(line)lines.push(line);return lines.length?lines:[""]}
function createDogPdf(){const d=dog(),name=dogName(),W=612,H=792,M=46,L=15;let pages=[],cmd=[],y=H-M;const flush=()=>{if(cmd.length)pages.push(cmd.join("\n"));cmd=[];y=H-M};const ensure=n=>{if(y-n<M)flush()};const text=(v,size=10,bold=false)=>{cmd.push(`BT /${bold?"F2":"F1"} ${size} Tf 1 0 0 1 ${M} ${y} Tm (${pdfEscape(v)}) Tj ET`);y-=L};const para=(v,size=10,bold=false,n=82)=>wrap(v,n).forEach(line=>{ensure(L);text(line,size,bold)});const section=t=>{ensure(35);y-=5;text(t.toUpperCase(),9,true);y-=3};text(`${name} Care Report`,22,true);para([d.profile.age&&`Age ${d.profile.age}`,d.profile.breed,d.profile.veterinarian&&`Veterinarian: ${d.profile.veterinarian}`].filter(Boolean).join(" - ")||"Senior care record",9);y-=8;section("Profile");para(`Name: ${name}`);if(d.profile.sex)para(`Sex: ${d.profile.sex}`);if(d.profile.emergencyContact)para(`Emergency contact: ${d.profile.emergencyContact}`);if(d.profile.notes)para(`Notes: ${d.profile.notes}`);section("Active medications and treatments");if(!d.treatments.length)para("None listed.");d.treatments.forEach(x=>{ensure(60);para(`${x.type}: ${x.name}`,11,true,70);para(treatmentDetail(x)||"No additional details.",9, false,90);y-=5});section("Active foods");if(!d.feedingItems.length)para("None listed.");d.feedingItems.forEach(x=>{ensure(55);para(`${x.type}: ${x.name}`,11,true,70);para(foodDetail(x)||"No additional details.",9,false,90);y-=5});section("Measurements");[...d.weights].sort(sortByDate).forEach(x=>para(`Weight - ${prettyDate(x.date)}: ${x.value}${x.note?" - "+x.note:""}`,9,false,92));[...d.heights].sort(sortByDate).forEach(x=>para(`Height - ${prettyDate(x.date)}: ${x.value}${x.note?" - "+x.note:""}`,9,false,92));if(!d.weights.length&&!d.heights.length)para("None listed.");section("Cautions");if(!d.cautions.length)para("None listed.");d.cautions.forEach(x=>para(`${x.type}: ${x.text}`,9,false,92));section("Chronological history");const entries=allEntries();if(!entries.length)para("No history entries.");entries.forEach(x=>{ensure(58);para(x.title,10,true,74);para(`${prettyDate(x.date)} - ${x.type}`,8,false,95);if(x.detail)para(x.detail,9,false,90);y-=5});flush();const objs=[],pageIds=[],contentIds=[];for(let i=0;i<pages.length;i++){pageIds.push(5+i*2);contentIds.push(6+i*2)}objs[1]='<< /Type /Catalog /Pages 2 0 R >>';objs[2]=`<< /Type /Pages /Kids [${pageIds.map(x=>x+' 0 R').join(' ')}] /Count ${pages.length} >>`;objs[3]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';objs[4]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';pages.forEach((s,i)=>{objs[pageIds[i]]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentIds[i]} 0 R >>`;objs[contentIds[i]]=`<< /Length ${s.length} >>\nstream\n${s}\nendstream`});let pdf="%PDF-1.4\n",offset=[0];for(let i=1;i<objs.length;i++){offset[i]=pdf.length;pdf+=`${i} 0 obj\n${objs[i]}\nendobj\n`}const xref=pdf.length;pdf+=`xref\n0 ${objs.length}\n0000000000 65535 f \n`;for(let i=1;i<objs.length;i++)pdf+=String(offset[i]).padStart(10,"0")+" 00000 n \n";pdf+=`trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;return new Blob([pdf],{type:"application/pdf"})}
async function shareDogPdf(){const name=dogName(),blob=createDogPdf(),filename=`${name}-Care-Report-${todayISO()}.pdf`,file=new File([blob],filename,{type:"application/pdf",lastModified:Date.now()});if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){try{await navigator.share({title:`${name} Care Report`,files:[file]});return}catch(e){if(e?.name==="AbortError")return}}downloadBlob(blob,filename);alert("The PDF was downloaded because file sharing was unavailable.")}
function eraseAllData(){if(!confirm("Erase every Van and Ginger record from this device? This cannot be undone."))return;Store.clear();state=defaultState();cancelAllEdits();renderAll();showScreen("home")}

function preventBottomNavDoubleTapZoom(){
  const nav=document.querySelector(".bottom-nav");
  if(!nav)return;
  let lastTap=0;
  nav.addEventListener("touchend",event=>{
    if(!event.target.closest(".nav"))return;
    const now=Date.now();
    if(now-lastTap<500){
      event.preventDefault();
      event.stopPropagation();
    }
    lastTap=now;
  },{passive:false});
  nav.addEventListener("dblclick",event=>{
    if(event.target.closest(".nav"))event.preventDefault();
  });
}


let sitterEntryDismissedThisForeground=false;
function currentSitterSession(){if(!state.sitterSession||typeof state.sitterSession!=="object")state.sitterSession=blankSitterSession();return state.sitterSession}
function readSitterEditor(){return{pottyRoutine:$("sitterPotty")?.value.trim()||"",sleepRoutine:$("sitterSleep")?.value.trim()||"",emergencyVet:$("sitterEmergency")?.value.trim()||"",instructions:$("sitterInstructions")?.value.trim()||""}}
function renderSitterSetup(){
  const s=dog().sitter||blankSitter();
  const values={sitterPotty:s.pottyRoutine||"",sitterSleep:s.sleepRoutine||"",sitterEmergency:s.emergencyVet||"",sitterInstructions:s.instructions||""};
  for(const pair of Object.entries(values)){const id=pair[0],value=pair[1],el=$(id);if(el&&document.activeElement!==el)el.value=value}
  if($("sitterSetupTitle"))$("sitterSetupTitle").textContent=dogName()+"’s sitter instructions";
  if($("sitterDogChip"))$("sitterDogChip").textContent=dogName();
}
function saveSitterInstructions(options){
  options=options||{};
  dog().sitter=Object.assign(blankSitter(),readSitterEditor());
  const ok=persist();
  if(ok){
    renderSitterView();renderSitterBanner();
    if(!options.silent){const saved=$("sitterSaved");saved?.classList.remove("hidden");setTimeout(function(){saved?.classList.add("hidden")},2200)}
  }
  return ok;
}
function activateSitterMode(){
  if(!saveSitterInstructions({silent:true}))return;
  const session=currentSitterSession();
  state.sitterSession=Object.assign({},session,{active:true,activatedAt:new Date().toISOString(),sessionId:uid(),checklist:{}});
  sitterEntryDismissedThisForeground=true;
  if(!persist())return;
  renderSitterBanner();renderSitterView();openSitter();
}
function endSitterMode(){
  const session=currentSitterSession();
  if(!session.active)return;
  if(!confirm("End Sitter Mode? Saved Van and Ginger instructions will remain available."))return;
  state.sitterSession=Object.assign({},session,{active:false,checklist:{}});
  sitterEntryDismissedThisForeground=true;
  $("sitterEntryAlert")?.classList.remove("open");
  if(persist()){renderSitterBanner();renderSitterView()}
}
function sitterItem(parts){return parts.filter(Boolean).join(" · ")}
function sitterSectionsForDog(id){
  const d=state.dogs[id],name=d?.profile?.name||dogMeta[id].name;
  const contacts=[
    d.profile?.emergencyContact&&"Emergency contact: "+d.profile.emergencyContact,
    d.profile?.veterinarian&&"Veterinarian: "+d.profile.veterinarian
  ].filter(Boolean);
  const foods=(d.feedingItems||[]).map(function(x){return sitterItem([x.type,x.name,x.amount,x.schedule,x.whenUsed,x.note])});
  const meds=(d.treatments||[]).map(function(x){return sitterItem([x.type,x.name,x.dosage,x.frequency,x.timeOfDay,treatmentDueText(x),x.instructions,x.note])});
  const cautions=(d.cautions||[]).map(function(x){return sitterItem([x.type,x.text])});
  const notes=[...(d.careNotes||[])].sort(sortByDate).slice(0,5).map(function(x){return sitterItem([x.title,x.date&&prettyDate(x.date),x.note])});
  const custom=d.sitter||blankSitter();
  const profile=[d.profile?.age&&"Age "+d.profile.age,d.profile?.breed,d.profile?.sex].filter(Boolean).join(" · ");
  return {id:id,name:name,profile:profile,sections:[
    {title:"Emergency & contacts",items:[...contacts,custom.emergencyVet].filter(Boolean)},
    {title:"Food & feeding",items:foods},
    {title:"Medications & treatments",items:meds},
    {title:"Potty / outside routine",items:[custom.pottyRoutine].filter(Boolean)},
    {title:"Crate / sleep routine",items:[custom.sleepRoutine].filter(Boolean)},
    {title:"Allergies & cautions",items:cautions},
    {title:"Recent care notes",items:notes},
    {title:"Other sitter instructions",items:[custom.instructions].filter(Boolean)}
  ]};
}
function sitterChecklistKey(dogId,title,index,item){return dogId+"::"+title+"::"+index+"::"+item}
function renderSitterView(){
  const content=$("sitterViewContent");if(!content)return;
  const checklist=Boolean($("sitterChecklistToggle")?.checked),session=currentSitterSession();
  content.innerHTML=["van","ginger"].map(function(id){
    const info=sitterSectionsForDog(id);
    const sections=info.sections.map(function(section){
      const has=section.items.length>0,items=has?section.items:["Not added yet"];
      const rows=items.map(function(item,index){
        let control="";
        if(checklist&&has){
          const key=sitterChecklistKey(id,section.title,index,item);
          control='<input type="checkbox" data-sitter-key="'+esc(key)+'" aria-label="Mark complete"'+(session.checklist?.[key]?' checked':'')+'> ';
        }
        return "<li>"+control+esc(item)+"</li>";
      }).join("");
      return '<section class="sitter-view-section"><h4>'+esc(section.title)+'</h4><ul>'+rows+"</ul></section>";
    }).join("");
    const profile=info.profile?"<p>"+esc(info.profile)+"</p>":"";
    return '<article class="sitter-dog-card '+id+'"><div class="sitter-dog-head"><span class="avatar">'+esc(info.name.charAt(0).toUpperCase())+'</span><div><div class="eyebrow">caretaker reference</div><h3>'+esc(info.name)+"</h3>"+profile+"</div></div>"+sections+"</article>";
  }).join("");
}
function renderSitterBanner(){
  const session=currentSitterSession(),active=Boolean(session.active);
  $("sitterActiveBanner")?.classList.toggle("hidden",!active);
  $("activateSitterBtn")?.classList.toggle("hidden",active);
  $("endSitterBtn")?.classList.toggle("hidden",!active);
  $("sitterModalEndBtn")?.classList.toggle("hidden",!active);
  const when=session.activatedAt?new Date(session.activatedAt).toLocaleString():"";
  const status=$("sitterStatus");
  if(status)status.textContent=active?"Sitter Mode has been active since "+when+".":"Sitter Mode is off. Saved instructions remain available.";
  const meta=$("sitterActiveMeta");
  if(meta&&active)meta.textContent="Active since "+when+" · tap to view both dogs";
}
function openSitter(){renderSitterView();$("sitterModal")?.classList.add("open")}
function closeSitter(){$("sitterModal")?.classList.remove("open");document.activeElement?.blur?.()}
function showSitterEntryAlert(){
  if(sitterEntryDismissedThisForeground||!currentSitterSession().active)return;
  const splash=$("splashScreen");if(splash&&!splash.classList.contains("hide"))return;
  const modal=$("sitterEntryAlert");if(modal&&!modal.classList.contains("open"))modal.classList.add("open");
}
function continueToSitter(){sitterEntryDismissedThisForeground=true;$("sitterEntryAlert")?.classList.remove("open");openSitter()}
function dismissSitterEntryAlert(){sitterEntryDismissedThisForeground=true;$("sitterEntryAlert")?.classList.remove("open")}
function sitterPlainText(){
  const lines=["Van & Ginger Sitter",""];
  for(const id of ["van","ginger"]){
    const info=sitterSectionsForDog(id);lines.push(info.name+(info.profile?" — "+info.profile:""));
    for(const section of info.sections){lines.push("",section.title);if(section.items.length)section.items.forEach(function(item){lines.push("- "+item)});else lines.push("- Not added yet")}
    lines.push("");
  }
  return lines.join("\n");
}
async function shareSitter(){
  const text=sitterPlainText();
  if(navigator.share){try{await navigator.share({title:"Van & Ginger Sitter",text:text});return}catch(e){if(e?.name==="AbortError")return}}
  try{await navigator.clipboard.writeText(text);alert("Van and Ginger’s sitter information was copied.")}catch(e){alert("Sharing is not available on this device.")}
}
function printSitter(){
  const report=$("sitterPrintReport");if(!report)return;
  const sections=["van","ginger"].map(function(id){
    const info=sitterSectionsForDog(id),profile=info.profile?"<p>"+esc(info.profile)+"</p>":"";
    const body=info.sections.map(function(section){const items=section.items.length?section.items:["Not added yet"];return "<section><h3>"+esc(section.title)+"</h3><ul>"+items.map(function(item){return "<li>"+esc(item)+"</li>"}).join("")+"</ul></section>"}).join("");
    return "<article><h2>"+esc(info.name)+"</h2>"+profile+body+"</article>";
  }).join("");
  report.innerHTML="<h1>Van & Ginger Sitter</h1><p>Current caretaker reference</p>"+sections;
  window.print();
}
$("sitterViewContent")?.addEventListener("change",function(event){
  const box=event.target.closest?.("[data-sitter-key]");if(!box)return;
  const session=currentSitterSession(),key=box.dataset.sitterKey;
  session.checklist=session.checklist&&typeof session.checklist==="object"?session.checklist:{};
  if(box.checked)session.checklist[key]=true;else delete session.checklist[key];
  persist();
});
window.addEventListener("pagehide",function(){sitterEntryDismissedThisForeground=false});
document.addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden")sitterEntryDismissedThisForeground=false});

let appHiddenAt=0;
window.addEventListener("pagehide",persist);
document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState==="hidden"){appHiddenAt=Date.now();persist()}
  else if(document.visibilityState==="visible"&&Date.now()-appHiddenAt>1500){showSplash()}
});
window.addEventListener("pageshow",()=>showSplash());
window.addEventListener("storage",e=>{if(e.key===STORAGE_KEY){state=Store.load();renderAll()}});
renderAll();
preventBottomNavDoubleTapZoom();
showSplash();
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw-v19.js",{updateViaCache:"none"}).catch(console.warn));
