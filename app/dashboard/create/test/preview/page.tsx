"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Check,
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  ArrowRight,
} from "lucide-react";

interface Question {
  id: string;
  text: string;
  type: "fill-blank" | "mcq" | "true-false-not-given" | "yes-no-not-given";
  blankPosition?: "first" | "middle" | "end";
  mcqVariant?: "3-options-1-correct" | "5-options-2-correct";
  options?: string[];
  correctAnswers?: string[];
  answer?: string;
  explanation?: string;
}

interface Section {
  id: string;
  name: string;
  questions: Question[];
  paragraphContent?: string;
  audioFile?: File | null;
}

interface WritingTask {
  id: number;
  heading: string;
  preHeading: string;
  subHeading: string;
  contentType: "text" | "image";
  textContent: string;
  imageFile: File | null;
}

// Mock data - in production, this would come from state or props
const mockTestData = {
  testName: "Academic Reading & Writing Module",
  testType: "Academic",
  difficultyLevel: "Intermediate",
  modules: {
    listening: {
      enabled: true,
      sections: [
        {
          id: "1",
          name: "SECTION 1",
          questions: [
            {
              id: "1",
              text: "What is the main topic?",
              type: "mcq" as const,
              options: ["A", "B", "C"],
              answer: "A",
            },
          ],
          audioFile: null,
        },
      ],
    },
    reading: {
      enabled: true,
      sections: [
        {
          id: "1",
          name: "SECTION 1",
          questions: [
            {
              id: "1",
              text: "The _____ is the capital.",
              type: "fill-blank" as const,
              answer: "city",
            },
          ],
          paragraphContent:
            "The city is the capital of France. It is located in the north.",
        },
      ],
    },
    writing: {
      enabled: true,
      tasks: [
        {
          id: 1,
          heading: "Task 1",
          preHeading: "Writing Task 1",
          subHeading: "Describe a process",
          contentType: "text" as const,
          textContent: "You should spend about 20 minutes on this task.",
          imageFile: null,
        },
      ],
    },
    speaking: {
      enabled: true,
      parts: [
        {
          part: 1,
          duration: "4-5 minutes",
          description: "Introduction and interview",
        },
        {
          part: 2,
          duration: "3-4 minutes",
          description: "Long turn (candidate speaks)",
        },
        { part: 3, duration: "4-5 minutes", description: "Discussion" },
      ],
    },
  },
};

