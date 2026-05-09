import { useRef } from 'react';

interface Props {
  onImageLoaded: (dataUrl: string, width: number, height: number) => void;
}

export const ImageUploader = ({ onImageLoaded }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        onImageLoaded(dataUrl, img.naturalWidth, img.naturalHeight);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
      <div className="text-center">
        <p className="text-6xl mb-4">📐</p>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">間取り図をアップロード</h3>
        <p className="text-sm text-gray-500">
          画像をアップロードすると、部屋の輪郭を手動でトレースして不整形な部屋に対応できます。
        </p>
      </div>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="w-full max-w-sm border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl p-8 text-center cursor-pointer transition-colors hover:bg-blue-50"
      >
        <p className="text-gray-500 text-sm">ここにドラッグ＆ドロップ、またはクリックして選択</p>
        <p className="text-gray-400 text-xs mt-1">PNG / JPG / WEBP 対応</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
};
