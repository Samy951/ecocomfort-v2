# 🚀 Sprint Planning - EcoComfort v2

> **Projet RNCP Niveau 6** - Développement par tickets pour un environnement contrôlé et traçable

## 📋 Vue d'ensemble

**Durée totale** : 3 jours (20h de développement)
**Approche** : Un ticket = Une fonctionnalité = Un commit
**Méthode** : Implémentation → Tests manuels → Tests unitaires → Validation

---

## 🏗️ Sprint 1 : Infrastructure de Base
**Période** : Jour 1 (4h restantes)
**Objectif** : Fondations solides pour le développement

### ECO-001 : Configuration TypeORM
**Priorité** : P0 (Bloquant)
**Temps estimé** : 30 min
**Assigné** : Backend

**Description** :
Configuration complète de TypeORM avec PostgreSQL pour gérer les entités et la synchronisation automatique.

**Critères d'acceptation** :
- [ ] Configuration TypeORM dans app.module.ts
- [ ] Connexion PostgreSQL fonctionnelle
- [ ] Variable d'environnement DATABASE_URL utilisée
- [ ] Synchronisation automatique activée (development only)
- [ ] Test de connexion avec `npm run start:dev`

**Livrables** :
- `backend/src/app.module.ts` configuré
- Connexion DB vérifiée dans les logs

---

### ECO-002 : Entités de Base de Données
**Priorité** : P0 (Bloquant)
**Temps estimé** : 45 min
**Assigné** : Backend
**Dépendances** : ECO-001

**Description** :
Création des entités TypeORM pour modéliser les données principales du système.

**Critères d'acceptation** :
- [ ] Entité `User` (id, email, password, name, points, level)
- [ ] Entité `DoorState` (id, isOpen, timestamp, durationSeconds)
- [ ] Entité `SensorReading` (id, sensorId, temperature, humidity, pressure)
- [ ] Entité `EnergyMetric` (id, doorStateId, energyLossWatts, costEuros)
- [ ] Entité `UserBadge` (id, userId, badgeType, earnedAt)
- [ ] Relations TypeORM correctement définies
- [ ] Tables créées automatiquement en base

**Livrables** :
- `backend/src/shared/entities/*.entity.ts`
- Vérification des tables PostgreSQL

---

### ECO-003 : Service Configuration Global
**Priorité** : P1
**Temps estimé** : 30 min
**Assigné** : Backend
**Dépendances** : ECO-001

**Description** :
Configuration centralisée pour les variables d'environnement et les constantes métier.

**Critères d'acceptation** :
- [ ] Configuration @nestjs/config setup
- [ ] Interface pour les variables d'environnement
- [ ] Validation des variables critiques au démarrage
- [ ] Constantes métier (surface porte, coefficient thermique, prix kWh)

**Livrables** :
- `backend/src/shared/config/config.service.ts`
- Variables d'environnement validées

---

### ECO-004 : Structure Modules NestJS
**Priorité** : P1
**Temps estimé** : 45 min
**Assigné** : Backend
**Dépendances** : ECO-002

**Description** :
Création de la structure modulaire NestJS avec tous les modules métier.

**Critères d'acceptation** :
- [ ] SensorsModule (door + ruuvi parsing)
- [ ] MqttModule (broker connection)
- [ ] EnergyModule (calculations + weather)
- [ ] WebSocketModule (real-time updates)
- [ ] AuthModule (JWT simple)
- [ ] DashboardModule (API endpoints)
- [ ] GamificationModule (points/badges)
- [ ] Imports corrects dans app.module.ts

**Livrables** :
- `backend/src/*/module.ts` pour chaque module
- Architecture modulaire fonctionnelle

---

### ECO-005 : Seeders Utilisateurs
**Priorité** : P2
**Temps estimé** : 20 min
**Assigné** : Backend
**Dépendances** : ECO-002

**Description** :
Création d'utilisateurs de test pour le développement et la démonstration.

**Critères d'acceptation** :
- [ ] Service de seeding
- [ ] 2 utilisateurs : admin@ecocomfort.com / user@ecocomfort.com
- [ ] Mots de passe hashés avec bcrypt
- [ ] Script npm pour executer le seeding

**Livrables** :
- `backend/src/shared/seeders/user.seeder.ts`
- Commande `npm run seed:users`

---

## 🔧 Sprint 2 : Services Métier
**Période** : Jour 2 (8h)
**Objectif** : Implémentation de la logique business core

### ECO-006 : Service MQTT Broker
**Priorité** : P0 (Bloquant)
**Temps estimé** : 60 min
**Assigné** : Backend
**Dépendances** : ECO-001

**Description** :
Connexion au broker MQTT et gestion des topics pour les capteurs IoT.

