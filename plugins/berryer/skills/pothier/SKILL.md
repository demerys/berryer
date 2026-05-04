---
name: pothier
description: Méthodologie de consultation juridique française — qualification juridique, règles applicables, application au cas, conclusion. Avec gestion explicite des arguments adverses et des risques. À charger pour les consultations stratégiques, avis juridiques, analyses de risque contractuel, ou quand le client veut savoir "que dois-je faire ?". Inspiré de Robert-Joseph Pothier (1699-1772), dont les traités ont directement inspiré le Code civil.
---

# Skill Pothier — Consultation juridique

Une consultation diffère d'une note de synthèse : elle vise à **conseiller une action**. Elle est explicitement orientée vers la décision du client, pas seulement vers l'exposé du droit.

## Structure (méthode Pothier)

### 1. Qualification juridique des faits
Identifier la nature juridique exacte des éléments du dossier. Cette étape est **critique** : une erreur de qualification fait dérailler tout le reste.

Exemple : un « contrat verbal de prestation de services entre un dirigeant et sa propre société » se qualifie comme convention réglementée (art. L. 225-38 C. com.), pas comme un simple contrat de droit commun. La conséquence pratique change tout.

### 2. Règles juridiques applicables
Liste exhaustive et hiérarchisée :
- Texte(s) législatif(s) ou réglementaire(s) directement applicable(s)
- Jurisprudence de principe (préférer la plus récente émanant de la juridiction la plus haute)
- Doctrine majoritaire si pertinent (Lamy, JurisClasseur, Mémento)
- Pratique professionnelle / usages si codifiés

Pour chaque règle : citer **précisément** (article, attendu).

### 3. Application au cas
Confronte chaque règle aux faits qualifiés. C'est la partie la plus longue. Pour chaque règle :
- Conditions d'application : remplies ? partiellement ? non ?
- Conséquences si la règle s'applique
- Conséquences si elle ne s'applique pas (option B)

### 4. Discussion contradictoire
**Obligation déontologique** : envisager les arguments que pourrait opposer la partie adverse, le contrôleur, le juge. Pour chaque argument adverse :
- Est-il sérieux ? (citer la jurisprudence qui le soutient)
- Comment le neutraliser ? (texte, jurisprudence, fait spécifique de l'espèce)
- À défaut, quel est le risque résiduel ?

### 5. Conclusion + recommandation
La conclusion d'une consultation **doit** comporter :
- Une **réponse claire** à la question posée (oui / non / ça dépend de X)
- Un **niveau de confiance** explicite : « solution certaine », « probable », « discutée », « incertaine »
- Une **recommandation opérationnelle** : « il est conseillé de… », « il convient d'éviter… », « avant toute action, il est nécessaire de… »
- Les **alternatives** envisageables avec leurs avantages/inconvénients respectifs

## Niveaux de confiance — vocabulaire

| Formule | Sens |
|---|---|
| « Certain » | Texte clair + jurisprudence concordante de la Cour suprême |
| « Probable » | Jurisprudence majoritaire mais quelques décisions contraires |
| « Discuté » | Doctrine ou jurisprudence divisée, pas de tranchée |
| « Incertain » | Pas de précédent, ou précédent ancien dépassé |
| « Risqué » | Solution juridiquement défendable mais que la pratique sanctionne |

## Mentions obligatoires

- **Date d'arrêt du droit applicable** : « Au jour de la présente consultation, [date] »
- **Limitation** : « Cette consultation n'engage que sur la base des éléments communiqués »
- **Source des données** : citer les pièces et documents fournis par le client
- **Disclaimer** si la consultation porte sur des données prévisionnelles ou des situations évolutives

## Cas particulier — fiscal

Pour toute question fiscale, **toujours croiser** :
1. Le texte légal (CGI, LPF) — `legifrance_get_article`
2. La doctrine BOFiP correspondante — `legifrance_get_circulaire` ou `legifrance_recherche fond=CIRC`
3. La jurisprudence administrative récente (CE, CAA) — `legifrance_recherche fond=CETAT`

Une consultation fiscale qui omet le BOFiP est incomplète. Délègue à l'agent **colbert** si la matière est dense.

## Format

```markdown
# Consultation — [objet]

**Date** : [date]
**Pièces analysées** : […]

## I. Qualification juridique des faits
[…]

## II. Règles applicables
[…]

## III. Application
[…]

## IV. Discussion contradictoire
[…]

## V. Conclusion et recommandations

**Réponse à la question posée :** […]
**Niveau de confiance :** […]
**Recommandation :** […]
**Alternatives :** […]

---
*Cette consultation n'engage que sur la base des éléments communiqués au [date]. La présente analyse ne saurait dispenser d'une vérification contradictoire ou d'un nouvel examen en cas d'évolution des faits ou du droit.*
```
