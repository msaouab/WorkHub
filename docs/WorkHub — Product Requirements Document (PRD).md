# WorkHub — Product Requirements Document (PRD)

Oct 9, 2026 · @Mohamed Saouab

## 1. Overview

WorkHub is a multi-tenant SaaS where a company creates a **Space**, invites its people, and runs leave, public holidays and HR document requests in one place.

**Problem.** Small and mid-size companies track leave in spreadsheets, WhatsApp and email. Balances drift, approvals get lost, and employees wait days for a simple salary certificate or work attestation.

**Vision.** One link to join your company, one screen to see who is off, one click to request a day off or a document, and a clear audit trail of every decision.

**Product scope (v1).**

- Spaces (workspaces) with multiple spaces per user
- Joining by invite link, email invite, or verified email domain
- Leave bank per employee and team-wide visibility
- Leave and holiday requests with manager approval, denial and comments
- Document ("papers") requests to management, e.g. work certificate, salary certificate, payslip copy
- Employee profiles

## 2. Goals, non-goals and success metrics

The MVP succeeds if a 20-person company can onboard in under 10 minutes and process every leave and document request inside WorkHub within its first month.

**Goals**

- Replace spreadsheets for leave balances with one trusted source
- Cut request-to-decision time to under 24 hours
- Give every employee self-service visibility of their balance and request history
- Make joining a company frictionless via link or email domain

**Non-goals (v1)**

- Payroll calculation and salary processing
- Time tracking, shifts or attendance clock-in
- Recruitment / ATS features
- Native mobile apps (responsive web only)

**Success metrics**

| Metric | Target (90 days after launch) |
| --- | --- |
| Time to create space and invite first 5 members | < 10 min |
| Median request-to-decision time | < 24 h |
| Share of members who submit at least one request | > 60% |
| Weekly active spaces | 50 |
| Document requests fulfilled within SLA | > 90% |

## 3. Target users and personas

WorkHub targets companies of 5–300 employees with no dedicated HRIS, starting with MENA and francophone markets.

| Persona | Who they are | Main jobs in WorkHub | Pain today |
| --- | --- | --- | --- |
| Owner | Founder or HR lead who creates the space | Set up space, policies, leave types, holidays, roles, billing | Rebuilding the leave sheet every year |
| Admin / HR | HR officer or office manager | Manage members, adjust balances, fulfil document requests | Chasing approvals and typing certificates by hand |
| Manager | Team lead approving their team | Approve or deny requests, comment, see team calendar | No view of who is already off |
| Employee | Any member | See balance, request leave and documents, track status, edit profile | Not knowing their remaining days |

One person can hold different roles in different spaces, e.g. Owner of their own startup space and Employee in a client's space.

## 4. Core concepts

A **user** is a global account; a **space** is a company tenant; a **membership** links the two and carries the role, so one user can belong to many spaces with different roles.

**Space.** A tenant with its own name, slug (`workhub.app/s/acme`), logo, timezone, work week, leave policies, holidays and members. All data is isolated per space. A user can create any number of spaces (limited by plan).

**Teams.** Optional groups inside a space (Engineering, Sales). Each team has one or more managers who approve its requests.

**Roles (per space)**

| Permission | Owner | Admin / HR | Manager | Employee |
| --- | --- | --- | --- | --- |
| Edit space settings, billing, delete space | Yes | No | No | No |
| Manage members, roles, teams | Yes | Yes | No | No |
| Configure leave types, policies, holidays | Yes | Yes | No | No |
| Adjust leave balances | Yes | Yes | No | No |
| Approve / deny leave for their team | Yes | Yes | Yes | No |
| Fulfil document requests | Yes | Yes | Optional | No |
| See team leave bank and calendar | Yes | Yes | Yes | Yes, including leave type |
| Submit own requests, edit own profile | Yes | Yes | Yes | Yes |

**Ways to join a space**

1. **Invite link.** Shareable URL with a token, optional expiry date and max uses; Admin can revoke it anytime.
2. **Email invite.** Admin enters one or many emails; each gets a one-time link valid 7 days.
3. **Email domain.** Admin verifies a domain (e.g. `@acme.ma`) by confirming an admin mailbox or DNS TXT record. Anyone signing up with a verified address joins automatically as Employee; admins can then remove them or limit their role and permissions. Public domains (gmail.com, outlook.com) are blocked.

New joiners get the Employee role and the space's default leave policy unless an admin sets otherwise.

## 5. Features and user stories

Seven feature areas make up the MVP; each story below is a release requirement unless marked (v1.1).

### 5.1 Spaces

- As a user, I can create a space with name, logo, country, timezone and work week, so it fits my company.
- As a user, I can belong to several spaces and switch between them from a space switcher.
- As an owner, I can transfer ownership, archive or delete a space.

### 5.2 Members and invitations

- As an admin, I can generate, copy, limit and revoke an invite link.
- As an admin, I can invite people by email in bulk (paste list or CSV).
- As an admin, I can verify a company email domain so matching sign-ups join automatically, then remove them or limit their permissions.
- As an admin, I can assign roles, teams and managers, and deactivate a member who leaves.

### 5.3 Leave bank

- As an admin, I can create leave types (Annual, Sick, Unpaid, Maternity, Exceptional) with yearly allowance, accrual (yearly or monthly), carry-over cap and whether they need approval or a document.
- As an employee, I can see my balance per type: allowance, taken, pending, remaining.
- As any member, I can see the team leave bank and who is off today and this week, including each teammate's exact leave type.
- As an admin, I can manually adjust a balance with a mandatory reason, logged in the history.

