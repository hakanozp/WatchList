import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { TMDBSearch } from './TMDBSearch';
import { posterUrl, resolveGenres } from '../lib/tmdb';
import { useLanguage } from '../contexts/LanguageContext';
import type { MediaItem, MediaStatus, MediaType, MediaRating, TMDBSearchResult } from '../types/media';
import { RATING_CONFIG } from '../types/media';
import type { TranslationKey } from '../lib/translations';

interface Props {
  defaultStatus: MediaStatus;
  editItem?: MediaItem | null;
  onSave: (data: Omit<MediaItem, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onClose: () => void;
}

const STATUSES: MediaStatus[] = ['want_to_watch', 'watching', 'watched'];
const STATUS_LABEL_KEY: Record<MediaStatus, TranslationKey> = {
  want_to_watch: 'col_want_to_watch',
  watching: 'col_watching',
  watched: 'col_watched',
};
const RATINGS = Object.entries(RATING_CONFIG) as [MediaRating, (typeof RATING_CONFIG)[MediaRating]][];
const RATING_LABEL_KEY: Record<MediaRating, TranslationKey> = {
  disliked: 'rating_disliked',
  okay: 'rating_okay',
  liked: 'rating_liked',
};

export function AddMediaModal({ defaultStatus, editItem, onSave, onClose }: Props) {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<MediaType>('movie');
  const [status, setStatus] = useState<MediaStatus>(defaultStatus);
  const [currentSeason, setCurrentSeason] = useState('');
  const [currentEpisode, setCurrentEpisode] = useState('');
  const [totalSeasons, setTotalSeasons] = useState('');
  const [notes, setNotes] = useState('');
  const [posterUrlState, setPosterUrl] = useState('');
  const [tmdbId, setTmdbId] = useState<number | null>(null);
  const [rating, setRating] = useState<MediaRating | null>(null);
  const [overview, setOverview] = useState('');
  const [genres, setGenres] = useState('');
  const [saving, setSaving] = useState(false);

  const showRating = status === 'watching' || status === 'watched';

  useEffect(() => {
    if (editItem) {
      setTitle(editItem.title);
      setType(editItem.type);
      setStatus(editItem.status);
      setCurrentSeason(editItem.current_season?.toString() ?? '');
      setCurrentEpisode(editItem.current_episode?.toString() ?? '');
      setTotalSeasons(editItem.total_seasons?.toString() ?? '');
      setNotes(editItem.notes ?? '');
      setPosterUrl(editItem.poster_url ?? '');
      setTmdbId(editItem.tmdb_id ?? null);
      setRating(editItem.rating ?? null);
      setOverview(editItem.overview ?? '');
      setGenres(editItem.genres ?? '');
    }
  }, [editItem]);

  const handleTMDBSelect = async (r: TMDBSearchResult) => {
    setTitle(r.title ?? r.name ?? '');
    setType(r.media_type === 'tv' ? 'series' : 'movie');
    setPosterUrl(posterUrl(r.poster_path) ?? '');
    setTmdbId(r.id);
    setOverview(r.overview ?? '');
    if (r.genre_ids?.length) {
      const resolved = await resolveGenres(r.genre_ids, t('tmdb_lang'));
      setGenres(resolved);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    await onSave({
      title: title.trim(),
      type,
      status,
      current_season: currentSeason ? parseInt(currentSeason) : null,
      current_episode: currentEpisode ? parseInt(currentEpisode) : null,
      total_seasons: totalSeasons ? parseInt(totalSeasons) : null,
      notes: notes.trim() || null,
      poster_url: posterUrlState || null,
      tmdb_id: tmdbId,
      rating: showRating ? rating : null,
      overview: overview.trim() || null,
      genres: genres.trim() || null,
      archived: editItem?.archived ?? false,
      archived_at: editItem?.archived_at ?? null,
      order_index: editItem?.order_index ?? 0,
    });
    setSaving(false);
    onClose();
  };

  return (
    <>
      {/* Desktop backdrop */}
      <div className="hidden sm:block fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/*
       * Kart — mobilde fixed inset-0 (viewport'a doğrudan sabitli, hiçbir üst elemana bağlı değil)
       *        desktop'ta centered modal (z-50 ile backdrop'un üstünde)
       */}
      <div className="
        fixed inset-0 z-50 flex flex-col overflow-hidden
        bg-white dark:bg-gray-800
        sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
        sm:w-full sm:max-w-sm sm:max-h-[90svh] sm:rounded-2xl sm:shadow-2xl
      ">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {editItem ? t('modal_edit_title') : t('modal_add_title')}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Kapat"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0 overscroll-contain">
          <form id="media-form" onSubmit={handleSubmit} className="p-4 space-y-3">
            <TMDBSearch onSelect={handleTMDBSelect} />

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('title_label')} <span className="text-red-500">{t('title_required')}</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder={t('title_placeholder')}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Type + Status — yan yana */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('type_label')}</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as MediaType)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="movie">{t('type_movie')}</option>
                  <option value="series">{t('type_series')}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('status_label')}</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as MediaStatus)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUSES.map((key) => (
                    <option key={key} value={key}>{t(STATUS_LABEL_KEY[key])}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Series fields */}
            {type === 'series' && status === 'watching' && (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('season_label')}</label>
                  <input type="number" min="1" value={currentSeason} onChange={(e) => setCurrentSeason(e.target.value)} placeholder="1"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('episode_label')}</label>
                  <input type="number" min="1" value={currentEpisode} onChange={(e) => setCurrentEpisode(e.target.value)} placeholder="1"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('total_seasons_label')}</label>
                  <input type="number" min="1" value={totalSeasons} onChange={(e) => setTotalSeasons(e.target.value)} placeholder="?"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            )}

            {/* Rating */}
            {showRating && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('how_was_it')}</label>
                <div className="flex gap-2">
                  {RATINGS.map(([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setRating(rating === key ? null : key)}
                      className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-xl border-2 text-xs font-medium transition-all ${
                        rating === key ? `border-current ${cfg.color}` : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <span className="text-base">{cfg.emoji}</span>
                      <span>{t(RATING_LABEL_KEY[key])}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Genres */}
            {genres && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('genres_label')}</label>
                <div className="flex flex-wrap gap-1">
                  {genres.split(',').map((g) => g.trim()).filter(Boolean).map((g) => (
                    <span key={g} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Overview */}
            {overview && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('overview_label')}</label>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-600 max-h-24 overflow-y-auto">
                  {overview}
                </p>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('notes_label')}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder={t('notes_placeholder')}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </form>
        </div>

        {/* Footer — her zaman altta görünür */}
        <div className="flex gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            {t('btn_cancel')}
          </button>
          <button
            type="submit"
            form="media-form"
            disabled={saving || !title.trim()}
            className="flex-1 py-2 px-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {saving ? t('btn_saving') : editItem ? t('btn_update') : t('btn_add')}
          </button>
        </div>
      </div>
    </>
  );
}
