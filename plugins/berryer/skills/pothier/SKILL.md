---
name: pothier
description: Méthodologie de consultation juridique française — qualification juridique, règles applicables, application au cas, conclusion. Avec gestion explicite des arguments adverses et des risques. À charger pour les consultations stratégiques, avis juridiques, analyses de risque contractuel, ou quand le client veut savoir "que dois-je faire ?". Inspiré de Robert-Joseph Pothier (1699-1772), dont les traités ont directement inspiré le Code civil.
---

# Skill Pothier — Consultation juridique

Une consultation diffère d'une note de synthèse : elle vise à **conseiller une action**. Elle est explicitement orientée vers la décision du client, pas seulement vers l'exposé du droit.

## En-tête obligatoire de TOUTE consultation

**Chaque consultation produite doit commencer par ce bandeau, sans exception.** Y compris pour les réponses courtes. Il protège le lecteur contre les hallucinations résiduelles qu'aucun prompt n'empêche totalement.

> **⚠️ Consultation de recherche — vérification finale par le professionnel**
>
> Cette consultation s'appuie sur des sources officielles consultées via l'API Légifrance. Avant tout usage opérationnel :
> 1. **Cliquer sur chaque lien Légifrance** cité pour ouvrir le texte source.
> 2. **Lire le titre du texte cible** et vérifier qu'il correspond bien à la branche, à la juridiction ou à la matière annoncée. Un identifiant Légifrance valide peut renvoyer à un texte d'une autre convention collective ou d'un autre code que celui visé — le titre seul fait foi.
> 3. **Confirmer la version en vigueur** à la date d'application visée (le droit évolue, les avenants se succèdent).

## Self-check final obligatoire — appel de `validate_note` AVEC `expected_context`

**Avant de remettre la consultation au lecteur, tu DOIS appeler `validate_note` avec ta consultation finale ET le paramètre `expected_context`** qui dit ce que la consultation prétend couvrir. Format :

```
validate_note({
  note: "<ta consultation finale en markdown>",
  expected_context: {
    code: "Code civil",          // si tu cites des LEGIARTI
    branche: "coiffure",         // si tu cites une CCN
    idcc: "2596",
    juridiction: "Cour de cassation"  // si tu cites des arrêts
  }
})
```

**Sans `expected_context`, le tool ne fait pas le cross-check sémantique** — il se contente de lister, à toi de comparer (et le LLM rate régulièrement ce cross-check). Avec `expected_context`, le tool retourne `isError: true` si une référence est invalide OU mal attribuée (piège des branches : un avenant CCN voisine cité comme l'avenant cible).

Tu traites les flags :

- **Référence non vérifiable** → retirée ou remplacée par « à confirmer (référence non vérifiée) ».
- **🚨 PIÈGE DES BRANCHES DÉTECTÉ** → retirée et remplacée via `legifrance_recherche` ciblée, ou par « à confirmer ».
- **Référence valide et bien attribuée** → conservée.

Étape non négociable. Le poids d'une consultation tient à la fiabilité de ses références — une seule référence mal attribuée discrédite toute la recommandation. Ré-appelle après correction jusqu'à ce que `isError: false`.

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
2. La doctrine BOFiP correspondante — `bofip_get_document` ou `bofip_recherche` (open data DGFiP)
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
