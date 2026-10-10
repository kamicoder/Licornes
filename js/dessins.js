// Dessiner une licorne vue de dessus, les objets du circuit, les étincelles et les confettis.
"use strict";

// La licorne est dessinée le nez vers la droite, puis tournée
function dessinerLicorne(x, y, angle, look, phase, echelle) {
  const p = pinceau;
  p.save();
  p.translate(x, y);
  p.rotate(angle);
  p.scale(echelle, echelle);
  const galop = Math.sin(phase);
  const n = look.criniere.length;

  p.fillStyle = "rgba(90, 50, 140, 0.13)";
  ovale(p, 3, 0, 28, 12);
  p.fill();

  if (look.accessoire === "ailes") dessinerAiles(p, look, phase);

  // La queue, qui ondule
  p.lineCap = "round";
  p.lineWidth = 4;
  for (let i = 0; i < n; i = i + 1) {
    const ecart = (i - (n - 1) / 2) * 3.5;
    p.strokeStyle = look.criniere[i];
    p.beginPath();
    p.moveTo(-18, ecart * 0.3);
    p.quadraticCurveTo(-30, ecart + Math.sin(phase * 0.5 + i) * 5, -42, ecart * 1.4 + Math.sin(phase * 0.5 + i + 1.5) * 8);
    p.stroke();
  }
  if (look.accessoire === "nœud") {
    p.fillStyle = "#ff4f9a";
    for (const cote of [-1, 1]) {
      p.beginPath();
      p.moveTo(-20, 0);
      p.lineTo(-25, cote * 7);
      p.lineTo(-15, cote * 7);
      p.closePath();
      p.fill();
    }
    ovale(p, -20, 0, 2.2, 2.2);
    p.fill();
  }

  // Les jambes vont et viennent avec le galop
  const jambes = [[13, -1, galop], [13, 1, -galop], [-12, -1, -galop], [-12, 1, galop]];
  for (const j of jambes) {
    const jx = j[0] + j[2] * 7;
    const jy = j[1] * 10.5;
    p.fillStyle = look.ombre;
    ovale(p, jx, jy, 5.5, 3);
    p.fill();
    p.fillStyle = "#a78bc9";
    ovale(p, jx + 4, jy, 2.2, 2.3);
    p.fill();
  }

  // Le corps, le cou, la tête
  p.fillStyle = look.corps;
  p.strokeStyle = look.ombre;
  p.lineWidth = 1.8;
  ovale(p, 0, 0, 21, 9.5);
  p.fill();
  p.stroke();
  ovale(p, 19, 0, 8, 5.5);
  p.fill();
  ovale(p, 28, 0, 8.5, 6.8);
  p.fill();
  p.stroke();
  p.fillStyle = look.ombre;
  ovale(p, 35, 0, 4.2, 5);
  p.fill();
  p.fillStyle = "rgba(90, 60, 120, 0.6)";
  ovale(p, 37.6, -1.8, 0.8, 1);
  p.fill();
  ovale(p, 37.6, 1.8, 0.8, 1);
  p.fill();

  p.fillStyle = look.corps;
  for (const cote of [-1, 1]) {
    p.beginPath();
    p.moveTo(26, cote * 4.5);
    p.lineTo(21, cote * 10);
    p.lineTo(22.5, cote * 3.5);
    p.closePath();
    p.fill();
    p.stroke();
  }

  for (const cote of [-1, 1]) {
    p.fillStyle = "#3b2a55";
    ovale(p, 30, cote * 5, 1.9, 1.8);
    p.fill();
    p.fillStyle = "white";
    ovale(p, 30.7, cote * 5 - 0.6, 0.7, 0.7);
    p.fill();
  }

  // La crinière : des boucles de couleur de la tête jusqu'au dos
  for (let k = 0; k < 8; k = k + 1) {
    const t = k / 7;
    p.fillStyle = look.criniere[k % n];
    ovale(p, 24 - t * 20, Math.sin(phase * 0.8 + k) * 1.3, 3.9 - t * 1.3, 3.9 - t * 1.3);
    p.fill();
  }

  dessinerChapeau(p, look);

  // La corne, avec ses spirales
  if (look.corne === "arc") {
    const d = p.createLinearGradient(29, 0, 48, 0);
    ARC_EN_CIEL.forEach(function (c, i) { d.addColorStop(i / (ARC_EN_CIEL.length - 1), c); });
    p.fillStyle = d;
  } else {
    p.fillStyle = look.corne;
  }
  p.strokeStyle = "rgba(150, 100, 60, 0.6)";
  p.lineWidth = 0.9;
  p.beginPath();
  p.moveTo(29, -2.5);
  p.lineTo(48, 0);
  p.lineTo(29, 2.5);
  p.closePath();
  p.fill();
  p.stroke();
  for (const sx of [33, 38, 43]) {
    const r = 2.5 * (48 - sx) / 19;
    p.beginPath();
    p.moveTo(sx - 1, -r);
    p.lineTo(sx + 1, r);
    p.stroke();
  }

  p.restore();
}

