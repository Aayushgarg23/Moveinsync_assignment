export type VisitType =
  | 'Business Guests'
  | 'Vendor'
  | 'Personnel'
  | 'Govt Officials'
  | 'Interview'
  | 'Others';

export type VisitorStatus =
  | 'PENDING_APPROVAL'
  | 'PRE_APPROVED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'SELF_CHECK_OUT'
  | 'OVERSTAY'
  | 'DENIED'
  | 'EXPIRED';

export type RegistrationPath = 'pre-invited' | 'walk-in';

export interface Visitor {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  role: string;
  photoUrl: string;
  visitType: VisitType;
  purpose: string;
  hostId: string;
  status: VisitorStatus;
  registrationPath: RegistrationPath;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  expectedStartTime: Date | null;
  expectedEndTime: Date | null;
  tempCardNo: string;
  additionalInfo: string;
  sponsorLOS: string;
}

export interface Host {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  photoUrl: string;
}

export interface ApprovalRequest {
  id: string;
  visitorId: string;
  hostId: string;
  eventTitle: string;
  visitType: VisitType;
  office: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  personalNote: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
}

export interface PreApproval {
  id: string;
  visitorId: string;
  hostId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  qrCode: string;
  isExpired: boolean;
  createdAt: Date;
}
