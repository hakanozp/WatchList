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
import type { MediaItem, MediaStatus, MediaType } from '../types/media';

const STATUSES: MediaStatus[] = ['want_to_watch', 'watching', 'watched'];

interface Props { search: string; typeFilter: MediaType | 'all'; }

export function KanbanBoard({ search, typeFilter }: Props) {
  const { items, loading, addItem, updateItem, deleteItem, archiveItem, moveItem } = useMediaItems();
  const { t } = useLanguage();
  const [activeItem, setActiveItem] = useState<MediaItem | null>(null);
  const [modalStatus, setModalStatus] = useState<MediaStatus | null>(null);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const columnItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = items.filter((it) => {
      const matchesSearch = !q || it.title.toLowerCase().includes(q) || it.genres?.toLowerCase().includes(q);
      const matchesType = typeFilter === 'all' || it.type === typeFilter;
      return matchesSearch && matchesType;
    });

    const map: Record<MediaStatus, MediaItem[]> = {
      want_to_watch: [],
      watching: [],
      watched: [],
    };
    [...filtered].sort((a, b) => a.order_index - b.order_index).forEach((it) => {
      map[it.status].push(it);
    });
    return map;
  }, [items, search, typeFilter]);

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
