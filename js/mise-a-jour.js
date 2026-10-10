// La mise à jour automatique : quand une nouvelle version du jeu est en ligne, il se recharge tout seul,
// mais seulement au menu (jamais en pleine course ni au milieu d'un Grand Prix).
"use strict";

// Les fichiers du jeu : ceux de la page, plus le service worker et le manifeste
function fichiersDuJeu() {
  const fichiers = ["./", "sw.js", "manifest.webmanifest"];
  for (const script of document.scripts) {
    if (script.src) fichiers.push(script.src);
  }
  return fichiers;
}

// L'empreinte de la version en ligne : l'étiquette (ETag) que le serveur donne à chaque fichier,
// et qui change dès que le fichier change
function empreinteEnLigne() {
  return Promise.all(fichiersDuJeu().map(function (fichier) {
    return fetch(fichier, { method: "HEAD", cache: "no-store" }).then(function (reponse) {
      return reponse.headers.get("ETag") || reponse.headers.get("Last-Modified") || "";
    });
  })).then(function (etiquettes) {
    return etiquettes.join("|");
  });
}

let empreinteDuJeu = null;           // la version qui tourne en ce moment
let nouvelleVersion = false;

function verifierLaVersion() {
  empreinteEnLigne().then(function (empreinte) {
    if (empreinte === "") return;    // le serveur ne donne pas d'étiquettes : on ne peut pas comparer
    if (empreinteDuJeu === null) empreinteDuJeu = empreinte;
    else if (empreinte !== empreinteDuJeu) nouvelleVersion = true;
  }).catch(function () {
    // pas de réseau : on réessaiera plus tard
  });
}

// Appelée à chaque image : on recharge dès qu'on est sur un écran où rien ne se perd
function rechargerSiNouvelleVersion() {
  if (!nouvelleVersion || (etat !== "menu" && etat !== "choix-circuit")) return;
  // Jamais deux rechargements en moins d'une minute, au cas où le serveur hésiterait entre deux versions
  let dernier = 0;
  try { dernier = Number(sessionStorage.getItem("licornes-recharge")) || 0; } catch (e) { /* tant pis */ }
  if (Date.now() - dernier < 60000) return;
  try { sessionStorage.setItem("licornes-recharge", String(Date.now())); } catch (e) { /* tant pis */ }
  nouvelleVersion = false;
  annoncer("Nouvelle version !", "#ff5e9e");
  setTimeout(function () { location.reload(); }, 900);
}

// Seulement sur le vrai site (pas en ouvrant le fichier depuis l'ordinateur)
if (location.protocol.startsWith("http")) {
  verifierLaVersion();
  setInterval(verifierLaVersion, 2 * 60 * 1000);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) verifierLaVersion();
  });
}
