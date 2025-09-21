-- MQTT Test Verification Queries for EcoComfort v2
-- Use with: psql $DATABASE_URL -f scripts/mqtt-stats.sql

\echo '=== EcoComfort v2 - MQTT Test Database Verification ==='
\echo ''

-- 1. Vérifier les derniers états de porte
\echo '1. Derniers états de porte (10 derniers):'
SELECT
  id,
  "isOpen",
  to_char(timestamp, 'YYYY-MM-DD HH24:MI:SS') as timestamp,
  "durationSeconds",
  CASE
    WHEN "durationSeconds" IS NOT NULL THEN ROUND("durationSeconds"::numeric, 1) || 's'
    ELSE 'En cours'
  END as duree_formattee
FROM door_states
ORDER BY timestamp DESC
LIMIT 10;

\echo ''

-- 2. Vérifier les dernières lectures de capteurs
\echo '2. Dernières lectures de capteurs (20 dernières):'
SELECT
  "sensorId",
  ROUND(temperature::numeric, 2) as temp_celsius,
  ROUND(humidity::numeric, 2) as humidity_percent,
  ROUND(pressure::numeric, 2) as pressure_hpa,
  to_char(timestamp, 'YYYY-MM-DD HH24:MI:SS') as timestamp
FROM sensor_readings
ORDER BY timestamp DESC
LIMIT 20;

\echo ''

-- 3. Vérifier les calculs énergétiques
\echo '3. Calculs énergétiques récents (10 derniers):'
SELECT
  em.id,
  em."doorStateId",
  ROUND(em."energyLossWatts"::numeric, 3) as watts,
  ROUND(em."costEuros"::numeric, 4) as cout_euros,
  ROUND(em."indoorTemp"::numeric, 1) as temp_int,
  ROUND(em."outdoorTemp"::numeric, 1) as temp_ext,
  ds."durationSeconds" as duree_ouverture,
  to_char(em."createdAt", 'HH24:MI:SS') as calcule_a
FROM energy_metrics em
JOIN door_states ds ON em."doorStateId" = ds.id
ORDER BY em."createdAt" DESC
LIMIT 10;

\echo ''

-- 4. Statistiques globales des événements
\echo '4. Statistiques globales:'
SELECT
  'Total événements porte' as metrique,
  COUNT(*) as valeur
FROM door_states
UNION ALL
SELECT
  'Ouvertures de porte',
  COUNT(*)
FROM door_states
WHERE "isOpen" = true
UNION ALL
SELECT
  'Fermetures de porte',
  COUNT(*)
FROM door_states
WHERE "isOpen" = false
UNION ALL
SELECT
  'Lectures de capteurs',
  COUNT(*)
FROM sensor_readings
UNION ALL
SELECT
  'Calculs énergétiques',
  COUNT(*)
FROM energy_metrics;

\echo ''

-- 5. Moyennes des capteurs environnementaux
\echo '5. Moyennes des capteurs (dernières 24h):'
SELECT
  "sensorId",
  COUNT(*) as nb_lectures,
  ROUND(AVG(temperature)::numeric, 2) as temp_moy,
  ROUND(AVG(humidity)::numeric, 2) as humidity_moy,
  ROUND(AVG(pressure)::numeric, 2) as pressure_moy,
  to_char(MAX(timestamp), 'HH24:MI:SS') as derniere_lecture
FROM sensor_readings
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY "sensorId"
ORDER BY "sensorId";

\echo ''

-- 6. Performance des ouvertures de porte
\echo '6. Performance des ouvertures (dernières 24h):'
SELECT
  COUNT(*) as nb_cycles,
  ROUND(AVG("durationSeconds")::numeric, 1) as duree_moyenne_sec,
  MIN("durationSeconds") as duree_min_sec,
  MAX("durationSeconds") as duree_max_sec,
  SUM("durationSeconds") as temps_total_ouvert_sec
FROM door_states
WHERE "isOpen" = true
  AND "durationSeconds" IS NOT NULL
  AND timestamp > NOW() - INTERVAL '24 hours';

\echo ''

-- 7. Activité récente (dernière heure)
\echo '7. Activité récente (dernière heure):'
SELECT
  'Événements porte' as type,
  COUNT(*) as count,
  to_char(MAX(timestamp), 'HH24:MI:SS') as dernier_event
FROM door_states
WHERE timestamp > NOW() - INTERVAL '1 hour'
UNION ALL
SELECT
  'Lectures capteurs',
  COUNT(*),
  to_char(MAX(timestamp), 'HH24:MI:SS')
FROM sensor_readings
WHERE timestamp > NOW() - INTERVAL '1 hour'
UNION ALL
SELECT
  'Calculs énergie',
  COUNT(*),
  to_char(MAX("createdAt"), 'HH24:MI:SS')
FROM energy_metrics
WHERE "createdAt" > NOW() - INTERVAL '1 hour';

\echo ''

-- 8. Validation de la cohérence des données
\echo '8. Validation de la cohérence:'
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM door_states
      WHERE "isOpen" = true AND "durationSeconds" IS NOT NULL
    ) THEN '❌ ERREUR: Porte ouverte avec durée renseignée'
    ELSE '✅ OK: Cohérence états de porte'
  END as test_coherence_porte
UNION ALL
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM energy_metrics
      WHERE "energyLossWatts" < 0 OR "costEuros" < 0
    ) THEN '❌ ERREUR: Valeurs énergétiques négatives'
    ELSE '✅ OK: Valeurs énergétiques cohérentes'
  END
UNION ALL
SELECT
  CASE
    WHEN (SELECT COUNT(DISTINCT "sensorId") FROM sensor_readings WHERE timestamp > NOW() - INTERVAL '5 minutes') >= 3
    THEN '✅ OK: 3 capteurs actifs'
    ELSE '⚠️  WARNING: Moins de 3 capteurs actifs'
  END;

\echo ''
\echo '=== Fin du rapport de vérification ==='