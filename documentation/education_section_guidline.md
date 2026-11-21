# FizioMidia Education Resources MVP

## Production Specification, Architecture and Implementation Guide

**Project:** FizioMidia\
**Module:** Education Resources\
**Document type:** Product requirements and technical implementation
specification\
**Status:** MVP implementation baseline\
**Target stack:** Existing FizioMidia MERN application\
**Primary objective:** Provide a safe, low-cost, community-driven
library for physiotherapy students and qualified physiotherapists.

------------------------------------------------------------------------

## 1. Executive summary

The Education Resources module will allow authenticated FizioMidia users
to contribute, discover and download educational materials, request
resources that are not currently available, and report suspected
copyright infringement.

The module must be integrated into the existing FizioMidia application.
It must reuse the current authentication, user roles, API conventions,
database connection, Cloudinary integration, frontend architecture,
notifications, admin dashboard and deployment infrastructure. It must
not introduce a separate application or duplicate authentication.

The MVP has four user-facing capabilities:

1.  Upload educational resources.
2.  Browse and download approved resources.
3.  Request educational resources.
4.  Report resources suspected of copyright infringement and request
    their removal.

All resource uploads must be reviewed before publication. A resource
under an active copyright hold, suspended, rejected or removed must not
be downloadable.

**MVP commercial model:** Free access. No credits, subscriptions, paid
downloads or payment integration.

**Primary operating principle:** Minimize new infrastructure and
recurring costs by using existing FizioMidia services, while applying
strict file validation, access control and moderation.

------------------------------------------------------------------------

## 2. Product goals and non-goals

### 2.1 Goals

-   Create a centralized digital library for physiotherapy education.
-   Support students and qualified physiotherapists.
-   Enable lawful sharing of original, public-domain and appropriately
    licensed resources.
-   Support common educational document formats.
-   Make resources searchable and filterable.
-   Allow users to request missing educational resources.
-   Provide a documented copyright complaint and takedown workflow.
-   Give administrators control over publication, suspension and
    removal.
-   Preserve the existing FizioMidia application architecture.
-   Keep the MVP free to operate where existing service quotas permit.

### 2.2 Out of scope for the MVP

Do not implement these until the core module is stable and validated:

-   Paid resources, subscriptions, credits or payment processing.
-   Online document editing or conversion.
-   OCR, AI summarization or AI-generated resource recommendations.
-   Video hosting or streaming.
-   Bulk uploads or multi-file resource packages.
-   Public anonymous downloads.
-   User ratings, comments, reviews or social feeds for resources.
-   CPD accreditation, certificates or credit tracking.
-   Complex full-text indexing of document contents.
-   A separate storage provider or separate authentication system.

------------------------------------------------------------------------

## 3. Users, roles and permissions

Use the existing FizioMidia roles and authentication system. Do not
create a new role system solely for Education Resources.

Existing roles include:

-   `guest`
-   `member`
-   `pendingPhysiotherapist`
-   `physiotherapist`
-   `admin`

### 3.1 Permission matrix

  -------------------------------------------------------------------------------------------
  Capability              Guest       Member           Pending          Approved        Admin
                                               physiotherapist   physiotherapist 
  ---------------- ------------ ------------ ----------------- ----------------- ------------
  View public               Yes          Yes               Yes               Yes          Yes
  library and                                                                    
  metadata                                                                       

  Download                   No          Yes               Yes               Yes          Yes
  approved                                                                       
  resources                                                                      

  Upload resource            No          Yes               Yes               Yes          Yes

  Submit resource            No          Yes               Yes               Yes          Yes
  request                                                                        

  Report copyright           No          Yes               Yes               Yes          Yes
  concern                                                                        

  View own uploads           No          Yes               Yes               Yes          Yes

  Manage own                 No          Yes               Yes               Yes          Yes
  requests                                                                       

  Review/approve             No           No                No                No          Yes
  resources                                                                      

  Manage copyright           No           No                No                No          Yes
  reports                                                                        

  Moderate all               No           No                No                No          Yes
  resource                                                                       
  requests                                                                       
  -------------------------------------------------------------------------------------------

**Implementation note:** Confirm the actual role strings and middleware
names in the repository before coding. Reuse the existing `authenticate`
and admin authorization middleware; do not assume middleware filenames
or exports.

### 3.2 Publication is separate from upload permission

An authenticated user may submit a resource, but upload permission does
not grant publication permission. All new uploads must have `pending`
status and must not be downloadable until an administrator approves
them.

------------------------------------------------------------------------

## 4. Resource content, categories and formats

### 4.1 Initial categories

Use controlled category values rather than allowing arbitrary category
strings.

  -----------------------------------------------------------------------
  Category                            Examples
  ----------------------------------- -----------------------------------
  Anatomy                             Musculoskeletal anatomy,
                                      neuroanatomy

  Physiology                          Exercise physiology, cardiovascular
                                      physiology

  Kinesiology                         Biomechanics, gait analysis,
                                      movement science

  Physiotherapy                       Musculoskeletal, neurological,
                                      cardiorespiratory

  Rehabilitation                      Exercise therapy, rehabilitation
                                      protocols

  Research                            Research articles, systematic
                                      reviews

  Clinical Practice                   Clinical guidelines, assessment
                                      tools

  Education                           Lecture notes, presentations,
                                      assignments

  Professional Development            CPD learning materials,
                                      professional guidance
  -----------------------------------------------------------------------

Categories and subcategories should be maintained in one shared
configuration or constants module to avoid frontend/backend mismatches.

### 4.2 Initial supported formats

Start with:

