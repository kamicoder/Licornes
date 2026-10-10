// Les réglages, les licornes, les palettes de l'atelier, les circuits et le Grand Prix.
"use strict";

// Les réglages du galop : change-les et sens la différence
const ACCELERATION = 400;
const FREIN = 700;
const VITESSE_MAX = 500;
const VITESSE_TURBO = 820;
const MARCHE_ARRIERE = 150;
const VIRAGE = 2.8;               // radians par seconde
const FROTTEMENT = 0.5;           // la route arc-en-ciel freine un peu
const FROTTEMENT_NUAGE = 2.6;     // les nuages freinent beaucoup
const ADHERENCE = 6;              // moins, et la licorne glisse
const ADHERENCE_NUAGE = 2;
const TOURS = 3;
const DUREE_TURBO = 1.6;          // secondes de turbo par étoile
const DUREE_FLECHE = 0.7;         // le petit turbo des flèches arc-en-ciel
const DUREE_GEANTE = 6;           // le bonbon rend géante pendant ce temps
const DUREE_ETOURDIE = 1.3;       // un nuage d'orage fait tourner la tête
const ETOILES_MAX = 3;
const RETOUR_ETOILE = 6;          // secondes avant qu'une étoile ramassée revienne
const RETOUR_BONBON = 12;
const LARGEUR_ROUTE = 160;
const LIMITE = LARGEUR_ROUTE / 2 + 75;   // plus loin du milieu de la route : la barrière de nuages
const TAILLE_LICORNE = 1.1;

const ARC_EN_CIEL = ["#ff5e7e", "#ff9f43", "#ffd93d", "#6bdb8f", "#4fc3ff", "#7b7bff", "#c47dff"];

// ===== Les licornes (l'atelier peut les changer : voir lookDe) =====

const LICORNES = [
  { nom: "Paillette", corps: "#fffafd", ombre: "#ecd3e6", criniere: ["#ff7eb6", "#ffc94d", "#7fdcff", "#b98bff"], corne: "#ffcf4d", accessoire: "aucun" },
  { nom: "Guimauve", corps: "#ffd9ec", ombre: "#f0afd0", criniere: ["#ff4f9a", "#ffffff", "#ff9fcf"], corne: "#eef2f8", accessoire: "nœud" },
  { nom: "Myrtille", corps: "#ddd8ff", ombre: "#b4aaf0", criniere: ["#4b5bff", "#8fe3ff", "#c59bff"], corne: "#ffcf4d", accessoire: "aucun" },
  { nom: "Caramel", corps: "#ffe6c2", ombre: "#ecbd85", criniere: ["#ff8a3d", "#ffd36e", "#ff5f6d"], corne: "#ff9fcf", accessoire: "aucun" },
  { nom: "Menthe", corps: "#dcfff1", ombre: "#a2e5c9", criniere: ["#22c48a", "#9af0ff", "#fff27a"], corne: "#bff4ff", accessoire: "fleurs" },
  { nom: "Nuit étoilée", corps: "#55558a", ombre: "#3a3a66", criniere: ["#ffe66d", "#b98bff", "#7fdcff"], corne: "#ffcf4d", accessoire: "ailes" },
];
const LOOK_FANTOME = { nom: "Fantôme", corps: "#ffffff", ombre: "#ddd6ff", criniere: ["#ffffff", "#e9e1ff"], corne: "#ffffff", accessoire: "aucun" };

