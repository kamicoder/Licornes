// La course : le départ, les tours, les bousculades, l'arrivée et le classement.
"use strict";

// "menu", "choix-circuit", "atelier", "editeur", "depart", "course", "resultats", "gp-classement", "gp-podium"
let etat = "menu";
let pause = false;
let horloge = 0;
let course = null;            // { mode: "gp" | "duo" | "chrono", circuitId, rivales: [numéros], niveau }
let circuit = null;
let licornes = [];
let humains = [];
let arrivees = [];
let vues = [];
let compteARebours = 0;
let finDans = null;           // quand tous les joueurs ont fini, la course s'arrête un peu après
let resultats = [];
let tempsEcran = 0;           // depuis combien de temps l'écran actuel est affiché
let messages = [];
let grandPrix = null;         // { etape, rivales, points: { numéro: points } }

// Le contre-la-montre : le record du circuit et son fantôme
let meilleurTour = null;
let fantome = [];
let fantomeIndex = 0;
let nouveauRecord = false;

// Les licornes choisies au menu, gardées d'une fois sur l'autre
let choix = [
  (Number(lire("licornes-j1")) || 0) % LICORNES.length,
  (Number(lire("licornes-j2")) || 2) % LICORNES.length,
];
if (choix[0] === choix[1]) choix[1] = (choix[0] + 1) % LICORNES.length;

function annoncer(texte, couleur, vue) {
  messages.push({ texte: texte, couleur: couleur, vie: 1.8, vue: vue === undefined ? null : vue });
}

function vueDe(licorne) {
  const i = vues.findIndex(function (v) { return v.licorne === licorne; });
  return i < 0 ? null : i;
}

// Des licornes que personne n'a prises
function licornesLibres(prises, nombre) {
  const libres = [];
  for (let i = 0; i < LICORNES.length; i = i + 1) {
    if (!prises.includes(i)) libres.push(i);
  }
  return melanger(libres).slice(0, nombre);
}

function lireRecord(id) {
  return lireJSON("licornes-record-" + id);
}

function lancerCourse(config) {
  course = config;
  circuit = circuitParId(config.circuitId);
  const record = config.mode === "chrono" ? lireRecord(circuit.id) : null;
  meilleurTour = record ? record.temps : null;
  fantome = record && record.fantome ? record.fantome : [];
  fantomeIndex = 0;
  nouveauRecord = false;

  const deux = config.mode === "duo";
  const turboJ1 = ["Enter", "NumpadEnter", "ShiftRight", "ControlRight"];
  if (!deux) turboJ1.push("Space", "ShiftLeft");
  humains = [new Licorne({
    numero: choix[0], humain: true, joueur: 1, touchesTurbo: turboJ1,
    commandes: { avancer: "ArrowUp", reculer: "ArrowDown", gauche: "ArrowLeft", droite: "ArrowRight" },
  })];
  if (deux) {
    humains.push(new Licorne({
      numero: choix[1], humain: true, joueur: 2, touchesTurbo: ["Space", "ShiftLeft"],
      commandes: { avancer: "KeyW", reculer: "KeyS", gauche: "KeyA", droite: "KeyD" },
    }));
  }
  // Les rivales : la première est la plus forte
  const ecarts = [0.03, -0.02, -0.07];
  const rivales = config.rivales.map(function (numero, k) {
    const niveau = (config.niveau + ecarts[k % ecarts.length]) * (modeTactile && !deux ? AIDE_MOBILE.rivales : 1);
    return new Licorne({ numero: numero, humain: false, niveau: niveau });
  });
  licornes = humains.concat(rivales);

  // La grille de départ : les joueurs devant, deux par rangée
  licornes.forEach(function (l, k) {
    const decalage = licornes.length === 1 ? 0 : (k % 2 === 0 ? -38 : 38);
    l.mettreAuDepart(decalage, Math.floor(k / 2));
  });

  for (const objet of circuit.etoiles.concat(circuit.bonbons)) objet.attente = 0;
  animerObjets(0);
  arrivees = [];
  resultats = [];
  particules = [];
  confettis = [];
  messages = [];
  finDans = null;
  pause = false;

  if (humains.length === 1) {
    vues = [{ licorne: humains[0], x: 0, y: 0, w: L, h: H, zoom: 1 }];
  } else {
    vues = [
      { licorne: humains[0], x: 0, y: 0, w: L / 2 - 2, h: H, zoom: 0.8 },
      { licorne: humains[1], x: L / 2 + 2, y: 0, w: L / 2 - 2, h: H, zoom: 0.8 },
    ];
  }
  suivreAvecLesCameras(0, true);

  compteARebours = 3;
  etat = "depart";
  musique("course");
  sonBip();
}

