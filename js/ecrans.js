// Les écrans hors course : le menu, le choix du circuit, l'atelier, l'éditeur, le Grand Prix.
"use strict";

const MODES = [
  { id: "gp", nom: "Grand Prix", detail: "5 courses contre 3 licornes, de plus en plus corsées" },
  { id: "duo", nom: "Course à deux", detail: "L'écran est partagé : chacune sa moitié" },
  { id: "chrono", nom: "Contre la montre", detail: "Bats ton record et ton fantôme" },
  { id: "atelier", nom: "Atelier des licornes", detail: "Son nom, ses couleurs, ses accessoires" },
  { id: "editeur", nom: "Dessiner un circuit", detail: "Place les points à la souris" },
];
let modeChoisi = 0;

// Au doigt, on joue seule : pas de course à deux
function modesVisibles() {
  return modeTactile ? MODES.filter(function (m) { return m.id !== "duo"; }) : MODES;
}

function dessinerFondMenu() {
  const fond = pinceau.createLinearGradient(0, 0, 0, H);
  fond.addColorStop(0, "#c9e8ff");
  fond.addColorStop(0.55, "#efdcff");
  fond.addColorStop(1, "#ffd6ec");
  pinceau.fillStyle = fond;
  pinceau.fillRect(0, 0, L, H);

  pinceau.lineWidth = 16;
  pinceau.globalAlpha = 0.4;
  for (let i = 0; i < ARC_EN_CIEL.length; i = i + 1) {
    pinceau.strokeStyle = ARC_EN_CIEL[i];
    pinceau.beginPath();
    pinceau.arc(L / 2, 470, 430 - i * 16, Math.PI, 0);
    pinceau.stroke();
  }
  pinceau.globalAlpha = 1;

  for (let i = 0; i < 6; i = i + 1) {
    const x = ((horloge * (12 + i * 5) + i * 230) % (L + 300)) - 150;
    const y = 80 + (i * 97) % 420;
    pinceau.fillStyle = "rgba(255, 255, 255, 0.75)";
    for (const b of [[-40, 6, 26], [0, 0, 36], [42, 8, 24], [18, -14, 26]]) {
      ovale(pinceau, x + b[0], y + b[1], b[2], b[2]);
      pinceau.fill();
    }
  }
  dessinerParticules(confettis);
}

function petitSon() {
  ecrire(["🔊", "🎵✕", "🔇"][reglageSon] + touche(" M"), L - 16, H - 18, modeTactile ? 22 : 15, "#8a6aae", false, "right");
  zone(L - 90, H - 44, 90, 44, toucheVirtuelle("KeyM", "m"));
}

// ===== Le menu =====

