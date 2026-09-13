import React, { useState } from "react";
import { Droplets, Mail, DoorOpen, User } from "lucide-react";
import { COLOR, FLOORS, APP_NAME } from "../config";
import { findDoorByEmail, registerDoorEmail, getDoorZone, setDoorZone } from "../supabaseClient";

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [door, setDoor] = useState("");
  const [zonePick, setZonePick] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function handleFirstStep() {
    const cleanEmail = email.trim().toLowerCase();
    const cleanNickname = nickname.trim();
    const cleanDoor = door.trim();
    if (!cleanEmail || !cleanNickname || !cleanDoor) return;
    setBusy(true); setErr("");
    try {
      const existingDoorForEmail = await findDoorByEmail(cleanEmail);
      if (existingDoorForEmail) {
        if (existingDoorForEmail !== cleanDoor) {
          setErr(`Aquest correu ja està registrat amb la porta ${existingDoorForEmail}.`);
          setBusy(false);
          return;
        }
        // Ja existia amb aquesta mateixa porta: només cal recuperar la zona.
        const zoneId = await getDoorZone(cleanDoor);
        onComplete({ email: cleanEmail, nickname: cleanNickname, door: cleanDoor, zone: zoneId });
        return;
      }
      const existingZone = await getDoorZone(cleanDoor);
      if (existingZone) {
        await finishRegistration(cleanDoor, existingZone, false);
      } else {
        setStep(2);
      }
    } catch (e) {
      setErr("No s'ha pogut comprovar les dades. Torna-ho a provar.");
    } finally {
      setBusy(false);
    }
  }

  async function finishRegistration(finalDoor, zoneId, persistZone) {
    setBusy(true); setErr("");
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanNickname = nickname.trim();
      const result = await registerDoorEmail(finalDoor, cleanEmail, cleanNickname);
      if (!result.ok) {
        setErr(result.reason === "other_door"
          ? `Aquest correu ja està registrat amb la porta ${result.existingDoor}.`
          : "Hi ha hagut un problema desant les dades. Torna-ho a provar.");
        setBusy(false);
        return;
      }
      if (persistZone) await setDoorZone(finalDoor, zoneId);
      onComplete({ email: cleanEmail, nickname: cleanNickname, door: finalDoor, zone: zoneId });
    } catch (e) {
      setErr("Hi ha hagut un problema desant les dades.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ background: COLOR.bg }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}` }}>
        <div className="flex items-center gap-2 mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          <Droplets size={20} style={{ color: COLOR.water }} />
          <span className="text-lg font-bold">{APP_NAME} · Reserves</span>
        </div>
        <p className="text-sm mb-5" style={{ color: COLOR.inkSoft }}>
          El correu només serveix per evitar registres duplicats — no es mostra mai. El que veuran els veïns és el teu <b>nickname</b> i la <b>porta</b>.
        </p>

        {step === 1 && (
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: COLOR.inkSoft }}>Correu electrònic</label>
            <div className="flex items-center gap-2 mb-3">
              <Mail size={18} style={{ color: COLOR.water }} />
              <input value={email} onChange={e => setEmail(e.target.value)} type="email"
                placeholder="tu@exemple.cat" className="flex-1 px-3 py-2 rounded-lg outline-none"
                style={{ border: `1px solid ${COLOR.line}` }} />
            </div>

            <label className="block text-xs font-medium mb-1" style={{ color: COLOR.inkSoft }}>Nickname (com et veuran els veïns)</label>
            <div className="flex items-center gap-2 mb-3">
              <User size={18} style={{ color: COLOR.water }} />
              <input value={nickname} onChange={e => setNickname(e.target.value)}
                placeholder="p.ex. Marta" className="flex-1 px-3 py-2 rounded-lg outline-none"
                style={{ border: `1px solid ${COLOR.line}` }} />
            </div>

            <label className="block text-xs font-medium mb-1" style={{ color: COLOR.inkSoft }}>Número de porta</label>
            <div className="flex items-center gap-2 mb-4">
              <DoorOpen size={18} style={{ color: COLOR.water }} />
              <input value={door} onChange={e => setDoor(e.target.value)}
                placeholder="p.ex. 3B" className="flex-1 px-3 py-2 rounded-lg outline-none"
                style={{ border: `1px solid ${COLOR.line}` }} />
            </div>

            {err && <p className="text-xs mb-3" style={{ color: COLOR.danger }}>{err}</p>}
            <button disabled={!email.trim() || !nickname.trim() || !door.trim() || busy} onClick={handleFirstStep}
              className="w-full px-4 py-2 rounded-full text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: COLOR.water }}>
              {busy ? "Comprovant…" : "Continua"}
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="text-sm mb-3">La porta <b>{door}</b> encara no té zona de bugaderia assignada. Tria-la:</p>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {FLOORS.map(f => (
                <div key={f.id}>
                  <div className="text-xs font-semibold uppercase mb-1" style={{ color: COLOR.inkSoft }}>{f.name}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {f.zones.map(z => (
                      <button key={z.id} onClick={() => setZonePick(z.id)}
                        className="px-3 py-2 rounded-lg text-sm text-left"
                        style={zonePick === z.id ? { background: COLOR.water, color: "#fff" } : { background: COLOR.bg, border: `1px solid ${COLOR.line}` }}>
                        {z.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {err && <p className="text-xs mt-3" style={{ color: COLOR.danger }}>{err}</p>}
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setStep(1); setErr(""); }} className="px-4 py-2 rounded-full text-sm" style={{ color: COLOR.inkSoft }}>Enrere</button>
              <button disabled={!zonePick || busy} onClick={() => finishRegistration(door.trim(), zonePick, true)}
                className="flex-1 px-4 py-2 rounded-full text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: COLOR.water }}>
                {busy ? "Desant…" : "Desa i continua"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