export default function TestPreviewPage() {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [currentModule, setCurrentModule] = useState<
    "listening" | "reading" | "writing" | "speaking" | "overview"
  >("overview");

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const modules = [
    {
      id: "listening",
      label: "Listening",
      icon: Headphones,
      color: "purple",
      enabled: mockTestData.modules.listening.enabled,
    },
    {
      id: "reading",
      label: "Reading",
      icon: BookOpen,
      color: "blue",
      enabled: mockTestData.modules.reading.enabled,
    },
    {
      id: "writing",
      label: "Writing",
      icon: PenTool,
      color: "green",
      enabled: mockTestData.modules.writing.enabled,
    },
    {
      id: "speaking",
      label: "Speaking",
      icon: Mic,
      color: "orange",
      enabled: mockTestData.modules.speaking.enabled,
    },
  ];

  const renderOverview = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          {mockTestData.testName}
        </h2>
        <div className="flex items-center gap-6 text-slate-600">
          <span>{mockTestData.testType}</span>
          <span>•</span>
          <span>{mockTestData.difficultyLevel}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {modules.map((module) => (
          <button
            key={module.id}
            onClick={() => setCurrentModule(module.id as any)}
            disabled={!module.enabled}
            className={`p-6 rounded-xl border-2 transition-all text-left ${
              module.enabled
                ? "border-slate-200 hover:border-red-300 hover:bg-slate-50 cursor-pointer"
                : "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <module.icon className="w-6 h-6" />
              {module.enabled && (
                <ArrowRight className="w-5 h-5 text-red-600" />
              )}
            </div>
            <h3 className="font-semibold text-slate-900">{module.label}</h3>
            <p className="text-sm text-slate-500 mt-1">
              {module.enabled ? "Ready to review" : "Not included"}
            </p>
          </button>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Test Summary</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Total Modules: {modules.filter((m) => m.enabled).length}</li>
          <li>• Estimated Duration: ~3 hours</li>
          <li>• Total Questions: ~120</li>
          <li>• Format: Complete IELTS Test</li>
        </ul>
      </div>
    </div>
  );

  const renderListeningModule = () => {
    const data = mockTestData.modules.listening;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Headphones className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-slate-900">
            LISTENING MODULE
          </h2>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-6">
          <p className="text-sm text-purple-900 font-medium">
            Duration: 30 minutes
          </p>
          <p className="text-sm text-purple-800 mt-2">Total Questions: 40</p>
          <p className="text-sm text-purple-800 mt-2">
            The listening test consists of 4 sections.
          </p>
        </div>

        <div className="space-y-4">
          {data.sections.map((section) => (
            <div
              key={section.id}
              className="border border-slate-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggleSection(`listening-${section.id}`)}
                className="w-full px-6 py-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
              >
                <h3 className="font-semibold text-slate-900">{section.name}</h3>
                {expandedSections.includes(`listening-${section.id}`) ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
              {expandedSections.includes(`listening-${section.id}`) && (
                <div className="p-6 space-y-4 border-t border-slate-200">
                  {section.audioFile && <audio controls className="w-full" />}
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-2">
                      Questions: 1-10
                    </p>
                    <p className="text-sm text-slate-600">
                      {section.questions.length} question
                      {section.questions.length !== 1 ? "s" : ""} in this
                      section
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderReadingModule = () => {
    const data = mockTestData.modules.reading;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-900">READING MODULE</h2>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <p className="text-sm text-blue-900 font-medium">
            Duration: 60 minutes
          </p>
          <p className="text-sm text-blue-800 mt-2">Total Questions: 40</p>
          <p className="text-sm text-blue-800 mt-2">
            The reading test consists of 3 passages with questions.
          </p>
        </div>

        <div className="space-y-4">
          {data.sections.map((section) => (
            <div
              key={section.id}
              className="border border-slate-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggleSection(`reading-${section.id}`)}
                className="w-full px-6 py-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
              >
                <h3 className="font-semibold text-slate-900">{section.name}</h3>
                {expandedSections.includes(`reading-${section.id}`) ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
              {expandedSections.includes(`reading-${section.id}`) && (
                <div className="p-6 space-y-4 border-t border-slate-200">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">
                      Passage Text:
                    </p>
                    <div className="bg-white p-4 rounded-lg border border-slate-200 max-h-48 overflow-y-auto">
                      <p className="text-sm text-slate-600 whitespace-pre-wrap">
                        {section.paragraphContent}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">
                      Questions: {section.questions.length}/13
                    </p>
                    <div className="space-y-2">
                      {section.questions.slice(0, 3).map((q) => (
                        <div
                          key={q.id}
                          className="text-xs text-slate-500 p-2 bg-slate-50 rounded"
                        >
                          Q: {q.text}
                        </div>
                      ))}
                      {section.questions.length > 3 && (
                        <p className="text-xs text-slate-400">
                          +{section.questions.length - 3} more questions
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWritingModule = () => {
    const data = mockTestData.modules.writing;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <PenTool className="w-6 h-6 text-green-600" />
          <h2 className="text-2xl font-bold text-slate-900">WRITING MODULE</h2>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
          <p className="text-sm text-green-900 font-medium">
            Duration: 60 minutes
          </p>
          <p className="text-sm text-green-800 mt-2">Number of Tasks: 2</p>
          <p className="text-sm text-green-800 mt-2">
            Task 1: 150 words minimum | Task 2: 250 words minimum
          </p>
        </div>

        <div className="space-y-4">
          {data.tasks.map((task) => (
            <div
              key={task.id}
              className="border border-slate-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggleSection(`writing-${task.id}`)}
                className="w-full px-6 py-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
              >
                <h3 className="font-semibold text-slate-900">Task {task.id}</h3>
                {expandedSections.includes(`writing-${task.id}`) ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
              {expandedSections.includes(`writing-${task.id}`) && (
                <div className="p-6 space-y-4 border-t border-slate-200">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-medium mb-2">
                      Pre-heading
                    </p>
                    <p className="text-sm text-slate-700">{task.preHeading}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-medium mb-2">
                      Heading
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      {task.heading}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-medium mb-2">
                      Sub-heading
                    </p>
                    <p className="text-sm text-slate-700">{task.subHeading}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-medium mb-2">
                      Task Description
                    </p>
                    {task.contentType === "text" ? (
                      <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <p className="text-sm text-slate-600">
                          {task.textContent}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-slate-100 rounded-lg p-8 text-center">
                        <p className="text-sm text-slate-500">
                          Image:{" "}
                          {task.imageFile
                            ? (task.imageFile as any).name
                            : "Not uploaded"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSpeakingModule = () => {
    const data = mockTestData.modules.speaking;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Mic className="w-6 h-6 text-orange-600" />
          <h2 className="text-2xl font-bold text-slate-900">SPEAKING MODULE</h2>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-6">
          <p className="text-sm text-orange-900 font-medium">
            Duration: 11-14 minutes
          </p>
          <p className="text-sm text-orange-800 mt-2">Number of Parts: 3</p>
          <p className="text-sm text-orange-800 mt-2">
            One-to-one conversation with an examiner
          </p>
        </div>

        <div className="space-y-4">
          {data.parts.map((part) => (
            <div
              key={part.part}
              className="border border-slate-200 rounded-xl p-6 bg-white hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-slate-900">
                  Part {part.part}
                </h3>
                <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
                  {part.duration}
                </span>
              </div>
              <p className="text-sm text-slate-600">{part.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Test Paper Preview
        </h1>
        <p className="text-slate-500">
          Review your test configuration before creating
        </p>
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8 sticky top-8 z-20">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setCurrentModule("overview")}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              currentModule === "overview"
                ? "bg-red-600 text-white"
                : "border border-slate-200 text-slate-600 hover:border-red-300"
            }`}
          >
            Overview
          </button>
          {modules.map(
            (module) =>
              module.enabled && (
                <button
                  key={module.id}
                  onClick={() => setCurrentModule(module.id as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                    currentModule === module.id
                      ? `bg-${module.color}-600 text-white`
                      : "border border-slate-200 text-slate-600 hover:border-red-300"
                  }`}
                >
                  <module.icon className="w-4 h-4" />
                  {module.label}
                </button>
              )
          )}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 mb-8">
        {currentModule === "overview" && renderOverview()}
        {currentModule === "listening" && renderListeningModule()}
        {currentModule === "reading" && renderReadingModule()}
        {currentModule === "writing" && renderWritingModule()}
        {currentModule === "speaking" && renderSpeakingModule()}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => window.history.back()}
          className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
        >
          Edit Test
        </button>
        <button className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
          <Download className="w-5 h-5" />
          Export as PDF
        </button>
        <button className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-sm shadow-red-100 transition-colors flex items-center justify-center gap-2">
          <Check className="w-5 h-5" />
          Create Test Paper
        </button>
      </div>
    </div>
  );
}
