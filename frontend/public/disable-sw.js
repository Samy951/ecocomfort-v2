// Script agressif pour désactiver complètement le service worker
console.log('🚫 Désactivation forcée du Service Worker...');

// 1. Désactiver tous les service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    console.log('📋 Service Workers trouvés:', registrations.length);
    for(let registration of registrations) {
      registration.unregister().then(function(boolean) {
        console.log('✅ Service Worker désactivé:', registration.scope, boolean);
      });
    }
  });
  
  // 2. Nettoyer tous les caches
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
    });
  }
  
  // 3. Forcer la suppression du service worker actuel
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    console.log('🔄 Contrôleur changé, rechargement...');
    window.location.reload();
  });
}

// 4. Supprimer les références au manifest
const manifestLink = document.querySelector('link[rel="manifest"]');
if (manifestLink) {
  manifestLink.remove();
  console.log('✅ Manifest supprimé du DOM');
}

console.log('🎉 Service Worker et cache nettoyés !');