### 5.4 Leave requests

- As an employee, I can request leave by type, start and end date, half-day option, reason and optional attachment (e.g. medical note).
- The system shows working days requested, excluding weekends and space holidays, and warns on overlap or insufficient balance.
- As an employee, I can cancel a pending request or ask to cancel an approved one.

### 5.5 Holidays

- As an admin, I can import public holidays for the space country and add company-specific days off.
- As a member, I can see upcoming holidays in a calendar and list.

### 5.6 Document (papers) requests

- As an admin, I can configure document types (Work certificate, Salary certificate, Payslip copy, Mission order, Custom) with an expected turnaround in days.
- As an employee, I can request a document with purpose, language (AR / FR / EN) and delivery (download or pick-up).
- As HR, I can mark a request In progress, upload the final file, or reject it with a comment; the employee is notified and downloads it.
- (v1.1) HR can generate common certificates from a template with the employee's profile data auto-filled.

### 5.7 Approvals and comments

- As a manager, I see an inbox of pending requests from my team, sorted by start date.
- As a manager, I can approve or deny with a comment; denial requires a comment.
- As requester or approver, I can add comments on a request thread before and after the decision.
- Every status change is stored with who, when and comment, and notifies the requester by email and in-app.

### 5.8 Profile

- As an employee, I can edit photo, phone, address, emergency contact and language.
- As an admin, I can edit job title, team, manager, hire date, employee ID and national ID (restricted field).
- As an employee, I can see my request history and download my approved documents.

## 6. Key user flows

Two flows carry the product: joining a space, and moving a request from submission to decision.

**Onboarding a company**

1. Owner signs up (email + password, Google or Microsoft) and creates a space.
2. Owner sets country, timezone, work week; WorkHub imports public holidays and creates default leave types.
3. Owner copies the invite link, sends email invites, or verifies the company domain.
4. Members sign up or log in, land in the space, and see their starting balance.
5. Owner assigns teams and managers.

**Request lifecycle (leave and documents)**

&#91;embedded content: leave and document request lifecycle · 6 states\]

Approving deducts the days and puts them on the team calendar; comments can be added at every state, and denial always needs one. Document requests follow the same path with an extra In progress state before HR uploads the file.

## 7. Release plan and additional ideas

Ship the MVP in about 10–12 weeks of solo work, then add the ideas below in order of value to a paying customer.

**MVP (v1.0):** everything in section 5 except items marked (v1.1), plus email and in-app notifications, English and Arabic UI (Arabic right-to-left), and a free plan.

**Additional ideas, prioritised**

| Idea | Why it matters | Phase |
| --- | --- | --- |
| Team calendar with "who's off" view and iCal / Google Calendar sync | The most-used screen in tools like this | v1.1 |
| Certificate generator from templates (PDF with company letterhead, signature, QR code to verify authenticity) | Saves HR the most time; QR verification is a strong differentiator | v1.1 |
| Slack / Microsoft Teams bot to request and approve from chat | Approvals happen where managers already are | v1.1 |
| French UI | Opens francophone Morocco, Europe and West Africa | v1.1 |
| Multi-step approval chains (manager then HR) and delegation when the approver is on leave | Needed by companies above \~50 people | v1.2 |
| Coverage rules: block or warn when more than N people of a team are off the same day | Prevents understaffing | v1.2 |
| Accrual engine with country presets (e.g. Moroccan Labour Code: 1.5 days per month worked) | Removes manual setup | v1.2 |
| Reports and CSV/Excel export for payroll (leave taken, unpaid days per month) | Bridges to the payroll tool they already use | v1.2 |
| Onboarding / offboarding checklists | Natural next HR workflow | Later |
| Announcements and company policy documents with read receipts | Turns WorkHub into the daily HR hub | Later |
| AI assistant: "How many days do I have left?", draft a certificate, summarise team absence for next month | Modern selling point, cheap to add on top of existing data | Later |
| Public API and webhooks | Integration with payroll and ERP | Later |
| Billing per space, priced by the number of active members in that space, via Stripe (or a local gateway such as CMI for Morocco) | Revenue | v1.1 |

## 8. Assumptions, risks and decisions

**Assumptions**

- One approver level (team manager) is enough for v1; HR can always override.
- Leave is counted in working days, with half-day granularity.
- Documents are produced by HR outside WorkHub and uploaded in v1.

**Risks**

| Risk | Mitigation |
| --- | --- |
| Data leak between spaces | Space ID enforced on every query plus PostgreSQL row-level security |
| Personal data regulation (Morocco Law 09-08, GDPR for EU clients) | Data export and deletion per user, restricted fields, EU or local hosting option |
| Leave rules differ by country and company | Configurable policies first, presets later |
| Low adoption by managers | Email one-click approve, then Slack / Teams bot |

**Decisions (confirmed 9 Oct 2026)**

- **Leave visibility:** employees see the exact leave type of teammates.
- **Domain join:** automatic by default; admins can remove the member or limit their role and permissions afterwards.
- **Billing:** per space; the price scales with the number of active members in that space. A user in several spaces is never billed personally.
- **Launch languages:** English and Arabic (with right-to-left layout); French follows in v1.1.
