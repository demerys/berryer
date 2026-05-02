---
description: Veille juridique sur un thème ou un texte donné (délègue à l'agent Dupin)
argument-hint: <thématique ou texte à surveiller>
---

Lance une veille juridique sur : **$ARGUMENTS**.

Délègue cette tâche à l'agent **dupin** (spécialisé dans la veille juridique). Demande-lui de :

1. Identifier le périmètre exact (article, code entier, thématique transverse)
2. Rechercher les modifications sur les 12 derniers mois (sauf instruction contraire de l'utilisateur)
3. Pour chaque modification : citer le texte modificateur (loi/décret/ordonnance), la date, l'objet
4. Restituer sous forme de tableau chronologique avec liens Légifrance

Si l'agent rapporte des modifications majeures, propose ensuite de basculer vers l'agent **portalis** pour rédiger une note de synthèse, ou **cassin** pour identifier la jurisprudence récente liée.
