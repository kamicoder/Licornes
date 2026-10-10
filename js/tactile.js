// Jouer au doigt (ou à la souris) : les zones à toucher, les boutons, et les commandes de course à l'écran.
"use strict";

// Vrai sur un téléphone ou une tablette ; devient vrai aussi dès qu'un doigt touche l'écran
let modeTactile = window.matchMedia !== undefined && window.matchMedia("(pointer: coarse)").matches;

// Les zones qu'on peut toucher dans l'image en cours : chaque écran les redéclare en se dessinant
let zones = [];

function zone(x, y, w, h, action) {
  zones.push({ x: x, y: y, w: w, h: h, action: action });
}

// Le texte d'une touche du clavier, qu'on n'affiche pas sur un écran tactile
function touche(texte) {
  return modeTactile ? "" : texte;
}

function bouton(x, y, w, h, texte, action, discret) {
  pinceau.fillStyle = discret ? "rgba(255, 255, 255, 0.6)" : "white";
  cadre(x, y, w, h, h / 2);
  pinceau.fill();
  if (!discret) {
    pinceau.strokeStyle = degradeArcEnCiel(x, x + w);
    pinceau.lineWidth = 3;
    cadre(x, y, w, h, h / 2);
    pinceau.stroke();
  }
  ecrire(texte, x + w / 2, y + h / 2 + 1, Math.min(21, h * 0.46), discret ? "#8a6aae" : "#ff5e9e");
  zone(x, y, w, h, action);
}

// Toucher une zone fait comme appuyer sur une touche : les mêmes règles s'appliquent
function toucheVirtuelle(code, lettre) {
  return function () {
    traiterTouche({ code: code, key: lettre || "", repeat: false, ctrlKey: false, metaKey: false, preventDefault: function () {} });
  };
}

function toucherUneZone(x, y) {
  for (let i = zones.length - 1; i >= 0; i = i - 1) {
    const z = zones[i];
    if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) {
      z.action();
      return true;
    }
  }
  return false;
}

// ===== Les commandes de course à l'écran (en solo) =====

const COMMANDES_TACTILES = [
  { code: "ArrowLeft", x: 92, y: 508, r: 64, icone: "◀" },
  { code: "ArrowRight", x: 238, y: 508, r: 64, icone: "▶" },
  { code: "ArrowDown", x: 738, y: 535, r: 46, icone: "▼" },
  { code: "turbo", x: 870, y: 492, r: 68, icone: "★" },
];
const touchesTactiles = {};    // comme touches, mais pour les doigts
const doigts = {};             // pour chaque doigt posé : la commande qu'il tient

function commandesTactilesActives() {
  return modeTactile && humains.length === 1 && (etat === "course" || etat === "depart") && !pause;
}

function commandeSous(x, y) {
  let meilleure = null;
  let dmin = Infinity;
  for (const c of COMMANDES_TACTILES) {
    const d = Math.hypot(x - c.x, y - c.y);
    if (d < c.r * 1.4 && d < dmin) {
      dmin = d;
      meilleure = c;
    }
  }
  return meilleure;
}

function recompterLesDoigts() {
  for (const c of COMMANDES_TACTILES) {
    touchesTactiles[c.code] = Object.values(doigts).includes(c.code);
  }
}

// Un doigt se pose ou glisse : il tient la commande qui est sous lui
function doigtSur(id, x, y, nouveau) {
  const c = commandeSous(x, y);
  if (!nouveau && !(id in doigts)) return false;
  const code = c ? c.code : null;
  if (!nouveau && doigts[id] === code) return true;
  if (code === null && nouveau) return false;
  doigts[id] = code;
  if (code === "turbo" && etat === "course") humains[0].lancerTurbo();
  recompterLesDoigts();
  return true;
}

function doigtLeve(id) {
  delete doigts[id];
  recompterLesDoigts();
}

function lacherTousLesDoigts() {
  for (const id in doigts) delete doigts[id];
  recompterLesDoigts();
}

