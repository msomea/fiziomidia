# FizioMidia Platform Knowledge Base

> Source of truth for Fizio AI's knowledge of the FizioMidia platform itself.
> Gathered from backend routes/models and frontend pages (Nov 2026).
> Intended for ingestion into `AIKnowledgeDocument` / prompt context.

## 1. What is FizioMidia

FizioMidia (fiziomidia.org) is a Tanzanian platform connecting people with
physiotherapists ("Wafiziotherapia"). It offers physiotherapist discovery,
appointments, clinics, community forum, education resources, messaging, and
an AI assistant (Fizio AI).

- **Languages:** English and Kiswahili
- **Timezone:** Africa/Dar_es_Salaam (EAT, UTC+3)
- **Official contact email:** admin@fiziomidia.com

## 2. User roles

| Role | Description |
|---|---|
| `guest` | Not logged in. Can browse, use Fizio AI (10 msgs/day), limited features |
| `member` | Registered user. Full access to appointments, forum, messaging, clinics |
| `pendingPhysiotherapist` | Member who submitted verification; awaiting admin license review |
| `physiotherapist` | Verified physiotherapist. Can receive appointments, manage clinic, post education |
| `admin` | Platform administrator. Manages users, licenses, AI agents, reports |

## 3. Opening an account

- Free sign-up at the **Sign Up** page (`/signup`): full name, email, password.
- Email verification via link (`/verify-email/:token`).
- Password recovery: **Forgot Password** → email reset link (`/reset-password`).
- Guests can browse the site and chat with Fizio AI without an account
  (10 messages per day, resets midnight Tanzania time).

## 4. Becoming a verified physiotherapist

1. Log in as a member → go to **Profile** → choose **"Become a Physiotherapist"**.
2. Required information (validated server-side):
   - Professional **license number**
   - **License document** upload (photo/scan)
   - **Institution**
   - **Years of experience**
   - At least one **speciality**
3. Optional profile details: title, working hours, education history,
   work experience, services (name, description, duration, price),
   gallery images, languages spoken.
4. Submission sets role to `pendingPhysiotherapist`; admin reviews the
   license document.
5. **Approved** → role becomes `physiotherapist`, `physioApproval = true`,
   user gets email notification. **Rejected** → back to `member`.

## 5. Finding and booking a physiotherapist

- **Search physiotherapists** (`/search/physiotherapists`) — filter by
  speciality, location.
- **PT profiles** (`/pt/:id`) — services, working hours, gallery,
  education, reviews, clinic affiliation.
- **Request appointment** (`/appointment/request`) — pick PT or clinic,
  choose date/time/duration (default 60 min), timezone
  Africa/Dar_es_Salaam.
- Appointment statuses: `pending` → `accepted` / `declined` /
  `cancelled` / `completed`.
- Members manage appointments under **Member → Appointments**;
  physiotherapists under **PT → Appointments**.

## 6. Clinics

- Physiotherapists can create clinics (`POST /api/clinics`) with details,
  location, images.
- PTs can request to work at a clinic; clinic owner approves/declines
  (`PTRequest`).
- Members can **request clinic appointments** and view available PTs
  at a clinic (`/api/clinic-appointments`).
- Clinics can run **promotions** (`ClinicPromotion`) and appear in
  sponsored listings.

## 7. Forum

- Organised into **sub-forums** (`ForumSub`) with moderators.
- Members create **posts**, comment, vote, pin posts.
- Sub-forum moderators can be requested/approved by admins.
- AI-assisted content drafting exists for forum posts (admin-managed).

## 8. Education section

- **Resources**: educational materials (PDFs etc.) uploaded by
  physiotherapists/admins; members can download (download logging).
- **Resource requests**: members can request topics; PTs can fulfil them.
- **Reports**: copyright/abuse reports on resources.

## 9. Messaging

- Direct member↔PT (or member↔member) chat via conversations
  (`/api/conversations`, `/api/messages`).
- Real-time via Socket.io; unread counts and mark-read supported.

## 10. Reviews & promotions

- Members can review physiotherapists (`/api/reviews`); PTs see
  `/my-reviews`.
- PTs and clinics can create **promotions** and **sponsored products**
  (paid visibility features).

## 11. Notifications

- In-app notifications with types: `critical`, `important`, `update`,
  `information`; unread count endpoint; mark read/all read.

## 12. Fizio AI assistant

- Dedicated page `/assistant`, public for guests and members.
- **Guests:** 10 messages/day (resets midnight Africa/Dar_es_Salaam),
  conversation history kept for the browser session via guest token.
- **Members:** unlimited messages, multiple conversations, rename/delete,
  history synced to account across devices.
- After login/signup, guests can **claim** their guest conversations
  into their account.
- Languages: English and Kiswahili (mandatory terminology:
  Fiziotherapia / Mfiziotherapia / Wafiziotherapia).
- Emergency screening runs before the AI model; medical answers carry
  disclaimers; platform questions do not.
- Official escalation contact: admin@fiziomidia.com.

## 13. Support & contact

- For account problems, verification issues, or anything not covered:
  email **admin@fiziomidia.com**.
- Contact form endpoint exists (`/api/contact`).
