import { createClient } from "@/lib/supabase/client";
import { Student } from "@/types/student";
import { toast } from "sonner";

const supabase = createClient();

/**
 * Fetch all students for a specific center
 */
export const fetchStudents = async (centerId: string): Promise<Student[]> => {
  try {
    const { data, error } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("center_id", centerId)
      .order("enrolled_at", { ascending: false });

    if (error) throw error;

    // Map database fields to component fields
    const mappedStudents: Student[] = (data || []).map((student) => ({
      student_id: student.student_id,
      center_id: student.center_id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      guardian: student.guardian,
      guardian_phone: student.guardian_phone,
      date_of_birth: student.date_of_birth,
      address: student.address,
      grade: student.grade,
      status: student.status || "active",
      enrollment_type: student.enrollment_type || "regular",
      testsCompleted: 0, // You'll need to calculate this from tests table
      enrolled_at: student.enrolled_at,
      updated_at: student.updated_at,
    }));

    return mappedStudents;
  } catch (error) {
    console.error("Error fetching students:", error);
    toast.error("Failed to load students");
    throw error;
  }
};

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
    if (!/^\d{8}$/.test(studentData.password)) {
      toast.error("Password must be exactly 8 digits (numbers only).");
      throw new Error("invalid password");
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
      throw new Error(json.error ?? "api error");
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
      console.error("Error creating student:", error);
      toast.error("An unexpected error occurred. Please try again.");
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

    toast.success("Student updated successfully!");
  } catch (error: any) {
    console.error("Error updating student:", error);
    toast.error("Failed to update student");
    throw error;
  }
};

/**
 * Delete a student
 */
export const deleteStudent = async (studentId: string) => {
  try {
    const { error } = await supabase
      .from("student_profiles")
      .delete()
      .eq("student_id", studentId);

    if (error) throw error;

    toast.success("Student deleted successfully!");
  } catch (error: any) {
    console.error("Error deleting student:", error);
    toast.error("Failed to delete student");
    throw error;
  }
};
