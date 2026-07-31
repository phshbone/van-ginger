const CACHE_NAME="van-ginger-senior-care-v12";
const APP_SHELL=[
  "./",
  "./index.html",
  "./styles-v12.css",
  "./app-v12.js",
  "./manifest.json",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/van-fur-v7.webp",
  "./assets/ginger-fur-v7.webp",
  "./assets/van-ginger-splash-v11.webp"
];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)));self.skipWaiting()});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))));self.clients.claim()});
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  const core=url.pathname.endsWith("/")||/\/(index\.html|app-v12\.js|styles-v12\.css|manifest\.json|sw-v12\.js)$/.test(url.pathname);
  if(core){
    event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match(event.request).then(hit=>hit||caches.match("./index.html"))));
  }else{
    event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(response=>{if(response&&response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy))}return response})));
  }
});
