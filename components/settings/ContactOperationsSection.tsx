"use client";

import { useState } from "react";
import {
  Phone,
  MapPin,
  Clock,
  Save,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
import GoogleMapPicker from "./GoogleMapPicker";
import type { Center } from "@/context/CentreContext";

interface ContactOperationsSectionProps {
  settings: Center;
  onSave: (updates: Partial<Center>) => Promise<void>;
}

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const DAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

interface DaySchedule {
  open: string;
  close: string;
  closed: boolean;
}

type OperatingHours = Record<string, DaySchedule>;

const DEFAULT_HOURS: OperatingHours = Object.fromEntries(
  DAYS.map((d) => [
    d,
    d === "sunday"
      ? { open: "", close: "", closed: true }
      : { open: "09:00", close: "17:00", closed: false },
  ]),
);

const DEFAULT_FORMATS = {
  academic: false,
  general_training: false,
  computer_delivered: false,
  paper_based: false,
};

const FORMAT_LABELS: Record<string, string> = {
  academic: "Academic",
  general_training: "General Training",
  computer_delivered: "Computer-Delivered",
  paper_based: "Paper-Based",
};

export default function ContactOperationsSection({
  settings,
  onSave,
}: ContactOperationsSectionProps) {
  const [phone, setPhone] = useState(settings.phone ?? "");
  const [address, setAddress] = useState(settings.address ?? "");
  const [latitude, setLatitude] = useState<number | null>(
    settings.latitude ?? null,
  );
  const [longitude, setLongitude] = useState<number | null>(
    settings.longitude ?? null,
  );
  const [hours, setHours] = useState<OperatingHours>(() => {
    const saved = settings.operating_hours as OperatingHours | null;
    if (saved && Object.keys(saved).length > 0) return saved;
    return DEFAULT_HOURS;
  });
  const [formats, setFormats] = useState<Record<string, boolean>>(() => {
    const saved = settings.supported_test_formats as Record<
      string,
      boolean
    > | null;
    if (saved && Object.keys(saved).length > 0)
      return { ...DEFAULT_FORMATS, ...saved };
    return DEFAULT_FORMATS;
  });
  const [saving, setSaving] = useState(false);

  const updateDaySchedule = (
    day: string,
    field: keyof DaySchedule,
    value: any,
  ) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleLocationChange = (lat: number, lng: number, addr: string) => {
    setLatitude(lat);
    setLongitude(lng);
    setAddress(addr);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        phone: phone.trim() || null,
        address: address.trim() || null,
        latitude,
        longitude,
        operating_hours: hours,
        supported_test_formats: formats,
      });
      toast.success("Contact & operations saved!");
    } catch {
      toast.error("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Contact Details */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
          Contact Details
        </h4>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Physical Address
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, City, Country"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Location Pin */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
          Location Pin
        </h4>
        <GoogleMapPicker
          latitude={latitude}
          longitude={longitude}
          address={address}
          onLocationChange={handleLocationChange}
        />
      </div>

      {/* Operating Hours */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wide flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Operating Hours
        </h4>
        <div className="space-y-2">
          {DAYS.map((day) => {
            const schedule = hours[day] ?? {
              open: "",
              close: "",
              closed: true,
            };
            return (
              <div
                key={day}
                className="flex items-center gap-3 bg-slate-50 rounded-lg px-4 py-2.5"
              >
                <span className="w-28 text-sm font-medium text-slate-700">
                  {DAY_LABELS[day]}
                </span>

                <button
                  onClick={() =>
                    updateDaySchedule(day, "closed", !schedule.closed)
                  }
                  className="flex-shrink-0"
                  title={schedule.closed ? "Mark as open" : "Mark as closed"}
                >
                  {schedule.closed ? (
                    <ToggleLeft className="h-6 w-6 text-slate-400" />
                  ) : (
                    <ToggleRight className="h-6 w-6 text-green-500" />
                  )}
                </button>

                {schedule.closed ? (
                  <span className="text-sm text-slate-400 italic">Closed</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={schedule.open}
                      onChange={(e) =>
                        updateDaySchedule(day, "open", e.target.value)
                      }
                      className="px-2 py-1 border border-slate-300 rounded text-sm text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                    <span className="text-slate-400 text-sm">to</span>
                    <input
                      type="time"
                      value={schedule.close}
                      onChange={(e) =>
                        updateDaySchedule(day, "close", e.target.value)
                      }
                      className="px-2 py-1 border border-slate-300 rounded text-sm text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Supported Test Formats */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
          Supported Test Formats
        </h4>
        <p className="text-xs text-slate-500">
          Toggle the formats your center offers to help students filter centers.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(FORMAT_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() =>
                setFormats((prev) => ({ ...prev, [key]: !prev[key] }))
              }
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-colors ${
                formats[key]
                  ? "border-red-500 bg-red-50 text-red-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {formats[key] ? (
                <ToggleRight className="h-5 w-5 text-red-500 flex-shrink-0" />
              ) : (
                <ToggleLeft className="h-5 w-5 text-slate-400 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2 disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Save Contact & Operations
      </button>
    </div>
  );
}
