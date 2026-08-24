export type AppRole = 'app_owner' | 'church_manager' | 'service_manager' | 'servant';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Church {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  logo_url: string | null;
  picture_url: string | null;
  icon: string;
  is_active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  church_id: string | null;
  service_id: string | null;
  role: AppRole;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  approval_status: ApprovalStatus;
  created_at: string;
}

export interface Service {
  id: string;
  church_id: string;
  name: string;
  description: string | null;
  icon: string;
  picture_url: string | null;
  is_active: boolean;
  created_at: string;
}

export const APPROVAL_LABELS: Record<ApprovalStatus, string> = {
  pending: 'في انتظار الموافقة',
  approved: 'مقبول',
  rejected: 'مرفوض',
};

export interface Child {
  id: string;
  church_id: string;
  service_id: string | null;
  child_code: string;
  name: string;
  date_of_birth: string | null;
  phone_number: string | null;
  address: string | null;
  notes: string | null;
  attendance_count: number;
  points: number;
  picture_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  church_id: string;
  child_id: string;
  service_id: string | null;
  attended_on: string;
  recorded_by: string | null;
  created_at: string;
}

export interface PointsLog {
  id: string;
  church_id: string;
  child_id: string;
  delta: number;
  reason: string | null;
  recorded_by: string | null;
  created_at: string;
}

export const ROLE_LABELS: Record<AppRole, string> = {
  app_owner: 'مالك التطبيق',
  church_manager: 'مدير الكنيسة',
  service_manager: 'مدير الخدمة',
  servant: 'خادم',
};

/** Role hierarchy: higher number = more privileges */
export const ROLE_LEVEL: Record<AppRole, number> = {
  app_owner: 4,
  church_manager: 3,
  service_manager: 2,
  servant: 1,
};

export function hasMinRole(role: AppRole | undefined, min: AppRole): boolean {
  if (!role) return false;
  return ROLE_LEVEL[role] >= ROLE_LEVEL[min];
}