function dessinerAiles(p, look, phase) {
  const bat = Math.sin(phase * 0.5) * 0.5 + 0.5;
  for (const cote of [-1, 1]) {
    p.save();
    p.scale(1, cote);
    p.fillStyle = "rgba(255, 255, 255, 0.95)";
    p.strokeStyle = look.criniere[0];
    p.lineWidth = 1.5;
    p.beginPath();
    p.moveTo(10, 5);
    p.quadraticCurveTo(10, 20 + bat * 8, -2, 30 + bat * 6);
    p.quadraticCurveTo(-6, 20, -14, 22 + bat * 4);
    p.quadraticCurveTo(-8, 11, -6, 5);
    p.closePath();
    p.fill();
    p.stroke();
    p.beginPath();
    p.moveTo(4, 8);
    p.lineTo(-1, 21 + bat * 5);
    p.moveTo(-2, 8);
    p.lineTo(-9, 18 + bat * 3);
    p.stroke();
    p.restore();
  }
}

// Ce qui se porte sur la tête
function dessinerChapeau(p, look) {
  const a = look.accessoire;
  if (a === "couronne") {
    p.fillStyle = "#ffd23f";
    p.strokeStyle = "#d99a00";
    p.lineWidth = 1;
    for (let i = 0; i < 5; i = i + 1) {
      const t = i * Math.PI * 2 / 5;
      p.beginPath();
      p.moveTo(26 + Math.cos(t - 0.45) * 4.5, Math.sin(t - 0.45) * 4.5);
      p.lineTo(26 + Math.cos(t) * 9, Math.sin(t) * 9);
      p.lineTo(26 + Math.cos(t + 0.45) * 4.5, Math.sin(t + 0.45) * 4.5);
      p.closePath();
      p.fill();
      p.stroke();
    }
    p.lineWidth = 2.2;
    p.strokeStyle = "#ffd23f";
    ovale(p, 26, 0, 5, 5);
    p.stroke();
    p.fillStyle = "#ff4f9a";
    ovale(p, 26, 0, 1.6, 1.6);
    p.fill();
  } else if (a === "fleurs") {
    const couleurs = ["#ff7eb6", "#ffd36e", "#ffffff", "#b98bff"];
    for (let i = 0; i < 7; i = i + 1) {
      const t = i * Math.PI * 2 / 7;
      const fx = 26 + Math.cos(t) * 8;
      const fy = Math.sin(t) * 7.5;
      p.fillStyle = couleurs[i % couleurs.length];
      ovale(p, fx, fy, 2.7, 2.7);
      p.fill();
      p.fillStyle = "#ffb300";
      ovale(p, fx, fy, 1, 1);
      p.fill();
    }
  } else if (a === "lunettes") {
    p.fillStyle = "rgba(30, 20, 50, 0.9)";
    ovale(p, 30, -5, 3.2, 3.2);
    p.fill();
    ovale(p, 30, 5, 3.2, 3.2);
    p.fill();
    p.strokeStyle = "rgba(30, 20, 50, 0.9)";
    p.lineWidth = 1.3;
    p.beginPath();
    p.moveTo(30, -2);
    p.lineTo(30, 2);
    p.moveTo(28, -7.5);
    p.lineTo(22, -8);
    p.moveTo(28, 7.5);
    p.lineTo(22, 8);
    p.stroke();
  } else if (a === "chapeau") {
    p.fillStyle = "#5b3b8c";
    ovale(p, 25, 0, 11, 11);
    p.fill();
    p.fillStyle = "#7a52b3";
    ovale(p, 25, 0, 6, 6);
    p.fill();
    p.fillStyle = "#ffe066";
    formeEtoile(p, 25, 0, 3.4, 0, 5, 0.45);
    p.fill();
  }
}