-   PDF: `.pdf`
-   Microsoft Word: `.docx`
-   Microsoft PowerPoint: `.pptx`
-   EPUB: `.epub`

Potential later formats, subject to validation and security review:

-   `.doc`
-   `.ppt`
-   `.xlsx`
-   `.xls`
-   `.zip`

Do not accept executable files, scripts, HTML files, SVG files or
arbitrary binary files.

### 4.3 Upload limits

Initial MVP limits:

-   Maximum file size: **15 MB per resource**.
-   One file per resource.
-   No bulk upload.
-   No video or audio uploads.
-   Enforce limits on the server, not only in the browser.
-   Make limits configurable in one backend configuration location.

The limit must be checked against the actual Cloudinary account plan and
upload configuration before production release.

### 4.4 Resource metadata

Every resource should capture:

-   Title.
-   Description.
-   Category.
-   Optional subcategory.
-   Language (`en` or `sw`, aligned with the project's i18n
    conventions).
-   Original filename.
-   Validated file format.
-   File size in bytes.
-   Contributor/user reference.
-   License type.
-   Optional license/source URL.
-   Copyright declaration.
-   Moderation status.
-   Upload timestamp.
-   Approval/rejection metadata.
-   Download count.

Do not expose private Cloudinary credentials, internal moderation notes
or unnecessary storage identifiers to public API responses.

------------------------------------------------------------------------

## 5. Copyright and permitted distribution policy

### 5.1 Permitted contributions

Users may submit:

-   Original materials they created and have the right to distribute.
-   Public-domain works.
-   Materials under an open license that permits the intended
    redistribution.
-   Materials for which the contributor has obtained permission from the
    rights holder.
-   Other materials whose distribution is legally authorized.

A document being free to view or download from another website does not
automatically grant permission to upload and redistribute it.

### 5.2 License types

Use a controlled enum such as:

-   `original_work`
-   `public_domain`
-   `cc0`
-   `cc_by`
-   `cc_by_sa`
-   `permission_granted`
-   `other_authorized`

For `other_authorized`, require an explanation and supporting
permission/source details where appropriate. Do not treat a generic
`free` label as a valid license.

The administrator must be able to reject a submission if its
distribution rights cannot be established.

### 5.3 Contributor declaration

Before submission, the uploader must affirm that:

-   They have the right to upload and distribute the material.
-   The material is not knowingly infringing another party's copyright.
-   The license and attribution information supplied is accurate.
-   They understand that FizioMidia may restrict or remove the resource
    following a valid complaint or moderation decision.

The declaration is evidence of the contributor's representation; it is
not a guarantee that the resource is lawful.

### 5.4 Copyright report reasons

Suggested controlled values:

-   `unauthorized_textbook`
-   `unauthorized_article`
-   `unauthorized_lecture_material`
-   `unauthorized_commercial_publication`
-   `trademark_or_other_ip`
-   `other`

The report form should collect:

-   Resource reference.
-   Reason.
-   Explanation.
-   Complainant name.
-   Contact email or other approved contact detail.
-   Optional evidence or source URL.
-   Declaration that the report is accurate and submitted in good faith.

Collect only information necessary to investigate the complaint.
Restrict access to complainant contact information to authorized
administrators.

### 5.5 Copyright report statuses

Suggested statuses:

-   `pending`
-   `under_review`
-   `resolved`
-   `rejected`

The associated resource should have an independent moderation/download
state. A complaint can trigger a temporary restriction without
prematurely deciding the legal merits of the complaint.

### 5.6 Copyright hold and takedown rules

-   A report must be associated with a specific resource.
-   Administrators can place a temporary download hold while
    investigating.
-   A resource under an active hold must not be downloadable.
-   Administrators can request further information.
-   Administrators can reject an unsupported complaint and restore
    availability where appropriate.
-   Administrators can remove a resource after a substantiated complaint
    or other valid moderation decision.
-   Every action must record the administrator, timestamp, reason and
    outcome.
-   Preserve a minimal database record of a removed resource and its
    moderation history.
-   Delete or disable the corresponding stored asset when required by
    the final decision and retention policy.
-   Do not permanently erase complaint/audit evidence merely by deleting
    the resource file.

This workflow is an operational baseline and must be reviewed against
applicable Tanzanian law and any other relevant jurisdiction before
launch. It is not a substitute for legal advice or a formal
notice-and-takedown policy.

------------------------------------------------------------------------

## 6. Recommended technical architecture

### 6.1 Reuse the existing stack

  -----------------------------------------------------------------------
  Layer                               Existing/recommended technology
  ----------------------------------- -----------------------------------
  Frontend                            Existing Vite + React

  Styling                             Existing Tailwind CSS + DaisyUI

  Icons                               Existing lucide-react

  Routing                             Existing `react-router` setup

  API client                          Existing centralized Axios instance

  Authentication                      Existing AuthContext/JWT

  Backend                             Existing Node.js + Express

  Database                            Existing MongoDB + Mongoose

  File storage                        Existing Cloudinary account

  Notifications                       Existing email/Socket.IO
                                      infrastructure where appropriate

  Hosting                             Existing Cloudflare Pages and
                                      Render deployment
  -----------------------------------------------------------------------

Do not add a new state-management library, storage provider, search
service or authentication provider for the MVP unless repository
inspection establishes a concrete need.

### 6.2 Storage recommendation

Use Cloudinary only after confirming the account supports the chosen
authenticated raw-file upload and delivery workflow.

Recommended controls:

-   Store documents as authenticated assets where supported by the
    account and SDK configuration.
