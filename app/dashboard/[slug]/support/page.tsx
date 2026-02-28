"use client";

import { useState } from "react";
import {
  Mail,
  MessageSquare,
  Send,
  Phone,
  MessageCircleMore,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useCentre } from "@/context/CentreContext";
import { createSupportRequest } from "@/helpers/support";
import { parseError } from "@/lib/utils";

export default function SupportPage() {
  const { user, userProfile } = useAuth();
  const { currentCenter } = useCentre();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || "",
    subject: "",
    message: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate user and center
    if (!user || !currentCenter) {
      toast.error(
        "Please make sure you are logged in and have a center selected.",
      );
      return;
    }

    if (!userProfile?.full_name) {
      toast.error("User profile not found. Please try logging in again.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await createSupportRequest({
        user_id: user.id,
        user_name: userProfile.full_name,
        center_id: currentCenter.center_id,
        center_name: currentCenter.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      });

      if (result.success) {
        toast.success(
          "Message submitted successful. We'll get back to you soon.",
        );
        setFormData({
          email: user.email || "",
          subject: "",
          message: "",
        });
      } else {
        toast.error(result.error || "Failed to submit support message. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting support message:", error);
      toast.error(
        parseError(
          error,
          "Failed to send your message. Please check your connection and try again.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const whatsappLink =
    "https://wa.me/8801635931004?text=Hi%20SuperMock%20Support%20Team%2C%20I%20would%20like%20to%20get%20some%20help%20with%20";
  return (
    <div className="max-w-7xl mx-auto">
      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Half - Contact Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Send Us a Message
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Subject Input */}
            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Subject *
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
                  placeholder="How can we help?"
                />
              </div>
            </div>

            {/* Message Textarea */}
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                rows={6}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 resize-none"
                placeholder="Tell us about your issue or question..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
            >
              {isLoading ? (
                "Sending..."
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Half - WhatsApp Card */}
        <div className="space-y-6">
          {/* WhatsApp Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-bold text-slate-900">
                Chat on WhatsApp
              </h2>
            </div>

            <p className="text-slate-700 mb-6 leading-relaxed">
              For immediate assistance? Connect with our support team on
              WhatsApp.
            </p>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-xl transition-colors duration-200 shadow-md flex items-center justify-center gap-3 group"
            >
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Start WhatsApp Chat
            </a>

            <div className="mt-6 pt-6 border-t border-green-200">
              <p className="text-sm text-slate-600 mb-2">
                <strong className="text-slate-900">Available Hours:</strong>
              </p>
              <p className="text-sm text-slate-700">
                Sunday - Thursday: 9:00 AM - 6:00 PM
              </p>
              <p className="text-sm text-slate-700">
                Friday - Saturday: 10:00 AM - 4:00 PM
              </p>
              <p className="text-sm text-slate-500 mt-2">
                We typically respond within an hour during business days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