function dessinerMenu() {
  dessinerFondMenu();
  ecrire("La Course des Licornes", L / 2, 52, 52, degradeArcEnCiel(L / 2 - 300, L / 2 + 300), true);
  const modes = modesVisibles();
  modeChoisi = Math.min(modeChoisi, modes.length - 1);

  // Au doigt : une seule carte, et la liste des modes à côté
  const cartes = modeTactile
    ? [{ x: 250, titre: "Ta licorne", touches: "", numero: choix[0] }]
    : [
      { x: 150, titre: "Joueur 1", touches: "←  →", numero: choix[0] },
      { x: 810, titre: "Joueur 2", touches: "Q  D", numero: choix[1] },
    ];
  const listeX = modeTactile ? 610 : L / 2;
  const ecart = modeTactile ? 72 : 58;

  cartes.forEach(function (carte, joueur) {
    const look = lookDe(carte.numero);
    pinceau.fillStyle = "rgba(255, 255, 255, 0.55)";
    cadre(carte.x - 115, 98, 230, 318, 24);
    pinceau.fill();
    ecrire(carte.titre, carte.x, 122, 19, "#8a6aae");
    const sautille = Math.abs(Math.sin(horloge * 6)) * 6;
    dessinerLicorne(carte.x, 252 - sautille, -Math.PI / 2, look, horloge * 14, 1.9);
    ecrire(look.nom, carte.x, 362, 24, look.criniere[0] === "#ffffff" ? look.ombre : look.criniere[0], true);
    ecrire(modeTactile ? "◀                    ▶" : "◀  " + carte.touches + "  ▶", carte.x, 394, modeTactile ? 22 : 15, "#8a6aae");
    // Toucher la moitié gauche ou droite de la carte change de licorne
    zone(carte.x - 115, 98, 115, 318, function () { changerLicorne(joueur, -1); });
    zone(carte.x, 98, 115, 318, function () { changerLicorne(joueur, 1); });
  });

  modes.forEach(function (m, i) {
    const y = 104 + i * ecart;
    const choisi = i === modeChoisi;
    pinceau.fillStyle = choisi ? "white" : "rgba(255, 255, 255, 0.45)";
    cadre(listeX - 160, y, 320, 48, 24);
    pinceau.fill();
    if (choisi) {
      pinceau.strokeStyle = degradeArcEnCiel(listeX - 160, listeX + 160);
      pinceau.lineWidth = 4;
      cadre(listeX - 160, y, 320, 48, 24);
      pinceau.stroke();
    }
    ecrire(m.nom, listeX, y + 25, choisi ? 24 : 21, choisi ? "#ff5e9e" : "#7a5a9c");
    zone(listeX - 160, y, 320, 48, function () { modeChoisi = i; validerMenu(); });
  });
  let detail = modes[modeChoisi].detail;
  if (modeTactile && modes[modeChoisi].id === "editeur") detail = "Place les points du bout du doigt";
  ecrire(detail, listeX, 412, 17, "#6a4a8c");

  const clignote = 0.7 + Math.sin(horloge * 4) * 0.3;
  pinceau.globalAlpha = clignote;
  ecrire(modeTactile ? "Touche un mode pour jouer !" : "Entrée : c'est parti !", L / 2, 470, 28, "#ff5e9e", true);
  pinceau.globalAlpha = 1;
  ecrire(touche("↑ ↓ : choisir    ·    ") + "Ramasse les étoiles ★ pour le turbo arc-en-ciel", L / 2, 512, 16, "#8a6aae");
  if (modeTactile) {
    dessinerBoutonsMobile();
  } else {
    ecrire("Flèches arc-en-ciel : petit turbo   ·   Bonbon : géante !   ·   Nuage d'orage : la tête qui tourne", L / 2, 548, 14, "#a58cc4");
  }
  petitSon();
  dessinerMessages();
}

function validerMenu() {
  sonMenu();
  const id = modesVisibles()[modeChoisi].id;
  if (id === "gp") commencerGrandPrix();
  else if (id === "duo") ouvrirChoixCircuit("duo");
  else if (id === "chrono") ouvrirChoixCircuit("chrono");
  else if (id === "atelier") ouvrirAtelier();
  else ouvrirEditeur();
}

function changerLicorne(joueur, sens) {
  const autre = choix[1 - joueur];
  do {
    choix[joueur] = (choix[joueur] + sens + LICORNES.length) % LICORNES.length;
  } while (choix[joueur] === autre && !modeTactile);
  // Au doigt, on joue seule : toutes les licornes sont permises, et la joueuse 2 prend la suivante
  if (choix[0] === choix[1]) choix[1] = (choix[0] + 1) % LICORNES.length;
  garder("licornes-j1", choix[0]);
  garder("licornes-j2", choix[1]);
  sonMenu();
}

function clavierMenu(e) {
  if (e.code === "ArrowUp" || e.code === "KeyW") {
    modeChoisi = (modeChoisi + modesVisibles().length - 1) % modesVisibles().length;
    sonMenu();
  } else if (e.code === "ArrowDown" || e.code === "KeyS") {
    modeChoisi = (modeChoisi + 1) % modesVisibles().length;
    sonMenu();
  } else if (e.code === "ArrowLeft") changerLicorne(0, -1);
  else if (e.code === "ArrowRight") changerLicorne(0, 1);
  else if (e.code === "KeyA") changerLicorne(1, -1);
  else if (e.code === "KeyD") changerLicorne(1, 1);
  else if (e.code === "Enter" || e.code === "NumpadEnter" || e.code === "Space") validerMenu();
}

// ===== Le choix du circuit (course à deux et contre la montre) =====