-   Use the server-side Cloudinary SDK.
-   Never expose the Cloudinary API secret in frontend code.
-   Keep the storage asset identifier and delivery metadata on the
    server.
-   Generate time-limited signed delivery URLs only after authorization.
-   Never persist an expiring signed URL as the permanent resource URL.
-   Do not accept a Cloudinary URL or public ID from the browser as
    authoritative storage metadata.
-   Use server-generated storage identifiers.
-   Ensure deletion/disablement is coordinated with the database record
    and audit history.

**Important security limitation:** A signed URL can be shared while
valid, and a user can redistribute a file after downloading it. Expiry
and authenticated access reduce unauthorized access but cannot prevent
all copying. Do not promise DRM-like protection.

If Cloudinary authenticated raw-file delivery is not compatible with the
current account or configuration, pause implementation and verify the
supported delivery method. Do not silently fall back to permanently
public document URLs.

### 6.3 Avoid introducing Supabase in the first MVP

A second storage provider adds configuration, operational complexity and
another failure point. Reconsider alternative storage only if measured
Cloudinary quota, egress, reliability or document-delivery constraints
justify it.

------------------------------------------------------------------------

## 7. Proposed backend structure

Adapt this proposal to the actual repository conventions. Do not move or
rename existing files merely to match this example.

``` text
backend/
├── models/
│   ├── EducationResource.js
│   ├── ResourceRequest.js
│   └── CopyrightReport.js
├── controllers/
│   └── educationController.js
├── routes/
│   └── educationRoutes.js
├── middleware/
│   └── educationUpload.js
├── utils/
│   └── educationHelpers.js
└── server.js
```

Use the project's existing Cloudinary configuration/utilities rather
than creating a second Cloudinary client.

### 7.1 EducationResource model

Recommended fields:

  -----------------------------------------------------------------------
  Field                               Type/notes
  ----------------------------------- -----------------------------------
  `title`                             Required trimmed string

  `description`                       Required or optional according to
                                      UX; bounded length

  `category`                          Required enum

  `subCategory`                       Optional bounded string or
                                      controlled enum

  `language`                          `en` or `sw`

  `fileName`                          Sanitized original filename

  `fileType`                          Validated enum

  `fileSize`                          Number in bytes

  `storageProvider`                   For example, `cloudinary`

  `publicId`                          Server-owned Cloudinary identifier;
                                      private

  `assetId`                           Cloudinary asset identifier where
                                      available

  `resourceType`                      Server-owned Cloudinary resource
                                      type

  `uploadedBy`                        User ObjectId reference

  `uploaderRoleAtUpload`              Snapshot of role, not an
                                      authorization source

  `licenseType`                       Controlled enum

  `licenseUrl`                        Optional validated URL

  `licenseNotes`                      Optional bounded explanation

  `copyrightDeclaration`              Required Boolean

  `status`                            `pending`, `approved`, `rejected`,
                                      `suspended`, `removed`

  `downloadHold`                      Boolean, default false

  `downloadCount`                     Non-negative integer

  `approvedBy`                        Optional admin ObjectId

  `approvedAt`                        Optional Date

  `reviewedAt`                        Optional Date

  `rejectionReason`                   Private/admin-facing bounded string

  `removedAt`                         Optional Date

  `createdAt`, `updatedAt`            Mongoose timestamps
  -----------------------------------------------------------------------

Do not rely on `isDownloadable` alone. Derive download eligibility from
the resource status, active hold and any additional moderation
restrictions. If a denormalized flag is used for query performance,
update it atomically and validate consistency.

Suggested download eligibility:

``` text
authenticated user
AND resource exists
AND status == approved
AND downloadHold == false
AND storage asset is available
```

Admin access should follow explicit policy and should not accidentally
bypass a copyright hold.

### 7.2 ResourceRequest model

Suggested fields:

  Field                      Type/notes
  -------------------------- -------------------------------------------
  `title`                    Required
  `description`              Optional bounded details
  `category`                 Required category enum
  `preferredFormat`          Optional supported format
  `language`                 Optional language
  `requestedBy`              User ObjectId
  `status`                   `open`, `fulfilled`, `rejected`, `closed`
  `fulfilledResource`        Optional EducationResource ObjectId
  `adminNotes`               Private, admin-only
  `createdAt`, `updatedAt`   Mongoose timestamps

Requests must not encourage users to upload pirated copies. The UI
should explain that only legally distributable alternatives can be
supplied.

### 7.3 CopyrightReport model

Suggested fields:

  Field                      Type/notes
  -------------------------- ---------------------------------------------------
  `resource`                 Required EducationResource ObjectId
  `reportedBy`               User ObjectId when authenticated
  `reason`                   Controlled enum
  `explanation`              Required bounded text
  `complainantName`          Required
  `contactEmail`             Validated and access-restricted
  `evidenceUrl`              Optional validated URL
  `status`                   `pending`, `under_review`, `resolved`, `rejected`
  `reviewedBy`               Optional admin ObjectId
  `adminNotes`               Private
  `actionTaken`              Controlled value plus explanation
  `resolvedAt`               Optional Date
  `createdAt`, `updatedAt`   Mongoose timestamps

Avoid storing uploaded evidence files in the MVP unless a secure
evidence-storage workflow is designed. A URL and written explanation are
sufficient for the initial version.

### 7.4 Indexes

Add indexes based on real query patterns, for example:

-   Resource `{ status, category, createdAt }`.
-   Resource `{ uploadedBy, createdAt }`.
-   Resource text index on approved searchable metadata such as title
    and description, if appropriate.
