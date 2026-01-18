"use client";

import { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { useCentre } from "@/context/CentreContext";
import { Student } from "@/types/student";
import { StudentTable } from "@/components/students/StudentTable";
import { EditStudentDrawer } from "@/components/students/EditStudentDrawer";
import { CreateStudentModal } from "@/components/students/CreateStudentModal";
import { DeleteConfirmDialog } from "@/components/students/DeleteConfirmDialog";
import { formatLocalTime, getRelativeTime } from "@/lib/utils";
import {
  fetchStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} from "@/helpers/students";

export default function StudentsPage() {
  const { currentCenter, loading: centerLoading } = useCentre();

  const [students, setStudents] = useState<Student[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [actionMenuStudent, setActionMenuStudent] = useState<Student | null>(
    null,
  );
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    guardian: "",
    guardian_phone: "",
    date_of_birth: "",
    address: "",
    enrollment_type: "regular",
  });

  const [editData, setEditData] = useState({
    name: "",
    email: "",
    phone: "",
    guardian: "",
    guardian_phone: "",
    date_of_birth: "",
    address: "",
    grade: "",
    status: "active" as "active" | "cancelled" | "archived" | "passed",
    enrollment_type: "regular",
  });

  // Fetch students for the current center
  useEffect(() => {
    if (currentCenter?.center_id) {
      loadStudents();
    }
  }, [currentCenter?.center_id]);

  const loadStudents = async () => {
    if (!currentCenter?.center_id) return;

    try {
      setLoading(true);
      const data = await fetchStudents(currentCenter.center_id);
      setStudents(data);
    } catch (error) {
      // Error already handled in service
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      (student.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (student.email?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" || student.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentCenter?.center_id) {
      return;
    }

    try {
      setSubmitting(true);
      await createStudent(currentCenter.center_id, formData);

      // Refresh the students list
      await loadStudents();

      // Close modal and reset form
      handleCloseCreateModal();
    } catch (error) {
      // Error already handled in service
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDrawer = (student: Student) => {
    setSelectedStudent(student);
    setEditData({
      name: student.name || "",
      email: student.email || "",
      phone: student.phone || "",
      guardian: student.guardian || "",
      guardian_phone: student.guardian_phone || "",
      date_of_birth: student.date_of_birth || "",
      address: student.address || "",
      grade: student.grade || "",
      status: student.status,
      enrollment_type: "regular",
    });
    setShowEditDrawer(true);
  };

  const closeEditDrawer = () => {
    setShowEditDrawer(false);
    setSelectedStudent(null);
    setEditData({
      name: "",
      email: "",
      phone: "",
      guardian: "",
      guardian_phone: "",
      date_of_birth: "",
      address: "",
      grade: "",
      status: "active",
      enrollment_type: "regular",
    });
  };

  const handleSaveChanges = async () => {
    if (!selectedStudent) return;

    try {
      setSubmitting(true);
      await updateStudent(selectedStudent.student_id, editData);
      await loadStudents();
      closeEditDrawer();
    } catch (error) {
      // Error already handled in service
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
    const button = e.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();

    if (actionMenuStudent?.student_id === student.student_id) {
      setShowActionMenu(!showActionMenu);
    } else {
      setActionMenuStudent(student);
      setShowActionMenu(true);
      // Position menu relative to the button
      setMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  };

  const handleActionEdit = (student: Student) => {
    setShowActionMenu(false);
    openEditDrawer(student);
  };

  const handleActionDelete = async (student: Student) => {
    setActionMenuStudent(null);
    setShowActionMenu(false);
    setStudentToDelete(student);
    setShowDeleteConfirm(true);
  };

  const handleEditChange = (field: string, value: string) => {
    setEditData({ ...editData, [field]: value });
  };

  const handleCreateChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      guardian: "",
      guardian_phone: "",
      date_of_birth: "",
      address: "",
      enrollment_type: "regular",
    });
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;

    try {
      setDeleting(true);
      await deleteStudent(studentToDelete.student_id);
      await loadStudents();
      setShowDeleteConfirm(false);
      setStudentToDelete(null);
      closeEditDrawer();
    } catch (error) {
      // Error already handled in service
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setStudentToDelete(null);
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
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Table */}
        {!loading && (
          <StudentTable
            students={filteredStudents}
            loading={loading}
            onActionClick={toggleActionMenu}
            showActionMenu={showActionMenu}
            actionMenuStudent={actionMenuStudent}
            menuPosition={menuPosition}
            isDeleting={deleting}
            onEdit={handleActionEdit}
            onDelete={handleActionDelete}
            onCloseMenu={() => setShowActionMenu(false)}
            formatLocalTime={formatLocalTime}
            getRelativeTime={getRelativeTime}
          />
        )}
      </div>

      {/* Edit Student Drawer */}
      <EditStudentDrawer
        isOpen={showEditDrawer}
        student={selectedStudent}
        editData={editData}
        isSubmitting={submitting}
        isDeleting={deleting}
        onClose={closeEditDrawer}
        onSave={handleSaveChanges}
        onDelete={handleDeleteStudent}
        onChange={handleEditChange}
        formatLocalTime={formatLocalTime}
      />

      <CreateStudentModal
        isOpen={showCreateModal}
        formData={formData}
        isSubmitting={submitting}
        onClose={handleCloseCreateModal}
        onSubmit={handleCreateStudent}
        onChange={handleCreateChange}
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
