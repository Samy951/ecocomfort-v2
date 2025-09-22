# EcoComfort Frontend

## 📋 Vue d'ensemble

EcoComfort Frontend est une application React moderne développée avec TypeScript, conçue pour la gestion énergétique intelligente IoT. L'application offre une interface utilisateur responsive, mobile-first, avec des fonctionnalités temps réel via WebSocket.

## 🚀 Technologies utilisées

### Core Technologies
- **React 19.1.1** - Framework UI moderne
- **TypeScript 5.8.3** - Typage statique et sécurité
- **Vite 5.4.20** - Build tool rapide et moderne
- **Tailwind CSS 3.4.17** - Framework CSS utility-first

### Libraries principales
- **React Router DOM 6.30.1** - Navigation et routage
- **Socket.IO Client 4.8.1** - Communication temps réel
- **Recharts 3.1.2** - Visualisation de données
- **Lucide React 0.541.0** - Icônes modernes

### Outils de développement
- **ESLint 9.33.0** - Linting et qualité de code
- **PostCSS 8.5.6** - Traitement CSS
- **Autoprefixer 10.4.21** - Compatibilité navigateurs

## 🏗️ Architecture

### Structure des dossiers
```
frontend/
├── src/
│   ├── components/          # Composants réutilisables
│   │   ├── ui/             # Composants UI de base
│   │   ├── AuthWrapper.tsx # Wrapper d'authentification
│   │   ├── Layout.tsx      # Layout principal
│   │   ├── Navigation.tsx  # Navigation
│   │   └── ...
│   ├── pages/              # Pages de l'application
│   │   ├── Dashboard.tsx   # Tableau de bord principal
│   │   ├── Admin.tsx       # Interface administrateur
│   │   ├── Profile.tsx     # Profil utilisateur
│   │   ├── Settings.tsx     # Paramètres
│   │   └── History.tsx     # Historique
│   ├── services/           # Services métier
│   │   ├── api.ts         # Service API REST
│   │   └── websocket.ts   # Service WebSocket
│   ├── types/             # Définitions TypeScript
│   ├── hooks/             # Hooks personnalisés
│   ├── App.tsx            # Composant racine
│   ├── main.tsx           # Point d'entrée
│   └── index.css          # Styles globaux
├── public/                # Assets statiques
├── tailwind.config.js    # Configuration Tailwind
├── vite.config.ts        # Configuration Vite
└── package.json          # Dépendances
```

### Design System

#### Couleurs personnalisées
```javascript
// tailwind.config.js
colors: {
  // Couleurs principales
  'main-green': '#2FCE65',      // Vert principal
  'main-black': '#101010',      // Noir principal
  'main-white': '#FFFFFF',      // Blanc principal
  
  // Couleurs système
  'success': '#2FCE65',         // Succès
  'warning': '#F59E0B',        // Avertissement
  'info': '#3B82F6',           // Information
  'critical': '#EF4444',       // Critique
  'error': '#FF5A5A',          // Erreur
  
  // Couleurs de fond
  'light-grey': '#F8F9FA',     // Gris clair
  'medium-grey': '#6B7280',    // Gris moyen
  'dark-grey': '#374151',      // Gris foncé
  'grey': '#9CA3AF',           // Gris standard
}
```

#### Typographie
```javascript
fontSize: {
  'h1': ['2.5rem', { lineHeight: '3rem' }],      // Titre principal
  'h2': ['2rem', { lineHeight: '2.5rem' }],      // Titre secondaire
  'h3': ['1.5rem', { lineHeight: '2rem' }],      // Titre tertiaire
  'h4': ['1.25rem', { lineHeight: '1.75rem' }],  // Titre quaternaire
  'h5': ['1.125rem', { lineHeight: '1.5rem' }],  // Titre quinaire
  'paragraph': ['1rem', { lineHeight: '1.5rem' }], // Paragraphe
  'paragraph-small': ['0.875rem', { lineHeight: '1.25rem' }], // Petit paragraphe
  'paragraph-tiny': ['0.75rem', { lineHeight: '1rem' }], // Très petit texte
}
```

## 🎨 Composants UI

### Button Component
```typescript
interface ButtonProps {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "big" | "medium" | "small" | "link";
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  children: React.ReactNode;
}
```

**Variantes disponibles :**
- `primary` - Bouton principal (vert)
- `secondary` - Bouton secondaire (noir)
- `outline` - Bouton contour
- `ghost` - Bouton transparent

**Tailles disponibles :**
- `big` - Grande taille (h-12, px-6, py-3)
- `medium` - Taille moyenne (h-10, px-5, py-2.5)
- `small` - Petite taille (h-8, px-4, py-2)
- `link` - Style lien (h-auto, px-0, py-0)

### Card Component
```typescript
interface CardProps {
  variant?: "default" | "hover" | "glass";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
}
```

**Variantes disponibles :**
- `default` - Carte standard avec ombre
- `hover` - Effet hover avec élévation
- `glass` - Effet glassmorphism avec backdrop-blur

### Input Component
```typescript
interface InputProps {
  type?: "text" | "email" | "password" | "number";
  label?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  error?: string;
  disabled?: boolean;
}
```

