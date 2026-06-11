---
name: geny
description: Conventions de citation juridique françaises rigoureuses — articles de codes, lois, décrets, arrêts (Cass civ, CE, CA), doctrine, BOFiP. À charger pour toute rédaction qui contient des références juridiques. Critique pour éviter les hallucinations et garantir la traçabilité des citations. Inspiré de François Gény (1861-1959), théoricien des sources du droit.
---

# Skill Gény — Citation juridique française

La citation juridique française a des conventions strictes. Une référence mal formée fait perdre toute crédibilité à un écrit professionnel et empêche le lecteur de vérifier la source.

## Règle n°1 (absolue, non négociable) — tu n'inventes JAMAIS d'identifiant

Avant de citer un **KALITEXT**, **LEGIARTI**, **JORFTEXT**, **JURITEXT**, **BOI-…**, un **n° de pourvoi**, un **NOR**, un **IDCC**, un **n° d'avenant**, ou une **date d'arrêté d'extension JO**, cet identifiant doit avoir été **retourné par un tool dans la session courante** (`legifrance_get_*`, `legifrance_recherche`, `legifrance_suggest`, `bofip_recherche`, `bofip_get_document`).

**Pas vu = pas cité.** Sans exception.

Si tu n'as pas vu la référence :
- soit tu l'obtiens MAINTENANT via le tool approprié (`legifrance_get_loda` / `legifrance_get_article` / `legifrance_get_jurisprudence` par ID, `bofip_get_document` pour une fiche BOI-…, ou `legifrance_recherche` / `bofip_recherche` pour lister) ;
- soit tu écris **« à confirmer (référence non vérifiée) »** — pas de numéro inventé, pas de date approximative, pas de chiffre précis tiré de mémoire.

Une référence forgée — même très plausible, même avec le bon préfixe, même avec une date crédible — rend l'ensemble de la note nulle et discrédite tout le plugin Berryer. **C'est ce que les concurrents généralistes (ChatGPT, Claude seul) font et que Berryer ne doit JAMAIS faire.** C'est la promesse n°1 du produit.

### Pourquoi cette règle est non négociable

