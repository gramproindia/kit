// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for TypeScript
export interface BugReport {
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

// Database helper functions
export const bugReportService = {
  // Create a new bug report
  async create(
    bugReport: Omit<BugReport, "id" | "created_at" | "updated_at" | "status">
  ) {
    const { data, error } = await supabase
      .from("bug_reports")
      .insert([
        {
          ...bugReport,
          status: "open",
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get all bug reports
  async getAll() {
    const { data, error } = await supabase
      .from("bug_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get bug report by ID
  async getById(id: number) {
    const { data, error } = await supabase
      .from("bug_reports")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  // Update bug report status
  async updateStatus(id: number, status: BugReport["status"]) {
    const { data, error } = await supabase
      .from("bug_reports")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete bug report
  async delete(id: number) {
    const { error } = await supabase.from("bug_reports").delete().eq("id", id);

    if (error) throw error;
  },

  // Upload image to storage
  async uploadImage(file: File, bugId: number): Promise<string> {
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
  },
};