const choixCircuit = { mode: "chrono", index: 0, rivales: Number(lire("licornes-rivales")) || 0 };

function ouvrirChoixCircuit(mode) {
  choixCircuit.mode = mode;
  const liste = listeCircuits();
  const id = lire("licornes-circuit-id");
  choixCircuit.index = Math.max(0, liste.findIndex(function (c) { return c.id === id; }));
  etat = "choix-circuit";
}

function dessinerApercu(def, x, y, w, h) {
  const echelle = Math.min(w / def.largeur, h / def.hauteur);
  const lw = def.largeur * echelle;
  const lh = def.hauteur * echelle;
  const ox = x + (w - lw) / 2;
  const oy = y + (h - lh) / 2;
  const ciel = pinceau.createLinearGradient(0, oy, 0, oy + lh);
  ciel.addColorStop(0, "#d4ecff");
  ciel.addColorStop(1, "#ffe0f1");
  pinceau.fillStyle = ciel;
  cadre(ox, oy, lw, lh, 16);
  pinceau.fill();
  if (def.points.length < 3) return;
  const r = routeDe(def.points);
  pinceau.save();
  pinceau.translate(ox, oy);
  pinceau.scale(echelle, echelle);
  pinceau.lineJoin = "round";
  pinceau.lineCap = "round";
  pinceau.strokeStyle = "rgba(255, 255, 255, 0.8)";
  pinceau.lineWidth = LIMITE * 2;
  pinceau.stroke(r.route);
  for (let i = 0; i < ARC_EN_CIEL.length; i = i + 1) {
    pinceau.strokeStyle = ARC_EN_CIEL[i];
    pinceau.lineWidth = LARGEUR_ROUTE * (ARC_EN_CIEL.length - i) / ARC_EN_CIEL.length;
    pinceau.stroke(r.route);
  }
  // La ligne d'arrivée et le sens de la course
  const p0 = def.points[0];
  const p1 = def.points[1];
  const a = Math.atan2(p1.y - p0.y, p1.x - p0.x);
  pinceau.translate(r.portes[0].x, r.portes[0].y);
  pinceau.rotate(a);
  pinceau.fillStyle = "white";
  pinceau.fillRect(-14, -LARGEUR_ROUTE / 2 - 20, 28, LARGEUR_ROUTE + 40);
  pinceau.fillStyle = "#8a5cd6";
  pinceau.beginPath();
  pinceau.moveTo(60, -50);
  pinceau.lineTo(150, 0);
  pinceau.lineTo(60, 50);
  pinceau.closePath();
  pinceau.fill();
  pinceau.restore();
}

function dessinerChoixCircuit() {
  dessinerFondMenu();
  const liste = listeCircuits();
  const def = liste[choixCircuit.index];
  ecrire(choixCircuit.mode === "duo" ? "Course à deux" : "Contre la montre", L / 2, 42, 40, degradeArcEnCiel(L / 2 - 200, L / 2 + 200), true);
  pinceau.fillStyle = "rgba(255, 255, 255, 0.6)";
  cadre(220, 75, 520, 345, 24);
  pinceau.fill();
  dessinerApercu(def, 235, 88, 490, 320);
  ecrire("◀", 180, 250, 44, "#b07cff", true);
  ecrire("▶", 780, 250, 44, "#b07cff", true);
  zone(110, 75, 110, 345, toucheVirtuelle("ArrowLeft"));
  zone(740, 75, 110, 345, toucheVirtuelle("ArrowRight"));
  ecrire(def.nom, L / 2, 455, 34, "#ff5e9e", true);
  ecrire((choixCircuit.index + 1) + " / " + liste.length, L / 2, 486, 15, "#a58cc4");

  if (choixCircuit.mode === "chrono") {
    const record = lireRecord(def.id);
    ecrire(record ? "Record du tour : " + chrono(record.temps) : "Pas encore de record", L / 2, 516, 19, "#e08a00");
  } else {
    const texte = choixCircuit.rivales === 0 ? "aucune, juste vous deux" : choixCircuit.rivales + " licornes de l'ordinateur";
    ecrire(touche("R : ") + "rivales : " + texte + (modeTactile ? "  (touche pour changer)" : ""), L / 2, 516, 19, "#6a4a8c");
    zone(L / 2 - 260, 500, 520, 34, toucheVirtuelle("KeyR", "r"));
  }
  bouton(190, 540, 180, 44, "Retour" + touche(" (Échap)"), toucheVirtuelle("Escape"), true);
  bouton(385, 540, 190, 44, "Partir !" + touche(" (Entrée)"), toucheVirtuelle("Enter"));
  if (def.id === "perso") bouton(590, 540, 180, 44, "Modifier" + touche(" (E)"), toucheVirtuelle("KeyE", "e"), true);
  petitSon();
}

