"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Headphones,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import DOMPurify from "isomorphic-dompurify";
import { Loader } from "@/components/ui/Loader";
import { RenderBlockView, ThemeColor } from "@/components/ui/RenderBlock";
import { getRenderBlocks } from "@/lib/utils";

// --- Types ---
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
  title?: string;
  subtext?: string;
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
        {[...questions]
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
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!moduleId) return;
    const fetchModule = async () => {
      setLoading(true);
      setFetchError(null);
      const supabase = createClient();

      // Try the RPC first (works for center-owned modules)
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
        setLoading(false);
        return;
      }

      // RPC failed — check if this is a public module and fetch directly
      const { data: moduleRow } = await supabase
        .from("modules")
        .select("id, module_type, heading, subheading, view_option")
        .eq("id", moduleId)
        .eq("view_option", "public")
        .maybeSingle();

      if (!moduleRow) {
        const message =
          error?.code === "PGRST116"
            ? "Module not found or you do not have access."
            : error?.message || "Failed to load module data.";
        setFetchError(message);
        toast.error(message);
        setLoading(false);
        return;
      }

      // Fetch sections for the public module
      const { data: sections } = await supabase
        .from("sections")
        .select("*")
        .eq("module_id", moduleId)
        .order("section_index", { ascending: true });

      const sectionIds = (sections || []).map((s: any) => s.id);
      let subSections: any[] = [];
      if (sectionIds.length > 0) {
        const { data: subs } = await supabase
          .from("sub_sections")
          .select("*")
          .in("section_id", sectionIds)
          .order("sub_section_index", { ascending: true });
        subSections = subs || [];
      }

      const subSectionIds = subSections.map((s: any) => s.id);
      let questions: any[] = [];
      if (subSectionIds.length > 0) {
        const { data: qa } = await supabase
          .from("question_answers")
          .select("*")
          .in("sub_section_id", subSectionIds);
        questions = qa || [];
      }

      // Build the hierarchy
      const hierarchy: ModuleHierarchy = {
        id: moduleRow.id,
        module_type: moduleRow.module_type,
        heading: moduleRow.heading,
        subheading: moduleRow.subheading,
        sections: (sections || []).map((sec: any) => ({
          id: sec.id,
          section_title: sec.title,
          title: sec.title,
          subtext: sec.subtext,
          heading: sec.subtext,
          resource_url: sec.resource_url,
          content_text: sec.content_text,
          content_type: sec.content_type,
          instruction: sec.instruction,
          sub_sections: subSections
            .filter((sub: any) => sub.section_id === sec.id)
            .map((sub: any) => ({
              id: sub.id,
              sub_section_index: sub.sub_section_index,
              sub_section_title: sub.sub_section_title || sub.boundary_text,
              boundary_text: sub.boundary_text,
              instruction: sub.instruction,
              content_template: sub.content_template,
              questions: questions
                .filter((q: any) => q.sub_section_id === sub.id)
                .map((q: any) => ({
                  id: q.id,
                  question_number: 0,
                  question_ref: q.question_ref,
                  correct_answers: q.correct_answers,
                  options: q.options,
                  explanation: q.explanation,
                  question_type: q.question_type,
                })),
            })),
        })),
      };

      setData(hierarchy);
      if (hierarchy.sections.length > 0) {
        setSelectedSectionId(hierarchy.sections[0].id);
      }
      setLoading(false);
    };
    fetchModule();
  }, [moduleId]);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  if (!data)
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-10 h-10 text-slate-300" />
        <p className="text-slate-500">{fetchError || "Module not found"}</p>
        <button
          onClick={() => router.push(`/dashboard/${slug}/questions`)}
          className="text-sm text-blue-600 hover:underline"
        >
          Back to Questions
        </button>
      </div>
    );

  const currentSection = data.sections.find((s) => s.id === selectedSectionId);

  const getQuestionMap = (questions: Question[]) => {
    const map: Record<string, { answer: string; options?: any[] }> = {};
    questions.forEach((q) => {
      map[q.question_ref] = {
        answer: "",
        options: q.options || [],
      };
    });
    return map;
  };

  // Helper to construct dummy answers object if you want to show inputs working
  const getAnswersMap = (questions: Question[]) => {
    return {};
  };

  // --- Left Panel Content Renderer ---
  const renderLeftPanel = () => {
    if (!currentSection) return null;

    return (
      <div className="h-full overflow-y-auto p-6 bg-white border-r border-slate-200 scrollbar-thin scrollbar-thumb-slate-200">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            {/* Display title at the top for all modules */}
            {currentSection.title && (
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                {currentSection.title}
              </h2>
            )}

            {/* For reading: subtext is the heading of the passage */}
            {data.module_type === "reading" && currentSection.subtext && (
              <h3 className="text-lg font-semibold text-slate-700 mb-3">
                {currentSection.subtext}
              </h3>
            )}

            {currentSection.instruction && (
              <div className="mt-2 p-3 bg-purple-50 text-purple-900 text-xs rounded-lg border border-purple-100 italic">
                {currentSection.instruction}
              </div>
            )}
          </div>

          {/* Listening Audio Section */}
          {currentSection.resource_url && data.module_type === "listening" && (
            <div className="space-y-4">
              {/* Subtext as title for audio */}
              {currentSection.subtext && (
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">
                    {currentSection.subtext}
                  </h3>
                </div>
              )}
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
            </div>
          )}

          {/* Render Text Passage — sanitize HTML content to prevent XSS */}
          {(currentSection.content_text ||
            currentSection.content_type === "text") && (
            <div className="text-lg max-w-none text-slate-800">
              {currentSection.content_text ? (
                <div
                  className="text-md text-slate-900 mb-2 prose prose-slate"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(currentSection.content_text),
                  }}
                />
              ) : null}
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

          {/* For writing: subtext shown as professional cue card below content_text */}
          {data.module_type === "writing" && currentSection.subtext && (
            <div className="relative mt-6">
              <div className="bg-white rounded-lg p-5 shadow-sm border border-purple-100">
                <p className="text-slate-800 text-base leading-relaxed font-medium">
                  {currentSection.subtext}
                </p>
              </div>
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
                        <div className="mb-6 max-w-none text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100">
                          {getRenderBlocks(sub.content_template).map(
                            (block, i) => (
                              <RenderBlockView
                                key={i}
                                block={block}
                                theme={sectionTheme}
                                showQuestionNumbers={true}
                                questions={questionMap}
                                answers={answerMap}
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
          <div className="flex items-center gap-4">
            <h1 className="text-md font-bold text-slate-800">{data.heading}</h1>

            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Preview
            </span>
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
