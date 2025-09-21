# Plan de Test Manuel MQTT - EcoComfort v2

## Configuration préalable

### Prérequis techniques
- [ ] Backend démarré avec `LOG_LEVEL=debug npm run start:dev`
- [ ] PostgreSQL accessible et base de données créée
- [ ] Capteurs physiques alimentés et connectés
- [ ] mosquitto-clients installé (`sudo apt install mosquitto-clients`)
- [ ] Variables d'environnement vérifiées dans `.env`

### Vérification de l'environnement
```bash
# Vérifier la connexion au broker MQTT
mosquitto_sub -h admin-hetic.arcplex.tech -p 8827 -t "#" -C 1

# Vérifier la base de données
psql $DATABASE_URL -c "SELECT count(*) FROM door_states;"
```

## Tests de réception

### TEST-01 : Réception ESP8266 Door Sensor
**Objectif** : Valider la réception et le parsing des messages du capteur de porte
**Action** : Ouvrir puis fermer la porte physiquement
**Vérifications** :
- [ ] Log de réception : `"Received message on sensor/door_sensor/RESULT"`
- [ ] Payload d'ouverture : `{"Switch1": {"Action": "OFF"}}`
- [ ] Payload de fermeture : `{"Switch1": {"Action": "ON"}}`
- [ ] Log de traitement : `"Door state changed to: OPEN"`
- [ ] Log de traitement : `"Door state changed to: CLOSED"`
- [ ] Log de durée : `"Door was open for X seconds"`

**Résultat** : ✅ / ❌
**Notes** : ___________________________________________

### TEST-02 : Réception RuuviTag Sensors
**Objectif** : Valider la réception des 3 capteurs environnementaux
**Action** : Attendre 2 minutes pour collecter des données
**Vérifications** :
- [ ] Messages reçus pour sensor ID `944372022`
- [ ] Messages reçus pour sensor ID `422801533`
- [ ] Messages reçus pour sensor ID `1947698524`
- [ ] Log température : `"Sensor XXXXX: temperature=XX.XX°C"`
- [ ] Log humidité : `"Sensor XXXXX: humidity=XX.XX%"`
- [ ] Log pression : `"Sensor XXXXX: pressure=XXXX.XXhPa"`
- [ ] Log moyenne : `"Average indoor temperature: XX.XX°C (3 sensors active)"`

**Résultat** : ✅ / ❌
**Notes** : ___________________________________________

### TEST-03 : Simulation avec mosquitto_pub
**Objectif** : Tester la réception avec des messages simulés
**Actions** :

```bash
# 1. Simuler ouverture de porte
mosquitto_pub -h admin-hetic.arcplex.tech -p 8827 \
  -t "sensor/door_sensor/RESULT" \
  -m '{"Switch1": {"Action": "OFF"}}'

# 2. Simuler température RuuviTag sensor 1
mosquitto_pub -h admin-hetic.arcplex.tech -p 8827 \
  -t "pws-packet/202481601481463/944372022/112" \
  -m '{"data": {"temperature": 21.5}}'

# 3. Simuler humidité RuuviTag sensor 1
mosquitto_pub -h admin-hetic.arcplex.tech -p 8827 \
  -t "pws-packet/202481601481463/944372022/114" \
  -m '{"data": {"humidity": 45.2}}'

# 4. Simuler fermeture de porte (après 10 secondes)
mosquitto_pub -h admin-hetic.arcplex.tech -p 8827 \
  -t "sensor/door_sensor/RESULT" \
  -m '{"Switch1": {"Action": "ON"}}'
```

**Vérifications** :
- [ ] Tous les messages simulés sont reçus
- [ ] Parsing correct des valeurs
- [ ] Cycle complet ouverture/fermeture traité
- [ ] Durée calculée ≈ 10 secondes

**Résultat** : ✅ / ❌
**Notes** : ___________________________________________

## Tests d'intégration système

### TEST-04 : Persistance en base de données
**Objectif** : Vérifier que les données sont correctement sauvegardées
**Action** : Après avoir exécuté TEST-01 ou TEST-03, vérifier la base

```sql
-- Vérifier les derniers états de porte
SELECT id, is_open, timestamp, duration_seconds
FROM door_states
ORDER BY timestamp DESC
LIMIT 5;

-- Vérifier les dernières lectures de capteurs
SELECT sensor_id, temperature, humidity, pressure, timestamp
FROM sensor_readings
ORDER BY timestamp DESC
LIMIT 10;
```

**Vérifications** :
- [ ] Enregistrement `DoorState` avec `is_open = true` (ouverture)
- [ ] Enregistrement `DoorState` avec `is_open = false` (fermeture)
- [ ] Durée calculée et cohérente
- [ ] Enregistrements `SensorReading` pour chaque capteur
- [ ] Timestamps corrects et récents

**Résultat** : ✅ / ❌
**Notes** : ___________________________________________

### TEST-05 : Calculs énergétiques
**Objectif** : Vérifier que les calculs énergétiques sont déclenchés
**Action** : Compléter un cycle ouverture/fermeture et vérifier les calculs

