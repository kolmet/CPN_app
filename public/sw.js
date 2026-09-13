self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { /* ignore */ }
  const title = data.title || "Cal Paler Nou";
  const options = {
    body: data.body || "",
    tag: "bugaderia-avis",
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((all) => {
      if (all.length > 0) return all[0].focus();
      return clients.openWindow("/");
    })
  );
});

// Chrome exigeix que el service worker respongui almenys a "fetch" perquè
// consideri el lloc instal·lable com a app (criteri clàssic del
// "beforeinstallprompt"). Aquí simplement deixem passar la petició normal
// a la xarxa, sense afegir cap mena de caché.
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
