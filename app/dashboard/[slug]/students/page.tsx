"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Search } from "lucide-react";
import { useCentre } from "@/context/CentreContext";
import { Student } from "@/types/student";
import { StudentTable } from "@/components/students/StudentTable";
import { EditStudentDrawer } from "@/components/students/EditStudentDrawer";
import { CreateStudentModal } from "@/components/students/CreateStudentModal";
import { DeleteConfirmDialog } from "@/components/students/DeleteConfirmDialog";
import { formatLocalTime, getRelativeTime } from "@/lib/utils";
import { SmallLoader } from "@/components/ui/SmallLoader";
import { toast } from "sonner";
import {
  createStudent,
  updateStudent,
  deleteStudent,
} from "@/helpers/students";

const PAGE_SIZES = [25, 50, 75, 100] as const;
type PageSize = (typeof PAGE_SIZES)[number];

export default function StudentsPage() {
  const { currentCenter, loading: centerLoading } = useCentre();

  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<PageSize>(25);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [actionMenuStudent, setActionMenuStudent] = useState<Student | null>(
    null,
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce search — 350 ms
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [searchQuery]);

  // Reset to page 1 whenever status filter changes
  const prevStatus = useRef(selectedStatus);
  useEffect(() => {
    if (selectedStatus !== prevStatus.current) {
      prevStatus.current = selectedStatus;
      setPage(1);
    }
  }, [selectedStatus]);

  const loadStudents = useCallback(async () => {
    if (!currentCenter?.center_id) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        centerId: currentCenter.center_id,
        page: String(page),
        limit: String(limit),
        search: debouncedSearch,
        status: selectedStatus,
      });

      const res = await fetch(`/api/fetch?${params.toString()}`, {
        credentials: "include",
        signal: controller.signal,
      });

      if (!res.ok) {
        let message = "Failed to load students";
        const contentType = res.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          try {
            const body = await res.json();
            if (body.error) message = body.error;
          } catch {
            /* non-JSON despite header */
          }
        }
        throw new Error(message);
      }

      let json;
      try {
        json = await res.json();
      } catch {
        throw new Error("Invalid response from server");
      }

      setStudents(json.students);
      setTotal(json.total);
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      const message =
        error instanceof Error ? error.message : "Failed to load students";
      toast.error(message);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [currentCenter?.center_id, page, limit, debouncedSearch, selectedStatus]);

  useEffect(() => {
    if (currentCenter?.center_id) {
      loadStudents();
    }
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [loadStudents]);

  const handleCreateStudent = async (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    guardian: string;
    guardian_phone: string;
    date_of_birth: string;
    address: string;
    enrollment_type: string;
  }) => {
    if (!data.email?.trim()) {
      toast.error("Student email is required.");
      return;
    }
    if (!data.name?.trim()) {
      toast.error("Student name is required");
      return;
    }

    if (!currentCenter?.center_id) {
      toast.error("Center information is missing. Please refresh the page.");
      return;
    }

    try {
      setSubmitting(true);
      await createStudent(currentCenter.center_id, data);
      await loadStudents();
      setShowCreateModal(false);
    } catch {
      // Handled in helper
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDrawer = (student: Student) => {
    setSelectedStudent(student);
    setShowEditDrawer(true);
  };

  const closeEditDrawer = () => {
    setShowEditDrawer(false);
    setSelectedStudent(null);
  };

  const handleSaveChanges = async (data: {
    name: string;
    email: string;
    phone: string;
    guardian: string;
    guardian_phone: string;
    date_of_birth: string;
    address: string;
    grade: string;
    status: "active" | "cancelled" | "archived" | "passed";
  }) => {
    if (!selectedStudent) return;

    try {
      setSubmitting(true);
      await updateStudent(selectedStudent.student_id, data);
      await loadStudents();
      closeEditDrawer();
    } catch {
      // Handled in helper
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = () => {
    if (!selectedStudent) return;
    setStudentToDelete(selectedStudent);
    setShowDeleteConfirm(true);
  };

  const toggleActionMenu = (student: Student, e: React.MouseEvent) => {
    e.stopPropagation();
    if (actionMenuStudent?.student_id === student.student_id) {
      setShowActionMenu((prev) => !prev);
    } else {
      setActionMenuStudent(student);
      setShowActionMenu(true);
    }
  };

  const handleActionEdit = (student: Student) => {
    setShowActionMenu(false);
    openEditDrawer(student);
  };

  const handleActionDelete = (student: Student) => {
    setActionMenuStudent(null);
    setShowActionMenu(false);
    setStudentToDelete(student);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;

    try {
      setDeleting(true);
      await deleteStudent(studentToDelete.student_id);
      // If the deleted student was the last on this page, go back one page
      if (students.length === 1 && page > 1) setPage((p) => p - 1);
      else await loadStudents();
      setShowDeleteConfirm(false);
      setStudentToDelete(null);
      closeEditDrawer();
    } catch {
      // Handled in helper
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setStudentToDelete(null);
  };

  const handlePageChange = (newPage: number) => {
    setShowActionMenu(false);
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit as PageSize);
    setPage(1);
    setShowActionMenu(false);
  };

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {/* Filters */}
            <div className="flex items-center w-180 gap-3">
              <div className="flex-1 max-w-sm relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
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
                <option value="active">Active</option>
                <option value="passed">Passed</option>
                <option value="archived">Archived</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={!currentCenter || centerLoading}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-sm shadow-red-100 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              New Student
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && <SmallLoader subtitle="Loading students..." />}

        {/* Table */}
        {!loading && (
          <StudentTable
            students={students}
            loading={loading}
            onActionClick={toggleActionMenu}
            showActionMenu={showActionMenu}
            actionMenuStudent={actionMenuStudent}
            isDeleting={deleting}
            onEdit={handleActionEdit}
            onDelete={handleActionDelete}
            onCloseMenu={() => setShowActionMenu(false)}
            formatLocalTime={formatLocalTime}
            getRelativeTime={getRelativeTime}
            total={total}
            currentPage={page}
            pageSize={limit}
            pageSizeOptions={[...PAGE_SIZES]}
            onPageChange={handlePageChange}
            onPageSizeChange={handleLimitChange}
          />
        )}
      </div>

      {/* Edit Student Drawer */}
      <EditStudentDrawer
        isOpen={showEditDrawer}
        student={selectedStudent}
        isSubmitting={submitting}
        isDeleting={deleting}
        onClose={closeEditDrawer}
        onSave={handleSaveChanges}
        onDelete={handleDeleteStudent}
        formatLocalTime={formatLocalTime}
      />

      <CreateStudentModal
        isOpen={showCreateModal}
        isSubmitting={submitting}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateStudent}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        student={studentToDelete}
        isDeleting={deleting}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  );
}