**Critères d'acceptation** :
- [ ] Connexion au broker admin-hetic.arcplex.tech:8827
- [ ] Subscription aux topics configurables
- [ ] Gestion des reconnexions automatiques
- [ ] Logs détaillés des messages reçus
- [ ] Service injectable dans d'autres modules

**Livrables** :
- `backend/src/mqtt/mqtt.service.ts`
- Connexion MQTT fonctionnelle

---

### ECO-007 : Parser ESP8266 Door Sensor
**Priorité** : P0 (Bloquant)
**Temps estimé** : 45 min
**Assigné** : Backend
**Dépendances** : ECO-006

**Description** :
Parsing des messages ESP8266 pour détecter l'état de la porte (ouvert/fermé).

**Critères d'acceptation** :
- [ ] Topic `sensor/door_sensor/RESULT` parsé
- [ ] Format JSON `{"Switch1": {"Action": "ON/OFF"}}` supporté
- [ ] Logique OFF = ouvert, ON = fermé
- [ ] Création automatique d'événements DoorState
- [ ] Calcul de la durée d'ouverture

**Livrables** :
- `backend/src/sensors/door.service.ts`
- Parsing ESP8266 fonctionnel

---

### ECO-008 : Parser RuuviTag Sensors
**Priorité** : P0 (Bloquant)
**Temps estimé** : 45 min
**Assigné** : Backend
**Dépendances** : ECO-006

**Description** :
Parsing des 3 capteurs RuuviTag pour les données environnementales.

**Critères d'acceptation** :
- [ ] Topic `pws-packet/202481598160802/+` parsé
- [ ] Support des 3 sensor IDs (944372022, 422801533, 1947698524)
- [ ] Extraction température, humidité, pression atmosphérique
- [ ] Stockage en base avec timestamp
- [ ] Calcul de température moyenne des 3 capteurs

**Livrables** :
- `backend/src/sensors/ruuvi.parser.ts`
- Parsing RuuviTag fonctionnel

---

### ECO-009 : Service OpenWeather API
**Priorité** : P1
**Temps estimé** : 30 min
**Assigné** : Backend

**Description** :
Intégration OpenWeather API pour récupérer la température extérieure.

**Critères d'acceptation** :
- [ ] Intégration API avec axios
- [ ] Cache des données (TTL 10 minutes)
- [ ] Gestion des erreurs et fallback
- [ ] Configuration lat/lon depuis .env
- [ ] Format de réponse standardisé

**Livrables** :
- `backend/src/energy/weather.service.ts`
- API OpenWeather intégrée

---

### ECO-010 : Service Calcul Énergétique
**Priorité** : P0 (Bloquant)
**Temps estimé** : 60 min
**Assigné** : Backend
**Dépendances** : ECO-007, ECO-008, ECO-009

**Description** :
Calculs en temps réel des pertes énergétiques basés sur les ouvertures de porte.

**Critères d'acceptation** :
- [ ] Formule : Watts = ΔT × Surface × U-coefficient × (durée/3600)
- [ ] Température intérieure = moyenne des 3 RuuviTag
- [ ] Température extérieure depuis OpenWeather
- [ ] Conversion en coût euros (€0.174/kWh)
- [ ] Calcul émissions CO2 (56g/kWh)
- [ ] Stockage des métriques énergétiques

**Livrables** :
- `backend/src/energy/energy.service.ts`
- Calculs énergétiques fonctionnels

---

### ECO-011 : WebSocket Gateway
**Priorité** : P1
**Temps estimé** : 45 min
**Assigné** : Backend
**Dépendances** : ECO-007, ECO-010

**Description** :
Gateway WebSocket pour les mises à jour temps réel vers le frontend.

**Critères d'acceptation** :
- [ ] Configuration Socket.io
- [ ] Événements door-state-changed
- [ ] Événements energy-metrics-updated
- [ ] Événements sensor-data-updated
- [ ] Gestion des connexions/déconnexions
- [ ] Latence < 100ms

**Livrables** :
- `backend/src/websocket/websocket.gateway.ts`
- WebSocket temps réel fonctionnel

---

### ECO-012 : Authentification JWT
**Priorité** : P1
**Temps estimé** : 45 min
**Assigné** : Backend
**Dépendances** : ECO-002

**Description** :
Système d'authentification simple avec JWT pour sécuriser les APIs.

**Critères d'acceptation** :
- [ ] Strategy JWT avec Passport
- [ ] Login endpoint avec email/password
- [ ] Génération token JWT (TTL 7 jours)
- [ ] Guard pour protéger les routes
- [ ] Middleware d'autorisation

**Livrables** :
- `backend/src/auth/jwt.strategy.ts`
- `backend/src/auth/auth.guard.ts`
- Authentification JWT fonctionnelle

---

### ECO-013 : Controller Dashboard API
**Priorité** : P1
**Temps estimé** : 60 min
**Assigné** : Backend
**Dépendances** : ECO-010, ECO-012

