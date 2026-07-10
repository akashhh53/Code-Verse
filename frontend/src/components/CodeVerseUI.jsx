import { useEffect, useState } from 'react';
import { Code2, Home, LogOut, Moon, Shield, Sparkles, Sun } from 'lucide-react';
import { NavLink } from 'react-router';
import { getInitials } from '../utils/problemMeta';

export function BrandMark({ subtitle = 'Practice with purpose' }) {
  return (
    <NavLink to="/" className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-content shadow-[0_0_28px_rgba(255,177,26,0.22)]">
        <Sparkles className="h-5 w-5" />
      </span>
      <div>
        <p className="text-lg font-bold leading-tight">CodeVerse</p>
        <p className="text-xs text-base-content/50">{subtitle}</p>
      </div>
    </NavLink>
  );
}

export function AppHeader({ user, onLogout, active = 'problems', actions }) {
  return (
    <header className="sticky top-0 z-40 border-b border-base-300 bg-base-200/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <BrandMark />

        <nav className="hidden items-center gap-7 text-sm font-medium text-base-content/55 md:flex">
          <NavItem to="/" active={active === 'problems'}>Problems</NavItem>
          {user?.role === 'admin' && <NavItem to="/admin" active={active === 'admin'}>Admin</NavItem>}
          <span>Study plan</span>
          <span>Discuss</span>
        </nav>

        <div className="flex items-center gap-2">
          {actions}
          <ThemeToggle />
          {user ? (
            <div className="dropdown dropdown-end">
              <button type="button" tabIndex={0} className="btn h-11 rounded-full border-base-300 bg-base-100 px-2 pr-3 hover:border-primary">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-content">
                  {getInitials(user?.firstName)}
                </span>
                <span className="hidden font-semibold sm:inline">{user?.firstName || 'Coder'}</span>
              </button>
              <ul
                tabIndex={0}
                className="menu dropdown-content z-50 mt-3 w-60 rounded-2xl border border-base-300 bg-base-100 p-2 shadow-2xl"
              >
                {user?.role === 'admin' && (
                  <li>
                    <NavLink to="/admin">
                      <Shield className="h-4 w-4" />
                      Admin Dashboard
                    </NavLink>
                  </li>
                )}
                <li>
                  <button onClick={onLogout}>
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <NavLink to="/login" className="btn btn-primary btn-sm rounded-full">
              Login
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'codeverse';
    return localStorage.getItem('codeverse-theme') || 'codeverse';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('codeverse-theme', theme);
  }, [theme]);

  const isLight = theme === 'codeverse-light';

  return (
    <button
      type="button"
      className="btn btn-square h-11 w-11 rounded-full border-base-300 bg-base-100 hover:border-primary"
      onClick={() => setTheme(isLight ? 'codeverse' : 'codeverse-light')}
      aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
      title={isLight ? 'Dark theme' : 'Light theme'}
    >
      {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}

export function BackBar({ to = '/', label = 'Back', right }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <NavLink to={to} className="btn btn-ghost rounded-full gap-2">
        <Home className="h-4 w-4" />
        {label}
      </NavLink>
      <div className="flex items-center gap-2">
        {right}
        <ThemeToggle />
      </div>
    </div>
  );
}

export function PageShell({ children, wide = false, className = '' }) {
  return <main className={`${wide ? 'cv-shell-wide' : 'cv-shell'} ${className}`}>{children}</main>;
}

export function HeroPanel({ eyebrow, title, subtitle, icon = Code2, children }) {
  const HeroIcon = icon;

  return (
    <section className="cv-panel p-5 sm:p-7">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          {eyebrow && (
            <div className="cv-chip mb-5">
              <HeroIcon className="h-4 w-4 text-primary" />
              {eyebrow}
            </div>
          )}
          <h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
            {title}
          </h1>
          {subtitle && <p className="mt-4 max-w-2xl text-base leading-7 text-base-content/58">{subtitle}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

export function StatCard({ label, value, caption, tone = 'text-base-content' }) {
  return (
    <div className="rounded-2xl border border-base-300 bg-base-100/60 p-4">
      <p className="cv-kicker">{label}</p>
      <p className={`mt-2 text-3xl font-black ${tone}`}>{value}</p>
      {caption && <p className="mt-1 text-xs text-base-content/45">{caption}</p>}
    </div>
  );
}

export function EmptyState({ icon = Code2, title, text, action }) {
  const EmptyIcon = icon;

  return (
    <div className="cv-panel border-dashed p-10 text-center">
      <EmptyIcon className="mx-auto h-10 w-10 text-base-content/30" />
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-base-content/55">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function NavItem({ to, active, children }) {
  return (
    <NavLink to={to} className={active ? 'text-base-content' : 'transition hover:text-base-content'}>
      {children}
    </NavLink>
  );
}
