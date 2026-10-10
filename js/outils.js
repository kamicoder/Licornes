// Les petits outils dont tout le jeu se sert : la toile, la sauvegarde, les formes, les textes.
"use strict";

const toile = document.getElementById("toile");
const pinceau = toile.getContext("2d");
const L = toile.width;
const H = toile.height;
const POLICE = "Fredoka, Verdana, sans-serif";

// La sauvegarde du navigateur peut être refusée : on fait sans
function lire(cle) {
  try { return localStorage.getItem(cle); } catch (e) { return null; }
}
function garder(cle, valeur) {
  try { localStorage.setItem(cle, valeur); } catch (e) { /* pas de sauvegarde */ }
}
function oublier(cle) {
  try { localStorage.removeItem(cle); } catch (e) { /* rien à oublier */ }
}
function lireJSON(cle) {
  const texte = lire(cle);
  if (texte === null) return null;
  try { return JSON.parse(texte); } catch (e) { return null; }
}

function milieu(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

// Un angle ramené entre -π et π
function angleEntre(a) {
  while (a > Math.PI) a = a - Math.PI * 2;
  while (a < -Math.PI) a = a + Math.PI * 2;
  return a;
}

// Un hasard qui donne toujours les mêmes nombres : le décor ne change pas d'une partie à l'autre
function hasard(graine) {
  let s = graine >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function melanger(liste) {
  const copie = liste.slice();
  for (let i = copie.length - 1; i > 0; i = i - 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = copie[i];
    copie[i] = copie[j];
    copie[j] = t;
  }
  return copie;
}

// Une couleur #rrggbb un peu plus sombre
function assombrir(hex, part) {
  const n = parseInt(hex.slice(1), 16);
  const canal = function (v) { return Math.max(0, Math.round(v * (1 - part))).toString(16).padStart(2, "0"); };
  return "#" + canal((n >> 16) & 255) + canal((n >> 8) & 255) + canal(n & 255);
}

function chrono(secondes) {
  const minutes = Math.floor(secondes / 60);
  let reste = (secondes % 60).toFixed(2);
  if (reste.length < 5) reste = "0" + reste;
  return minutes + ":" + reste;
}

// 1re, 2e, 3e… (ce sont des licornes)
function rangTexte(rang) {
  return rang === 1 ? "1re" : rang + "e";
}

function ovale(c, x, y, rx, ry) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

function formeEtoile(c, x, y, r, rotation, branches, creux) {
  c.beginPath();
  for (let i = 0; i < branches * 2; i = i + 1) {
    const rr = i % 2 === 0 ? r : r * creux;
    const a = rotation + i * Math.PI / branches - Math.PI / 2;
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
  }
  c.closePath();
}

function cadre(x, y, w, h, r) {
  pinceau.beginPath();
  pinceau.roundRect(x, y, w, h, r);
}

function degradeArcEnCiel(x1, x2) {
  const d = pinceau.createLinearGradient(x1, 0, x2, 0);
  ARC_EN_CIEL.forEach(function (c, i) { d.addColorStop(i / (ARC_EN_CIEL.length - 1), c); });
  return d;
}

// Un texte ; contour : false, true (blanc) ou une couleur
function ecrire(texte, x, y, taille, couleur, contour, alignement) {
  pinceau.font = "bold " + taille + "px " + POLICE;
  pinceau.textAlign = alignement || "center";
  pinceau.textBaseline = "middle";
  if (contour !== false && contour !== undefined) {
    pinceau.lineJoin = "round";
    pinceau.lineWidth = Math.max(3, taille / 5);
    pinceau.strokeStyle = typeof contour === "string" ? contour : "white";
    pinceau.strokeText(texte, x, y);
  }
  pinceau.fillStyle = couleur;
  pinceau.fillText(texte, x, y);
}

// Une route (le chemin de la courbe) à partir de points, sans rien préparer d'autre
function routeDe(points) {
  const n = points.length;
  const portes = [];
  for (let i = 0; i < n; i = i + 1) portes.push(milieu(points[i], points[(i + 1) % n]));
  const route = new Path2D();
  route.moveTo(portes[n - 1].x, portes[n - 1].y);
  for (let i = 0; i < n; i = i + 1) route.quadraticCurveTo(points[i].x, points[i].y, portes[i].x, portes[i].y);
  return { route: route, portes: portes };
}