**Description** :
Endpoints API pour alimenter le dashboard avec les données temps réel.

**Critères d'acceptation** :
- [ ] GET /api/sensors (état actuel capteurs)
- [ ] GET /api/energy/current (métriques temps réel)
- [ ] GET /api/energy/daily (rapport journalier)
- [ ] GET /api/energy/history (historique)
- [ ] Protection JWT sur toutes les routes
- [ ] Pagination pour l'historique

**Livrables** :
- `backend/src/dashboard/dashboard.controller.ts`
- APIs dashboard fonctionnelles

---

### ECO-014 : Service Gamification
**Priorité** : P2
**Temps estimé** : 45 min
**Assigné** : Backend
**Dépendances** : ECO-002, ECO-007

**Description** :
Système de points et badges pour engager les utilisateurs dans les économies d'énergie.

**Critères d'acceptation** :
- [ ] Attribution points automatique (fermeture rapide +5pts)
- [ ] Système de niveaux (Bronze/Silver/Gold)
- [ ] 6 badges configurables
- [ ] Calcul de streaks journaliers
- [ ] API endpoints gamification

**Livrables** :
- `backend/src/gamification/gamification.service.ts`
- Système gamification fonctionnel

---

### ECO-015 : Tests MQTT Manuels
**Priorité** : P1
**Temps estimé** : 30 min
**Assigné** : Backend/IoT
**Dépendances** : ECO-007, ECO-008

**Description** :
Tests manuels avec les vrais capteurs pour valider le parsing MQTT.

**Critères d'acceptation** :
- [ ] Réception messages ESP8266 confirmée
- [ ] Réception messages 3 RuuviTag confirmée
- [ ] Logs détaillés des messages parsés
- [ ] Vérification données en base PostgreSQL
- [ ] Tests de reconnexion MQTT

**Livrables** :
- Tests documentés
- Capture d'écran des logs

---

## 🔗 Sprint 3 : Intégration et Finalisation
**Période** : Jour 3 (8h)
**Objectif** : Intégration frontend, tests, et livraison

### ECO-016 : Tests Unitaires Services Core
**Priorité** : P1
**Temps estimé** : 90 min
**Assigné** : Backend
**Dépendances** : ECO-007, ECO-008, ECO-010

**Description** :
Tests unitaires pour les services critiques avec les helpers mockers.ts.

**Critères d'acceptation** :
- [ ] Tests DoorService avec mocks MQTT
- [ ] Tests EnergyService avec mock WeatherService
- [ ] Tests WebSocketGateway avec mocks Socket.io
- [ ] Coverage > 70% sur les services core
- [ ] Utilisation systematique de mockers.ts

**Livrables** :
- `backend/src/**/*.spec.ts`
- Rapport coverage Jest

---

### ECO-017 : Configuration Frontend APIs
**Priorité** : P0 (Bloquant)
**Temps estimé** : 45 min
**Assigné** : Frontend
**Dépendances** : ECO-013

**Description** :
Adaptation du frontend React pour utiliser les nouvelles APIs NestJS.

**Critères d'acceptation** :
- [ ] Configuration axios vers localhost:3000/api
- [ ] WebSocket client vers localhost:3000
- [ ] Mise à jour des hooks useApiData
- [ ] Adaptation des types TypeScript
- [ ] Test de connexion frontend ↔ backend

**Livrables** :
- `frontend/src/services/api.ts` modifié
- Frontend connecté au nouveau backend

---

### ECO-018 : Tests Intégration WebSocket
**Priorité** : P1
**Temps estimé** : 30 min
**Assigné** : Full-stack
**Dépendances** : ECO-011, ECO-017

**Description** :
Tests d'intégration pour vérifier les mises à jour temps réel frontend ↔ backend.

**Critères d'acceptation** :
- [ ] Messages WebSocket reçus dans React
- [ ] Mise à jour automatique des composants
- [ ] Latence < 100ms mesurée
- [ ] Pas de déconnexions intempestives
- [ ] Gestion des erreurs réseau

**Livrables** :
- Tests WebSocket documentés
- Métriques de performance

---

### ECO-019 : Tests E2E avec Supertest
**Priorité** : P1
**Temps estimé** : 60 min
**Assigné** : Backend
**Dépendances** : ECO-012, ECO-013

**Description** :
Tests end-to-end pour valider les parcours utilisateur complets.

**Critères d'acceptation** :
- [ ] Test flow authentification complet
- [ ] Test récupération données dashboard
- [ ] Test calculs énergétiques bout en bout
- [ ] Test attribution points gamification
- [ ] Validation format des réponses API

**Livrables** :
- `backend/test/app.e2e-spec.ts`
- Scenarios E2E validés

---

