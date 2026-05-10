import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { MediaItem } from '../types/media';

export function useArchivedItems() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('media_items')
      .select('*')
      .eq('archived', true)
      .order('archived_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setItems(data as MediaItem[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const unarchiveItem = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('media_items')
      .update({ archived: false, archived_at: null })
      .eq('id', id);
    if (error) throw error;
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    const { error } = await supabase.from('media_items').delete().eq('id', id);
    if (error) throw error;
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  return { items, loading, error, unarchiveItem, deleteItem, refetch: fetchItems };
}
