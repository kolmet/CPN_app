import React, { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { COLOR } from "../config";

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}
function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem("install_dismissed") === "1");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    function onBeforeInstall(e) {
      e.preventDefault();
      setDeferredPrompt(e);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  if (isStandalone() || dismissed) return null;

  function dismiss() {
    setDismissed(true);
    sessionStorage.setItem("install_dismissed", "1");
  }

  async function install() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      setExpanded(true);
    }
  }

  return (
    <div className="px-5 mb-3">
      <div className="rounded-xl p-3" style={{ background: COLOR.surface, border: `1px solid ${COLOR.line}` }}>
        <div className="flex items-center gap-3">
          <Download size={18} style={{ color: COLOR.water }} />
          <div className="flex-1 text-xs" style={{ color: COLOR.inkSoft }}>
            Instal·la l'app a la pantalla d'inici per obrir-la com una aplicació i rebre avisos.
          </div>
          <button onClick={install} className="px-3 py-1.5 rounded-full text-xs font-semibold text-white shrink-0" style={{ background: COLOR.water }}>
            Instal·la
          </button>
          <button onClick={dismiss} className="shrink-0"><X size={16} style={{ color: COLOR.inkSoft }} /></button>
        </div>
        {expanded && !deferredPrompt && (
          <div className="mt-2 pt-2 text-xs" style={{ borderTop: `1px solid ${COLOR.line}`, color: COLOR.inkSoft }}>
            {isIOS() ? (
              <>A Safari: toca <b>Compartir</b> (el quadrat amb la fletxa) → <b>Afegeix a l'inici</b>.</>
            ) : (
              <>Al navegador: busca la icona d'instal·lar a la barra d'adreces (una pantalla amb una fletxa), o obre el menú
                {" "}<b>⋮</b> i tria <b>"Instal·la l'aplicació"</b> / <b>"Afegeix a la pantalla d'inici"</b>.</>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
