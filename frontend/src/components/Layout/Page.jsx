// Layout Page
// - Enveloppe avec titre, sous‑titre et actions
import Breadcrumb from './Breadcrumb.jsx';

export default function Page({ icon, title, subtitle, actions, children, showBreadcrumb = true }) {
  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8">
        {title ? (
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                {icon ? (<span className="material-symbols-outlined text-4xl">{icon}</span>) : null}
                <div>
                  <h1 className="text-4xl font-bold mb-1">{title}</h1>
                  {subtitle ? (<p className="text-base-content/70">{subtitle}</p>) : null}
                </div>
              </div>
              {actions ? (<div className="flex items-center gap-2">{actions}</div>) : null}
            </div>
          </div>
        ) : null}
        {showBreadcrumb && (<Breadcrumb />)}
        {children}
      </div>
    </div>
  );
}
