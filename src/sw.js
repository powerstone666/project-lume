import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.skipWaiting();
clientsClaim();

// Custom Changelog Notification Logic
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        // Fetch changelog
        const response = await fetch('/changelog.json');
        const data = await response.json();
        
        // Check if we have permission (Note: SW can only see 'granted')
        if (Notification.permission === 'granted') {
             // In a real app, we'd check IndexedDB/Cache to see if this version was already notified.
             // For this demo, we'll notify on every activation (or rely on browser deduping).
             // Better: Client sends message "New Version Detected", SW shows notification.
             // But user asked SW to do it.
             
             self.registration.showNotification(data.title, {
                body: data.body,
                icon: '/icons/icon-192x192.png',
                vibrate: [100, 50, 100],
                data: {
                    url: self.registration.scope
                }
             });
        }
      } catch (err) {
        console.error('Failed to notify changelog', err);
      }
    })()
  );
});

// Click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            }
            return clients.openWindow(event.notification.data.url);
        })
    );
});
