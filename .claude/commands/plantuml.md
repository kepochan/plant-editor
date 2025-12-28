---
description: Créer ou éditer un diagramme PlantUML
allowed-tools: Bash(curl -X POST https://plant-editor-api.kepochan.com/*), Bash(curl https://plant-editor-api.kepochan.com/*), Bash(uuidgen), Read, Write, Glob
argument-hint: <description du diagramme>
---

# PlantUML Editor

Crée ou édite un diagramme PlantUML via Plant Editor.

**Demande:** $ARGUMENTS

## Comportement

- **Sois CONCIS** : pas d'explications, pas de récapitulatif, juste le lien
- Ne demande rien sauf si un commentaire est ambigu
- Après création/modification, donne UNIQUEMENT le lien : `https://plant-editor.kepochan.com/diagram/<UUID>`
- Ne propose PAS de sauvegarder dans un fichier sauf si demandé
- **ATTENTION** : Le lien utilisateur est sur `plant-editor.kepochan.com`, PAS sur `plant-editor-api.kepochan.com`

## API

```bash
# Créer/Modifier
curl -X POST https://plant-editor-api.kepochan.com/diagram \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $PLANT_EDITOR_API_KEY" \
  -d '{"sessionId": "<UUID>", "code": "@startuml\n...\n@enduml"}'

# Récupérer commentaires
curl "https://plant-editor-api.kepochan.com/comments?sessionId=<UUID>" \
  -H "X-API-Key: $PLANT_EDITOR_API_KEY"
```

## Conventions PlantUML

1. **`title`** - OBLIGATOIRE, toujours mettre un titre descriptif
2. **`autonumber`** - Toujours activer la numérotation automatique
3. **Box colorées** pour les macro-composants :
   - Frontend : `#LightBlue`
   - Backend : `#LightGreen`
   - Services externes : `#LightCoral`
4. **Participants** - Noms en trigramme ou 4 lettres minuscules (ex: `usr`, `api`, `db`, `auth`)
5. **Retours** - Toujours utiliser `-->` (flèche pointillée) pour les réponses
6. **JAMAIS utiliser** `activate` / `deactivate`

## Templates

### Sequence Diagram
```plantuml
@startuml
title Titre du diagramme
autonumber

box "Frontend" #LightBlue
  participant usr as "User"
  participant web as "WebApp"
end box

box "Backend" #LightGreen
  participant api as "API"
  participant auth as "Auth"
  participant db as "Database"
end box

box "External" #LightCoral
  participant ext as "External Service"
end box

usr -> web: Action
web -> api: Request
api -> auth: Validate
auth --> api: OK
api -> db: Query
db --> api: Data
api -> ext: Call
ext --> api: Response
api --> web: Result
web --> usr: Display

@enduml
```

### Class Diagram
```plantuml
@startuml
title Titre du diagramme

package "Domain" #LightGreen {
  class User {
    - id: string
    - name: string
    + getName(): string
  }

  class Order {
    - id: string
    - items: Item[]
    + getTotal(): number
  }
}

package "Infrastructure" #LightBlue {
  class UserRepository {
    + find(id): User
    + save(user): void
  }
}

User "1" -- "*" Order : places

@enduml
```

### Activity Diagram
```plantuml
@startuml
title Titre du diagramme

start

:Receive Request;

if (Authenticated?) then (yes)
  :Process Request;
  if (Valid?) then (yes)
    :Execute Action;
    :Return Success;
  else (no)
    :Return Validation Error;
  endif
else (no)
  :Return 401 Unauthorized;
endif

stop

@enduml
```

### Component Diagram
```plantuml
@startuml
title Titre du diagramme

package "Frontend" #LightBlue {
  [WebApp]
  [Mobile App]
}

package "Backend" #LightGreen {
  [API Gateway]
  [Auth Service]
  [User Service]
  [Order Service]
}

package "Data" #LightCoral {
  database "PostgreSQL" as db
  database "Redis" as cache
}

[WebApp] --> [API Gateway]
[Mobile App] --> [API Gateway]
[API Gateway] --> [Auth Service]
[API Gateway] --> [User Service]
[API Gateway] --> [Order Service]
[User Service] --> db
[Order Service] --> db
[Auth Service] --> cache

@enduml
```
