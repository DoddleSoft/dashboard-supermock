"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  FileText,
  Calendar,
  RectangleEllipsis,
} from "lucide-react";
import { useCentre } from "@/context/CentreContext";
import {
  fetchScheduledTests,
  generateScheduledTestOtp,
  getTestStatusColor,
  formatTestDate,
  formatTestStatus,
  ScheduledTest,
} from "@/helpers/tests";
import { SmallLoader } from "@/components/ui/SmallLoader";

export default function TestsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { currentCenter } = useCentre();

  const [tests, setTests] = useState<ScheduledTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [otpLoadingId, setOtpLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (currentCenter?.center_id) {
      loadData();
    }
  }, [currentCenter?.center_id]);

  const loadData = async () => {
    if (!currentCenter?.center_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const testsData = await fetchScheduledTests(currentCenter.center_id);

    setTests(testsData);
    setLoading(false);
  };

  const filteredTests = tests.filter((test: ScheduledTest) => {
    const matchesSearch = test.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" || test.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleGenerateOtp = async (testId: string) => {
    const test = tests.find((t: ScheduledTest) => t.id === testId);
    if (!test || test.otp) return;

    setOtpLoadingId(testId);
    const result = await generateScheduledTestOtp(testId);
    setOtpLoadingId(null);

    if (result.success && result.otp) {
      setTests((prev: ScheduledTest[]) =>
        prev.map((t: ScheduledTest) =>
          t.id === testId ? { ...t, otp: result.otp! } : t,
        ),
      );
    }
  };

  const getStatusColor = getTestStatusColor;
  const formatDate = formatTestDate;
  const formatStatus = formatTestStatus;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <SmallLoader subtitle="Loading tests..." />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          {/* Filters */}
          <div className="flex items-center w-180 gap-2">
            <div className="flex-1 max-w-sm relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title..."
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
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/${slug}/create/test`}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium shadow-sm shadow-red-100 transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Schedule Test
            </Link>
          </div>
        </div>

        {/* Test Papers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTests.map((test: ScheduledTest) => (
            <div
              key={test.id}
              className="bg-white rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-200 cursor-pointer"
              onClick={() => {
                router.push(`/dashboard/${slug}/tests/${test.id}`);
              }}
            >
              <div className="px-6 py-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      {test.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(
                          test.status,
                        )}`}
                      >
                        {formatStatus(test.status)}
                      </span>
                      {test.paper && (
                        <span className="text-xs text-slate-500">
                          {test.paper.paper_type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {/* Paper info */}
                  {test.paper && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <FileText className="w-4 h-4" />
                      <span>{test.paper.title}</span>
                    </div>
                  )}

                  {/* Scheduled time */}
                  <div className="flex items-center gap-2 text-sm text-slate-900">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(test.scheduled_at)}</span>
                  </div>

                  <div className="flex w-full justify-between pt-2 items-center border-t border-slate-100">
                    <span className="text-lg text-slate-600 min-w-[90px]">
                      {test.otp ? `OTP: ${test.otp}` : "OTP: — — —"}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateOtp(test.id);
                        }}
                        disabled={!!test.otp || otpLoadingId === test.id}
                        className="hover:bg-slate-100 rounded-lg transition-colors p-2 disabled:opacity-60"
                        title={test.otp ? "OTP generated" : "Generate OTP"}
                      >
                        <RectangleEllipsis className="w-5 h-5 text-slate-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTests.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500 mb-1">No tests found</p>
            <p className="text-sm text-slate-400 mb-4">
              Schedule your first test to get started
            </p>
            <Link
              href={`/dashboard/${slug}/create/test`}
              className="inline-flex px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-sm shadow-red-100 transition-all duration-200"
            >
              Schedule Test
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