Un avocat qui transmet à son client une note citant `KALITEXT000053721692 — Avenant n° 51 du 3 décembre 2025 étendu par arrêté du 26 mars 2026` se ridiculise quand le client (ou l'avocat adverse) clique sur le lien Légifrance et obtient une 404. Le préjudice de réputation, pour l'avocat comme pour le plugin, est immédiat et durable. Une note plus courte qui dit « grille de salaires 2025-2026 à confirmer sur le PDF officiel — je n'ai pas pu récupérer l'avenant via l'API » est mille fois préférable.

## Format imposé — identifiant inline obligatoire

**Pour CHAQUE date d'acte juridique citée dans le corps d'une note** (avenant CCN, accord d'entreprise, loi, décret, arrêté JO, arrêt), tu DOIS l'accompagner **immédiatement** de son identifiant Légifrance entre parenthèses. **Pas d'identifiant = pas de date précise.** Substitue par une formulation vague (« courant 2025 », « avant 2024 », « dernier avenant en date ») ou par « à confirmer ».

C'est la règle qui ferme la dernière échappatoire d'hallucination : un LLM peut être tenté de citer « avenant du 31 mars 2025 » qu'il a vu passer dans son training data sans avoir vérifié qu'il s'applique à la bonne branche. Lui imposer l'identifiant inline force le passage par un tool — il ne peut écrire le KALITEXT qu'après l'avoir récupéré.

### Format par type de texte

| Type | Format obligatoire | Si non récupéré |
|---|---|---|
| CCN, avenant, accord interpro | `Avenant du JJ mois AAAA (KALITEXT000XXXXXXXX)` | `dernier avenant en date — référence à confirmer` |
| Article de code | `art. L. XXX-X C. trav. (LEGIARTI000XXXXXXXX)` *ou* `art. L. XXX-X C. trav., texte en vigueur vérifié` | `art. L. XXX-X C. trav. — version à confirmer` |
| Arrêt Cass. / CE | `Cass. soc., JJ mois AAAA, n° XX-XX.XXX (JURITEXT000XXXXXXXX)` | `Cass. soc. récent sur X — JP à confirmer` |
| Loi / décret / arrêté JO | `Loi n° AAAA-NNN du JJ mois AAAA (JORFTEXT000XXXXXXXX, NOR XXXXXXNXNX)` | `loi récente sur X — référence à confirmer` |
| Fiche BOFiP | `BOI-XX-YY-ZZ, publié le JJ mois AAAA (vérifié)` | `BOI relatif à X — à confirmer` |

### Exemples ❌ / ✅

❌ `Préavis régi par l'accord du 18 mars 2010 (étendu 4 nov. 2010), modifié par accord du 1er juillet 2015.`
→ deux dates précises citées sans aucun KALITEXT. Si tu n'as pas vérifié, le LLM **peut très bien avoir confondu avec une autre branche** (c'est exactement le bug observé sur la coiffure : ces deux dates renvoient à la CCN distribution de films, pas coiffure).

✅ `Préavis régi par l'accord du 18 mars 2010 (KALITEXT000023001468, étendu par arrêté du 4 novembre 2010, JORFTEXT…) — à vérifier que le champ d'application couvre bien la coiffure (IDCC 2596).`
→ KALITEXT explicite, donc tu as vu le texte ; tu peux confirmer le champ d'application.

✅ `Préavis régi par un accord de branche dont la date exacte est à confirmer sur le PDF officiel — je n'ai pas pu récupérer l'avenant via l'API dans cette session.`
→ aucune date précise sortie, le lecteur sait qu'il doit aller vérifier.

### Piège des branches — règle de vérification du périmètre

Un KALITEXT est rattaché à **une seule CCN**. Avant de citer un avenant pour la CCN X, **vérifie via `legifrance_get_loda` que son champ d'application mentionne bien X** (par exemple coiffure IDCC 2596 et pas distribution de films IDCC 716). Si l'avenant existe mais dans la mauvaise branche, c'est encore une hallucination — plus subtile mais aussi grave.

## Règle n°2 — toute citation est vérifiable

**Toute citation doit pouvoir être retrouvée** sur Légifrance ou dans une base de données reconnue par le lien fourni. Si tu ne peux pas générer un identifiant LEGIARTI / JURITEXT / BOI / NOR exact, n'invente rien — utilise `legifrance_recherche` ou `legifrance_suggest` pour retrouver la référence avant de citer.

## Codes — articles

**Forme courte (dans le texte courant)** :
- Code civil : `art. 1240 C. civ.` ou `article 1240 du Code civil`
- Code pénal : `art. 121-3 C. pén.`
- Code de procédure civile : `art. 700 CPC`
- Code de procédure pénale : `art. 122 CPP`
- Code de commerce : `art. L. 225-38 C. com.`
- Code du travail : `art. L. 1234-1 C. trav.`
- Code général des impôts : `art. 200 CGI` (Rappel : pas de "C." devant CGI)
- Livre des procédures fiscales : `art. L. 169 LPF`
- Code de la consommation : `art. L. 121-1 C. consom.`

**Notation des numéros d'articles** :
- Article codifié au sein d'une **partie législative** : `L.` (ex. `L. 225-38`)
- Article de la **partie réglementaire — décret en Conseil d'État** : `R.` (ex. `R. 225-30`)
- Article de la **partie réglementaire — décret simple** : `D.` (ex. `D. 225-12`)
- Article **issu d'une ordonnance** : pas de préfixe (numéro brut)

**Première citation longue (en bibliographie ou en note de bas de page)** :
> Code civil, art. 1240, modifié par l'ordonnance n° 2016-131 du 10 février 2016.

## Lois et décrets

**Forme** :
> Loi n° AAAA-NNN du JJ mois AAAA [titre court ou objet], JO du JJ mois AAAA, p. NNNN, NOR : XXXXNNNNNNNX.

**Exemples** :
- `Loi n° 2018-1021 du 23 novembre 2018 portant évolution du logement, de l'aménagement et du numérique (ELAN)`
- `Décret n° 2023-456 du 12 juin 2023 relatif à…`

L'identifiant **NOR** est précieux — toujours le mentionner si disponible.

## Jurisprudence

### Cour de cassation

**Format canonique** :
> [Chambre]., [date], [n°], [Bull.] | [pourvoi] | [Légifrance]

**Exemples concrets** :
- `Cass. civ. 1re, 12 mars 2024, n° 22-12.345`
- `Cass. civ. 2e, 4 juillet 2023, n° 21-19.876, Bull.`
- `Cass. com., 18 octobre 2023, n° 22-15.111`
- `Cass. soc., 7 février 2024, n° 22-23.456, FS-B+R` (publié au Bulletin)
- `Cass. crim., 15 janvier 2024, n° 23-80.999`
- `Cass. ass. plén., 17 mai 2023, n° 21-17.000` (Assemblée plénière)
- `Cass. mixte, 28 mars 2018, n° 16-26.337`

**Mentions de publication** : `FS-B+R` (formation de section, publié Bulletin + Rapport), `FS-P` (publié), `FS-D` (diffusion restreinte), etc.

### Conseil d'État / juridictions administratives

- `CE, 12 mars 2024, M. Dupont, n° 456789`
- `CE, sect., 4 juillet 2023, n° 467890`  (section)
- `CE, ass., 15 janvier 2024, n° 478901` (assemblée du contentieux)
- `CE, ord., 28 février 2024, n° 489012` (référé / juge unique)
- `CAA Paris, 12 mars 2024, n° 22PA01234`
- `TA Bordeaux, 5 avril 2024, n° 2200123`

### Conseil constitutionnel

- `Cons. const., 4 juillet 2023, n° 2023-456 DC`  (contrôle a priori)
- `Cons. const., 12 mars 2024, n° 2024-789 QPC, M. X` (QPC)

### Cour de justice de l'UE

- `CJUE, 15 mars 2024, C-123/22, Société X c/ État belge`
- `Trib. UE, 28 février 2024, T-456/22, Société Y c/ Commission`

### Cour européenne des droits de l'homme

- `CEDH, 12 juin 2023, Affaire X c. France, req. n° 12345/19`

### Cours d'appel / TJ

- `CA Paris, ch. 5-4, 18 janvier 2024, n° 22/01234`
- `TJ Paris, 12 mars 2024, n° 23/00567`

## BOFiP — doctrine fiscale

**Format** :
> BOI-[Série]-[Sous-série]-[Subdiv.]-[Subdiv.]-[Subdiv.] (publication du JJ mois AAAA), n° NN

**Exemples** :
- `BOI-IS-BASE-30-30-20-20, publié le 12 mai 2023, n° 50` (impôt sur les sociétés / base / régimes particuliers)
- `BOI-BNC-DECLA-10, publié le 10 décembre 2024, n° 30` (bénéfices non commerciaux / déclaration)
- `BOI-TVA-DECLA-30, publié le 15 mars 2024`

Toujours préciser la **date de publication** car la doctrine BOFiP évolue ; un BOI cité sans date est ambigu.

## Doctrine

### Manuel ou traité
> J. Mestre et B. Fages, *Les obligations*, 17e éd., LGDJ, 2024, n° 543, p. 421.

### Article de revue
> J. Cassagne, « La portée de l'arrêt X », *RTD civ.* 2024, p. 234.
> P. Conte, « Notes sur la responsabilité des dirigeants », *JCP G* 2023, n° 12, doctr. 345.

### Note d'arrêt
> Note F. Terré sous Cass. civ. 1re, 12 mars 2024, n° 22-12.345, *D.* 2024, p. 567.

## Liens Légifrance

Quand tu donnes une citation, fournis aussi le lien Légifrance correspondant si disponible. Format des URLs (le tool `legifrance_*` les retourne déjà) :
- Article : `https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI…/`
- Texte : `https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT…/`
- Arrêt : `https://www.legifrance.gouv.fr/juri/id/JURITEXT…`
- BOFiP : permalien officiel `https://bofip.impots.gouv.fr/bofip/…` retourné par `bofip_get_document` (le BOFiP n'est pas sur Légifrance)

## Quand tu n'es pas sûr

**Stop**. Plutôt qu'inventer une référence, écris : « jurisprudence à vérifier » ou « citation à confirmer », et appelle `legifrance_recherche` avec les éléments dont tu disposes pour retrouver la référence exacte. Une citation fausse fait plus de dégâts qu'une absence de citation.

## Self-check final (obligatoire avant envoi)

Avant de finaliser une note, **relis chaque identifiant cité** (KALITEXT, LEGIARTI, JURITEXT, JORFTEXT, BOI-…, n° de pourvoi, IDCC, n° d'avenant, date d'arrêté d'extension) et pose-toi pour chacun la question : *« Quel appel de tool m'a retourné cet identifiant dans cette session ? »*

- Si tu peux pointer l'appel : OK, citation conservée.
- Si tu ne peux pas : tu remplaces par **« à confirmer (référence non vérifiée) »** ou tu retires la citation. Pas d'exception.

Cette relecture est plus importante que tout le reste : c'est elle qui protège la promesse de fiabilité de Berryer.
