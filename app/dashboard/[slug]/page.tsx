"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Users, FileText, TrendingUp, ArrowRight } from "lucide-react";

const stats = [
  {
    label: "Total Registered Students",
    value: "142",
    change: "+12% from last month",
    trend: "up",
    color: "bg-blue-100 text-blue-600",
  },
  {
    label: "Completed Tests",
    value: "1,284",
    change: "+18% from last month",
    trend: "up",
    color: "bg-green-100 text-green-600",
  },
  {
    label: "Test Papers",
    value: "47",
    change: "4 drafts pending",
    trend: "neutral",
    color: "bg-purple-100 text-purple-600",
  },
];

export default function DashboardPage() {
  const params = useParams();
  const slug = params.slug as string;

  return (
    <div className="max-w-7xl flex flex-col gap-8 mx-auto">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
        {stats.map((stat) => {
          return (
            <div
              key={stat.label}
              className="bg-white rounded-lg border border-slate-200 px-6 py-4 transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center justify-between w-full">
                  <p className="text-slate-500 text-lg mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {stat.value}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {stat.trend === "up" && (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                )}
                <p className="text-sm text-slate-600">{stat.change}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href={`/dashboard/${slug}/students`}
          className="bg-gray-100 rounded-lg p-6 text-slate-900 hover:shadow-lg transition-all duration-200 group shadow-md"
        >
          <div className="flex items-center gap-4">
            <Users className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Manage Students</h3>
          </div>

          <p className="text-blue-800 text-sm mb-8">
            View and manage all registered students
          </p>
          <div className="flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all">
            Go to Students <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        <Link
          href={`/dashboard/${slug}/tests`}
          className="bg-gray-100 rounded-lg p-6 text-slate-900 hover:shadow-lg transition-all duration-200 group shadow-md"
        >
          <div className="flex items-center gap-4">
            <FileText className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Manage Tests</h3>
          </div>

          <p className="text-blue-800 text-sm mb-8">
            Design new IELTS test papers and modules
          </p>
          <div className="flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all">
            Start Creating <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        <Link
          href={`/dashboard/${slug}/results`}
          className="bg-gray-100 rounded-lg p-6 text-slate-900 hover:shadow-lg transition-all duration-200 group shadow-md"
        >
          <div className="flex items-center gap-4">
            <TrendingUp className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold mb-2">View Results</h3>
          </div>

          <p className="text-blue-800 text-sm mb-8">
            Analyze student performance and scores
          </p>
          <div className="flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all">
            View Results <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>
    </div>
  );
}
