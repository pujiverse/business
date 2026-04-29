// app.js — top level. Owns the layout, the hash router, and the theme.
//
// Why hash routing? It works on GitHub Pages with no extra config —
// `index.html#/customers` always loads index.html, then we read the hash
// and decide what page to render.

import { getCreds, clearCreds } from './db.js';
import { renderSetup } from './setup.js';
import { mount, esc, toast } from './ui.js';
import { renderHome }      from './pages/home.js';
import { renderCustomers } from './pages/customers.js';
import { renderExpenses }  from './pages/expenses.js';
import { renderLoans }     from './pages/loans.js';
import { renderReports }   from './pages/reports.js';
import { renderSettings }  from './pages/settings.js';

// ----- Theme: persists between sessions, defaults to system. -----
const THEME_KEY = 'bizmgr.theme';
function applyTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const dark =
    saved === 'dark' ||
    (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
}
applyTheme();
window.toggleTheme = () => {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
};

// ----- The map of routes the app knows about. -----
const ROUTES = [
  { path: '/',          name: 'Home',      icon: '🏠', render: renderHome      },
  { path: '/customers', name: 'Customers', icon: '👥', render: renderCustomers },
  { path: '/expenses',  name: 'Expenses',  icon: '💸', render: renderExpenses  },
  { path: '/loans',     name: 'Loans',     icon: '🏦', render: renderLoans     },
  { path: '/reports',   name: 'Reports',   icon: '📊', render: renderReports   },
  { path: '/settings',  name: 'Settings',  icon: '⚙️', render: renderSettings  },
];

const root = document.getElementById('app');

function currentPath() {
  // strip the leading '#'
  const h = (location.hash || '#/').replace(/^#/, '');
  return h.startsWith('/') ? h : '/' + h;
}

/** Build the layout (sidebar + topbar + content area). */
function shell(activePath) {
  const links = ROUTES.map((r) => `
    <a href="#${r.path}"
       class="flex items-center gap-3 px-4 py-2.5 rounded-lg transition
              ${activePath === r.path
                ? 'bg-primary text-white'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700'}">
      <span class="text-lg">${r.icon}</span>
      <span class="font-medium">${r.name}</span>
    </a>
  `).join('');

  return `
    <div class="flex min-h-screen">
      <!-- Mobile menu button -->
      <button id="menu-btn"
              class="md:hidden fixed top-3 left-3 z-40 btn btn-ghost bg-white dark:bg-slate-800 shadow">☰</button>

      <!-- Sidebar -->
      <aside id="sidebar"
             class="fixed md:static inset-y-0 left-0 z-30 w-64
                    bg-white dark:bg-slate-800 shadow-md
                    -translate-x-full md:translate-x-0 transition-transform">
        <div class="px-5 py-5 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
          <div class="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center font-bold">B</div>
          <div>
            <div class="font-bold leading-tight">BizManager</div>
            <div class="text-xs text-slate-500">Lite</div>
          </div>
        </div>
        <nav class="p-3 space-y-1">${links}</nav>

        <div class="absolute bottom-0 inset-x-0 p-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <button onclick="toggleTheme()" class="btn btn-ghost text-sm" title="Toggle theme">🌗 Theme</button>
          <button id="logout-btn" class="btn btn-ghost text-sm text-red-600">Disconnect</button>
        </div>
      </aside>

      <!-- Main -->
      <main class="flex-1 p-4 md:p-8 overflow-x-auto">
        <div id="page"></div>
      </main>
    </div>
  `;
}

function renderShellAndPage() {
  // No credentials yet? Show the setup wizard.
  if (!getCreds()) {
    renderSetup(root, { onDone: () => { location.hash = '#/'; route(); } });
    return;
  }

  const path = currentPath();
  const route = ROUTES.find((r) => r.path === path) || ROUTES[0];

  // Re-render the shell so the active link highlights correctly
  mount(root, shell(route.path));

  // Mobile menu wiring
  const sidebar = root.querySelector('#sidebar');
  root.querySelector('#menu-btn').onclick = () => {
    sidebar.classList.toggle('-translate-x-full');
  };
  // Hide mobile sidebar after picking a link
  sidebar.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => sidebar.classList.add('-translate-x-full'))
  );

  // Disconnect = forget creds and go back to wizard
  root.querySelector('#logout-btn').onclick = () => {
    if (confirm('Disconnect this device from your database?')) {
      clearCreds();
      location.hash = '';
      renderShellAndPage();
    }
  };

  // Render the actual page
  const pageEl = root.querySelector('#page');
  try {
    route.render(pageEl, { navigate: (p) => { location.hash = '#' + p; } });
  } catch (e) {
    pageEl.innerHTML = `<div class="card text-red-600">${esc(e.message)}</div>`;
    console.error(e);
  }
}

function route() { renderShellAndPage(); }

window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', route);
// In case DOMContentLoaded already fired:
if (document.readyState !== 'loading') route();

// Friendly global error handler so things never die silently
window.addEventListener('unhandledrejection', (e) => {
  console.error(e.reason);
  toast(e.reason?.message || 'Something went wrong.', 'error');
});
