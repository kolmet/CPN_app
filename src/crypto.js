// El correu real de cada persona no es guarda MAI a Supabase.
// Aquí es converteix en:
//  - un hash SHA-256 (irreversible) per comprovar duplicats i fer de clau
//  - una versió emmascarada, només per mostrar-la a la interfície
export async function hashEmail(email) {
  const normalized = email.trim().toLowerCase();
  const data = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function maskEmail(email) {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at === -1) return "***";
  const user = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const maskedUser = user.length <= 2 ? `${user[0] || "*"}*` : `${user.slice(0, 2)}***`;
  const dotIdx = domain.indexOf(".");
  const maskedDomain = dotIdx === -1 ? `${domain[0] || "*"}***` : `${domain[0]}***${domain.slice(dotIdx)}`;
  return `${maskedUser}@${maskedDomain}`;
}
