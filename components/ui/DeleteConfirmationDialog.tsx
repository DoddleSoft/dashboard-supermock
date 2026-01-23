import { AlertTriangle, X } from "lucide-react";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  itemName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmationDialog({
  isOpen,
  title,
  description,
  itemName,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
              <p className="text-sm text-slate-500 mt-1">{description}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 bg-slate-50">
          <p className="text-sm text-slate-700 mb-4">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-slate-900">"{itemName}"</span>?
          </p>
          <p className="text-xs text-slate-500">
            This action cannot be undone. All associated data will be
            permanently removed.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 text-slate-700 border border-slate-200 rounded-lg font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 text-white bg-red-600 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Permanently"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
