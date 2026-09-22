# MoveInSync Case Study — Visitor Management System (Project 1, Frontend Intern)

## Stack
- Angular 18, standalone components
- Angular Signals (signal/computed) for UI state; RxJS (of/delay/catchError) in
  services for simulated async calls, bridged to components via toSignal()
  from @angular/core/rxjs-interop — demonstrates both per JD requirement
- Angular Material (Indigo/Pink theme) for complex components: mat-table,
  mat-chip, mat-form-field, mat-select, mat-datepicker, mat-drawer/mat-dialog,
  mat-snack-bar, mat-button, mat-icon
- Tailwind CSS for layout/spacing/positioning only — disable Preflight to avoid
  conflicting with Material's base styles
- Mock API layer only — in-memory service + RxJS delay() to simulate latency.
  NO real backend/DB.
- Reactive Forms for all forms


## Photo Capture (Registration — both paths)
Primary: live capture via navigator.mediaDevices.getUserMedia (browser webcam).
Fallback: standard file upload if camera permission denied or unavailable —
this fallback IS the error-handling requirement for this feature.

## Modules to build, in this order

### 1. Data layer
TypeScript interfaces: Visitor, Host, ApprovalRequest, PreApproval.
Signals-based VisitorService with mock hosts + mock visitors, simulated API delay.

### 2. Visitor Registration — TWO paths into the same visitor list
### Path A: Invite / Pre-Approval (same feature — the "Invite Visitor" screenshot)
Host fills Invite form (Event Title, Type of Visit, Office, Date, Start/End
Time window, guest search+add, personal note). On "Confirm Invite":
- Generate QR/e-pass IMMEDIATELY (host scheduling = host approving, no wait)
- Status: "pre-approved"
- If visitor doesn't check in within the date/time window → auto-expire
  (status: "expired")
- Enforce max 5 pre-approvals per host per day
On arrival within window: front desk searches/scans QR → check-in directly,
no approval step.

### Path B: Walk-in (unscheduled, on-arrival)
Guard/kiosk registers visitor on the spot (name, contact, purpose, host,
company, mandatory photo via webcam). On submit:
- Status: "pending-approval" (NOT auto-checked-in)
- Host gets real-time notification (toast)
- Feeds into Approval Workflow queue

### Approval Workflow (applies to Walk-in path only)
Host-facing pending queue, approve/reject buttons.
- Approve → QR badge generated, status "checked-in"
- Reject → status "denied", "security notified" toast

### 3. Front Desk Dashboard
Visitor count header ("All (N)"), search by name/email/phone, date+time range filter
with refresh, table columns: Visitor name (host as sub-text), Type of Invite, Entry
Time, Exit Time, Status (OVERSTAY in red / SELF CHECK-OUT). computed() signal flags
overstay after threshold hours. Click row → guest detail side panel (mat-drawer):
photo avatars for visitor+host, contact, check-in/out timestamps, Other Details
(Company Name, Role, Sponsor LOS, Temp Card No), Additional Information free-text,
Check-Out button.


### Approval Workflow (applies to Walk-in path only)
Host-facing pending queue, approve/reject buttons.
- Approve → QR badge generated, status "checked-in"
- Reject → status "denied", "security notified" toast

### 5. Pre-Approval
Schedule form: date + time window. On confirm → QR/e-pass generated immediately.
Auto-expiry if visitor doesn't check in within the window (simple date/time check).
Enforce max 5 pre-approvals per host per day (hardcoded limit per spec).


## Explicitly OUT of scope
Real backend, database, auth/login, unit tests, virtual scrolling, IVR approval
channel, mobile app approval flow, exact pixel-matching of screenshots.

## Required deliverables
- README.md: setup instructions, features implemented, time/space complexity
  analysis per module, scalability notes (how this scales to 10k visitors/day —
  written analysis, not built infra)
- Clean git history — one commit per module, not one dump commit
- Public GitHub repo (verify visibility before submitting)
- Demo video following exact flow: register (both paths) → approve → pre-approve
  → check-in/out → overstay



  ## App Shell & Navigation (build this BEFORE continuing other modules)
- AppShellComponent: mat-sidenav-container with mat-toolbar header
- Sidebar nav items: Dashboard, Invite Visitor, Walk-in Check-in, Approvals,
  Pre-Approvals (Material icons, routerLinkActive highlighting)
- Responsive: sidenav mode="side" fixed on desktop (>=768px), mode="over"
  toggled by hamburger on mobile (<768px)
- All existing and future module routes render inside this shell via
  router-outlet, NOT as standalone pages
- Wrap module content in mat-card for visual structure; consistent Tailwind
  spacing scale throughout
- Dashboard table: wrap in overflow-x-auto for mobile scroll (card-based
  mobile redesign is optional polish, only if time remains at the end)