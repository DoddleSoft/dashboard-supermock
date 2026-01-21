export interface Student {
  student_id: string;
  center_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  guardian: string | null;
  guardian_phone: string | null;
  date_of_birth: string | null;
  address: string | null;
  grade: string | null;
  status: "active" | "cancelled" | "archived" | "passed";
  enrollment_type: "regular" | "mock_only";
  enrolled_at: string;
  updated_at: string;
  testsCompleted: number;
}