function commencerGrandPrix() {
  const rivales = licornesLibres([choix[0]], 3);
  const points = {};
  points[choix[0]] = 0;
  for (const r of rivales) points[r] = 0;
  grandPrix = { etape: 0, rivales: rivales, points: points };
  lancerEtapeDuGrandPrix();
}

function lancerEtapeDuGrandPrix() {
  const etape = GRAND_PRIX[grandPrix.etape];
  lancerCourse({ mode: "gp", circuitId: etape.id, rivales: grandPrix.rivales, niveau: etape.niveau });
  annoncer("Course " + (grandPrix.etape + 1) + " sur " + GRAND_PRIX.length, "#b07cff");
}

function revenirAuMenu() {
  etat = "menu";
  pause = false;
  grandPrix = null;
  particules = [];
  confettis = [];
  messages = [];
  musique("menu");
}

function animerObjets(duree) {
  for (const o of circuit.orages) {
    const decalage = o.balancement * Math.sin(horloge * 1.6 + o.phase);
    o.x = o.bx + o.nx * decalage;
    o.y = o.by + o.ny * decalage;
  }
  for (const objet of circuit.etoiles.concat(circuit.bonbons)) {
    objet.attente = Math.max(0, objet.attente - duree);
  }
}

function finirUnTour(l) {
  if (course.mode === "chrono" && (meilleurTour === null || l.tempsTour < meilleurTour)) {
    if (meilleurTour !== null) {
      nouveauRecord = true;
      annoncer("Nouveau record !", "#ffb300");
      sonRecord();
    }
    meilleurTour = l.tempsTour;
    fantome = l.enregistrement;
    garder("licornes-record-" + circuit.id, JSON.stringify({ temps: meilleurTour, fantome: fantome }));
  }
  if (l.tour === TOURS) {
    franchirLArrivee(l);
    return;
  }
  l.tour = l.tour + 1;
  l.tempsTour = 0;
  l.enregistrement = [];
  if (l.humain) {
    fantomeIndex = 0;
    sonTour();
    if (l.tour === TOURS) {
      annoncer(humains.length === 1 ? "Dernier tour !" : l.nom + " : dernier tour !", l.look.criniere[0], vueDe(l));
      rythmeMusique = 1.18;
    }
  }
}

function franchirLArrivee(l) {
  l.fini = true;
  l.tempsFinal = l.tempsTotal;
  arrivees.push(l);
  l.rang = arrivees.length;
  if (!l.humain) return;
  l.pilote = true;                      // l'ordinateur la ramène tranquillement
  l.niveau = 0.7;
  if (l.rang === 1) sonVictoire(); else sonTour();
  if (humains.every(function (h) { return h.fini; })) {
    finDans = course.mode === "chrono" ? 0.6 : 2.5;
  }
}

