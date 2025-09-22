// Script ULTRA AGRESSIF pour supprimer le service worker
console.log('🚫 SUPPRESSION FORCÉE DU SERVICE WORKER...');

// 1. Désactiver tous les service workers IMMÉDIATEMENT
if ('serviceWorker' in navigator) {
  // Désactiver le service worker actuel
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({type: 'SKIP_WAITING'});
  }
  
  // Désactiver tous les service workers
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    console.log('📋 Service Workers trouvés:', registrations.length);
    for(let registration of registrations) {
      registration.unregister().then(function(boolean) {
        console.log('✅ Service Worker désactivé:', registration.scope, boolean);
      }).catch(function(error) {
        console.error('❌ Erreur lors de la désactivation:', error);
      });
    }
  });
  
  // 2. Nettoyer tous les caches IMMÉDIATEMENT
  if ('caches' in window) {
    caches.keys().then(function(cacheNames) {
      console.log('🗑️ Caches trouvés:', cacheNames.length);
      return Promise.all(
        cacheNames.map(function(cacheName) {
          console.log('🗑️ Suppression du cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(function() {
      console.log('✅ Tous les caches supprimés');
    }).catch(function(error) {
      console.error('❌ Erreur lors de la suppression des caches:', error);
    });
  }
  
  // 3. Forcer la suppression du service worker actuel
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    console.log('🔄 Contrôleur changé, rechargement...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  });
}

// 4. Supprimer les références au manifest
const manifestLink = document.querySelector('link[rel="manifest"]');
if (manifestLink) {
  manifestLink.remove();
  console.log('✅ Manifest supprimé du DOM');
}

// 5. Supprimer les références au service worker dans le DOM
const swScripts = document.querySelectorAll('script[src*="sw.js"], script[src*="workbox"]');
swScripts.forEach(script => {
  script.remove();
  console.log('✅ Script SW supprimé du DOM');
});

// 6. Forcer le nettoyage du localStorage
try {
  localStorage.removeItem('sw-cache');
  localStorage.removeItem('workbox-cache');
  console.log('✅ Cache localStorage nettoyé');
} catch (error) {
  console.error('❌ Erreur lors du nettoyage localStorage:', error);
}

// 7. SUPPRIMER LE SCRIPT WORKBOX DU DOM
const workboxScripts = document.querySelectorAll('script[src*="workbox"]');
workboxScripts.forEach(script => {
  script.remove();
  console.log('✅ Script Workbox supprimé du DOM');
});

// 8. FORCER LA SUPPRESSION DU SCRIPT ACTUEL
const currentScript = document.currentScript;
if (currentScript) {
  setTimeout(() => {
    currentScript.remove();
    console.log('✅ Script de nettoyage supprimé');
  }, 5000);
}

console.log('🎉 Service Worker et cache NETTOYÉS !');
