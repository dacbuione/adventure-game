
import React from 'react';

interface StoryDisplayProps {
  sceneText: string;
  imageUrl: string | null;
  imageAltText?: string;
}

const StoryDisplay: React.FC<StoryDisplayProps> = ({ sceneText, imageUrl, imageAltText = "Cảnh game hiện tại" }) => {
  return (
    <div className="w-full max-w-2xl bg-slate-800 rounded-xl shadow-2xl overflow-hidden my-6">
      <div className="w-full h-64 sm:h-80 md:h-96 bg-slate-700 flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={imageAltText} className="w-full h-full object-cover" />
        ) : (
          <div className="text-slate-400 text-xl">Đang tạo hình ảnh...</div>
        )}
      </div>
      <div className="p-6 md:p-8">
        <p className="text-slate-200 text-lg leading-relaxed whitespace-pre-wrap">{sceneText}</p>
      </div>
    </div>
  );
};

export default StoryDisplay;