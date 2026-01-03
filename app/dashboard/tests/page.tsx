"use client";

import { useState } from "react";
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
} from "lucide-react";

interface TestPaper {
  id: string;
  name: string;
  type: "Academic" | "General";
  modules: ("Listening" | "Reading" | "Writing")[];
  questionsCount: number;
  createdAt: Date;
  lastModified: Date;
  status: "Draft" | "Published";
}

const mockTestPapers: TestPaper[] = [
  {
    id: "1",
    name: "Academic Test Paper 01",
    type: "Academic",
    modules: ["Listening", "Reading", "Writing"],
    questionsCount: 40,
    createdAt: new Date("2025-12-15"),
    lastModified: new Date("2026-01-02"),
    status: "Published",
  },
  {
    id: "2",
    name: "Academic Test Paper 02",
    type: "Academic",
    modules: ["Reading", "Writing"],
    questionsCount: 50,
    createdAt: new Date("2025-12-20"),
    lastModified: new Date("2026-01-01"),
    status: "Published",
  },
  {
    id: "3",
    name: "General Test Paper 03",
    type: "General",
    modules: ["Listening", "Reading"],
    questionsCount: 35,
    createdAt: new Date("2026-01-01"),
    lastModified: new Date("2026-01-02"),
    status: "Draft",
  },
  {
    id: "4",
    name: "Academic Test Paper 04",
    type: "Academic",
    modules: ["Listening", "Writing"],
    questionsCount: 28,
    createdAt: new Date("2026-01-02"),
    lastModified: new Date("2026-01-03"),
    status: "Draft",
  },
];

export default function TestsPage() {
  const [papers, setPapers] = useState(mockTestPapers);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filteredPapers = papers.filter((paper) => {
    const matchesSearch = paper.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType =
      selectedType === "all" || paper.type.toLowerCase() === selectedType;
    return matchesSearch && matchesType;
  });

  const handleDelete = (paperId: string) => {
    setPapers(papers.filter((p) => p.id !== paperId));
    setOpenMenuId(null);
  };

  const getModuleIcon = (module: string) => {
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
      case "Published":
        return "bg-green-100 text-green-700 border-green-200";
      case "Draft":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

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
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-sm"
              />
            </div>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 bg-white text-sm font-medium"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowCreateMenu(!showCreateMenu)}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-sm shadow-red-100 transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Test Paper
            </button>

            {showCreateMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-xl z-10">
                <div className="p-2">
                  <Link
                    href="/dashboard/create/modules?type=listening"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors"
                    onClick={() => setShowCreateMenu(false)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                      <Headphones className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        Listening Module
                      </p>
                      <p className="text-xs text-slate-500">
                        Audio-based questions
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/create/modules?type=reading"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors"
                    onClick={() => setShowCreateMenu(false)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        Reading Module
                      </p>
                      <p className="text-xs text-slate-500">
                        Passage-based questions
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/create/modules?type=writing"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors"
                    onClick={() => setShowCreateMenu(false)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                      <PenTool className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        Writing Module
                      </p>
                      <p className="text-xs text-slate-500">
                        Prompt-based tasks
                      </p>
                    </div>
                  </Link>

                  <div className="border-t border-slate-200 mt-2 pt-2">
                    <Link
                      href="/dashboard/create/test"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 transition-colors"
                      onClick={() => setShowCreateMenu(false)}
                    >
                      <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          Complete Test Paper
                        </p>
                        <p className="text-xs text-slate-500">
                          Full IELTS test
                        </p>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-md border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Total Papers</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {papers.length}
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
                <p className="text-slate-500 text-sm">Published</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {
                    papers.filter((p) => p.status === "Published")
                      .length
                  }
                </p>
              </div>
              <div className="w-12 h-12 rounded-md bg-green-100 text-green-600 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-md border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Drafts</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {papers.filter((p) => p.status === "Draft").length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-md bg-amber-100 text-amber-600 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-md border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">Total Modules</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {papers.reduce((acc, p) => acc + p.questionsCount, 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Test Papers Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {filteredPapers.map((paper) => (
            <div
              key={paper.id}
              className="bg-white rounded-md border border-slate-200 hover:shadow-lg transition-all duration-200"
              onClick={() => setOpenMenuId(null)}
            >
              <div className="px-6 py-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-md font-semibold text-slate-900 mb-2">
                      {paper.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                          paper.status
                        )}`}
                      >
                        {paper.status}
                      </span>
                      <span className="text-xs text-slate-500">
                        {paper.type}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">
                      {paper.modules.length} module
                      {paper.modules.length !== 1 ? "s" : ""}
                    </span>
                    <div className="text-sm text-slate-600">
                      {paper.questionsCount} questions
                    </div>
                  </div>

                  <div className="text-xs text-slate-500">
                    Modified {formatDate(paper.lastModified)}
                  </div>

                  <div className="flex w-full justify-between">
                    <div className="flex gap-1">
                      {paper.modules.map((module) => (
                        <div
                          key={module}
                          className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center"
                          title={module}
                        >
                          {getModuleIcon(module)}
                        </div>
                      ))}
                    </div>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(
                            openMenuId === paper.id ? null : paper.id
                          );
                        }}
                        className="hover:bg-slate-100 rounded-lg transition-colors p-2"
                      >
                        <MoreVertical className="w-4 h-4 text-slate-600" />
                      </button>

                      {openMenuId === paper.id && (
                        <div
                          className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg border border-slate-200 shadow-lg z-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-t-lg transition-colors">
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(paper.id)}
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

        {filteredPapers.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500">No test papers found</p>
            <button
              onClick={() => setShowCreateMenu(true)}
              className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-sm shadow-red-100 transition-all duration-200"
            >
              Create Your First Test Paper
            </button>
          </div>
        )}
      </div>
    </>
  );
}
