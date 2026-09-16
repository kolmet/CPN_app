import React, { useState, useEffect, useCallback } from "react";
import { Settings as SettingsIcon, ArrowLeft } from "lucide-react";
import { COLOR, MODULES, HOME_GRID_MODULES, HEADER_MODULES, APP_NAME } from "./config";
import { loadIdentity, saveIdentity } from "./identity";
import { SketchFilterDefs, IconTile, ClockIcon, LogoIcon, ICONS } from "./icons";
import Onboarding from "./components/Onboarding";
import Settings from "./components/Settings";
import LaundryTab from "./components/LaundryTab";
import SpaceTab from "./components/SpaceTab";
import MyBookingsTab from "./components/MyBookingsTab";
import StatsTab from "./components/StatsTab";
import InstallPrompt from "./components/InstallPrompt";
import HomeCalendar from "./components/HomeCalendar";
import RulesGate from "./components/RulesGate";

const SPACE_IDS = {
  hostes: ["room-p1", "room-p2"],
  polivalent: ["room-polivalent"],
  moviment: ["room-moviment"],
  bicicletes: ["room-bicicletes"],
  taller: ["room-taller"],
  terrasses: ["room-terrasses"],
};

export default function App() {
  const [identity, setIdentity] = useState(() => loadIdentity());
  const [screen, setScreen] = useState("home"); // home | bugaderia | hostes | polivalent | moviment | stats | meus
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const showToast = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); }, []);

  useEffect(() => {
    function onUpdateReady() { setUpdateAvailable(true); }
    window.addEventListener("app-update-ready", onUpdateReady);
    return () => window.removeEventListener("app-update-ready", onUpdateReady);
  }, []);

  if (!identity) {
    return <Onboarding onComplete={(id) => { saveIdentity(id); setIdentity(id); }} />;
  }

  const currentModule = screen !== "home" && screen !== "meus" ? MODULES[screen] : null;

  return (
    <div className="min-h-screen" style={{ background: COLOR.bg, fontFamily: "'Inter', sans-serif", color: COLOR.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&display=swap');
        @keyframes washpulse { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
        .washing { animation: washpulse 1.4s ease-in-out infinite; }
      `}</style>
      <SketchFilterDefs />

      {updateAvailable && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg text-sm flex items-center gap-3"
          style={{ background: COLOR.ink, color: "#fff" }}>
          Hi ha una versió nova de l'app.
          <button onClick={() => window.location.reload()} className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: COLOR.soap, color: COLOR.ink }}>
            Actualitza
          </button>
        </div>
      )}

      {toast && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg text-sm"
          style={{ background: COLOR.waterDark, color: "#fff" }}>{toast}</div>
      )}

      {showSettings && (
        <Settings identity={identity} onClose={() => setShowSettings(false)} onForget={() => { setIdentity(null); setShowSettings(false); }} />
      )}

      <div className="max-w-3xl mx-auto pb-16">
        <header className="px-5 pt-6 pb-4 flex items-center justify-between">
          {screen === "home" ? (
            <div className="flex items-center gap-2">
              <LogoIcon size={30} color={COLOR.water} />
              <div>
                <div className="text-xs tracking-widest uppercase" style={{ color: COLOR.inkSoft }}>{APP_NAME}</div>
                <div className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Reserves</div>
              </div>
            </div>
          ) : (
            <button onClick={() => setScreen("home")} className="flex items-center gap-2 font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: currentModule?.ink || COLOR.ink }}>
              <LogoIcon size={20} color={currentModule?.ink || COLOR.ink} />
              <ArrowLeft size={20} /> {currentModule ? currentModule.label : "Els meus torns"}
            </button>
          )}
          <div className="flex items-center gap-2">
            {screen === "home" && HEADER_MODULES.map(key => {
              const mod = MODULES[key];
              const Icon = ICONS[mod.icon];
              return (
                <button key={key} onClick={() => setScreen(key)} className="p-2 rounded-full" style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}` }} title={mod.label}>
                  {Icon && <Icon color={mod.ink} size={18} />}
                </button>
              );
            })}
            {screen === "home" && (
              <button onClick={() => setScreen("meus")} className="p-2 rounded-full" style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}` }} title="Els meus torns">
                <ClockIcon color={COLOR.inkSoft} size={18} />
              </button>
            )}
            <button onClick={() => setShowSettings(true)} className="p-2 rounded-full" style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}` }}>
              <SettingsIcon size={18} style={{ color: COLOR.inkSoft }} />
            </button>
          </div>
        </header>

        {screen === "home" && (
          <>
            <InstallPrompt />
            <div className="px-5 grid grid-cols-3 gap-4 mt-2 mb-4">
              {HOME_GRID_MODULES.map(key => {
                const mod = MODULES[key];
                return <IconTile key={key} icon={mod.icon} bg={mod.bg} ink={mod.ink} label={mod.label} onClick={() => setScreen(key)} />;
              })}
            </div>
            <HomeCalendar />
          </>
        )}

        {screen === "bugaderia" && <RulesGate moduleKey="bugaderia"><LaundryTab identity={identity} showToast={showToast} /></RulesGate>}
        {screen === "hostes" && <RulesGate moduleKey="hostes"><SpaceTab moduleKey="hostes" spaceIds={SPACE_IDS.hostes} identity={identity} showToast={showToast} /></RulesGate>}
        {screen === "polivalent" && <RulesGate moduleKey="polivalent"><SpaceTab moduleKey="polivalent" spaceIds={SPACE_IDS.polivalent} identity={identity} showToast={showToast} /></RulesGate>}
        {screen === "moviment" && <RulesGate moduleKey="moviment"><SpaceTab moduleKey="moviment" spaceIds={SPACE_IDS.moviment} identity={identity} showToast={showToast} /></RulesGate>}
        {screen === "bicicletes" && <RulesGate moduleKey="bicicletes"><SpaceTab moduleKey="bicicletes" spaceIds={SPACE_IDS.bicicletes} identity={identity} showToast={showToast} /></RulesGate>}
        {screen === "taller" && <RulesGate moduleKey="taller"><SpaceTab moduleKey="taller" spaceIds={SPACE_IDS.taller} identity={identity} showToast={showToast} /></RulesGate>}
        {screen === "terrasses" && <RulesGate moduleKey="terrasses"><SpaceTab moduleKey="terrasses" spaceIds={SPACE_IDS.terrasses} identity={identity} showToast={showToast} /></RulesGate>}
        {screen === "stats" && <StatsTab identity={identity} showToast={showToast} />}
        {screen === "meus" && <MyBookingsTab identity={identity} showToast={showToast} />}
      </div>
    </div>
  );
}
