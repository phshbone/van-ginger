const CACHE_NAME="van-ginger-v7-isolated";
const APP_SHELL=["./","./index.html","./styles-v7.css","./app-v7.js","./manifest.json","./assets/icon-192.png","./assets/icon-512.png","./assets/van-fur-v7.webp","./assets/ginger-fur-v7.webp","./assets/van-ginger-splash-v7.webp"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_SHELL)));self.skipWaiting()});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k===CACHE_NAME?Promise.resolve():caches.delete(k)))));self.clients.claim()});
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(event.request.mode==="navigate"){
    event.respondWith(fetch(event.request,{cache:"no-store"}).then(r=>{const copy=r.clone();caches.open(CACHE_NAME).then(c=>c.put("./index.html",copy));return r}).catch(()=>caches.match("./index.html")));
    return;
  }
  const isVersioned=/styles-v7\.css$|app-v7\.js$|sw-v7\.js$/.test(url.pathname);
  if(isVersioned){event.respondWith(fetch(event.request,{cache:"no-store"}).then(r=>{const copy=r.clone();caches.open(CACHE_NAME).then(c=>c.put(event.request,copy));return r}).catch(()=>caches.match(event.request)));return;}
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(r=>{if(r&&r.ok){const copy=r.clone();caches.open(CACHE_NAME).then(c=>c.put(event.request,copy))}return r})));
});