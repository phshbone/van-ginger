import fs from "node:fs";
import vm from "node:vm";

const html=fs.readFileSync("index.html","utf8");
const app=fs.readFileSync("app-v13.js","utf8");
const css=fs.readFileSync("styles-v13.css","utf8");
const sw=fs.readFileSync("sw-v13.js","utf8");

function assert(condition,message){if(!condition)throw new Error(message)}

assert(html.includes('styles-v13.css'),"index must load styles-v13.css");
assert(html.includes('app-v13.js'),"index must load app-v13.js");
assert(html.includes('id="sitterPanel"'),"sitter setup panel missing");
assert(html.includes('id="sitterModal"'),"sitter modal missing");
assert(html.includes('id="sitterEntryAlert"'),"sitter reopen alert missing");
assert(app.includes('const STORAGE_KEY="vanGingerSeniorCareV1"'),"v12 storage key must be preserved");
assert(app.includes("const STORAGE_VERSION=2"),"storage schema must advance to v2");
assert(app.includes("function activateSitterMode"),"activate sitter function missing");
assert(app.includes("function endSitterMode"),"end sitter function missing");
assert(app.includes("function sitterSectionsForDog"),"two-dog sitter section builder missing");
assert(!/Frannie|training/i.test(html+app),"Frannie/training content leaked into Van & Ginger v13");
assert(css.includes(".sitter-modal"),"sitter modal styles missing");
assert(sw.includes("van-ginger-senior-care-v13"),"service worker cache name is not v13");
for(const ref of ["./styles-v13.css","./app-v13.js","./manifest.json","./assets/icon-192.png","./assets/icon-512.png"]){
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
assert(migrated.version===2,"migration must set schema v2");
assert(migrated.activeDogId==="ginger","migration must preserve active dog");
assert(migrated.dogs.van.treatments[0].name==="Van Med","migration lost Van medication");
assert(migrated.dogs.ginger.feedingItems[0].name==="Ginger Food","migration lost Ginger food");
assert(migrated.dogs.van.sitter&&migrated.dogs.ginger.sitter,"migration must add sitter drafts");
assert(migrated.sitterSession&&migrated.sitterSession.active===false,"migration must add inactive sitter session");

console.log("STATIC SMOKE PASS: v13 references, sitter structure, cache shell, and v12→v13 migration verified.");
