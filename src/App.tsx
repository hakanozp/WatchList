import { useState } from 'react';
import { Film, Search, LogOut, ChevronDown, Columns2, Archive, Layers2, Tv } from 'lucide-react';
import { KanbanBoard } from './components/KanbanBoard';
import { ArchivePage } from './components/ArchivePage';
import { LoginPage } from './components/LoginPage';
import { useLanguage } from './contexts/LanguageContext';
import { useAuth } from './contexts/AuthContext';
import type { Lang } from './lib/translations';
import type { MediaType } from './types/media';

type NavTab = 'board' | 'archive';

export default function App() {
  const { t, lang, setLang } = useLanguage();
  const { user, loading, signOut } = useAuth();
  const [search, setSearch] = useState('');
  const [archiveSearch, setArchiveSearch] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('board');
  const [typeFilter, setTypeFilter] = useState<MediaType | 'all'>('all');
  const [archiveTypeFilter, setArchiveTypeFilter] = useState<MediaType | 'all'>('all');

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
        <div className="max-w-6xl mx-auto px-4">

          {/* ── Üst satır: Logo + sağdaki sabit kontroller ── */}
          <div className="flex items-center gap-2 py-2.5">
            <div className="p-1.5 bg-blue-600 rounded-lg flex-shrink-0">
              <Film size={18} className="text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight flex-shrink-0">
              Watchlist
            </h1>

            {/* Desktop ortası: Tahta/Arşiv → Tür filtresi → Arama */}
            <div className="hidden sm:flex flex-1 items-center gap-2">
              {/* Tahta / Arşiv */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 flex-shrink-0">
                {(['board', 'archive'] as NavTab[]).map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      activeTab === tab
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}>
                    {tab === 'board' ? <Columns2 size={13} /> : <Archive size={13} />}
                    {t(tab === 'board' ? 'nav_board' : 'nav_archive')}
                  </button>
                ))}
              </div>

              {/* Tür filtresi */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 flex-shrink-0">
                {([
                  { value: 'all'    as const, icon: <Layers2 size={13} />, label: t('type_all') },
                  { value: 'movie'  as const, icon: <Film size={13} />,    label: t('type_movie') },
                  { value: 'series' as const, icon: <Tv size={13} />,      label: t('type_series') },
                ]).map(({ value, icon, label }) => {
                  const active = activeTab === 'board' ? typeFilter : archiveTypeFilter;
                  const setter = activeTab === 'board' ? setTypeFilter : setArchiveTypeFilter;
                  return (
                    <button key={value} onClick={() => setter(value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                        active === value
                          ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      }`}>
                      {icon}{label}
                    </button>
                  );
                })}
              </div>

              {/* Arama */}
              <div className="flex-1 relative max-w-md">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input type="text"
                  value={activeTab === 'board' ? search : archiveSearch}
                  onChange={(e) => activeTab === 'board' ? setSearch(e.target.value) : setArchiveSearch(e.target.value)}
                  placeholder={activeTab === 'board' ? t('search_placeholder') : t('archive_search')}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Mobil ortası: boşluk */}
            <div className="flex-1 sm:hidden" />

            {/* Dil seçici */}
            <div className="flex items-center gap-1 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
              {(['tr', 'en'] as Lang[]).map((l) => (
                <button key={l} onClick={() => setLang(l)}
                  className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                    lang === l
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Kullanıcı menüsü */}
            <div className="relative flex-shrink-0">
              <button onClick={() => setShowUserMenu((v) => !v)}
                className="flex items-center gap-1 px-1.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                  {user.email?.[0].toUpperCase()}
                </div>
                <ChevronDown size={13} className="text-gray-400" />
              </button>
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 top-full mt-1.5 z-20 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t('auth_user_label')}</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate mt-0.5">{user.email}</p>
                    </div>
                    <button onClick={() => { setShowUserMenu(false); signOut(); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <LogOut size={14} />{t('auth_logout')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Mobil alt satırlar — her iki sekme için aynı layout ── */}
          <div className="sm:hidden flex flex-col gap-2 pb-2.5">
            {/* Satır 1: Tahta/Arşiv + Tür filtresi yan yana */}
            <div className="flex gap-2">
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                {(['board', 'archive'] as NavTab[]).map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      activeTab === tab
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                    {tab === 'board' ? <Columns2 size={13} /> : <Archive size={13} />}
                    {t(tab === 'board' ? 'nav_board' : 'nav_archive')}
                  </button>
                ))}
              </div>

              <div className="flex flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                {([
                  { value: 'all'    as const, icon: <Layers2 size={13} />, label: t('type_all') },
                  { value: 'movie'  as const, icon: <Film size={13} />,    label: t('type_movie') },
                  { value: 'series' as const, icon: <Tv size={13} />,      label: t('type_series') },
                ]).map(({ value, icon, label }) => {
                  const active = activeTab === 'board' ? typeFilter : archiveTypeFilter;
                  const setter = activeTab === 'board' ? setTypeFilter : setArchiveTypeFilter;
                  return (
                    <button key={value} onClick={() => setter(value)}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                        active === value
                          ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                      {icon}{label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Satır 2: Arama */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input type="text"
                value={activeTab === 'board' ? search : archiveSearch}
                onChange={(e) => activeTab === 'board' ? setSearch(e.target.value) : setArchiveSearch(e.target.value)}
                placeholder={activeTab === 'board' ? t('search_placeholder') : t('archive_search')}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'board' ? (
          <KanbanBoard search={search} typeFilter={typeFilter} />
        ) : (
          <ArchivePage search={archiveSearch} typeFilter={archiveTypeFilter} />
        )}
      </main>
    </div>
  );
}
