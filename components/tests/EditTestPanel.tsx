"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  FileText,
  ChevronDown,
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  Save,
} from "lucide-react";
import { useCentre } from "@/context/CentreContext";
import { updateScheduledTest, type ScheduledTest } from "@/helpers/tests";
import { SmallLoader } from "@/components/ui/SmallLoader";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Paper {
  id: string;
  title: string;
  paper_type: string;
  reading_module?: { id: string; heading: string; module_type: string };
  listening_module?: { id: string; heading: string; module_type: string };
  writing_module?: { id: string; heading: string; module_type: string };
  speaking_module?: { id: string; heading: string; module_type: string };
}

interface EditTestPanelProps {
  testId: string;
  test: ScheduledTest;
  onSaved: () => void;
}

export default function EditTestPanel({
  testId,
  test,
  onSaved,
}: EditTestPanelProps) {
  const { currentCenter } = useCentre();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /* ── form state (initialised from test prop on mount) ── */
  const initDate = new Date(test.scheduled_at);

  const [testTitle, setTestTitle] = useState(test.title);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(
    test.paper
      ? {
          id: test.paper_id,
          title: test.paper.title,
          paper_type: test.paper.paper_type,
          reading_module: test.paper.reading_module,
          listening_module: test.paper.listening_module,
          writing_module: test.paper.writing_module,
          speaking_module: test.paper.speaking_module,
        }
      : null,
  );
  const [scheduledDate, setScheduledDate] = useState(
    initDate.toISOString().split("T")[0],
  );
  const [scheduledTime, setScheduledTime] = useState(
    initDate.toTimeString().slice(0, 5),
  );
  const [duration, setDuration] = useState(test.duration_minutes);
  const [status, setStatus] = useState<
    "scheduled" | "in_progress" | "completed" | "cancelled"
  >(test.status);

  const [papers, setPapers] = useState<Paper[]>([]);
  const [showPaperDropdown, setShowPaperDropdown] = useState(false);
  const formId = "edit-test-form";

  /* ── load papers list for the dropdown ── */
  useEffect(() => {
    if (currentCenter?.center_id) {
      loadPapers();
    }
  }, [currentCenter?.center_id]);

  const loadPapers = async () => {
    if (!currentCenter?.center_id) return;
    setLoading(true);

    const supabase = createClient();
    const { data: papersData } = await supabase
      .from("papers")
      .select(
        `
        id, title, paper_type,
        reading_module:modules!papers_reading_fk(id, heading, module_type),
        listening_module:modules!papers_listening_fk(id, heading, module_type),
        writing_module:modules!papers_writing_fk(id, heading, module_type),
        speaking_module:modules!papers_speaking_fk(id, heading, module_type)
      `,
      )
      .eq("center_id", currentCenter.center_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (papersData) {
      setPapers(
        papersData.map((p: any) => ({
          ...p,
          reading_module: Array.isArray(p.reading_module)
            ? p.reading_module[0]
            : p.reading_module,
          listening_module: Array.isArray(p.listening_module)
            ? p.listening_module[0]
            : p.listening_module,
          writing_module: Array.isArray(p.writing_module)
            ? p.writing_module[0]
            : p.writing_module,
          speaking_module: Array.isArray(p.speaking_module)
            ? p.speaking_module[0]
            : p.speaking_module,
        })),
      );
    }

    setLoading(false);
  };

  const handlePaperSelect = (paper: Paper) => {
    setSelectedPaper(paper);
    setShowPaperDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!testTitle || !selectedPaper || !scheduledDate || !scheduledTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!currentCenter?.center_id) {
      toast.error("No center selected.");
      return;
    }

    setSubmitting(true);

    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);

    const result = await updateScheduledTest(testId, {
      centerId: currentCenter.center_id,
      paperId: selectedPaper.id,
      title: testTitle,
      scheduledAt: scheduledAt.toISOString(),
      durationMinutes: duration,
      status,
    });

    setSubmitting(false);

    if (result.success) {
      onSaved();
    } else {
      toast.error(result.error || "Failed to update test");
    }
  };

  if (loading) {
    return <SmallLoader subtitle="Loading papers..." />;
  }

  return (
    <div className="max-w-4xl relative">
      <form id={formId} onSubmit={handleSubmit} className="space-y-6">
        {/* Test Title */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Test Title *
          </label>
          <input
            type="text"
            value={testTitle}
            onChange={(e) => setTestTitle(e.target.value)}
            placeholder="e.g., Monthly Mock Test - January 2026"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
            required
          />
        </div>

        {/* Select Paper */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Select Paper *
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPaperDropdown(!showPaperDropdown)}
              className="w-full flex items-center justify-between px-4 py-2.5 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-slate-400" />
                <span
                  className={
                    selectedPaper ? "text-slate-900" : "text-slate-400"
                  }
                >
                  {selectedPaper
                    ? `${selectedPaper.title} (${selectedPaper.paper_type})`
                    : "Choose a paper..."}
                </span>
              </div>
              <ChevronDown className="w-5 h-5 text-slate-400" />
            </button>

            {showPaperDropdown && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                {papers.length === 0 ? (
                  <div className="px-4 py-8 text-center text-slate-500">
                    No papers available
                  </div>
                ) : (
                  papers.map((paper: Paper) => (
                    <button
                      key={paper.id}
                      type="button"
                      onClick={() => handlePaperSelect(paper)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-0"
                    >
                      <FileText className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {paper.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {paper.paper_type}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Paper Modules Preview */}
        {selectedPaper && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-sm font-medium text-blue-900 mb-3">
              Paper Modules
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {selectedPaper.reading_module && (
                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-slate-900">
                    Reading: {selectedPaper.reading_module.heading}
                  </span>
                </div>
              )}
              {selectedPaper.listening_module && (
                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg">
                  <Headphones className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-slate-900">
                    Listening: {selectedPaper.listening_module.heading}
                  </span>
                </div>
              )}
              {selectedPaper.writing_module && (
                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg">
                  <PenTool className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-slate-900">
                    Writing: {selectedPaper.writing_module.heading}
                  </span>
                </div>
              )}
              {selectedPaper.speaking_module && (
                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg">
                  <Mic className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-slate-900">
                    Speaking: {selectedPaper.speaking_module.heading}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Schedule Date & Time */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <label className="block text-sm font-medium text-slate-900 mb-4">
            Schedule Date & Time *
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-600 mb-2">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-2">Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Duration */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Duration (minutes)
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            min={30}
            max={300}
            step={10}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900"
          />
        </div>

        {/* Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Status
          </label>
          <select
            value={status}
            onChange={(e) =>
              setStatus(
                e.target.value as
                  | "scheduled"
                  | "in_progress"
                  | "completed"
                  | "cancelled",
              )
            }
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 bg-white"
          >
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Submit Button Top-Right */}
        <div className="top-0 right-0 z-20">
          <button
            type="submit"
            form={formId}
            disabled={submitting}
            className="flex items-center gap-8 w-full justify-center px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white rounded-md text-lg font-medium shadow-sm shadow-red-100 transition-all duration-200"
          >
            <Save className="w-5 h-5" />
            {submitting ? "Saving..." : "Save Test"}
          </button>
        </div>
      </form>
    </div>
  );
}
