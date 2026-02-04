"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  FileText,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Loader } from "@/components/ui/Loader";
import { RenderBlockView, ThemeColor } from "@/components/ui/RenderBlock";

// --- Types ---
type ModuleType = "reading" | "writing" | "listening" | "speaking";

interface Question {
  id: string;
  question_number: number;
  question_ref: string;
  correct_answers: any;
  options: any;
  explanation?: string;
  question_type?: string;
}

interface SubSection {
  id: string;
  sub_section_index: number;
  sub_section_title?: string;
  boundary_text?: string;
  instruction?: string;
  content_template?: any;
  questions: Question[];
}

interface Section {
  id: string;
  section_title: string;
  heading?: string;
  resource_url?: string;
  content_text?: string;
  content_type?: string;
  instruction?: string;
  sub_sections: SubSection[];
}

interface ModuleHierarchy {
  id: string;
  module_type: string;
  heading: string;
  subheading?: string;
  sections: Section[];
}

// --- Helpers ---
const getAudioUrl = (path: string | undefined) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("blob:")) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${path}`;
};

const getRenderBlocks = (content: any): any[] => {
  if (!content) return [];
  if (Array.isArray(content)) return content;
  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // If it's raw text, wrap it in a text block so RenderBlock can process it
      return [{ type: "text", content }];
    }
  }
  return content.blocks || [];
};

// --- Sub-Components ---

const ModuleIcon = ({ type }: { type: string }) => {
  switch (type as ModuleType) {
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

const ConsolidatedAnswerKey = ({ questions }: { questions: Question[] }) => {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="mt-12 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          Answer Key & Explanations
        </h3>
      </div>
      <div className="divide-y divide-slate-100">
        {questions
          .sort((a, b) => parseInt(a.question_ref) - parseInt(b.question_ref))
          .map((q) => {
            let answerDisplay = "";
            try {
              if (typeof q.correct_answers === "string")
                answerDisplay = q.correct_answers;
              else if (q.correct_answers?.answer)
                answerDisplay = q.correct_answers.answer;
              else answerDisplay = JSON.stringify(q.correct_answers);
            } catch (e) {
              answerDisplay = "See Logic";
            }

            return (
              <div
                key={q.id}
                className="p-4 flex gap-4 hover:bg-slate-50 transition-colors"
              >
                <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-slate-100 text-slate-600 font-bold rounded-full text-xs">
                  {q.question_ref}
                </div>
                <div className="flex-1 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-700">
                      Correct Answer:
                    </span>
                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded font-mono font-bold">
                      {answerDisplay}
                    </span>
                  </div>
                  {q.explanation && (
                    <div className="text-slate-500 mt-1 flex gap-2 items-start">
                      <Info className="w-3.5 h-3.5 mt-0.5 text-blue-400 flex-shrink-0" />
                      <span className="leading-relaxed">{q.explanation}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default function PreviewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const moduleId = searchParams.get("moduleId");
  const slug = params.slug as string;

  const [data, setData] = useState<ModuleHierarchy | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!moduleId) return;
    const fetchModule = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: rpcData, error } = await supabase.rpc(
        "get_module_hierarchy",
        {
          target_module_id: moduleId,
        },
      );

      if (!error && rpcData) {
        const hierarchy = rpcData as ModuleHierarchy;
        setData(hierarchy);
        if (hierarchy.sections.length > 0) {
          setSelectedSectionId(hierarchy.sections[0].id);
        }
      }
      setLoading(false);
    };
    fetchModule();
  }, [moduleId]);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader subtitle="Loading Preview..." />
      </div>
    );
  if (!data)
    return (
      <div className="h-screen flex items-center justify-center">
        Module not found
      </div>
    );

  const currentSection = data.sections.find((s) => s.id === selectedSectionId);

  // Helper to map questions for RenderBlock
  // RenderBlock expects questions indexed by their ref string (e.g. "1", "2")
  const getQuestionMap = (questions: Question[]) => {
    const map: Record<string, { answer: string; options?: any[] }> = {};
    questions.forEach((q) => {
      map[q.question_ref] = {
        answer: "", // In preview we don't pre-fill answers usually, or fill with correct one if desired
        options: q.options || [],
      };
    });
    return map;
  };

  // Helper to construct dummy answers object if you want to show inputs working
  const getAnswersMap = (questions: Question[]) => {
    // Returns empty answers so inputs are empty initially
    return {};
  };

  const handleDummyChange = (qNum: string, val: string) => {
    // No-op for preview mode, or you could add local state to make them interactive
    console.log(`Question ${qNum} changed to ${val}`);
  };

  // --- Left Panel Content Renderer ---
  const renderLeftPanel = () => {
    if (!currentSection) return null;

    // Determine theme based on module type
    const theme: ThemeColor =
      data.module_type === "writing" ? "purple" : "green";

    return (
      <div className="h-full overflow-y-auto p-6 bg-white border-r border-slate-200 scrollbar-thin scrollbar-thumb-slate-200">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {currentSection.section_title ||
                currentSection.heading ||
                "Section"}
            </h2>
            {currentSection.instruction && (
              <div className="mt-2 p-3 bg-purple-50 text-purple-900 text-sm rounded-lg border border-purple-100 italic">
                {currentSection.instruction}
              </div>
            )}
          </div>

          {currentSection.resource_url && data.module_type === "listening" && (
            <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <Headphones className="w-6 h-6 text-blue-600" />
              </div>
              <div className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-medium mb-4">
                Audio Player
              </div>
              <audio
                controls
                className="w-full max-w-sm"
                src={getAudioUrl(currentSection.resource_url)}
              />
            </div>
          )}

          {currentSection.resource_url && data.module_type !== "listening" && (
            <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              <img
                src={getAudioUrl(currentSection.resource_url)}
                alt="Resource"
                className="w-full h-auto object-contain bg-slate-50"
              />
            </div>
          )}

          {/* Render Text Passage using RenderBlock if it's structured, or raw HTML if text */}
          {(currentSection.content_text ||
            currentSection.content_type === "text") && (
            <div className="prose prose-sm max-w-none text-slate-800">
              {currentSection.content_text ? (
                // Use RenderBlock for the passage text to ensure consistent styling
                <RenderBlockView
                  block={{ type: "text", content: currentSection.content_text }}
                  theme={theme}
                />
              ) : null}
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- Right Panel Content Renderer ---
  const renderRightPanel = () => {
    if (!currentSection)
      return (
        <div className="p-8 text-center text-slate-400">Select a section</div>
      );

    // WRITING MODULE
    if (data.module_type === "writing") {
      return (
        <div className="h-full p-6 bg-slate-50 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
          <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
              Student Response Area
            </h3>
            <textarea
              disabled
              className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-lg resize-none text-slate-500 text-sm"
              placeholder="Student types answer here..."
            ></textarea>
            <div className="mt-4 flex justify-between text-xs text-slate-400">
              <span>Words: 0</span>
              <span>Minimum required: 150</span>
            </div>
          </div>
        </div>
      );
    }

    // STANDARD CASE (Reading/Listening)
    const allQuestions = currentSection.sub_sections.flatMap(
      (sub) => sub.questions || [],
    );

    // Choose theme: 'blue' for listening, 'green' for reading usually, adjusting based on your preference
    const sectionTheme: ThemeColor =
      data.module_type === "listening" ? "blue" : "green";

    return (
      <div className="h-full overflow-y-auto bg-slate-50 p-6 scrollbar-thin scrollbar-thumb-slate-200">
        <div className="max-w-2xl mx-auto pb-10">
          {/* 1. RENDER SUBSECTIONS */}
          <div className="space-y-8">
            {currentSection.sub_sections.length > 0 ? (
              currentSection.sub_sections.map((sub, idx) => {
                // Prepare maps for this specific subsection
                const questionMap = getQuestionMap(sub.questions || []);
                const answerMap = getAnswersMap(sub.questions || []);

                return (
                  <div
                    key={sub.id}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                  >
                    <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-slate-700 text-sm">
                        {sub.boundary_text ||
                          sub.sub_section_title ||
                          `Questions Part ${idx + 1}`}
                      </h3>
                      {sub.questions && (
                        <span className="text-xs text-slate-400">
                          {sub.questions.length} Questions
                        </span>
                      )}
                    </div>

                    <div className="p-6">
                      {sub.instruction && (
                        // Using RenderBlock for instruction ensures style consistency
                        <RenderBlockView
                          block={{
                            type: "instruction",
                            content: sub.instruction,
                          }}
                          theme={sectionTheme}
                        />
                      )}

                      {/* Content Template (The text with {{X}mcq} placeholders) */}
                      {sub.content_template && (
                        <div className="mb-6 prose prose-sm max-w-none text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100">
                          {getRenderBlocks(sub.content_template).map(
                            (block, i) => (
                              <RenderBlockView
                                key={i}
                                block={block}
                                theme={sectionTheme}
                                showQuestionNumbers={true}
                                questions={questionMap}
                                answers={answerMap}
                                onAnswerChange={handleDummyChange}
                              />
                            ),
                          )}
                        </div>
                      )}

                      {/* Fallback Question List: If questions exist but NO content_template used {{}} */}
                      {/* This handles cases where questions are just listed without a parent text block */}
                      {!sub.content_template &&
                        sub.questions &&
                        sub.questions.length > 0 && (
                          <div className="space-y-4">
                            {sub.questions.map((q) => (
                              // Use a simple text block for questions not embedded in text
                              // Or reuse RenderBlock if you construct a block for them
                              <div
                                key={q.id}
                                className="bg-slate-50 p-3 rounded border border-slate-100"
                              >
                                <span className="font-bold text-xs mr-2">
                                  {q.question_ref}.
                                </span>
                                <span className="text-sm">
                                  {q.options
                                    ? "Select Option (MCQ/TrueFalse)"
                                    : "Fill in blank"}
                                </span>
                                {/* You might want a simpler display here since RenderBlock handles the 'rendering' */}
                              </div>
                            ))}
                          </div>
                        )}

                      {!sub.content_template &&
                        (!sub.questions || sub.questions.length === 0) && (
                          <div className="text-center py-4 text-slate-400 text-sm italic">
                            No interactive content found.
                          </div>
                        )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10">
                <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">
                  No content found for this section.
                </p>
              </div>
            )}
          </div>

          {/* 2. CONSOLIDATED ANSWER KEY */}
          {allQuestions.length > 0 && (
            <ConsolidatedAnswerKey questions={allQuestions} />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden font-sans">
      {/* --- HEADER --- */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/dashboard/${slug}/questions`)}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="bg-slate-900 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <ModuleIcon type={data.module_type} /> {data.module_type}
              </span>
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                Preview Mode
              </span>
            </div>
            <h1 className="text-sm font-bold text-slate-800">{data.heading}</h1>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg">
          {data.sections.map((sec, idx) => (
            <button
              key={sec.id}
              onClick={() => setSelectedSectionId(sec.id)}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                selectedSectionId === sec.id
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {sec.section_title || `Section ${idx + 1}`}
            </button>
          ))}
        </div>
      </header>

      {/* --- MAIN SPLIT VIEW --- */}
      <main className="flex-1 flex overflow-hidden">
        <div className="w-1/2 h-full overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 z-10 opacity-50"></div>
          {renderLeftPanel()}
        </div>

        <div className="w-1/2 h-full overflow-hidden border-l border-slate-200 bg-slate-50 relative">
          {renderRightPanel()}
        </div>
      </main>
    </div>
  );
}