-   Resource request `{ status, createdAt }`.
-   Resource request `{ requestedBy, createdAt }`.
-   Copyright report `{ status, createdAt }`.
-   Copyright report `{ resource, createdAt }`.

Use pagination. Do not return the entire library in one response.
Confirm that index definitions do not duplicate indexes already created
by schema field options.

------------------------------------------------------------------------

## 8. API design

All routes must use the existing API prefix:

``` text
/api/education
```

Use the project's existing response envelope, error handling, async
handler, validation and naming conventions. The examples below define
route intent; they do not mandate new response shapes if the existing
API uses a different convention.

### 8.1 Resource endpoints

  -------------------------------------------------------------------------------------------
  Method            Endpoint                              Access            Purpose
  ----------------- ------------------------------------- ----------------- -----------------
  `GET`             `/education/resources`                Public            Browse approved
                                                                            resource metadata

  `GET`             `/education/resources/:id`            Public            View approved
                                                                            resource details

  `POST`            `/education/resources`                Authenticated     Upload a resource

  `GET`             `/education/resources/:id/download`   Authenticated     Authorize and
                                                                            initiate download

  `GET`             `/education/my-resources`             Authenticated     List current
                                                                            user's uploads

  `DELETE`          `/education/resources/:id`            Owner/admin       Withdraw own
                                                                            resource or
                                                                            process admin
                                                                            removal according
                                                                            to policy
  -------------------------------------------------------------------------------------------

A public resource listing must never expose a downloadable private
storage URL.

### 8.2 Resource request endpoints

  ---------------------------------------------------------------------------------------
  Method            Endpoint                          Access            Purpose
  ----------------- --------------------------------- ----------------- -----------------
  `GET`             `/education/requests`             Authenticated     Browse open
                                                                        requests

  `POST`            `/education/requests`             Authenticated     Create a request

  `GET`             `/education/requests/mine`        Authenticated     List own requests

  `PATCH`           `/education/requests/:id/close`   Owner/admin       Close an open
                                                                        request
  ---------------------------------------------------------------------------------------

If open requests are intentionally public, make that a documented
product decision and expose only safe fields. The default MVP
recommendation is authenticated access.

### 8.3 Copyright report endpoints

  -----------------------------------------------------------------------------------------
  Method            Endpoint                            Access            Purpose
  ----------------- ----------------------------------- ----------------- -----------------
  `POST`            `/education/resources/:id/report`   Authenticated     Submit a report

  `GET`             `/education/my-reports`             Authenticated     List own
                                                                          submitted reports
  -----------------------------------------------------------------------------------------

Avoid exposing complainant contact information or internal investigation
notes to other users.

### 8.4 Admin endpoints

  --------------------------------------------------------------------------------------------------------------
  Method            Endpoint                                  Access            Purpose
  ----------------- ----------------------------------------- ----------------- --------------------------------
  `GET`             `/education/admin/resources`              Admin             List resources for moderation

  `PATCH`           `/education/admin/resources/:id/review`   Admin             Approve/reject/suspend/restore

  `GET`             `/education/admin/reports`                Admin             List copyright reports

  `PATCH`           `/education/admin/reports/:id`            Admin             Update report and decision

  `GET`             `/education/admin/requests`               Admin             Manage resource requests

  `PATCH`           `/education/admin/requests/:id`           Admin             Update request status
  --------------------------------------------------------------------------------------------------------------

Do not accept arbitrary status strings. Validate each transition against
an explicit state-transition policy.

### 8.5 API behaviour

-   Validate MongoDB IDs before database operations.
-   Return `404` for missing resources.
-   Return `401` for unauthenticated protected requests.
-   Return `403` for authenticated users without permission.
-   Return `400` for invalid input.
-   Return `413` for files exceeding the upload limit.
-   Return a safe server error for storage failures.
-   Use consistent project error messages and response envelopes.
-   Do not reveal whether a private asset exists to unauthorized
    callers.
-   Use server-side pagination with validated limits and sort fields.
-   Prevent mass assignment by explicitly selecting writable fields.
-   Never trust user-supplied `uploadedBy`, `status`, `approvedBy`,
    `downloadCount`, `publicId`, `assetId` or storage URLs.

------------------------------------------------------------------------

## 9. File upload and download security

### 9.1 Upload sequence

1.  Authenticate the user.
2.  Apply upload rate limiting.
3.  Parse one file with a strict Multer file-size limit.
4.  Validate the extension against the allowlist.
5.  Validate MIME type.
6.  Validate file signature/content where practical for each accepted
    format.
7.  Reject mismatched or ambiguous file types.
8.  Sanitize the display filename.
9.  Upload through the existing server-side Cloudinary configuration
    using the verified private/authenticated delivery strategy.
10. Create the MongoDB resource record with `pending` status.
11. If database creation fails, attempt to remove the uploaded asset.
12. Return safe resource metadata and pending-review status.

Do not rely on the file extension or browser-provided MIME type alone.
ZIP-based formats such as DOCX, PPTX and EPUB require careful format
validation; a superficial signature check is not sufficient for every
threat. Consider archive inspection and malware scanning before
publication.

### 9.2 Download sequence

1.  Authenticate the user.
2.  Validate the resource ID.
3.  Load the resource using server-owned database data.
4.  Verify it exists and is approved.
5.  Verify no active copyright hold or suspension exists.
6.  Verify the storage asset is still available.
7.  Generate a short-lived signed download URL server-side.
8.  Return or redirect to the signed URL using a consistent API
    contract.
9.  Record the download event/counter only after successful
    authorization.
10. Log operational failures without exposing secrets.

