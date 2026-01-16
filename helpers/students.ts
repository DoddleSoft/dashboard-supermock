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
 * Create a new student
 */
export const createStudent = async (
  centerId: string,
  studentData: {
    name: string;
    email: string;
    phone?: string;
    guardian?: string;
    guardian_phone?: string;
    date_of_birth?: string;
    address?: string;
  }
) => {
  try {
    const { data, error } = await supabase
      .from("student_profiles")
      .insert({
        center_id: centerId,
        name: studentData.name,
        email: studentData.email,
        phone: studentData.phone || null,
        guardian: studentData.guardian || null,
        guardian_phone: studentData.guardian_phone || null,
        date_of_birth: studentData.date_of_birth || null,
        address: studentData.address || null,
      })
      .select()
      .single();

    if (error) throw error;

    toast.success("Student created successfully!");
    return data;
  } catch (error: any) {
    console.error("Error creating student:", error);

    if (error.message?.includes("duplicate key")) {
      toast.error("A student with this email already exists");
    } else if (error.message?.includes("violates")) {
      toast.error("Please check all required fields");
    } else {
      toast.error("Failed to create student");
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
  }
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
