"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";

interface BugReport {
  id: number;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  category?: string;
  steps_to_reproduce: string;
  expected_behavior: string;
  actual_behavior: string;
  browser_info?: string;
  os_info?: string;
  image_urls?: string[];
  status: "open" | "in_progress" | "resolved" | "closed";
  created_at: string;
  updated_at: string;
  user_id?: string;
  assigned_to?: string;
}

type FilterOptions = {
  status: string;
  severity: string;
  category: string;
  search: string;
};

type SortOption = "newest" | "oldest" | "severity" | "status" | "title";

export default function BugListPage() {
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [filteredBugs, setFilteredBugs] = useState<BugReport[]>([]);
  const [selectedBug, setSelectedBug] = useState<BugReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and sort states
  const [filters, setFilters] = useState<FilterOptions>({
    status: "all",
    severity: "all",
    category: "all",
    search: "",
  });
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch bugs from Supabase
  useEffect(() => {
    fetchBugs();
  }, []);

  // Apply filters and sorting when bugs or filters change
  useEffect(() => {
    applyFiltersAndSort();
  }, [bugs, filters, sortBy]);

  const fetchBugs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("bug_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBugs(data || []);
    } catch (err) {
      setError("Failed to fetch bug reports");
      console.error("Error fetching bugs:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...bugs];

    // Apply filters
    if (filters.status !== "all") {
      filtered = filtered.filter((bug) => bug.status === filters.status);
    }
    if (filters.severity !== "all") {
      filtered = filtered.filter((bug) => bug.severity === filters.severity);
    }
    if (filters.category !== "all") {
      filtered = filtered.filter((bug) =>
        bug.category?.toLowerCase().includes(filters.category.toLowerCase())
      );
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (bug) =>
          bug.title.toLowerCase().includes(searchLower) ||
          bug.description.toLowerCase().includes(searchLower) ||
          bug.category?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "newest":
        filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
      case "severity":
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        filtered.sort(
          (a, b) => severityOrder[b.severity] - severityOrder[a.severity]
        );
        break;
      case "status":
        filtered.sort((a, b) => a.status.localeCompare(b.status));
        break;
      case "title":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    setFilteredBugs(filtered);
  };

  const updateBugStatus = async (
    bugId: number,
    newStatus: BugReport["status"]
  ) => {
    try {
      const { error } = await supabase
        .from("bug_reports")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", bugId);

      if (error) throw error;

      // Update local state
      setBugs((prev) =>
        prev.map((bug) =>
          bug.id === bugId ? { ...bug, status: newStatus } : bug
        )
      );

      if (selectedBug && selectedBug.id === bugId) {
        setSelectedBug((prev) =>
          prev ? { ...prev, status: newStatus } : null
        );
      }
    } catch (err) {
      console.error("Error updating bug status:", err);
      alert("Failed to update bug status");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "in_progress":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200";
      case "closed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getUniqueCategories = () => {
    const categories = bugs
      .map((bug) => bug.category)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);
    return categories as string[];
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
          <div className="text-zinc-500 text-sm mt-2">
            Sometimes this error may occur due to the inactivity of DB to save
            computational cost,
            <br /> please contact R&D for resolve this issue
          </div>
          <button
            onClick={fetchBugs}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bug Reports</h1>
          <p className="text-gray-600 mt-1">
            {filteredBugs.length} of {bugs.length} bug reports
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link href="/bug-tracker">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Report New Bug
            </button>
          </Link>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                placeholder="Search bugs..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity
              </label>
              <select
                value={filters.severity}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, severity: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, category: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Categories</option>
                {getUniqueCategories().map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="severity">Severity</option>
                <option value="status">Status</option>
                <option value="title">Title A-Z</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bug List */}
        <div className="space-y-4 max-h-screen overflow-y-auto">
          {filteredBugs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No bug reports found</p>
              {filters.search ||
              filters.status !== "all" ||
              filters.severity !== "all" ? (
                <button
                  onClick={() =>
                    setFilters({
                      status: "all",
                      severity: "all",
                      category: "all",
                      search: "",
                    })
                  }
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          ) : (
            filteredBugs.map((bug) => (
              <div
                key={bug.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                  selectedBug?.id === bug.id
                    ? "ring-2 ring-blue-500 border-blue-500"
                    : "border-gray-200"
                }`}
                onClick={() => setSelectedBug(bug)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold line-clamp-1">{bug.title}</h3>
                  <span className="text-sm text-gray-500">#{bug.id}</span>
                </div>

                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {bug.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-3">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded border ${getSeverityColor(
                      bug.severity
                    )}`}
                  >
                    {bug.severity}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(
                      bug.status
                    )}`}
                  >
                    {bug.status.replace("_", " ")}
                  </span>
                  {bug.category && (
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded border border-gray-200">
                      {bug.category}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Created: {formatDate(bug.created_at)}</span>
                  {bug.image_urls && bug.image_urls.length > 0 && (
                    <span className="flex items-center">
                      📷 {bug.image_urls.length}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bug Details */}
        <div className="lg:sticky lg:top-6">
          {selectedBug ? (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {selectedBug.title}
                  </h2>
                  <p className="text-gray-500">Bug #{selectedBug.id}</p>
                </div>
                <button
                  onClick={() => setSelectedBug(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  ✕
                </button>
              </div>

              {/* Status and Severity */}
              <div className="flex gap-2 mb-4">
                <span
                  className={`px-3 py-1 text-sm font-medium rounded border ${getSeverityColor(
                    selectedBug.severity
                  )}`}
                >
                  {selectedBug.severity}
                </span>
                <select
                  value={selectedBug.status}
                  onChange={(e) =>
                    updateBugStatus(
                      selectedBug.id,
                      e.target.value as BugReport["status"]
                    )
                  }
                  className={`px-3 py-1 text-sm font-medium rounded border cursor-pointer ${getStatusColor(
                    selectedBug.status
                  )}`}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                {selectedBug.category && (
                  <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded border border-gray-200">
                    {selectedBug.category}
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {/* Description */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    Description
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedBug.description}
                  </p>
                </div>

                {/* Steps to Reproduce */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    Steps to Reproduce
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedBug.steps_to_reproduce}
                  </p>
                </div>

                {/* Expected vs Actual */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">
                      Expected Behavior
                    </h3>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">
                      {selectedBug.expected_behavior}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">
                      Actual Behavior
                    </h3>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">
                      {selectedBug.actual_behavior}
                    </p>
                  </div>
                </div>

                {/* System Info */}
                {(selectedBug.browser_info || selectedBug.os_info) && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">
                      System Information
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      {selectedBug.os_info && (
                        <p>
                          <strong>OS:</strong> {selectedBug.os_info}
                        </p>
                      )}
                      {selectedBug.browser_info && (
                        <p>
                          <strong>Browser:</strong>{" "}
                          {selectedBug.browser_info
                            .split(" ")
                            .slice(0, 5)
                            .join(" ")}
                          ...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Images */}
                {selectedBug.image_urls &&
                  selectedBug.image_urls.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">
                        Screenshots
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedBug.image_urls.map((url, index) => (
                          <div key={index} className="relative">
                            <Image
                              src={url}
                              alt={`Bug screenshot ${index + 1}`}
                              width={200}
                              height={150}
                              className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80"
                              onClick={() => window.open(url, "_blank")}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Timestamps */}
                <div className="text-sm text-gray-500 pt-4 border-t">
                  <p>Created: {formatDate(selectedBug.created_at)}</p>
                  <p>Updated: {formatDate(selectedBug.updated_at)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 text-center">
              <p className="text-gray-500">
                Select a bug report to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
