import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
} from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const noBorder = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after ?? 160, line: 360 },
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    children: [
      new TextRun({
        text,
        bold: opts.bold,
        italics: opts.italics,
        size: opts.size ?? 24,
        font: 'Times New Roman',
      }),
    ],
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 200 },
    children: [new TextRun({ text, bold: true, size: 28, font: 'Times New Roman' })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 160 },
    children: [new TextRun({ text, bold: true, size: 26, font: 'Times New Roman' })],
  });
}

function bullet(text) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 120, line: 360 },
    children: [new TextRun({ text, size: 24, font: 'Times New Roman' })],
  });
}

function tableRow(cells, header = false) {
  return new TableRow({
    children: cells.map(
      (text) =>
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: noBorder,
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text,
                  bold: header,
                  size: 22,
                  font: 'Times New Roman',
                }),
              ],
            }),
          ],
        })
    ),
  });
}

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: 'Times New Roman', size: 24 },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: [
        p('Chapitre X — Hébergement et déploiement de l\'application Clinix', {
          bold: true,
          center: true,
          size: 32,
          after: 120,
        }),
        p('Résumé — Version condensée (5 pages)', { center: true, italics: true, after: 320 }),

        h1('X.1 Introduction'),
        p(
          "Après le développement de la plateforme Clinix (backend Spring Boot, frontend Angular, base PostgreSQL), l'objectif était de rendre l'application accessible en ligne pour une utilisation réelle. Ce chapitre décrit le déploiement sur un VPS Contabo et la configuration du domaine cliniix.tech via le registrar Porkbun (porkbun.com)."
        ),
        p('Les objectifs du déploiement sont les suivants :'),
        bullet("Rendre l'application accessible depuis Internet via une adresse stable ;"),
        bullet('Garantir la disponibilité du backend et du frontend ;'),
        bullet("Sécuriser l'accès grâce à un nom de domaine et, en option, au protocole HTTPS."),
        p(
          "Le déploiement a été réalisé sans Docker : Java, PostgreSQL et Nginx sont installés directement sur le serveur, ce qui offre un contrôle fin de l'environnement et facilite le débogage."
        ),

        h1('X.2 Choix de l\'infrastructure'),
        h2('X.2.1 Hébergeur : Contabo'),
        p(
          'Contabo a été retenu pour son rapport qualité/prix, ses ressources suffisantes (CPU, RAM, SSD) et son accès root complet via SSH. Le VPS Cloud VPS 10 SSD tourne sous Ubuntu 24.04 LTS, avec l\'adresse IP publique 13.140.157.238 (hostname vmi3356840).'
        ),
        h2('X.2.2 Registrar : Porkbun'),
        p(
          'Le domaine cliniix.tech a été enregistré chez Porkbun pour ses tarifs compétitifs sur l\'extension .tech, sa gestion DNS intégrée et son interface simple. Le domaine est verrouillé contre le transfert et la suppression accidentelle, avec une expiration prévue le 10 juin 2027.'
        ),
        h2('X.2.3 Architecture de déploiement'),
        p(
          "L'architecture suit un modèle classique en trois couches. Les requêtes Internet passent d'abord par les serveurs DNS Porkbun, qui résolvent cliniix.tech vers l'IP du VPS. Sur le serveur, Nginx (ports 80/443) sert le frontend Angular statique (/var/www/clinix) et agit comme reverse proxy pour les routes /api/ et /auth/ vers le backend Spring Boot (port 8080). PostgreSQL (port 5432, base PFE2) stocke les données en local."
        ),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            tableRow(['Composant', 'Technologie / Emplacement'], true),
            tableRow(['Frontend', 'Angular 19 — /var/www/clinix']),
            tableRow(['Backend', 'Spring Boot 3.5 / Java 17 — port 8080']),
            tableRow(['Base de données', 'PostgreSQL 16 — base PFE2']),
            tableRow(['Reverse proxy', 'Nginx 1.24']),
            tableRow(['Domaine', 'cliniix.tech (Porkbun)']),
          ],
        }),

        h1('X.3 Préparation du serveur'),
        p(
          "La connexion s'effectue par SSH (ssh root@13.140.157.238). Le système est mis à jour (apt update && apt upgrade), puis le pare-feu UFW est configuré pour autoriser les ports 22 (SSH), 80 (HTTP) et 443 (HTTPS)."
        ),
        p(
          'Les dépendances installées sont : OpenJDK 17, PostgreSQL, Nginx, Node.js/npm, Git et Maven. Une base PostgreSQL PFE2 et un utilisateur clinix sont créés, puis testés par une requête SELECT 1.'
        ),

        h1('X.4 Déploiement backend et frontend'),
        h2('X.4.1 Backend Spring Boot'),
        p(
          "Le code source est cloné depuis GitHub dans /opt/clinix. Le fichier application-prod.properties configure la connexion PostgreSQL, le port 8080, les URLs de facturation (www.cliniix.tech) et désactive Flyway (spring.flyway.enabled=false) pour éviter les erreurs sur base vide. Le JAR est compilé avec Maven, puis démarré comme service systemd clinix-backend. L'endpoint /api/health retourne {\"status\":\"UP\"}. Au premier lancement, deux comptes Super Admin sont créés automatiquement."
        ),
        h2('X.4.2 Frontend Angular'),
        p(
          "Le frontend est compilé en mode production (npm ci && npm run build) dans /opt/clinix/Frontend. Les fichiers statiques générés (dist/pfe/browser/) sont copiés vers /var/www/clinix et les permissions sont attribuées à www-data."
        ),
        h2('X.4.3 Configuration Nginx'),
        p(
          "Nginx écoute sur le port 80 pour les noms cliniix.tech et www.cliniix.tech. Les routes /api/ et /auth/ sont proxifiées vers localhost:8080 ; la route / utilise try_files pour le routage SPA Angular. Le site par défaut est supprimé et la configuration est validée (nginx -t) avant rechargement."
        ),

        h1('X.5 Configuration du domaine cliniix.tech'),
        p(
          'Chez Porkbun, deux enregistrements DNS de type A pointent @ et www vers 13.140.157.238. Les nameservers utilisés sont ceux par défaut de Porkbun (curitiba, fortaleza, maceio, salvador.ns.porkbun.com). La propagation DNS prend de quelques minutes à 24 heures.'
        ),
        p(
          "L'application est accessible à l'adresse http://www.cliniix.tech/login, affichant la page « Portail Médical ». Pour activer HTTPS, Certbot avec Let's Encrypt peut être installé sur le VPS (certbot --nginx -d cliniix.tech -d www.cliniix.tech)."
        ),
        p('[Figure X.13 — Capture Porkbun : panneau de gestion du domaine cliniix.tech]', {
          italics: true,
          center: true,
        }),

        h1('X.6 Tests, difficultés et synthèse'),
        h2('X.6.1 Validation'),
        p('Les tests techniques (curl) et fonctionnels (navigateur) confirment le bon fonctionnement :'),
        bullet('Accès par IP et par domaine vers la page de connexion ;'),
        bullet('Authentification Super Admin opérationnelle ;'),
        bullet('API /api/health retournant status UP.'),
        h2('X.6.2 Difficultés rencontrées'),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            tableRow(['Problème', 'Solution'], true),
            tableRow(['Backend Exit 1 (Flyway)', 'spring.flyway.enabled=false']),
            tableRow(['Page Nginx par défaut', 'Suppression default + déploiement /var/www/clinix']),
            tableRow(['Chemin build Angular', 'dist/pfe/browser/ au lieu de dist/browser/']),
            tableRow(['Erreur CORS localhost:8080', 'URLs relatives + proxy Nginx /auth/']),
            tableRow(['Domaine inaccessible', 'Attente propagation DNS Porkbun']),
          ],
        }),
        h2('X.6.3 Synthèse'),
        p(
          "L'environnement de production final combine Contabo (VPS Ubuntu 24.04, IP 13.140.157.238), Porkbun (domaine cliniix.tech), Spring Boot, Angular, PostgreSQL et Nginx. L'application Clinix est publiquement accessible à http://www.cliniix.tech/login, validant ainsi la chaîne complète du projet : développement, intégration, déploiement et mise en production."
        ),
        p('— Fin du résumé —', { center: true, italics: true, after: 0 }),
      ],
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
const outPath = path.join(__dirname, 'chapitre_hebergement_contabo_resume_5pages.docx');
fs.writeFileSync(outPath, buffer);
console.log('Document créé :', outPath);
