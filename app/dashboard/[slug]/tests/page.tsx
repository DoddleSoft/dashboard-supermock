"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  FileText,
  Headphones,
  BookOpen,
  PenTool,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  User,
  Calendar,
  Clock,
  Check,
  Mic,
  ChevronDown,
} from "lucide-react";
import { useCentre } from "@/context/CentreContext";
import {
  fetchScheduledTests,
  fetchTestStats,
  deleteScheduledTest,
  cancelScheduledTest,
  ScheduledTest,
  TestStats,
} from "@/helpers/tests";
import {
  fetchStandaloneModules,
  createPaper,
  Module,
} from "@/helpers/papers";
import { SmallLoader } from "@/components/ui/SmallLoader";

export default function TestsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { currentCenter } = useCentre();

  const [tests, setTests] = useState<ScheduledTest[]>([]);
  const [stats, setStats] = useState<TestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    testId: string | null;
    testName: string | null;
  }>({
    open: false,
    testId: null,
    testName: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Paper creation state
  const [showCreatePaperModal, setShowCreatePaperModal] = useState(false);
  const [paperTitle, setPaperTitle] = useState("");
  const [paperType, setPaperType] = useState<"IELTS" | "OIETC" | "GRE">(
    "IELTS"
  );
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [selectedModules, setSelectedModules] = useState<{
    reading?: string;
    listening?: string;
    writing?: string;
    speaking?: string;
  }>({});
  const [showModuleDropdown, setShowModuleDropdown] = useState<string | null>(
    null
  );
  const [creatingPaper, setCreatingPaper] = useState(false);

  useEffect(() => {
    if (currentCenter?.center_id) {
      loadData();
      loadModules();
    }
  }, [currentCenter?.center_id]);

  const loadData = async () => {
    if (!currentCenter?.center_id) return;

    setLoading(true);
    const [testsData, statsData] = await Promise.all([
      fetchScheduledTests(currentCenter.center_id),
      fetchTestStats(currentCenter.center_id),
    ]);

    setTests(testsData);
    setStats(statsData);
    setLoading(false);
  };

  const loadModules = async () => {
    if (!currentCenter?.center_id) return;

    const modules = await fetchStandaloneModules(currentCenter.center_id);
    setAvailableModules(modules);
  };

  const filteredTests = tests.filter((test) => {
    const matchesSearch = test.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" || test.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async () => {
    if (!deleteConfirm.testId) return;

    setIsDeleting(true);
    const result = await deleteScheduledTest(deleteConfirm.testId);
    setIsDeleting(false);

    if (result.success) {
      setTests(tests.filter((t) => t.id !== deleteConfirm.testId));
      setDeleteConfirm({ open: false, testId: null, testName: null });
      setOpenMenuId(null);
      loadData(); // Reload to update stats
    }
  };

  const handleCancel = async (testId: string) => {
    const result = await cancelScheduledTest(testId);
    if (result.success) {
      loadData();
    }
    setOpenMenuId(null);
  };

  const getTestModuleIcon = (module: string) => {
    switch (module) {
      case "Listening":
        return <Headphones className="w-4 h-4" />;
      case "Reading":
        return <BookOpen className="w-4 h-4" />;
      case "Writing":
        return <PenTool className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "in_progress":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(dateString));
  };

  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleCreatePaper = async () => {
    if (!paperTitle.trim()) {
      alert("Please enter a paper title");
      return;
    }

    if (
      !selectedModules.reading &&
      !selectedModules.listening &&
      !selectedModules.writing &&
      !selectedModules.speaking
    ) {
      alert("Please select at least one module");
      return;
    }

    setCreatingPaper(true);

    const result = await createPaper({
      centerId: currentCenter!.center_id,
      title: paperTitle,
      paperType: paperType,
      readingModuleId: selectedModules.reading,
      listeningModuleId: selectedModules.listening,
      writingModuleId: selectedModules.writing,
      speakingModuleId: selectedModules.speaking,
    });

    setCreatingPaper(false);

    if (result.success) {
      setShowCreatePaperModal(false);
      setPaperTitle("");
      setSelectedModules({});
      loadData(); // Reload to update stats
    }
  };

  const getModulesByType = (type: string) => {
    return availableModules.filter((m) => m.module_type === type);
  };

  const getSelectedModule = (type: string) => {
    const moduleId = selectedModules[type as keyof typeof selectedModules];
    return availableModules.find((m) => m.id === moduleId);
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

  const getModuleColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "reading":
        return "bg-blue-100 text-blue-600 border-blue-200";
      case "listening":
        return "bg-purple-100 text-purple-600 border-purple-200";
      case "writing":
        return "bg-green-100 text-green-600 border-green-200";
      case "speaking":
        return "bg-orange-100 text-orange-600 border-orange-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const formatModuleType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <SmallLoader subtitle="Loading tests..." />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          {/* Filters */}
          <div className="flex items-center w-180 gap-3">
            <div className="flex-1 max-w-sm relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title or module..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 bg-white text-sm font-medium"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowCreatePaperModal(true)}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium shadow-sm shadow-red-100 transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Paper
            </button>
            <Link
              href={`/dashboard/${slug}/create/test`}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium shadow-sm shadow-red-100 transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Schedule Test
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-md border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Total Tests</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {stats?.totalTests || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-md bg-red-100 text-red-600 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-md border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Scheduled</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {stats?.scheduledTests || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-md border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Total Papers</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {stats?.totalPapers || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-md bg-green-100 text-green-600 flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-md border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Total Modules</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {stats?.totalModules || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-md bg-purple-100 text-purple-600 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Test Papers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTests.map((test) => (
            <div
              key={test.id}
              className="bg-white rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-200"
              onClick={() => setOpenMenuId(null)}
            >
              <div className="px-6 py-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-md font-semibold text-slate-900 mb-2">
                      {test.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                          test.status,
                        )}`}
                      >
                        {formatStatus(test.status)}
                      </span>
                      {test.paper && (
                        <span className="text-xs text-slate-500">
                          {test.paper.paper_type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Paper info */}
                  {test.paper && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <FileText className="w-4 h-4" />
                      <span>{test.paper.title}</span>
                    </div>
                  )}

                  {/* Scheduled time */}
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(test.scheduled_at)}</span>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span>{test.duration_minutes} minutes</span>
                  </div>

                  {/* Modules */}
                  {test.modules && test.modules.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">
                        {test.modules.length} module
                        {test.modules.length !== 1 ? "s" : ""}:
                      </span>
                      <div className="flex gap-1">
                        {test.modules.map((module) => (
                          <div
                            key={module.id}
                            className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center"
                            title={`${module.module_type}: ${module.heading}`}
                          >
                            {getTestModuleIcon(module.module_type)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Students */}
                  {test.students && test.students.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <User className="w-4 h-4" />
                      <span>
                        {test.students.length} student
                        {test.students.length !== 1 ? "s" : ""} assigned
                      </span>
                    </div>
                  )}

                  <div className="flex w-full justify-end pt-2 border-t border-slate-100">
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(
                            openMenuId === test.id ? null : test.id,
                          );
                        }}
                        className="hover:bg-slate-100 rounded-lg transition-colors p-2"
                      >
                        <MoreVertical className="w-4 h-4 text-slate-600" />
                      </button>

                      {openMenuId === test.id && (
                        <div
                          className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg border border-slate-200 shadow-lg z-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/${slug}/create/test?edit=${test.id}`,
                              )
                            }
                            className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-t-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                          {test.status === "scheduled" && (
                            <button
                              onClick={() => handleCancel(test.id)}
                              className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-yellow-50 text-yellow-600 text-sm font-medium transition-colors border-t border-slate-200"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          )}
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                open: true,
                                testId: test.id,
                                testName: test.title,
                              })
                            }
                            className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-red-50 text-red-600 text-sm font-medium rounded-b-lg transition-colors border-t border-slate-200"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTests.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500 mb-1">No tests found</p>
            <p className="text-sm text-slate-400 mb-4">
              Schedule your first test to get started
            </p>
            <Link
              href={`/dashboard/${slug}/create/test`}
              className="inline-flex px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-sm shadow-red-100 transition-all duration-200"
            >
              Schedule Test
            </Link>
          </div>
        )}
      </div>

      {/* Create Paper Modal */}
      {showCreatePaperModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreatePaperModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Create Test Paper
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Select modules to create a complete test paper
                </p>
              </div>
              <button
                onClick={() => setShowCreatePaperModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Paper Title */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Paper Title *
                </label>
                <input
                  type="text"
                  value={paperTitle}
                  onChange={(e) => setPaperTitle(e.target.value)}
                  placeholder="e.g., IELTS Academic Test 01"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* Paper Type */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Paper Type *
                </label>
                <select
                  value={paperType}
                  onChange={(e) =>
                    setPaperType(e.target.value as "IELTS" | "OIETC" | "GRE")
                  }
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 bg-white"
                >
                  <option value="IELTS">IELTS</option>
                  <option value="OIETC">OIETC</option>
                  <option value="GRE">GRE</option>
                </select>
              </div>

              {/* Module Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-4">
                  Select Modules (Select at least one)
                </label>
                <div className="space-y-4">
                  {["reading", "listening", "writing", "speaking"].map(
                    (moduleType) => {
                      const modulesOfType = getModulesByType(moduleType);
                      const selected = getSelectedModule(moduleType);

                      return (
                        <div key={moduleType}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${getModuleColor(
                                  moduleType
                                )}`}
                              >
                                {getModuleIcon(moduleType)}
                              </div>
                              <span className="text-sm font-medium text-slate-900">
                                {formatModuleType(moduleType)}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500">
                              {modulesOfType.length} available
                            </span>
                          </div>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setShowModuleDropdown(
                                  showModuleDropdown === moduleType
                                    ? null
                                    : moduleType
                                )
                              }
                              disabled={modulesOfType.length === 0}
                              className="w-full flex items-center justify-between px-4 py-2.5 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span
                                className={
                                  selected ? "text-slate-900" : "text-slate-400"
                                }
                              >
                                {selected
                                  ? selected.heading
                                  : modulesOfType.length === 0
                                  ? "No modules available"
                                  : "Choose a module..."}
                              </span>
                              <ChevronDown className="w-5 h-5 text-slate-400" />
                            </button>

                            {showModuleDropdown === moduleType &&
                              modulesOfType.length > 0 && (
                                <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                                  {modulesOfType.map((module) => (
                                    <button
                                      key={module.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedModules((prev) => ({
                                          ...prev,
                                          [moduleType]: module.id,
                                        }));
                                        setShowModuleDropdown(null);
                                      }}
                                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-0"
                                    >
                                      <div>
                                        <p className="text-sm font-medium text-slate-900">
                                          {module.heading}
                                        </p>
                                        {module.subheading && (
                                          <p className="text-xs text-slate-500">
                                            {module.subheading}
                                          </p>
                                        )}
                                      </div>
                                      {selected?.id === module.id && (
                                        <Check className="w-4 h-4 text-green-600" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {availableModules.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <p className="text-blue-900 text-sm mb-2">
                    No standalone modules available
                  </p>
                  <Link
                    href={`/dashboard/${slug}/questions`}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                    onClick={() => setShowCreatePaperModal(false)}
                  >
                    Create modules first
                  </Link>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    setShowCreatePaperModal(false);
                    setPaperTitle("");
                    setSelectedModules({});
                  }}
                  disabled={creatingPaper}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePaper}
                  disabled={creatingPaper}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white rounded-xl font-medium shadow-sm shadow-red-100 transition-all duration-200"
                >
                  {creatingPaper ? "Creating..." : "Create Paper"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Delete Test
              </h3>
              <p className="text-sm text-slate-600">
                Are you sure you want to delete{" "}
                <strong>{deleteConfirm.testName}</strong>? This action cannot be
                undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() =>
                  setDeleteConfirm({
                    open: false,
                    testId: null,
                    testName: null,
                  })
                }
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white rounded-xl font-medium shadow-sm shadow-red-100 transition-colors"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
