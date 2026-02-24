self.addEventListener('push', function(event) {
    if (!event.data) {
        console.error("[SW] Push received but no data found.");
        return;
    }

    let payload;
    try {
        payload = event.data.json();
    } catch (e) {
        console.error("[SW] Failed to parse JSON payload:", e);
        payload = { title: "WITNESS ALERT", body: event.data.text() };
    }

    const options = {
        body: payload.body,
        // Fallback to local icons if the payload doesn't provide them
        icon: payload.icon || '/icon-192.png',
        badge: payload.badge || '/icon-192.png',
        vibrate: [300, 100, 300],
        tag: 'ice-alert', 
        renotify: true,
        // This 'data' object is critical for the click handler below
        data: payload.data || { url: '/map.html' },
        actions: payload.actions || [
            { action: 'open_map', title: '📍 VIEW MAP' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(payload.title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    const notification = event.notification;
    const action = event.action;
    const customData = notification.data;

    notification.close();

    // 1. Handle "Share Alert" Button
    if (action === 'share_alert') {
        const shareText = customData.shareText || "⚠️ ICE activity reported.";
        const shareUrl = `share.html?text=${encodeURIComponent(shareText)}`;
        event.waitUntil(clients.openWindow(shareUrl));
        return;
    }

    // 2. Handle "View Map" or Tapping the Notification Body
    const targetUrl = customData.url || '/map.html';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // If the app is already open, navigate and focus
            for (let client of windowClients) {
                if ('navigate' in client) {
                    return client.navigate(targetUrl).then(c => c.focus());
                }
            }
            // Otherwise, open a fresh window
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});