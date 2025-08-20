
# Cisco Secure Firewall Selector (Static Site)

Outil web statique prêt pour GitHub Pages, basé sur votre Excel **Calculette Firewall V2 unprotected.xlsx**.

## Structure
```
/
├─ index.html
├─ css/styles.css
├─ js/app.js
└─ data/firewalls.json
```

## Déploiement (GitHub Pages)
1. Créez un repo GitHub (public).
2. Uploadez les 4 fichiers/dossiers ci-dessus à la racine du repo.
3. Dans **Settings → Pages**, sélectionnez **Deploy from a branch** sur la branche `main` (ou `master`) et le dossier `/root`.
4. Le site sera accessible à l'URL GitHub Pages fournie par GitHub.

## Fonctionnalités
- AUCUN filtre actif par défaut : l’utilisateur choisit ses filtres manuellement.
- Filtres par recherche, série, form factor et débits (FW/Threat/IPS).
- Tableau de résultats dynamique (compte de résultats, export CSV).
- **Comparateur A/B** : deux panneaux indépendants, même fonctionnement que votre "Calculette Firewall" :
  - Choisir un **modèle** (autocomplete)
  - Choisir une **durée** (1 / 3 / 5 ans) — détectée depuis l’Excel
  - Inclure **T (IPS)**, **AMP**, **URL** : si un SKU combiné (TM/TC/TMC) existe dans l’Excel, il est utilisé; sinon, la somme T+AMP+URL est calculée.
  - Option **Inclure SSSNT (12 mois)**
  - Affichage du **GPL** et calcul du **NET** avec remises paramétrables (HW/SW/SSSNT). Par défaut 0.6/0.6/0.6.

## Données & limitations
- `data/firewalls.json` est généré à partir de l'onglet **champs** (modèles, performances, racines de licences) et de l'onglet **Price Estimate** (GPL, délais). 
- Si un SKU spécifique n’existe pas dans l’onglet **Price Estimate**, l’outil :
  - Essaie un SKU combiné (ex: TMC) si présent,
  - Sinon additionne les SKUs disponibles (T + AMP + URL).
- Les performances affichées (Gbps) proviennent de l’Excel (colonnes : Firewall / Threat / IPS / FW+AVC+IPS).

## Mise à jour des données
- Pour régénérer `data/firewalls.json` avec un nouvel Excel, relancez le script Python utilisé pour construire ce site (celui-ci).

---

*Prototype non-officiel, à adapter selon la charte Cisco si usage externe.*