Do not accept a URL from the frontend and redirect to it. This can
create an open-redirect or unauthorized asset-access problem.

Consider whether a simple counter is sufficient for MVP analytics. If a
reliable unique download count is required, use a separate
download-event collection or an idempotency strategy rather than
assuming every request represents a completed file transfer.

### 9.3 Storage cleanup

Handle these failure cases:

-   Cloudinary upload succeeds but MongoDB creation fails.
-   MongoDB record exists but Cloudinary upload fails.
-   Admin removes a resource but asset deletion fails.
-   User withdraws a pending resource.
-   Resource is suspended while a previously generated signed URL
    remains valid.

For asset deletion failures, retain an auditable cleanup state and retry
through an admin/manual process. Do not report successful deletion when
the storage provider has not confirmed it.

A previously issued signed URL may remain usable until expiry. Keep URL
expiry short and use provider-side invalidation/deletion where
supported. This limitation must be reflected in the product's security
expectations.

------------------------------------------------------------------------

## 10. Frontend structure and user experience

Follow the actual frontend folder structure and conventions already
present in the repository. The following is a suggested logical
structure, not an instruction to reorganize existing code.

``` text
frontend/src/
├── pages/
│   └── education/
│       ├── EducationHome.jsx
│       ├── ResourceLibrary.jsx
│       ├── ResourceDetails.jsx
│       ├── UploadResource.jsx
│       ├── ResourceRequests.jsx
│       └── MyResources.jsx
├── components/
│   └── education/
│       ├── ResourceCard.jsx
│       ├── ResourceFilters.jsx
│       ├── ResourceSearch.jsx
│       ├── ResourceUploadForm.jsx
│       ├── ResourceRequestForm.jsx
│       ├── CopyrightReportModal.jsx
│       ├── ResourceStatusBadge.jsx
│       └── ResourceSkeleton.jsx
├── hooks/
│   └── useEducationResources.js
└── api/
    └── educationAPI.js
```

### 10.1 Education Hub landing page

Include:

-   Education Hub heading and short description.
-   Resource search.
-   Browse Library entry.
-   Upload Resource entry.
-   Request Resource entry.
-   My Contributions entry.
-   Browse-by-category links.
-   Recently approved resources.
-   Clear login prompts for guests attempting protected actions.

### 10.2 Resource library

Include:

-   Search by title and description/keywords.
-   Category and subcategory filters.
-   Language filter.
-   File-format filter.
-   Sort by newest, title and downloads.
-   Server-side pagination.
-   Loading skeletons.
-   Empty state.
-   Error state with retry.
-   Mobile-friendly filter controls.

Only approved resources should appear in the ordinary public library. Do
not reveal pending, rejected or removed resources in public search
results.

### 10.3 Resource details

Display:

-   Title and description.
-   Category and language.
-   File format and size.
-   Contributor attribution according to privacy policy.
-   License and source information.
-   Download action for authenticated users.
-   Report copyright concern action.
-   Appropriate unavailable/removed state.

Do not show private storage identifiers or permanent public storage
URLs.

### 10.4 Upload form

Fields:

-   File.
-   Title.
-   Description.
-   Category.
-   Subcategory where applicable.
-   Language.
-   License type.
-   License/source URL where applicable.
-   License notes where needed.
-   Required copyright declaration.

UX requirements:

-   Drag-and-drop and file-picker support.
-   Show accepted formats and maximum size before selection.
-   Show selected filename and size.
-   Client-side validation for usability, backed by server-side
    validation.
-   Upload progress.
-   Prevent accidental duplicate submission.
-   Clear success message explaining that the resource is pending
    review.
-   Useful error messages.
-   Mobile-safe layout.

### 10.5 Resource request form

Fields:

-   Requested title.
-   Description/details.
-   Category.
-   Preferred format.
-   Language.

Explain that requests are for lawful resources and do not guarantee that
a copyrighted work can be supplied.

### 10.6 My Contributions

Show:

-   Resource title.
-   Submission date.
-   Moderation status.
-   Rejection reason when appropriate and safe to disclose.
-   Download count for approved resources, if desired.
-   Withdraw action for eligible resources.

A user must not be able to alter approval status or moderation history.

### 10.7 Copyright report modal

Provide:

-   Complaint reason.
-   Explanation.
-   Contact details.
-   Optional evidence/source URL.
-   Accuracy/good-faith declaration.
-   Confirmation after submission.

Do not expose a complainant's contact details to the uploader.

### 10.8 Design and accessibility

Use the existing FizioMidia brand:

-   Caribbean Green: `#04D486`
-   Tufts Blue: `#3E84DC`
-   Alice Blue: `#EAF7FF`

Use the existing Tailwind/DaisyUI design conventions and Lucide React
icons. Maintain accessible contrast, clear focus states, labels,
keyboard access and readable mobile typography.

Use skeleton cards rather than blank loading regions. Keep layouts
responsive and avoid horizontal overflow.

### 10.9 Internationalization

Support English and Swahili using the existing i18next setup. Add
translation keys for:

-   Navigation.
-   Categories and formats.
-   Form labels and validation.
-   Upload and download messages.
-   Moderation statuses.
-   Copyright report reasons.
-   Empty/loading/error states.
-   Admin actions.

Do not hardcode user-facing strings in components if the existing
project convention uses translation files.

------------------------------------------------------------------------

## 11. Admin dashboard integration

Add an Education Management section to the existing admin dashboard. Do
not create a separate admin application.

### 11.1 Admin overview

Suggested live metrics:

-   Pending uploads.
-   Approved resources.
-   Suspended resources.
-   Open copyright reports.
-   Open resource requests.
-   Total authorized download events.

