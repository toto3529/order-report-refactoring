Order Report Refactoring

## CONTEXTE

Ce projet consiste à refactorer un script legacy de génération de rapport de commandes,
tout en garantissant une non-régression fonctionnelle stricte grâce à un test de type
Golden Master.

Le comportement observable du programme legacy est conservé à l’identique,
y compris ses éventuels bugs.

Le refactoring est réalisé de manière incrémentale, par petites étapes validées
systématiquement par les tests.

---

## INSTALLATION

PRÉREQUIS

- Node.js (version LTS recommandée)
- npm (fourni avec Node.js)

INSTALLATION DES DÉPENDANCES
Commande à exécuter dans le projet :

npm install

---

## EXÉCUTION

EXÉCUTER LE CODE REFACTORÉ
Commande permettant d’exécuter la version refactorée du programme :

npm run refactor

EXÉCUTER LES TESTS
Commande permettant d’exécuter l’ensemble des tests :

npm test

COMPARER AVEC LE LEGACY (GOLDEN MASTER)
La comparaison entre le code legacy et le code refactoré est réalisée via un test
de type Golden Master.

Ce test :

- exécute le script legacy
- capture sa sortie comme référence
- exécute le code refactoré avec les mêmes données
- compare les deux sorties caractère par caractère

Commande utilisée pour cette validation :

npm test

---

## CHOIX DE REFACTORING

PROBLÈMES IDENTIFIÉS DANS LE LEGACY

1. God Function / Responsabilités multiples
   Une seule fonction (run) gérait le parsing des données, les calculs métier,
   le formatage du rapport et les effets de bord (I/O).
   Impact : code difficile à lire, tester et maintenir.

2. Duplication du parsing CSV
   Chaque entité implémentait sa propre logique de lecture CSV.
   Impact : duplication de code et risque d’incohérences.

3. Absence de typage (any)
   Les structures de données n’étaient pas explicites.
   Impact : fragilité du code et faible lisibilité.

4. Gestion d’erreurs implicite
   Certaines erreurs étaient ignorées silencieusement.
   Impact : comportements inattendus difficiles à diagnostiquer.

---

## SOLUTIONS APPORTÉES (ÉTAT ACTUEL)

- Mise en place d’un test de régression Golden Master
- Extraction du parsing CSV dans un module dédié
- Création de modèles typés pour toutes les entités legacy :
  - Customer
  - Product
  - ShippingZone
  - Promotion
  - Order
- Mise en place de fonctions de mapping explicites CSV → modèles
- Extraction des règles de remises dans `src/calculations/discounts.ts`
- Isolation de l’I/O : `run()` retourne le report, `main.ts` gère l’affichage en console
- Refactoring réalisé bloc par bloc avec validation systématique par les tests

---

## ARCHITECTURE DU PROJET

legacy/

- data/ (CSV fournis, inchangés)
- expected/ (sortie de référence Golden Master)
- script legacy (code legacy inchangé)

src/

- csv/ (lecture et parsing CSV)
- models/ (modèles typés des entités métier)
- mappers/ (mapping CSV vers modèles)
- calculations/ (fonctions de calcul métier)
- constants/ (constantes métier)
- main.ts (point d’entrée, I/O)
- run.ts (génération du report)

tests/

- golden master (test de non-régression)

---

## LIMITES ET AMÉLIORATIONS FUTURES

CE QUI N’A PAS ENCORE ÉTÉ FAIT

- Séparation du formatage du rapport (actuellement dans `run.ts`)
- Extraction dédiée des calculs (taxes / frais de port / frais de gestion)
  dans des fonctions/modules séparés (actuellement inline dans run.ts)
- Ajout de tests unitaires sur les fonctions pures (en complément du Golden Master)
- Poursuite du découpage de la fonction `run` (séparation calculs / formatage),
  volontairement limitée afin de sécuriser le Golden Master dans le temps imparti

COMPROMIS ASSUMÉS

- Priorité donnée à la non-régression fonctionnelle
- Refactoring progressif plutôt qu’une réécriture complète
- Historique Git volontairement granulaire et lisible

PISTES D’AMÉLIORATION FUTURES

- Découper la logique métier en modules dédiés
- Améliorer la gestion des erreurs et des validations
- Augmenter la couverture de tests unitaires
- Clarifier et documenter les règles métier implicites du legacy

REMARQUES SUR LE LEGACY

Plusieurs comportements non intuitifs ou potentiellement erronés ont été identifiés
dans le code legacy (écrasement de remises, calculs de taxes incohérents selon les cas,
logiques métier implicites).  
Ces comportements ont été volontairement conservés afin de garantir une non-régression
fonctionnelle stricte, conformément aux consignes du test.

---

## ÉVOLUTION DU DOCUMENT

Ce document est volontairement évolutif.
Il sera mis à jour au fil des étapes du refactoring afin de documenter
les choix techniques, les compromis et l’évolution de l’architecture.