function dessinerCommandesTactiles() {
  if (!modeTactile) return;
  if (humains.length === 1 && (etat === "course" || etat === "depart")) {
    for (const c of COMMANDES_TACTILES) {
      const tenue = touchesTactiles[c.code] === true;
      pinceau.fillStyle = tenue ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.38)";
      pinceau.strokeStyle = "rgba(255, 255, 255, 0.9)";
      pinceau.lineWidth = 3;
      ovale(pinceau, c.x, c.y, c.r, c.r);
      pinceau.fill();
      pinceau.stroke();
      if (c.code === "turbo") {
        const etoiles = humains[0].etoiles;
        pinceau.globalAlpha = etoiles > 0 ? 1 : 0.4;
        pinceau.fillStyle = "#ffe066";
        pinceau.strokeStyle = "#e0b000";
        formeEtoile(pinceau, c.x, c.y, c.r * 0.55, 0, 5, 0.48);
        pinceau.fill();
        pinceau.stroke();
        pinceau.globalAlpha = 1;
        ecrire(String(etoiles), c.x + c.r * 0.62, c.y - c.r * 0.62, 22, "#e08a00", true);
      } else {
        ecrire(c.icone, c.x, c.y + 2, c.r * 0.75, "rgba(138, 92, 214, 0.85)");
      }
    }
  }
  // Le bouton pause, en haut au milieu
  if (etat === "course" && !pause) {
    const x = L / 2;
    pinceau.fillStyle = "rgba(255, 255, 255, 0.7)";
    ovale(pinceau, x, 32, 24, 24);
    pinceau.fill();
    pinceau.fillStyle = "#8a5cd6";
    pinceau.fillRect(x - 8, 22, 5, 20);
    pinceau.fillRect(x + 3, 22, 5, 20);
    zone(x - 30, 2, 60, 60, toucheVirtuelle("KeyP", "p"));
  }
}

// ===== Le plein écran et l'installation sur l'écran d'accueil =====
// Le navigateur affiche un message à chaque passage en plein écran : on ne le demande que sur un bouton.
// Le jeu installé, lui, s'ouvre directement en plein écran, sans message.

const SUR_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
let invitationInstallation = null;     // Chrome sur Android propose d'installer : on garde sa proposition pour un bouton

window.addEventListener("beforeinstallprompt", function (e) {
  e.preventDefault();
  invitationInstallation = e;
});
window.addEventListener("appinstalled", function () {
  invitationInstallation = null;
});

function estInstalle() {
  return window.matchMedia("(display-mode: fullscreen)").matches
    || window.matchMedia("(display-mode: standalone)").matches
    || navigator.standalone === true;
}

function peutPasserEnPleinEcran() {
  return !SUR_IOS && !estInstalle() && !document.fullscreenElement && document.documentElement.requestFullscreen !== undefined;
}

function pleinEcran() {
  document.documentElement.requestFullscreen({ navigationUI: "hide" }).then(function () {
    if (screen.orientation && screen.orientation.lock) screen.orientation.lock("landscape").catch(function () {});
  }).catch(function () {});
}

function installer() {
  const invitation = invitationInstallation;
  invitationInstallation = null;
  invitation.prompt();
}

// En bas du menu, sur téléphone : installer le jeu, ou passer en plein écran
function dessinerBoutonsMobile() {
  if (!modeTactile || estInstalle()) return;
  const boutons = [];
  if (invitationInstallation !== null) boutons.push({ texte: "📲 Installer le jeu", action: installer });
  if (peutPasserEnPleinEcran()) boutons.push({ texte: "⛶ Plein écran", action: pleinEcran });
  if (boutons.length === 0) {
    if (SUR_IOS) ecrire("Pour le plein écran : Partager, puis « Sur l'écran d'accueil »", L / 2, 560, 16, "#a58cc4");
    return;
  }
  const largeur = 230;
  let x = L / 2 - (boutons.length * largeur + (boutons.length - 1) * 16) / 2;
  for (const b of boutons) {
    bouton(x, 540, largeur, 42, b.texte, b.action, true);
    x = x + largeur + 16;
  }
}