function clavierChoixCircuit(e, lettre) {
  const liste = listeCircuits();
  if (e.code === "ArrowLeft" || e.code === "KeyA") {
    choixCircuit.index = (choixCircuit.index + liste.length - 1) % liste.length;
    sonMenu();
  } else if (e.code === "ArrowRight" || e.code === "KeyD") {
    choixCircuit.index = (choixCircuit.index + 1) % liste.length;
    sonMenu();
  } else if (lettre === "r" && choixCircuit.mode === "duo") {
    choixCircuit.rivales = choixCircuit.rivales === 0 ? 2 : 0;
    garder("licornes-rivales", choixCircuit.rivales);
    sonMenu();
  } else if (lettre === "e" && liste[choixCircuit.index].id === "perso") {
    ouvrirEditeur();
  } else if (e.code === "Escape") {
    etat = "menu";
  } else if (e.code === "Enter" || e.code === "NumpadEnter" || e.code === "Space") {
    const def = liste[choixCircuit.index];
    garder("licornes-circuit-id", def.id);
    const duo = choixCircuit.mode === "duo";
    lancerCourse({
      mode: choixCircuit.mode,
      circuitId: def.id,
      rivales: duo ? licornesLibres(choix, choixCircuit.rivales) : [],
      niveau: 0.82,
    });
  }
}

// ===== L'atelier des licornes =====

const LIGNES_ATELIER = ["licorne", "nom", "corps", "criniere", "corne", "accessoire", "remettre"];
const atelier = { numero: 0, ligne: 0 };

function ouvrirAtelier() {
  atelier.numero = choix[0];
  atelier.ligne = 1;
  etat = "atelier";
}

function changerLook(modifier) {
  const tous = lireJSON("licornes-perso") || {};
  const look = lookDe(atelier.numero);
  const copie = { nom: look.nom, corps: look.corps, criniere: look.criniere, corne: look.corne, accessoire: look.accessoire || "aucun" };
  modifier(copie);
  tous[atelier.numero] = copie;
  garder("licornes-perso", JSON.stringify(tous));
}

function suivant(liste, valeur, sens) {
  const i = liste.findIndex(function (v) { return JSON.stringify(v) === JSON.stringify(valeur); });
  return liste[((i < 0 ? 0 : i) + sens + liste.length) % liste.length];
}

