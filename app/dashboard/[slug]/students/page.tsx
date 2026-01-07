"use client";

import { useState } from "react";
import { Plus, Search, MoreVertical, Mail, PlayCircle, X } from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  status: "Active" | "Pending" | "Completed";
  testsCompleted: number;
  lastActive: string;
}

const mockStudents: Student[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@email.com",
    status: "Active",
    testsCompleted: 3,
    lastActive: "2 hours ago",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    status: "Pending",
    testsCompleted: 0,
    lastActive: "1 day ago",
  },
  {
    id: "3",
    name: "Michael Chen",
    email: "m.chen@email.com",
    status: "Completed",
    testsCompleted: 12,
    lastActive: "1 week ago",
  },
  {
    id: "4",
    name: "Emma Wilson",
    email: "emma.w@email.com",
    status: "Active",
    testsCompleted: 5,
    lastActive: "5 hours ago",
  },
  {
    id: "5",
    name: "David Brown",
    email: "david.brown@email.com",
    status: "Active",
    testsCompleted: 8,
    lastActive: "1 day ago",
  },
];

export default function StudentsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    commenceImmediately: false,
  });

  const filteredStudents = mockStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" ||
      student.status.toLowerCase() === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Creating student:", formData);
    // Add API call here
    setShowCreateModal(false);
    setFormData({ name: "", email: "", commenceImmediately: false });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700 border-green-200";
      case "Pending":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "Completed":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
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
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-sm shadow-red-100 transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Student
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Tests
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className="hover:bg-slate-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {student.name.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-900 text-sm">
                        {student.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm">
                    {student.email}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                        student.status
                      )}`}
                    >
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-900 font-medium text-sm">
                    {student.testsCompleted}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">
                    {student.lastActive}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-150 text-slate-600 hover:text-slate-900">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredStudents.length === 0 && (
            <div className="text-center py-16">
              <p className="text-slate-500 text-sm">
                No students found matching your criteria
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Student Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Add Student
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Create a new student account
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({
                    name: "",
                    email: "",
                    commenceImmediately: false,
                  });
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="p-6 space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm"
                />
              </div>

              <div>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm"
                />
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.commenceImmediately}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        commenceImmediately: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <PlayCircle className="w-4 h-4 text-slate-600" />
                      <span className="font-medium text-slate-900 text-sm">
                        Start Test Now
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Begin test immediately after creation
                    </p>
                  </div>
                </label>

                {!formData.commenceImmediately && (
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-600" />
                        <span className="font-medium text-slate-900 text-sm">
                          Send Invitation
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Email login credentials to student
                      </p>
                    </div>
                  </label>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({
                      name: "",
                      email: "",
                      commenceImmediately: false,
                    });
                  }}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all duration-200 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-sm shadow-red-100 transition-all duration-200 text-sm"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
