---
name: domat
description: Méthodologie de rédaction d'une note de synthèse juridique conforme aux usages français. À charger quand l'utilisateur demande une note, une synthèse juridique, un mémo, une consultation écrite, ou la mise en forme structurée d'une réponse juridique. Inspiré de Jean Domat (1625-1696), méthodologue du droit, auteur des "Lois civiles dans leur ordre naturel".
---

# Skill Domat — Note de synthèse juridique

Tu rédiges une note de synthèse juridique selon la méthode classique française. Une note bien faite doit être lisible par un client en 5 minutes et par un confrère en 30 secondes (sommaire + chapeau).

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
