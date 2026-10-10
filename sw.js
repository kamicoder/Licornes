// Le service worker : il garde une copie du jeu pour y jouer sans réseau.
// Il demande toujours la dernière version d'abord : une mise à jour arrive dès qu'il y a du réseau.
"use strict";

const CACHE = "licornes";

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).then(function (reponse) {
      if (reponse.ok) {
        const copie = reponse.clone();
        caches.open(CACHE).then(function (cache) { cache.put(e.request, copie); });
      }
      return reponse;
    }).catch(function () {
      return caches.match(e.request);
    })
  );
});