All metrics must come from real API data. Do not hardcode dashboard
counts.

### 11.2 Resource moderation

Admins need to:

-   View pending resource metadata.
-   Inspect license declarations and source information.
-   Approve a resource.
-   Reject a resource with a reason.
-   Suspend a previously approved resource.
-   Restore a suspended resource when appropriate.
-   Remove a resource.
-   Review uploader history where relevant.
-   See moderation history.

### 11.3 Copyright management

Admins need to:

-   List and filter reports.
-   Open the associated resource and report details.
-   Place or release a temporary download hold.
-   Mark a report under review.
-   Record investigation notes.
-   Resolve or reject the complaint.
-   Remove the resource where justified.
-   Record the decision, administrator and timestamps.

### 11.4 Resource request management

Admins need to:

-   View open requests.
-   Mark a request fulfilled and link an approved resource.
-   Reject or close inappropriate requests with a reason.
-   Avoid marking a request fulfilled unless the linked resource is
    approved and downloadable.

------------------------------------------------------------------------

## 12. Notifications

Reuse existing FizioMidia notification mechanisms. Do not introduce
another notification provider for the MVP.

Potential notification events:

  -----------------------------------------------------------------------
  Event                   Recipient               Suggested notification
  ----------------------- ----------------------- -----------------------
  Resource uploaded       Admins                  New resource awaiting
                                                  review

  Resource approved       Uploader                Resource approved

  Resource rejected       Uploader                Resource rejected with
                                                  reason

  Copyright report        Admins                  New copyright complaint
  submitted                                       

  Copyright decision made Reporter                Report status updated

  Resource removed        Uploader                Resource removed with
                                                  appropriate explanation

  Resource request        Requester               Requested resource is
  fulfilled                                       available
  -----------------------------------------------------------------------

Avoid sending notifications for every minor admin action. Respect
existing email preferences and notification conventions.

If Socket.IO is used, it should supplement---not replace---the
persistent database state and email notifications where required.

------------------------------------------------------------------------

## 13. Performance, abuse prevention and operational controls

Initial configurable limits:

  Control                   Initial recommendation
  ------------------------- ---------------------------
  Maximum upload size       15 MB
  Files per resource        1
  Upload concurrency        1 per request
  Resource list page size   12--20
  Maximum page size         50
  Upload rate               Small per-user/IP limit
  Copyright reports         Rate-limited
  Resource requests         Rate-limited
  Download authorization    Required on every request

The exact rate limits must be aligned with the existing Express
rate-limit configuration and any Redis-backed limiter already in the
project. Avoid creating conflicting duplicate limiters.

Additional requirements:

-   Use server-side pagination.
-   Add database indexes for actual query patterns.
-   Validate and cap search strings.
-   Restrict sort fields to an allowlist.
-   Prevent NoSQL operator injection by validating query inputs.
-   Avoid unbounded regex searches.
-   Keep API responses small.
-   Do not fetch the full resource collection on page load.
-   Log security-relevant events.
-   Monitor Cloudinary storage and bandwidth quotas.
-   Add a cleanup procedure for orphaned assets.
-   Do not store document binary data in MongoDB.

------------------------------------------------------------------------

## 14. Testing and acceptance criteria

The module is not production-ready until the following cases pass.

### 14.1 Authentication and permissions

-   [ ] Guest can browse public resource metadata.
-   [ ] Guest cannot upload.
-   [ ] Guest cannot download.
-   [ ] Guest cannot submit a resource request or copyright report.
-   [ ] Authenticated member can submit an upload.
-   [ ] Pending physiotherapist can use permissions according to the
    defined matrix.
-   [ ] Approved physiotherapist can use permissions according to the
    defined matrix.
-   [ ] Only admins can moderate resources and reports.
-   [ ] A user cannot modify another user's resource.
-   [ ] A user cannot modify another user's request.
-   [ ] A user cannot view another complainant's private contact
    details.

### 14.2 Upload

-   [ ] Valid PDF uploads successfully.
-   [ ] Valid DOCX uploads successfully.
-   [ ] Valid PPTX uploads successfully.
-   [ ] Valid EPUB uploads successfully.
-   [ ] Unsupported extension is rejected.
-   [ ] MIME mismatch is rejected.
-   [ ] Invalid or disguised file content is rejected.
-   [ ] Oversized file is rejected server-side.
-   [ ] Empty or malformed metadata is rejected.
-   [ ] Copyright declaration is required.
-   [ ] New resource is saved as pending.
-   [ ] Pending resource does not appear in the public library.
-   [ ] Pending resource cannot be downloaded.
-   [ ] Cloudinary failure is handled safely.
-   [ ] MongoDB failure after upload triggers storage cleanup or an
    auditable cleanup state.

### 14.3 Download

-   [ ] Authenticated user can download an approved resource.
-   [ ] Guest cannot download.
-   [ ] Pending resource cannot download.
-   [ ] Rejected resource cannot download.
-   [ ] Suspended resource cannot download.
-   [ ] Removed resource cannot download.
-   [ ] Resource under copyright hold cannot download.
-   [ ] Expired signed URL no longer works according to provider
    behaviour.
-   [ ] Frontend cannot supply an arbitrary storage URL.
-   [ ] Download count/event is updated only after authorization.
-   [ ] Storage failure does not expose credentials or internal errors.

### 14.4 Resource requests

-   [ ] Authenticated user can create a request.
-   [ ] Invalid request data is rejected.
-   [ ] User can view their own requests.
-   [ ] User can close their own eligible request.
-   [ ] Admin can manage requests.
-   [ ] Fulfilled request links only to an approved resource.

