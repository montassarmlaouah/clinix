# Chapitre 4 — Technologies et outils utilisés

## 4.1 Langages de programmation

- **Java** : un langage orienté objet permettant de développer des applications fiables et facilement extensibles. Il est couramment associé au framework Spring Boot pour la création d'API ainsi que d'applications backend performantes et structurées.

> **Figure 5 : Logo Java**
>
> *[Insérer ici la capture du logo Java]*

- **TypeScript** : il s'agit d'un sur-ensemble de JavaScript qui introduit le typage statique, ce qui permet de détecter les erreurs plus tôt lors du développement. Il est principalement utilisé avec le framework Angular pour concevoir des applications frontend dynamiques, robustes et faciles à maintenir.

> **Figure 6 : Logo TypeScript**
>
> *[Insérer ici la capture du logo TypeScript]*

---

## 4.2 Framework et bibliothèques

- **Spring Boot (Java)** : un framework léger qui simplifie le développement rapide d'API REST. Il offre des fonctionnalités telles que l'injection de dépendances, la gestion de la sécurité et une bonne compatibilité avec les bases de données relationnelles, ce qui facilite la création d'applications fiables et évolutives.

> **Figure 7 : Logo Spring Boot**
>
> *[Insérer ici la capture du logo Spring Boot]*

- **Angular (TypeScript)** : un framework frontend conçu pour développer des interfaces web interactives et dynamiques. Il favorise une architecture structurée basée sur des composants réutilisables, garantissant ainsi une meilleure organisation du code et de bonnes performances, même pour des applications de grande envergure.

> **Figure 8 : Logo Angular**
>
> *[Insérer ici la capture du logo Angular]*

- **React Native** : framework de développement mobile permettant de concevoir des applications natives multiplateformes (Android et iOS) à partir d'un langage commun, notamment JavaScript et React. Il s'appuie sur une approche orientée composants, favorisant la réutilisabilité du code et une expérience utilisateur fluide, tout en réduisant les coûts et le temps de développement.

> **Figure 9 : Logo React Native**
>
> *[Insérer ici la capture du logo React Native]*

- **Google Gemini API** : API d'intelligence artificielle générative de Google, spécialisée dans le traitement du langage naturel (NLP). Elle permet d'intégrer un assistant conversationnel intelligent directement dans une application web. Dans **Clinix**, cette API alimente le chatbot « Clinix », accessible aux médecins depuis l'interface web : le composant Angular transmet les questions au backend Spring Boot (`/api/chat/ask`), qui appelle le modèle **gemini-2.5-flash** via l'endpoint REST `generativelanguage.googleapis.com`. L'assistant répond en français, guide l'utilisation de la plateforme (patients, rendez-vous, dossiers médicaux) et applique des garde-fous médicaux (rappel de consulter un professionnel de santé, pas de diagnostic définitif). La clé d'API est configurée côté serveur (`gemini-local.properties` ou variable d'environnement `GEMINI_API_KEY`), ce qui garantit la confidentialité des credentials.

> **Figure 19 : Logo Google Gemini**
>
> *[Insérer ici la capture du logo Google Gemini]*

- **Chart.js** : une bibliothèque dédiée à la visualisation de données, utilisée pour créer des graphiques dans les tableaux de bord. Elle se distingue par sa simplicité d'intégration, son aspect visuel attrayant et sa capacité d'adaptation aux différents écrans, ce qui en fait un outil idéal pour des visualisations modernes et interactives.

> **Figure 10 : Logo Chart.js**
>
> *[Insérer ici la capture du logo Chart.js]*

- **OpenPDF** : une bibliothèque Java open source dédiée à la création et à la manipulation de fichiers PDF. Elle permet de générer des documents dynamiques, d'ajouter du texte, des images ou des tableaux, et s'intègre facilement dans des applications backend pour produire des rapports ou des documents automatisés.

> **Figure 11 : Logo OpenPDF**
>
> *[Insérer ici la capture du logo OpenPDF]*

---

## 4.3 Outils logiciels

- **PostgreSQL** : système de gestion de base de données relationnelle performant et open-source. Il est réputé pour sa fiabilité, sa capacité à supporter des requêtes complexes et sa sécurité, ce qui en fait un choix privilégié pour des applications nécessitant une gestion de données robuste.

> **Figure 12 : Logo PostgreSQL**
>
> *[Insérer ici la capture du logo PostgreSQL]*

- **Postman** : outil pour tester les API REST. Postman offre une interface simple à utiliser, prend en charge les tests automatisés et permet une visualisation claire des réponses des API, simplifiant ainsi le processus de test (y compris l'endpoint du chatbot `/api/chat/ask`).

> **Figure 13 : Logo Postman**
>
> *[Insérer ici la capture du logo Postman]*

- **Spring Initializr** : outil de génération de projets Spring Boot. Il permet de gagner du temps lors de la création d'un nouveau projet en fournissant automatiquement une structure prête à l'emploi, ce qui facilite et accélère la mise en place des applications Spring Boot.

> **Figure 15 : Logo Spring Initializr**
>
> *[Insérer ici la capture du logo Spring Initializr]*

- **Google AI Studio** : plateforme web de Google dédiée à la gestion des modèles Gemini. Elle permet de générer et de renouveler les clés d'API, de tester les prompts et de valider le comportement du modèle avant son intégration dans le backend Clinix. C'est l'outil utilisé pour obtenir la clé d'accès au chatbot.

> **Figure 20 : Logo Google AI Studio**
>
> *[Insérer ici la capture du logo Google AI Studio]*

- **TuniseSMS** : plateforme de communication spécialisée dans l'envoi et la gestion de SMS en masse.

> **Figure 16 : Logo TuniseSMS**
>
> *[Insérer ici la capture du logo TuniseSMS]*

- **Visual Studio Code** : éditeur de code léger et extensible, parfait pour le développement frontend. Connu pour ses nombreuses extensions, on l'a utilisé pour TypeScript et Angular.

> **Figure 17 : Logo Visual Studio Code**
>
> *[Insérer ici la capture du logo Visual Studio Code]*

- **IntelliJ IDEA** : environnement de développement intégré performant et polyvalent, spécialement adapté au développement en Java. Grâce à son intégration fluide avec Spring Boot, il constitue un choix privilégié pour la création d'applications backend, notamment le service `GeminiChatService` du chatbot.

> **Figure 18 : Logo IntelliJ IDEA**
>
> *[Insérer ici la capture du logo IntelliJ IDEA]*
