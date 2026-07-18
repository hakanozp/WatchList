export type MediaType = 'movie' | 'series';
export type MediaStatus = 'want_to_watch' | 'watching' | 'watched';

export type MediaRating = 'disliked' | 'okay' | 'liked';

export interface MediaItem {
  id: string;
  title: string;
  type: MediaType;
  status: MediaStatus;
  current_season?: number | null;
  current_episode?: number | null;
  total_seasons?: number | null;
  notes?: string | null;
  poster_url?: string | null;
  tmdb_id?: number | null;
  rating?: MediaRating | null;
  overview?: string | null;
  genres?: string | null;
  archived: boolean;
  archived_at?: string | null;
  order_index: number;
  custom_tags?: string[] | null;
  created_at: string;
  updated_at: string;
}

export type SortOption =
  | 'order_index'
  | 'title_asc'
  | 'title_desc'
  | 'created_at_desc'
  | 'created_at_asc'
  | 'rating_desc';

export const RATING_CONFIG: Record<MediaRating, { label: string; emoji: string; color: string }> = {
  disliked: { label: 'Beğenmedim', emoji: '👎', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  okay:     { label: 'Fena değil', emoji: '😐', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  liked:    { label: 'Beğendim',   emoji: '👍', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
};

export interface TMDBSearchResult {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  media_type: 'movie' | 'tv';
  release_date?: string;
  first_air_date?: string;
  overview: string;
  genre_ids?: number[];
}

export const COLUMN_CONFIG: Record<MediaStatus, { color: string; headerColor: string }> = {
  want_to_watch: {
    color: 'border-blue-500',
    headerColor: 'bg-blue-500',
  },
  watching: {
    color: 'border-yellow-500',
    headerColor: 'bg-yellow-500',
  },
  watched: {
    color: 'border-green-500',
    headerColor: 'bg-green-500',
  },
};