### 14.5 Copyright reports

-   [ ] Authenticated user can submit a report.
-   [ ] Invalid or incomplete report is rejected.
-   [ ] Report is visible to authorized admins.
-   [ ] Admin can place a download hold.
-   [ ] Resource under hold cannot be downloaded.
-   [ ] Admin can resolve or reject a report.
-   [ ] Admin decision is recorded in audit history.
-   [ ] Removal disables future download authorization.
-   [ ] Complainant contact information is not exposed publicly.

### 14.6 Frontend and regression

-   [ ] Mobile layout works without horizontal overflow.
-   [ ] Search and filters work with server pagination.
-   [ ] Skeleton, empty, success and error states are present.
-   [ ] English and Swahili translations are present.
-   [ ] Forms are accessible and keyboard usable.
-   [ ] Existing authentication still works.
-   [ ] Existing appointments still work.
-   [ ] Existing messaging and Socket.IO still work.
-   [ ] Existing clinic and physiotherapist features still work.
-   [ ] Existing Cloudinary image uploads still work.
-   [ ] Existing admin dashboard sections still work.

------------------------------------------------------------------------

## 15. Implementation phases

Implement incrementally. Each phase should be tested before the next
phase is merged.

  -----------------------------------------------------------------------
  Phase                   Work                    Definition of done
  ----------------------- ----------------------- -----------------------
  0                       Repository inspection   Actual conventions,
                                                  auth, Cloudinary and
                                                  admin patterns
                                                  documented

  1                       Schemas and indexes     Models validate and
                                                  index correctly

  2                       Upload pipeline         Secure validated upload
                                                  and cleanup

  3                       Resource APIs           Listing, details,
                                                  pagination and
                                                  ownership

  4                       Download authorization  Private signed delivery
                                                  and hold enforcement

  5                       Library UI              Search, filters,
                                                  pagination and details

  6                       Upload UI               Complete upload and
                                                  pending-review workflow

  7                       Requests                Create, list, close and
                                                  admin management

  8                       Copyright               Reporting, holds,
                                                  decisions and removal

  9                       Admin UI                Resource, report and
                                                  request moderation

  10                      Regression/security     Acceptance suite passes

  11                      Deployment              Production environment
                                                  verified and monitored
  -----------------------------------------------------------------------

### Phase 0: Mandatory repository inspection

Before writing code, inspect:

-   Existing backend folder structure.
-   Existing frontend folder structure.
-   User model and exact role values.
-   Authentication middleware and admin middleware.
-   Existing API response/error conventions.
-   Existing Multer configuration.
-   Existing Cloudinary configuration and upload utilities.
-   Existing file deletion utilities.
-   Existing Axios API instance and interceptors.
-   Existing route registration and navigation.
-   Existing admin dashboard structure.
-   Existing i18next translation files.
-   Existing toast and loading/skeleton conventions.
-   Existing rate limiting and Redis configuration.
-   Existing logging/audit patterns.
-   Existing tests and scripts.

Do not guess filenames, imports, aliases, middleware exports, API
response formats or route conventions.

### Phase 1: Backend foundation

-   Add the three Mongoose models.
-   Add schema validation and indexes.
-   Add controlled enums/constants.
-   Add routes and controller skeletons.
-   Reuse existing middleware and utilities.
-   Test model validation and authorization.

### Phase 2: Secure upload and storage

-   Implement file filtering and size limits.
-   Validate file content.
-   Upload to authenticated Cloudinary storage.
-   Create pending resource records.
-   Implement failure cleanup.
-   Test supported and malicious/mismatched file cases.

### Phase 3: Resource access

-   Implement public approved-resource listing.
-   Implement resource details.
-   Implement server-side filters and pagination.
-   Implement protected signed downloads.
-   Test copyright holds and every moderation status.

### Phase 4: Frontend library and upload

-   Add Education Hub navigation and pages.
-   Add resource cards, filters and search.
-   Add resource details.
-   Add upload form and progress.
-   Add My Contributions.
-   Integrate translations and loading/error states.

### Phase 5: Requests and copyright

-   Add request creation and management.
-   Add copyright report form.
-   Add admin report review.
-   Implement download holds and final actions.
-   Add audit history.

### Phase 6: Admin, regression and production

-   Integrate moderation into the existing admin dashboard.
-   Add live statistics.
-   Run security and regression tests.
-   Verify production environment variables and Cloudinary behaviour.
-   Deploy incrementally.
-   Monitor errors, storage quota and download traffic.

------------------------------------------------------------------------

## 16. Deployment and environment configuration

Reuse existing environment variables wherever possible.

Potential existing configuration:

-   `MONGODB_URI`
-   `CLOUDINARY_CLOUD_NAME`
-   `CLOUDINARY_API_KEY`
-   `CLOUDINARY_API_SECRET`
-   Existing API URL and frontend environment configuration.

Only add new environment variables when necessary. Do not duplicate
Cloudinary credentials under new names without a clear reason.

Possible configurable variables:

``` env
EDUCATION_MAX_FILE_SIZE_MB=15
EDUCATION_DOWNLOAD_URL_TTL_SECONDS=300
EDUCATION_DEFAULT_PAGE_SIZE=20
EDUCATION_MAX_PAGE_SIZE=50
```

These names are proposals. Follow the existing project's environment
naming and validation conventions. Ensure production configuration is
validated at startup.

Never commit secrets to Git or expose server secrets through Vite
`VITE_` variables.

### Production deployment checklist

