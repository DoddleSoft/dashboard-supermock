"use client";

import {
  Calendar,
  Clock,
  FileText,
  Headphones,
  BookOpen,
  PenTool,
} from "lucide-react";
import {
  formatTestDate,
  formatTestStatus,
  getTestStatusColor,
  type ScheduledTest,
} from "@/helpers/tests";

interface TestDetailsPanelProps {
  test: ScheduledTest;
}

export default function TestDetailsPanel({ test }: TestDetailsPanelProps) {
  const getModuleIcon = (moduleType: string) => {
    switch (moduleType) {
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

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{test.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${getTestStatusColor(test.status)}`}
              >
                {formatTestStatus(test.status)}
              </span>
              {test.paper && (
                <span className="text-xs text-slate-500">
                  {test.paper.paper_type}
                </span>
              )}
            </div>
          </div>
          <span className="text-xl font-mono text-slate-900 min-w-[120px] text-right">
            {test.otp ? `OTP: ${test.otp}` : "OTP: \u2014 \u2014 \u2014"}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        {test.paper && (
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <FileText className="w-4 h-4" />
            <div>Test Paper Title:</div>
            <span>{test.paper.title}</span>
          </div>
        )}

        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Clock className="w-4 h-4" />
          <div>Duration:</div>
          <span>{test.duration_minutes} minutes</span>
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Calendar className="w-4 h-4" />
          <div>Scheduled Date:</div>
          <span className="text-lg text-gray-900">
            {formatTestDate(test.scheduled_at)}
          </span>
        </div>
      </div>

      {/* Modules */}
      {test.modules && test.modules.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-medium text-slate-900 mb-3">
            {test.modules.length} Module
            {test.modules.length !== 1 ? "s" : ""}
          </h3>
          <div className="flex flex-col gap-2">
            {test.modules.map((mod) => (
              <div
                key={mod.id}
                className="inline-flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-sm"
                title={`${mod.module_type}: ${mod.heading}`}
              >
                {getModuleIcon(mod.module_type)}
                <span>{mod.heading}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Students */}
      {test.students && test.students.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-medium text-slate-900 mb-3">
            {test.students.length} Student
            {test.students.length !== 1 ? "s" : ""} Assigned
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {test.students.map((student) => (
              <div
                key={student.student_id}
                className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200"
              >
                <p className="font-medium">{student.name ?? "Unnamed"}</p>
                <p className="text-xs text-slate-500">
                  {student.email ?? "No email"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
