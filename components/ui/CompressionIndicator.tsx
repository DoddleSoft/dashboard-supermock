import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface CompressionIndicatorProps {
  isCompressing: boolean;
  originalSize?: number;
  compressedSize?: number;
  error?: string | null;
}

export default function CompressionIndicator({
  isCompressing,
  originalSize,
  compressedSize,
  error,
}: CompressionIndicatorProps) {
  if (error) {
    return (
      <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
        <AlertCircle className="w-4 h-4" />
        <span>Compression failed: {error}</span>
      </div>
    );
  }

  if (isCompressing) {
    return (
      <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Compressing media...</span>
      </div>
    );
  }

  if (originalSize && compressedSize) {
    const savings = ((1 - compressedSize / originalSize) * 100).toFixed(1);
    const originalMB = (originalSize / 1024 / 1024).toFixed(2);
    const compressedMB = (compressedSize / 1024 / 1024).toFixed(2);

    return (
      <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
        <CheckCircle2 className="w-4 h-4" />
        <span>
          Compressed: {originalMB}MB → {compressedMB}MB ({savings}% saved)
        </span>
      </div>
    );
  }

  return null;
}