// ===== Les objets du circuit =====

function dessinerObjets() {
  for (const f of circuit.fleches) {
    pinceau.save();
    pinceau.translate(f.x, f.y);
    pinceau.rotate(f.angle);
    pinceau.fillStyle = "rgba(255, 255, 255, 0.6)";
    cadre(-42, -52, 84, 104, 20);
    pinceau.fill();
    pinceau.lineCap = "round";
    pinceau.lineJoin = "round";
    pinceau.lineWidth = 9;
    for (let k = 0; k < 3; k = k + 1) {
      const x = -20 + k * 20;
      pinceau.strokeStyle = ARC_EN_CIEL[(k + 7 - Math.floor(horloge * 8) % 7) % 7];
      pinceau.beginPath();
      pinceau.moveTo(x - 9, -28);
      pinceau.lineTo(x + 9, 0);
      pinceau.lineTo(x - 9, 28);
      pinceau.stroke();
    }
    pinceau.restore();
  }

  for (const b of circuit.bonbons) {
    if (b.attente > 0) continue;
    pinceau.save();
    pinceau.translate(b.x, b.y + Math.sin(horloge * 3 + b.x) * 4);
    pinceau.rotate(Math.sin(horloge * 2) * 0.5);
    pinceau.fillStyle = "rgba(255, 120, 200, 0.3)";
    ovale(pinceau, 0, 0, 30, 30);
    pinceau.fill();
    pinceau.fillStyle = "#ff9fd4";
    for (const cote of [-1, 1]) {
      pinceau.beginPath();
      pinceau.moveTo(cote * 10, 0);
      pinceau.lineTo(cote * 24, -10);
      pinceau.lineTo(cote * 24, 10);
      pinceau.closePath();
      pinceau.fill();
    }
    pinceau.fillStyle = "#ff4fa8";
    ovale(pinceau, 0, 0, 14, 14);
    pinceau.fill();
    pinceau.strokeStyle = "white";
    pinceau.lineWidth = 3;
    pinceau.beginPath();
    pinceau.arc(0, 0, 9, horloge * 3, horloge * 3 + 4);
    pinceau.stroke();
    pinceau.beginPath();
    pinceau.arc(0, 0, 4, horloge * 3 + 2, horloge * 3 + 6);
    pinceau.stroke();
    pinceau.restore();
  }

  for (const o of circuit.orages) {
    pinceau.fillStyle = "rgba(60, 40, 90, 0.2)";
    ovale(pinceau, o.x + 4, o.y + 10, 42, 30);
    pinceau.fill();
    pinceau.fillStyle = "#7d6f9e";
    for (const b of [[-20, 4, 18], [0, -7, 24], [20, 4, 18], [0, 9, 20]]) {
      ovale(pinceau, o.x + b[0], o.y + b[1], b[2], b[2]);
      pinceau.fill();
    }
    pinceau.fillStyle = "#958ab3";
    ovale(pinceau, o.x - 4, o.y - 10, 14, 10);
    pinceau.fill();
    if (Math.sin(horloge * 7 + o.phase * 3) > 0.55) {
      pinceau.fillStyle = "#fff176";
      pinceau.strokeStyle = "#ffb300";
      pinceau.lineWidth = 1.5;
      pinceau.beginPath();
      pinceau.moveTo(o.x + 2, o.y - 14);
      pinceau.lineTo(o.x - 9, o.y + 4);
      pinceau.lineTo(o.x - 1, o.y + 4);
      pinceau.lineTo(o.x - 6, o.y + 20);
      pinceau.lineTo(o.x + 10, o.y - 2);
      pinceau.lineTo(o.x + 2, o.y - 2);
      pinceau.closePath();
      pinceau.fill();
      pinceau.stroke();
    }
  }

  for (const etoile of circuit.etoiles) {
    if (etoile.attente > 0) continue;
    const flotte = Math.sin(horloge * 4 + etoile.x) * 4;
    pinceau.fillStyle = "rgba(255, 220, 90, 0.35)";
    ovale(pinceau, etoile.x, etoile.y + flotte, 26, 26);
    pinceau.fill();
    pinceau.fillStyle = "#ffe066";
    pinceau.strokeStyle = "white";
    pinceau.lineWidth = 3;
    formeEtoile(pinceau, etoile.x, etoile.y + flotte, 17, horloge * 1.5, 5, 0.48);
    pinceau.fill();
    pinceau.stroke();
  }
}

