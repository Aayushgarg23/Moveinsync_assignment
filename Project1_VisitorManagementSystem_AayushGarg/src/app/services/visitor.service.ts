import { Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { of, delay, Observable, map, tap, switchMap, throwError } from 'rxjs';
import {
  Visitor,
  Host,
  ApprovalRequest,
  PreApproval,
  VisitorStatus
} from '../models/visitor.model';

// ── Mock Data ──────────────────────────────────────────────────────────

const MOCK_HOSTS: Host[] = [
  {
    id: 'h1',
    name: 'Priya Sharma',
    email: 'priya.sharma@moveinsync.com',
    phone: '9876543210',
    department: 'Engineering',
    photoUrl: 'https://i.pravatar.cc/150?img=32'
  },
  {
    id: 'h2',
    name: 'Rahul Mehta',
    email: 'rahul.mehta@moveinsync.com',
    phone: '9876543211',
    department: 'Product',
    photoUrl: 'https://i.pravatar.cc/150?img=11'
  },
  {
    id: 'h3',
    name: 'Ananya Verma',
    email: 'ananya.verma@moveinsync.com',
    phone: '9876543212',
    department: 'Human Resources',
    photoUrl: 'https://i.pravatar.cc/150?img=26'
  }
];

const now = new Date();

const MOCK_VISITORS: Visitor[] = [
  {
    id: 'v1',
    name: 'Aditya Kumar',
    email: 'aditya.kumar@techcorp.com',
    phone: '9123456780',
    companyName: 'TechCorp',
    role: 'Solutions Architect',
    photoUrl: 'https://i.pravatar.cc/150?img=3',
    visitType: 'Business Guests',
    purpose: 'Quarterly partnership review',
    hostId: 'h1',
    status: 'CHECKED_IN',
    registrationPath: 'pre-invited',
    // 9 hours ago precisely to trigger OVERSTAY logic
    checkInTime: new Date(now.getTime() - 9 * 60 * 60 * 1000),
    checkOutTime: null,
    expectedStartTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0),
    expectedEndTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0),
    tempCardNo: 'TC-101',
    additionalInfo: 'Requires projector in meeting room',
    sponsorLOS: 'Level 3'
  },
  {
    id: 'v2',
    name: 'Sneha Patel',
    email: 'sneha.patel@designhub.io',
    phone: '9123456781',
    companyName: 'DesignHub',
    role: 'UX Lead',
    photoUrl: 'https://i.pravatar.cc/150?img=5',
    visitType: 'Interview',
    purpose: 'Final round design interview',
    hostId: 'h2',
    status: 'PRE_APPROVED',
    registrationPath: 'pre-invited',
    checkInTime: null,
    checkOutTime: null,
    expectedStartTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0),
    expectedEndTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 0),
    tempCardNo: '',
    additionalInfo: 'Portfolio review — bring laptop',
    sponsorLOS: 'Level 2'
  },
  {
    id: 'v3',
    name: 'Vikram Singh',
    email: 'vikram@govaudit.in',
    phone: '9123456782',
    companyName: 'Government Audit Bureau',
    role: 'Senior Auditor',
    photoUrl: 'https://i.pravatar.cc/150?img=8',
    visitType: 'Govt Officials',
    purpose: 'Annual compliance audit',
    hostId: 'h3',
    status: 'CHECKED_IN',
    registrationPath: 'pre-invited',
    checkInTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0),
    checkOutTime: null,
    expectedStartTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0),
    expectedEndTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0),
    tempCardNo: 'TC-102',
    additionalInfo: 'Needs access to finance wing',
    sponsorLOS: 'Level 4'
  },
  {
    id: 'v4',
    name: 'Meera Joshi',
    email: 'meera.joshi@cleanserve.com',
    phone: '9123456783',
    companyName: 'CleanServe Pvt Ltd',
    role: 'Vendor Manager',
    photoUrl: 'https://i.pravatar.cc/150?img=9',
    visitType: 'Vendor',
    purpose: 'Cafeteria contract renewal',
    hostId: 'h1',
    status: 'SELF_CHECK_OUT',
    registrationPath: 'walk-in',
    checkInTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 30),
    checkOutTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 45),
    expectedStartTime: null,
    expectedEndTime: null,
    tempCardNo: 'TC-103',
    additionalInfo: '',
    sponsorLOS: 'Level 1'
  },
  {
    id: 'v5',
    name: 'Arjun Nair',
    email: 'arjun.nair@logicware.com',
    phone: '9123456784',
    companyName: 'LogicWare Solutions',
    role: 'Backend Developer',
    photoUrl: 'https://i.pravatar.cc/150?img=12',
    visitType: 'Personnel',
    purpose: 'Server room maintenance',
    hostId: 'h1',
    status: 'PENDING_APPROVAL',
    registrationPath: 'pre-invited',
    checkInTime: null,
    checkOutTime: null,
    expectedStartTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0),
    expectedEndTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0),
    tempCardNo: '',
    additionalInfo: 'Requires escort to data center',
    sponsorLOS: 'Level 2'
  },
  {
    id: 'v6',
    name: 'Ritu Desai',
    email: 'ritu.desai@freelance.in',
    phone: '9123456785',
    companyName: 'Freelance',
    role: 'Content Writer',
    photoUrl: 'https://i.pravatar.cc/150?img=16',
    visitType: 'Others',
    purpose: 'Blog content discussion',
    hostId: 'h2',
    status: 'CHECKED_IN',
    registrationPath: 'walk-in',
    checkInTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    checkOutTime: null,
    expectedStartTime: null,
    expectedEndTime: null,
    tempCardNo: 'TC-104',
    additionalInfo: 'Meeting in the cafeteria area',
    sponsorLOS: 'Level 1'
  }
];