**Fonctionnalités :**
- Support des icônes
- Gestion des erreurs
- AutoComplete pour email/password
- Validation intégrée

### Typography Component
```typescript
interface TypographyProps {
  variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "paragraph" | "paragraph-small" | "paragraph-tiny";
  color?: "main-black" | "main-white" | "main-green" | "medium-grey" | "dark-grey" | "error" | "success" | "warning" | "info" | "critical";
  children: React.ReactNode;
}
```

## 🔌 Services

### API Service (`services/api.ts`)

Service centralisé pour toutes les communications avec le backend REST API.

#### Configuration
```typescript
class ApiService {
  private baseURL: string = "/api";  // Utilise le proxy Vite
  private authToken: string | null = null;
}
```

#### Méthodes principales
```typescript
// Authentification
async login(email: string, password: string): Promise<AuthResponse>
async register(userData: RegisterData): Promise<AuthResponse>
async logout(): Promise<void>

// Données dashboard
async getDashboardOverview(): Promise<DashboardOverview>
async getSensorData(): Promise<CurrentSensorsResponse>
async getEnergyAnalytics(days: number): Promise<EnergyAnalytics>

// Gestion des erreurs
private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T>
```

#### Gestion des erreurs
- **401 Unauthorized** - Nettoyage automatique du token
- **500 Internal Server Error** - Fallback avec données par défaut
- **404 Not Found** - Gestion gracieuse des endpoints non implémentés

### WebSocket Service (`services/websocket.ts`)

Service pour la communication temps réel avec Socket.IO.

#### Configuration WebSocket
```typescript
class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private pendingUserInit: { userId: string; organizationId: string } | null = null;
}
```

#### Événements supportés
```typescript
// Événements backend
'door-state-changed'     // Changement d'état des portes
'sensor-data-updated'    // Mise à jour des données capteurs
'points-awarded'         // Attribution de points
'badge-awarded'         // Attribution de badges
'level-up'              // Montée de niveau

// Événements de connexion
'connected'             // Connexion établie
'disconnected'          // Connexion perdue
```

#### Fonctionnalités WebSocket
- **Reconnexion automatique** avec backoff exponentiel
- **Initialisation utilisateur différée** si connexion en cours
- **Gestion des erreurs** robuste
- **Logs détaillés** pour debugging

## 📱 Pages et fonctionnalités

### Dashboard (`pages/Dashboard.tsx`)

Page principale avec vue d'ensemble des données IoT.

#### Fonctionnalités Dashboard
- **Cartes de résumé** - Température, portes ouvertes, perte énergétique, capteurs actifs
- **Graphiques temps réel** - Analyse énergétique avec Recharts
- **Capteurs temps réel** - Affichage des données des capteurs
- **Actualisation automatique** - Refresh toutes les minutes
- **Gestion d'erreurs** - Fallback gracieux en cas d'erreur API

#### Intégration WebSocket
```typescript
// Écoute des événements temps réel
const unsubscribeDoorState = webSocketService.on("door-state-changed", (event) => {
  loadAllData(); // Rechargement des données
});

const unsubscribeSensorData = webSocketService.on("sensor-data-updated", (event) => {
  loadAllData(); // Rechargement des données
});
```

### Admin (`pages/Admin.tsx`)

Interface administrateur pour la gestion du système.

#### Fonctionnalités Admin
- **Vue d'ensemble système** - Statistiques globales
- **Gestion des capteurs** - Liste et statut des capteurs
- **Alertes critiques** - Gestion des alertes non acquittées
- **Analytics avancées** - Données détaillées par salle

### Profile (`pages/Profile.tsx`)

Profil utilisateur avec données de gamification.

#### Fonctionnalités Profile
- **Informations utilisateur** - Nom, email, organisation
- **Statistiques gamification** - Niveau, points, progression
- **Graphiques d'activité** - Historique des points et économies
- **Badges et achievements** - Système de récompenses

### Settings (`pages/Settings.tsx`)

Paramètres utilisateur et préférences.

#### Catégories de paramètres
- **Notifications** - Préférences d'alertes
- **Affichage** - Mode sombre/clair, densité
- **Sécurité** - Gestion du compte
- **Privacité** - Contrôle des données

### History (`pages/History.tsx`)

Historique des données et événements.

#### Fonctionnalités History
- **Filtres temporels** - Période sélectionnable
- **Graphiques historiques** - Évolution des métriques
- **Export de données** - Téléchargement des rapports
- **Analyse des tendances** - Identification des patterns

## 🔐 Authentification

### Système d'authentification
- **JWT Token** - Stockage sécurisé dans localStorage
- **Persistance de session** - Reconnexion automatique au refresh
- **Gestion des erreurs** - Nettoyage automatique des tokens expirés
- **Comptes de démo** - Admin demo intégré

### Flux d'authentification
```typescript
// Login
const response = await apiService.login(email, password);
apiService.setAuthToken(response.token);
localStorage.setItem("user_data", JSON.stringify(response.user));

// Vérification au chargement
const token = localStorage.getItem("auth_token");
const userData = localStorage.getItem("user_data");
if (token && userData) {
  // Reconnexion automatique
  apiService.setAuthToken(token);
  setCurrentUser(JSON.parse(userData));
}
```

