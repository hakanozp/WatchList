import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2, Tv, Film, Play, CheckCheck, ChevronDown, ChevronRight, Archive, Star, X, ExternalLink, Clock } from 'lucide-react';
import type { MediaItem, MediaRating, MediaStatus } from '../types/media';
import { RATING_CONFIG } from '../types/media';
import { useLanguage } from '../contexts/LanguageContext';
import { fetchTMDBDetails, type TMDBDetails } from '../lib/tmdb';
import type { TranslationKey } from '../lib/translations';

const RATING_LABEL_KEY: Record<MediaRating, TranslationKey> = {
  disliked: 'rating_disliked',
  okay: 'rating_okay',
  liked: 'rating_liked',
};

interface Props {
  item: MediaItem;
  onEdit: (item: MediaItem) => void;
  onDelete: (id: string) => void;
  onMove?: (id: string, newStatus: MediaStatus) => void;
  onArchive?: (id: string) => void;
}

export function MediaCard({ item, onEdit, onDelete, onMove, onArchive }: Props) {
  const [expanded, setExpanded] = useState(true);
  const { t } = useLanguage();

  const [showDetails, setShowDetails] = useState(false);
  const [details, setDetails] = useState<TMDBDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const showSeasonInfo = item.status === 'watching' && item.type === 'series' &&
    (item.current_season || item.current_episode);
  const showRating = (item.status === 'watching' || item.status === 'watched') && item.rating;
  const ratingCfg = item.rating ? RATING_CONFIG[item.rating] : null;

  const handleOpenDetails = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.tmdb_id) {
      onEdit(item);
      return;
    }
    setShowDetails(true);
    if (!details) {
      setLoadingDetails(true);
      const res = await fetchTMDBDetails(item.tmdb_id, item.type, t('tmdb_lang'));
      if (res) {
        setDetails(res);
      }
      setLoadingDetails(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl shadow-sm border border-gray-200 dark:border-gray-750 overflow-hidden group hover:scale-[1.02] hover:shadow-md hover:border-blue-500/30 dark:hover:border-blue-500/20 transition-all duration-200"
    >
      {/* Collapsed view */}
      {!expanded && (
        <div className="flex items-center gap-2 px-2.5 py-2">
          <button
            {...attributes}
            {...listeners}
            className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0"
            aria-label={t('aria_drag')}
          >
            <GripVertical size={14} />
          </button>

          <button
            onClick={() => setExpanded(true)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
            aria-label={t('aria_expand')}
          >
            <ChevronRight size={14} />
          </button>

          <span
            className="flex-1 text-sm font-semibold text-gray-900 dark:text-gray-100 truncate cursor-pointer"
            onClick={() => setExpanded(true)}
          >
            {item.title}
          </span>

          <div className="flex items-center gap-1 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(item)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-colors"
              aria-label={t('aria_edit')}
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors"
              aria-label={t('aria_delete')}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Expanded view */}
      {expanded && (
        <div className="flex gap-2">
          {/* Poster — clickable to view details */}
          <div
            className="w-16 flex-shrink-0 bg-gray-100 dark:bg-gray-700 cursor-pointer hover:brightness-95 transition-all relative overflow-hidden"
            onClick={handleOpenDetails}
            title="Detayları görüntülemek için tıkla"
          >
            {item.poster_url ? (
              <img
                src={item.poster_url}
                alt={item.title}
                className="w-full h-full object-cover min-h-[88px]"
              />
            ) : (
              <div className="w-full min-h-[88px] flex items-center justify-center text-gray-400">
                {item.type === 'series' ? <Tv size={22} /> : <Film size={22} />}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-2.5 min-w-0">
            <div className="flex items-start gap-1">
              {/* Drag handle */}
              <button
                {...attributes}
                {...listeners}
                className="mt-0.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0"
                aria-label={t('aria_drag')}
              >
                <GripVertical size={14} />
              </button>

              {/* Collapse toggle */}
              <button
                onClick={() => setExpanded(false)}
                className="mt-0.5 text-gray-300 hover:text-gray-500 flex-shrink-0 transition-colors"
                aria-label={t('aria_collapse')}
              >
                <ChevronDown size={14} />
              </button>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight line-clamp-2">
                  {item.title}
                </h3>

                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    item.type === 'series'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                      : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                  }`}>
                    {item.type === 'series' ? t('type_series') : t('type_movie')}
                  </span>

                  {showSeasonInfo && (
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                      {item.current_season ? `S${item.current_season}` : ''}
                      {item.current_season && item.current_episode ? ' ' : ''}
                      {item.current_episode ? `B${item.current_episode}` : ''}
                      {item.total_seasons ? ` / ${item.total_seasons} ${t('season_abbr')}` : ''}
                    </span>
                  )}

                  {showRating && ratingCfg && item.rating && (
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${ratingCfg.color}`}>
                      {ratingCfg.emoji} {t(RATING_LABEL_KEY[item.rating])}
                    </span>
                  )}
                </div>

                {item.genres && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.genres.split(',').map((g) => g.trim()).filter(Boolean).map((g) => (
                      <span key={g} className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 leading-tight">
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                {item.custom_tags && item.custom_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.custom_tags.map((tag) => (
                      <span key={tag} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100/50 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40 leading-tight">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {item.notes && (
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 line-clamp-1 italic">
                    📝 {item.notes}
                  </p>
                )}
              </div>

              {/* Edit / Delete */}
              <div className="flex flex-col gap-1 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEdit(item)}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-colors"
                  aria-label={t('aria_edit')}
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label={t('aria_delete')}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Quick action buttons — compact, bottom-right */}
            {onMove && item.status === 'want_to_watch' && (
              <div className="flex justify-end mt-1.5">
                <button
                  onClick={() => onMove(item.id, 'watching')}
                  className="inline-flex items-center gap-1 py-0.5 px-2 text-[10px] font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 rounded-md border border-yellow-200 dark:border-yellow-800 transition-colors"
                >
                  <Play size={9} />
                  {t('start_watching')}
                </button>
              </div>
            )}

            {onMove && item.status === 'watching' && (
              <div className="flex justify-end mt-1.5">
                <button
                  onClick={() => onMove(item.id, 'watched')}
                  className="inline-flex items-center gap-1 py-0.5 px-2 text-[10px] font-medium text-green-700 bg-green-50 hover:bg-green-100 dark:text-green-300 dark:bg-green-900/30 dark:hover:bg-green-900/50 rounded-md border border-green-200 dark:border-green-800 transition-colors"
                >
                  <CheckCheck size={9} />
                  {t('mark_watched')}
                </button>
              </div>
            )}

            {onArchive && item.status === 'watched' && (
              <div className="flex justify-end mt-1.5">
                <button
                  onClick={() => onArchive(item.id)}
                  className="inline-flex items-center gap-1 py-0.5 px-2 text-[10px] font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-700/50 dark:hover:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 transition-colors"
                >
                  <Archive size={9} />
                  {t('archive_btn')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDetails(false)}
          />

          {/* Modal Card */}
          <div className="relative w-full max-w-md max-h-[80vh] sm:max-h-[90vh] flex flex-col bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Poster + Gradient overlay */}
            <div className="relative h-44 w-full bg-gray-100 dark:bg-gray-900 overflow-hidden flex-shrink-0">
              {item.poster_url ? (
                <img
                  src={item.poster_url}
                  alt={item.title}
                  className="w-full h-full object-cover object-top blur-sm scale-110 opacity-30"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-800 to-transparent" />
              
              {/* Close Button */}
              <button
                onClick={() => setShowDetails(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>

              {/* Title & Details Over the Poster */}
              <div className="absolute bottom-4 left-4 right-4 flex gap-3 items-end">
                {item.poster_url && (
                  <img
                    src={item.poster_url}
                    alt={item.title}
                    className="w-16 h-24 rounded-lg shadow-lg border border-white dark:border-gray-755 object-cover flex-shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    item.type === 'series'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300'
                      : 'bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300'
                  }`}>
                    {item.type === 'series' ? t('type_series') : t('type_movie')}
                  </span>
                  <h4 className="text-md font-bold text-gray-900 dark:text-white mt-1 leading-tight line-clamp-2">
                    {item.title}
                  </h4>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 flex-1 overflow-y-auto min-h-0">
              {/* TMDB Score & Runtime Row */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-600 dark:text-gray-400">
                {/* Score */}
                {details?.vote_average ? (
                  <div className="flex items-center gap-1">
                    <Star className="text-yellow-500 fill-yellow-500" size={14} />
                    <span>{t('detail_vote_average')}: {details.vote_average.toFixed(1)}/10</span>
                  </div>
                ) : null}

                {/* Runtime */}
                {(details?.runtime || (details?.episode_run_time && details.episode_run_time.length > 0)) ? (
                  <div className="flex items-center gap-1">
                    <Clock size={14} className="text-blue-500" />
                    <span>
                      {t('detail_runtime')}:{' '}
                      {details.runtime
                        ? `${details.runtime} ${t('detail_minutes')}`
                        : `${details.episode_run_time?.[0]} ${t('detail_minutes')}`}
                    </span>
                  </div>
                ) : null}

                {/* Release date */}
                {(details?.release_date || details?.first_air_date) ? (
                  <div className="flex items-center gap-1">
                    <span>
                      📅 {t('detail_release_date')}:{' '}
                      {new Date(details.release_date || details.first_air_date || '').getFullYear()}
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Overview / Description */}
              <div className="space-y-1">
                <h5 className="text-xs font-bold text-gray-455 uppercase tracking-wider">{t('detail_overview')}</h5>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed max-h-32 overflow-y-auto">
                  {item.overview || details?.overview || '—'}
                </p>
              </div>

              {/* Cast */}
              {details?.credits?.cast && details.credits.cast.length > 0 && (
                <div className="space-y-1.5">
                  <h5 className="text-xs font-bold text-gray-455 uppercase tracking-wider">{t('detail_cast')}</h5>
                  <div className="flex flex-wrap gap-1">
                    {details.credits.cast.slice(0, 5).map((member) => (
                      <span
                        key={member.name}
                        className="text-[10px] bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full"
                      >
                        {member.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Loader */}
              {loadingDetails && (
                <div className="flex justify-center py-4">
                  <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 dark:bg-gray-900/30 px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              {item.tmdb_id && (
                <a
                  href={`https://www.themoviedb.org/${item.type === 'series' ? 'tv' : 'movie'}/${item.tmdb_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:underline font-semibold"
                >
                  <ExternalLink size={12} />
                  {t('detail_view_tmdb')}
                </a>
              )}
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-250 rounded-lg transition-colors cursor-pointer"
              >
                {t('btn_cancel')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
