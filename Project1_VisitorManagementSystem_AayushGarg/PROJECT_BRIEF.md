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




  ## Design System — Modern Minimal Aesthetic

### Navigation — HEADER-BASED (not sidebar) on desktop
- Desktop (>960px): horizontal top nav bar — logo/wordmark on left, nav links
  (Dashboard, Invite Visitor, Walk-in Check-in, Approvals, Pre-Approvals)
  inline in the center/left-of-center, notification bell + any future
  user/profile icon on the right
- Mobile (<960px): collapse nav links into a hamburger-triggered dropdown/
  overlay menu, keep logo + hamburger + bell visible in the header bar
- Active nav link: Indigo-600 text + a small underline/pill indicator, not a
  sidebar-style left border (that pattern no longer applies)
- Remove the mat-sidenav-container entirely from AppShellComponent — content
  area becomes full-width below the header

### Colors
- Page background: Gray-50 (off-white, not pure white)
- Header background: White with a subtle bottom border (border-b border-gray-200)
  and shadow-sm — NOT a dark/colored bar
- Primary accent: Indigo-600, used ONLY for primary buttons, active nav
  state, and links — sparingly elsewhere
- Primary buttons: bg-gradient-to-r from-indigo-600 to-indigo-500, white
  text, shadow-sm
- Success: Emerald-600, Danger: Red-600, Warning: Amber-600 — status chips
  and critical actions only
- Status chips: SOFT/PASTEL backgrounds, not solid fills:
  Overstay: bg-red-50 text-red-700 border border-red-200
  Checked-in: bg-emerald-50 text-emerald-700 border border-emerald-200
  Pending: bg-amber-50 text-amber-700 border border-amber-200
  Pre-approved: bg-indigo-50 text-indigo-700 border border-indigo-200
- Avatars: rotate background color per visitor/host (hash of name) from:
  bg-indigo-100 text-indigo-700, bg-emerald-100 text-emerald-700,
  bg-amber-100 text-amber-700, bg-rose-100 text-rose-700,
  bg-blue-100 text-blue-700 — never the same color for every avatar

### Typography
- Page titles: text-2xl font-semibold tracking-tight text-gray-900
- Section headers: text-xs font-semibold uppercase tracking-wide text-gray-500
- Body/table text: text-sm text-gray-700
- Helper text: text-sm text-gray-500

### Elevation & Depth
- Cards: bg-white border border-gray-100 shadow-sm rounded-xl
- Dialogs: shadow-xl rounded-2xl
- Hover on cards/rows: hover:shadow-md hover:-translate-y-0.5
  transition-all duration-200

### Spacing
- Card padding: p-6, Section gaps: space-y-6, consistent rounded-xl everywhere

### Interactive states
- Focus: ring-2 ring-indigo-500 ring-offset-2
- Disabled: opacity-50 cursor-not-allowed

### Icons & Branding
- Header logo: a clean custom mark (not generic Material shield icon) — a
  minimal geometric badge/checkmark combination in Indigo-600
- Notification bell: functional, click opens a panel, shows
  "No new notifications" when empty