"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Mail,
  Phone,
  User,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { fetchTestStudents, type TestStudent } from "@/helpers/tests";
import { SmallLoader } from "@/components/ui/SmallLoader";

interface ViewStudentPanelProps {
  testId: string;
}

const attemptStatusConfig: Record<
  string,
  { label: string; icon: React.ReactNode; className: string }
> = {
  in_progress: {
    label: "In Progress",
    icon: <Clock className="w-3.5 h-3.5" />,
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  completed: {
    label: "Completed",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    className: "bg-green-100 text-green-700 border-green-200",
  },
  evaluated: {
    label: "Evaluated",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  abandoned: {
    label: "Abandoned",
    icon: <XCircle className="w-3.5 h-3.5" />,
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

export default function ViewStudentPanel({ testId }: ViewStudentPanelProps) {
  const [students, setStudents] = useState<TestStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadStudents = async () => {
    setLoading(true);
    const data = await fetchTestStudents(testId);
    setStudents(data);
    setLoading(false);
  };

  useEffect(() => {
    loadStudents();
  }, [testId]);

  const filtered = students.filter(
    (s) =>
      (s.student.name ?? "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (s.student.email ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(dateStr));
  };

  if (loading) {
    return <SmallLoader subtitle="Loading students..." />;
  }

  return (
    <div className="max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-md font-semibold text-slate-900">
              {students.length} Registered Students
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          {students.length > 0 && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-lg px-8 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm"
              />
            </div>
          )}
          <button
            onClick={loadStudents}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary badges */}
      {students.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(
            ["in_progress", "completed", "evaluated", "abandoned"] as const
          ).map((status) => {
            const count = students.filter(
              (s) => s.attempt_status === status,
            ).length;
            const cfg = attemptStatusConfig[status];
            return (
              <div
                key={status}
                className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3"
              >
                <span
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.className}`}
                >
                  {cfg.icon}
                  {cfg.label}
                </span>
                <span className="text-lg font-semibold text-slate-900">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          {students.length === 0 ? (
            <>
              <p className="text-slate-600 font-medium">No students yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Use "Add Students" to register students to this test.
              </p>
            </>
          ) : (
            <>
              <p className="text-slate-600 font-medium">No results</p>
              <p className="text-sm text-slate-400 mt-1">
                No students match "{searchQuery}"
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-medium text-slate-600">
                  Student
                </th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">
                  Contact
                </th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">
                  Type
                </th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">
                  Status
                </th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">
                  Band Score
                </th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">
                  Started
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => {
                const cfg =
                  attemptStatusConfig[row.attempt_status] ??
                  ({
                    label: row.attempt_status,
                    icon: <AlertCircle className="w-3.5 h-3.5" />,
                    className: "bg-slate-100 text-slate-600 border-slate-200",
                  } as (typeof attemptStatusConfig)[string]);

                return (
                  <tr
                    key={row.attempt_id}
                    className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${
                      idx % 2 === 0 ? "" : "bg-slate-50/50"
                    }`}
                  >
                    {/* Student name */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold text-xs shrink-0">
                          {(row.student.name ?? "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-md text-slate-900">
                            {row.student.name ?? "—"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-3">
                      <div className="space-y-0.5">
                        {row.student.email && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate text-xs max-w-[160px]">
                              {row.student.email}
                            </span>
                          </div>
                        )}
                        {row.student.phone && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />

                            <span className="truncate text-xs max-w-[160px]">
                              {row.student.phone}
                            </span>
                          </div>
                        )}
                        {!row.student.email && !row.student.phone && (
                          <span className="text-slate-400">—</span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${
                          row.student.enrollment_type === "regular"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-purple-50 text-purple-700 border-purple-200"
                        }`}
                      >
                        {row.student.enrollment_type === "regular"
                          ? "Regular"
                          : "Mock Only"}
                      </span>
                    </td>

                    {/* Attempt status */}
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.className}`}
                      >
                        {cfg.icon}
                        {cfg.label}
                      </span>
                    </td>

                    {/* Band score */}
                    <td className="px-5 py-3">
                      {row.overall_band_score != null ? (
                        <span className="font-semibold text-slate-900">
                          {row.overall_band_score}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Started at */}
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                      {formatDate(row.started_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
