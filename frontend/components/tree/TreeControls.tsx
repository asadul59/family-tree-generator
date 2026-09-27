import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

interface TreeControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export function TreeControls({
  scale,
  onZoomIn,
  onZoomOut,
  onReset,
}: TreeControlsProps) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-lg backdrop-blur">
      <button
        type="button"
        onClick={onZoomIn}
        disabled={scale >= 1.5}
        aria-label="Zoom in"
        title="Zoom in"
        className="rounded-lg p-2 text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ZoomIn size={17} aria-hidden="true" />
      </button>
      <span className="min-w-12 text-center text-xs font-semibold text-slate-500">
        {Math.round(scale * 100)}%
      </span>
      <button
        type="button"
        onClick={onZoomOut}
        disabled={scale <= 0.5}
        aria-label="Zoom out"
        title="Zoom out"
        className="rounded-lg p-2 text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ZoomOut size={17} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onReset}
        aria-label="Reset zoom"
        title="Reset zoom"
        className="rounded-lg p-2 text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-200"
      >
        <RotateCcw size={17} aria-hidden="true" />
      </button>
    </div>
  );
}
