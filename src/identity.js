const KEY = "bugaderia_identity";

export function loadIdentity() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveIdentity(identity) {
  try { localStorage.setItem(KEY, JSON.stringify(identity)); } catch (e) { /* ignore */ }
}

export function clearIdentity() {
  try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
}
