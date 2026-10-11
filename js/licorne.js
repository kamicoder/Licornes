// Une licorne de course : conduite par un joueur ou par l'ordinateur.
"use strict";

const touches = {};

// L'apparence d'une licorne, avec ce que l'atelier a changé
function lookDe(numero) {
  const base = LICORNES[numero];
  const perso = (lireJSON("licornes-perso") || {})[numero];
  if (!perso) return base;
  return {
    nom: perso.nom || base.nom,
    corps: perso.corps,
    ombre: assombrir(perso.corps, 0.14),
    criniere: perso.criniere,
    corne: perso.corne,
    accessoire: perso.accessoire,
  };
}

// L'effet élastique : une rivale loin devant les joueuses ralentit, une rivale loin derrière se dépêche
function elastique(licorne) {
  const force = aides().elastique;
  const enCourse = humains.filter(function (h) { return !h.fini; });
  if (!force || enCourse.length === 0) return 1;
  const tete = Math.max.apply(null, enCourse.map(function (h) { return h.progres; }));
  const ecart = Math.max(-1, Math.min(1, (licorne.progres - tete) / 900));
  return ecart > 0 ? 1 - force * 0.6 * ecart : 1 - force * 0.15 * ecart;
}

class Licorne {
  // options : numero (dans LICORNES), humain, commandes, touchesTurbo, niveau (1 = la vitesse pleine)
  constructor(options) {
    this.numero = options.numero;
    this.look = lookDe(options.numero);
    this.nom = this.look.nom;
    this.humain = options.humain;
    this.joueur = options.joueur || 0;     // 1 ou 2 pour les joueurs
    this.commandes = options.commandes || null;
    this.touchesTurbo = options.touchesTurbo || [];
    this.niveau = options.niveau || 1;
    this.entrees = { avancer: false, reculer: false, gauche: false, droite: false };
  }

  // decalage : sur le côté de la ligne ; rangee : 0 devant, 1 derrière…
  mettreAuDepart(decalage, rangee) {
    this.angle = circuit.angleDepart;
    const recul = 80 + rangee * 85;
    const porte = circuit.portes[0];
    this.x = porte.x - Math.cos(this.angle) * recul - Math.sin(this.angle) * decalage;
    this.y = porte.y - Math.sin(this.angle) * recul + Math.cos(this.angle) * decalage;
    this.vx = 0;
    this.vy = 0;
    this.vitesse = 0;
    this.tour = 1;
    this.tempsTour = 0;
    this.tempsTotal = 0;
    this.enregistrement = [];
    this.etoiles = 0;
    this.turbo = 0;
    this.geante = 0;
    this.etourdie = 0;
    this.attenteFleche = 0;
    this.attenteOrage = 0;
    this.attentePouf = 0;
    this.tourbillon = 0;
    this.phase = Math.random() * 6;
    this.dernierPas = 0;
    this.reserve = 0;
    this.fini = false;
    this.pilote = false;                   // vrai : l'ordinateur conduit pour elle (après l'arrivée)
    this.rang = 0;
    this.place = 0;
    this.tempsFinal = 0;
    this.couloir = 0;
    this.couloirVoulu = 0;
    this.attenteCouloir = 0;
    this.patience = 0;
    // Où elle en est : son point sur la trace, et la distance parcourue depuis la ligne
    this.indice = plusProche(circuit, this.x, this.y, -1);
    const s = circuit.trace[this.indice].s;
    this.progres = s > circuit.longueur / 2 ? s - circuit.longueur : s;
    this.meilleurProgres = this.progres;   // pour voir si elle avance encore
    this.bloquee = 0;
    this.elan = 1;
  }

  // Les joueuses reçoivent les coups de pouce du niveau choisi (voir aides)
  aidee() {
    return this.humain && !this.pilote;
  }

