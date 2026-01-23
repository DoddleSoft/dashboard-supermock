import { CenterMember } from "@/types/member";

interface DeleteMemberDialogProps {
  isOpen: boolean;
  member: CenterMember | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteMemberDialog({
  isOpen,
  member,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteMemberDialogProps) {
  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-5">
          <h3 className="text-lg font-semibold text-slate-900">
            Remove member
          </h3>
          <p className="text-sm text-slate-600 mt-2">
            Are you sure you want to remove {member.full_name} from this center?
            This will revoke their access.
          </p>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-sm shadow-red-100 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Removing...
              </>
            ) : (
              "Remove"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
