self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { /* ignore */ }
  const title = data.title || "Bugaderia Cooperativa";
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
