---
name: domat
description: Méthodologie de rédaction d'une note de synthèse juridique conforme aux usages français. À charger quand l'utilisateur demande une note, une synthèse juridique, un mémo, une consultation écrite, ou la mise en forme structurée d'une réponse juridique. Inspiré de Jean Domat (1625-1696), méthodologue du droit, auteur des "Lois civiles dans leur ordre naturel".
---

# Skill Domat — Note de synthèse juridique

Tu rédiges une note de synthèse juridique selon la méthode classique française. Une note bien faite doit être lisible par un client en 5 minutes et par un confrère en 30 secondes (sommaire + chapeau).

## En-tête obligatoire de TOUTE note

**Chaque note produite doit commencer par ce bandeau, sans exception.** Y compris pour les réponses courtes. Il protège le lecteur contre les hallucinations résiduelles qu'aucun prompt n'empêche totalement.

> **⚠️ Note de recherche — vérification finale par le professionnel**
>
> Cette note s'appuie sur des sources officielles consultées via l'API Légifrance. Avant tout usage opérationnel :
> 1. **Cliquer sur chaque lien Légifrance** cité pour ouvrir le texte source.
> 2. **Lire le titre du texte cible** et vérifier qu'il correspond bien à la branche, à la juridiction ou à la matière annoncée dans la note. Un identifiant Légifrance valide peut renvoyer à un texte d'une autre convention collective ou d'un autre code que celui visé — le titre seul fait foi.
> 3. **Confirmer la version en vigueur** à la date d'application visée (le droit évolue, les avenants se succèdent).

## Self-check final obligatoire — appel de `validate_note`

**Avant de remettre la note au lecteur, tu DOIS appeler le tool `validate_note` avec ta note finale (markdown complet) en input.** Le tool extrait tous les identifiants Légifrance cités et vérifie pour chacun (a) son existence côté Légifrance, (b) son titre exact, (c) son champ d'application réel (code parent pour LEGIARTI, branche pour KALI, juridiction pour JURI).

Tu traites la réponse :

- **Référence non vérifiable** → tu la retires de la note ou tu la remplaces par « à confirmer (référence non vérifiée) ».
- **Référence valide mais mal attribuée** (piège des branches : un KALITEXT du bricolage cité dans une note coiffure, un LEGIARTI du Code civil cité comme article du Code de commerce…) → tu la retires et tu cherches la bonne via `legifrance_recherche` ciblée, ou tu la remplaces par « à confirmer ».
- **Référence valide et bien attribuée** → conservée.

Cette étape est non négociable. C'est le garde-fou final, non-LLM, qui rattrape les hallucinations résiduelles qu'aucun prompt n'empêche totalement.

## Structure obligatoire (dans cet ordre)

### 1. Faits qualifiés (5–10 lignes)
Restitue les faits utiles à l'analyse, **dans un ordre chronologique**, et **uniquement** ceux pertinents pour la qualification juridique. Évite les faits accessoires. Adopte un vocabulaire neutre (ne dis pas "le créancier abusif", dis "M. X").

### 2. Question de droit (1 phrase)
Formule la question juridique sous une forme interrogative directe et précise. Exemples :
- ✅ « Le défaut de notification d'une cession de créance peut-il faire échec à son opposabilité au débiteur cédé ? »
- ❌ « Quels sont les effets juridiques d'une cession de créance ? » (trop large, abstrait)

### 3. Discussion (cœur de la note)
Pour **chaque** point de droit :
1. Énonce la **règle applicable** (article du code, jurisprudence de principe, doctrine si pertinente)
2. Cite le **texte exact** ou l'attendu de principe (entre guillemets)
3. **Applique la règle aux faits** — c'est la partie la plus importante
4. Mentionne les **arguments adverses** raisonnablement opposables, et pourquoi ils ne tiennent pas (ou tiennent partiellement)

### 4. Conclusion (3–5 lignes)
- Réponse directe à la question de droit
- Mention des **risques résiduels** (incertitude jurisprudentielle, absence de cas précédent, etc.)
- Le cas échéant, **recommandation pratique** (ex. « il est conseillé de notifier la cession par acte d'huissier »)

## Règles de fond

- **Toujours citer la source** : article, loi, arrêt, doctrine. Utilise le skill `gény` pour les conventions de citation.
- **Ne jamais affirmer sans référence** : si tu n'as pas de source, écris « il est généralement admis que… » et signale-le explicitement à l'utilisateur.
- **Hiérarchiser les sources** : Constitution > traités > lois > règlements > jurisprudence (CC > CE/Cass > CA > TGI/TJ) > doctrine.
- **Pas d'opinion personnelle** : la note expose l'état du droit, pas l'avis de l'auteur.
- **Distinguer ce qui est certain de ce qui est discuté** : si la jurisprudence est divisée, le dire.

## Mauvaises pratiques à éviter

- ❌ Mélanger faits et droit dans le même paragraphe
- ❌ Citer un article sans en reproduire les termes pertinents
- ❌ Conclure sans avoir traité les arguments adverses raisonnables
- ❌ Utiliser le conditionnel à outrance (« il pourrait sembler que peut-être… »)
- ❌ Multiplier les digressions historiques ou de droit comparé sans nécessité

## Format de sortie

Markdown structuré avec les 4 sections explicitement titrées. Les citations d'articles et d'arrêts vont en blockquote. Le numéro d'article apparaît en gras à la première mention puis en clair.

Exemple de squelette :

```markdown
# Note de synthèse — [objet]

## I. Faits
[…]

## II. Question de droit
[…]

## III. Discussion

### A. [Premier point de droit]
**Règle.** L'article 1240 du Code civil dispose : « Tout fait quelconque… »
**Application.** En l'espèce, M. X… donc…
**Arguments adverses.** On pourrait objecter… mais…

### B. [Second point de droit]
[…]

## IV. Conclusion
[…]
```

## Quand cette skill ne suffit pas

Si l'utilisateur veut **une consultation** (avis sur une stratégie à adopter), passe au skill `pothier`. Si c'est juste pour citer correctement un texte, le skill `gény` suffit. Si la demande est une **veille** sur l'évolution récente d'un texte, délègue à l'agent `dupin`.