const MOCK_APPROVAL_REQUESTS: ApprovalRequest[] = [
  {
    id: 'ar1',
    visitorId: 'v5',
    hostId: 'h1',
    eventTitle: 'Server Room Maintenance Visit',
    visitType: 'Personnel',
    office: 'Bangalore HQ',
    date: now,
    startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0),
    endTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0),
    personalNote: 'Please arrange escort for data center access',
    status: 'PENDING',
    createdAt: new Date(now.getTime() - 3600000) // 1 hour ago
  }
];

const MOCK_PRE_APPROVALS: PreApproval[] = [];

// ── Service ────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class VisitorService {
  /** In-memory data stores — mutated by add/update helpers */
  private visitors = [...MOCK_VISITORS];
  private hosts = [...MOCK_HOSTS];
  private approvalRequests = [...MOCK_APPROVAL_REQUESTS];
  private preApprovals = [...MOCK_PRE_APPROVALS];

  private nextVisitorId = 7;
  private nextApprovalId = 2;
  private nextPreApprovalId = 1;

  // ── Simulated async fetchers (RxJS) ─────────────────────────────────

  /**
   * Simulates real-world network unreliability (10% failure rate) to demonstrate
   * error-handling in components. In production this operator would be removed —
   * its sole purpose is to exercise the catchError paths during demo/review.
   */
  private withRandomError<T>() {
    return (source: Observable<T>): Observable<T> => source.pipe(
      delay(200),
      switchMap((data: T) => {
        // 1-in-10 chance of failing
        if (Math.random() < 0.1) {
          return throwError(() => new Error('Simulated network error: Database timeout.'));
        }
        return of(data);
      })
    );
  }

  /** Simulate fetching all visitors from an API */
  getVisitors$(): Observable<Visitor[]> {
    return of([...this.visitors]).pipe(this.withRandomError());
  }

  /** Simulate fetching all hosts from an API */
  getHosts$(): Observable<Host[]> {
    return of([...this.hosts]).pipe(this.withRandomError());
  }

  /** Simulate fetching pending approval requests for a host */
  getApprovalRequestsByHost$(hostId: string): Observable<ApprovalRequest[]> {
    return of(this.approvalRequests.filter(ar => ar.hostId === hostId)).pipe(this.withRandomError());
  }

  /** Simulate fetching all approval requests */
  getApprovalRequests$(): Observable<ApprovalRequest[]> {
    return of([...this.approvalRequests]).pipe(this.withRandomError());
  }

  /** Simulate fetching pre-approvals for a host */
  getPreApprovalsByHost$(hostId: string): Observable<PreApproval[]> {
    return of(this.preApprovals.filter(pa => pa.hostId === hostId)).pipe(this.withRandomError());
  }

  /** Simulate fetching a single visitor by ID */
  getVisitorById$(id: string): Observable<Visitor | undefined> {
    return of(this.visitors.find(v => v.id === id)).pipe(this.withRandomError());
  }

  /** Simulate fetching a single host by ID */
  getHostById$(id: string): Observable<Host | undefined> {
    return of(this.hosts.find(h => h.id === id)).pipe(this.withRandomError());
  }

  // ── Signal bridges (consumed by components via toSignal()) ──────────

  /** All visitors as a signal — initialValue avoids undefined in templates */
  readonly visitors$ = this.getVisitors$();
  readonly visitorsSignal = toSignal(this.visitors$, { initialValue: [] as Visitor[] });

  /** All hosts as a signal */
  readonly hosts$ = this.getHosts$();
  readonly hostsSignal = toSignal(this.hosts$, { initialValue: [] as Host[] });

  /** All approval requests as a signal */
  readonly approvalRequests$ = this.getApprovalRequests$();
  readonly approvalRequestsSignal = toSignal(this.approvalRequests$, {
    initialValue: [] as ApprovalRequest[]
  });

  // ── Mutating helpers (simulate POST/PUT calls) ──────────────────────

  addVisitor$(visitor: Omit<Visitor, 'id'>): Observable<Visitor> {
    const newVisitor: Visitor = {
      ...visitor,
      id: `v${this.nextVisitorId++}`
    };
    this.visitors.push(newVisitor);
    return of(newVisitor).pipe(this.withRandomError());
  }

  addApprovalRequest$(request: Omit<ApprovalRequest, 'id' | 'createdAt'>): Observable<ApprovalRequest> {
    const newRequest: ApprovalRequest = {
      ...request,
      id: `ar${this.nextApprovalId++}`,
      createdAt: new Date()
    };
    this.approvalRequests.push(newRequest);
    return of(newRequest).pipe(this.withRandomError());
  }

  updateApprovalStatus$(requestId: string, status: 'APPROVED' | 'REJECTED'): Observable<ApprovalRequest | undefined> {
    const request = this.approvalRequests.find(ar => ar.id === requestId);
    if (request) {
      request.status = status;
      // Also update the visitor status
      const visitor = this.visitors.find(v => v.id === request.visitorId);
      if (visitor) {
        visitor.status = status === 'APPROVED' ? 'CHECKED_IN' : 'DENIED';
        if (status === 'APPROVED') {
          visitor.checkInTime = new Date();
        }
      }
    }
    return of(request).pipe(this.withRandomError());
  }

  addPreApproval$(preApproval: Omit<PreApproval, 'id' | 'createdAt'>): Observable<PreApproval> {
    const newPreApproval: PreApproval = {
      ...preApproval,
      id: `pa${this.nextPreApprovalId++}`,
      createdAt: new Date()
    };
    this.preApprovals.push(newPreApproval);
    return of(newPreApproval).pipe(this.withRandomError());
  }

  updateVisitorStatus$(visitorId: string, status: VisitorStatus): Observable<Visitor | undefined> {
    const visitor = this.visitors.find(v => v.id === visitorId);
    if (visitor) {
      visitor.status = status;
      if (status === 'CHECKED_IN') {
        visitor.checkInTime = new Date();
      }
      if (status === 'CHECKED_OUT' || status === 'SELF_CHECK_OUT') {
        visitor.checkOutTime = new Date();
      }
    }
    return of(visitor).pipe(this.withRandomError());
  }

  /**
   * Counts how many PreApproval records this host has created today.
   * We normalise `today` to midnight so any time within the calendar day counts.
   * Used by the invite form to enforce the 5-per-host-per-day hard limit from the spec.
   */
  getPreApprovalCountToday$(hostId: string): Observable<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const count = this.preApprovals.filter(
      pa =>
        pa.hostId === hostId &&
        new Date(pa.createdAt).getTime() >= today.getTime()
    ).length;
    return of(count).pipe(this.withRandomError());
  }
  /** Search visitors + hosts by name/email/phone/id for guest-add in invite form */
  searchContacts$(query: string): Observable<Array<{ id: string; name: string; email: string; phone: string; type: 'visitor' | 'host' }>> {
    const q = query.toLowerCase().trim();
    if (!q) return of([]);

    const matchedVisitors = this.visitors
      .filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.email.toLowerCase().includes(q) ||
        v.phone.includes(q) ||
        v.id.toLowerCase().includes(q)
      )
      .map(v => ({ id: v.id, name: v.name, email: v.email, phone: v.phone, type: 'visitor' as const }));

    const matchedHosts = this.hosts
      .filter(h =>
        h.name.toLowerCase().includes(q) ||
        h.email.toLowerCase().includes(q) ||
        h.phone.includes(q) ||
        h.id.toLowerCase().includes(q)
      )
      .map(h => ({ id: h.id, name: h.name, email: h.email, phone: h.phone, type: 'host' as const }));

    return of([...matchedVisitors, ...matchedHosts]).pipe(delay(150));
  }

  /**
   * Synchronous limit-check used at form-submit time.
   * Converts both dates to a locale date-string for calendar-day comparison so that
   * timezone offsets do not accidentally allow a 6th booking near midnight.
   */
  getPreApprovalCountForHost(hostId: string, date: string): number {
    const targetDate = new Date(date).toDateString();
    return this.visitors.filter(v => 
      v.hostId === hostId && 
      v.status === 'PRE_APPROVED' &&
      v.expectedStartTime &&
      new Date(v.expectedStartTime).toDateString() === targetDate
    ).length;
  }

  /**
   * Auto-expiry scan: iterates PRE_APPROVED visitors and flips status to EXPIRED
   * when their expectedEndTime has passed. Called on dashboard load so the table
   * always reflects the current window without a separate cron job.
   */
  checkAndExpirePasses(): void {
    const now = new Date();
    this.visitors.forEach(v => {
      if (v.status === 'PRE_APPROVED' && v.expectedEndTime && new Date(v.expectedEndTime) < now) {
        v.status = 'EXPIRED';
      }
    });
  }
}
