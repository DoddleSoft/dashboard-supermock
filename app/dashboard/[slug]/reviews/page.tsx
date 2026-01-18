"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  Award,
  Clock,
} from "lucide-react";

interface TestResult {
  id: string;
  studentName: string;
  studentEmail: string;
  testPaper: string;
  module: string;
  score: number;
  band: number;
  completedAt: Date;
  duration: string;
  status: "Graded" | "Pending Review" | "In Progress";
}

const mockResults: TestResult[] = [
  {
    id: "1",
    studentName: "Jamil Ahmed",
    studentEmail: "jamilahmed23@gmail.com",
    testPaper: "Academic Test Paper 01",
    module: "Listening",
    score: 32,
    band: 7.5,
    completedAt: new Date("2026-01-02T14:30:00"),
    duration: "42 mins",
    status: "Graded",
  },
  {
    id: "2",
    studentName: "Sahara Begum Tuli",
    studentEmail: "saharabegum2li@gmail.com",
    testPaper: "General Test Paper 03",
    module: "Reading",
    score: 38,
    band: 8.0,
    completedAt: new Date("2026-01-02T10:15:00"),
    duration: "58 mins",
    status: "Graded",
  },
  {
    id: "3",
    studentName: "Md. Ashraf Chy",
    studentEmail: "mashrafchy65@gmail.com",
    testPaper: "Academic Test Paper 02",
    module: "Writing",
    score: 28,
    band: 6.5,
    completedAt: new Date("2026-01-01T16:45:00"),
    duration: "65 mins",
    status: "Pending Review",
  },
  {
    id: "4",
    studentName: "Ahmed Noor Jiban",
    studentEmail: "ahmednoor@gmail.com",
    testPaper: "Academic Test Paper 01",
    module: "Listening",
    score: 35,
    band: 8.0,
    completedAt: new Date("2026-01-01T11:20:00"),
    duration: "40 mins",
    status: "Graded",
  },
  {
    id: "5",
    studentName: "Dawood A Rahman",
    studentEmail: "dawoodrahman50@gmail.com",
    testPaper: "Academic Test Paper 04",
    module: "Reading",
    score: 0,
    band: 0,
    completedAt: new Date("2026-01-03T09:00:00"),
    duration: "In Progress",
    status: "In Progress",
  },
];

export default function ReviewPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const filteredResults = mockResults.filter((result) => {
    const matchesSearch =
      result.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.testPaper.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule =
      selectedModule === "all" ||
      result.module.toLowerCase() === selectedModule;
    const matchesStatus =
      selectedStatus === "all" ||
      result.status.toLowerCase().replace(" ", "-") === selectedStatus;
    return matchesSearch && matchesModule && matchesStatus;
  });

  const getBandColor = (band: number) => {
    if (band >= 8.0) return "text-green-600 bg-green-100";
    if (band >= 7.0) return "text-blue-600 bg-blue-100";
    if (band >= 6.0) return "text-amber-600 bg-amber-100";
    return "text-slate-600 bg-slate-100";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Graded":
        return "bg-green-100 text-green-700 border-green-200";
      case "Pending Review":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "In Progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Filters */}
      <div className="flex items-center gap-4">
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

        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-400" />
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 bg-white"
          >
            <option value="all">All Modules</option>
            <option value="listening">Listening</option>
            <option value="reading">Reading</option>
            <option value="writing">Writing</option>
            <option value="speaking">Speaking</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 bg-white"
          >
            <option value="all">All Status</option>
            <option value="graded">Graded</option>
            <option value="pending-review">Pending Review</option>
            <option value="in-progress">In Progress</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl border mt-6 border-slate-200 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Test Paper
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Module
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Band
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Completed
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredResults.map((result) => (
              <tr
                key={result.id}
                className="hover:bg-slate-50 transition-colors duration-150 text-sm"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-semibold text-sm">
                      {result.studentName.charAt(0)}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-slate-900">
                        {result.studentName}
                      </p>
                      <p className="text-sm text-slate-500">
                        {result.studentEmail}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-900">
                  {result.testPaper}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-slate-900 font-medium">
                    {result.module}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {result.status === "In Progress" ? (
                    <span className="text-slate-400">-</span>
                  ) : (
                    <span className="text-slate-900 font-semibold">
                      {result.score}/40
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {result.status === "In Progress" ? (
                    <span className="text-slate-400">-</span>
                  ) : (
                    <span
                      className={`inline-flex items-center justify-center w-12 h-8 rounded-lg font-bold text-sm ${getBandColor(
                        result.band,
                      )}`}
                    >
                      {result.band.toFixed(1)}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                  {result.duration}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                      result.status,
                    )}`}
                  >
                    {result.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-sm">
                  {formatDate(result.completedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredResults.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No reviews found</p>
          </div>
        )}
      </div>
    </div>
  );
}