function dessinerAtelier() {
  dessinerFondMenu();
  const look = lookDe(atelier.numero);
  ecrire("Atelier des licornes", L / 2, 40, 40, degradeArcEnCiel(L / 2 - 220, L / 2 + 220), true);

  pinceau.fillStyle = "rgba(255, 255, 255, 0.6)";
  cadre(30, 75, 390, 500, 26);
  pinceau.fill();
  const sautille = Math.abs(Math.sin(horloge * 5)) * 8;
  dessinerLicorne(225, 300 - sautille, -Math.PI / 2, look, horloge * 12, 3.2);
  ecrire(look.nom, 225, 530, 34, look.criniere[0] === "#ffffff" ? look.ombre : look.criniere[0], true);

  const libelles = {
    licorne: "Licorne", nom: "Son nom", corps: "Sa robe", criniere: "Sa crinière",
    corne: "Sa corne", accessoire: "Accessoire", remettre: "",
  };
  LIGNES_ATELIER.forEach(function (ligne, i) {
    const y = 80 + i * 66;
    const choisie = i === atelier.ligne;
    pinceau.fillStyle = choisie ? "white" : "rgba(255, 255, 255, 0.45)";
    cadre(445, y, 485, 54, 20);
    pinceau.fill();
    if (choisie) {
      pinceau.strokeStyle = degradeArcEnCiel(445, 930);
      pinceau.lineWidth = 3;
      cadre(445, y, 485, 54, 20);
      pinceau.stroke();
    }
    const cy = y + 28;
    zone(445, y, 485, 54, function () { toucherLigneAtelier(i, 0); });
    if (ligne !== "nom" && ligne !== "remettre") {
      zone(575, y, 85, 54, function () { toucherLigneAtelier(i, -1); });
      zone(860, y, 70, 54, function () { toucherLigneAtelier(i, 1); });
    }
    if (ligne === "remettre") {
      ecrire("↺  Remettre comme à l'origine" + touche(" (Entrée)"), 687, cy, 18, choisie ? "#ff5e9e" : "#8a6aae");
      return;
    }
    ecrire(libelles[ligne], 465, cy, 19, "#6a4a8c", false, "left");
    if (ligne !== "nom") {
      ecrire("◀", 615, cy, 18, choisie ? "#b07cff" : "#cdb8e6");
      ecrire("▶", 905, cy, 18, choisie ? "#b07cff" : "#cdb8e6");
    }
    const vx = 760;
    if (ligne === "licorne") {
      ecrire("n° " + (atelier.numero + 1) + " : " + look.nom, vx, cy, 18, "#6a4a8c");
    } else if (ligne === "nom") {
      const curseur = choisie && Math.floor(horloge * 2) % 2 === 0 ? "|" : "";
      ecrire(look.nom + curseur, vx, cy, 22, "#ff5e9e");
      if (choisie || modeTactile) ecrire(modeTactile ? "touche pour changer" : "tape au clavier", 905, cy + 14, 11, "#a58cc4", false, "right");
    } else if (ligne === "corps") {
      pinceau.fillStyle = look.corps;
      pinceau.strokeStyle = look.ombre;
      pinceau.lineWidth = 3;
      ovale(pinceau, vx, cy, 16, 16);
      pinceau.fill();
      pinceau.stroke();
    } else if (ligne === "criniere") {
      const n = look.criniere.length;
      look.criniere.forEach(function (c, k) {
        pinceau.fillStyle = c;
        pinceau.strokeStyle = "#d8c8ec";
        pinceau.lineWidth = 1.5;
        ovale(pinceau, vx + (k - (n - 1) / 2) * 22, cy, 10, 10);
        pinceau.fill();
        pinceau.stroke();
      });
    } else if (ligne === "corne") {
      const corne = CORNES.find(function (c) { return c.couleur === look.corne; }) || CORNES[0];
      ecrire(corne.nom, vx, cy, 19, "#6a4a8c");
    } else if (ligne === "accessoire") {
      ecrire(NOMS_ACCESSOIRES[look.accessoire || "aucun"], vx, cy, 17, "#6a4a8c");
    }
  });
  if (!modeTactile) ecrire("↑ ↓ : choisir   ·   ← → : changer", 450, 560, 14, "#8a6aae", false, "left");
  bouton(750, 538, 180, 42, "Terminé" + touche(" (Échap)"), toucheVirtuelle("Escape"));
}

// Au doigt : toucher une ligne la choisit ; ses flèches changent la valeur ; le nom se tape dans une fenêtre
function toucherLigneAtelier(i, sens) {
  atelier.ligne = i;
  const ligne = LIGNES_ATELIER[i];
  if (sens < 0) toucheVirtuelle("ArrowLeft")();
  else if (sens > 0) toucheVirtuelle("ArrowRight")();
  else if (ligne === "nom") demanderNom();
  else if (ligne === "remettre") toucheVirtuelle("Enter")();
  else toucheVirtuelle("ArrowRight")();
}

function demanderNom() {
  const nom = window.prompt("Le nom de ta licorne :", lookDe(atelier.numero).nom);
  if (nom !== null && nom.trim() !== "") {
    changerLook(function (l) { l.nom = nom.trim().slice(0, 14); });
  }
}

