// Custom service worker additions for notification and push handling

// Handle push events from server
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let data = {
    title: 'Bill Reminder',
    body: 'You have a bill due soon!',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [500, 200, 500, 200, 500],
  };
  
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      console.log('Could not parse push data');
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/pwa-192x192.png',
      badge: data.badge || '/pwa-192x192.png',
      vibrate: data.vibrate || [500, 200, 500, 200, 500],
      requireInteraction: true,
      tag: 'bill-reminder',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  // Close the notification
  event.notification.close();

  // Focus existing window or open new one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already an open window
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow('/app');
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});
