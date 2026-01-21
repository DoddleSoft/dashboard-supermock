import { X, BookOpen, Headphones, PenTool, FileText } from "lucide-react";
import Link from "next/link";

interface CreateModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
}

export function CreateModuleModal({
  isOpen,
  onClose,
  slug,
}: CreateModuleModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Create Module</h3>
            <p className="text-sm text-slate-500 mt-1">
              Select a module type to begin
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-2 gap-4">
          <Link
            href={`/dashboard/${slug}/create/modules?type=reading`}
            className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all"
            onClick={onClose}
          >
            <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Reading Module</p>
              <p className="text-xs text-slate-500">Passage-based questions</p>
            </div>
          </Link>

          <Link
            href={`/dashboard/${slug}/create/modules?type=listening`}
            className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all"
            onClick={onClose}
          >
            <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Listening Module</p>
              <p className="text-xs text-slate-500">Audio-based questions</p>
            </div>
          </Link>

          <Link
            href={`/dashboard/${slug}/create/modules?type=writing`}
            className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all"
            onClick={onClose}
          >
            <div className="w-12 h-12 rounded-lg bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
              <PenTool className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Writing Module</p>
              <p className="text-xs text-slate-500">Prompt-based tasks</p>
            </div>
          </Link>

          <Link
            href={`/dashboard/${slug}/papers?create=true`}
            className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all"
            onClick={onClose}
          >
            <div className="w-12 h-12 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                Complete Test Paper
              </p>
              <p className="text-xs text-slate-500">Full IELTS test paper</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
