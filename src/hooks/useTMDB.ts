import { useState, useEffect, useRef } from 'react';
import { searchTMDB } from '../lib/tmdb';
import type { TMDBSearchResult } from '../types/media';

export function useTMDB(query: string, lang = 'tr-TR', delay = 400) {
  const [results, setResults] = useState<TMDBSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    timerRef.current = setTimeout(async () => {
      const res = await searchTMDB(query, lang);
      setResults(res.slice(0, 6));
      setLoading(false);
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, lang, delay]);

  return { results, loading };
}
