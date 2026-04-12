## 🏕️ Cahier des Charges de début de projet - App de Gestion Trek & Bivouac

### 1. Architecture Globale

- **Type :** Application Web (Responsive, pensée pour être utilisable au temps sur pc que sur smartphone).
- **Sécurité :** Système d'authentification très basique (Création de compte / Connexion) pour isoler les données de chaque utilisateur.

### 2. Fonctionnalités par Page

### 🎒 Page 1 : L'Inventaire (Gestion du Matériel)

C'est le cœur du système. C'est la base de données personnelle où tu références absolument tout ce que tu possèdes.

- **Actions :** Boutons pour Ajouter, Modifier, et Supprimer un équipement (CRUD complet).
- **Champs de saisie pour un équipement :**
    - Image (URL ou upload de fichier local).
    - Nom complet (ex: *Tente Hubba Hubba NX*).
    - Catégorie (Nourriture, Vêtements, Couchage, Abri, Cuisine, Électronique, Hygiène/Secours, etc.).
    - Poids (en grammes - **crucial**).
    - Prix d'achat.
    - Lien web (pour retrouver la fiche technique).
    - Quantité en stock.
    - Description / Notes personnelles (ex: *Attention, arceau légèrement tordu*).
- **Interface :** * Barre de recherche textuelle.
    - Filtres dynamiques par catégorie ou par poids.
    - Affichage sous forme de tableau ou de grille de cartes.

### ⚖️ Page 2 : Le Concepteur de Sac (Loadouts / Configs)

L'outil pour assembler virtuellement son sac avant de partir.

