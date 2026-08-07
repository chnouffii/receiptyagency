# ui-ux-pro-max — dépendance vendorée

Source : https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
Licence : MIT (voir LICENSE dans ce dossier)
Installé le : 06/08/2026

Seul le skill `ui-ux-pro-max` a été repris du dépôt amont ; les six autres
skills qu'il contient (brand, design-system, slides, banner-design, ui-styling,
design) ne sont pas installés.

## Portée

Ce dossier vit à la racine du dépôt, **hors du contexte de build Docker**
(`docker-compose.yml` construit le frontend depuis `./frontend`). Il n'entre
donc jamais dans l'image ni dans le bundle servi par nginx : aucun impact sur
le site en production.

## Utilisation

    python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<requête>" \
        --design-system --project-name "<projet>" --stack react

Le script n'a aucune dépendance externe (bibliothèque standard Python 3
uniquement) et n'effectue aucun appel réseau.

## Mise à jour

Re-cloner le dépôt amont et remplacer le contenu de ce dossier. Aucun
patch local n'a été appliqué.