function clavierAtelier(e) {
  const ligne = LIGNES_ATELIER[atelier.ligne];
  if (e.code === "Escape" || (e.code === "Enter" && ligne !== "remettre")) {
    etat = "menu";
    return;
  }
  if (e.code === "ArrowUp") {
    atelier.ligne = (atelier.ligne + LIGNES_ATELIER.length - 1) % LIGNES_ATELIER.length;
    sonMenu();
    return;
  }
  if (e.code === "ArrowDown") {
    atelier.ligne = (atelier.ligne + 1) % LIGNES_ATELIER.length;
    sonMenu();
    return;
  }
  if (ligne === "nom") {
    if (e.code === "Backspace") {
      changerLook(function (l) { l.nom = l.nom.slice(0, -1); });
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      changerLook(function (l) { if (l.nom.length < 14) l.nom = l.nom + e.key; });
    }
    return;
  }
  if (ligne === "remettre") {
    if (e.code === "Enter" || e.code === "Space") {
      const tous = lireJSON("licornes-perso") || {};
      delete tous[atelier.numero];
      garder("licornes-perso", JSON.stringify(tous));
      sonEtoile();
    }
    return;
  }
  let sens = 0;
  if (e.code === "ArrowLeft") sens = -1;
  if (e.code === "ArrowRight") sens = 1;
  if (sens === 0) return;
  sonMenu();
  if (ligne === "licorne") {
    atelier.numero = (atelier.numero + sens + LICORNES.length) % LICORNES.length;
  } else if (ligne === "corps") {
    changerLook(function (l) { l.corps = suivant(COULEURS_CORPS, l.corps, sens); });
  } else if (ligne === "criniere") {
    changerLook(function (l) { l.criniere = suivant(CRINIERES, l.criniere, sens); });
  } else if (ligne === "corne") {
    changerLook(function (l) { l.corne = suivant(CORNES.map(function (c) { return c.couleur; }), l.corne, sens); });
  } else if (ligne === "accessoire") {
    changerLook(function (l) { l.accessoire = suivant(ACCESSOIRES, l.accessoire, sens); });
  }
}

// ===== L'éditeur de circuit =====

const ED_ECHELLE = 0.29;
const ED_X0 = (L - MONDE_EDITEUR.largeur * ED_ECHELLE) / 2;
const ED_Y0 = 68;
const ED_MARGE = 230;               // les points restent loin du bord du monde
const editeur = { points: [], glisse: -1, survol: -1 };

function ouvrirEditeur() {
  const perso = circuitPerso();
  editeur.points = perso ? perso.points.map(function (p) { return { x: p.x, y: p.y }; }) : [];
  editeur.glisse = -1;
  etat = "editeur";
  messages = [];
}

function versEcran(p) {
  return { x: ED_X0 + p.x * ED_ECHELLE, y: ED_Y0 + p.y * ED_ECHELLE };
}

function versMonde(x, y) {
  return {
    x: Math.round(Math.max(ED_MARGE, Math.min(MONDE_EDITEUR.largeur - ED_MARGE, (x - ED_X0) / ED_ECHELLE))),
    y: Math.round(Math.max(ED_MARGE, Math.min(MONDE_EDITEUR.hauteur - ED_MARGE, (y - ED_Y0) / ED_ECHELLE))),
  };
}

function pointSous(x, y) {
  for (let i = editeur.points.length - 1; i >= 0; i = i - 1) {
    const e = versEcran(editeur.points[i]);
    if (Math.hypot(e.x - x, e.y - y) < 13) return i;
  }
  return -1;
}

// Le côté du circuit le plus proche d'un clic, s'il est tout près : on y glissera un nouveau point
function coteSous(x, y) {
  const n = editeur.points.length;
  if (n < 2) return -1;
  let meilleur = -1;
  let dmin = 14;
  for (let i = 0; i < n; i = i + 1) {
    const a = versEcran(editeur.points[i]);
    const b = versEcran(editeur.points[(i + 1) % n]);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)));
    const d = Math.hypot(a.x + dx * t - x, a.y + dy * t - y);
    if (d < dmin) {
      dmin = d;
      meilleur = i;
    }
  }
  return meilleur;
}

