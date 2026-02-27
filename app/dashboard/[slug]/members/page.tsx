"use client";

import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useCentre } from "@/context/CentreContext";
import { CenterMember } from "@/types/member";
import { MemberTable } from "@/components/members/MemberTable";
import { EditMemberDrawer } from "@/components/members/EditMemberDrawer";
import { CreateMemberModal } from "@/components/members/CreateMemberModal";
import { DeleteMemberDialog } from "@/components/members/DeleteMemberDialog";
import { formatLocalTime, getRelativeTime } from "@/lib/utils";
import { SmallLoader } from "@/components/ui/SmallLoader";
import {
  createCenterMember,
  deleteCenterMember,
  fetchCenterMembers,
  updateCenterMember,
} from "@/helpers/members";

export default function MembersPage() {
  const { currentCenter, loading: centerLoading } = useCentre();

  const [members, setMembers] = useState<CenterMember[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CenterMember | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [actionMenuMember, setActionMenuMember] = useState<CenterMember | null>(
    null,
  );
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<CenterMember | null>(
    null,
  );

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "admin" as "admin" | "examiner",
    password: "",
  });

  const [editData, setEditData] = useState({
    full_name: "",
    email: "",
    role: "admin" as "admin" | "examiner",
    is_active: true,
  });

  useEffect(() => {
    if (currentCenter?.center_id && currentCenter?.user_id) {
      loadMembers();
    }
  }, [currentCenter?.center_id, currentCenter?.user_id]);

  const loadMembers = async () => {
    if (!currentCenter?.center_id || !currentCenter?.user_id) return;

    try {
      setLoading(true);
      const data = await fetchCenterMembers(
        currentCenter.center_id,
        currentCenter.user_id,
      );
      setMembers(data);
    } catch (error) {
      // handled by helper
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      (member.full_name?.toLowerCase() || "").includes(
        searchQuery.toLowerCase(),
      ) ||
      (member.email?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === "all" || member.role === selectedRole;
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "active" && member.is_active) ||
      (selectedStatus === "inactive" && !member.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentCenter?.center_id) return;

    try {
      setSubmitting(true);
      await createCenterMember(currentCenter.center_id, formData);
      await loadMembers();
      handleCloseCreateModal();
    } catch (error) {
      // handled by helper
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDrawer = (member: CenterMember) => {
    if (member.isOwner) return;

    setSelectedMember(member);
    setEditData({
      full_name: member.full_name || "",
      email: member.email || "",
      role: member.role === "examiner" ? "examiner" : "admin",
      is_active: member.is_active,
    });
    setShowEditDrawer(true);
  };

  const closeEditDrawer = () => {
    setShowEditDrawer(false);
    setSelectedMember(null);
    setEditData({
      full_name: "",
      email: "",
      role: "admin",
      is_active: true,
    });
  };

  const handleSaveChanges = async () => {
    if (!selectedMember || selectedMember.isOwner || !currentCenter?.center_id)
      return;

    try {
      setSubmitting(true);
      await updateCenterMember(selectedMember.user_id, editData);
      await loadMembers();
      closeEditDrawer();
    } catch (error) {
      // handled by helper
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = () => {
    if (!selectedMember || selectedMember.isOwner) return;
    setMemberToDelete(selectedMember);
    setShowDeleteConfirm(true);
  };

  const toggleActionMenu = (member: CenterMember, e: React.MouseEvent) => {
    e.stopPropagation();
    if (member.isOwner) return;

    const button = e.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();

    if (actionMenuMember?.user_id === member.user_id) {
      setShowActionMenu(!showActionMenu);
    } else {
      setActionMenuMember(member);
      setShowActionMenu(true);
      setMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  };

  const handleActionEdit = (member: CenterMember) => {
    setShowActionMenu(false);
    openEditDrawer(member);
  };

  const handleActionDelete = (member: CenterMember) => {
    setActionMenuMember(null);
    setShowActionMenu(false);
    setMemberToDelete(member);
    setShowDeleteConfirm(true);
  };

  const handleEditChange = (field: string, value: string | boolean) => {
    setEditData({ ...editData, [field]: value });
  };

  const handleCreateChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setFormData({
      full_name: "",
      email: "",
      role: "admin",
      password: "",
    });
  };

  const confirmDelete = async () => {
    if (!memberToDelete || !currentCenter?.center_id) return;

    try {
      setDeleting(true);
      await deleteCenterMember(currentCenter.center_id, memberToDelete.user_id);
      await loadMembers();
      setShowDeleteConfirm(false);
      setMemberToDelete(null);
      closeEditDrawer();
    } catch (error) {
      // handled by helper
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setMemberToDelete(null);
  };

  return (
    <>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
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
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 bg-white text-sm font-medium"
              >
                <option value="all">All Roles</option>
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="examiner">Examiner</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 bg-white text-sm font-medium"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={!currentCenter || centerLoading}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-sm shadow-red-100 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              New Member
            </button>
          </div>
        </div>

        {loading && <SmallLoader subtitle="Loading members..." />}

        {!loading && (
          <MemberTable
            members={filteredMembers}
            loading={loading}
            onActionClick={toggleActionMenu}
            showActionMenu={showActionMenu}
            actionMenuMember={actionMenuMember}
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

      <EditMemberDrawer
        isOpen={showEditDrawer}
        member={selectedMember}
        editData={editData}
        isSubmitting={submitting}
        isDeleting={deleting}
        onClose={closeEditDrawer}
        onSave={handleSaveChanges}
        onDelete={handleDeleteMember}
        onChange={handleEditChange}
        formatLocalTime={formatLocalTime}
      />

      <CreateMemberModal
        isOpen={showCreateModal}
        formData={formData}
        isSubmitting={submitting}
        onClose={handleCloseCreateModal}
        onSubmit={handleCreateMember}
        onChange={handleCreateChange}
      />

      <DeleteMemberDialog
        isOpen={showDeleteConfirm}
        member={memberToDelete}
        isDeleting={deleting}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  );
}
