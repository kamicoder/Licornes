# La Course des Licornes 🦄🌈

Un mini jeu de course de licornes vue de dessus, sur des routes arc-en-ciel dans les nuages.
Tout tourne dans le navigateur : ouvrir `index.html`, rien à installer.

- **Grand Prix** : 5 courses contre 3 licornes de l'ordinateur, de plus en plus corsées, avec points et podium
- **Course à deux** : écran partagé, avec ou sans rivales
- **Contre la montre** : record et fantôme par circuit
- **Atelier des licornes** : nom, couleurs, corne, accessoires
- **Dessiner un circuit** : à la souris

## Commandes

| | Joueur 1 | Joueur 2 |
|---|---|---|
| Galoper, freiner | ↑ ↓ | Z S |
| Tourner | ← → | Q D |
| Turbo | Entrée (ou Espace en solo) | Espace |

P : pause · M : son et musique · Échap : menu

## Le code

| Fichier | Contenu |
|---|---|
| `js/donnees.js` | Les réglages du galop, les licornes, les circuits, le Grand Prix (niveaux des rivales) |
| `js/licorne.js` | Une licorne : conduite, pilote de l'ordinateur, barrière, bonus |
| `js/course.js` | Le déroulé d'une course et le classement |
| `js/circuit.js` | La route, sa trace, ses objets, le décor |
| `js/dessins.js` | La licorne, les objets, les étincelles |
| `js/affichage-course.js` | Les vues, les compteurs, la carte, les résultats |
| `js/ecrans.js` | Menu, choix du circuit, atelier, éditeur, Grand Prix |
| `js/sons.js` | Bruitages et musique (Web Audio, aucun fichier son) |
| `js/principal.js` | La boucle, le clavier, la souris |
