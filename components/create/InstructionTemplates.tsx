"use client";

import { useState, useRef, useEffect } from "react";
import { Notebook, Check } from "lucide-react";
import { toast } from "sonner";

const TEMPLATES = [
  "You should spend about N minutes on Questions XX-XY based on Reading Passage X below.",
  "Choose NO MORE THAN TWO WORDS AND/OR A NUMBER from the passage for each answer.",
  "Select TRUE, FALSE, or NOT GIVEN based on the passage for the following questions.",
  "Choose the correct heading for paragraphs A-Z from the list of headings below.",
  "Choose the correct option for paragraphs A-Z for all the questions below.",
  "Complete the questions XX-YY below. You should spend about N minutes in this section.",
];

export default function InstructionTemplates() {
  const [open, setOpen] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleCopy = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        title="Common instruction templates"
      >
        <Notebook className="w-5 h-5 text-slate-700" />
      </button>

      {open && (
        <div
          ref={popupRef}
          className="absolute right-0 top-full mt-2 z-50 w-[420px] bg-white border border-slate-200 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-150 origin-top-right"
        >
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Common Instructions — click to copy
            </p>
          </div>
          <div className="p-2 max-h-72 overflow-y-auto space-y-1">
            {TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleCopy(tmpl, idx)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-700 hover:bg-slate-50 active:scale-[0.99] transition flex items-start gap-2.5"
              >
                <span className="flex-1 leading-relaxed">{tmpl}</span>
                {copiedIdx === idx && (
                  <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
