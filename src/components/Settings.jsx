import React, { useState, useEffect } from "react";
import { X, Mail, Bell, LogOut } from "lucide-react";
import { COLOR } from "../config";
import { registerDoorEmail, getEmailsForDoor } from "../supabaseClient";
import { enablePushNotifications, getPushPermissionState, pushSupported } from "../push";
import { clearIdentity } from "../identity";

export default function Settings({ identity, onClose, onForget }) {
  const [emails, setEmails] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [pushState, setPushState] = useState("checking");

  useEffect(() => {
    getEmailsForDoor(identity.door).then(setEmails);
    getPushPermissionState().then(setPushState);
  }, [identity.door]);

  async function addEmail() {
    const clean = newEmail.trim().toLowerCase();
    if (!clean) return;
    const result = await registerDoorEmail(identity.door, clean);
    if (result.ok) {
      setEmails(await getEmailsForDoor(identity.door));
      setNewEmail("");
      setMsg("Correu afegit a la porta " + identity.door + ".");
    } else {
      setMsg("Aquest correu ja està registrat amb una altra porta.");
    }
  }

  async function activatePush() {
    try {
      await enablePushNotifications(identity.email);
      setPushState("granted");
      setMsg("Notificacions activades en aquest dispositiu.");
    } catch (e) {
      setMsg(e.message || "No s'han pogut activar les notificacions.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(21,36,38,0.45)" }}>
      <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: COLOR.surface }}>
        <div className="flex items-center justify-between mb-4">
          <span className="font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Configuració</span>
          <button onClick={onClose}><X size={20} style={{ color: COLOR.inkSoft }} /></button>
        </div>

        <div className="mb-5 p-3 rounded-xl text-sm" style={{ background: COLOR.bg }}>
          Ets a la porta <b>{identity.door}</b>, connectat com <b>{identity.email}</b>.
        </div>

        <div className="mb-5">
          <div className="text-sm font-semibold mb-2 flex items-center gap-1"><Mail size={15} /> Correus d'aquesta porta</div>
          <ul className="text-sm mb-2 space-y-1" style={{ color: COLOR.inkSoft }}>
            {emails.map(e => <li key={e}>• {e}</li>)}
          </ul>
          <div className="flex gap-2">
            <input value={newEmail} onChange={e => setNewEmail(e.target.value)} type="email"
              placeholder="afegir-companys@exemple.cat" className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={{ border: `1px solid ${COLOR.line}` }} />
            <button onClick={addEmail} className="px-3 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: COLOR.water }}>Afegeix</button>
          </div>
        </div>

        <div className="mb-5">
          <div className="text-sm font-semibold mb-2 flex items-center gap-1"><Bell size={15} /> Notificacions al mòbil</div>
          {!pushSupported() ? (
            <p className="text-sm" style={{ color: COLOR.inkSoft }}>Aquest navegador no admet notificacions push.</p>
          ) : pushState === "granted" ? (
            <p className="text-sm" style={{ color: COLOR.success }}>Notificacions activades en aquest dispositiu ✔</p>
          ) : (
            <button onClick={activatePush} className="px-3 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: COLOR.soap, color: COLOR.ink }}>
              Activa avisos quan acabi la bugada
            </button>
          )}
        </div>

        {msg && <p className="text-xs mb-4" style={{ color: COLOR.inkSoft }}>{msg}</p>}

        <button onClick={() => { clearIdentity(); onForget(); }} className="flex items-center gap-1 text-xs" style={{ color: COLOR.danger }}>
          <LogOut size={14} /> Aquest dispositiu no és meu / canviar de porta
        </button>
      </div>
    </div>
  );
}
