"use client";

import { UserPlus, Mail, CheckCircle } from "lucide-react";

export default function CreateStudentPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
            <UserPlus className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Create New Student
          </h1>
          <p className="text-slate-500 mt-2">
            Add a student and optionally start their first test
          </p>
        </div>

        <form className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                placeholder="First Name"
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Last Name"
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <input
              type="email"
              placeholder="Email Address"
              required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <input
              type="tel"
              placeholder="Phone Number (Optional)"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="font-semibold text-slate-900 mb-4">
              Onboarding Options
            </h3>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl hover:border-red-300 transition-colors cursor-pointer">
                <input
                  type="radio"
                  name="onboarding"
                  value="email"
                  defaultChecked
                  className="mt-1 w-4 h-4 text-red-600 border-slate-300 focus:ring-red-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-4 h-4 text-slate-600" />
                    <span className="font-medium text-slate-900">
                      Send Invitation Email
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    Student will receive login credentials via email
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl hover:border-red-300 transition-colors cursor-pointer">
                <input
                  type="radio"
                  name="onboarding"
                  value="immediate"
                  className="mt-1 w-4 h-4 text-red-600 border-slate-300 focus:ring-red-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-slate-600" />
                    <span className="font-medium text-slate-900">
                      Commence Test Immediately
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    Start a test session right after creation
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-sm shadow-red-100 transition-all duration-200"
            >
              Create Student
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
