"use client";

import { PlayCircle, FileText, ExternalLink } from "lucide-react";

const TUTORIALS = [
{
    title: "Introducing SuperMock",
    description: "Your all-in-one customizable platform for IELTS coaching centers with automated grading.",
    videoId: "F04eO0IuBv0", // Real video from SuperMock channel
  },
];

export default function HelpResourcesSection() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          Help & Resources
        </h3>
        <p className="text-sm text-slate-500">
          Tutorials and legal information to help you get the most out of
          SuperMock.
        </p>
      </div>

      {/* Tutorials */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-red-600" />
          <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
            Tutorials
          </h4>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {TUTORIALS.map((tutorial, idx) => (
            <div
              key={idx}
              className="border border-slate-200 rounded-xl overflow-hidden bg-white"
            >
              <div className="aspect-video bg-slate-900 relative">
                <iframe
                  src={`https://www.youtube.com/embed/${tutorial.videoId}`}
                  title={tutorial.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
              <div className="p-4">
                <h5 className="text-sm font-semibold text-slate-900">
                  {tutorial.title}
                </h5>
                <p className="text-xs text-slate-500 mt-1">
                  {tutorial.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-red-600" />
          <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
            Terms & Conditions
          </h4>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
          <div>
            <h5 className="text-sm font-semibold text-slate-900 mb-2">
              1. Acceptance of Terms
            </h5>
            <p className="text-sm text-slate-600 leading-relaxed">
              By accessing and using the SuperMock platform, you agree to be
              bound by these Terms and Conditions. If you do not agree to these
              terms, please do not use the platform. SuperMock reserves the
              right to modify these terms at any time.
            </p>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-slate-900 mb-2">
              2. Use of Services
            </h5>
            <p className="text-sm text-slate-600 leading-relaxed">
              The platform is provided for the purpose of administering IELTS
              mock tests. Centers are responsible for ensuring all test content
              uploaded complies with applicable copyright and intellectual
              property laws. Unauthorized reproduction of copyrighted test
              materials is strictly prohibited.
            </p>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-slate-900 mb-2">
              3. Data Privacy & Security
            </h5>
            <p className="text-sm text-slate-600 leading-relaxed">
              SuperMock is committed to protecting user data. All student and
              center information is stored securely and processed in accordance
              with our Privacy Policy. We do not sell or share personal
              information with third parties without explicit consent.
            </p>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-slate-900 mb-2">
              4. Limitation of Liability
            </h5>
            <p className="text-sm text-slate-600 leading-relaxed">
              SuperMock provides the platform &quot;as is&quot; and does not
              guarantee uninterrupted service. We are not liable for any direct,
              indirect, or consequential damages arising from the use or
              inability to use the platform, including loss of data or revenue.
            </p>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-slate-900 mb-2">
              5. Account Termination
            </h5>
            <p className="text-sm text-slate-600 leading-relaxed">
              SuperMock reserves the right to suspend or terminate accounts that
              violate these terms, engage in fraudulent activity, or misuse the
              platform. Affected users will be notified prior to any action when
              possible.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-200">
            <p className="text-xs text-slate-400">
              Last updated: March 2026 &bull; Version 1.0
            </p>
            <div className="flex gap-4 mt-2">
              <a
                href="#"
                className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                Full Terms & Conditions
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="#"
                className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                Privacy Policy
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
