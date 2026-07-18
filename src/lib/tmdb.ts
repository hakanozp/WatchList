import type { TMDBSearchResult } from '../types/media';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY as string;
const BASE_URL = 'https://api.themoviedb.org/3';
export const POSTER_BASE = 'https://image.tmdb.org/t/p/w300';

// Per-language genre cache
const genreCache: Partial<Record<string, Record<number, string>>> = {};

async function getGenreMap(lang: string): Promise<Record<number, string>> {
  if (genreCache[lang]) return genreCache[lang]!;
  const [movieRes, tvRes] = await Promise.all([
    fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=${lang}`),
    fetch(`${BASE_URL}/genre/tv/list?api_key=${API_KEY}&language=${lang}`),
  ]);
  const map: Record<number, string> = {};
  if (movieRes.ok) {
    const d = await movieRes.json();
    for (const g of d.genres) map[g.id] = g.name;
  }
  if (tvRes.ok) {
    const d = await tvRes.json();
    for (const g of d.genres) map[g.id] = g.name;
  }
  genreCache[lang] = map;
  return map;
}

export async function resolveGenres(genreIds: number[], lang = 'tr-TR'): Promise<string> {
  if (!genreIds.length) return '';
  const map = await getGenreMap(lang);
  return genreIds.map((id) => map[id]).filter(Boolean).join(', ');
}

export async function searchTMDB(query: string, lang = 'tr-TR'): Promise<TMDBSearchResult[]> {
  if (!query.trim() || !API_KEY) return [];

  const url = `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=${lang}&include_adult=false`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();
  return (data.results as TMDBSearchResult[]).filter(
    (r) => r.media_type === 'movie' || r.media_type === 'tv'
  );
}

export function posterUrl(path: string | null): string | null {
  return path ? `${POSTER_BASE}${path}` : null;
}

export interface TMDBDetails {
  runtime?: number | null;
  episode_run_time?: number[];
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  credits?: {
    cast?: {
      name: string;
      character: string;
      profile_path: string | null;
    }[];
    crew?: {
      name: string;
      job: string;
    }[];
  };
}

export async function fetchTMDBDetails(
  tmdbId: number,
  mediaType: 'movie' | 'series',
  lang = 'tr-TR'
): Promise<TMDBDetails | null> {
  if (!tmdbId || !API_KEY) return null;

  const endpoint = mediaType === 'series' ? 'tv' : 'movie';
  const url = `${BASE_URL}/${endpoint}/${tmdbId}?api_key=${API_KEY}&language=${lang}&append_to_response=credits`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error fetching TMDB details:', err);
    return null;
  }
}
