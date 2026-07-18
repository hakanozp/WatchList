import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { MediaCard } from './MediaCard';
import { AddMediaModal } from './AddMediaModal';
import { ConfirmModal } from './ConfirmModal';
import { useMediaItems } from '../hooks/useMediaItems';
import { useLanguage } from '../contexts/LanguageContext';
import type { MediaItem, MediaStatus, MediaType, MediaRating, SortOption } from '../types/media';
import { SlidersHorizontal, ArrowUpDown, Tag, Star } from 'lucide-react';

const STATUSES: MediaStatus[] = ['want_to_watch', 'watching', 'watched'];

interface Props { search: string; typeFilter: MediaType | 'all'; }

export function KanbanBoard({ search, typeFilter }: Props) {
  const { items, loading, addItem, updateItem, deleteItem, archiveItem, moveItem } = useMediaItems();
  const { t } = useLanguage();
  const [activeItem, setActiveItem] = useState<MediaItem | null>(null);
  const [modalStatus, setModalStatus] = useState<MediaStatus | null>(null);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter/Sort States
  const [sortBy, setSortBy] = useState<SortOption>('order_index');
  const [ratingFilter, setRatingFilter] = useState<MediaRating | 'all'>('all');
  const [tagFilter, setTagFilter] = useState<string | 'all'>('all');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Compute unique custom tags across all items
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    items.forEach((item) => {
      item.custom_tags?.forEach((tag) => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [items]);

  const columnItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = items.filter((it) => {
      const matchesSearch =
        !q ||
        it.title.toLowerCase().includes(q) ||
        it.genres?.toLowerCase().includes(q) ||
        it.custom_tags?.some((tag) => tag.toLowerCase().includes(q));
      const matchesType = typeFilter === 'all' || it.type === typeFilter;
      const matchesRating = ratingFilter === 'all' || it.rating === ratingFilter;
      const matchesTag = tagFilter === 'all' || it.custom_tags?.includes(tagFilter);
      return matchesSearch && matchesType && matchesRating && matchesTag;
    });

    const map: Record<MediaStatus, MediaItem[]> = {
      want_to_watch: [],
      watching: [],
      watched: [],
    };

    const getRatingWeight = (r?: MediaRating | null) => {
      if (r === 'liked') return 3;
      if (r === 'okay') return 2;
      if (r === 'disliked') return 1;
      return 0;
    };

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'title_asc') return a.title.localeCompare(b.title);
      if (sortBy === 'title_desc') return b.title.localeCompare(a.title);
      if (sortBy === 'created_at_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'created_at_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'rating_desc') return getRatingWeight(b.rating) - getRatingWeight(a.rating);
      return a.order_index - b.order_index;
    });

    sorted.forEach((it) => {
      map[it.status].push(it);
    });
    return map;
  }, [items, search, typeFilter, sortBy, ratingFilter, tagFilter]);

  const handleDragStart = ({ active }: DragStartEvent) => {
    const found = items.find((i) => i.id === active.id);
    if (found) setActiveItem(found);
  };

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveItem(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    const draggedItem = items.find((i) => i.id === activeId);
    if (!draggedItem) return;

    // Dropped onto a column header (status droppable)
    const targetStatus = STATUSES.includes(overId as MediaStatus)
      ? (overId as MediaStatus)
      : items.find((i) => i.id === overId)?.status;

    if (!targetStatus) return;

    const targetCol = columnItems[targetStatus];
    const overIndex = targetCol.findIndex((i) => i.id === overId);
    const dragIndex = targetCol.findIndex((i) => i.id === activeId);

    let newIndex: number;
    if (targetStatus !== draggedItem.status) {
      newIndex = overIndex >= 0 ? overIndex : targetCol.length;
    } else {
      const reordered = arrayMove(targetCol, dragIndex, overIndex);
      newIndex = reordered.findIndex((i) => i.id === activeId);
    }

    await moveItem(activeId, targetStatus, newIndex * 10);
  };

  const handleSave = async (data: Omit<MediaItem, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingItem) {
      await updateItem(editingItem.id, data);
    } else {
      const colItems = columnItems[data.status];
      const maxOrder = colItems.length > 0 ? Math.max(...colItems.map((i) => i.order_index)) : 0;
      await addItem({ ...data, order_index: maxOrder + 10 });
    }
    setEditingItem(null);
  };

  const handleDelete = (id: string) => setDeletingId(id);

  const confirmDelete = async () => {
    if (deletingId) {
      await deleteItem(deletingId);
      setDeletingId(null);
    }
  };

  const handleMove = async (id: string, newStatus: MediaStatus) => {
    const colItems = columnItems[newStatus];
    const maxOrder = colItems.length > 0 ? Math.max(...colItems.map((i) => i.order_index)) : 0;
    await moveItem(id, newStatus, maxOrder + 10);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              items={columnItems[status]}
              onAdd={(s) => { setEditingItem(null); setModalStatus(s); }}
              onEdit={(item) => { setEditingItem(item); setModalStatus(item.status); }}
              onDelete={handleDelete}
              onMove={handleMove}
              onArchive={archiveItem}
            />
          ))}
        </div>

        <DragOverlay>
          {activeItem && (
            <div className="rotate-2 shadow-2xl">
              <MediaCard item={activeItem} onEdit={() => {}} onDelete={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {modalStatus && (
        <AddMediaModal
          defaultStatus={modalStatus}
          editItem={editingItem}
          onSave={handleSave}
          onClose={() => { setModalStatus(null); setEditingItem(null); }}
        />
      )}

      {deletingId && (
        <ConfirmModal
          message={t('delete_confirm_msg')}
          onConfirm={confirmDelete}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </>
  );
}
