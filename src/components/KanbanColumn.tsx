import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { MediaCard } from './MediaCard';
import { useLanguage } from '../contexts/LanguageContext';
import type { MediaItem, MediaStatus } from '../types/media';
import { COLUMN_CONFIG } from '../types/media';
import type { TranslationKey } from '../lib/translations';

const COL_LABEL_KEY: Record<MediaStatus, TranslationKey> = {
  want_to_watch: 'col_want_to_watch',
  watching: 'col_watching',
  watched: 'col_watched',
};

interface Props {
  status: MediaStatus;
  items: MediaItem[];
  onAdd: (status: MediaStatus) => void;
  onEdit: (item: MediaItem) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, newStatus: MediaStatus) => void;
  onArchive: (id: string) => void;
}

export function KanbanColumn({ status, items, onAdd, onEdit, onDelete, onMove, onArchive }: Props) {
  const cfg = COLUMN_CONFIG[status];
  const { t } = useLanguage();
  const label = t(COL_LABEL_KEY[status]);
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const [open, setOpen] = useState(true);

  return (
    <div className="flex flex-col min-w-0 w-full">
      {/* Header */}
      <div className={`${cfg.headerColor} ${open ? 'rounded-t-xl' : 'rounded-xl'} px-3 py-3 flex items-center gap-2`}>
        {/* Aç/kapat ikonu — sol taraf */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-0.5 rounded hover:bg-white/20 text-white transition-colors flex-shrink-0"
          aria-label={open ? 'Kapat' : 'Aç'}
        >
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* Başlık + sayı */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          <h2 className="text-sm font-semibold text-white">{label}</h2>
          <span className="text-[11px] bg-white/25 text-white font-medium px-1.5 py-0.5 rounded-full">
            {items.length}
          </span>
        </button>

        {/* Ekle butonu — sağ taraf */}
        <button
          onClick={() => onAdd(status)}
          className="p-1 rounded-lg bg-white/20 hover:bg-white/35 text-white transition-colors flex-shrink-0"
          aria-label={`${label} ${t('col_add_aria')}`}
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Drop zone — sadece açıkken görünür */}
      {open && (
        <div
          ref={setNodeRef}
          className={`flex-1 rounded-b-xl border-2 ${cfg.color} bg-gray-50 dark:bg-gray-900 p-2 space-y-2 min-h-[200px] transition-colors ${
            isOver ? 'bg-blue-50 dark:bg-blue-950' : ''
          }`}
        >
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {items.map((item) => (
              <MediaCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} onMove={onMove} onArchive={onArchive} />
            ))}
          </SortableContext>

          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center h-24 text-gray-400 dark:text-gray-600">
              <p className="text-xs">{t('no_content')}</p>
              <button
                onClick={() => onAdd(status)}
                className="mt-2 text-xs text-blue-500 hover:underline"
              >
                {t('add_link')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