## 🎨 Design et UX

### Mobile-First Design
- **Responsive breakpoints** - sm (640px), md (768px), lg (1024px), xl (1280px)
- **Touch-friendly** - Boutons et zones de clic optimisés
- **Performance mobile** - Optimisations pour appareils mobiles

### Dark Mode
- **Toggle automatique** - Basculement système/navigateur
- **Persistance** - Sauvegarde de la préférence utilisateur
- **Cohérence** - Tous les composants supportent le mode sombre

### Accessibilité
- **Contraste** - Respect des standards WCAG
- **Navigation clavier** - Support complet du clavier
- **Screen readers** - Attributs ARIA appropriés
- **Focus management** - Gestion du focus pour la navigation

## 🚀 Déploiement et développement

### Scripts disponibles
```bash
npm run dev      # Serveur de développement (port 3001)
npm run build    # Build de production
npm run lint     # Vérification ESLint
npm run preview  # Aperçu du build de production
```

### Configuration de développement
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Backend
        changeOrigin: true,
      }
    }
  }
});
```

### Variables d'environnement
```bash
VITE_API_URL=http://localhost:3000    # URL du backend
VITE_WS_URL=http://localhost:3000     # URL WebSocket
```

## 🔧 Configuration technique

### TypeScript
- **Strict mode** activé
- **Types stricts** pour toutes les interfaces
- **Imports/exports** ES6 modules
- **Path mapping** pour les imports absolus

### ESLint
- **Règles React** - Hooks et best practices
- **Règles TypeScript** - Typage strict
- **Formatage** - Code cohérent et lisible

### Tailwind CSS
- **Purge CSS** - Suppression du CSS non utilisé
- **Custom utilities** - Classes personnalisées
- **Dark mode** - Support natif du mode sombre
- **Responsive** - Breakpoints personnalisés

## 📊 Performance et optimisation

### Optimisations Vite
- **Tree shaking** - Suppression du code mort
- **Code splitting** - Chargement à la demande
- **Hot Module Replacement** - Rechargement instantané
- **Source maps** - Debugging facilité

### Optimisations React
- **Memoization** - useCallback et useMemo
- **Lazy loading** - Chargement des composants à la demande
- **Error boundaries** - Gestion des erreurs gracieuse
- **Concurrent features** - React 19 features

### Optimisations réseau
- **Proxy API** - Évite les problèmes CORS
- **WebSocket persistent** - Connexion temps réel stable
- **Error handling** - Gestion robuste des erreurs réseau
- **Fallback data** - Données par défaut en cas d'erreur

## 🐛 Debugging et logs

### Logs WebSocket
```typescript
console.log("🔌 Socket.IO connecté:", socketId);
console.log("👤 Initialisation utilisateur:", userId);
console.log("🚪 État porte changé:", data);
console.log("📊 Données capteur mises à jour:", data);
```

### Logs API
```typescript
console.warn("Failed to fetch sensor data:", err);
console.error("API request failed for", endpoint, error);
```

### Outils de debugging
- **React DevTools** - Inspection des composants
- **Redux DevTools** - Debugging de l'état (si applicable)
- **Network tab** - Monitoring des requêtes
- **Console** - Logs détaillés pour debugging

## 🔄 Intégration backend

### Endpoints API utilisés
```typescript
// Authentification
POST /api/auth/login
POST /api/auth/register

// Dashboard
GET /api/api/sensors
GET /api/api/energy/current
GET /api/api/energy/daily

// Gamification
GET /api/gamification/stats/:userId
```

### WebSocket Events
```typescript
// Événements émis par le backend
'door-state-changed'
'sensor-data-updated'
'points-awarded'
'badge-awarded'
'level-up'
```

## 📈 Métriques et monitoring

### Indicateurs de performance
- **Temps de chargement** - < 2s sur mobile
- **Temps de réponse API** - < 500ms
- **WebSocket latency** - < 100ms
- **Bundle size** - Optimisé pour mobile

### Monitoring en production
- **Error tracking** - Capture des erreurs JavaScript
- **Performance monitoring** - Métriques de performance
- **User analytics** - Comportement utilisateur
- **API monitoring** - Santé des endpoints

## 🚀 Roadmap et évolutions

### Fonctionnalités futures
- **PWA** - Application web progressive
- **Push notifications** - Notifications push
- **Offline support** - Fonctionnement hors ligne
- **Advanced analytics** - Analytics avancées
- **Multi-language** - Support multilingue

### Améliorations techniques
- **Testing** - Tests unitaires et d'intégration
- **CI/CD** - Pipeline de déploiement
- **Monitoring** - Monitoring avancé
- **Security** - Renforcement de la sécurité

---

## 📞 Support et contribution

Pour toute question ou contribution, consultez la documentation du projet principal ou contactez l'équipe de développement.

**Version:** 0.0.0  
**Dernière mise à jour:** Janvier 2025  
**Statut:** En développement actif
