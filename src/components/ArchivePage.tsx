import { useState } from 'react';
import { ArchiveRestore, Trash2, Tv, Film } from 'lucide-react';
import { useArchivedItems } from '../hooks/useArchivedItems';
import { useLanguage } from '../contexts/LanguageContext';
import { RATING_CONFIG } from '../types/media';
import type { MediaRating, MediaType } from '../types/media';
import type { TranslationKey } from '../lib/translations';

const RATING_LABEL_KEY: Record<MediaRating, TranslationKey> = {
  disliked: 'rating_disliked',
  okay: 'rating_okay',
  liked: 'rating_liked',
};

interface Props {
  search: string;
  typeFilter: MediaType | 'all';
}

export function ArchivePage({ search, typeFilter }: Props) {
  const { items, loading, unarchiveItem, deleteItem } = useArchivedItems();
  const { t } = useLanguage();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || item.title.toLowerCase().includes(q) || (item.genres?.toLowerCase().includes(q) ?? false);
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const confirmDelete = async () => {
    if (!confirmId) return;
    await deleteItem(confirmId);
    setConfirmId(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4">

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-gray-600 text-sm">
          {t('archive_empty')}
        </div>
      ) : (
        <>
          {/* ── Mobil: kart grid ── */}
          <div className="sm:hidden flex flex-col gap-3">
            {filtered.map((item) => {
              const ratingCfg = item.rating ? RATING_CONFIG[item.rating] : null;
              return (
                <div key={item.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-3 flex gap-3">
                  {/* Poster */}
                  <div className="w-12 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    {item.poster_url
                      ? <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" />
                      : <span className="text-gray-400">{item.type === 'series' ? <Tv size={18} /> : <Film size={18} />}</span>
                    }
                  </div>

                  {/* İçerik */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight line-clamp-2">{item.title}</span>
                      {/* Aksiyonlar */}
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => unarchiveItem(item.id)} title={t('unarchive_btn')}
                          className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-500 transition-colors">
                          <ArchiveRestore size={14} />
                        </button>
                        <button onClick={() => setConfirmId(item.id)} title={t('btn_delete')}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Tür + rating */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        item.type === 'series'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                          : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                      }`}>
                        {item.type === 'series' ? t('type_series') : t('type_movie')}
                      </span>
                      {ratingCfg && item.rating && (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${ratingCfg.color}`}>
                          {ratingCfg.emoji} {t(RATING_LABEL_KEY[item.rating])}
                        </span>
                      )}
                    </div>

                    {/* Genres */}
                    {item.genres && (
                      <div className="flex flex-wrap gap-1">
                        {item.genres.split(',').map((g) => g.trim()).filter(Boolean).map((g) => (
                          <span key={g} className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">{g}</span>
                        ))}
                      </div>
                    )}

                    {/* Tarih + not */}
                    <div className="flex items-center gap-2 mt-auto">
                      <span className="text-[10px] text-gray-400">{formatDate(item.archived_at)}</span>
                      {item.notes && <span className="text-[10px] text-gray-400 italic truncate">📝 {item.notes}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Desktop: tablo ── */}
          <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12" />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('archive_col_title')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">{t('archive_col_type')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('archive_col_genres')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">{t('archive_col_rating')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">{t('archive_col_date')}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">{t('archive_col_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((item) => {
                  const ratingCfg = item.rating ? RATING_CONFIG[item.rating] : null;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                      <td className="px-4 py-2">
                        <div className="w-9 h-12 rounded overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                          {item.poster_url
                            ? <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover" />
                            : <span className="text-gray-400">{item.type === 'series' ? <Tv size={16} /> : <Film size={16} />}</span>
                          }
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{item.title}</span>
                        {item.notes && <p className="text-[11px] text-gray-400 mt-0.5 italic line-clamp-1">📝 {item.notes}</p>}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          item.type === 'series'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                        }`}>
                          {item.type === 'series' ? t('type_series') : t('type_movie')}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-1">
                          {item.genres
                            ? item.genres.split(',').map((g) => g.trim()).filter(Boolean).map((g) => (
                                <span key={g} className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">{g}</span>
                              ))
                            : <span className="text-xs text-gray-400">—</span>
                          }
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        {ratingCfg && item.rating
                          ? <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${ratingCfg.color}`}>{ratingCfg.emoji} {t(RATING_LABEL_KEY[item.rating])}</span>
                          : <span className="text-xs text-gray-400">—</span>
                        }
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(item.archived_at)}</span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => unarchiveItem(item.id)} title={t('unarchive_btn')}
                            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-500 transition-colors">
                            <ArchiveRestore size={15} />
                          </button>
                          <button onClick={() => setConfirmId(item.id)} title={t('btn_delete')}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Delete confirm modal */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmId(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-700 dark:text-gray-200 text-center mb-5">
              {t('delete_confirm_msg')}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmId(null)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                {t('btn_cancel')}
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
              >
                {t('btn_delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
