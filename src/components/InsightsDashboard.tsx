import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import type { MediaItem, MediaRating } from '../types/media';
import { RATING_CONFIG } from '../types/media';
import { Film, Tv, CheckCheck, Clock, Layers } from 'lucide-react';

export function InsightsDashboard() {
  const { t } = useLanguage();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllItems() {
      setLoading(true);
      const { data, error } = await supabase
        .from('media_items')
        .select('*');
      if (!error && data) {
        setItems(data as MediaItem[]);
      }
      setLoading(false);
    }
    fetchAllItems();
  }, []);

  const stats = useMemo(() => {
    if (items.length === 0) return null;

    const total = items.length;
    const wantToWatch = items.filter((it) => !it.archived && it.status === 'want_to_watch').length;
    const watching = items.filter((it) => !it.archived && it.status === 'watching').length;
    const watched = items.filter((it) => it.status === 'watched' || it.archived).length;

    const movies = items.filter((it) => it.type === 'movie');
    const series = items.filter((it) => it.type === 'series');

    // Time spent calculation
    const moviesWatchedCount = movies.filter((m) => m.status === 'watched').length;
    // Sum seasons/episodes
    let totalEpisodesWatched = 0;
    series.forEach((s) => {
      // Watched series: assume average episodes if not specified
      if (s.status === 'watched') {
        const seasons = s.total_seasons || s.current_season || 1;
        totalEpisodesWatched += seasons * 10; // average 10 episodes per season
      } else if (s.status === 'watching') {
        const seasons = s.current_season || 1;
        const episodes = s.current_episode || 0;
        totalEpisodesWatched += (seasons - 1) * 10 + episodes;
      }
    });

    const movieTimeMins = moviesWatchedCount * 110; // Avg 110 mins per movie
    const seriesTimeMins = totalEpisodesWatched * 45; // Avg 45 mins per episode
    const totalTimeHours = Math.round((movieTimeMins + seriesTimeMins) / 60);

    // Genre count
    const genreCounts: Record<string, number> = {};
    items.forEach((it) => {
      if (it.genres) {
        it.genres.split(',').forEach((g) => {
          const name = g.trim();
          if (name) {
            genreCounts[name] = (genreCounts[name] || 0) + 1;
          }
        });
      }
    });

    const sortedGenres = Object.entries(genreCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Rating breakdown
    const ratingCounts: Record<MediaRating, number> = {
      liked: 0,
      okay: 0,
      disliked: 0,
    };
    let ratedItemsCount = 0;
    items.forEach((it) => {
      if (it.rating) {
        ratingCounts[it.rating]++;
        ratedItemsCount++;
      }
    });

    return {
      total,
      wantToWatch,
      watching,
      watched,
      moviesCount: movies.length,
      seriesCount: series.length,
      moviesWatchedCount,
      totalEpisodesWatched,
      totalTimeHours,
      genres: sortedGenres,
      ratings: ratingCounts,
      ratedItemsCount,
    };
  }, [items]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20 text-gray-400 dark:text-gray-600 text-sm">
        {t('stats_no_data')}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Layers className="text-blue-500" size={22} />
          {t('stats_title')}
        </h2>
      </div>

      {/* Primary Row: Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl p-4 shadow-md flex flex-col justify-between min-h-[100px] hover:scale-[1.02] transition-transform duration-200">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider opacity-80">{t('stats_total')}</span>
            <Layers size={18} className="opacity-80" />
          </div>
          <span className="text-3xl font-extrabold tracking-tight mt-2">{stats.total}</span>
        </div>

        {/* Want to watch */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-[100px] hover:scale-[1.02] transition-transform duration-200">
          <div className="flex justify-between items-start text-gray-500 dark:text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('stats_want_watch')}</span>
            <Film size={18} className="text-blue-500" />
          </div>
          <span className="text-3xl font-extrabold text-gray-950 dark:text-white tracking-tight mt-2">{stats.wantToWatch}</span>
        </div>

        {/* Watching */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-[100px] hover:scale-[1.02] transition-transform duration-200">
          <div className="flex justify-between items-start text-gray-500 dark:text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('stats_watching')}</span>
            <Tv size={18} className="text-yellow-500" />
          </div>
          <span className="text-3xl font-extrabold text-gray-950 dark:text-white tracking-tight mt-2">{stats.watching}</span>
        </div>

        {/* Completed */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-[100px] hover:scale-[1.02] transition-transform duration-200">
          <div className="flex justify-between items-start text-gray-500 dark:text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('stats_watched')}</span>
            <CheckCheck size={18} className="text-green-500" />
          </div>
          <span className="text-3xl font-extrabold text-gray-950 dark:text-white tracking-tight mt-2">{stats.watched}</span>
        </div>
      </div>

      {/* Row 2: Charts and Distributions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Genre Distribution */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('stats_genres_distribution')}</h3>
          <div className="space-y-3">
            {stats.genres.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No genres logged</p>
            ) : (
              stats.genres.map((g) => {
                const percentage = Math.round((g.count / stats.total) * 100);
                return (
                  <div key={g.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-700 dark:text-gray-300">{g.name}</span>
                      <span className="text-gray-400">{g.count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Rating Breakdown & Type Distribution */}
        <div className="space-y-6">
          {/* Watch Time calculator card */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-5 shadow-md flex items-center gap-4 hover:scale-[1.01] transition-transform duration-200">
            <div className="p-3 bg-white/20 rounded-xl">
              <Clock size={28} />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider opacity-90">{t('stats_time_spent_movies')} / {t('stats_time_spent_series')}</h4>
              <p className="text-2xl font-extrabold tracking-tight mt-1">~{stats.totalTimeHours} Hours</p>
              <p className="text-[11px] opacity-75 mt-0.5">Calculated based on watched episodes & movies</p>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">{t('stats_ratings_distribution')}</h3>
            <div className="grid grid-cols-3 gap-3">
              {(['liked', 'okay', 'disliked'] as MediaRating[]).map((key) => {
                const count = stats.ratings[key];
                const pct = stats.ratedItemsCount > 0 ? Math.round((count / stats.ratedItemsCount) * 100) : 0;
                const config = RATING_CONFIG[key];

                return (
                  <div key={key} className="flex flex-col items-center bg-gray-50 dark:bg-gray-900/40 p-3 rounded-xl border border-gray-100 dark:border-gray-850">
                    <span className="text-2xl">{config.emoji}</span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-1">{t(key === 'liked' ? 'rating_liked' : key === 'okay' ? 'rating_okay' : 'rating_disliked')}</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white mt-1.5">{count}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Movies vs Series progress detail */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-4">Watchlist Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Movie breakdown */}
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-100 dark:border-gray-850">
            <div className="p-3 bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 rounded-lg">
              <Film size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase">{t('stats_movies')}</p>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{stats.moviesCount} total</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{stats.moviesWatchedCount} watched movies</p>
            </div>
          </div>

          {/* Series breakdown */}
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-100 dark:border-gray-850">
            <div className="p-3 bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 rounded-lg">
              <Tv size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase">{t('stats_series')}</p>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{stats.seriesCount} total</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{stats.totalEpisodesWatched} episodes watched</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
