// Préparer un circuit : sa route, la trace qui suit son milieu, ses objets, et son décor peint une fois.
"use strict";

const circuitsPrets = {};

function circuitParId(id) {
  if (!circuitsPrets[id]) {
    // On ne garde que deux décors prêts : ce sont de grandes images
    const prets = Object.keys(circuitsPrets);
    if (prets.length >= 2) delete circuitsPrets[prets[0]];
    const def = listeCircuits().find(function (c) { return c.id === id; }) || CIRCUITS[0];
    circuitsPrets[id] = preparerCircuit(def);
  }
  return circuitsPrets[id];
}

function preparerCircuit(def) {
  const points = def.points;
  const r = routeDe(points);
  const c = {
    id: def.id, nom: def.nom, largeur: def.largeur, hauteur: def.hauteur,
    points: points, portes: r.portes, route: r.route,
    angleDepart: Math.atan2(points[1].y - points[0].y, points[1].x - points[0].x),
  };
  echantillonner(c);
  placerObjets(c, def.objets || {});
  c.image = document.createElement("canvas");
  c.image.width = def.largeur;
  c.image.height = def.hauteur;
  c.g = c.image.getContext("2d");
  peindreDecor(c);
  return c;
}

// La trace : des points tous les 10 pixels environ sur le milieu de la route, de la ligne d'arrivée
// jusqu'à elle. Chacun connaît sa distance depuis la ligne (s), sa direction (tx, ty) et son côté (nx, ny).
function echantillonner(c) {
  const n = c.points.length;
  const trace = [];
  for (let i = 1; i <= n; i = i + 1) {
    const a = c.portes[i - 1];
    const k = c.points[i % n];
    const b = c.portes[i % n];
    const pas = Math.max(2, Math.ceil((Math.hypot(k.x - a.x, k.y - a.y) + Math.hypot(b.x - k.x, b.y - k.y)) / 10));
    for (let j = 0; j < pas; j = j + 1) {
      const t = j / pas;
      const u = 1 - t;
      trace.push({ x: u * u * a.x + 2 * u * t * k.x + t * t * b.x, y: u * u * a.y + 2 * u * t * k.y + t * t * b.y });
    }
  }
  const N = trace.length;
  let s = 0;
  for (let i = 0; i < N; i = i + 1) {
    if (i > 0) s = s + Math.hypot(trace[i].x - trace[i - 1].x, trace[i].y - trace[i - 1].y);
    trace[i].s = s;
    const avant = trace[(i - 1 + N) % N];
    const apres = trace[(i + 1) % N];
    const dx = apres.x - avant.x;
    const dy = apres.y - avant.y;
    const d = Math.hypot(dx, dy) || 1;
    trace[i].tx = dx / d;
    trace[i].ty = dy / d;
    trace[i].nx = -dy / d;
    trace[i].ny = dx / d;
  }
  c.trace = trace;
  c.longueur = s + Math.hypot(trace[0].x - trace[N - 1].x, trace[0].y - trace[N - 1].y);
}

// Le point de la trace le plus proche de (x, y). Avec autour >= 0, on ne cherche qu'à côté de ce
// point-là : au croisement du Grand Huit, on reste ainsi sur sa propre branche.
function plusProche(c, x, y, autour) {
  const t = c.trace;
  const N = t.length;
  let meilleur = 0;
  let dmin = Infinity;
  const debut = autour < 0 ? 0 : -60;
  const fin = autour < 0 ? N - 1 : 60;
  for (let k = debut; k <= fin; k = k + 1) {
    const i = autour < 0 ? k : (autour + k + N) % N;
    const d = (t[i].x - x) * (t[i].x - x) + (t[i].y - y) * (t[i].y - y);
    if (d < dmin) {
      dmin = d;
      meilleur = i;
    }
  }
  return meilleur;
}

// Une place le long du tour (0 à 1) et un décalage sur le côté
function surLaTrace(c, place, decalage) {
  const N = c.trace.length;
  const i = Math.floor((((place % 1) + 1) % 1) * N) % N;
  const p = c.trace[i];
  return { x: p.x + p.nx * decalage, y: p.y + p.ny * decalage, angle: Math.atan2(p.ty, p.tx), nx: p.nx, ny: p.ny };
}

function placerObjets(c, objets) {
  const fleches = objets.fleches || [];
  const orages = objets.orages || [];
  const bonbons = objets.bonbons || [];
  c.fleches = fleches.map(function (f) { return surLaTrace(c, f[0], f[1]); });
  c.orages = orages.map(function (o) {
    const p = surLaTrace(c, o[0], o[1]);
    return { bx: p.x, by: p.y, nx: p.nx, ny: p.ny, balancement: o[2], x: p.x, y: p.y, phase: o[0] * 20 };
  });
  c.bonbons = bonbons.map(function (b) {
    const p = surLaTrace(c, b[0], b[1]);
    return { x: p.x, y: p.y, attente: 0 };
  });

  // Les étoiles, réparties sur le tour, à côté des autres objets
  const prises = fleches.concat(orages, bonbons).map(function (o) { return o[0]; });
  const nb = Math.max(4, Math.round(c.longueur / 1000));
  c.etoiles = [];
  for (let k = 0; k < nb; k = k + 1) {
    let place = (k + 0.5) / nb;
    for (const autre of prises) {
      if (Math.abs(place - autre) < 0.03) place = place + 0.045;
    }
    const p = surLaTrace(c, place, [-45, 0, 45][k % 3]);
    c.etoiles.push({ x: p.x, y: p.y, attente: 0 });
  }
}

