import fs from "node:fs";
import vm from "node:vm";

const html=fs.readFileSync("index.html","utf8");
const app=fs.readFileSync("app-v18.js","utf8");
const css=fs.readFileSync("styles-v18.css","utf8");
const sw=fs.readFileSync("sw-v18.js","utf8");
const manifest=JSON.parse(fs.readFileSync("manifest.json","utf8"));

function assert(condition,message){if(!condition)throw new Error(message)}

assert(html.includes('styles-v18.css'),"index must load styles-v18.css");
assert(html.includes('app-v18.js'),"index must load app-v18.js");
assert(html.includes('viewport-fit=cover'),"viewport-fit=cover missing");
assert(html.includes('id="sitterPanel"'),"sitter setup panel missing");
assert(html.includes('id="sitterModal"'),"sitter modal missing");
assert(html.includes('id="treatmentFrequencyChoice"'),"guided frequency picker missing");
assert(html.includes('id="treatmentDaypartChoice"'),"AM/PM daypart picker missing");
assert(html.includes('id="treatmentExactTime"')&&html.includes('type="time"'),"exact time picker missing");
assert(!/camera|capture="environment"|label photo/i.test(html),"camera/photo controls should not be present");

assert(app.includes('const STORAGE_KEY="vanGingerSeniorCareV1"'),"existing storage key must be preserved");
assert(app.includes("const STORAGE_VERSION=2"),"storage schema must remain compatible");
assert(app.includes("function activateSitterMode"),"Sitter Mode missing");
assert(app.includes("function formatClock"),"medication time formatter missing");
assert(!/Frannie|training/i.test(html+app),"Frannie/training content leaked into Van & Ginger");

assert(css.includes("display:grid;grid-template-rows:minmax(0,1fr) auto"),"body two-row app/footer grid missing");
assert(css.includes(".app-shell{position:relative;inset:auto;min-height:0;height:auto;overflow-y:auto"),"app shell must be the scroll container");
assert(css.includes(".bottom-nav{position:relative;")&&css.includes("align-self:end"),"bottom nav must be structural, not fixed");
assert(css.includes("calc(7px + env(safe-area-inset-bottom))"),"safe-area inset must be internal footer padding");
assert(!css.includes("--ios-footer-fill"),"legacy v14 footer fill still present");
assert(!css.includes("height:140px"),"legacy v15 footer underfill still present");
assert(!css.includes("--ios-physical-bottom"),"legacy v17 physical-bottom offset still present");
assert(!css.includes("bottom:calc(-1 *"),"negative footer offset still present");
assert(css.includes("font-size:.74rem")&&css.includes("font-size:1.18rem"),"compact readable nav typography missing");

assert(manifest.background_color==="#403b38","PWA fallback background should remain dark");
assert(sw.includes("van-ginger-senior-care-v18"),"service worker cache name is not v18");
for(const ref of ["./styles-v18.css","./app-v18.js","./manifest.json","./assets/icon-192.png","./assets/icon-512.png"]){
  assert(sw.includes(ref),"service worker shell missing "+ref);
}

const prefix=app.split("const Store=")[0];
const sandbox={console,Date,Intl,crypto:globalThis.crypto};
vm.createContext(sandbox);
vm.runInContext(prefix+"\nthis.__migration={normalizeState,defaultState};",sandbox);
const old={
  version:1,
  appId:"van-ginger-senior-care",
  activeDogId:"ginger",
  dogs:{
    van:{profile:{name:"Van",age:"15",breed:"Test"},treatments:[{id:"m1",type:"Medication",name:"Van Med"}],feedingItems:[],weights:[],heights:[],cautions:[],careNotes:[],history:[]},
    ginger:{profile:{name:"Ginger",age:"14",breed:"Test"},treatments:[],feedingItems:[{id:"f1",type:"Main meal",name:"Ginger Food"}],weights:[],heights:[],cautions:[],careNotes:[],history:[]}
  }
};
const migrated=sandbox.__migration.normalizeState(old);
assert(migrated.version===2,"migration must preserve schema v2");
assert(migrated.activeDogId==="ginger","migration must preserve active dog");
assert(migrated.dogs.van.treatments[0].name==="Van Med","migration lost Van medication");
assert(migrated.dogs.ginger.feedingItems[0].name==="Ginger Food","migration lost Ginger food");
assert(migrated.dogs.van.sitter&&migrated.dogs.ginger.sitter,"migration must add sitter drafts");
assert(migrated.sitterSession&&migrated.sitterSession.active===false,"migration must add inactive sitter session");

console.log("STATIC SMOKE PASS: v18 structural footer, legacy footer hacks removed, care data compatibility preserved.");
