import React, { useState } from "react";
import { COLOR, MODULES, ENABLE_DONT_SHOW_AGAIN } from "../config";
import { SPACE_RULES } from "../rules";

export default function RulesGate({ moduleKey, children }) {
  const [accepted, setAccepted] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const style = MODULES[moduleKey];
  const rules = SPACE_RULES[moduleKey];

  if (accepted || !rules) return children;

  return (
    <div className="px-5">
      <div className="rounded-2xl p-5" style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}` }}>
        <div className="font-bold text-lg mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif", color: style.ink }}>
          Normes de: {rules.title}
        </div>
        <p className="text-xs mb-4" style={{ color: COLOR.inkSoft }}>
          Normes provisionals de la cooperativa. Cal llegir-les i acceptar-les per poder fer una reserva.
        </p>
        <ol className="space-y-2.5 mb-5 text-sm list-decimal list-inside" style={{ color: COLOR.ink }}>
          {rules.items.map((r, i) => <li key={i}>{r}</li>)}
        </ol>

        {ENABLE_DONT_SHOW_AGAIN && (
          <label className="flex items-center gap-2 text-xs mb-4" style={{ color: COLOR.inkSoft }}>
            <input type="checkbox" checked={dontShowAgain} onChange={e => setDontShowAgain(e.target.checked)} />
            No tornis a mostrar aquest avís
          </label>
        )}

        <button onClick={() => setAccepted(true)}
          className="w-full px-4 py-2.5 rounded-full text-sm font-semibold text-white"
          style={{ background: style.ink }}>
          He llegit i accepto les normes
        </button>
      </div>
    </div>
  );
}