  // L'aide au pilotage : on vise un point de la route un peu devant, et on tourne doucement vers lui
  redresser(duree, roule) {
    const t = circuit.trace;
    const cible = t[(this.indice + 12 + Math.round(Math.max(0, this.vitesse) / 40)) % t.length];
    const ecart = angleEntre(Math.atan2(cible.y - this.y, cible.x - this.x) - this.angle);
    const pas = aides().direction * roule * duree;
    this.angle = this.angle + Math.max(-pas, Math.min(pas, ecart));
  }

  echelle() {
    let grandeur = 1;
    if (this.geante > 0) {
      // elle grandit vite, et rapetisse à la fin
      grandeur = 1 + 0.6 * Math.min(1, (DUREE_GEANTE - this.geante) * 4, this.geante * 2);
    }
    return TAILLE_LICORNE * grandeur;
  }

  lireEntrees(duree) {
    if (this.humain && !this.pilote) {
      for (const cle in this.entrees) {
        const code = this.commandes[cle];
        this.entrees[cle] = touches[code] === true || (this.joueur === 1 && touchesTactiles[code] === true);
      }
      // Au doigt, la licorne galope toute seule : on n'a que deux pouces
      if (this.joueur === 1 && modeTactile && humains.length === 1) this.entrees.avancer = !this.entrees.reculer;
      return;
    }
    this.penser(duree);
  }

  // Le cerveau de l'ordinateur : il vise un point de la route un peu devant lui
  penser(duree) {
    const t = circuit.trace;
    const N = t.length;
    const vite = Math.max(0, this.vitesse);
    const avance = 10 + Math.round(vite / 35);

    // Il change de couloir de temps en temps, pour ne pas suivre les autres à la queue leu leu
    this.attenteCouloir = this.attenteCouloir - duree;
    if (this.attenteCouloir <= 0) {
      this.couloirVoulu = (Math.random() - 0.5) * 70;
      this.attenteCouloir = 2 + Math.random() * 3;
    }
    this.couloir = this.couloir + (this.couloirVoulu - this.couloir) * Math.min(1, duree);

    const cible = t[(this.indice + avance) % N];
    const cx = cible.x + cible.nx * this.couloir;
    const cy = cible.y + cible.ny * this.couloir;
    const ecart = angleEntre(Math.atan2(cy - this.y, cx - this.x) - this.angle);

    // Un virage arrive : la route tourne entre ici et un peu plus loin
    const ici = t[this.indice];
    const loin = t[(this.indice + avance + 25) % N];
    const virage = Math.abs(angleEntre(Math.atan2(loin.ty, loin.tx) - Math.atan2(ici.ty, ici.tx)));
    this.elan = this.pilote ? 1 : elastique(this);
    const vitesseVoulue = VITESSE_MAX * this.niveau * this.elan * (1 - Math.min(0.45, virage * 0.28));

    this.entrees.gauche = ecart < -0.05;
    this.entrees.droite = ecart > 0.05;
    this.entrees.avancer = vite < vitesseVoulue && Math.abs(ecart) < 1.2;
    this.entrees.reculer = vite > vitesseVoulue + 60 || (Math.abs(ecart) > 1.4 && vite > 150);
    if (vite < 80) {
      this.entrees.avancer = true;             // à l'arrêt, il faut avancer pour pouvoir tourner
      this.entrees.reculer = false;
    }

    // Le turbo, dans une ligne droite
    if (!this.pilote && this.etoiles > 0 && this.turbo <= 0 && virage < 0.25 && Math.abs(ecart) < 0.12) {
      this.patience = this.patience + duree;
      if (this.patience > 0.6) {
        this.lancerTurbo();
        this.patience = 0;
      }
    }
  }

