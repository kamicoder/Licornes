// Dessiner la course : une vue par joueur, les compteurs, la carte, et le classement à l'arrivée.
"use strict";

function dessinerCourse() {
  pinceau.fillStyle = "#e9dcff";
  pinceau.fillRect(0, 0, L, H);
  for (const v of vues) dessinerVue(v);
  if (vues.length === 2) {
    pinceau.fillStyle = "white";
    pinceau.fillRect(L / 2 - 2, 0, 4, H);
  }
  for (const v of vues) {
    dessinerCompteurs(v);
    if (v.licorne.fini && etat !== "resultats") dessinerBanniereArrivee(v);
  }
  dessinerCarte();

  if (etat === "depart") {
    const n = Math.ceil(compteARebours);
    const gonfle = 1 + (compteARebours - Math.floor(compteARebours)) * 0.4;
    ecrire(String(n), L / 2, H / 2, Math.round(130 * gonfle), ARC_EN_CIEL[(n * 2) % ARC_EN_CIEL.length]);
  }
  dessinerMessages();
  if (etat !== "resultats") dessinerCommandesTactiles();
  if (etat === "resultats") dessinerResultats();
  if (pause) {
    pinceau.fillStyle = "rgba(255, 255, 255, 0.6)";
    pinceau.fillRect(0, 0, L, H);
    ecrire("Pause", L / 2, H / 2 - 50, 70, "#b07cff", true);
    bouton(L / 2 - 200, H / 2 + 10, 190, 50, "Reprendre" + touche(" (P)"), toucheVirtuelle("KeyP", "p"));
    bouton(L / 2 + 10, H / 2 + 10, 190, 50, "Menu" + touche(" (Échap)"), toucheVirtuelle("Escape"), true);
  }
}

function dessinerVue(v) {
  pinceau.save();
  pinceau.beginPath();
  pinceau.rect(v.x, v.y, v.w, v.h);
  pinceau.clip();
  pinceau.translate(v.x + v.w / 2, v.y + v.h / 2);
  pinceau.scale(v.zoom, v.zoom);
  pinceau.translate(-v.camX, -v.camY);
  pinceau.drawImage(circuit.image, 0, 0);
  dessinerObjets();
  dessinerParticules(particules);

  if (course.mode === "chrono" && fantome.length > 0 && humains[0].tempsTour < fantome[fantome.length - 1].t) {
    const ombre = fantome[fantomeIndex];
    pinceau.globalAlpha = 0.4;
    dessinerLicorne(ombre.x, ombre.y, ombre.angle, LOOK_FANTOME, ombre.t * 20, TAILLE_LICORNE);
    pinceau.globalAlpha = 1;
  }
  // Les géantes par-dessus les autres
  const ordre = licornes.slice().sort(function (a, b) { return a.echelle() - b.echelle(); });
  for (const l of ordre) {
    l.dessiner(humains.length === 2 && l.humain ? "J" + l.joueur : null);
  }
  pinceau.restore();
}

