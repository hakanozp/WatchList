import { useState } from 'react';
import { Film, Search, LogOut, ChevronDown, Columns2, Archive } from 'lucide-react';
import { KanbanBoard } from './components/KanbanBoard';
import { ArchivePage } from './components/ArchivePage';
import { LoginPage } from './components/LoginPage';
import { useLanguage } from './contexts/LanguageContext';
import { useAuth } from './contexts/AuthContext';
import type { Lang } from './lib/translations';

type NavTab = 'board' | 'archive';

export default function App() {
  const { t, lang, setLang } = useLanguage();
  const { user, loading, signOut } = useAuth();
  const [search, setSearch] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('board');

  // Auth loading — blank screen while restoring session
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  // Not authenticated — show login
  if (!user) return <LoginPage />;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          {/* Logo */}
          <div className="p-1.5 bg-blue-600 rounded-lg flex-shrink-0">
            <Film size={18} className="text-white" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight flex-shrink-0">
            Watchlist
          </h1>

          {/* Nav tabs */}
          <div className="flex items-center gap-1 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'board'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Columns2 size={13} />
              {t('nav_board')}
            </button>
            <button
              onClick={() => setActiveTab('archive')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'archive'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Archive size={13} />
              {t('nav_archive')}
            </button>
          </div>

          {/* Search bar — only on board tab */}
          <div className={`flex-1 relative max-w-md mx-auto ${activeTab !== 'board' ? 'invisible' : ''}`}>
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search_placeholder')}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Language switcher */}
          <div className="flex items-center gap-1 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            {(['tr', 'en'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  lang === l
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* User menu */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowUserMenu((v) => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                {user.email?.[0].toUpperCase()}
              </div>
              <ChevronDown size={13} className="text-gray-400" />
            </button>

            {showUserMenu && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-1.5 z-20 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t('auth_user_label')}</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate mt-0.5">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { setShowUserMenu(false); signOut(); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut size={14} />
                    {t('auth_logout')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'board' ? (
          <KanbanBoard search={search} />
        ) : (
          <ArchivePage />
        )}
      </main>
    </div>
  );
}
