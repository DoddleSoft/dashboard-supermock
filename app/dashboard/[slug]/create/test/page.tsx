"use client";

import { useState } from "react";
import {
  FileText,
  Layers,
  Save,
  Eye,
  X,
  Headphones,
  BookOpen,
  PenTool,
} from "lucide-react";

export default function CreateTestPage() {
  const [testName, setTestName] = useState("Untitled Test Paper");
  const [testType, setTestType] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("");
  const [selectedModules, setSelectedModules] = useState({
    Listening: false,
    Reading: false,
    Writing: false,
    Speaking: false,
  });
  const [showPreview, setShowPreview] = useState(false);

  const handleModuleToggle = (module: keyof typeof selectedModules) => {
    setSelectedModules((prev) => ({
      ...prev,
      [module]: !prev[module],
    }));
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center">
        <div className="bg-white rounded-xl border border-slate-200 py-8 px-12 max-w-4xl mx-auto">
          <h1 className="text-xl font-bold text-slate-900 mb-4">
            Complete Test Paper
          </h1>
          <div className="mb-8">
            <input
              type="text"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="Test Paper Name (e.g., Academic Test Paper 05)"
              className="w-full px-6 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 text-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                className="w-full px-6 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 bg-white"
              >
                <option>Select Test Type</option>
                <option>Academic</option>
                <option>General Training</option>
              </select>
            </div>
            <div>
              <select
                value={difficultyLevel}
                onChange={(e) => setDifficultyLevel(e.target.value)}
                className="w-full px-6 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 bg-white"
              >
                <option>Select Difficulty Level</option>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Test Modules
            </h3>

            {["Listening", "Reading", "Writing", "Speaking"].map((module) => (
              <div
                key={module}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-red-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={
                      selectedModules[module as keyof typeof selectedModules]
                    }
                    onChange={() =>
                      handleModuleToggle(module as keyof typeof selectedModules)
                    }
                    className="w-5 h-5 text-red-600 border-slate-300 rounded focus:ring-red-500"
                  />
                  <span className="font-medium text-slate-900">{module}</span>
                </div>
                <button className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  Configure
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setShowPreview(true)}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Eye className="w-5 h-5" />
              Preview
            </button>
            <button className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-300 transition-all duration-200 flex items-center justify-center gap-2">
              <Save className="w-5 h-5" />
              Save as Draft
            </button>
            <button className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-sm shadow-red-100 transition-all duration-200 flex items-center justify-center gap-2">
              <FileText className="w-5 h-5" />
              Create Test
            </button>
          </div>
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              {/* Preview Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {testName}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {testType} • {difficultyLevel}
                  </p>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              {/* Preview Content */}
              <div className="p-6 space-y-8">
                {!Object.values(selectedModules).some(Boolean) ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500 mb-4">
                      No modules selected for preview
                    </p>
                    <p className="text-sm text-slate-400">
                      Select at least one module to preview the test
                    </p>
                  </div>
                ) : (
                  <>
                    {selectedModules.Listening && (
                      <div className="border-l-4 border-purple-500 pl-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Headphones className="w-5 h-5 text-purple-600" />
                          <h3 className="text-xl font-bold text-slate-900">
                            LISTENING
                          </h3>
                        </div>
                        <div className="space-y-4 text-slate-600">
                          <div className="bg-purple-50 rounded-xl p-4">
                            <p className="text-sm">
                              <strong>Duration:</strong> 30 minutes
                            </p>
                            <p className="text-sm mt-2">
                              <strong>Total Questions:</strong> 40
                            </p>
                            <p className="text-sm mt-2">
                              The listening test consists of 4 sections. You
                              will hear each section once. For each section,
                              there are 10 questions.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium text-slate-900">
                              Section 1 - Audio
                            </p>
                            <audio
                              controls
                              className="w-full"
                              src="about:blank"
                            />
                            <p className="text-sm">Questions 1-10</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedModules.Reading && (
                      <div className="border-l-4 border-blue-500 pl-6">
                        <div className="flex items-center gap-2 mb-4">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                          <h3 className="text-xl font-bold text-slate-900">
                            READING
                          </h3>
                        </div>
                        <div className="space-y-4 text-slate-600">
                          <div className="bg-blue-50 rounded-xl p-4">
                            <p className="text-sm">
                              <strong>Duration:</strong> 60 minutes
                            </p>
                            <p className="text-sm mt-2">
                              <strong>Total Questions:</strong> 40
                            </p>
                            <p className="text-sm mt-2">
                              The reading test consists of 3 passages. You have
                              60 minutes to complete the test.
                            </p>
                          </div>
                          <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className="border border-slate-200 rounded-lg p-4"
                              >
                                <p className="font-medium text-slate-900">
                                  Passage {i}
                                </p>
                                <p className="text-sm text-slate-500 mt-1">
                                  Questions {(i - 1) * 13 + 1}-{i * 13}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedModules.Writing && (
                      <div className="border-l-4 border-green-500 pl-6">
                        <div className="flex items-center gap-2 mb-4">
                          <PenTool className="w-5 h-5 text-green-600" />
                          <h3 className="text-xl font-bold text-slate-900">
                            WRITING
                          </h3>
                        </div>
                        <div className="space-y-4 text-slate-600">
                          <div className="bg-green-50 rounded-xl p-4">
                            <p className="text-sm">
                              <strong>Duration:</strong> 60 minutes
                            </p>
                            <p className="text-sm mt-2">
                              <strong>Number of Tasks:</strong> 2
                            </p>
                            <p className="text-sm mt-2">
                              The writing test consists of 2 tasks. Task 1
                              requires 150 words minimum, and Task 2 requires
                              250 words minimum.
                            </p>
                          </div>
                          <div className="space-y-3">
                            {[1, 2].map((i) => (
                              <div
                                key={i}
                                className="border border-slate-200 rounded-lg p-4"
                              >
                                <p className="font-medium text-slate-900">
                                  Task {i}
                                </p>
                                <p className="text-sm text-slate-500 mt-1">
                                  Minimum words: {i === 1 ? "150" : "250"}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedModules.Speaking && (
                      <div className="border-l-4 border-orange-500 pl-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Headphones className="w-5 h-5 text-orange-600" />
                          <h3 className="text-xl font-bold text-slate-900">
                            SPEAKING
                          </h3>
                        </div>
                        <div className="space-y-4 text-slate-600">
                          <div className="bg-orange-50 rounded-xl p-4">
                            <p className="text-sm">
                              <strong>Duration:</strong> 11-14 minutes
                            </p>
                            <p className="text-sm mt-2">
                              <strong>Number of Parts:</strong> 3
                            </p>
                            <p className="text-sm mt-2">
                              The speaking test is a one-to-one conversation
                              with an examiner.
                            </p>
                          </div>
                          <div className="space-y-3">
                            {[
                              {
                                part: 1,
                                time: "4-5 minutes",
                                desc: "Introduction and interview",
                              },
                              {
                                part: 2,
                                time: "3-4 minutes",
                                desc: "Long turn (candidate speaks)",
                              },
                              {
                                part: 3,
                                time: "4-5 minutes",
                                desc: "Discussion",
                              },
                            ].map((p) => (
                              <div
                                key={p.part}
                                className="border border-slate-200 rounded-lg p-4"
                              >
                                <p className="font-medium text-slate-900">
                                  Part {p.part}
                                </p>
                                <p className="text-sm text-slate-500 mt-1">
                                  {p.time} - {p.desc}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Preview Footer */}
              <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 flex gap-4">
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
                <button className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors">
                  Create Test Paper
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