function distanceALaTrace(c, x, y) {
  let dmin = Infinity;
  for (const p of c.trace) {
    const d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
    if (d < dmin) dmin = d;
  }
  return Math.sqrt(dmin);
}

function peindreDecor(c) {
  const g = c.g;
  const w = c.largeur;
  const h = c.hauteur;
  const rnd = hasard(c.id.charCodeAt(0) * 977 + c.id.length * 31 + c.points.length);

  const ciel = g.createLinearGradient(0, 0, w * 0.3, h);
  ciel.addColorStop(0, "#bfe4ff");
  ciel.addColorStop(0.5, "#e4dcff");
  ciel.addColorStop(1, "#ffd8ee");
  g.fillStyle = ciel;
  g.fillRect(0, 0, w, h);

  for (let i = 0; i < 260; i = i + 1) {
    g.fillStyle = "rgba(255, 255, 255, " + (0.5 + rnd() * 0.5) + ")";
    formeEtoile(g, rnd() * w, rnd() * h, 2 + rnd() * 4, rnd(), 4, 0.4);
    g.fill();
  }

  // Les nuages : des grappes de bulles, avec une ombre lilas dessous
  for (let i = 0; i < 95; i = i + 1) {
    const cx = rnd() * w;
    const cy = rnd() * h;
    const bulles = [];
    const nb = 4 + Math.floor(rnd() * 5);
    for (let k = 0; k < nb; k = k + 1) {
      bulles.push({ x: cx + (rnd() - 0.5) * 160, y: cy + (rnd() - 0.5) * 50, r: 30 + rnd() * 45 });
    }
    g.fillStyle = "rgba(180, 160, 230, 0.35)";
    for (const b of bulles) { ovale(g, b.x, b.y + 12, b.r, b.r); g.fill(); }
    g.fillStyle = "rgba(255, 255, 255, 0.92)";
    for (const b of bulles) { ovale(g, b.x, b.y, b.r, b.r); g.fill(); }
  }

  // Au-delà des barrières, le ciel est voilé : on ne peut pas y aller
  const voile = document.createElement("canvas");
  voile.width = w;
  voile.height = h;
  const v = voile.getContext("2d");
  v.fillStyle = "rgba(110, 80, 170, 0.17)";
  v.fillRect(0, 0, w, h);
  v.globalCompositeOperation = "destination-out";
  v.lineJoin = "round";
  v.lineCap = "round";
  v.lineWidth = LIMITE * 2;
  v.stroke(c.route);
  g.drawImage(voile, 0, 0);

  // La route : un halo blanc, puis les sept bandes de l'arc-en-ciel
  g.lineJoin = "round";
  g.lineCap = "round";
  g.strokeStyle = "rgba(255, 255, 255, 0.3)";
  g.lineWidth = LARGEUR_ROUTE + 60;
  g.stroke(c.route);
  g.strokeStyle = "rgba(255, 255, 255, 0.6)";
  g.lineWidth = LARGEUR_ROUTE + 34;
  g.stroke(c.route);
  g.strokeStyle = "white";
  g.lineWidth = LARGEUR_ROUTE + 14;
  g.stroke(c.route);
  for (let i = 0; i < ARC_EN_CIEL.length; i = i + 1) {
    g.strokeStyle = ARC_EN_CIEL[i];
    g.lineWidth = LARGEUR_ROUTE * (ARC_EN_CIEL.length - i) / ARC_EN_CIEL.length;
    g.stroke(c.route);
  }

  g.lineWidth = LARGEUR_ROUTE;
  for (let i = 0; i < 2500; i = i + 1) {
    const x = rnd() * w;
    const y = rnd() * h;
    if (g.isPointInStroke(c.route, x, y)) {
      g.fillStyle = "rgba(255, 255, 255, 0.55)";
      formeEtoile(g, x, y, 3 + rnd() * 3, rnd(), 4, 0.35);
      g.fill();
    }
  }

  // La barrière : des boules de nuage blanches et roses, tout le long des deux bords
  const boules = [];
  const t = c.trace;
  for (let i = 0; i < t.length; i = i + 3) {
    for (const cote of [-1, 1]) {
      const x = t[i].x + t[i].nx * cote * (LIMITE + 10);
      const y = t[i].y + t[i].ny * cote * (LIMITE + 10);
      if (distanceALaTrace(c, x, y) < LIMITE + 6) continue;    // ce bord-là est dans un virage serré
      boules.push({ x: x, y: y, rose: (i / 3) % 2 === 0 });
    }
  }
  g.fillStyle = "rgba(140, 110, 200, 0.35)";
  for (const b of boules) { ovale(g, b.x, b.y + 6, 15, 15); g.fill(); }
  for (const b of boules) {
    g.fillStyle = b.rose ? "#ffd3ec" : "#ffffff";
    ovale(g, b.x, b.y, 15, 15);
    g.fill();
  }

  // La ligne d'arrivée : un damier blanc et violet en travers de la route
  g.save();
  g.translate(c.portes[0].x, c.portes[0].y);
  g.rotate(c.angleDepart);
  const carre = LARGEUR_ROUTE / 10;
  for (let rangee = 0; rangee < 2; rangee = rangee + 1) {
    for (let colonne = 0; colonne < 10; colonne = colonne + 1) {
      g.fillStyle = (rangee + colonne) % 2 === 0 ? "white" : "#8a5cd6";
      g.fillRect(rangee * carre - carre, colonne * carre - LARGEUR_ROUTE / 2, carre, carre);
    }
  }
  g.restore();
}

function surLaRoute(x, y) {
  circuit.g.lineWidth = LARGEUR_ROUTE;
  return circuit.g.isPointInStroke(circuit.route, x, y);
}