  conduire(duree) {
    this.lireEntrees(duree);
    const enTurbo = this.turbo > 0;
    this.turbo = Math.max(0, this.turbo - duree);
    this.geante = Math.max(0, this.geante - duree);
    this.etourdie = Math.max(0, this.etourdie - duree);
    this.attenteFleche = Math.max(0, this.attenteFleche - duree);
    this.attenteOrage = Math.max(0, this.attenteOrage - duree);
    this.attentePouf = Math.max(0, this.attentePouf - duree);

    let frottement = FROTTEMENT;
    let adherence = ADHERENCE;
    // En turbo, la licorne vole au-dessus des nuages : ils ne la freinent plus
    if (!enTurbo && !surLaRoute(this.x, this.y)) {
      frottement = this.aidee() ? aides().frottementNuage : FROTTEMENT_NUAGE;
      adherence = ADHERENCE_NUAGE;
    }

    const devantX = Math.cos(this.angle);
    const devantY = Math.sin(this.angle);
    let avant = this.vx * devantX + this.vy * devantY;
    let cote = -this.vx * devantY + this.vy * devantX;

    let vmax = VITESSE_MAX * this.niveau * (this.humain && !this.pilote ? 1 : this.elan);
    if (this.geante > 0) vmax = vmax * 1.06;
    if (enTurbo) {
      vmax = VITESSE_TURBO;
      avant = avant + ACCELERATION * 2.5 * duree;
    }
    let virage = VIRAGE;
    if (this.etourdie > 0) {
      vmax = Math.min(vmax, 200);
      adherence = 1.5;
      virage = VIRAGE * 0.5;
    }
    if (this.entrees.avancer) avant = avant + ACCELERATION * duree;
    if (this.entrees.reculer) avant = avant - (avant > 0 ? FREIN : ACCELERATION) * duree;
    avant = avant - avant * frottement * duree;
    if (avant > vmax) avant = Math.max(vmax, avant - 900 * duree);   // après le turbo, on ralentit en douceur
    avant = Math.max(-MARCHE_ARRIERE, avant);
    cote = cote - cote * Math.min(1, adherence * duree);

    // Une licorne n'est pas une voiture : même arrêtée, elle peut pivoter sur place
    const roule = Math.max(0.6, Math.min(1, Math.abs(avant) / 150));
    const sens = avant < -20 ? -1 : 1;
    if (this.entrees.gauche) this.angle = this.angle - virage * roule * sens * duree;
    if (this.entrees.droite) this.angle = this.angle + virage * roule * sens * duree;
    if (this.aidee() && aides().direction > 0 && !this.entrees.gauche && !this.entrees.droite && avant > 100) {
      this.redresser(duree, roule);
    }

    this.vx = avant * devantX - cote * devantY;
    this.vy = avant * devantY + cote * devantX;
    this.x = Math.max(0, Math.min(this.x + this.vx * duree, circuit.largeur));
    this.y = Math.max(0, Math.min(this.y + this.vy * duree, circuit.hauteur));
    this.vitesse = avant;

    this.suivreLaTrace(duree);
    this.repecherSiBloquee(duree);

    this.tourbillon = this.etourdie > 0 ? this.tourbillon + duree * 12 : 0;

    // Le galop : les jambes bougent avec la vitesse, et chaque foulée fait « clop »
    this.phase = this.phase + Math.abs(avant) * duree * 0.045;
    const pas = Math.floor(this.phase / Math.PI);
    if (pas !== this.dernierPas) {
      this.dernierPas = pas;
      if (this.humain && !this.fini && Math.abs(avant) > 60) sonSabot(pas % 2 === 0);
    }

    if (!this.fini) {
      this.tempsTour = this.tempsTour + duree;
      this.tempsTotal = this.tempsTotal + duree;
      if (this.humain && course.mode === "chrono") {
        this.enregistrement.push({ t: this.tempsTour, x: Math.round(this.x), y: Math.round(this.y), angle: Math.round(this.angle * 100) / 100 });
      }
    }
  }