### ECO-020 : Documentation Swagger
**Priorité** : P2
**Temps estimé** : 30 min
**Assigné** : Backend
**Dépendances** : ECO-013

**Description** :
Documentation automatique des APIs avec Swagger pour faciliter l'intégration.

**Critères d'acceptation** :
- [ ] Configuration @nestjs/swagger
- [ ] Décorateurs sur tous les endpoints
- [ ] Exemples de requêtes/réponses
- [ ] Documentation accessible sur /api/docs
- [ ] Schémas DTOs documentés

**Livrables** :
- Documentation Swagger complète
- `/api/docs` accessible

---

### ECO-021 : Docker Compose Production
**Priorité** : P1
**Temps estimé** : 45 min
**Assigné** : DevOps
**Dépendances** : ECO-017

**Description** :
Configuration Docker pour déploiement avec tous les services.

**Critères d'acceptation** :
- [ ] Dockerfile backend optimisé
- [ ] Dockerfile frontend avec build Vite
- [ ] docker-compose.yml avec tous les services
- [ ] Variables d'environnement externalisées
- [ ] Healthchecks pour tous les containers

**Livrables** :
- `docker-compose.yml` production
- Documentation déploiement

---

### ECO-022 : Tests Performance Load
**Priorité** : P2
**Temps estimé** : 30 min
**Assigné** : Backend
**Dépendances** : ECO-010

**Description** :
Tests de charge pour valider les performances sous stress.

**Critères d'acceptation** :
- [ ] Test 100 messages MQTT/seconde
- [ ] Test 50 calculs énergétiques simultanés
- [ ] Test 20 connexions WebSocket concurrentes
- [ ] Latence API < 200ms maintenue
- [ ] Pas de memory leaks détectés

**Livrables** :
- Scripts de test de charge
- Rapport de performance

---

### ECO-023 : Documentation Finale
**Priorité** : P1
**Temps estimé** : 45 min
**Assigné** : Documentation

**Description** :
Documentation complète pour la présentation RNCP et la maintenance future.

**Critères d'acceptation** :
- [ ] README.md détaillé avec setup
- [ ] Architecture.md avec schémas
- [ ] DEPLOYMENT.md avec procédures
- [ ] Capture d'écrans du dashboard
- [ ] Vidéo de démonstration (3 min)

**Livrables** :
- Documentation technique complète
- Supports de présentation

---

## 📊 Métriques de Succès

### Critères Techniques
- ✅ **Code Backend** : < 1000 lignes total
- ✅ **Test Coverage** : > 70%
- ✅ **Latence WebSocket** : < 100ms
- ✅ **Latence API** : < 200ms
- ✅ **Précision capteurs** : 100% (contact ESP8266)

### Critères RNCP Niveau 6
- ✅ **IoT Integration** : MQTT + sensors fonctionnels
- ✅ **External API** : OpenWeather intégration
- ✅ **Real-time** : WebSocket opérationnel
- ✅ **Database Design** : PostgreSQL + TypeORM
- ✅ **Authentication** : JWT sécurisé
- ✅ **Testing** : Unit + E2E + Coverage
- ✅ **Documentation** : Technique + API
- ✅ **Containerization** : Docker production-ready

### Démonstration Fonctionnelle
- ✅ **Capteur ESP8266** détecte ouverture/fermeture porte
- ✅ **3 RuuviTag** fournissent données environnementales
- ✅ **Calculs temps réel** des pertes énergétiques affichés
- ✅ **Dashboard React** met à jour automatiquement
- ✅ **Gamification** attribution points automatique
- ✅ **APIs** documentées et accessibles

---

## 🚦 Règles de Validation

### Definition of Done (DoD)
Pour qu'un ticket soit considéré terminé :

1. ✅ **Code implémenté** et fonctionnel
2. ✅ **Tests manuels** passés avec succès
3. ✅ **Tests unitaires** écrits et passants (si applicable)
4. ✅ **Pas d'erreurs TypeScript** ou de warnings
5. ✅ **Documentation** à jour (si modification d'API)
6. ✅ **Code reviewé** par un pair (auto-review si solo)
7. ✅ **Commit descriptif** avec référence ticket

### Workflow par Ticket
```bash
1. Sélectionner ticket prioritaire disponible
2. Créer branche feature/ECO-XXX
3. Implémenter fonctionnalité
4. Tester manuellement
5. Écrire tests unitaires
6. Commit avec message "ECO-XXX: Description"
7. Merge sur master
8. Marquer ticket DONE
```

### Convention Commits
```
ECO-XXX: Titre du ticket en français

Description optionnelle des changements techniques.

- Liste des modifications principales
- Tests ajoutés si applicable
- Breaking changes si nécessaire

Closes #ECO-XXX
```

---

*Sprint planning généré pour EcoComfort v2 - RNCP Niveau 6*
*Dernière mise à jour : Septembre 2025*