-   [ ] Confirm Cloudinary authenticated raw upload/delivery works.
-   [ ] Confirm file size and account quotas.
-   [ ] Configure production environment variables.
-   [ ] Confirm frontend calls the production API domain.
-   [ ] Confirm CORS permits the production frontend.
-   [ ] Confirm authentication cookies/headers work as currently
    designed.
-   [ ] Confirm upload and download rate limits.
-   [ ] Confirm MongoDB indexes.
-   [ ] Confirm admin route protection.
-   [ ] Confirm no permanent public file URLs are exposed.
-   [ ] Confirm error logs do not contain secrets or private complaint
    details.
-   [ ] Confirm storage cleanup procedure.
-   [ ] Confirm rollback procedure.
-   [ ] Verify existing platform features after deployment.

------------------------------------------------------------------------

## 17. Monitoring and maintenance

Track:

-   Number of uploads.
-   Pending review count and review age.
-   Approved/rejected/suspended/removed counts.
-   Authorized download events.
-   Copyright report volume and resolution time.
-   Resource request volume and fulfillment.
-   Cloudinary storage and bandwidth use.
-   Upload and download failure rates.
-   Orphaned assets and cleanup failures.

Do not collect unnecessary personal data or expose operational metrics
publicly.

Set a periodic admin review process for pending uploads and unresolved
copyright reports. Establish a retention policy for removed-resource
records, complaints and audit history.

------------------------------------------------------------------------

## 18. MVP completion definition

The Education Resources MVP is ready for production only when:

1.  Authenticated users can submit supported educational files.
2.  Uploads are securely validated and stored.
3.  New submissions remain private/pending until approval.
4.  Approved resources appear in the searchable library.
5.  Only authorized authenticated users can initiate downloads.
6.  A copyright hold or non-approved status blocks downloads.
7.  Users can request missing resources.
8.  Users can report suspected copyright infringement.
9.  Admins can review, approve, reject, suspend, restore and remove
    resources.
10. Admin decisions and copyright actions are auditable.
11. The module works on mobile and supports English and Swahili.
12. Existing FizioMidia functionality remains unaffected.
13. Storage and download behaviour has been verified in the production
    Cloudinary configuration.
14. Security, regression and acceptance tests pass.

------------------------------------------------------------------------

## 19. Development rules for AI coding agents and contributors

These rules are mandatory when implementing this specification in the
existing FizioMidia repository.

### Preserve existing functionality

-   Do not rewrite the application.
-   Do not replace existing authentication, API clients, routing,
    Cloudinary setup or admin architecture.
-   Do not remove existing logic to simplify implementation.
-   Do not change unrelated features.
-   Do not duplicate utilities that already exist.
-   Keep changes focused and incremental.

### Inspect before editing

-   Read the actual files before modifying them.
-   Trace existing imports, callers and route registration.
-   Confirm model conventions and exact role values.
-   Confirm the actual API response structure.
-   Confirm frontend component and hook patterns.
-   Confirm the Cloudinary SDK version and existing upload approach.
-   Do not invent missing project APIs or middleware.

### Coding quality

-   Use the existing JavaScript module and error-handling conventions.
-   Use the existing async handler where appropriate.
-   Keep controllers focused.
-   Keep validation and file processing reusable.
-   Use explicit writable fields rather than mass assignment.
-   Use centralized API calls in the frontend.
-   Reuse existing authentication context.
-   Use existing toast, skeleton and translation conventions.
-   Handle loading, empty, error and success states.
-   Keep mobile responsiveness.
-   Add tests for new behaviour and security boundaries.

### Git and release workflow

-   Work on a dedicated feature branch.
-   Implement one phase at a time.
-   Run relevant backend and frontend tests after each phase.
-   Run lint/build checks using the actual project scripts.
-   Review the diff for unrelated changes.
-   Do not merge to `main` while tests are failing.
-   Merge only after acceptance criteria pass.
-   Deploy and verify production behaviour after merging.

### Required completion report for each implementation phase

The developer or coding agent must report:

1.  Files created.
2.  Files modified.
3.  Existing project patterns reused.
4.  API endpoints added or changed.
5.  Security controls implemented.
6.  Tests executed and their results.
7.  Known limitations or outstanding work.
8.  Confirmation that unrelated functionality was not intentionally
    changed.

------------------------------------------------------------------------

## 20. Final architectural decisions

  -----------------------------------------------------------------------
  Decision                            MVP choice
  ----------------------------------- -----------------------------------
  Application architecture            Existing FizioMidia MERN
                                      application

  Storage                             Existing Cloudinary account,
                                      authenticated assets

  Database models                     `EducationResource`,
                                      `ResourceRequest`,
                                      `CopyrightReport`

  Access                              Existing FizioMidia roles and JWT
                                      authentication

  Upload approval                     Mandatory admin review

  Download                            Authenticated, server-authorized,
                                      short-lived signed delivery

  Copyright                           Report, temporary hold,
                                      investigation, decision and audit

  Resource requests                   Free community requests

  User interface                      Existing React/Tailwind/DaisyUI

  Languages                           English and Swahili

  Initial file limit                  15 MB

  Pricing                             Free

  New infrastructure                  None planned for initial MVP
  -----------------------------------------------------------------------

**Final recommendation:** Build the Education Resources module as a
secure, moderated digital library using FizioMidia's existing
infrastructure. Prioritize file security, lawful distribution, download
authorization and admin moderation before adding optional community
features. This provides a practical production foundation without
turning the MVP into a costly or unnecessarily complex platform.

------------------------------------------------------------------------

*End of specification.*