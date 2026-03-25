import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { parseError } from "@/lib/utils";

/**
 * Create a new student by calling the secure backend API route.
 * The API will create the Supabase auth user (email pre-verified) and then
 * insert the student_profiles row in a single atomic operation.
 */
export const createStudent = async (
  centerId: string,
  studentData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    guardian?: string;
    guardian_phone?: string;
    date_of_birth?: string;
    address?: string;
    enrollment_type?: string;
  },
) => {
  try {
    // Client-side pre-validation (mirrors server validation)
    if (!studentData.name?.trim()) {
      toast.error("Student name is required.");
      throw new Error("name is required");
    }
    if (!studentData.email?.trim()) {
      toast.error("Student email is required.");
      throw new Error("email is required");
    }
    const emailRe = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailRe.test(studentData.email.trim())) {
      toast.error("Please enter a valid email address.");
      throw new Error("invalid email");
    }

    const res = await fetch("/api/create/student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        center_id: centerId,
        name: studentData.name.trim(),
        email: studentData.email.trim().toLowerCase(),
        password: studentData.password.trim(),
        phone: studentData.phone?.trim() || "",
        guardian: studentData.guardian?.trim() || "",
        guardian_phone: studentData.guardian_phone?.trim() || "",
        date_of_birth: studentData.date_of_birth?.trim() || "",
        address: studentData.address?.trim() || "",
        enrollment_type: studentData.enrollment_type || "regular",
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      toast.error(json.error ?? "Failed to create student.");
      throw new Error("api error");
    }

    toast.success("Student created successfully!");
    return json.student;
  } catch (error: any) {
    // Avoid double-toasting for errors we already surfaced above
    const knownErrors = [
      "name is required",
      "email is required",
      "invalid email",
      "invalid password",
      "api error",
    ];
    if (!knownErrors.includes(error.message)) {
      toast.error(
        parseError(
          error,
          "Failed to create the student account. Please try again.",
        ),
      );
    }
    throw error;
  }
};

/**
 * Update an existing student
 */
export const updateStudent = async (
  studentId: string,
  updateData: {
    name?: string;
    email?: string;
    phone?: string;
    guardian?: string;
    guardian_phone?: string;
    date_of_birth?: string;
    address?: string;
    grade?: string;
    status?: "active" | "cancelled" | "archived" | "passed";
  },
) => {
  const supabase = createClient();
  try {
    const { error } = await supabase
      .from("student_profiles")
      .update({
        name: updateData.name || null,
        email: updateData.email || null,
        phone: updateData.phone || null,
        guardian: updateData.guardian || null,
        guardian_phone: updateData.guardian_phone || null,
        date_of_birth: updateData.date_of_birth || null,
        address: updateData.address || null,
        grade: updateData.grade || null,
        status: updateData.status,
      })
      .eq("student_id", studentId);

    if (error) throw error;
  } catch (error: any) {
    toast.error(
      parseError(error, "Failed to save student changes. Please try again."),
    );
    throw error;
  }
};

export const deleteStudent = async (studentId: string) => {
  const supabase = createClient();
  try {
    const { data, error } = await supabase.rpc("delete_student_cascade", {
      p_student_id: studentId,
    });

    if (error) throw error;

    toast.success("Student deleted successfully!");
    return data;
  } catch (error: any) {
    toast.error(
      parseError(error, "Failed to delete the student. Please try again."),
    );
    throw error;
  }
};
