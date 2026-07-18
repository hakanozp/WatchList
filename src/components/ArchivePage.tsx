import { useState, useMemo } from 'react';
import { ArchiveRestore, Trash2, Tv, Film, SlidersHorizontal, ArrowUpDown, Tag, Star } from 'lucide-react';
import { useArchivedItems } from '../hooks/useArchivedItems';
import { useLanguage } from '../contexts/LanguageContext';
import { RATING_CONFIG } from '../types/media';
import type { MediaRating, MediaType, SortOption } from '../types/media';
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

  const [sortBy, setSortBy] = useState<SortOption>('created_at_desc');
  const [ratingFilter, setRatingFilter] = useState<MediaRating | 'all'>('all');
  const [tagFilter, setTagFilter] = useState<string | 'all'>('all');

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    items.forEach((item) => {
      item.custom_tags?.forEach((tag) => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches = items.filter((item) => {
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        (item.genres?.toLowerCase().includes(q) ?? false) ||
        item.custom_tags?.some((tag) => tag.toLowerCase().includes(q));
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      const matchesRating = ratingFilter === 'all' || item.rating === ratingFilter;
      const matchesTag = tagFilter === 'all' || item.custom_tags?.includes(tagFilter);
      return matchesSearch && matchesType && matchesRating && matchesTag;
    });

    const getRatingWeight = (r?: MediaRating | null) => {
      if (r === 'liked') return 3;
      if (r === 'okay') return 2;
      if (r === 'disliked') return 1;
      return 0;
    };

    return [...matches].sort((a, b) => {
      if (sortBy === 'title_asc') return a.title.localeCompare(b.title);
      if (sortBy === 'title_desc') return b.title.localeCompare(a.title);
      if (sortBy === 'created_at_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'created_at_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'rating_desc') return getRatingWeight(b.rating) - getRatingWeight(a.rating);
      return (b.archived_at ?? '').localeCompare(a.archived_at ?? '');
    });
  }, [items, search, typeFilter, sortBy, ratingFilter, tagFilter]);

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
      {/* Sleek Filters & Sorting Toolbar */}
      <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-gray-200/80 dark:border-gray-800/80 p-3 rounded-2xl mb-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t('sort_label')}:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Rating Filter */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 px-2.5 py-1 rounded-xl border border-gray-200 dark:border-gray-705 shadow-sm">
              <Star size={12} className="text-yellow-500" />
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value as MediaRating | 'all')}
                className="text-xs bg-transparent border-none text-gray-750 dark:text-gray-200 focus:outline-none cursor-pointer"
              >
                <option value="all">{t('filter_all_ratings')}</option>
                <option value="liked">👍 {t('rating_liked')}</option>
                <option value="okay">😐 {t('rating_okay')}</option>
                <option value="disliked">👎 {t('rating_disliked')}</option>
              </select>
            </div>

            {/* Tag Filter */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 px-2.5 py-1 rounded-xl border border-gray-200 dark:border-gray-705 shadow-sm">
              <Tag size={12} className="text-blue-500" />
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="text-xs bg-transparent border-none text-gray-750 dark:text-gray-200 focus:outline-none cursor-pointer max-w-[120px]"
              >
                <option value="all">{t('filter_all_tags')}</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-2.5 py-1 rounded-xl border border-gray-200 dark:border-gray-705 shadow-sm">
          <ArrowUpDown size={12} className="text-purple-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-xs bg-transparent border-none text-gray-750 dark:text-gray-200 focus:outline-none cursor-pointer"
          >
            <option value="order_index">{t('sort_order_index')}</option>
            <option value="title_asc">{t('sort_title_asc')}</option>
            <option value="title_desc">{t('sort_title_desc')}</option>
            <option value="created_at_desc">{t('sort_created_at_desc')}</option>
            <option value="created_at_asc">{t('sort_created_at_asc')}</option>
            <option value="rating_desc">{t('sort_rating_desc')}</option>
          </select>
        </div>
      </div>

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

                    {/* Custom Tags */}
                    {item.custom_tags && item.custom_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.custom_tags.map((tag) => (
                          <span key={tag} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-150/40 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30">{tag}</span>
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
                        <div className="flex flex-col gap-1">
                          {item.genres && (
                            <div className="flex flex-wrap gap-1">
                              {item.genres.split(',').map((g) => g.trim()).filter(Boolean).map((g) => (
                                <span key={g} className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">{g}</span>
                              ))}
                            </div>
                          )}
                          {item.custom_tags && item.custom_tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.custom_tags.map((tag) => (
                                <span key={tag} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-150/40 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30">{tag}</span>
                              ))}
                            </div>
                          )}
                          {!item.genres && (!item.custom_tags || item.custom_tags.length === 0) && (
                            <span className="text-xs text-gray-400">—</span>
                          )}
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
