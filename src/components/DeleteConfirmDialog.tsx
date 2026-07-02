import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
}

export const DeleteConfirmDialog: React.FC<Props> = ({ isOpen, onClose, onConfirm, itemName }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm p-6 rounded-2xl shadow-2xl"
        style={{ background: '#1F1E1B', border: '1px solid rgba(239,68,68,0.2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-full" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <h4 style={{ fontFamily: "'Cormorant Garamond', 'Noto Serif JP', Georgia, serif", color: '#E0D9CA', fontSize: 16, fontWeight: 600, margin: 0 }}>
              家具の種類を削除
            </h4>
            <p className="text-xs text-[#7A7468] mt-1 leading-relaxed">
              <span className="font-semibold text-red-300">「{itemName}」</span>
              を削除しますか？配置済みの家具もすべて連動して削除されます。
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            style={{ background: 'transparent', border: '1px solid #35342F', color: '#7A7468' }}
          >
            キャンセル
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer"
            style={{ background: '#dc2626' }}
          >
            削除する
          </button>
        </div>
      </div>
    </div>
  );
};
