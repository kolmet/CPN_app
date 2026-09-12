import React, { useState, useEffect, useCallback } from "react";
import { Settings as SettingsIcon, Droplets } from "lucide-react";
import { COLOR } from "./config";
import { loadIdentity } from "./identity";
import Onboarding from "./components/Onboarding";
import Settings from "./components/Settings";
import LaundryTab from "./components/LaundryTab";
import RoomsTab from "./components/RoomsTab";
import MyBookingsTab from "./components/MyBookingsTab";
import StatsTab from "./components/StatsTab";
import InstallPrompt from "./components/InstallPrompt";

export default function App() {
  const [identity, setIdentity] = useState(() => loadIdentity());
  const [tab, setTab] = useState("bugaderia");
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); }, []);

  if (!identity) {
    return <Onboarding onComplete={(id) => setIdentity(id)} />;
  }

  return (
    <div className="min-h-screen" style={{ background: COLOR.bg, fontFamily: "'Inter', sans-serif", color: COLOR.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
        @keyframes washpulse { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
        .washing { animation: washpulse 1.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .washing { animation: none; } }
      `}</style>

      {toast && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg text-sm"
          style={{ background: COLOR.waterDark, color: "#fff" }}>{toast}</div>
      )}

      {showSettings && (
        <Settings identity={identity} onClose={() => setShowSettings(false)} onForget={() => { setIdentity(null); setShowSettings(false); }} />
      )}

      <div className="max-w-3xl mx-auto pb-16">
        <header className="px-5 pt-6 pb-4 flex items-center justify-between">
          <div>
            <div className="text-xs tracking-widest uppercase" style={{ color: COLOR.inkSoft }}>Cooperativa</div>
            <div className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <Droplets size={22} style={{ color: COLOR.water }} /> Reserves
            </div>
          </div>
          <button onClick={() => setShowSettings(true)} className="p-2 rounded-full" style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}` }}>
            <SettingsIcon size={18} style={{ color: COLOR.inkSoft }} />
          </button>
        </header>

        <div className="px-5 flex gap-2 mb-4 overflow-x-auto">
          {[
            { id: "bugaderia", label: "Bugaderia" },
            { id: "habitacions", label: "Habitacions" },
            { id: "meus", label: "Els meus torns" },
            { id: "stats", label: "Estadístiques" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-4 py-2 rounded-full text-sm font-medium shrink-0"
              style={tab === t.id ? { background: COLOR.water, color: "#fff" } : { background: COLOR.surface, color: COLOR.inkSoft, border: `1px solid ${COLOR.line}` }}>
              {t.label}
            </button>
          ))}
        </div>

        <InstallPrompt />

        {tab === "bugaderia" && <LaundryTab identity={identity} showToast={showToast} />}
        {tab === "habitacions" && <RoomsTab identity={identity} showToast={showToast} />}
        {tab === "meus" && <MyBookingsTab identity={identity} showToast={showToast} />}
        {tab === "stats" && <StatsTab />}
      </div>
    </div>
  );
}
