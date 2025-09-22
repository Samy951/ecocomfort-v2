// Script pour désactiver complètement le service worker
// Ce script sera exécuté dans le navigateur pour nettoyer le cache

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
      console.log('Service Worker désactivé:', registration.scope);
    }
  });
  
  // Nettoyer le cache
  if ('caches' in window) {
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          console.log('Cache supprimé:', cacheName);
          return caches.delete(cacheName);
        })
      );
    });
  }
}

console.log('Service Worker et cache nettoyés !');
