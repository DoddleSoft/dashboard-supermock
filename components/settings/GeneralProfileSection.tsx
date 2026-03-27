"use client";

import { useState, useRef } from "react";
import {
  Upload,
  Image as ImageIcon,
  Globe,
  Facebook,
  Instagram,
  Linkedin,
  MessageCircle,
  Save,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import LogoCropModal from "./LogoCropModal";
import type { Center } from "@/context/CentreContext";

interface GeneralProfileSectionProps {
  settings: Center;
  onSave: (updates: Partial<Center>) => Promise<void>;
}

export default function GeneralProfileSection({
  settings,
  onSave,
}: GeneralProfileSectionProps) {
  const [name, setName] = useState(settings.name ?? "");
  const [about, setAbout] = useState(settings.about ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(settings.website_url ?? "");
  const [facebookUrl, setFacebookUrl] = useState(settings.facebook_url ?? "");
  const [instagramUrl, setInstagramUrl] = useState(
    settings.instagram_url ?? "",
  );
  const [linkedinUrl, setLinkedinUrl] = useState(settings.linkedin_url ?? "");
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp ?? "");
  const [logoUrl, setLogoUrl] = useState(settings.logo_url ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setCropFile(file);
    } else {
      toast.error("Please upload an image file.");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCropFile(file);
    e.target.value = "";
  };

  const handleCrop = async (blob: Blob) => {
    setCropFile(null);
    setUploading(true);

    try {
      const supabase = createClient();
      const ext = "webp";
      const path = `${settings.center_id}/logo_${Date.now()}.${ext}`;

      // Delete old logo if exists
      if (logoUrl) {
        const oldPath = logoUrl.split("/center-logos/")[1];
        if (oldPath) {
          await supabase.storage.from("center-logos").remove([oldPath]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from("center-logos")
        .upload(path, blob, {
          contentType: "image/webp",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("center-logos").getPublicUrl(path);

      setLogoUrl(publicUrl);
      await onSave({ logo_url: publicUrl });
    } catch (err) {
      toast.error("Failed to upload logo.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!logoUrl) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const oldPath = logoUrl.split("/center-logos/")[1];
      if (oldPath) {
        await supabase.storage.from("center-logos").remove([oldPath]);
      }
      setLogoUrl("");
      await onSave({ logo_url: null });
    } catch {
      toast.error("Failed to remove logo.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Center name is required.");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        about: about.trim() || null,
        website_url: websiteUrl.trim() || null,
        facebook_url: facebookUrl.trim() || null,
        instagram_url: instagramUrl.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        whatsapp: whatsapp.trim() || null,
      });
      toast.success("Profile saved successfully!");
    } catch {
      toast.error("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Logo Upload */}
      <div>
        <label className="block text-md font-bold text-slate-700 mb-2">
          Center Logo
        </label>

        {/* Wide logo preview */}
        {/* 1. Added 'relative' to the parent container */}
        <div className="relative w-full max-w-md aspect-video rounded-xl overflow-hidden bg-slate-100 border-2 border-slate-200 flex items-center justify-center mb-3">
          {uploading ? (
            <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
          ) : logoUrl ? (
            // 2. Wrapped the image and button in a Fragment since they are adjacent
            <>
              <img
                src={logoUrl}
                alt="Center Logo"
                className="w-full h-full object-cover"
              />

              {/* 3. Added 'absolute top-3 right-3' and some overlay styling (bg-white/90, backdrop-blur) */}
              <button
                onClick={handleRemoveLogo}
                className="absolute top-3 right-3 px-3 py-2 text-xs text-red-600 hover:text-red-700 border border-red-200 rounded-lg bg-white/90 hover:bg-red-50 flex items-center gap-1 shadow-sm backdrop-blur-sm transition-all"
              >
                <Trash2 className="h-3 w-3" />
                Remove
              </button>
            </>
          ) : (
            <div className="text-center">
              <ImageIcon className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-400 mt-1">16:9 Logo Preview</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 max-w-md">
          {/* Compact drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 border-2 border-dashed rounded-lg px-4 py-2.5 text-center cursor-pointer transition-colors ${
              dragOver
                ? "border-red-400 bg-red-50"
                : "border-slate-300 hover:border-slate-400 bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Upload className="h-4 w-4 text-slate-400" />
              <p className="text-sm text-slate-600">
                Drop image or{" "}
                <span className="text-red-600 font-medium">browse</span>
              </p>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              PNG, JPG, WEBP up to 5 MB
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Center Name */}
      <div>
        <label className="block text-md font-bold text-slate-700 mb-1.5">
          Center Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your center name"
          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
        />
      </div>

      {/* About / Bio */}
      <div>
        <label className="block text-md font-bold text-slate-700 mb-1.5">
          About Us / Bio
        </label>
        <textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          placeholder="Describe your center's teaching methodology, history, or unique selling points..."
          rows={4}
          maxLength={1000}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none resize-none"
        />
        <p className="text-xs text-slate-400 mt-1">
          {about.length}/1000 characters
        </p>
      </div>

      {/* Social Media Links */}
      <div>
        <label className="block text-md font-bold text-slate-700 mb-3">
          Social Media Links
        </label>
        <div className="space-y-3">
          <div className="relative">
            <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://www.yourwebsite.com"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>
          <div className="relative">
            <Facebook className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="url"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="https://www.facebook.com/yourpage"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>
          <div className="relative">
            <Instagram className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="url"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://www.instagram.com/yourprofile"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>
          <div className="relative">
            <Linkedin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://www.linkedin.com/company/yourcompany"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>
          <div className="relative">
            <MessageCircle className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+1 (555) 000-0000 (WhatsApp)"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>
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
        Save Profile
      </button>

      {/* Crop Modal */}
      {cropFile && (
        <LogoCropModal
          file={cropFile}
          onCrop={handleCrop}
          onClose={() => setCropFile(null)}
        />
      )}
    </div>
  );
}
