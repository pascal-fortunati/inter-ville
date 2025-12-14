import { useEffect, useState } from 'react';

const THEMES = [
  'light','dark','cupcake','bumblebee','emerald','corporate','synthwave','retro','cyberpunk','valentine','halloween','garden',
  'forest','aqua','lofi','pastel','fantasy','wireframe','black','luxury','dracula','cmyk','autumn','business','acid','lemonade',
  'night','coffee','winter','dim','nord','sunset','caramellatte','abyss','silk'
];

export default function ThemeSidebar() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch { void 0; }
  }, [theme]);

  useEffect(() => {
    function onOpen() { setOpen(true); }
    window.addEventListener('theme:open', onOpen);
    return () => { window.removeEventListener('theme:open', onOpen); };
  }, []);

  function applyTheme(t) {
    setTheme(t);
    try {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('theme:changed', { detail: { theme: t } }));
      }, 0);
    } catch { void 0 }
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-base-300/40 backdrop-blur-sm z-40" onClick={() => setOpen(false)} />
      )}
      <div className={`fixed inset-y-0 right-0 w-[26rem] sm:w-[32rem] bg-base-100 border-l border-base-300 shadow-2xl z-50 transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
        <div className="p-4 border-b border-base-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined">palette</span>
            <div className="flex flex-col">
              <div className="font-bold">Thèmes</div>
              <div className="text-xs opacity-70">Actuel: {theme}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)} title="Fermer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="rounded-box grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
            {THEMES.map(t => {
              const active = theme === t;
              const activeCls = active ? 'outline-base-content' : '';
              return (
                <div
                  key={t}
                  className={`border-base-content/20 hover:border-base-content/40 overflow-hidden rounded-md border outline-2 outline-offset-2 outline-transparent ${activeCls} relative`}
                  data-set-theme={t}
                  aria-current={active ? 'true' : 'false'}
                  onClick={() => applyTheme(t)}
                >
                  {active && (
                    <div className="absolute top-2 right-2 badge badge-success gap-1">
                      <span className="material-symbols-outlined">check_circle</span>
                      <span>Actif</span>
                    </div>
                  )}
                  <div className="bg-base-100 text-base-content w-full cursor-pointer font-sans" data-theme={t}>
                    <div className="grid grid-cols-5 grid-rows-3">
                      <div className="bg-base-200 col-start-1 row-span-2 row-start-1"></div>
                      <div className="bg-base-300 col-start-1 row-start-3"></div>
                      <div className="bg-base-100 col-span-4 col-start-2 row-span-3 row-start-1 flex flex-col gap-0.5 p-1.5">
                        <div className="font-semibold text-sm break-words">{t}</div>
                        <div className="flex flex-wrap gap-0.5">
                          <div className="bg-primary flex aspect-square w-4 items-center justify-center rounded lg:w-5">
                            <div className="text-primary-content text-xs font-bold">A</div>
                          </div>
                          <div className="bg-secondary flex aspect-square w-4 items-center justify-center rounded lg:w-5">
                            <div className="text-secondary-content text-xs font-bold">A</div>
                          </div>
                          <div className="bg-accent flex aspect-square w-4 items-center justify-center rounded lg:w-5">
                            <div className="text-accent-content text-xs font-bold">A</div>
                          </div>
                          <div className="bg-neutral flex aspect-square w-4 items-center justify-center rounded lg:w-5">
                            <div className="text-neutral-content text-xs font-bold">A</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </div>
      </div>
    </>
  );
}