function sourisEditeur(type, x, y, bouton) {
  if (type === "bas") {
    const i = pointSous(x, y);
    if (bouton === 2) {
      if (i >= 0) {
        editeur.points.splice(i, 1);
        sonPouf();
      }
      return;
    }
    if (i >= 0) {
      editeur.glisse = i;
      return;
    }
    if (x < ED_X0 || y < ED_Y0 || x > L - ED_X0 || y > ED_Y0 + MONDE_EDITEUR.hauteur * ED_ECHELLE) return;
    if (editeur.points.length >= 40) {
      annoncer("40 points au plus", "#ff5e9e");
      return;
    }
    const cote = coteSous(x, y);
    const p = versMonde(x, y);
    if (cote >= 0 && editeur.points.length >= 3) {
      editeur.points.splice(cote + 1, 0, p);
      editeur.glisse = cote + 1;
    } else {
      editeur.points.push(p);
      editeur.glisse = editeur.points.length - 1;
    }
    sonMenu();
  } else if (type === "bouge") {
    if (editeur.glisse >= 0) editeur.points[editeur.glisse] = versMonde(x, y);
    editeur.survol = pointSous(x, y);
  } else if (type === "haut") {
    editeur.glisse = -1;
  }
}

function dessinerEditeur() {
  dessinerFondMenu();
  ecrire("Dessine ton circuit", L / 2, 22, 26, degradeArcEnCiel(L / 2 - 140, L / 2 + 140), true);
  ecrire(modeTactile
    ? "Touche : un point (sur la route : il s'y glisse)  ·  Glisse un point pour le déplacer"
    : "Clic : un point (sur la route : il s'y glisse)  ·  Glisser : déplacer  ·  Clic droit : effacer",
  L / 2, 52, 13, "#6a4a8c");
  bouton(10, 6, 125, 34, "✕ Annuler", toucheVirtuelle("Escape"), true);
  bouton(L - 270, 6, 125, 34, "↶ Effacer", toucheVirtuelle("Backspace"), true);
  bouton(L - 135, 6, 125, 34, "✓ Garder", toucheVirtuelle("Enter"));

  const def = { largeur: MONDE_EDITEUR.largeur, hauteur: MONDE_EDITEUR.hauteur, points: editeur.points };
  dessinerApercu(def, ED_X0, ED_Y0, MONDE_EDITEUR.largeur * ED_ECHELLE, MONDE_EDITEUR.hauteur * ED_ECHELLE);
  if (editeur.points.length === 0) {
    ecrire((modeTactile ? "Touche" : "Clique") + " pour poser le premier point : ce sera le départ !", L / 2, ED_Y0 + 260, 22, "#8a6aae");
  }

  editeur.points.forEach(function (p, i) {
    const e = versEcran(p);
    const grand = i === editeur.survol || i === editeur.glisse;
    pinceau.fillStyle = i === 0 ? "#ff5e9e" : "#8a5cd6";
    pinceau.strokeStyle = "white";
    pinceau.lineWidth = 3;
    ovale(pinceau, e.x, e.y, grand ? 12 : 9, grand ? 12 : 9);
    pinceau.fill();
    pinceau.stroke();
    ecrire(String(i + 1), e.x, e.y + 1, 10, "white");
    if (i === 0) ecrire("Départ", e.x, e.y - 20, 14, "#ff5e9e", true);
  });
  ecrire(editeur.points.length + " points", ED_X0 + 14, ED_Y0 + 16, 14, "#8a6aae", false, "left");
  dessinerMessages();
}

function clavierEditeur(e) {
  if (e.code === "Escape") {
    etat = "menu";
  } else if (e.code === "Backspace" || e.code === "Delete") {
    editeur.points.pop();
  } else if (e.code === "Enter" || e.code === "NumpadEnter") {
    if (editeur.points.length < 4) {
      annoncer("Il faut au moins 4 points", "#ff5e9e");
      sonNon();
      return;
    }
    garder("licornes-circuit-perso", JSON.stringify(editeur.points));
    oublier("licornes-record-perso");
    delete circuitsPrets.perso;
    garder("licornes-circuit-id", "perso");
    sonRecord();
    etat = "menu";
    messages = [];
    annoncer("Circuit enregistré !", "#ff5e9e");
  }
}

// ===== Le Grand Prix : le classement entre deux courses, puis le podium =====

