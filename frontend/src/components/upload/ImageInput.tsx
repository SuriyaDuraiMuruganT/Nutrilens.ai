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
          /* Detected dishes displayed as colored tags over the photo */
          <div className="space-y-4">
            <div className="relative rounded-card overflow-hidden border border-fresh-border shadow-soft">
              <img
                src={previewUrl}
                alt="Analyzed Meal"
                className="w-full max-h-72 object-cover block"
              />

              {/* Floating Pill Tags over the photo */}
              <div className="absolute inset-0 p-4 flex flex-wrap content-end gap-2 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
                {detectedTags.map((dish, idx) => (
                  <button
                    key={idx}
                    onClick={handleProceedToReview}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-fresh-surface text-fresh-text border border-fresh-border shadow-soft transition hover:scale-105 active:scale-95"
                    title={`Tap to edit ${dish.detected_name}`}
                  >
                    <Tag className="w-3 h-3 text-fresh-primary" />
                    <span>{dish.detected_name}</span>
                    <span className="text-fresh-muted text-[10px] tabular-nums">({dish.grams}g)</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-xs text-fresh-muted">
                <strong>{detectedTags.length} dishes detected</strong>. Tap any item or proceed to review portions.
              </p>
              <button
                onClick={handleProceedToReview}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn bg-fresh-primary hover:opacity-90 active:scale-[0.98] text-fresh-on-primary font-medium text-xs shadow-soft transition"
              >
                <span>Review & Save Meal</span>
              </button>
            </div>
          </div>
        ) : (
          /* Circular Plate-Guide Frame Dropzone */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isLoading && fileInputRef.current?.click()}
            className={`relative rounded-card p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 border border-fresh-border bg-fresh-surface ${
              isDragging ? 'ring-2 ring-fresh-primary bg-fresh-primary-soft' : 'hover:border-fresh-primary'
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
              /* Skeleton Loader in surface-alt instead of spinner */
              <div className="w-full py-6 flex flex-col items-center space-y-4">
                <div className="w-48 h-48 rounded-full bg-fresh-surface-alt animate-pulse border-2 border-dashed border-fresh-border flex items-center justify-center shadow-plate">
                  <div className="w-36 h-36 rounded-full bg-fresh-surface/60 border border-fresh-border flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-fresh-primary animate-pulse" />
                  </div>
                </div>
                <div className="space-y-1.5 text-center">
                  <div className="h-4 w-40 bg-fresh-surface-alt rounded-btn animate-pulse mx-auto" />
                  <p className="font-display font-medium text-sm text-fresh-text">{loadingStep}</p>
                  <p className="text-xs text-fresh-muted">Estimating portions and nutritional balance...</p>
                </div>
              </div>
            ) : (
              <div className="py-2 flex flex-col items-center space-y-4 w-full">
                {/* Circular Plate-Guide Frame */}
                <div className="relative w-52 h-52 rounded-full border-2 border-dashed border-fresh-primary/40 flex flex-col items-center justify-center bg-fresh-surface-alt/50 p-4 transition shadow-plate hover:border-fresh-primary hover:scale-[1.01]">
                  {/* Inner subtle concentric ceramic rim */}
                  <div className="absolute inset-2.5 rounded-full border border-dashed border-fresh-border pointer-events-none" />
                  <div className="absolute inset-5 rounded-full border border-fresh-primary/10 pointer-events-none" />

                  <div className="w-11 h-11 rounded-full bg-fresh-primary-soft text-fresh-primary flex items-center justify-center mb-2 shadow-soft">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <span className="font-display font-medium text-sm text-fresh-text">
                    Plate Guide Frame
                  </span>
                  <span className="text-[11px] text-fresh-muted mt-0.5 max-w-[140px] text-center leading-tight">
                    Center your plate or bowl inside the circle
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
                        // Fallback on web browser to camera trigger
                        cameraInputRef.current?.click();
                      }
                    }}
                    className="flex-1 py-2.5 px-3 rounded-btn bg-fresh-primary text-fresh-on-primary font-medium text-xs flex items-center justify-center gap-1.5 shadow-soft hover:opacity-90 active:scale-95 transition"
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
                    className="flex-1 py-2.5 px-3 rounded-btn bg-fresh-surface-alt border border-fresh-border text-fresh-text font-medium text-xs flex items-center justify-center gap-1.5 hover:bg-fresh-surface active:scale-95 transition"
                  >
                    <span>Browse Files</span>
                  </button>
                </div>

                <div className="text-center pt-1">
                  <p className="text-[11px] text-fresh-muted">Tap "Take Photo" or choose from your gallery</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Warm, Encouraging Quality Tips */}
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
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-fresh-primary shrink-0" />
              <span>Photo estimates can be off by 10-20%. Tap any item to adjust.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