const COULEURS_CORPS = [
  "#fffafd", "#ffd9ec", "#ffb3c7", "#ddd8ff", "#c9b8ff", "#d6efff", "#dcfff1",
  "#fff3b0", "#ffe6c2", "#c9a27e", "#e8e8ee", "#9aa0b4", "#55558a", "#2d2d3a",
];
const CRINIERES = [
  ["#ff7eb6", "#ffc94d", "#7fdcff", "#b98bff"],
  ["#ff5e7e", "#ff9f43", "#ffd93d", "#6bdb8f", "#4fc3ff", "#7b7bff", "#c47dff"],
  ["#ff4f9a", "#ffffff", "#ff9fcf"],
  ["#4b5bff", "#8fe3ff", "#c59bff"],
  ["#ff8a3d", "#ffd36e", "#ff5f6d"],
  ["#22c48a", "#9af0ff", "#fff27a"],
  ["#ffe66d", "#b98bff", "#7fdcff"],
  ["#ffffff", "#dcd6ff", "#c0f0ff"],
  ["#2d2d3a", "#ff4f9a", "#2d2d3a"],
  ["#b52bff", "#ff4fd8", "#ffd1f7"],
  ["#ff3b3b", "#ffffff", "#3b6bff"],
];
const CORNES = [
  { nom: "Or", couleur: "#ffcf4d" },
  { nom: "Argent", couleur: "#eef2f8" },
  { nom: "Rose", couleur: "#ff9fcf" },
  { nom: "Cristal", couleur: "#bff4ff" },
  { nom: "Arc-en-ciel", couleur: "arc" },
];
const ACCESSOIRES = ["aucun", "ailes", "couronne", "nœud", "lunettes", "fleurs", "chapeau"];
const NOMS_ACCESSOIRES = {
  aucun: "Aucun", ailes: "Des ailes", couronne: "Une couronne", "nœud": "Un nœud",
  lunettes: "Des lunettes de soleil", fleurs: "Une couronne de fleurs", chapeau: "Un chapeau de sorcière",
};

// ===== Les circuits : la route passe près de ces points, dans l'ordre =====
// objets : des places le long du tour (0 = la ligne, 0.5 = la moitié) et un décalage sur le côté
//   fleches : [place, décalage]          un petit turbo gratuit
//   orages : [place, décalage, balancement]   ils étourdissent ; un balancement les fait bouger
//   bonbons : [place, décalage]          ils rendent géante

function pointsHuit() {
  const n = 32;
  const a = 1100;
  const points = [];
  for (let k = 0; k < n; k = k + 1) {
    const t = ((k + 6) % n) / n * Math.PI * 2;
    const s = Math.sin(t);
    const c = Math.cos(t);
    points.push({ x: 1300 + a * c / (1 + s * s), y: 900 + 1.8 * a * s * c / (1 + s * s) });
  }
  return points;
}

function pointsEtoile() {
  const points = [];
  for (let k = 0; k < 10; k = k + 1) {
    const angle = -Math.PI / 2 + (k + 1) * Math.PI / 5;
    const rayon = k % 2 === 0 ? 520 : 860;
    points.push({ x: 1300 + Math.cos(angle) * rayon, y: 1220 + Math.sin(angle) * rayon });
  }
  return points;
}

