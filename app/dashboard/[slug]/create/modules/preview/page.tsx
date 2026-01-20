"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import {
  ArrowLeft,
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  FileText,
} from "lucide-react";
import {
  ListeningSection,
  ReadingSection,
  RenderBlock,
  useModuleContext,
} from "@/context/ModuleContext";
import RenderBlockView from "@/components/ui/RenderBlock";

type ModuleType = "reading" | "writing" | "listening" | "speaking";

const getTypeLabel = (type: ModuleType) =>
  type.charAt(0).toUpperCase() + type.slice(1);

const getTypeIcon = (type: ModuleType) => {
  switch (type) {
    case "reading":
      return <BookOpen className="h-4 w-4" />;
    case "writing":
      return <PenTool className="h-4 w-4" />;
    case "listening":
      return <Headphones className="h-4 w-4" />;
    case "speaking":
      return <Mic className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getModuleTitle = (
  type: ModuleType,
  titles: {
    reading: string;
    writing: string;
    listening: string;
    speaking: string;
  },
) => titles[type] || `${getTypeLabel(type)} Module`;

export default function PreviewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const queryType = (searchParams.get("type") || "reading") as ModuleType;
  const type: ModuleType = [
    "reading",
    "writing",
    "listening",
    "speaking",
  ].includes(queryType)
    ? queryType
    : "reading";

  const { moduleTitles, readingSections, listeningSections, writingTasks } =
    useModuleContext();

  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const sections = useMemo(() => {
    if (type === "reading") return readingSections;
    if (type === "listening") return listeningSections;
    return [] as ReadingSection[] | ListeningSection[];
  }, [type, readingSections, listeningSections]);

  const tasks = useMemo(
    () => (type === "writing" ? writingTasks : []),
    [type, writingTasks],
  );

  useEffect(() => {
    if (type === "writing") {
      setSelectedId(tasks[0]?.id ?? null);
      return;
    }

    setSelectedId(sections[0]?.id ?? null);
  }, [type, sections, tasks]);

  useEffect(() => {
    setAnswers({});
  }, [selectedId, type]);

  const selectedSection = useMemo(() => {
    if (type === "writing") return null;
    return sections.find((section) => section.id === selectedId) || null;
  }, [sections, selectedId, type]);

  const selectedTask = useMemo(() => {
    if (type !== "writing") return null;
    return tasks.find((task) => task.id === selectedId) || null;
  }, [tasks, selectedId, type]);

  useEffect(() => {
    if (type !== "listening") {
      setAudioUrl(null);
      return;
    }

    const section = selectedSection as ListeningSection | null;
    if (!section) {
      setAudioUrl(null);
      return;
    }

    if (section.audioFile) {
      const url = URL.createObjectURL(section.audioFile);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    }

    setAudioUrl(section.audioPath || null);
  }, [selectedSection, type]);

  const handleBack = () => {
    router.push(`/dashboard/${slug}/create/modules?type=${type}`);
  };

  const renderBlock = (block: RenderBlock, index: number) => {
    if (block.type === "editor") {
      return (
        <div
          key={`block-${index}`}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-700">
              {block.label || "Response"}
            </p>
            {block.min_words ? (
              <span className="text-xs text-slate-400">
                Minimum {block.min_words} words
              </span>
            ) : null}
          </div>
          <textarea
            disabled
            placeholder={block.placeholder || "Write your response here..."}
            className="h-28 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600"
          />
        </div>
      );
    }

    return (
      <div
        key={`block-${index}`}
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <RenderBlockView
          block={{ type: block.type, content: block.content || "" }}
          questions={
            type === "writing"
              ? {}
              : (selectedSection?.questions as Record<
                  string,
                  { answer: string; options?: string[] }
                >) || {}
          }
          answers={answers}
          onAnswerChange={(qNum: string, value: string) =>
            setAnswers((prev) => ({ ...prev, [qNum]: value }))
          }
        />
        {block.label && block.type !== "image" && (
          <p className="mt-3 text-sm text-slate-600">{block.label}</p>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to editor
          </button>
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            {getTypeIcon(type)}
            {getTypeLabel(type)} Preview
          </span>
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold text-slate-900">
            {getModuleTitle(type, moduleTitles)}
          </h1>
          <p className="text-sm text-slate-500">Preview mode only</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        {/* Left: Sections */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
            {type === "writing" ? "Tasks" : "Sections"}
          </h2>

          <div className="space-y-2">
            {type === "writing" &&
              tasks.map((task, index) => (
                <button
                  key={task.id}
                  onClick={() => setSelectedId(task.id)}
                  className={`w-full rounded-xl border px-3 py-3 text-left text-sm font-medium transition-colors ${
                    selectedId === task.id
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <p className="font-semibold">Task {index + 1}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {task.title || "Untitled task"}
                  </p>
                </button>
              ))}

            {type !== "writing" &&
              (sections as (ReadingSection | ListeningSection)[]).map(
                (section) => (
                  <button
                    key={section.id}
                    onClick={() => setSelectedId(section.id)}
                    className={`w-full rounded-xl border px-3 py-3 text-left text-sm font-medium transition-colors ${
                      selectedId === section.id
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <p className="font-semibold">
                      {section.title || "Untitled section"}
                    </p>
                    {"heading" in section && section.heading ? (
                      <p className="text-xs text-slate-500 truncate">
                        {section.heading}
                      </p>
                    ) : null}
                  </button>
                ),
              )}

            {type === "writing" && tasks.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                No tasks yet
              </div>
            )}

            {type !== "writing" && sections.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                No sections yet
              </div>
            )}
          </div>
        </div>

        {/* Right: Sub sections */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6">
          {type === "writing" && selectedTask && (
            <>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-slate-900">
                  {selectedTask.title || "Untitled task"}
                </h2>
                <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    Duration: {selectedTask.durationRecommendation} min
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    Minimum: {selectedTask.wordCountMin} words
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {selectedTask.renderBlocks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                    No blocks added yet
                  </div>
                ) : (
                  selectedTask.renderBlocks.map(renderBlock)
                )}
              </div>
            </>
          )}

          {type !== "writing" && selectedSection && (
            <>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-slate-900">
                  {selectedSection.title || "Untitled section"}
                </h2>
                {"heading" in selectedSection && selectedSection.heading ? (
                  <p className="text-sm text-slate-600">
                    {selectedSection.heading}
                  </p>
                ) : null}
                {selectedSection.instruction ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    {selectedSection.instruction}
                  </div>
                ) : null}
              </div>

              {type === "reading" && "passageText" in selectedSection && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Passage
                  </p>
                  <p className="text-sm text-slate-700 whitespace-pre-line">
                    {selectedSection.passageText || "No passage added"}
                  </p>
                </div>
              )}

              {type === "listening" && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Audio
                  </p>
                  {audioUrl ? (
                    <audio controls className="w-full" src={audioUrl} />
                  ) : (
                    <p className="text-sm text-slate-500">No audio attached</p>
                  )}
                </div>
              )}

              <div className="space-y-4">
                {selectedSection.renderBlocks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                    No blocks added yet
                  </div>
                ) : (
                  selectedSection.renderBlocks.map(renderBlock)
                )}
              </div>

              {Object.keys(selectedSection.questions || {}).length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    Answer Key
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(selectedSection.questions)
                      .sort((a, b) => Number(a) - Number(b))
                      .map((ref) => (
                        <span
                          key={ref}
                          className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                        >
                          Q{ref}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}

          {type !== "writing" && !selectedSection && (
            <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
              Select a section to preview
            </div>
          )}

          {type === "writing" && !selectedTask && (
            <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
              Select a task to preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