  // La barrière de nuages, et la distance parcourue le long de la route
  suivreLaTrace(duree) {
    const i = plusProche(circuit, this.x, this.y, this.indice);
    const p = circuit.trace[i];
    const dx = this.x - p.x;
    const dy = this.y - p.y;
    const d = Math.hypot(dx, dy);
    const bord = LIMITE - 14;             // le corps s'arrête contre les boules de nuage
    if (d > bord) {
      const ux = dx / d;
      const uy = dy / d;
      this.x = p.x + ux * bord;
      this.y = p.y + uy * bord;
      const dehors = this.vx * ux + this.vy * uy;
      if (dehors > 0) {
        this.vx = this.vx - ux * dehors * 1.5;    // un petit rebond sur les nuages
        this.vy = this.vy - uy * dehors * 1.5;
        if (dehors > 120 && this.attentePouf <= 0) {
          this.attentePouf = 0.3;
          if (this.humain) sonPouf();
          gerbe(this.x + ux * 15, this.y + uy * 15, 8, ["#ffffff", "#ffd3ec"]);
        }
      }
      // Le nez dans les nuages : ils la tournent doucement dans le sens de la route
      if (Math.cos(this.angle) * ux + Math.sin(this.angle) * uy > 0.2) {
        const ecart = angleEntre(Math.atan2(p.ty, p.tx) - this.angle);
        const pas = 2.5 * duree;
        this.angle = this.angle + Math.max(-pas, Math.min(pas, ecart));
      }
    }
    let ds = p.s - circuit.trace[this.indice].s;
    if (ds > circuit.longueur / 2) ds = ds - circuit.longueur;
    if (ds < -circuit.longueur / 2) ds = ds + circuit.longueur;
    this.progres = this.progres + ds;
    this.indice = i;
  }

  // Le repêchage : une licorne qui n'avance plus est remise au milieu de la route, dans le bon sens
  repecherSiBloquee(duree) {
    if (this.fini || this.etourdie > 0) return;
    if (this.progres > this.meilleurProgres + 40) {
      this.meilleurProgres = this.progres;
      this.bloquee = 0;
      return;
    }
    this.bloquee = this.bloquee + duree;
    if (this.bloquee < REPECHAGE) return;
    const p = circuit.trace[this.indice];
    gerbe(this.x, this.y, 12, ["#ffffff", "#ffd3ec"]);
    this.x = p.x;
    this.y = p.y;
    this.angle = Math.atan2(p.ty, p.tx);
    this.vx = 0;
    this.vy = 0;
    this.vitesse = 0;
    this.bloquee = 0;
    this.meilleurProgres = this.progres;
    gerbe(this.x, this.y, 18, ["#ffe066", "#ffffff", "#c47dff"]);
    if (this.humain) {
      sonEtoile();
      annoncer("Hop ! Un petit coup de magie", this.look.criniere[0], vueDe(this));
    }
  }

  toucherLesObjets() {
    const portee = this.geante > 0 ? 62 : 42;
    for (const etoile of circuit.etoiles) {
      if (etoile.attente > 0 || Math.hypot(this.x - etoile.x, this.y - etoile.y) > portee) continue;
      etoile.attente = RETOUR_ETOILE;
      if (this.etoiles < ETOILES_MAX) this.etoiles = this.etoiles + 1;
      if (this.humain) sonEtoile();
      gerbe(etoile.x, etoile.y, 14, ["#ffe066", "#ffffff"]);
    }
    for (const bonbon of circuit.bonbons) {
      if (bonbon.attente > 0 || Math.hypot(this.x - bonbon.x, this.y - bonbon.y) > portee) continue;
      bonbon.attente = RETOUR_BONBON;
      this.geante = DUREE_GEANTE;
      this.etourdie = 0;
      if (this.humain) sonBonbon();
      gerbe(bonbon.x, bonbon.y, 18, ["#ff4fa8", "#ffffff", "#ff9fd4"]);
    }
    for (const fleche of circuit.fleches) {
      if (this.attenteFleche > 0 || Math.hypot(this.x - fleche.x, this.y - fleche.y) > 55) continue;
      this.attenteFleche = 1;
      this.turbo = Math.max(this.turbo, DUREE_FLECHE);
      if (this.humain) sonFleche();
    }
    for (const orage of circuit.orages) {
      if (this.attenteOrage > 0 || Math.hypot(this.x - orage.x, this.y - orage.y) > portee - 4) continue;
      this.attenteOrage = 1.5;
      if (this.geante > 0 || this.turbo > 0) continue;   // trop grande, ou trop rapide pour l'orage
      this.etourdir(DUREE_ETOURDIE * (this.aidee() ? aides().etourdie : 1));
      if (this.humain) sonOrage();
    }
  }

