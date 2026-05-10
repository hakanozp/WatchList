import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useTMDB } from '../hooks/useTMDB';
import { posterUrl } from '../lib/tmdb';
import { useLanguage } from '../contexts/LanguageContext';
import type { TMDBSearchResult } from '../types/media';

interface Props {
  onSelect: (result: TMDBSearchResult) => void;
}

export function TMDBSearch({ onSelect }: Props) {
  const [query, setQuery] = useState('');
  const { t } = useLanguage();
  const tmdbLang = t('tmdb_lang');
  const { results, loading } = useTMDB(query, tmdbLang);
  const apiKeyMissing = !import.meta.env.VITE_TMDB_API_KEY;

  if (apiKeyMissing) return null;

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {t('tmdb_search_label')}
      </label>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('tmdb_search_placeholder')}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {loading && (
          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
        )}
      </div>

      {results.length > 0 && (
        <ul className="mt-1 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden divide-y divide-gray-100 dark:divide-gray-700 max-h-60 overflow-y-auto">
          {results.map((r) => {
            const title = r.title ?? r.name ?? '';
            const year = (r.release_date ?? r.first_air_date ?? '').slice(0, 4);
            const thumb = posterUrl(r.poster_path);
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => { onSelect(r); setQuery(''); }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors"
                >
                  {thumb ? (
                    <img src={thumb} alt={title} className="w-8 h-12 object-cover rounded flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-12 bg-gray-200 dark:bg-gray-600 rounded flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {r.media_type === 'tv' ? t('type_series') : t('type_movie')} {year && `· ${year}`}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