const CIRCUITS = [
  {
    id: "coeur", nom: "Le Cœur", largeur: 2600, hauteur: 2400,
    points: [
      { x: 2080, y: 1250 }, { x: 1850, y: 1580 }, { x: 1600, y: 1880 }, { x: 1420, y: 2120 },
      { x: 1180, y: 2120 }, { x: 1000, y: 1880 }, { x: 750, y: 1580 }, { x: 520, y: 1250 },
      { x: 370, y: 900 }, { x: 400, y: 560 }, { x: 600, y: 330 }, { x: 900, y: 280 },
      { x: 1150, y: 420 }, { x: 1240, y: 600 }, { x: 1360, y: 600 }, { x: 1450, y: 420 },
      { x: 1700, y: 280 }, { x: 2000, y: 330 }, { x: 2200, y: 560 }, { x: 2230, y: 900 },
    ],
    objets: { fleches: [[0.1, 0], [0.52, 0]] },
  },
  {
    id: "vallon", nom: "Le Vallon des Nuages", largeur: 2600, hauteur: 1800,
    points: [
      { x: 400, y: 1100 }, { x: 400, y: 450 }, { x: 550, y: 250 }, { x: 950, y: 250 },
      { x: 1150, y: 500 }, { x: 1300, y: 800 }, { x: 1500, y: 500 }, { x: 1700, y: 280 },
      { x: 2200, y: 280 }, { x: 2380, y: 500 }, { x: 2380, y: 950 }, { x: 2150, y: 1100 },
      { x: 1650, y: 1100 }, { x: 1300, y: 1250 }, { x: 1100, y: 1600 }, { x: 600, y: 1650 },
      { x: 400, y: 1450 },
    ],
    objets: { fleches: [[0.08, 0], [0.6, 0]], orages: [[0.3, -35, 0], [0.78, 35, 0]] },
  },
  {
    id: "huit", nom: "Le Grand Huit", largeur: 2600, hauteur: 1800, points: pointsHuit(),
    objets: {
      fleches: [[0.22, 0], [0.72, 0]],
      orages: [[0.1, 0, 0], [0.42, -40, 0], [0.9, 40, 0]],
      bonbons: [[0.58, 0]],
    },
  },
  {
    id: "etoile", nom: "L'Étoile Filante", largeur: 2600, hauteur: 2300, points: pointsEtoile(),
    objets: {
      fleches: [[0.05, 0], [0.45, 0], [0.85, 0]],
      orages: [[0.18, 0, 55], [0.38, 0, 55], [0.62, 0, 55], [0.8, 0, 55]],
      bonbons: [[0.3, 0], [0.7, 0]],
    },
  },
  {
    id: "tourbillon", nom: "Le Tourbillon", largeur: 3000, hauteur: 2300,
    points: [
      { x: 300, y: 1800 }, { x: 300, y: 1200 }, { x: 350, y: 600 }, { x: 600, y: 300 },
      { x: 900, y: 450 }, { x: 1050, y: 800 }, { x: 1300, y: 950 }, { x: 1550, y: 800 },
      { x: 1650, y: 450 }, { x: 1900, y: 280 }, { x: 2300, y: 300 }, { x: 2650, y: 500 },
      { x: 2700, y: 900 }, { x: 2450, y: 1100 }, { x: 2100, y: 1050 }, { x: 1850, y: 1250 },
      { x: 2000, y: 1550 }, { x: 2400, y: 1550 }, { x: 2700, y: 1750 }, { x: 2600, y: 2000 },
      { x: 2100, y: 2050 }, { x: 1600, y: 1950 }, { x: 1300, y: 1650 }, { x: 1000, y: 1500 },
      { x: 800, y: 1700 }, { x: 700, y: 2000 }, { x: 450, y: 2050 },
    ],
    objets: {
      fleches: [[0.06, 0], [0.33, 0], [0.66, 0]],
      orages: [[0.14, 0, 60], [0.24, -40, 0], [0.42, 0, 60], [0.52, 40, 0], [0.74, 0, 60], [0.9, 0, 60]],
      bonbons: [[0.2, 0], [0.6, 0]],
    },
  },
];

// Le circuit dessiné dans l'éditeur, s'il y en a un
const MONDE_EDITEUR = { largeur: 2600, hauteur: 1800 };
function circuitPerso() {
  const points = lireJSON("licornes-circuit-perso");
  if (!Array.isArray(points) || points.length < 4) return null;
  return {
    id: "perso", nom: "Mon circuit", largeur: MONDE_EDITEUR.largeur, hauteur: MONDE_EDITEUR.hauteur,
    points: points, objets: { fleches: [[0.25, 0], [0.7, 0]] },
  };
}

function listeCircuits() {
  const perso = circuitPerso();
  return perso ? CIRCUITS.concat([perso]) : CIRCUITS;
}

// ===== Le Grand Prix : cinq courses de plus en plus corsées =====

const GRAND_PRIX = [
  { id: "coeur", niveau: 0.72 },
  { id: "vallon", niveau: 0.77 },
  { id: "huit", niveau: 0.81 },
  { id: "etoile", niveau: 0.85 },
  { id: "tourbillon", niveau: 0.89 },
];
const POINTS_GP = [10, 7, 5, 3];
