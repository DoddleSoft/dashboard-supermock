"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
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
import { fetchScheduledTest } from "@/helpers/tests";
import { SmallLoader } from "@/components/ui/SmallLoader";
import { createClient } from "@/lib/supabase/client";

interface TestData {
  id: string;
  title: string;
  scheduled_at: string;
  paper_id?: string;
  paper?: {
    title: string;
    paper_type: string;
  };
}

interface StudentFormData {
  student_id?: string; // For existing students
  name: string;
  email: string;
  phone: string;
  enrollment_type: "regular" | "mock_only";
  guardian?: string;
  guardian_phone?: string;
  isExisting?: boolean; // Flag to identify existing students
}

export default function AddStudentsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const testId = params.testId as string;

  const { currentCenter } = useCentre();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [test, setTest] = useState<TestData | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [students, setStudents] = useState<StudentFormData[]>([]);
  const [currentStudent, setCurrentStudent] = useState<StudentFormData>({
    name: "",
    email: "",
    phone: "",
    enrollment_type: "mock_only",
    guardian: "",
    guardian_phone: "",
  });

  useEffect(() => {
    if (currentCenter?.center_id) {
      loadTestData();
    }
  }, [currentCenter?.center_id, testId]);

  const loadTestData = async () => {
    setLoading(true);
    const testData = await fetchScheduledTest(testId);

    if (testData) {
      setTest({
        id: testData.id,
        title: testData.title,
        scheduled_at: testData.scheduled_at,
        paper_id: testData.paper_id,
        paper: testData.paper,
      });
    }

    setLoading(false);
  };

  const searchExistingStudents = async (query: string) => {
    if (!currentCenter?.center_id || !query.trim() || query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("student_profiles")
        .select("*")
        .eq("center_id", currentCenter.center_id)
        .eq("enrollment_type", "regular")
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(5);

      if (error) throw error;

      setSearchResults(data || []);
      setShowSearchResults(true);
    } catch (error) {
      console.error("Error searching students:", error);
      toast.error("Failed to search students");
    } finally {
      setIsSearching(false);
    }
  };

  const selectExistingStudent = (student: any) => {
    setCurrentStudent({
      student_id: student.student_id,
      name: student.name || "",
      email: student.email || "",
      phone: student.phone || "",
      enrollment_type: "regular",
      guardian: student.guardian || "",
      guardian_phone: student.guardian_phone || "",
      isExisting: true,
    });
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const addStudentToList = () => {
    // Validate required fields
    if (!currentStudent.name.trim()) {
      toast.error("Please enter student name");
      return;
    }

    // If regular enrollment and new student, guardian is required
    if (
      currentStudent.enrollment_type === "regular" &&
      !currentStudent.isExisting &&
      !currentStudent.guardian?.trim()
    ) {
      toast.error("Guardian name is required for regular enrollment");
      return;
    }

    // Check for duplicates in the list
    const isDuplicate = students.some(
      (s) =>
        s.student_id === currentStudent.student_id ||
        (s.email && currentStudent.email && s.email === currentStudent.email),
    );

    if (isDuplicate) {
      toast.error("This student is already in the list");
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
    setStudents(students.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentCenter?.center_id || !test) {
      return;
    }

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
      // 1. Separate new and existing students
      const newStudents = students.filter((s) => !s.isExisting);
      const existingStudents = students.filter((s) => s.isExisting);

      let allStudentIds: string[] = [];

      // 2. Batch insert new students into student_profiles
      if (newStudents.length > 0) {
        const studentInserts = newStudents.map((student) => ({
          center_id: currentCenter.center_id,
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
          status: "active",
        }));

        const { data: createdStudents, error: studentError } = await supabase
          .from("student_profiles")
          .insert(studentInserts)
          .select("student_id");

        if (studentError) {
          console.error("Error creating students:", studentError);
          toast.error(`Failed to create students: ${studentError.message}`);
          setSubmitting(false);
          return;
        }

        if (createdStudents && createdStudents.length > 0) {
          allStudentIds = createdStudents.map((s) => s.student_id);
        }
      }

      // 3. Add existing student IDs
      if (existingStudents.length > 0) {
        allStudentIds = [
          ...allStudentIds,
          ...existingStudents.map((s) => s.student_id!),
        ];
      }

      if (allStudentIds.length === 0) {
        toast.error("Failed to process students");
        setSubmitting(false);
        return;
      }

      // 4. Batch insert mock attempts for all students
      const mockAttemptInserts = allStudentIds.map((student_id) => ({
        student_id: student_id,
        paper_id: test.paper_id,
        attempt_type: "full_mock",
        status: "in_progress",
      }));

      const { error: mockAttemptError } = await supabase
        .from("mock_attempts")
        .insert(mockAttemptInserts);

      if (mockAttemptError) {
        console.error("Error creating mock attempts:", mockAttemptError);
        toast.error(
          `Failed to create mock attempts: ${mockAttemptError.message}`,
        );
        setSubmitting(false);
        return;
      }

      // Success - show toast and redirect back to tests page
      toast.success(
        `Successfully added ${students.length} student${students.length !== 1 ? "s" : ""} to the test`,
      );

      setTimeout(() => {
        router.push(`/dashboard/${slug}/tests`);
      }, 500);
    } catch (error) {
      console.error("Error adding students:", error);
      toast.error("An unexpected error occurred");
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <SmallLoader subtitle="Loading test..." />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500">Test not found</p>
          <Link
            href={`/dashboard/${slug}/tests`}
            className="inline-flex mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium"
          >
            Back to Tests
          </Link>
        </div>
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
          Add Students to Test
        </h1>
      </div>

      {/* Test Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-1">
              {test.title}
            </h3>
            {test.paper && (
              <p className="text-sm text-blue-700 mb-2">
                {test.paper.title} ({test.paper.paper_type})
              </p>
            )}
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(test.scheduled_at)}</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Add Student Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center mb-4 justify-between">
            <h3 className="text-lg font-semibold text-slate-900">
              Student Information
            </h3>
          </div>

          <div className="space-y-4">
            {/* Enrollment Type */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Enrollment Type*
              </label>
              <select
                value={currentStudent.enrollment_type}
                onChange={(e) => {
                  const newType = e.target.value as "regular" | "mock_only";
                  setCurrentStudent({
                    name: "",
                    email: "",
                    phone: "",
                    enrollment_type: newType,
                    guardian: "",
                    guardian_phone: "",
                    isExisting: false,
                  });
                  setSearchQuery("");
                  setSearchResults([]);
                  setShowSearchResults(false);
                }}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 bg-white"
              >
                <option value="mock_only">Mock Only</option>
                <option value="regular">Regular</option>
              </select>
            </div>

            {/* Search Existing Regular Students */}
            {currentStudent.enrollment_type === "regular" &&
              !currentStudent.isExisting && (
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

                  {/* Search Results Dropdown */}
                  {showSearchResults && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {isSearching ? (
                        <div className="p-4 text-center text-slate-500">
                          Searching...
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div className="p-2">
                          {searchResults.map((student) => (
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
                          ))}
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

            {/* Existing Student Selected Notice */}
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

            {/* Student Name */}
            {!currentStudent.isExisting && (
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Student Name*
                </label>
                <input
                  type="text"
                  value={currentStudent.name}
                  onChange={(e) =>
                    setCurrentStudent({
                      ...currentStudent,
                      name: e.target.value,
                    })
                  }
                  placeholder="Enter student name"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                />
              </div>
            )}

            {!currentStudent.isExisting && (
              <div className="grid grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={currentStudent.email}
                    onChange={(e) =>
                      setCurrentStudent({
                        ...currentStudent,
                        email: e.target.value,
                      })
                    }
                    placeholder="student@example.com"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={currentStudent.phone}
                    onChange={(e) =>
                      setCurrentStudent({
                        ...currentStudent,
                        phone: e.target.value,
                      })
                    }
                    placeholder="+880 123 456 7890"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>
            )}

            {/* Guardian Info (required for regular enrollment) */}
            {currentStudent.enrollment_type === "regular" &&
              !currentStudent.isExisting && (
                <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-600 mb-2">
                    Guardian information is required for regular enrollment
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">
                        Guardian Name *
                      </label>
                      <input
                        type="text"
                        value={currentStudent.guardian}
                        onChange={(e) =>
                          setCurrentStudent({
                            ...currentStudent,
                            guardian: e.target.value,
                          })
                        }
                        placeholder="Enter guardian name"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-900 mb-2">
                        Guardian Phone (optional)
                      </label>
                      <input
                        type="tel"
                        value={currentStudent.guardian_phone}
                        onChange={(e) =>
                          setCurrentStudent({
                            ...currentStudent,
                            guardian_phone: e.target.value,
                          })
                        }
                        placeholder="+880 123 456 7890"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
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
              {students.map((student, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{student.name}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                      {student.email && <span>{student.email}</span>}
                      {student.phone && <span>{student.phone}</span>}
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
                    {student.enrollment_type === "regular" &&
                      student.guardian && (
                        <p className="text-sm text-slate-500 mt-1">
                          Guardian: {student.guardian}
                          {student.guardian_phone &&
                            ` (${student.guardian_phone})`}
                        </p>
                      )}
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
            disabled={submitting || students.length === 0}
            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white rounded-xl font-medium shadow-sm shadow-red-100 transition-all duration-200"
          >
            {submitting
              ? "Adding Students..."
              : `Add ${students.length} Student${students.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      </form>
    </div>
  );
}
