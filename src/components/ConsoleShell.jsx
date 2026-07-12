import { cx } from '../utils/cx';
import { navigate } from '../lib/router';
import { IconBrand, IconBack, IconSignOut } from './icons';

// Shared Untitled UI app shell for the admin / doctor / staff consoles:
// fixed white sidebar (brand, grouped nav, footer) + scrollable main.
function navItemClass(active) {
  return cx(
    'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors outline-none',
    'focus-visible:ring-4 focus-visible:ring-brand-600/20',
    active ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
  );
}

export default function ConsoleShell({
  brand, brandHref, groups, activeKey, onNavigate, user, onSignOut, children,
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
        {brandHref ? (
          <a className="flex items-center gap-2 px-5 py-5 text-base font-semibold text-gray-900" href={brandHref}>
            <IconBrand aria-hidden="true" className="size-6 text-brand-600" /> {brand}
          </a>
        ) : (
          <span className="flex items-center gap-2 px-5 py-5 text-base font-semibold text-gray-900">
            <IconBrand aria-hidden="true" className="size-6 text-brand-600" /> {brand}
          </span>
        )}

        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-2" aria-label={`${brand} sections`}>
          {groups.map((group, gi) => (
            <div className="flex flex-col gap-1" key={group.label ?? gi}>
              {group.label && (
                <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">{group.label}</p>
              )}
              {group.items.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  className={navItemClass(activeKey === key)}
                  aria-current={activeKey === key ? 'page' : undefined}
                  onClick={() => onNavigate(key)}
                >
                  <Icon aria-hidden="true" className="size-5 shrink-0" /> {label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="flex flex-col gap-1 border-t border-gray-200 p-3">
          {user && <p className="truncate px-3 py-1 text-sm text-gray-500">{user.fullName ?? user.email}</p>}
          <button className={navItemClass(false)} onClick={() => navigate('/')}>
            <IconBack aria-hidden="true" className="size-5 shrink-0" /> Back to booking
          </button>
          <button className={navItemClass(false)} onClick={onSignOut}>
            <IconSignOut aria-hidden="true" className="size-5 shrink-0" /> Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-6 lg:p-8">{children}</main>
    </div>
  );
}
