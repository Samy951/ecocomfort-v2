
#!/bin/bash

echo "🚀 EXTRACTION ULTIME DU CONTEXTE ECOCOMFORT..."

cat > COMPLETE_CONTEXT.md << 'END'

# CONTEXTE COMPLET PROJET ECOCOMFORT

## TÂCHES À IMPLÉMENTER

1. Gamification (système de points/badges)

2. Notifications (temps réel via WebSocket)

3. Charts dans profil utilisateur

END

echo "## ISSUES GITHUB" >> COMPLETE_CONTEXT.md

gh issue list --state all --limit 100 >> COMPLETE_CONTEXT.md 2>/dev/null || echo "Pas d'issues GitHub" >> COMPLETE_CONTEXT.md

echo -e "\n## STRUCTURE BACKEND" >> COMPLETE_CONTEXT.md

tree -I 'node_modules|dist|coverage' -L 4 backend/src >> COMPLETE_CONTEXT.md

echo -e "\n## STRUCTURE FRONTEND" >> COMPLETE_CONTEXT.md

tree -I 'node_modules|dist|build' -L 4 frontend/src >> COMPLETE_CONTEXT.md

echo -e "\n## TOUS LES FICHIERS BACKEND" >> COMPLETE_CONTEXT.md

find backend/src -type f -name "*.ts" >> COMPLETE_CONTEXT.md

echo -e "\n## TOUS LES FICHIERS FRONTEND" >> COMPLETE_CONTEXT.md

find frontend/src -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" \) >> COMPLETE_CONTEXT.md

echo -e "\n## ENTITÉS DATABASE" >> COMPLETE_CONTEXT.md

find . -name "*.entity.ts" -exec echo "=== {} ===" \; -exec head -30 {} \; >> COMPLETE_CONTEXT.md

echo -e "\n## MODULES BACKEND" >> COMPLETE_CONTEXT.md

find backend/src -name "*.module.ts" -exec echo "=== {} ===" \; -exec head -20 {} \; >> COMPLETE_CONTEXT.md

echo -e "\n## SERVICES BACKEND" >> COMPLETE_CONTEXT.md

find backend/src -name "*.service.ts" | head -10 | while read file; do

  echo "=== $file ===" >> COMPLETE_CONTEXT.md

  head -50 "$file" >> COMPLETE_CONTEXT.md

done

echo -e "\n## CONFIGURATION WEBSOCKET" >> COMPLETE_CONTEXT.md

grep -r "WebSocket\|Socket\|@WebSocket" backend/src --include="*.ts" >> COMPLETE_CONTEXT.md 2>/dev/null

echo -e "\n## FICHIERS GAMIFICATION/NOTIFICATION/CHARTS" >> COMPLETE_CONTEXT.md

find . -type f \( -name "*gamif*" -o -name "*notif*" -o -name "*chart*" -o -name "*dashboard*" -o -name "*profile*" \) 2>/dev/null >> COMPLETE_CONTEXT.md

echo -e "\n## DÉPENDANCES BACKEND" >> COMPLETE_CONTEXT.md

cat backend/package.json >> COMPLETE_CONTEXT.md

echo -e "\n## DÉPENDANCES FRONTEND" >> COMPLETE_CONTEXT.md

cat frontend/package.json >> COMPLETE_CONTEXT.md

echo -e "\n## CONFIGURATION DOCKER" >> COMPLETE_CONTEXT.md

cat backend/docker-compose.yml >> COMPLETE_CONTEXT.md 2>/dev/null

echo -e "\n## VARIABLES D'ENVIRONNEMENT" >> COMPLETE_CONTEXT.md

cat backend/.env >> COMPLETE_CONTEXT.md 2>/dev/null || echo "Pas de .env.example" >> COMPLETE_CONTEXT.md

echo -e "\n## DERNIERS COMMITS" >> COMPLETE_CONTEXT.md

git log --oneline -20 >> COMPLETE_CONTEXT.md 2>/dev/null

echo -e "\n## README PRINCIPAL" >> COMPLETE_CONTEXT.md

cat README.md >> COMPLETE_CONTEXT.md 2>/dev/null

echo -e "\n## ROUTES API DISPONIBLES" >> COMPLETE_CONTEXT.md

find backend/src -name "*.controller.ts" -exec grep -H "@Get\|@Post\|@Put\|@Delete\|@Patch" {} \; >> COMPLETE_CONTEXT.md

echo -e "\n## COMPOSANTS REACT PRINCIPAUX" >> COMPLETE_CONTEXT.md

find frontend/src/components -name "*.tsx" -o -name "*.jsx" | head -20 >> COMPLETE_CONTEXT.md

echo -e "\n## RÉSUMÉ" >> COMPLETE_CONTEXT.md

echo "Total de fichiers TypeScript backend: $(find backend/src -name "*.ts" | wc -l)" >> COMPLETE_CONTEXT.md

echo "Total de fichiers React frontend: $(find frontend/src -name "*.tsx" -o -name "*.jsx" | wc -l)" >> COMPLETE_CONTEXT.md

echo "Taille du contexte: $(wc -l COMPLETE_CONTEXT.md | awk '{print $1}') lignes" >> COMPLETE_CONTEXT.md

echo "✅ Extraction terminée !"

echo "�� Fichier créé: COMPLETE_CONTEXT.md"

echo "📏 Taille: $(wc -l COMPLETE_CONTEXT.md | awk '{print $1}') lignes"