  etourdir(duree) {
    this.etourdie = Math.max(this.etourdie, duree);
    gerbe(this.x, this.y, 10, ["#fff176", "#b39ddb"]);
  }

  lancerTurbo() {
    if (this.etoiles <= 0 || this.turbo > 0 || this.fini) return;
    this.etoiles = this.etoiles - 1;
    this.turbo = DUREE_TURBO;
    if (this.humain) sonTurbo();
  }

  // La traînée arc-en-ciel derrière elle
  semer(duree) {
    const vite = Math.abs(this.vitesse);
    let debit = 0;
    if (this.turbo > 0) debit = 110;
    else if (vite > 150) debit = vite / (this.humain ? 10 : 20);
    if (this.geante > 0) debit = debit + 20;
    this.reserve = this.reserve + debit * duree;
    const e = this.echelle();
    while (this.reserve >= 1) {
      this.reserve = this.reserve - 1;
      const queueX = this.x - Math.cos(this.angle) * 34 * e;
      const queueY = this.y - Math.sin(this.angle) * 34 * e;
      const teinte = (horloge * 220 + Math.random() * 40) % 360;
      const grand = this.turbo > 0;
      etincelle(
        queueX + (Math.random() - 0.5) * 14 * e, queueY + (Math.random() - 0.5) * 14 * e,
        (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30,
        grand ? 1.0 : 0.6, "hsl(" + teinte + ", 95%, 72%)", grand ? 5 + Math.random() * 5 : 3 + Math.random() * 3,
        Math.random() < 0.3
      );
    }
  }

  dessiner(etiquette) {
    const e = this.echelle();
    if (this.turbo > 0) {
      const halo = pinceau.createRadialGradient(this.x, this.y, 5, this.x, this.y, 55 * e);
      halo.addColorStop(0, "rgba(255, 255, 255, 0.8)");
      halo.addColorStop(1, "rgba(255, 220, 120, 0)");
      pinceau.fillStyle = halo;
      ovale(pinceau, this.x, this.y, 55 * e, 55 * e);
      pinceau.fill();
    }
    dessinerLicorne(this.x, this.y, this.angle + this.tourbillon, this.look, this.phase, e);
    if (this.etourdie > 0) {
      for (let k = 0; k < 3; k = k + 1) {
        const a = horloge * 6 + k * Math.PI * 2 / 3;
        pinceau.fillStyle = "#ffe066";
        formeEtoile(pinceau, this.x + Math.cos(a) * 22 * e, this.y - 8 + Math.sin(a) * 10 * e, 6, a, 5, 0.45);
        pinceau.fill();
      }
    }
    if (etiquette) {
      const y = this.y - 42 * e;
      pinceau.fillStyle = this.look.criniere[0];
      pinceau.beginPath();
      pinceau.moveTo(this.x - 7, y);
      pinceau.lineTo(this.x + 7, y);
      pinceau.lineTo(this.x, y + 9);
      pinceau.closePath();
      pinceau.fill();
      ecrire(etiquette, this.x, y - 12, 16, this.look.criniere[0], "white");
    }
  }
}