function dessinerCompteurs(v) {
  const l = v.licorne;
  const w = Math.min(390, v.w - 20);
  const x = v.x + 10;
  const y = 10;
  pinceau.fillStyle = "rgba(255, 255, 255, 0.82)";
  cadre(x, y, w, 92, 18);
  pinceau.fill();
  pinceau.fillStyle = l.look.criniere[0];
  cadre(x, y, 10, 92, [18, 0, 0, 18]);
  pinceau.fill();

  ecrire(l.nom + "  ·  Tour " + Math.min(l.tour, TOURS) + "/" + TOURS, x + 24, y + 26, 19, "#6a4a8c", false, "left");
  for (let k = 0; k < ETOILES_MAX; k = k + 1) {
    const ex = x + w - 22 - (ETOILES_MAX - 1 - k) * 25;
    pinceau.lineWidth = 2;
    pinceau.strokeStyle = "#e0b000";
    pinceau.fillStyle = k < l.etoiles ? "#ffe066" : "rgba(255, 255, 255, 0.6)";
    formeEtoile(pinceau, ex, y + 26, 10, 0, 5, 0.48);
    pinceau.fill();
    pinceau.stroke();
  }

  if (course.mode === "chrono") {
    ecrire("⏱ " + chrono(l.fini ? l.tempsFinal : l.tempsTour), x + 24, y + 56, 17, "#6a4a8c", false, "left");
    if (meilleurTour !== null) ecrire("Record " + chrono(meilleurTour), x + w - 14, y + 56, 17, "#e08a00", false, "right");
  } else {
    ecrire("⏱ " + chrono(l.fini ? l.tempsFinal : l.tempsTotal), x + 24, y + 56, 17, "#6a4a8c", false, "left");
    const rang = l.fini ? l.rang : l.place;
    ecrire(rangTexte(rang), x + w - 44, y + 56, 26, rang === 1 ? "#ff5e9e" : "#8a6aae", false, "right");
    ecrire("/" + licornes.length, x + w - 40, y + 60, 15, "#a58cc4", false, "left");
  }

  // Les barres : le turbo, et le temps de géante qui reste
  if (l.turbo > 0) {
    pinceau.fillStyle = degradeArcEnCiel(x + 20, x + w - 12);
    cadre(x + 20, y + 74, (w - 34) * Math.min(1, l.turbo / DUREE_TURBO), 5, 2.5);
    pinceau.fill();
  }
  if (l.geante > 0) {
    pinceau.fillStyle = "#ff4fa8";
    cadre(x + 20, y + 82, (w - 34) * l.geante / DUREE_GEANTE, 5, 2.5);
    pinceau.fill();
  }
}

function dessinerCarte() {
  const larg = 150;
  const haut = larg * circuit.hauteur / circuit.largeur;
  let x0 = L - larg - 12;
  let y0 = 112;
  if (vues.length === 2) {
    x0 = L / 2 - larg / 2;
    y0 = H - haut - 12;
  } else if (L - 12 - 390 - 12 > larg + 12) {
    y0 = 12;
  }
  pinceau.fillStyle = "rgba(255, 255, 255, 0.78)";
  cadre(x0, y0, larg, haut, 16);
  pinceau.fill();
  pinceau.save();
  pinceau.translate(x0 + 10, y0 + 10);
  pinceau.scale((larg - 20) / circuit.largeur, (haut - 20) / circuit.hauteur);
  pinceau.lineJoin = "round";
  pinceau.lineWidth = LARGEUR_ROUTE;
  pinceau.strokeStyle = "#cdb2ff";
  pinceau.stroke(circuit.route);
  if (course.mode === "chrono" && fantome.length > 0 && etat === "course") {
    const ombre = fantome[fantomeIndex];
    pinceau.fillStyle = "rgba(255, 255, 255, 0.95)";
    ovale(pinceau, ombre.x, ombre.y, 60, 60);
    pinceau.fill();
  }
  for (const l of licornes.slice().reverse()) {
    pinceau.fillStyle = l.look.criniere[0];
    pinceau.strokeStyle = l.humain ? "white" : "rgba(255, 255, 255, 0.6)";
    pinceau.lineWidth = l.humain ? 35 : 15;
    const r = l.humain ? 85 : 55;
    ovale(pinceau, l.x, l.y, r, r);
    pinceau.fill();
    pinceau.stroke();
  }
  pinceau.restore();
}

function dessinerMessages() {
  const hauteurs = [150, 150, 150];
  for (const m of messages) {
    let x = L / 2;
    let taille = 52;
    let k = 2;
    if (m.vue !== null && vues[m.vue]) {
      const v = vues[m.vue];
      x = v.x + v.w / 2;
      taille = vues.length === 2 ? 38 : 52;
      k = m.vue;
    }
    pinceau.globalAlpha = Math.min(1, m.vie * 2);
    ecrire(m.texte, x, hauteurs[k], taille, m.couleur, true);
    hauteurs[k] = hauteurs[k] + taille + 8;
  }
  pinceau.globalAlpha = 1;
}

