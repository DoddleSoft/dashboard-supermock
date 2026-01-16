"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Paper {
  id: string;
  title: string;
  type: "Reading" | "Writing" | "Listening" | "Speaking";
  sections: number;
  questions: number;
  createdAt: string;
  status: "Draft" | "Published";
}

export default function PapersPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Sample data
  const [papers, setPapers] = useState<Paper[]>([
    {
      id: "1",
      title: "Academic Reading Module - Cambridge Style",
      type: "Reading",
      sections: 3,
      questions: 40,
      createdAt: "2026-01-03",
      status: "Published",
    },
    {
      id: "2",
      title: "General Training Writing Module",
      type: "Writing",
      sections: 2,
      questions: 2,
      createdAt: "2026-01-02",
      status: "Draft",
    },
    {
      id: "3",
      title: "Listening Module - Academic Level",
      type: "Listening",
      sections: 4,
      questions: 40,
      createdAt: "2026-01-01",
      status: "Published",
    },
  ]);

  const handleDelete = (id: string) => {
    setPapers(papers.filter((paper) => paper.id !== id));
    setActiveMenu(null);
  };

  const filteredPapers = papers.filter((paper) => {
    const matchesSearch = paper.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || paper.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getModuleIcon = (type: string) => {
    switch (type) {
      case "Reading":
        return <BookOpen className="w-5 h-5" />;
      case "Writing":
        return <PenTool className="w-5 h-5" />;
      case "Listening":
        return <Headphones className="w-5 h-5" />;
      case "Speaking":
        return <Mic className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getModuleColor = (type: string) => {
    switch (type) {
      case "Reading":
        return "bg-blue-100 text-blue-600 border-blue-200";
      case "Writing":
        return "bg-green-100 text-green-600 border-green-200";
      case "Listening":
        return "bg-purple-100 text-purple-600 border-purple-200";
      case "Speaking":
        return "bg-orange-100 text-orange-600 border-orange-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center w-180 gap-3 flex-1">
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
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 bg-white"
          >
            <option value="all">All Modules</option>
            <option value="Reading">Reading</option>
            <option value="Writing">Writing</option>
            <option value="Listening">Listening</option>
            <option value="Speaking">Speaking</option>
          </select>
        </div>

        <Link href={`/dashboard/${slug}/create/modules?type=reading`}>
          <button className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-sm shadow-red-100 transition-all duration-200 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create New Paper
          </button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-500">Total Papers</p>
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{papers.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-500">Published</p>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {papers.filter((p) => p.status === "Published").length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-500">Drafts</p>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {papers.filter((p) => p.status === "Draft").length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-500">Total Modules</p>
            <Filter className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {papers.reduce((sum, p) => sum + p.questions, 0)}
          </p>
        </div>
      </div>

      {/* Papers Grid */}
      <div className="grid grid-cols-2 gap-2">
        {filteredPapers.map((paper) => (
          <div
            key={paper.id}
            className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div
                  className={`w-12 h-12 rounded-xl border ${getModuleColor(
                    paper.type
                  )} flex items-center justify-center`}
                >
                  {getModuleIcon(paper.type)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    {paper.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="font-medium text-slate-700">
                        {paper.sections}
                      </span>{" "}
                      Sections
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-medium text-slate-700">
                        {paper.questions}
                      </span>{" "}
                      Questions
                    </span>
                    <span
                      className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium ${
                        paper.status === "Published"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {paper.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="relative">
                <button
                  onClick={() =>
                    setActiveMenu(activeMenu === paper.id ? null : paper.id)
                  }
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-slate-400" />
                </button>

                {activeMenu === paper.id && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg z-10">
                    <button className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 rounded-t-xl">
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    <button className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                      <Edit className="w-4 h-4" />
                      Edit Paper
                    </button>
                    <button
                      onClick={() => handleDelete(paper.id)}
                      className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 rounded-b-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPapers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-2">No papers found</p>
          <p className="text-sm text-slate-400">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
}
