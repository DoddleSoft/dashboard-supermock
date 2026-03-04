"use client";

import { useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import ReadingModule from "../../../../../components/create/ReadingModule";
import WritingModule from "../../../../../components/create/WritingModule";
import ListeningModule from "../../../../../components/create/ListeningModule";
import { useModuleContext } from "../../../../../context/ModuleContext";
import { Loader2 } from "lucide-react";
import { SmallLoader } from "../../../../../components/ui/SmallLoader";

function CreateModuleContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const type = searchParams.get("type") || "reading";
  const typeKey = ["reading", "writing", "listening", "speaking"].includes(type)
    ? (type as "reading" | "writing" | "listening" | "speaking")
    : "reading";

  // Get context methods and data
  const {
    writingSections,
    writingExpandedSections,
    isSaving,
    addWritingSection,
    deleteWritingSection,
    toggleWritingSection,
    updateWritingSectionHeading,
    updateWritingSectionSubheading,
    updateWritingSectionInstruction,
    updateWritingSectionTime,
    updateWritingSectionMinWords,
    addWritingRenderBlock,
    updateWritingRenderBlock,
    deleteWritingRenderBlock,
    saveModule,

    clearSaveError,
  } = useModuleContext();

  const {
    listeningSections,
    listeningExpandedSections,
    addListeningSection,
    deleteListeningSection,
    updateListeningSectionTitle,
    updateListeningSectionInstruction,
    updateListeningSectionAudioPath,
    updateListeningSectionAudio,
    addListeningRenderBlock,
    updateListeningRenderBlock,
    deleteListeningRenderBlock,
    updateListeningQuestion,
    deleteListeningQuestion,
    toggleListeningSection,
  } = useModuleContext();

  const {
    moduleTitles,
    readingSections,
    readingExpandedSections,
    setModuleTitle,
    addReadingSection,
    deleteReadingSection,
    updateReadingSectionTitle,
    updateReadingSectionHeading,
    updateReadingSectionInstruction,
    updateReadingSectionPassageText,
    addReadingRenderBlock,
    updateReadingRenderBlock,
    deleteReadingRenderBlock,
    updateReadingQuestion,
    deleteReadingQuestion,
    toggleReadingSection,
  } = useModuleContext();

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const handleTabChange = (moduleType: string) => {
    router.push(`/dashboard/${slug}/create/modules?type=${moduleType}`);
  };

  const renderModuleTabs = () => (
    <div className="flex items-center gap-6 mb-4 border-b border-slate-200">
      <button
        onClick={() => handleTabChange("reading")}
        className={`pb-2 px-3 text-sm font-medium transition-colors rounded-t-lg ${
          type === "reading"
            ? "text-red-600 border-b-2 border-red-600"
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
        }`}
      >
        READING
      </button>
      <button
        onClick={() => handleTabChange("writing")}
        className={`pb-2 px-3 text-sm font-medium transition-colors rounded-t-lg ${
          type === "writing"
            ? "text-red-600 border-b-2 border-red-600"
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
        }`}
      >
        WRITING
      </button>
      <button
        onClick={() => handleTabChange("listening")}
        className={`pb-2 px-3 text-sm font-medium transition-colors rounded-t-lg ${
          type === "listening"
            ? "text-red-600 border-b-2 border-red-600"
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
        }`}
      >
        LISTENING
      </button>
      <button
        onClick={() => handleTabChange("speaking")}
        className={`pb-2 px-3 text-sm font-medium transition-colors rounded-t-lg ${
          type === "speaking"
            ? "text-red-600 border-b-2 border-red-600"
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
        }`}
      >
        SPEAKING
      </button>
    </div>
  );

  const renderModule = () => {
    switch (type) {
      case "reading":
        return (
          <ReadingModule
            sections={readingSections}
            expandedSections={readingExpandedSections}
            onToggleSection={toggleReadingSection}
            onAddSection={addReadingSection}
            onDeleteSection={deleteReadingSection}
            onDeleteQuestion={deleteReadingQuestion}
            onUpdateQuestion={updateReadingQuestion}
            onUpdateSectionTitle={updateReadingSectionTitle}
            onUpdateSectionHeading={updateReadingSectionHeading}
            onUpdateSectionInstruction={updateReadingSectionInstruction}
            onUpdateSectionPassage={updateReadingSectionPassageText}
            onAddRenderBlock={(sectionId) =>
              addReadingRenderBlock(sectionId, { type: "text", content: "" })
            }
            onUpdateRenderBlock={updateReadingRenderBlock}
            onDeleteRenderBlock={deleteReadingRenderBlock}
          />
        );
      case "writing":
        return (
          <WritingModule
            sections={writingSections}
            expandedSections={writingExpandedSections}
            onToggleSection={toggleWritingSection}
            onAddSection={addWritingSection}
            onDeleteSection={deleteWritingSection}
            onUpdateSectionHeading={updateWritingSectionHeading}
            onUpdateSectionSubheading={updateWritingSectionSubheading}
            onUpdateSectionInstruction={updateWritingSectionInstruction}
            onUpdateSectionTime={updateWritingSectionTime}
            onUpdateSectionMinWords={updateWritingSectionMinWords}
            onAddRenderBlock={(sectionId) =>
              addWritingRenderBlock(sectionId, { type: "text", content: "" })
            }
            onUpdateRenderBlock={updateWritingRenderBlock}
            onDeleteRenderBlock={deleteWritingRenderBlock}
          />
        );
      case "listening":
        return (
          <ListeningModule
            sections={listeningSections}
            expandedSections={listeningExpandedSections}
            onToggleSection={toggleListeningSection}
            onAddSection={addListeningSection}
            onDeleteSection={deleteListeningSection}
            onDeleteQuestion={deleteListeningQuestion}
            onUpdateQuestion={updateListeningQuestion}
            onUpdateSectionTitle={updateListeningSectionTitle}
            onUpdateSectionInstruction={updateListeningSectionInstruction}
            onUpdateSectionAudioPath={updateListeningSectionAudioPath}
            onUpdateSectionAudio={updateListeningSectionAudio}
            onAddRenderBlock={(sectionId) =>
              addListeningRenderBlock(sectionId, { type: "text", content: "" })
            }
            onUpdateRenderBlock={updateListeningRenderBlock}
            onDeleteRenderBlock={deleteListeningRenderBlock}
          />
        );
      case "speaking":
        return (
          <div className="text-center py-12">
            <p className="text-slate-500">
              Speaking module creator coming soon...
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  const handlePreview = () => {
    router.push(`/dashboard/${slug}/create/modules/preview?type=${type}`);
  };

  const handleCreateModule = async () => {
    // Prevent double submission
    if (isSaving) return;

    const currentModuleTitle = moduleTitles[typeKey];

    if (!currentModuleTitle.trim()) {
      setToastMessage("Please enter a module title");
      setToastType("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    clearSaveError();

    const result = await saveModule(typeKey, currentModuleTitle);

    if (result.success) {
      setToastMessage(
        `${typeKey.charAt(0).toUpperCase() + typeKey.slice(1)} module created successfully!`,
      );

      setTimeout(() => setShowToast(false), 3000);

      // Clear the module title after successful creation
      setModuleTitle(typeKey, "");
    } else {
      setToastMessage(
        "Failed to create module. Please check your content and try again.",
      );
      setToastType("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Toast Notification */}
        {showToast && (
          <div
            className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg transition-all duration-300 ${
              toastType === "success"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            <div className="flex items-center gap-3">
              {toastType === "success" ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span className="font-medium">{toastMessage}</span>
              <button
                onClick={() => setShowToast(false)}
                className="ml-2 text-current hover:opacity-70"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Paper Title */}
        <div className="mb-6 flex bg-gray-200 pl-4 rounded-lg items-center gap-4">
          <div className="w-12 text-lg font-semibold text-slate-500 tracking-wide">
            Title:
          </div>
          <input
            type="text"
            value={moduleTitles[typeKey]}
            onChange={(e) => setModuleTitle(typeKey, e.target.value)}
            className="text-lg px-4 py-2 my-1 font-bold text-slate-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-lg w-full placeholder:text-slate-400"
            placeholder={`Enter title for the ${typeKey} module...`}
          />
        </div>

        {renderModuleTabs()}

        {renderModule()}

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
          <button
            onClick={handlePreview}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors"
          >
            Preview
          </button>
          <button
            onClick={handleCreateModule}
            disabled={isSaving || type === "speaking"}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white rounded-xl font-medium shadow-sm shadow-red-100 transition-colors flex items-center gap-2"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSaving
              ? "Creating..."
              : `Create ${typeKey.charAt(0).toUpperCase() + typeKey.slice(1)} Module`}
          </button>
        </div>
      </div>
    </>
  );
}

export default function CreateModulePage() {
  return (
    <Suspense fallback={<SmallLoader subtitle="Loading module editor..." />}>
      <CreateModuleContent />
    </Suspense>
  );
}