```sql
-- Vérifier les calculs énergétiques
SELECT em.*, ds.duration_seconds
FROM energy_metrics em
JOIN door_states ds ON em.door_state_id = ds.id
ORDER BY em.created_at DESC
LIMIT 5;
```

**Vérifications** :
- [ ] Enregistrement `EnergyMetric` créé après fermeture
- [ ] Valeurs cohérentes : `energy_loss_watts > 0`
- [ ] Coût calculé : `cost_euros > 0`
- [ ] Températures intérieure et extérieure renseignées

**Résultat** : ✅ / ❌
**Notes** : ___________________________________________

### TEST-06 : Gamification
**Objectif** : Vérifier l'attribution des points de gamification
**Action** : Fermer la porte rapidement (< 10 secondes) et vérifier les points

```sql
-- Vérifier les points utilisateur
SELECT points, level FROM users WHERE id = 1;

-- Vérifier les badges attribués
SELECT badge_type, earned_at
FROM user_badges
WHERE user_id = 1
ORDER BY earned_at DESC
LIMIT 5;
```

**Vérifications** :
- [ ] Points utilisateur augmentés après fermeture rapide
- [ ] Log gamification : `"Points awarded for quick door close"`
- [ ] Badge attribué si applicable

**Résultat** : ✅ / ❌
**Notes** : ___________________________________________

## Tests de robustesse

### TEST-07 : Ouvertures/fermetures rapides
**Objectif** : Tester la gestion de cycles rapides
**Action** : Ouvrir et fermer la porte 5 fois en 30 secondes

**Vérifications** :
- [ ] Tous les événements capturés (10 événements = 5 ouvertures + 5 fermetures)
- [ ] Durées correctes pour chaque cycle
- [ ] Pas de perte de données
- [ ] Pas d'erreurs dans les logs
- [ ] Performance maintenue (latence < 100ms)

**Résultat** : ✅ / ❌
**Notes** : ___________________________________________

### TEST-08 : Test de reconnexion MQTT
**Objectif** : Vérifier la reconnexion automatique après coupure
**Action** :
1. Démarrer le backend et vérifier la connexion MQTT
2. Couper la connexion réseau pendant 30 secondes
3. Rétablir la connexion
4. Tester la réception de messages

**Vérifications** :
- [ ] Log de déconnexion : `"Disconnected from broker"`
- [ ] Log de tentative de reconnexion : `"Attempting reconnection..."`
- [ ] Log de reconnexion réussie : `"Connected to broker"`
- [ ] Temps de reconnexion < 10 secondes
- [ ] Reprise de la réception des messages
- [ ] Pas d'états incohérents en base

**Résultat** : ✅ / ❌
**Notes** : ___________________________________________

### TEST-09 : Gestion des messages malformés
**Objectif** : Vérifier la robustesse face aux erreurs de parsing
**Action** : Envoyer des messages malformés via mosquitto_pub

```bash
# Message JSON invalide
mosquitto_pub -h admin-hetic.arcplex.tech -p 8827 \
  -t "sensor/door_sensor/RESULT" \
  -m '{"Switch1": {"Action": '

# Message avec mauvaise structure
mosquitto_pub -h admin-hetic.arcplex.tech -p 8827 \
  -t "sensor/door_sensor/RESULT" \
  -m '{"WrongField": "test"}'
```

**Vérifications** :
- [ ] Log d'erreur de parsing affiché
- [ ] Application continue de fonctionner
- [ ] Pas de crash du service
- [ ] Messages valides suivants traités normalement

**Résultat** : ✅ / ❌
**Notes** : ___________________________________________

## Métriques de performance

### TEST-10 : Mesure de latence
**Objectif** : Mesurer la latence de traitement
**Action** : Envoyer 10 messages via mosquitto_pub et mesurer les temps

**Vérifications** :
- [ ] Latence moyenne < 100ms (visible dans les logs debug)
- [ ] Pas de dégradation de performance avec le volume
- [ ] Mémoire stable (pas de memory leaks)

**Temps mesurés** :
- Message 1 : _____ ms
- Message 2 : _____ ms
- Message 3 : _____ ms
- Moyenne : _____ ms

**Résultat** : ✅ / ❌

## Synthèse des résultats

### Statistiques globales
- **Tests réussis** : _____ / 10
- **Taux de réussite** : _____ %
- **Durée totale des tests** : _____ minutes

### Issues identifiées
1. ________________________________________________
2. ________________________________________________
3. ________________________________________________

### Recommandations
1. ________________________________________________
2. ________________________________________________
3. ________________________________________________

### Captures d'écran des logs
- [ ] Screenshot 1 : Logs de réception ESP8266 (TEST-01)
- [ ] Screenshot 2 : Logs de réception RuuviTag (TEST-02)
- [ ] Screenshot 3 : Logs de reconnexion MQTT (TEST-08)
- [ ] Screenshot 4 : Logs de performance en mode debug

---
**Testeur** : _________________
**Date** : ___________________
**Version** : EcoComfort v2 - Sprint 2
**Statut final** : ✅ VALIDÉ / ❌ ÉCHEC