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
  WritingSection,
  RenderBlock,
  useModuleContext,
  StoredModule,
} from "@/context/ModuleContext";
import RenderBlockView from "@/components/ui/RenderBlock";
import { Loader } from "@/components/ui/Loader";
import { createClient } from "@/lib/supabase/client";

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

/**
 * Convert a Supabase storage path to a public URL
 */
const getAudioUrl = (audioPath: string | null | undefined): string | null => {
  if (!audioPath || typeof audioPath !== "string") return null;

  // Trim whitespace
  const trimmed = audioPath.trim();
  if (!trimmed) return null;

  // If it's already a full URL, return as-is
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  // If it's a Supabase storage path, construct the public URL
  // Expected format: "bucket_name/path/to/file" or "path/to/file"
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  const path = `${supabaseUrl}/storage/v1/object/public/${trimmed}`;
  return path;
};

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

  const {
    moduleTitles,
    readingSections,
    listeningSections,
    writingSections,
    storedModules,
    isLoadingModules,
  } = useModuleContext();

  const moduleId = searchParams.get("moduleId");

  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const selectedStoredModule = useMemo<StoredModule | null>(() => {
    if (!moduleId) return null;
    return storedModules.find((m) => m.module_id === moduleId) || null;
  }, [moduleId, storedModules]);

  const effectiveType: ModuleType =
    (selectedStoredModule?.module_type as ModuleType | undefined) || type;

  const sections = useMemo(() => {
    if (selectedStoredModule) {
      return (selectedStoredModule.sections || []) as (
        | ReadingSection
        | ListeningSection
        | WritingSection
      )[];
    }
    if (effectiveType === "reading") return readingSections;
    if (effectiveType === "listening") return listeningSections;
    if (effectiveType === "writing") return writingSections;
    return [] as (ReadingSection | ListeningSection | WritingSection)[];
  }, [
    selectedStoredModule,
    effectiveType,
    readingSections,
    listeningSections,
    writingSections,
  ]);

  const previewTitle = useMemo(() => {
    if (selectedStoredModule?.title?.trim()) return selectedStoredModule.title;
    return getModuleTitle(effectiveType, moduleTitles);
  }, [selectedStoredModule, effectiveType, moduleTitles]);

  useEffect(() => {
    setSelectedId(sections[0]?.id ?? null);
  }, [effectiveType, sections]);

  useEffect(() => {
    setAnswers({});
  }, [selectedId, effectiveType]);

  const selectedSection = useMemo(
    () => sections.find((section) => section.id === selectedId) || null,
    [sections, selectedId],
  );

  useEffect(() => {
    if (effectiveType !== "listening") {
      setAudioUrl(null);
      return;
    }

    const section = selectedSection as ListeningSection | null;
    if (!section) {
      setAudioUrl(null);
      return;
    }

    // If it's a local audio file (from file input), use blob URL
    if (section.audioFile) {
      const url = URL.createObjectURL(section.audioFile);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    }

    // If it's a stored module with audioPath (from database)
    const audioPath =
      (section as any)?.audioPath || (section as any)?.resource_url;
    const url = getAudioUrl(audioPath);
    setAudioUrl(url);
  }, [selectedSection, effectiveType]);

  const handleBack = () => {
    router.push(`/dashboard/${slug}/create/modules?type=${type}`);
  };

  // Show error ONLY if module was explicitly not found after loading completed
  if (moduleId && !isLoadingModules && !selectedStoredModule) {
    return (
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center py-20">
        <BookOpen className="h-16 w-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Module Not Found
        </h2>
        <p className="text-sm text-slate-600 mb-6">
          The module you're looking for doesn't exist or has been deleted.
        </p>
        <button
          onClick={() => router.push(`/dashboard/${slug}/create/modules`)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Modules
        </button>
      </div>
    );
  }

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
            effectiveType === "writing"
              ? {}
              : (selectedSection as ReadingSection | ListeningSection)
                  .questions || {}
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
            {getTypeIcon(effectiveType)}
            {getTypeLabel(effectiveType)} Preview
          </span>
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold text-slate-900">{previewTitle}</h1>
          <p className="text-sm text-slate-500">Preview mode only</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        {/* Left: Sections */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
            {effectiveType === "writing" ? "Tasks" : "Sections"}
          </h2>

          <div className="space-y-2">
            {sections.map((section, index) => (
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
                  {effectiveType === "writing"
                    ? `Task ${index + 1}`
                    : `Section ${index + 1}`}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {effectiveType === "writing"
                    ? (section as WritingSection).heading || "Untitled"
                    : (section as ReadingSection | ListeningSection).title ||
                      "Untitled"}
                </p>
              </button>
            ))}

            {sections.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                No sections yet
              </div>
            )}
          </div>
        </div>

        {/* Right: Section Content */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6">
          {moduleId && isLoadingModules && !selectedStoredModule ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader subtitle="Loading module details..." />
            </div>
          ) : selectedSection ? (
            <>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-slate-900">
                  {effectiveType === "writing"
                    ? (selectedSection as WritingSection).heading || "Untitled"
                    : (selectedSection as ReadingSection | ListeningSection)
                        .title || "Untitled"}
                </h2>
                {effectiveType === "writing" &&
                  (selectedSection as WritingSection).subheading && (
                    <p className="text-sm text-slate-600">
                      {(selectedSection as WritingSection).subheading}
                    </p>
                  )}
                {effectiveType !== "writing" &&
                  (selectedSection as ReadingSection | ListeningSection)
                    .instruction && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      {
                        (selectedSection as ReadingSection | ListeningSection)
                          .instruction
                      }
                    </div>
                  )}
              </div>

              {/* For Reading/Listening sections, show special content */}
              {effectiveType === "reading" &&
                "passageText" in selectedSection && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Passage
                    </p>
                    <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {(selectedSection as ReadingSection).passageText ||
                        "No passage added"}
                    </div>
                  </div>
                )}

              {effectiveType === "listening" && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Audio
                  </p>
                  {audioUrl ? (
                    <audio
                      controls
                      className="w-full"
                      src={audioUrl}
                      key={audioUrl}
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <p className="text-sm text-slate-500">
                      {selectedStoredModule
                        ? "No audio attached to this section"
                        : "No audio attached"}
                    </p>
                  )}
                </div>
              )}

              {/* Render Blocks */}
              <div className="space-y-4">
                {selectedSection.renderBlocks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                    No blocks added yet
                  </div>
                ) : (
                  selectedSection.renderBlocks.map(renderBlock)
                )}
              </div>

              {/* Answer Key for Reading/Listening */}
              {effectiveType !== "writing" &&
                Object.keys(
                  (selectedSection as ReadingSection | ListeningSection)
                    .questions || {},
                ).length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                      Answer Key
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(
                        (selectedSection as ReadingSection | ListeningSection)
                          .questions,
                      )
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
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
              Select a {effectiveType === "writing" ? "task" : "section"} to
              preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
