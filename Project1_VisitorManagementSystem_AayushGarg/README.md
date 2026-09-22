# Visitor Management System — MoveInSync Case Study (Project 1)

A frontend-focused Visitor Management System built for MoveInSync's
Software Development Intern case study assignment, implementing
pre-approval scheduling, walk-in registration, host approval workflows,
and front-desk visitor tracking.

## Tech Stack

- **Angular 18** (standalone components)
- **Angular Signals** — all UI state management
- **RxJS** — simulated async operations (`of().pipe(delay())`), bridged to
  signals via `toSignal()` from `@angular/core/rxjs-interop`
- **Angular Material** (Indigo/Pink theme) — complex UI components
  (tables, dialogs, form fields, date pickers, chips)
- **Tailwind CSS** — layout and spacing (Preflight disabled to avoid
  conflicting with Material's base styles)
- **angularx-qrcode** — E-pass QR code generation
- Mock data layer only — no backend/database (per assignment instructions,
  which explicitly permit mock data when an API isn't available)

## Setup

```bash
npm install
npx -p @angular/cli@18 ng serve
```

Navigate to `http://localhost:4200`.

## Features Implemented

### 1. Invite / Pre-Approval (host-initiated scheduling)
Hosts schedule visitor access in advance for a specific date/time window.
Since scheduling and approval are the same host action (per spec), a
QR/e-pass is generated immediately on confirmation. Enforces a maximum of
5 pre-approvals per host per day. Passes auto-expire if the visitor
doesn't check in within the scheduled window.

### 2. Walk-in / Self Check-in (unscheduled visitors)
Front-desk/kiosk registration for visitors without a prior invite.
Captures a live photo via the device webcam (`navigator.mediaDevices.getUserMedia`), with a graceful fallback to file upload if camera
permission is denied. Submissions enter a pending-approval state and
notify the relevant host.

### 3. Host Approval Workflow
A queue of pending walk-in visitors, where hosts can approve (generates
QR badge, visitor checked in) or reject (visitor denied, security
notified via toast) each request.

### 4. Front Desk Dashboard
Real-time view of all visitor activity: searchable and filterable
(by name/email/phone and by date/time range) table with visitor status,
host, entry/exit times. Visitors checked in for more than 8 hours are
automatically flagged as "Overstay" via a reactive computed signal.
Clicking a row opens a detail view with full visitor/host information
and check-in/check-out actions.

### 5. Pre-Approvals Overview
Dedicated view of all upcoming scheduled (pre-approved) visits, separate
from the live-activity dashboard, with a live countdown to each pass's
expiry and a cancel action.

### 6. Error Handling
A centralized `ErrorSnackbarService` displays all error messages through
a consistent Material Snackbar UI. A ~10% random failure rate is injected
into mocked async operations (simulating real-world network failures) via
a reusable `withRandomError<T>()` RxJS operator. A guaranteed, reproducible
failure path exists for exceeding the 5-per-day pre-approval limit, for
reliable demonstration.

### 7. Empty States
All list views (Dashboard, Approvals, Pre-Approvals) show clear,
friendly messaging when no data matches the current view/filters, rather
than a blank table.

## Architecture Notes

- **State management**: Angular Signals are the single source of truth
  for UI state (`signal()`, `computed()`). Async operations use RxJS in
  the service layer, bridged into signals via `toSignal()` — this was a
  deliberate choice to demonstrate proficiency in both reactive paradigms
  named in the job description, using each where it's idiomatic (RxJS for
  async data streams, Signals for synchronous derived UI state).
- **Mock data layer**: `VisitorService` holds all application data
  in-memory, simulating network latency and failure with RxJS operators.
  This was a deliberate scope decision — the assignment instructions
  explicitly permit mock data in place of a real API, and as a Frontend
  Intern candidate, the evaluation focus is architecture, component
  design, and UX — not backend infrastructure.

## Complexity Analysis

| Operation | Time Complexity | Space Complexity | Notes |
|---|---|---|---|
| Visitor search/filter (Dashboard) | O(n) | O(n) | Linear scan over in-memory visitor list per keystroke; acceptable at current mock scale (single-digit to low-hundreds of visitors per location) |
| Overstay detection (`computed` signal) | O(n) | O(1) additional | Recomputes on every visitor-list change; re-derives rather than storing separate state, avoiding sync bugs at the cost of recomputation on each change |
| Daily pre-approval count check | O(n) | O(1) | Filters visitor list by host + date on each new pre-approval attempt |
| Guest search-and-add (Invite form) | O(n) | O(k) | k = number of matched suggestions shown |
| QR code generation | O(1) | O(1) | Delegated to `angularx-qrcode`, encodes a fixed-size payload (visitor ID + validity window) |

At current scale (mock data, single-office simulation), O(n) linear scans
are appropriate and add negligible overhead. The scalability section below
addresses how this would change at production scale.

## Scalability Notes (design intent, not implemented — per assignment scope)

The current implementation uses in-memory mock data suitable for a
demonstration/interview context. For production scale (e.g., 10,000+
visitors/day across multiple offices), the following changes would be
made:

- **Data layer**: Move from in-memory arrays to a real backend (e.g.,
  PostgreSQL) with the visitor table indexed on `hostId` and
  `checkInTime`, since these are the two fields every dashboard query
  filters/sorts by.
- **Dashboard query pattern**: Replace client-side O(n) filtering with
  server-side pagination and filtering — the frontend would request a
  page of results matching the search/date filters rather than filtering
  a fully-loaded list, keeping frontend memory and render cost constant
  regardless of total visitor volume.
- **Real-time updates**: Replace the current polling-free, purely
  client-triggered state model with WebSockets or Server-Sent Events for
  live approval notifications, so hosts receive real-time alerts without
  a page refresh.
- **Overstay detection**: At scale, this would move from a client-side
  `computed()` signal (fine for the current small mock dataset) to a
  scheduled backend job that flags overstays periodically, with the
  frontend simply displaying the flagged status rather than deriving it
  from raw timestamps on every client.
- **Photo storage**: Captured visitor photos would move from in-memory
  base64 data URLs to object storage (e.g., S3) with the visitor record
  storing only a reference URL.

## Known Limitations (by design, given assignment scope and timeline)

- No real backend/database/authentication — explicitly out of scope per
  assignment instructions and appropriate for a Frontend Intern
  evaluation
- No automated tests — manual QA performed instead, prioritizing feature
  completeness within the assignment timeline
- Random error simulation and mock data reset on page refresh (no
  persistence layer)

## Demo Video

[Link to be added]
