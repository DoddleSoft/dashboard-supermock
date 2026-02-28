"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Users,
  ChevronDown,
  X,
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  Check,
} from "lucide-react";
import { useCentre } from "@/context/CentreContext";
import { fetchStudents } from "@/helpers/students";
import {
  createScheduledTest,
  updateScheduledTest,
  fetchScheduledTest,
} from "@/helpers/tests";
import { SmallLoader } from "@/components/ui/SmallLoader";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { formatModuleType, getModuleColor } from "@/lib/utils";

interface Paper {
  id: string;
  title: string;
  paper_type: string;
  reading_module?: {
    id: string;
    heading: string;
    module_type: string;
  };
  listening_module?: {
    id: string;
    heading: string;
    module_type: string;
  };
  writing_module?: {
    id: string;
    heading: string;
    module_type: string;
  };
  speaking_module?: {
    id: string;
    heading: string;
    module_type: string;
  };
}

interface Student {
  student_id: string;
  name: string | null;
  email: string | null;
}

export default function CreateTestPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const editId = searchParams.get("edit");

  const { currentCenter } = useCentre();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [testTitle, setTestTitle] = useState("");
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [duration, setDuration] = useState(180);
  const [status, setStatus] = useState<
    "scheduled" | "in_progress" | "completed" | "cancelled"
  >("scheduled");

  // Data state
  const [papers, setPapers] = useState<Paper[]>([]);

  // UI state
  const [showPaperDropdown, setShowPaperDropdown] = useState(false);

  useEffect(() => {
    if (currentCenter?.center_id) {
      loadData();
    }
  }, [currentCenter?.center_id]);

  useEffect(() => {
    if (editId && currentCenter?.center_id) {
      loadTestData();
    }
  }, [editId, currentCenter?.center_id]);

  const loadData = async () => {
    if (!currentCenter?.center_id) return;

    setLoading(true);
    const supabase = createClient();

    // Fetch papers
    const { data: papersData } = await supabase
      .from("papers")
      .select(
        `
        id,
        title,
        paper_type,
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
      // Transform the data to handle single object instead of array for modules
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

    // Fetch students
    const studentsData = await fetchStudents(currentCenter.center_id);

    setLoading(false);
  };

  const loadTestData = async () => {
    if (!editId) return;

    setLoading(true);
    const testData = await fetchScheduledTest(editId);

    if (testData) {
      setTestTitle(testData.title);
      setDuration(testData.duration_minutes);
      setStatus(testData.status);

      // Parse scheduled_at into date and time
      const scheduledDate = new Date(testData.scheduled_at);
      const dateStr = scheduledDate.toISOString().split("T")[0];
      const timeStr = scheduledDate.toTimeString().slice(0, 5);
      setScheduledDate(dateStr);
      setScheduledTime(timeStr);

      // Set selected paper after papers are loaded
      if (testData.paper) {
        setSelectedPaper({
          id: testData.paper_id,
          title: testData.paper.title,
          paper_type: testData.paper.paper_type,
          reading_module: testData.paper.reading_module,
          listening_module: testData.paper.listening_module,
          writing_module: testData.paper.writing_module,
          speaking_module: testData.paper.speaking_module,
        });
      }
    }

    setLoading(false);
  };

  const loadModulesForPaper = async (paperId: string) => {
    // No longer needed - papers have modules built-in
  };

  const handlePaperSelect = (paper: Paper) => {
    setSelectedPaper(paper);
    setShowPaperDropdown(false);
  };

  const handleStudentToggle = (studentId: string) => {
    // No longer needed - students are added as mock-only
  };

  const getModuleIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "reading":
        return <BookOpen className="w-4 h-4" />;
      case "listening":
        return <Headphones className="w-4 h-4" />;
      case "writing":
        return <PenTool className="w-4 h-4" />;
      case "speaking":
        return <Mic className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!testTitle || !selectedPaper || !scheduledDate || !scheduledTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);

    const payload = {
      centerId: currentCenter!.center_id,
      paperId: selectedPaper.id,
      title: testTitle,
      scheduledAt: scheduledAt.toISOString(),
      durationMinutes: duration,
      status: status,
    };

    const result = editId
      ? await updateScheduledTest(editId, payload)
      : await createScheduledTest(payload);

    setSubmitting(false);

    if (result.success) {
      router.push(`/dashboard/${slug}/tests`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <SmallLoader subtitle="Loading..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/dashboard/${slug}/tests`}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tests
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">
          {editId ? "Edit Test" : "Schedule New Test"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
                    <p className="mb-2">No papers available</p>
                    <Link
                      href={`/dashboard/${slug}/questions`}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Create a paper first
                    </Link>
                  </div>
                ) : (
                  papers.map((paper) => (
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

        {/* Selected Paper Details */}
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
                  min={new Date().toISOString().split("T")[0]}
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
            Test Duration (minutes)
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            min={30}
            max={300}
            step={15}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900"
          />
          <p className="text-xs text-slate-500 mt-2">
            Standard IELTS test is 180 minutes (3 hours)
          </p>
        </div>

        {/* Status (only show when editing) */}
        {editId && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Test Status
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
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/${slug}/tests`}
            className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white rounded-xl font-medium shadow-sm shadow-red-100 transition-all duration-200"
          >
            {submitting
              ? editId
                ? "Updating..."
                : "Scheduling..."
              : editId
                ? "Update Test"
                : "Schedule Test"}
          </button>
        </div>
      </form>
    </div>
  );
}
