# PlantUML Editor pour Claude Code

Système d'édition collaborative de diagrammes PlantUML entre Claude Code et une interface web.

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   Claude Code   │────▶│  plant-editor-api    │────▶│  PlantUML       │
│   (skill)       │     │  (NestJS)            │     │  Server         │
└─────────────────┘     └──────────────────────┘     │  (existant)     │
                               │                      └─────────────────┘
                               ▼
                        ┌──────────────────────┐
                        │  plant-editor        │
                        │  (React + Monaco)    │
                        └──────────────────────┘
```

## URLs

| Service | URL | Port local |
|---------|-----|------------|
| Frontend | https://plant-editor.kepochan.com | 8092 |
| API | https://plant-editor-api.kepochan.com | 8091 |
| PlantUML Server | https://plant.kepochan.com | 8083 |

## Structure du projet

```
plant-editor/
├── apps/
│   ├── backend/                 # API NestJS
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── config/          # Configuration (API_KEY, PLANTUML_URL)
│   │   │   ├── auth/            # Guard API Key
│   │   │   ├── session/         # Stockage sessions in-memory
│   │   │   ├── diagram/         # CRUD diagrammes + encoding PlantUML
│   │   │   ├── comments/        # CRUD commentaires
│   │   │   └── health/          # Health check
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── frontend/                # React + Vite + Monaco Editor
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── store/           # Zustand store
│       │   ├── services/        # Client API
│       │   ├── components/      # UI components
│       │   └── types/           # TypeScript types
│       ├── Dockerfile
│       ├── nginx.conf
│       └── package.json
│
├── docker-compose.yml           # Config Docker (inclus dans ~/docker-compose.yml)
├── .env                         # Variables d'environnement
└── .env.example
```

## Installation

### Prérequis

- Node.js 20+
- Docker & Docker Compose
- Serveur PlantUML existant (port 8083)
- Traefik configuré avec réseau `proxy`

### Développement local

```bash
# Backend
cd apps/backend
npm install
npm run start:dev
# → http://localhost:3000

# Frontend
cd apps/frontend
npm install --legacy-peer-deps
npm run dev
# → http://localhost:5173
```

### Production (Docker)

```bash
# Depuis ~/plant-editor
cd ~
docker compose up -d --build plant-editor-backend plant-editor-frontend

# Vérifier les logs
docker logs plant-editor-backend
docker logs plant-editor-frontend

# Arrêter
docker compose stop plant-editor-backend plant-editor-frontend
```

## Configuration

### Variables d'environnement (.env)

```bash
# API Keys pour authentification (plusieurs clés séparées par virgule)
PLANT_EDITOR_API_KEYS=cle1,cle2,cle3

# Mot de passe PostgreSQL
POSTGRES_PASSWORD=votre-mot-de-passe

# Générer une nouvelle clé
openssl rand -hex 32
```

### Backend (apps/backend/src/config/config.service.ts)

| Variable | Default | Description |
|----------|---------|-------------|
| `API_KEYS` | `dev-api-key` | Clés API séparées par virgule |
| `PLANTUML_SERVER_URL` | `http://localhost:8083` | URL interne PlantUML |
| `PLANTUML_PUBLIC_URL` | `https://plant.kepochan.com` | URL publique PlantUML |
| `PORT` | `3000` | Port du serveur |
| `CORS_ORIGIN` | `*` | Origine CORS autorisée |
| `DATABASE_*` | - | Configuration PostgreSQL |

### Frontend (variables Vite)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | URL de l'API backend |
| `VITE_API_KEY` | Clé API |

## API Reference

### Authentification

Toutes les routes (sauf `/health`) requièrent le header :
```
X-API-Key: votre-cle-api
```

### Endpoints

#### Health Check
```
GET /health
→ { "status": "ok", "timestamp": "..." }
```

#### Créer/Mettre à jour un diagramme
```
POST /diagram
Content-Type: application/json
X-API-Key: xxx

{
  "sessionId": "uuid-de-session",
  "code": "@startuml\n...\n@enduml"
}

→ {
  "success": true,
  "imageUrl": "https://plant.kepochan.com/png/...",
  "svgUrl": "https://plant.kepochan.com/svg/...",
  "code": "...",
  "previousCode": "..." | null,
  "version": 1
}
```

#### Récupérer un diagramme
```
GET /diagram?sessionId=xxx
X-API-Key: xxx

→ {
  "code": "...",
  "imageUrl": "...",
  "svgUrl": "...",
  "previousCode": "...",
  "version": 1,
  "history": [...]
}
```

#### Lister les commentaires
```
GET /comments?sessionId=xxx
X-API-Key: xxx

→ {
  "comments": [
    {
      "id": "uuid",
      "text": "Ajouter validation ici",
      "startLine": 5,
      "endLine": 7,
      "codeSnapshot": "lignes sélectionnées",
      "createdAt": "2024-...",
      "author": "optional"
    }
  ]
}
```

#### Ajouter un commentaire
```
POST /comments
Content-Type: application/json
X-API-Key: xxx

{
  "sessionId": "xxx",
  "text": "Mon commentaire",
  "startLine": 5,
  "endLine": 7,
  "author": "optional"
}

→ { "id": "...", "text": "...", ... }
```

