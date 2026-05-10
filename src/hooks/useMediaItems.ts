import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { MediaItem, MediaStatus } from '../types/media';

export function useMediaItems() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('media_items')
      .select('*')
      .eq('archived', false)
      .order('order_index', { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setItems(data as MediaItem[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const addItem = useCallback(async (item: Omit<MediaItem, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('media_items')
      .insert([item])
      .select()
      .single();

    if (error) throw error;
    setItems((prev) => [...prev, data as MediaItem]);
    return data as MediaItem;
  }, []);

  const updateItem = useCallback(async (id: string, updates: Partial<MediaItem>) => {
    const { data, error } = await supabase
      .from('media_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    setItems((prev) => prev.map((it) => (it.id === id ? (data as MediaItem) : it)));
    return data as MediaItem;
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    const { error } = await supabase.from('media_items').delete().eq('id', id);
    if (error) throw error;
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const archiveItem = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('media_items')
      .update({ archived: true, archived_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const moveItem = useCallback(async (id: string, newStatus: MediaStatus, newIndex: number) => {
    setItems((prev) => {
      const updated = prev.map((it) =>
        it.id === id ? { ...it, status: newStatus, order_index: newIndex } : it
      );
      return updated;
    });
    await supabase
      .from('media_items')
      .update({ status: newStatus, order_index: newIndex })
      .eq('id', id);
  }, []);

  return { items, loading, error, addItem, updateItem, deleteItem, archiveItem, moveItem, refetch: fetchItems };
}
