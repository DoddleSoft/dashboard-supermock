import { useEffect, useState, FormEvent } from "react";
import { X, AlertCircle, CheckCircle } from "lucide-react";

interface EditPaperModalProps {
  paper: {
    id: string;
    title: string;
    paperType?: string | null;
    isActive: boolean;
    readingModuleId?: string | null;
    listeningModuleId?: string | null;
    writingModuleId?: string | null;
    speakingModuleId?: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
  availableModules: {
    id: string;
    module_type: string;
    heading: string;
    subheading?: string;
  }[];
  onSave: (data: {
    title: string;
    paperType: string;
    isActive: boolean;
    readingModuleId?: string | null;
    listeningModuleId?: string | null;
    writingModuleId?: string | null;
    speakingModuleId?: string | null;
  }) => Promise<{ success: boolean; error?: string }>;
}

export function EditPaperModal({
  paper,
  isOpen,
  onClose,
  availableModules,
  onSave,
}: EditPaperModalProps) {
  const [formData, setFormData] = useState({
    title: paper.title,
    paperType: paper.paperType || "IELTS",
    isActive: paper.isActive,
    readingModuleId: paper.readingModuleId || null,
    listeningModuleId: paper.listeningModuleId || null,
    writingModuleId: paper.writingModuleId || null,
    speakingModuleId: paper.speakingModuleId || null,
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(false);
      setFormData({
        title: paper.title,
        paperType: paper.paperType || "IELTS",
        isActive: paper.isActive,
        readingModuleId: paper.readingModuleId || null,
        listeningModuleId: paper.listeningModuleId || null,
        writingModuleId: paper.writingModuleId || null,
        speakingModuleId: paper.speakingModuleId || null,
      });
    }
  }, [isOpen, paper]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!formData.title.trim()) {
      setError("Paper title is required");
      return;
    }

    if (
      !formData.readingModuleId &&
      !formData.listeningModuleId &&
      !formData.writingModuleId &&
      !formData.speakingModuleId
    ) {
      setError("Please select at least one module");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSave(formData);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 1500);
      } else {
        setError(result.error || "Failed to save paper");
      }
    } catch (err) {
      setError("Something went wrong while saving. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null);
      setSuccess(false);
      setFormData({
        title: paper.title,
        paperType: paper.paperType || "IELTS",
        isActive: paper.isActive,
        readingModuleId: paper.readingModuleId || null,
        listeningModuleId: paper.listeningModuleId || null,
        writingModuleId: paper.writingModuleId || null,
        speakingModuleId: paper.speakingModuleId || null,
      });
      onClose();
    }
  };

  const getModulesByType = (type: string) =>
    availableModules.filter((m) => m.module_type === type);

  const moduleOptions = [
    { key: "reading", label: "Reading" },
    { key: "listening", label: "Listening" },
    { key: "writing", label: "Writing" },
    { key: "speaking", label: "Speaking" },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Edit Paper</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <form
          id="edit-paper-form"
          onSubmit={handleSubmit}
          className="p-6 space-y-6"
        >
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-900">
                  Changes saved successfully
                </h3>
                <p className="text-sm text-green-700">
                  Your paper has been updated.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900">Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Paper Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm text-slate-900 mb-2"
            >
              Paper Title *
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Enter paper title"
              disabled={isSubmitting}
              className="w-full px-4 py-2 text-gray-700 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 disabled:bg-slate-50 disabled:opacity-50"
            />
          </div>

          {/* Paper Type */}
          <div>
            <label
              htmlFor="paperType"
              className="block text-sm   text-slate-900 mb-2"
            >
              Paper Type
            </label>
            <select
              id="paperType"
              value={formData.paperType}
              onChange={(e) =>
                setFormData({ ...formData, paperType: e.target.value })
              }
              disabled={isSubmitting}
              className="w-full px-4 py-2 border border-slate-200 text-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 disabled:bg-slate-50 disabled:opacity-50"
            >
              <option value="IELTS">IELTS</option>
              <option value="OIETC">OIETC</option>
              <option value="GRE">GRE</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              Status
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="draft"
                  checked={!formData.isActive}
                  onChange={() => setFormData({ ...formData, isActive: false })}
                  disabled={isSubmitting}
                  className="w-4 h-4 text-slate-900 disabled:opacity-50"
                />
                <span className="text-sm text-slate-700">Draft</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="published"
                  checked={formData.isActive}
                  onChange={() => setFormData({ ...formData, isActive: true })}
                  disabled={isSubmitting}
                  className="w-4 h-4 text-slate-900 disabled:opacity-50"
                />
                <span className="text-sm text-slate-700">Published</span>
              </label>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Published papers are visible to all users and can be assigned to
              tests.
            </p>
          </div>

          {/* Module Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              Assign Modules
            </label>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              {moduleOptions.map((option) => {
                const modules = getModulesByType(option.key);
                const formKey =
                  `${option.key}ModuleId` as keyof typeof formData;
                return (
                  <div key={option.key}>
                    <label className="block text-xs font-medium text-slate-600 mb-2">
                      {option.label} Module
                    </label>
                    <select
                      value={(formData[formKey] as string | null) || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [formKey]: e.target.value || null,
                        })
                      }
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 border border-slate-200 text-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 disabled:bg-slate-50 disabled:opacity-50"
                    >
                      <option value="">None</option>
                      {modules.map((module) => (
                        <option key={module.id} value={module.id}>
                          {module.heading}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex gap-3">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 text-slate-700 border border-slate-200 rounded-lg font-medium hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-paper-form"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