// ===== Les étincelles (sur le circuit) et les confettis (sur l'écran) =====

let particules = [];
let confettis = [];

function etincelle(x, y, vx, vy, vie, couleur, taille, etoile) {
  if (particules.length > 900) particules.shift();
  particules.push({ x: x, y: y, vx: vx, vy: vy, vie: vie, max: vie, couleur: couleur, taille: taille, etoile: etoile, rot: Math.random() * 6 });
}

function gerbe(x, y, nombre, couleurs) {
  for (let i = 0; i < nombre; i = i + 1) {
    const a = Math.random() * Math.PI * 2;
    const v = 60 + Math.random() * 140;
    etincelle(x, y, Math.cos(a) * v, Math.sin(a) * v, 0.7, couleurs[i % couleurs.length], 4 + Math.random() * 3, true);
  }
}

function confetti(x, y) {
  if (confettis.length > 400) return;
  confettis.push({
    x: x, y: y,
    vx: (Math.random() - 0.5) * 80,
    vy: 60 + Math.random() * 100,
    rot: Math.random() * 6,
    vrot: (Math.random() - 0.5) * 6,
    couleur: ARC_EN_CIEL[Math.floor(Math.random() * ARC_EN_CIEL.length)],
    taille: 5 + Math.random() * 6,
    etoile: Math.random() < 0.5,
    vie: 8,
  });
}

function pluieDeConfettis(nombre) {
  for (let i = 0; i < nombre; i = i + 1) confetti(Math.random() * L, -Math.random() * 300);
}

function animerParticules(duree) {
  for (const q of particules) {
    q.x = q.x + q.vx * duree;
    q.y = q.y + q.vy * duree;
    q.vie = q.vie - duree;
    q.rot = q.rot + duree * 3;
  }
  particules = particules.filter(function (q) { return q.vie > 0; });
  for (const c of confettis) {
    c.x = c.x + c.vx * duree;
    c.y = c.y + c.vy * duree;
    c.rot = c.rot + c.vrot * duree;
    c.vie = c.vie - duree;
  }
  confettis = confettis.filter(function (c) { return c.vie > 0 && c.y < H + 20; });
}

function dessinerParticules(liste) {
  for (const q of liste) {
    pinceau.globalAlpha = q.max ? Math.max(0, q.vie / q.max) : 1;
    pinceau.fillStyle = q.couleur;
    if (q.etoile) {
      formeEtoile(pinceau, q.x, q.y, q.taille, q.rot, 5, 0.45);
    } else {
      ovale(pinceau, q.x, q.y, q.taille, q.taille);
    }
    pinceau.fill();
  }
  pinceau.globalAlpha = 1;
}
