const C="juguetes-v1";
self.addEventListener("install",e=>self.skipWaiting());
self.addEventListener("fetch",e=>{ if(e.request.method!=="GET") return;
  e.respondWith(caches.open(C).then(c=>c.match(e.request).then(r=>r||fetch(e.request).then(n=>{ if(n.ok&&!e.request.headers.get("range")) c.put(e.request,n.clone()); return n }))).catch(()=>fetch(e.request))) });
