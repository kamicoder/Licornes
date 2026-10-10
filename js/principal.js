// La boucle du jeu, le clavier et la souris.
"use strict";

function mettreAJour(duree) {
  horloge = horloge + duree;
  tempsEcran = tempsEcran + duree;
  animerParticules(duree);
  for (const m of messages) m.vie = m.vie - duree;
  messages = messages.filter(function (m) { return m.vie > 0; });

  if (etat === "depart" || etat === "course") {
    mettreAJourCourse(duree);
  } else if (etat === "resultats") {
    if (confettis.length > 0 && Math.random() < duree * 10) confetti(Math.random() * L, -10);
  } else if (etat === "gp-podium") {
    if (Math.random() < duree * 18) confetti(Math.random() * L, -10);
  } else if (etat === "menu") {
    if (Math.random() < duree * 5) confetti(Math.random() * L, -10);
  }
}

function dessiner() {
  pinceau.setTransform(FINESSE, 0, 0, FINESSE, 0, 0);
  pinceau.globalAlpha = 1;
  zones = [];
  if (etat === "menu") dessinerMenu();
  else if (etat === "choix-circuit") dessinerChoixCircuit();
  else if (etat === "atelier") dessinerAtelier();
  else if (etat === "editeur") dessinerEditeur();
  else if (etat === "gp-classement") dessinerClassementGP();
  else if (etat === "gp-podium") dessinerPodium();
  else dessinerCourse();
}

let tempsPrecedent = null;
function boucle(temps) {
  let duree = tempsPrecedent === null ? 0 : (temps - tempsPrecedent) / 1000;
  tempsPrecedent = temps;
  duree = Math.min(duree, 0.05);           // après une pause, rien ne fait de bond
  if (!pause) mettreAJour(duree);
  dessiner();
  requestAnimationFrame(boucle);
}

function changerDEtat(nouveau) {
  etat = nouveau;
  tempsEcran = 0;
}

function clavierCourse(e, lettre) {
  if (e.code === "Escape") {
    revenirAuMenu();
    return;
  }
  if (lettre === "p") {
    pause = !pause;
    return;
  }
  if (etat === "course" && !pause) {
    for (const l of humains) {
      if (l.touchesTurbo.includes(e.code)) l.lancerTurbo();
    }
  }
}

function clavierResultats(e, lettre) {
  if (tempsEcran < 1) return;
  const entree = e.code === "Enter" || e.code === "NumpadEnter";
  if (grandPrix !== null) {
    if (entree) changerDEtat("gp-classement");
    else if (e.code === "Escape") revenirAuMenu();
    return;
  }
  if (lettre === "r") lancerCourse(course);
  else if (entree || e.code === "Escape") revenirAuMenu();
}

function clavierGrandPrix(e) {
  if (tempsEcran < 0.6) return;
  const entree = e.code === "Enter" || e.code === "NumpadEnter";
  if (etat === "gp-classement") {
    if (e.code === "Escape") {
      revenirAuMenu();
    } else if (entree) {
      if (grandPrix.etape + 1 < GRAND_PRIX.length) {
        grandPrix.etape = grandPrix.etape + 1;
        lancerEtapeDuGrandPrix();
      } else {
        changerDEtat("gp-podium");
        confettis = [];
        pluieDeConfettis(120);
        sonVictoire();
      }
    }
  } else if (entree || e.code === "Escape") {
    revenirAuMenu();
  }
}

function traiterTouche(e) {
  sonne();                                 // le navigateur n'autorise le son qu'après un premier appui
  const lettre = e.key.toLowerCase();

  if (etat === "atelier") {                // on y tape le nom : pas de raccourcis ici
    clavierAtelier(e);
    return;
  }
  if (e.repeat) return;
  if (lettre === "m") {
    const texte = changerReglageSon();
    annoncer(texte, "#8a6aae");
    return;
  }
  const avant = etat;
  if (etat === "menu") clavierMenu(e);
  else if (etat === "choix-circuit") clavierChoixCircuit(e, lettre);
  else if (etat === "editeur") clavierEditeur(e);
  else if (etat === "depart" || etat === "course") clavierCourse(e, lettre);
  else if (etat === "resultats") clavierResultats(e, lettre);
  else if (etat === "gp-classement" || etat === "gp-podium") clavierGrandPrix(e);
  if (etat !== avant) tempsEcran = 0;
}

document.addEventListener("keydown", function (e) {
  touches[e.code] = true;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "Backspace"].includes(e.code)) e.preventDefault();
  traiterTouche(e);
});

document.addEventListener("keyup", function (e) {
  touches[e.code] = false;
});

// Si la fenêtre perd la main, on lâche toutes les touches (et on met en pause pendant la course)
function mettreDeCote() {
  for (const code in touches) touches[code] = false;
  lacherTousLesDoigts();
  if (etat === "course") pause = true;
}
window.addEventListener("blur", mettreDeCote);
document.addEventListener("visibilitychange", function () {
  if (document.hidden) mettreDeCote();
});

// La souris et les doigts : les commandes de course, puis les zones à toucher, puis l'éditeur
function positionSouris(e) {
  const r = toile.getBoundingClientRect();
  return { x: (e.clientX - r.left) * L / r.width, y: (e.clientY - r.top) * H / r.height };
}
toile.addEventListener("pointerdown", function (e) {
  if (e.pointerType === "touch") modeTactile = true;
  e.preventDefault();
  sonne();
  const p = positionSouris(e);
  if (commandesTactilesActives() && doigtSur(e.pointerId, p.x, p.y, true)) return;
  if (toucherUneZone(p.x, p.y)) return;
  if (etat === "editeur") sourisEditeur("bas", p.x, p.y, e.button);
});
window.addEventListener("pointermove", function (e) {
  const p = positionSouris(e);
  if (e.pointerId in doigts) doigtSur(e.pointerId, p.x, p.y, false);
  if (etat === "editeur") sourisEditeur("bouge", p.x, p.y, 0);
});
function leverLePointeur(e) {
  doigtLeve(e.pointerId);
  if (etat === "editeur") sourisEditeur("haut", 0, 0, 0);
}
window.addEventListener("pointerup", leverLePointeur);
window.addEventListener("pointercancel", leverLePointeur);
toile.addEventListener("contextmenu", function (e) {
  e.preventDefault();
});

// Le jeu peut s'installer sur l'écran d'accueil et marcher sans réseau
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js").catch(function () {});
}

musique("menu");
requestAnimationFrame(boucle);