#### Supprimer un commentaire
```
DELETE /comments/:id?sessionId=xxx
X-API-Key: xxx

→ { "success": true, "message": "Comment deleted" }
```

#### Supprimer tous les commentaires
```
DELETE /comments?sessionId=xxx
X-API-Key: xxx

→ { "success": true, "message": "All comments cleared" }
```

## Skill Claude Code

Le skill est inclus dans le projet sous `.claude/skills/plantuml/SKILL.md`.

### Installation sur un nouveau poste

1. **Générer une API key** :
   ```bash
   openssl rand -hex 32
   ```

2. **Ajouter la clé sur le serveur** :
   - Éditer `.env` sur le serveur
   - Ajouter la nouvelle clé à `PLANT_EDITOR_API_KEYS` (séparée par virgule)
   - Redéployer : `docker compose up -d plant-editor-backend`

3. **Configurer le poste local** :
   ```bash
   echo 'export PLANT_EDITOR_API_KEY="votre-nouvelle-cle"' >> ~/.zshrc
   source ~/.zshrc
   ```

4. **Cloner et utiliser** :
   ```bash
   git clone git@github.com:kepochan/plant-editor.git
   cd plant-editor
   claude  # Le skill /plantuml est disponible automatiquement
   ```

### Utilisation

1. **Commande slash** : `/plantuml` charge les instructions
2. **Demande directe** : "Crée un diagramme de séquence pour..."

### Workflow

1. Claude génère un UUID de session
2. Claude crée le code PlantUML selon les conventions
3. Claude envoie à l'API via curl
4. L'utilisateur consulte le rendu sur le frontend
5. L'utilisateur ajoute des commentaires sur les lignes
6. L'utilisateur demande à Claude d'itérer
7. Claude récupère les commentaires et modifie le code
8. Répéter jusqu'à satisfaction
9. Sauvegarder le fichier .puml dans le projet

### Conventions PlantUML

Le skill applique automatiquement ces règles :

- **`autonumber`** : Toujours activé
- **Box colorées** :
  - Frontend : `#LightBlue`
  - Backend : `#LightGreen`
  - Services externes : `#LightCoral`
- **Participants** : Trigrammes/4 lettres (usr, api, db, auth)
- **Retours** : `-->` (flèche pointillée)
- **Jamais** : `activate` / `deactivate`

### Templates disponibles

- Sequence diagram
- Class diagram
- Activity diagram
- Component diagram

## Frontend Features

- **Monaco Editor** : Éditeur de code avec syntax highlighting PlantUML
- **Diff Viewer** : Comparaison entre version actuelle et précédente
- **Commentaires** : Sélection de lignes pour ajouter des commentaires contextuels
- **Export** : PNG, SVG, copier le code
- **Zoom/Pan** : Navigation dans les grands diagrammes
- **Thème** : Sombre / Clair
- **Raccourci** : Ctrl+Enter pour render

## Persistance

Les données sont stockées dans **PostgreSQL** :
- Diagrammes avec versioning (100 versions max par diagramme)
- Commentaires liés aux lignes de code
- Persistance complète (survit aux redémarrages)

## Développement

### Backend

```bash
cd apps/backend

# Dev avec hot reload
npm run start:dev

# Build
npm run build

# Lint
npm run lint
```

### Frontend

```bash
cd apps/frontend

# Dev
npm run dev

# Build
npm run build

# Preview build
npm run preview
```

### Modifier le skill

Éditer `~/.claude/commands/plantuml.md` pour :
- Changer l'API key
- Ajouter des templates
- Modifier les conventions

## Dépendances principales

### Backend
- NestJS 10
- class-validator / class-transformer
- pako (compression PlantUML)
- uuid

### Frontend
- React 19
- Vite 7
- Monaco Editor (@monaco-editor/react)
- react-diff-viewer-continued
- Zustand (state management)
- Tailwind CSS 4
- Lucide React (icônes)

## Troubleshooting

### Erreur Monaco "language definition does not contain attribute"

Le `@` est un caractère spécial dans Monaco Monarch. Utiliser `@@` pour l'échapper :
```javascript
[/@@startuml|@@enduml/, 'keyword.control']
```

### Erreur peer dependencies React 19

```bash
npm install --legacy-peer-deps
```

### Container ne démarre pas

```bash
# Voir les logs
docker logs plant-editor-backend
docker logs plant-editor-frontend

# Rebuild complet
docker compose build --no-cache plant-editor-backend plant-editor-frontend
```

### API renvoie 401

Vérifier que le header `X-API-Key` est correct et que la clé est présente dans `PLANT_EDITOR_API_KEYS` dans `.env` sur le serveur.

## Améliorations possibles

- [x] ~~Persistance des sessions (PostgreSQL)~~
- [ ] Authentification utilisateur
- [x] ~~Historique avec versioning~~
- [ ] Collaboration temps réel (WebSocket)
- [ ] Prévisualisation live pendant l'édition
- [ ] Plus de templates PlantUML
- [ ] Export PDF
- [ ] Intégration Git (commit direct des .puml)

## Licence

Projet interne.