function dessinerBanniereArrivee(v) {
  const l = v.licorne;
  const cx = v.x + v.w / 2;
  pinceau.fillStyle = "rgba(255, 255, 255, 0.85)";
  cadre(cx - 170, H / 2 - 70, 340, 130, 24);
  pinceau.fill();
  ecrire("Arrivée !", cx, H / 2 - 30, 44, degradeArcEnCiel(cx - 110, cx + 110), true);
  if (course.mode === "chrono") {
    ecrire(chrono(l.tempsFinal), cx, H / 2 + 22, 30, "#6a4a8c");
  } else {
    ecrire(rangTexte(l.rang) + "  ·  " + chrono(l.tempsFinal), cx, H / 2 + 22, 30, l.rang === 1 ? "#ff5e9e" : "#6a4a8c");
  }
}

// ===== Le classement, à la fin de la course =====

function dessinerResultats() {
  pinceau.fillStyle = "rgba(255, 240, 250, 0.82)";
  pinceau.fillRect(0, 0, L, H);
  dessinerParticules(confettis);

  if (course.mode === "chrono") {
    const l = humains[0];
    dessinerLicorne(L / 2, 175 - Math.abs(Math.sin(horloge * 7)) * 12, -Math.PI / 2, l.look, horloge * 16, 1.8);
    ecrire("Arrivée !", L / 2, 300, 64, degradeArcEnCiel(L / 2 - 160, L / 2 + 160), true);
    ecrire("Course en " + chrono(l.tempsFinal), L / 2, 365, 28, "#6a4a8c", true);
    ecrire("Record du tour : " + chrono(meilleurTour), L / 2, 405, 22, "#e08a00", true);
    if (nouveauRecord) ecrire("✨ Nouveau record ! ✨", L / 2, 445, 24, "#ff5e9e", true);
    if (tempsEcran > 1) boutonsDeFin();
    return;
  }

  const titre = grandPrix !== null
    ? "Course " + (grandPrix.etape + 1) + "/" + GRAND_PRIX.length + " : " + circuit.nom
    : circuit.nom;
  ecrire(titre, L / 2, 55, 40, degradeArcEnCiel(L / 2 - 260, L / 2 + 260), true);

  const hauteurLigne = Math.min(78, 380 / resultats.length);
  resultats.forEach(function (r, i) {
    const y = 110 + i * hauteurLigne;
    const l = r.licorne;
    pinceau.fillStyle = l.humain ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.55)";
    cadre(170, y, 620, hauteurLigne - 10, 18);
    pinceau.fill();
    if (l.humain) {
      pinceau.strokeStyle = l.look.criniere[0];
      pinceau.lineWidth = 3;
      cadre(170, y, 620, hauteurLigne - 10, 18);
      pinceau.stroke();
    }
    const milieuY = y + (hauteurLigne - 10) / 2;
    const couleursRang = ["#ffb300", "#a0a8c0", "#d08a50"];
    ecrire(rangTexte(r.rang), 215, milieuY, 28, couleursRang[i] || "#8a6aae", true);
    dessinerLicorne(290, milieuY, 0, l.look, horloge * 10 + i, 0.75);
    let nom = l.nom;
    if (l.humain) nom = nom + (humains.length === 2 ? "  (J" + l.joueur + ")" : "  (toi)");
    ecrire(nom, 345, milieuY, 22, "#6a4a8c", false, "left");
    ecrire((r.estime ? "≈ " : "") + chrono(r.temps), 650, milieuY, 20, "#8a6aae", false, "right");
    if (grandPrix !== null) ecrire("+" + r.points, 760, milieuY, 22, "#ff5e9e", false, "right");
  });

  if (tempsEcran > 1) boutonsDeFin();
}

function boutonsDeFin() {
  if (grandPrix !== null) {
    bouton(L / 2 - 200, 530, 400, 48, "Le classement du Grand Prix" + touche(" (Entrée)"), toucheVirtuelle("Enter"));
  } else {
    bouton(L / 2 - 210, 530, 200, 48, "Rejouer" + touche(" (R)"), toucheVirtuelle("KeyR", "r"));
    bouton(L / 2 + 10, 530, 200, 48, "Menu" + touche(" (Entrée)"), toucheVirtuelle("Enter"), true);
  }
}
