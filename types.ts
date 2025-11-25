
export enum UserRole {
  CENTER_ADMIN = 'CENTER_ADMIN',
  DOCTOR = 'DOCTOR',
  ROTA_MANAGER = 'ROTA_MANAGER'
}

export enum ShiftType {
  MORNING = 'Morning',
  EVENING = 'Evening',
  NIGHT = 'Night',
  ON_CALL = 'On Call'
}

export enum ShiftStatus {
  ASSIGNED = 'Assigned',
  OPEN = 'Open', // Available in Marketplace
  PENDING_APPROVAL = 'Pending',
  PENDING_SWAP = 'Pending Swap',
  COMPLETED = 'Completed',
  TIMESHEET_SUBMITTED = 'Timesheet Submitted',
  PAID = 'Paid'
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  level: 'Resident' | 'Specialist' | 'Consultant';
  city: string;
  avatarUrl?: string;
}

export interface Timesheet {
  actualStartTime: string;
  actualEndTime: string;
  breakDurationMinutes: number;
  notes?: string;
  submittedAt: string;
}

export interface Shift {
  id: string;
  centerName: string;
  date: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD - Deadline to fill the shift
  type: ShiftType;
  startTime: string;
  endTime: string;
  status: ShiftStatus;
  specialtyRequired: string;
  assignedDoctorId?: string;
  rate?: number; // Hourly rate for marketplace
  location: string;
  handoverNotes?: string; // For shift handover
  hospitalRating?: number; // 1-5 Stars
  timesheet?: Timesheet;
}

export interface ConflictResult {
  hasConflict: boolean;
  message: string;
  severity: 'low' | 'medium' | 'high';
  suggestion?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: string;
  isRead: boolean;
  actionLink?: string;
}

// --- New Features Interfaces ---

export interface LeaveRequest {
  id: string;
  doctorId: string;
  doctorName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  type: 'Annual Leave' | 'Sick Leave' | 'Conference';
}

export interface Credential {
  id: string;
  name: string; // e.g., "Medical License", "ACLS"
  provider: string; // e.g., "GMC", "AHA"
  expiryDate: string;
  status: 'Valid' | 'Expiring Soon' | 'Expired';
  fileUrl?: string;
}

export interface WalletTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit'; // credit = earnings, debit = withdrawal
  status: 'Completed' | 'Pending' | 'Processing';
  reference: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'apple_pay' | 'google_pay';
  brand?: 'visa' | 'mastercard' | 'amex';
  last4?: string;
  expiry?: string; // MM/YY
  isDefault: boolean;
}

export interface GenerationParams {
  startDate: string;
  endDate: string;
  department: string;
  shiftsPerDay: number;
  minDoctors: number;
}

export type LanguageCode = 'en' | 'ar' | 'es' | 'fr';

export interface Translation {
  [key: string]: {
    [key in LanguageCode]: string;
  };
}