- **Création de Configuration :** Nommer une config (ex: *GR20 Juin 2024*).
- **Sélection :** Ajouter des éléments depuis la base de données "Matériel".
- **Modificateurs de Poids (Essentiel pour l'Ultra-Léger) :**
    - Case à cocher *Consommable* (Eau, Gaz, Nourriture) : Sépare le "Poids de Base" du "Poids Total".
    - Case à cocher *Porté sur soi* (Chaussures, bâtons, vêtements sur le dos) : Exclut le poids de l'équipement du calcul du poids du sac.
- **Visualisation (Graphiques) :** * Graphique circulaire (Camembert) de la répartition du poids par catégorie (ex: 30% Couchage, 20% Cuisine...).
    - Affichage clair de 3 métriques : Poids de Base, Poids des Consommables, Poids Total sur le dos.

### 📋 Page 3 : Le Check-point (Préparation & Départ)

La page à ouvrir sur le téléphone la veille du départ pour faire son sac.

- **Sélection :** On choisit une "Configuration de sac" créée sur la Page 2.
- **Interface To-Do List :** Génération automatique d'une liste à cocher.
- **Comportement :** Chaque élément coché est visuellement barré. Une barre de progression s'approche des 100% pour confirmer que rien n'a été oublié.

### 🗺️ Page 4 : Le Carnet de Bivouac (Carte Interactive)

Un journal de bord géolocalisé pour garder une trace de tes meilleures nuits dehors.

- **Carte Interactive :** Intégration d'une map dans le style Google Maps via Leaflet et OpenStreetMap.
- **Ajout de Point (Spot) :** * Par clic direct sur la carte.
    - Par saisie manuelle de coordonnées GPS.
- **Données du Spot :**
    - Photos du lieu.
    - Description et commentaires (ex: *Point d'eau à 200m, très exposé au vent*).
    - Compagnons de trek présents.
    - Note / Évaluation (sur 5 étoiles).

### 🛒 Page 5 : Le Radar (Liste d'Achats & Wishlist)

Pour centraliser ce que tu dois remplacer ou acheter pour tes prochains projets.

- **Ajout manuel :** Coller un lien (Idealo, Snowleader, etc.).
- **Champs :** Nom du produit, Prix actuel (saisi manuellement).

## 🛠️ Compte Rendu Technique : Choix des Outils

### 1. Frontend : L'Interface Utilisateur (Ce que tu vois)

- **Technologie principale :** **React.js** (initialisé avec **Vite**)
    - *Pourquoi :* C'est le standard de l'industrie. Il fonctionne sous forme de "composants" (ex: un composant pour la barre de recherche, un pour la carte d'un produit). Ton agent IA générera ce code avec une précision redoutable. Vite permet de lancer l'environnement de développement instantanément sur ton PC.
- **Design et Mise en page :** **Tailwind CSS**
    - *Pourquoi :* Fini les longs fichiers CSS compliqués. Avec Tailwind, tu appliques des classes directement sur tes éléments (ex: `text-red-500` pour du texte rouge). C'est extrêmement rapide et les IA sont expertes pour créer de belles interfaces responsives (adaptées aux mobiles) avec cet outil.

### 2. Backend : Base de Données et Sécurité (Le Moteur)

- **Plateforme :** **Supabase**
    - *Pourquoi :* C'est un "Backend as a Service". Tu n'as pas à coder de serveur.
    - **Base de données :** Il utilise PostgreSQL (une base de données relationnelle classique). L'interface web de Supabase ressemble à un tableau Excel, ce qui rend la manipulation des données (ton matériel, tes listes) visuelle et très intuitive.
    - **Authentification :** Le système de comptes (email/mot de passe) est déjà intégré. Ton agent IA n'aura besoin que de quelques lignes de code pour sécuriser ton application et séparer tes données personnelles.

### 3. Langage de Programmation

- **Le standard :** **TypeScript**
    - *Pourquoi :* **TypeScript** (qui est du JavaScript avec des règles strictes sur les types de données, ex: obliger le poids à être un nombre et non du texte) t'évitera beaucoup de bugs bêtes lors de la liaison entre tes pages et ta base de données.

### 4. Hébergement : La Mise en Ligne

- **Plateforme :** **Vercel** (ou **Netlify**)
    - *Pourquoi :* Ces plateformes gèrent l'hébergement de manière magique. Tu lies ton projet (idéalement sauvegardé sur GitHub), et à chaque fois que tu ajoutes du nouveau code, Vercel met à jour ton site en ligne automatiquement. C'est gratuit pour un projet personnel et il n'y a aucune gestion de serveur à prévoir.

## 🎨 Direction UI/UX : Minimalisme & Précision

- **L'Esprit Global :** Scientifique, premium et aéré. La fonction prime sur la forme. On utilise beaucoup d'espace vide (le *whitespace*) pour que l'œil trouve tout de suite l'information (le poids, le prix) sans se sentir agressé.
- **Couleurs (Mode Sombre/Clair) :**
    - **La base :** Un contraste très net. Noir profond et gris anthracite pour le mode sombre, blanc pur et gris très clair pour le mode clair.
    - **L'accentuation :** Une seule couleur vive (utilisée avec parcimonie) pour guider l'utilisateur. Elle ne sert que pour le bouton principal d'ajout, les alertes de prix, et les barres de progression de ta checklist.
- **La Navigation Détachée (Floating Nav) :** * Une barre de menu en forme de "pilule", centrée, qui flotte (généralement en bas sur mobile pour l'attraper avec le pouce, et en haut sur PC) sans toucher les bords de l'écran.
    - Elle utilise de simples icônes élégantes (un sac à dos, une carte, un radar) avec un léger effet de flou en arrière-plan (un *blur* discret) quand le reste du site passe en dessous lors du défilement.
- **Typographie :** Une police *Sans-Serif* moderne et très lisible (comme *Inter* ou *Geist*). De gros titres contrastés pour bien séparer les sections, et une police fine et régulière pour les caractéristiques du matériel.
- **Les Cartes de Matériel :** Plutôt qu'un tableau Excel rébarbatif, ton inventaire est présenté sous forme de blocs (cartes) aux bordures ultra-fines (1 pixel de gris) et aux coins très légèrement arrondis, pour un rendu propre et délimité.
- **Icones :** Utilisation de la librairie d'icônes Lucide-React pour un rendu minimaliste.
- **Couleur d'accentuation :** Pas de couleur sur pour le moment mais j’aime bien Orange Alpine (#FF5A00).