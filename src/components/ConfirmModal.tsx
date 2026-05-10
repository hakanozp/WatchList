import { Trash2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ message, onConfirm, onCancel }: Props) {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex flex-col items-center gap-3 px-6 pt-6 pb-2">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
            <Trash2 size={22} className="text-red-500" />
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 text-center leading-relaxed">
            {message}
          </p>
        </div>
        <div className="flex gap-2 p-4">
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
          >
            {t('btn_cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 px-4 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
          >
            {t('btn_delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
