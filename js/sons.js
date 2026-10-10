// Les sons et la musique, fabriqués par le navigateur : aucun fichier à fournir.
"use strict";

let audio = null;
let sortieMusique = null;
// 0 : tout, 1 : les bruitages sans la musique, 2 : rien
let reglageSon = (Number(lire("licornes-son")) || 0) % 3;
const NOMS_REGLAGE_SON = ["Son et musique", "Son sans musique", "Son coupé"];

function sonne() {
  if (reglageSon === 2) return null;
  if (audio === null) {
    try {
      audio = new (window.AudioContext || window.webkitAudioContext)();
      sortieMusique = audio.createGain();
      sortieMusique.gain.value = 1;
      sortieMusique.connect(audio.destination);
    } catch (e) {
      return null;
    }
  }
  if (audio.state === "suspended") audio.resume();
  return audio;
}

function changerReglageSon() {
  reglageSon = (reglageSon + 1) % 3;
  garder("licornes-son", reglageSon);
  sonne();
  return NOMS_REGLAGE_SON[reglageSon];
}

// Une note : sa fréquence, quand elle commence (en secondes à partir de maintenant), sa durée…
function note(freq, debut, duree, type, volume, freqFin, sortie) {
  const a = sonne();
  if (a === null) return;
  const t = a.currentTime + debut;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freqFin) osc.frequency.exponentialRampToValueAtTime(freqFin, t + duree);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  osc.connect(gain).connect(sortie || a.destination);
  osc.start(t);
  osc.stop(t + duree + 0.05);
}

// Un souffle de bruit, pour le tonnerre et les « pouf » dans les nuages
let bufferBruit = null;
function bruit(duree, volume, frequence) {
  const a = sonne();
  if (a === null) return;
  if (bufferBruit === null) {
    bufferBruit = a.createBuffer(1, a.sampleRate, a.sampleRate);
    const donnees = bufferBruit.getChannelData(0);
    for (let i = 0; i < donnees.length; i = i + 1) donnees[i] = Math.random() * 2 - 1;
  }
  const source = a.createBufferSource();
  source.buffer = bufferBruit;
  const filtre = a.createBiquadFilter();
  filtre.type = "lowpass";
  filtre.frequency.value = frequence;
  const gain = a.createGain();
  const t = a.currentTime;
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  source.connect(filtre).connect(gain).connect(a.destination);
  source.start(t);
  source.stop(t + duree + 0.05);
}

function sonBip() { note(660, 0, 0.18, "square", 0.05); }
function sonPartez() { note(1320, 0, 0.4, "square", 0.06); note(1760, 0.05, 0.4, "triangle", 0.06); }
function sonSabot(aigu) { note(aigu ? 520 : 400, 0, 0.06, "triangle", 0.035, 180); }
function sonEtoile() { [1568, 2093, 2637].forEach(function (f, i) { note(f, i * 0.06, 0.2, "triangle", 0.1); }); }
function sonTurbo() { note(300, 0, 0.5, "sawtooth", 0.04, 1200); note(600, 0.05, 0.5, "triangle", 0.07, 2400); }
function sonFleche() { note(500, 0, 0.25, "triangle", 0.07, 1500); }
function sonBonbon() { note(200, 0, 0.5, "sine", 0.12, 900); note(400, 0.1, 0.5, "triangle", 0.06, 1600); }
function sonOrage() { bruit(0.9, 0.35, 500); note(140, 0, 0.6, "sawtooth", 0.05, 60); }
function sonPouf() { bruit(0.15, 0.12, 1200); }
function sonTour() { [784, 988, 1175].forEach(function (f, i) { note(f, i * 0.08, 0.2, "triangle", 0.09); }); }
function sonRecord() { [1047, 1319, 1568, 2093, 2637].forEach(function (f, i) { note(f, 0.3 + i * 0.07, 0.25, "sine", 0.1); }); }
function sonVictoire() {
  const air = [523, 659, 784, 1047, 0, 784, 1047];
  air.forEach(function (f, i) { if (f > 0) note(f, i * 0.14, i === air.length - 1 ? 0.7 : 0.18, "triangle", 0.1); });
}
function sonMenu() { note(988, 0, 0.1, "sine", 0.08); }
function sonNon() { note(300, 0, 0.15, "square", 0.04, 200); }

// ===== La musique : une mélodie et une basse, jouées pas à pas =====
// Les notes comptent les demi-tons à partir du do du milieu (0) ; null : un silence.

const MUSIQUES = {
  menu: {
    tempo: 96, timbre: "triangle", volume: 0.045,
    melodie: [16, null, 19, null, 21, null, 19, 16, 14, null, 12, null, 9, null, 12, null,
      14, null, 16, null, 19, null, 16, 14, 12, null, null, null, null, null, null, null],
    basse: [0, 0, -3, -3, 5, 5, 7, 7, 0, 0, -3, -3, 5, 7, 0, 0],
  },
  course: {
    tempo: 138, timbre: "square", volume: 0.025,
    melodie: [12, null, 16, 19, 21, 19, 16, null, 14, null, 16, 14, 12, null, 9, null,
      12, null, 16, 19, 24, 21, 19, null, 21, 19, 16, 14, 12, null, null, null,
      17, null, 21, 24, 26, 24, 21, null, 19, null, 23, 19, 14, null, 11, null,
      12, null, 16, 19, 24, null, 19, 16, 21, 19, 16, 14, 12, null, 12, null],
    basse: [0, 0, 7, 7, -3, -3, 4, 4, 5, 5, 0, 0, 7, 7, 2, 2,
      5, 5, 9, 9, 7, 7, 2, 2, 0, 0, 5, 5, 7, 7, 0, 0],
  },
};

let musiqueActuelle = null;
let pasMusique = 0;
let prochainPas = 0;
let rythmeMusique = 1;              // plus grand : la musique s'accélère

function musique(nom) {
  if (musiqueActuelle === nom) return;
  musiqueActuelle = nom;
  pasMusique = 0;
  prochainPas = 0;
  rythmeMusique = 1;
}

function frequenceDe(n) {
  return 261.63 * Math.pow(2, n / 12);
}

// Toutes les 30 millisecondes, on prépare les notes des 150 prochaines millisecondes
setInterval(function () {
  if (musiqueActuelle === null || reglageSon !== 0 || audio === null || audio.state !== "running") return;
  const m = MUSIQUES[musiqueActuelle];
  const duree = 60 / m.tempo / 2 / rythmeMusique;
  if (prochainPas < audio.currentTime) prochainPas = audio.currentTime + 0.05;
  while (prochainPas < audio.currentTime + 0.15) {
    const debut = prochainPas - audio.currentTime;
    const n = m.melodie[pasMusique % m.melodie.length];
    if (n !== null) note(frequenceDe(n), debut, duree * 0.9, m.timbre, m.volume, 0, sortieMusique);
    if (pasMusique % 2 === 0) {
      const b = m.basse[(pasMusique / 2) % m.basse.length];
      if (b !== null) note(frequenceDe(b - 24), debut, duree * 1.7, "triangle", m.volume * 1.6, 0, sortieMusique);
    }
    pasMusique = pasMusique + 1;
    prochainPas = prochainPas + duree;
  }
}, 30);
