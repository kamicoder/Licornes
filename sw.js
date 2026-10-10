// Le service worker : il garde une copie du jeu pour y jouer sans réseau.
// Il redemande toujours chaque fichier au serveur d'abord (en revalidant, sans se fier au cache du
// navigateur) : une nouvelle version arrive dès qu'il y a du réseau.
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
  // Une page qu'on ouvre ne peut pas être recopiée telle quelle avec d'autres réglages : on repart de son adresse
  const requete = e.request.mode === "navigate"
    ? new Request(e.request.url, { cache: "no-cache", credentials: "same-origin" })
    : new Request(e.request, { cache: "no-cache" });
  e.respondWith(
    fetch(requete).then(function (reponse) {
      if (reponse.ok) {
        const copie = reponse.clone();
        caches.open(CACHE).then(function (cache) { cache.put(e.request, copie); });
      }
      return reponse;
    }).catch(function () {
      return caches.match(e.request, { ignoreSearch: true });
    })
  );
});
