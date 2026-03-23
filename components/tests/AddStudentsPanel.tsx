"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  X,
  Calendar,
  FileText,
  Users,
  Trash2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useCentre } from "@/context/CentreContext";
import type { ScheduledTest } from "@/helpers/tests";
import { createClient } from "@/lib/supabase/client";
import { parseError } from "@/lib/utils";

interface StudentFormData {
  student_id?: string;
  name: string;
  email: string;
  phone: string;
  enrollment_type: "regular" | "mock_only";
  guardian?: string;
  guardian_phone?: string;
  isExisting?: boolean;
}

interface AddStudentsPanelProps {
  testId: string;
  test: ScheduledTest;
  onSaved: () => void;
}

export default function AddStudentsPanel({
  testId,
  test,
  onSaved,
}: AddStudentsPanelProps) {
  const { currentCenter } = useCentre();

  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { student_id: string; name: string; email: string }[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [students, setStudents] = useState<StudentFormData[]>([]);
  const [existingStudentIds, setExistingStudentIds] = useState<Set<string>>(
    new Set(),
  );
  const [currentStudent, setCurrentStudent] = useState<StudentFormData>({
    name: "",
    email: "",
    phone: "",
    enrollment_type: "mock_only",
    guardian: "",
    guardian_phone: "",
  });

  /* ── load already-enrolled student IDs to prevent duplicates ── */
  useEffect(() => {
    const loadExisting = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("mock_attempts")
        .select("student_id")
        .eq("scheduled_test_id", testId);
      if (data) {
        setExistingStudentIds(
          new Set(data.map((r: { student_id: string }) => r.student_id)),
        );
      }
    };
    loadExisting();
  }, [testId]);

  /* ── search existing regular students ── */
  const searchExistingStudents = async (query: string) => {
    if (!currentCenter?.center_id || !query.trim() || query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    const supabase = createClient();

    try {
      const sanitized = query
        .replace(/[%_()\\,.*]/g, "")
        .trim()
        .slice(0, 100);

      if (!sanitized) {
        setSearchResults([]);
        setShowSearchResults(false);
        setIsSearching(false);
        return;
      }

      const { data, error } = await supabase
        .from("student_profiles")
        .select("student_id, name, email")
        .eq("center_id", currentCenter.center_id)
        .eq("enrollment_type", "regular")
        .or(`name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`)
        .limit(5);

      if (error) throw error;

      // Filter out students already enrolled in this test
      const filtered = (data || []).filter(
        (s: { student_id: string }) => !existingStudentIds.has(s.student_id),
      );

      setSearchResults(filtered);
      setShowSearchResults(true);
    } catch (error) {
      console.error("Error searching students:", error);
      toast.error("Unable to search students. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const selectExistingStudent = (student: {
    student_id: string;
    name: string;
    email: string;
  }) => {
    setCurrentStudent({
      student_id: student.student_id,
      name: student.name || "",
      email: student.email || "",
      phone: "",
      enrollment_type: "regular",
      guardian: "",
      guardian_phone: "",
      isExisting: true,
    });
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const addStudentToList = () => {
    if (!currentStudent.name.trim()) {
      toast.error("Please enter student name");
      return;
    }

    if (
      currentStudent.enrollment_type === "regular" &&
      !currentStudent.isExisting &&
      !currentStudent.guardian?.trim()
    ) {
      toast.error("Guardian name is required for regular enrollment");
      return;
    }

    const isDuplicate = students.some(
      (s: StudentFormData) =>
        (s.student_id &&
          currentStudent.student_id &&
          s.student_id === currentStudent.student_id) ||
        (s.email && currentStudent.email && s.email === currentStudent.email),
    );

    if (isDuplicate) {
      toast.error("This student is already in the list");
      return;
    }

    // Check against students already enrolled in this test
    if (
      currentStudent.student_id &&
      existingStudentIds.has(currentStudent.student_id)
    ) {
      toast.error("This student is already enrolled in this test");
      return;
    }

    setStudents([...students, { ...currentStudent }]);
    setCurrentStudent({
      name: "",
      email: "",
      phone: "",
      enrollment_type: "mock_only",
      guardian: "",
      guardian_phone: "",
      isExisting: false,
    });
    setSearchQuery("");
  };

  const removeStudent = (index: number) => {
    setStudents(
      students.filter((_: StudentFormData, i: number) => i !== index),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentCenter?.center_id) return;

    if (students.length === 0) {
      toast.error("Please add at least one student");
      return;
    }

    if (!test.paper_id) {
      toast.error("Test does not have an associated paper");
      return;
    }

    setSubmitting(true);

    const supabase = createClient();
    const visitorExamDate = new Date(test.scheduled_at)
      .toISOString()
      .split("T")[0];

    try {
      const newStudents = students.filter(
        (s: StudentFormData) => !s.isExisting,
      );
      const existingStudents = students.filter(
        (s: StudentFormData) => s.isExisting,
      );

      // Build the payload for the atomic RPC
      const newStudentPayloads = newStudents.map(
        (student: StudentFormData) => ({
          name: student.name,
          email: student.email || null,
          phone: student.phone || null,
          enrollment_type: student.enrollment_type,
          guardian:
            student.enrollment_type === "regular" ? student.guardian : null,
          guardian_phone:
            student.enrollment_type === "regular"
              ? student.guardian_phone
              : null,
          visitor_exam_date: visitorExamDate,
        }),
      );

      const existingIds = existingStudents
        .map((s: StudentFormData) => s.student_id)
        .filter(Boolean) as string[];

      const { data, error } = await supabase.rpc("add_students_to_test", {
        p_test_id: testId,
        p_paper_id: test.paper_id,
        p_center_id: currentCenter.center_id,
        p_new_students: newStudentPayloads,
        p_existing_student_ids: existingIds,
      });

      if (error) {
        console.error("RPC error:", error);
        toast.error(
          error.code === "23505"
            ? "Some students are already enrolled or have attempts for this test."
            : "Failed to add students to the test. Please try again.",
        );
        setSubmitting(false);
        return;
      }

      if (!data || !data.success) {
        toast.error(data?.error ?? "Failed to process students");
        setSubmitting(false);
        return;
      }

      onSaved();
    } catch (error) {
      console.error("Error adding students:", error);
      toast.error(
        parseError(
          error,
          "Failed to add students to the test. Please try again.",
        ),
      );
    } finally {
      setSubmitting(false);
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

  return (
    <div className="max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Student Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Student Information
          </h3>

          <div className="space-y-4">
            {/* Search Existing Regular Students */}
            {!currentStudent.isExisting && (
              <div className="relative">
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Search Existing Student
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchExistingStudents(e.target.value);
                    }}
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                {showSearchResults && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-4 text-center text-slate-500">
                        Searching...
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="p-2">
                        {searchResults.map(
                          (student: {
                            student_id: string;
                            name: string;
                            email: string;
                          }) => (
                            <button
                              key={student.student_id}
                              type="button"
                              onClick={() => selectExistingStudent(student)}
                              className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                              <div className="font-medium text-slate-900">
                                {student.name}
                              </div>
                              <div className="text-sm text-slate-500">
                                {student.email}
                              </div>
                            </button>
                          ),
                        )}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-slate-500">
                        No students found. Fill in the form below to add a new
                        student.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Existing Student Selected */}
            {currentStudent.isExisting && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      Existing Student Selected
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      {currentStudent.name} will be added to this test
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStudent({
                        name: "",
                        email: "",
                        phone: "",
                        enrollment_type: "regular",
                        guardian: "",
                        guardian_phone: "",
                        isExisting: false,
                      });
                    }}
                    className="text-green-600 hover:text-green-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={addStudentToList}
              className="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add to List
            </button>
          </div>
        </div>

        {/* Students List */}
        {students.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Students to Add ({students.length})
              </h3>
            </div>

            <div className="space-y-3">
              {students.map((student: StudentFormData, index: number) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{student.name}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                      {student.email && <span>{student.email}</span>}
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          student.enrollment_type === "regular"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {student.enrollment_type === "regular"
                          ? "Regular"
                          : "Mock Only"}
                      </span>
                      {student.isExisting && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                          Existing
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeStudent(index)}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {students.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No students added yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Fill in the form above to add students
            </p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || students.length === 0}
          className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white rounded-xl font-medium shadow-sm shadow-red-100 transition-all duration-200"
        >
          {submitting
            ? "Adding Students..."
            : `Add ${students.length} Student${students.length !== 1 ? "s" : ""}`}
        </button>
      </form>
    </div>
  );
}
