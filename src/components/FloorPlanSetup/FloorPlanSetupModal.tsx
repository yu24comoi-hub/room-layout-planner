import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { ImageUploader } from './ImageUploader';
import { ScaleCalibrator } from './ScaleCalibrator';
import { PolygonEditor } from './PolygonEditor';
import type { Point } from '../../types';

type Step = 'upload' | 'calibrate' | 'polygon';

interface Props {
  onClose: () => void;
}

export const FloorPlanSetupModal = ({ onClose }: Props) => {
  const { unit, setFloorPlan, clearFloorPlan } = useStore();
  const [step, setStep] = useState<Step>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);
  const [imageScale, setImageScale] = useState(1); // px/cm

  const handleImageLoaded = (url: string, w: number, h: number) => {
    setImageUrl(url);
    setImageWidth(w);
    setImageHeight(h);
    setStep('calibrate');
  };

  const handleCalibrated = (scale: number) => {
    setImageScale(scale);
    setStep('polygon');
  };

  const handlePolygonConfirm = (polygon: Point[], offsetX: number, offsetY: number) => {
    setFloorPlan(imageUrl, imageScale, polygon, offsetX, offsetY);
    onClose();
  };

  const handleClearFloorPlan = () => {
    clearFloorPlan();
    onClose();
  };

  const stepLabels: Record<Step, string> = {
    upload: '① 画像アップロード',
    calibrate: '② スケール設定',
    polygon: '③ 輪郭トレース',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-gray-800">間取り図の設定</h2>
            <div className="flex gap-1">
              {(['upload', 'calibrate', 'polygon'] as Step[]).map((s, i) => (
                <div key={s} className="flex items-center gap-1">
                  <div className={`text-xs px-2 py-0.5 rounded-full ${step === s ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-400'}`}>
                    {stepLabels[s]}
                  </div>
                  {i < 2 && <span className="text-gray-300 text-xs">›</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearFloorPlan}
              className="text-xs text-red-400 hover:text-red-600 underline"
            >
              間取り図をリセット
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {step === 'upload' && (
            <ImageUploader onImageLoaded={handleImageLoaded} />
          )}
          {step === 'calibrate' && (
            <ScaleCalibrator
              imageUrl={imageUrl}
              imageWidth={imageWidth}
              imageHeight={imageHeight}
              unit={unit}
              onCalibrated={handleCalibrated}
              onBack={() => setStep('upload')}
            />
          )}
          {step === 'polygon' && (
            <PolygonEditor
              imageUrl={imageUrl}
              imageWidth={imageWidth}
              imageHeight={imageHeight}
              imageScale={imageScale}
              onConfirm={handlePolygonConfirm}
              onBack={() => setStep('calibrate')}
            />
          )}
        </div>
      </div>
    </div>
  );
};