function dessinerClassementGP() {
  dessinerFondMenu();
  const fini = grandPrix.etape + 1;
  ecrire("Grand Prix : après " + fini + (fini === 1 ? " course" : " courses") + " sur " + GRAND_PRIX.length,
    L / 2, 50, 36, degradeArcEnCiel(L / 2 - 300, L / 2 + 300), true);
  const ordre = classementDuGrandPrix();
  const maxi = Math.max(1, grandPrix.points[ordre[0]]);
  ordre.forEach(function (numero, i) {
    const y = 105 + i * 88;
    const look = lookDe(numero);
    const joueur = numero === choix[0];
    pinceau.fillStyle = joueur ? "white" : "rgba(255, 255, 255, 0.55)";
    cadre(150, y, 660, 74, 20);
    pinceau.fill();
    ecrire(rangTexte(i + 1), 195, y + 37, 28, ["#ffb300", "#a0a8c0", "#d08a50"][i] || "#8a6aae", true);
    dessinerLicorne(270, y + 37, 0, look, horloge * 10 + i, 0.8);
    ecrire(look.nom + (joueur ? "  (toi)" : ""), 325, y + 26, 21, "#6a4a8c", false, "left");
    pinceau.fillStyle = "rgba(200, 170, 240, 0.35)";
    cadre(325, y + 46, 380, 12, 6);
    pinceau.fill();
    pinceau.fillStyle = degradeArcEnCiel(325, 705);
    cadre(325, y + 46, 380 * grandPrix.points[numero] / maxi, 12, 6);
    pinceau.fill();
    ecrire(grandPrix.points[numero] + " pts", 790, y + 37, 22, "#ff5e9e", false, "right");
  });
  if (tempsEcran > 0.6) {
    const texte = fini < GRAND_PRIX.length
      ? "Course suivante : " + CIRCUITS.find(function (c) { return c.id === GRAND_PRIX[fini].id; }).nom
      : "La remise des prix !";
    bouton(L / 2 - 230, 465, 460, 50, texte + touche(" (Entrée)"), toucheVirtuelle("Enter"));
  }
  bouton(L / 2 - 120, 540, 240, 36, "Abandonner" + touche(" (Échap)"), toucheVirtuelle("Escape"), true);
}

function dessinerPodium() {
  dessinerFondMenu();
  const ordre = classementDuGrandPrix();
  const rangJoueur = ordre.indexOf(choix[0]) + 1;
  ecrire("Remise des prix", L / 2, 48, 46, degradeArcEnCiel(L / 2 - 200, L / 2 + 200), true);
  ecrire(rangJoueur === 1 ? "Bravo, tu gagnes le Grand Prix !" : "Tu termines " + rangTexte(rangJoueur) + " du Grand Prix",
    L / 2, 98, 26, "#6a4a8c", true);

  const marches = [
    { rang: 2, x: 300, h: 150, couleur: "#d6dcef" },
    { rang: 1, x: 480, h: 215, couleur: "#ffe58a" },
    { rang: 3, x: 660, h: 105, couleur: "#f3c9a5" },
  ];
  const sol = 545;
  for (const m of marches) {
    const numero = ordre[m.rang - 1];
    if (numero === undefined) continue;
    const look = lookDe(numero);
    pinceau.fillStyle = m.couleur;
    cadre(m.x - 85, sol - m.h, 170, m.h, [16, 16, 0, 0]);
    pinceau.fill();
    ecrire(String(m.rang), m.x, sol - m.h + 40, 44, "white", "rgba(150, 110, 60, 0.5)");
    ecrire(grandPrix.points[numero] + " pts", m.x, sol - m.h + 82, 18, "#8a6aae");
    const saut = Math.abs(Math.sin(horloge * (m.rang === 1 ? 7 : 5) + m.rang)) * (m.rang === 1 ? 16 : 8);
    dessinerLicorne(m.x, sol - m.h - 75 - saut, -Math.PI / 2, look, horloge * 14, 1.45);
    ecrire(look.nom, m.x, sol - m.h - 168 - saut, 20, "#6a4a8c", true);
  }
  if (tempsEcran > 1) bouton(L / 2 - 80, 556, 160, 38, "Menu" + touche(" (Entrée)"), toucheVirtuelle("Enter"), true);
}
