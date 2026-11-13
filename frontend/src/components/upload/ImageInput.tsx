import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Tag,
  CircleDot,
  Utensils,
} from 'lucide-react';
import { resizeImageBeforeUpload } from '../../utils/imageResize';
import { captureMealPhoto, triggerHaptic } from '../../utils/nativeDevice';
import { mealsApi } from '../../api/mealsApi';
import { AnalyzedMealResponse, MealItem } from '../../types';

interface ImageInputProps {
  onAnalysisComplete: (result: AnalyzedMealResponse, originalPreviewUrl: string) => void;
  onCancel?: () => void;
}

export const ImageInput: React.FC<ImageInputProps> = ({
  onAnalysisComplete,
  onCancel,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('Preparing image...');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [detectedTags, setDetectedTags] = useState<MealItem[] | null>(null);
  const [analyzedResponse, setAnalyzedResponse] = useState<AnalyzedMealResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = async (file: File) => {
    setErrorMsg(null);
    setDetectedTags(null);

    // Format validation
    const validFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validFormats.includes(file.type.toLowerCase())) {
      setErrorMsg('Please select a JPG, PNG, or WEBP food photo.');
      return;
    }

    // Size validation (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 10 MB limit. Please select a smaller photo.');
      return;
    }

    try {
      setIsLoading(true);
      setLoadingStep('Preparing image...');

      // In-memory resize to max 1280px for fast upload
      const { resizedBlob, previewUrl: localPreview } = await resizeImageBeforeUpload(file, 1280, 0.85);
      setPreviewUrl(localPreview);

      setLoadingStep('Analyzing dishes & portions...');
      const analyzedData = await mealsApi.analyzeImage(resizedBlob, file.name);

      if (!analyzedData.is_food || analyzedData.items.length === 0) {
        setIsLoading(false);
        setErrorMsg(
          analyzedData.quality_feedback ||
            'No food detected in this photo. Please center your plate and try again.'
        );
        return;
      }

      setIsLoading(false);
      setAnalyzedResponse(analyzedData);
      setDetectedTags(analyzedData.items);
    } catch (err: any) {
      setIsLoading(false);
      let detail = err.response?.data?.detail || err.message || 'Failed to analyze meal image. Please retry.';
      if (err.message === 'Network Error' || !err.response) {
        detail = 'Cannot connect to backend server. Make sure your phone is on the same Wi-Fi and the backend server is running.';
      }
      setErrorMsg(detail);
    }
  };

  const handleProceedToReview = () => {
    if (analyzedResponse && previewUrl) {
      onAnalysisComplete(analyzedResponse, previewUrl);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-fresh-surface text-fresh-text rounded-card shadow-soft-lg border border-fresh-border overflow-hidden transition-colors duration-200">
      {/* Modal Header */}
      <div className="px-6 py-4 border-b border-fresh-border flex items-center justify-between bg-fresh-surface-alt">
        <div>
          <h2 className="font-display font-medium text-lg text-fresh-text flex items-center gap-2">
            <Camera className="w-5 h-5 text-fresh-primary" />
            Upload Meal Photo
          </h2>
          <p className="text-xs text-fresh-muted mt-0.5">
            Intelligent vision estimates dishes, portions, and nutrients
          </p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs font-medium text-fresh-muted hover:text-fresh-text px-3 py-1 rounded-btn border border-fresh-border bg-fresh-surface hover:bg-fresh-surface-alt transition"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="p-6 space-y-5">
        {/* Error message */}
        {errorMsg && (
          <div className="p-3.5 bg-fresh-warning-soft border border-fresh-warning/30 rounded-card flex items-start gap-3 text-fresh-warning text-xs">
            <AlertTriangle className="w-4 h-4 text-fresh-warning shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Notice</p>
              <p className="mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Circular Plate-Guide Frame / Upload Dropzone */}
        {detectedTags && previewUrl ? (
          /* Modern Augmented Reality Food Tagging View (Inspired by Calo AI & Foodvisor) */
          <div className="space-y-4">
            <div className="relative rounded-3xl overflow-hidden border border-fresh-border shadow-xl bg-black aspect-[4/3] sm:aspect-video flex items-center justify-center">
              <img
                src={previewUrl}
                alt="Analyzed Meal"
                className="w-full h-full object-cover block"
              />

              {/* Viewfinder Reticle Corners */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-white/80 rounded-tl pointer-events-none" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-white/80 rounded-tr pointer-events-none" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-white/80 rounded-bl pointer-events-none" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-white/80 rounded-br pointer-events-none" />

              {/* Laser Scanning Grid Line Overlay */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent pointer-events-none animate-laser-scan shadow-[0_0_12px_#34d399]" />

              {/* Floating Pill Tags over the photo with glassmorphic cards */}
              <div className="absolute inset-0 p-4 flex flex-wrap content-end gap-2.5 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                {detectedTags.map((dish, idx) => (
                  <button
                    key={idx}
                    onClick={handleProceedToReview}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold backdrop-blur-md bg-white/85 text-zinc-900 border border-white/60 shadow-lg transition hover:scale-105 active:scale-95"
                    title={`Tap to edit ${dish.detected_name}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{dish.detected_name}</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-black/10 text-[10px] tabular-nums font-bold">
                      {dish.kcal ? `${Math.round(dish.kcal)} kcal` : `${dish.grams}g`}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-xs text-fresh-muted">
                <strong className="text-fresh-text">{detectedTags.length} dishes detected</strong>. Tap any item to inspect nutritional facts.
              </p>
              <button
                onClick={handleProceedToReview}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-fresh-primary hover:opacity-90 active:scale-[0.98] text-fresh-on-primary font-semibold text-xs shadow-md transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Review & Save Meal</span>
              </button>
            </div>
          </div>
        ) : (
          /* Viewfinder Camera Dropzone (Styled like Modern Smartphone Calorie Scanner) */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isLoading && fileInputRef.current?.click()}
            className={`relative rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 border border-fresh-border bg-gradient-to-b from-fresh-surface to-fresh-surface-alt/50 shadow-soft hover:shadow-soft-lg ${
              isDragging ? 'ring-2 ring-emerald-500 bg-emerald-500/10' : 'hover:border-fresh-primary'
            }`}
          >
            {/* Standard File Picker */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
              disabled={isLoading}
            />

            {/* Direct Mobile HTML5 Camera Trigger */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
              disabled={isLoading}
            />

            {isLoading ? (
              /* Laser Scanning Radar Loader */
              <div className="w-full py-8 flex flex-col items-center space-y-4">
                <div className="relative w-48 h-48 rounded-full border-2 border-dashed border-fresh-primary/60 flex items-center justify-center shadow-lg bg-fresh-surface">
                  <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin" />
                  <div className="w-36 h-36 rounded-full bg-fresh-primary-soft/50 border border-fresh-border flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-fresh-primary animate-pulse" />
                  </div>
                </div>
                <div className="space-y-1.5 text-center">
                  <p className="font-display font-semibold text-base text-fresh-text">{loadingStep}</p>
                  <p className="text-xs text-fresh-muted">AI is analyzing food geometry & macros...</p>
                </div>
              </div>
            ) : (
              <div className="py-3 flex flex-col items-center space-y-4 w-full">
                {/* Modern Smartphone Scanner Viewfinder Frame */}
                <div className="relative w-56 h-56 rounded-3xl border border-fresh-border flex flex-col items-center justify-center bg-fresh-surface p-4 transition shadow-md hover:border-fresh-primary hover:scale-[1.01] overflow-hidden group">
                  {/* Viewfinder Target Corners */}
                  <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-fresh-primary rounded-tl" />
                  <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-fresh-primary rounded-tr" />
                  <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-fresh-primary rounded-bl" />
                  <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-fresh-primary rounded-br" />

                  {/* Gentle scanning line preview */}
                  <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />

                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-transform">
                    <Utensils className="w-6 h-6" />
                  </div>
                  <span className="text-[12px] text-fresh-muted max-w-[170px] text-center leading-relaxed">
                    Center meal plate or snack inside the frame
                  </span>
                </div>

                {/* Mobile Camera and File Action Buttons */}
                <div className="flex items-center gap-3 w-full max-w-xs justify-center pt-2">
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await triggerHaptic();
                      const captured = await captureMealPhoto();
                      if (captured) {
                        handleProcessFile(captured.file);
                      } else {
                        cameraInputRef.current?.click();
                      }
                    }}
                    className="flex-1 py-3 px-4 rounded-full bg-fresh-primary text-fresh-on-primary font-semibold text-xs flex items-center justify-center gap-2 shadow-md hover:opacity-90 active:scale-95 transition"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Take Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="flex-1 py-3 px-4 rounded-full bg-fresh-surface border border-fresh-border text-fresh-text font-semibold text-xs flex items-center justify-center gap-2 hover:bg-fresh-surface-alt active:scale-95 transition shadow-sm"
                  >
                    <span>Browse Gallery</span>
                  </button>
                </div>

                <div className="text-center pt-0.5">
                  <p className="text-[11px] text-fresh-muted font-medium">Automatic recognition powered by Gemini Vision</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Helpful Photo Tips */}
        <div className="bg-fresh-surface-alt rounded-card p-4 border border-fresh-border text-xs">
          <div className="flex items-center gap-2 font-medium text-fresh-text mb-2">
            <Info className="w-4 h-4 text-fresh-primary" />
            <span>Helpful Photo Tips</span>
          </div>
          <ul className="text-fresh-muted space-y-1.5 leading-relaxed">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-fresh-primary shrink-0" />
              <span>Capture a top-down view showing dishes clearly.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-fresh-primary shrink-0" />
              <span>Even lighting helps estimate dish volume more accurately.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