// Les licornes qui se touchent se poussent ; une géante envoie valser les autres
function bousculer() {
  for (let i = 0; i < licornes.length; i = i + 1) {
    for (let j = i + 1; j < licornes.length; j = j + 1) {
      const a = licornes[i];
      const b = licornes[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy);
      const mini = 20 * (a.echelle() + b.echelle());
      if (d === 0 || d >= mini) continue;
      const nx = dx / d;
      const ny = dy / d;
      const pousse = (mini - d) / 2;
      a.x = a.x - nx * pousse;
      a.y = a.y - ny * pousse;
      b.x = b.x + nx * pousse;
      b.y = b.y + ny * pousse;
      let force = 0.8;
      if (a.geante > 0 && b.geante <= 0 && b.turbo <= 0) { b.etourdir(0.9); force = 1.6; }
      if (b.geante > 0 && a.geante <= 0 && a.turbo <= 0) { a.etourdir(0.9); force = 1.6; }
      const choc = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
      if (choc > 0) {
        a.vx = a.vx - nx * choc * force;
        a.vy = a.vy - ny * choc * force;
        b.vx = b.vx + nx * choc * force;
        b.vy = b.vy + ny * choc * force;
      }
    }
  }
}

// Les places en course : celles qui ont fini, puis les autres selon le chemin parcouru
function ordreDeCourse() {
  const restantes = licornes.filter(function (l) { return !l.fini; });
  restantes.sort(function (a, b) { return b.progres - a.progres; });
  return arrivees.concat(restantes);
}

function suivreAvecLesCameras(duree, immediat) {
  const douceur = immediat ? 1 : Math.min(1, duree * 5);
  for (const v of vues) {
    const l = v.licorne;
    const cx = l.x + l.vx * 0.35;
    const cy = l.y + l.vy * 0.35;
    if (immediat) {
      v.camX = cx;
      v.camY = cy;
    }
    v.camX = v.camX + (cx - v.camX) * douceur;
    v.camY = v.camY + (cy - v.camY) * douceur;
  }
}

function mettreAJourCourse(duree) {
  if (etat === "depart") {
    const avant = Math.ceil(compteARebours);
    compteARebours = compteARebours - duree;
    animerObjets(duree);
    if (compteARebours <= 0) {
      etat = "course";
      annoncer("Partez !", "#ff5e9e");
      sonPartez();
    } else if (Math.ceil(compteARebours) !== avant) {
      sonBip();
    }
    return;
  }

  animerObjets(duree);
  for (const l of licornes) {
    l.conduire(duree);
    l.toucherLesObjets();
    l.semer(duree);
    if (!l.fini && l.progres >= l.tour * circuit.longueur) finirUnTour(l);
  }
  bousculer();
  ordreDeCourse().forEach(function (l, i) { l.place = i + 1; });
  if (course.mode === "chrono") {
    const l = humains[0];
    while (fantomeIndex < fantome.length - 1 && fantome[fantomeIndex + 1].t <= l.tempsTour) {
      fantomeIndex = fantomeIndex + 1;
    }
  }
  suivreAvecLesCameras(duree, false);

  if (finDans !== null) {
    finDans = finDans - duree;
    if (finDans <= 0) terminerLaCourse();
  }
}

function terminerLaCourse() {
  finDans = null;
  const total = TOURS * circuit.longueur;
  resultats = ordreDeCourse().map(function (l, i) {
    return {
      licorne: l,
      rang: i + 1,
      // Celles qui n'ont pas fini : on devine leur temps d'après le chemin déjà fait
      temps: l.fini ? l.tempsFinal : l.tempsTotal * total / Math.max(1, l.progres),
      estime: !l.fini,
      points: course.mode === "gp" ? (POINTS_GP[i] || 0) : 0,
    };
  });
  if (grandPrix !== null) {
    for (const r of resultats) grandPrix.points[r.licorne.numero] = grandPrix.points[r.licorne.numero] + r.points;
  }
  etat = "resultats";
  tempsEcran = 0;
  rythmeMusique = 1;
  musique("menu");
  if (resultats.some(function (r) { return r.licorne.humain && r.rang === 1; })) pluieDeConfettis(90);
}

// Le classement du Grand Prix, de la première à la dernière
function classementDuGrandPrix() {
  return Object.keys(grandPrix.points).map(Number).sort(function (a, b) {
    return grandPrix.points[b] - grandPrix.points[a] || (a === choix[0] ? -1 : b === choix[0] ? 1 : 0);
  });
}
