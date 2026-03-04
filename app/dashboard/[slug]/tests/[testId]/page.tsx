"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit2,
  FileText,
  RectangleEllipsis,
  Trash2,
  UserCheck,
  UserPlus,
} from "lucide-react";
import {
  deleteScheduledTest,
  fetchScheduledTest,
  generateScheduledTestOtp,
  type ScheduledTest,
} from "@/helpers/tests";
import { SmallLoader } from "@/components/ui/SmallLoader";
import { DeleteConfirmationDialog } from "@/components/ui/DeleteConfirmationDialog";
import TestDetailsPanel from "@/components/tests/TestDetailsPanel";
import EditTestPanel from "@/components/tests/EditTestPanel";
import AddStudentsPanel from "@/components/tests/AddStudentsPanel";
import ViewStudentPanel from "@/components/tests/ViewStudentPanel";

type ActivePanel = "details" | "edit" | "students" | "view";

const sidebarNavItems: {
  key: ActivePanel;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "details", label: "Test Details", icon: FileText },
  { key: "edit", label: "Edit Test", icon: Edit2 },
  { key: "students", label: "Add Students", icon: UserPlus },
  { key: "view", label: "All Students", icon: UserCheck },
];

export default function TestDetailPage() {
  const params = useParams();
  const router = useRouter();

  const slug = params.slug as string;
  const testId = params.testId as string;

  const [test, setTest] = useState<ScheduledTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState<ActivePanel>("details");
  const [otpLoading, setOtpLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  /* ── load / reload test ── */
  const loadTest = async () => {
    setLoading(true);
    const testData = await fetchScheduledTest(testId);
    setTest(testData);
    setLoading(false);
  };

  useEffect(() => {
    if (testId) loadTest();
  }, [testId]);

  /* ── actions ── */
  const handleGenerateOtp = async () => {
    if (!test || test.otp) return;
    setOtpLoading(true);
    const result = await generateScheduledTestOtp(test.id);
    setOtpLoading(false);

    if (result.success && result.otp) {
      setTest((prev: ScheduledTest | null) =>
        prev ? { ...prev, otp: result.otp! } : prev,
      );
    }
  };

  const handleDelete = () => {
    if (!test) return;
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!test) return;
    setDeleting(true);
    const result = await deleteScheduledTest(test.id);
    setDeleting(false);
    if (result.success) {
      setShowDeleteDialog(false);
      router.push(`/dashboard/${slug}/tests`);
    }
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
  };

  /** Called by EditTestPanel / AddStudentsPanel after a save */
  const handleSaved = () => {
    loadTest();
    setActivePanel("details");
  };

  /* ── loading / error states ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <SmallLoader subtitle="Loading test..." />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <p className="text-slate-500">Test not found.</p>
      </div>
    );
  }

  /* ── render ── */
  return (
    <div className="flex -m-8 h-[calc(100vh-57px)]">
      {/* ── Secondary Sidebar ── */}
      <aside className="w-56 shrink-0 bg-white border-r border-slate-200 flex flex-col">
        {/* Nav Items */}
        <nav className="flex-1 p-2 space-y-0.5">
          {sidebarNavItems.map((item) => {
            const isActive = activePanel === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActivePanel(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="p-2 border-t border-slate-100 space-y-0.5">
          <button
            onClick={handleGenerateOtp}
            disabled={Boolean(test.otp) || otpLoading}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RectangleEllipsis className="w-4 h-4" />
            {test.otp
              ? "OTP Generated"
              : otpLoading
                ? "Generating..."
                : "Generate OTP"}
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? "Deleting..." : "Delete Test"}
          </button>
        </div>
      </aside>

      {/* ── Content Area ── */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
        {activePanel === "details" && <TestDetailsPanel test={test} />}

        {activePanel === "edit" && (
          <EditTestPanel testId={testId} test={test} onSaved={handleSaved} />
        )}

        {activePanel === "students" && (
          <AddStudentsPanel testId={testId} test={test} onSaved={handleSaved} />
        )}

        {activePanel === "view" && <ViewStudentPanel testId={testId} />}
      </div>

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        title="Delete Test"
        description="You are about to permanently delete this scheduled test."
        itemName={test.title}
        isDeleting={deleting}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
