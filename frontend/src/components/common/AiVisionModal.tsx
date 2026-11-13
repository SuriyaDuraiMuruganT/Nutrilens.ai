import React, { useState, useEffect } from 'react';
import { X, Sparkles, Key, Check, AlertCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { mealsApi, AiStatusResponse } from '../../api/mealsApi';

interface AiVisionModalProps {
  onClose: () => void;
  onStatusChange: (status: AiStatusResponse) => void;
}

export const AiVisionModal: React.FC<AiVisionModalProps> = ({ onClose, onStatusChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [aiStatus, setAiStatus] = useState<AiStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await mealsApi.getAiStatus();
        setAiStatus(res);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const handleSaveKey = async () => {
    setIsSaving(true);
    setFeedbackMsg(null);
    try {
      const res = await mealsApi.setGeminiKey(apiKey);
      const updatedStatus = await mealsApi.getAiStatus();
      setAiStatus(updatedStatus);
      onStatusChange(updatedStatus);
      setFeedbackMsg({ type: 'success', text: res.message });
      setApiKey('');
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to save Gemini key. Please verify key format.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevertMock = async () => {
    setIsSaving(true);
    setFeedbackMsg(null);
    try {
      await mealsApi.setGeminiKey('');
      const updatedStatus = await mealsApi.getAiStatus();
      setAiStatus(updatedStatus);
      onStatusChange(updatedStatus);
      setFeedbackMsg({ type: 'success', text: 'Reverted to Mock Vision mode.' });
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: 'Failed to switch to Mock mode.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg my-auto overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">AI Vision Engine Settings</h2>
              <p className="text-xs text-slate-500">Configure real Gemini AI visual recognition</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Current Status Pill */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              aiStatus?.has_gemini_key
                ? 'bg-emerald-50/80 border-emerald-200'
                : 'bg-amber-50/80 border-amber-200'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Active Mode:
                </span>
                <span
                  className={`text-xs font-black px-2 py-0.5 rounded-full ${
                    aiStatus?.has_gemini_key
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {aiStatus?.has_gemini_key ? '🟢 Gemini 2.5 AI Active' : '🟡 Mock Mode (Offline)'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {aiStatus?.has_gemini_key
                  ? `Analyzing real pixels of any meal photo using ${aiStatus.model}.`
                  : 'Currently detecting based on visual heuristics and testing meal presets.'}
              </p>
            </div>
          </div>

          {/* Feedback Alert */}
          {feedbackMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {feedbackMsg.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* API Key Form */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              Enter Google Gemini API Key
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                placeholder={aiStatus?.masked_key || 'AIzaSy...'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Your key is stored locally in backend/.env</span>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
              >
                Get free key from Google AI Studio <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleSaveKey}
              disabled={isSaving || !apiKey.trim()}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition disabled:opacity-40"
            >
              {isSaving ? 'Activating...' : 'Activate Real AI Vision'}
            </button>

            {aiStatus?.has_gemini_key && (
              <button
                onClick={handleRevertMock}
                disabled={isSaving}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition"
              >
                Use Mock Mode
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
