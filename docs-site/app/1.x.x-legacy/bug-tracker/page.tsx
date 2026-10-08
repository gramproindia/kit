"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface BugReport {
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  category: string;
  steps_to_reproduce: string;
  expected_behavior: string;
  actual_behavior: string;
  browser_info: string;
  os_info: string;
}

interface UploadedImage {
  file: File;
  preview: string;
  id: string;
}

export default function BugReportPage() {
  const [formData, setFormData] = useState<BugReport>({
    title: "",
    description: "",
    severity: "medium",
    category: "",
    steps_to_reproduce: "",
    expected_behavior: "",
    actual_behavior: "",
    browser_info: "",
    os_info: "",
  });

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  // Auto-detect browser and OS info
  React.useEffect(() => {
    const browserInfo = `${navigator.userAgent}`;
    const osInfo = navigator.platform;

    setFormData((prev) => ({
      ...prev,
      browser_info: browserInfo,
      os_info: osInfo,
    }));
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          const newImage: UploadedImage = {
            file,
            preview: reader.result as string,
            id: Math.random().toString(36).substr(2, 9),
          };
          setImages((prev) => [...prev, newImage]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const uploadImageToSupabase = async (
    file: File,
    bugId: string
  ): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${bugId}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("bug-images")
        .upload(fileName, file);

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("bug-images").getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      // Insert bug report into Supabase
      const { data: bugData, error: bugError } = await supabase
        .from("bug_reports")
        .insert([
          {
            ...formData,
            created_at: new Date().toISOString(),
            status: "open",
          },
        ])
        .select()
        .single();

      if (bugError) throw bugError;

      const bugId = bugData.id;

      // Upload images if any
      const imageUrls: string[] = [];
      for (const image of images) {
        const url = await uploadImageToSupabase(image.file, bugId);
        if (url) imageUrls.push(url);
      }

      // Update bug report with image URLs
      if (imageUrls.length > 0) {
        const { error: updateError } = await supabase
          .from("bug_reports")
          .update({ image_urls: imageUrls })
          .eq("id", bugId);

        if (updateError) throw updateError;
      }

      setSubmitStatus("success");
      // Reset form
      setFormData({
        title: "",
        description: "",
        severity: "medium",
        category: "",
        steps_to_reproduce: "",
        expected_behavior: "",
        actual_behavior: "",
        browser_info: formData.browser_info,
        os_info: formData.os_info,
      });
      setImages([]);
    } catch (error) {
      console.error("Error submitting bug report:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const styles = {
      low: "bg-green-50 text-green-700 border-green-200",
      medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
      high: "bg-orange-50 text-orange-700 border-orange-200",
      critical: "bg-red-50 text-red-700 border-red-200",
    };
    return styles[severity as keyof typeof styles] || styles.medium;
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-lg shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {/* Info Icon */}
                <svg
                  className="h-5 w-5 text-blue-400 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-blue-700 font-medium">
                  Before submitting a new bug report, please{" "}
                  <Link
                    href="bug-tracker/bug-list"
                    className="font-semibold text-blue-800 hover:text-blue-900 underline hover:no-underline transition-all duration-200"
                  >
                    review existing bugs
                  </Link>{" "}
                  to avoid duplicates.
                </p>
              </div>
            </div>
          </div>
          <div className="text-left mb-12">
            <h1 className="text-xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text mb-4">
              Bug Report
            </h1>
            <p className="text-sm">
              Help us improve by reporting bugs you've encountered. Your
              detailed feedback makes our platform better for everyone.
            </p>
          </div>

          {/* Form Card */}
          <div className="overflow-hidden">
            <div className="">
              <div className="space-y-8">
                {/* Title */}
                <div className="group">
                  <label
                    htmlFor="title"
                    className="block text-sm font-semibold mb-3"
                  >
                    Bug Title <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="title"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 placeholder-gray-500"
                      placeholder="Brief description of the bug"
                    />
                  </div>
                </div>

                {/* Severity and Category */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="group">
                    <label
                      htmlFor="severity"
                      className="block text-sm font-semibold mb-3"
                    >
                      Severity <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="severity"
                        name="severity"
                        required
                        value={formData.severity}
                        onChange={handleInputChange}
                        className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer"
                      >
                        <option value="low">🟢 Low</option>
                        <option value="medium">🟡 Medium</option>
                        <option value="high">🟠 High</option>
                        <option value="critical">🔴 Critical</option>
                      </select>
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                    <div
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border mt-2 ${getSeverityBadge(
                        formData.severity
                      )}`}
                    >
                      {formData.severity.toUpperCase()} PRIORITY
                    </div>
                  </div>

                  <div className="group">
                    <label
                      htmlFor="category"
                      className="block text-sm font-semibold mb-3"
                    >
                      Category
                    </label>
                    <input
                      type="text"
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 placeholder-gray-500"
                      placeholder="e.g., UI, Performance, Authentication"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="group">
                  <label
                    htmlFor="description"
                    className="block text-sm font-semibold mb-3"
                  >
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    required
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 placeholder-gray-500 resize-none"
                    placeholder="Detailed description of the bug"
                  />
                </div>

                {/* Steps to Reproduce */}
                <div className="group">
                  <label
                    htmlFor="steps_to_reproduce"
                    className="block text-sm font-semibold mb-3"
                  >
                    Steps to Reproduce <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="steps_to_reproduce"
                    name="steps_to_reproduce"
                    required
                    rows={4}
                    value={formData.steps_to_reproduce}
                    onChange={handleInputChange}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 placeholder-gray-500 resize-none"
                    placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
                  />
                </div>

                {/* Expected vs Actual Behavior */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="group">
                    <label
                      htmlFor="expected_behavior"
                      className="block text-sm font-semibold mb-3"
                    >
                      Expected Behavior <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="expected_behavior"
                      name="expected_behavior"
                      required
                      rows={4}
                      value={formData.expected_behavior}
                      onChange={handleInputChange}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 placeholder-gray-500 resize-none"
                      placeholder="What should happen?"
                    />
                  </div>

                  <div className="group">
                    <label
                      htmlFor="actual_behavior"
                      className="block text-sm font-semibold mb-3"
                    >
                      Actual Behavior <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="actual_behavior"
                      name="actual_behavior"
                      required
                      rows={4}
                      value={formData.actual_behavior}
                      onChange={handleInputChange}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 placeholder-gray-500 resize-none"
                      placeholder="What actually happens?"
                    />
                  </div>
                </div>

                {/* System Information */}
                <div className="rounded-2xl p-6 border border-blue-100/50">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    System Information
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="browser_info"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Browser Information
                      </label>
                      <input
                        type="text"
                        id="browser_info"
                        name="browser_info"
                        value={formData.browser_info}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 text-gray-700 text-sm"
                        readOnly
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="os_info"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Operating System
                      </label>
                      <input
                        type="text"
                        id="os_info"
                        name="os_info"
                        value={formData.os_info}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 text-gray-700 placeholder-gray-500"
                        placeholder="e.g., Windows 11, macOS 12.0"
                      />
                    </div>
                  </div>
                </div>

                {/* Image Upload */}
                <div className="group">
                  <label className="block text-sm font-semibold mb-3">
                    Screenshots/Images
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-200 cursor-pointer group">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-600 font-medium">
                        Drop files here or click to browse
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </label>
                  </div>

                  {/* Image Previews */}
                  {images.length > 0 && (
                    <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {images.map((image) => (
                        <div key={image.id} className="relative group">
                          <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-200">
                            <img
                              src={image.preview}
                              alt="Bug screenshot"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(image.id)}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status Messages */}
                {submitStatus === "success" && (
                  <div className="bg-green-50 border-l-4 border-green-500 rounded-xl p-4 flex items-center">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <p className="text-green-800 font-medium">
                      Bug report submitted successfully! Our team will review it
                      shortly.
                    </p>
                  </div>
                )}

                {submitStatus === "error" && (
                  <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 flex items-center">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                    <p className="text-red-800 font-medium">
                      Error submitting bug report. Please try again or contact
                      support.
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    onClick={handleSubmit}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Submitting Report...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                        Submit Bug Report
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
