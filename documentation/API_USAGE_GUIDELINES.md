# API Usage Guidelines

This document provides a comprehensive mapping of API functions to features in the FizioMidia platform. It helps developers understand which API endpoints are used for specific functionalities.

## Table of Contents
- [Authentication & Authorization](#authentication--authorization)
- [User Management](#user-management)
- [Profile Management](#profile-management)
- [Appointment System](#appointment-system)
- [Messaging System](#messaging-system)
- [Forum System](#forum-system)
- [Clinic Management](#clinic-management)
- [Promotions & Sponsorships](#promotions--sponsorships)
- [Reviews & Ratings](#reviews--ratings)
- [Notifications](#notifications)
- [Location Services](#location-services)
- [Admin Functions](#admin-functions)
- [Contact & Support](#contact--support)

---

## Authentication & Authorization

### Backend Routes: `/api/auth`
### Frontend API: `frontend/src/api/auth.js`

| Feature | API Endpoint | Method | Frontend Function | Description |
|---------|-------------|--------|-------------------|-------------|
| **User Registration** | `/api/auth/register` | POST | `registerUser(data)` | Register new user with email, password, role |
| **User Login** | `/api/auth/login` | POST | `loginUser(data)` | Authenticate user and receive JWT tokens |
| **Token Refresh** | `/api/auth/refresh` | POST | (Auto-handled) | Refresh expired access token |
| **User Logout** | `/api/auth/logout` | POST | `logoutUser()` | Invalidate refresh token |
| **Get Current User** | `/api/auth/me` | GET | `fetchCurrentUser()` | Get authenticated user details |
| **Email Verification** | `/api/auth/verify-email/:token` | GET | `verifyEmail(token)` | Verify user email address |
| **Forgot Password** | `/api/auth/forgot-password` | POST | `forgotPassword(email)` | Request password reset email |
| **Reset Password** | `/api/auth/reset-password/:token` | POST | `resetPassword(token, newPassword)` | Reset password with token |

**Rate Limiting:**
- Register: 5 requests per hour
- Login: 10 requests per hour
- Password reset: 3 requests per hour

---

## User Management

### Backend Routes: `/api/users`
### Frontend API: `frontend/src/api/users.js`

| Feature | API Endpoint | Method | Frontend Function | Description |
|---------|-------------|--------|-------------------|-------------|
| **Get All Users** | `/api/users` | GET | `listUsers()` | List all users (for messaging) |
| **Search Physiotherapists** | `/api/users/search/physiotherapists` | GET | - | Search PTs by criteria |
| **Get User Profile** | `/api/users/profile` | GET | `getProfile()` | Get current user's profile |
| **Update Profile** | `/api/users/profile` | PUT | `updateProfile(data)` | Update user profile (supports file upload) |
| **Update Language** | `/api/users/update-language` | PUT | `updateLanguage(language)` | Update user's preferred language |
| **Get User by ID** | `/api/users/:id` | GET | `getUserById(id)` | Get public profile by user ID |
| **Get User Notifications** | `/api/users/:id/notifications` | GET | - | Get notifications for specific user |
| **Mark Notification Read** | `/api/users/:id/notifications/read` | PUT | - | Mark specific notification as read |
| **Save PT** | `/api/users/save-pt/:ptId` | POST | `toggleSavePT(ptId)` | Save/unsave PT to member's list |
| **Get Saved PTs** | `/api/users/:id/saved-pts` | GET | `getSavedPTsByMember(memberId)` | Get member's saved PTs |
| **Member Dashboard** | `/api/users/dashboard` | GET | - | Get consolidated dashboard data |

**Authentication:** All routes require authentication except public profile access.

---

## Profile Management

### Backend Routes: `/api/users` (Profile endpoints)
### Frontend API: `frontend/src/api/users.js`

| Feature | API Endpoint | Method | Frontend Function | Description |
|---------|-------------|--------|-------------------|-------------|
| **Get Current Profile** | `/api/users/profile` | GET | `getProfile()` | Get logged-in user's profile |
| **Update Profile** | `/api/users/profile` | PUT | `updateProfile(data)` | Update profile with optional file uploads |
| **Get Public Profile** | `/api/users/:id` | GET | `getUserById(id)` | Get any user's public profile |

**File Upload Support:**
- Avatar image
- License document
- Gallery images (up to 10)
- Image size upload limit 2MB

---

## Appointment System

### Backend Routes: `/api/appointments`
### Frontend API: `frontend/src/api/appointments.js`

| Feature | API Endpoint | Method | Frontend Function | Description |
|---------|-------------|--------|-------------------|-------------|
| **Request Appointment** | `/api/appointments` | POST | `requestAppointment(data)` | Members request new appointment |
| **Get All Appointments** | `/api/appointments` | GET | `fetchAppointments(role)` | PTs/admin view appointments |
| **Get Member Appointments** | `/api/appointments/member/:id` | GET | `getAppointmentsByMember(memberId)` | Get appointments for specific member |
| **Get Appointment by ID** | `/api/appointments/:id` | GET | `fetchAppointmentById(id)` | Get single appointment details |
| **Update Status** | `/api/appointments/:id/status` | PATCH | `updateAppointmentStatus(id, status, ...)` | PT/admin update appointment status |
| **Delete Appointment** | `/api/appointments/:id` | DELETE | `deleteAppointment(id)` | Delete appointment |

**Status Flow:** `pending` → `scheduled` → `completed`/`cancelled`

**Role Permissions:**
- Members: Can create and delete own appointments
- Physiotherapists: Can view and update status
- Admins: Full access to all appointments

---

## Messaging System

### Backend Routes: `/api/messages`, `/api/conversations`
### Frontend API: `frontend/src/api/messages.js`

| Feature | API Endpoint | Method | Frontend Function | Description |
|---------|-------------|--------|-------------------|-------------|
| **Send Message** | `/api/messages` | POST | `sendMessage(data)` | Send message in conversation |
| **Get Messages** | `/api/messages/:chatId` | GET | `getMessages(chatId)` | Get all messages in chat |
| **Delete Message** | `/api/messages/:id` | DELETE | `deleteMessage(messageId)` | Delete specific message |
| **Get Conversations** | `/api/conversations` | GET | `getConversations()` | Get user's conversations |
| **Get Conversation with User** | `/api/conversations/user/:id` | GET | `getConversationByUser(userId)` | Get conversation with specific user |
| **Create Conversation** | `/api/conversations` | POST | `createConversation(receiverId)` | Start new conversation |
| **Mark as Read** | `/api/conversations/:id/mark-read` | PUT | `markConversationAsRead(conversationId)` | Mark conversation as read |
| **Delete Conversation** | `/api/conversations/:id` | DELETE | `deleteConversation(conversationId)` | Delete entire conversation |

**Real-time:** Uses Socket.io for real-time message delivery

**Rate Limiting:** 100 messages per minute per user

---

## Forum System

### Backend Routes: `/api/forum`
### Frontend API: `frontend/src/api/forum.js`

| Feature | API Endpoint | Method | Frontend Function | Description |
|---------|-------------|--------|-------------------|-------------|
| **Get All Subs** | `/api/forum/subs` | GET | `fetchForumSubs()` | Get all forum subforums |
| **Get Sub by ID** | `/api/forum/subs/:id` | GET | `fetchSubById(id)` | Get specific subforum |
| **Get Sub Posts** | `/api/forum/subs/:subId/posts` | GET | `fetchPostsInSub(subId)` | Get posts in subforum |
| **Get Post by ID** | `/api/forum/posts/:id` | GET | `fetchPostById(id)` | Get specific post |
| **Vote on Post** | `/api/forum/posts/:id/vote` | POST | `votePost(postId, voteType)` | Upvote/downvote post |
| **Create Sub** | `/api/forum/subs` | POST | `createSub(data)` | Create new subforum (PT/Admin) |
| **Create Post** | `/api/forum/posts` | POST | `createPost(data)` | Create new post with optional image |
| **Update Post** | `/api/forum/posts/:id` | PUT | `updatePost(postId, data)` | Edit existing post |
| **Delete Post** | `/api/forum/posts/:id` | DELETE | - | Delete post |
| **Get Comments** | `/api/forum/posts/:id/comments` | GET | `fetchComments(postId)` | Get post comments |
| **Add Comment** | `/api/forum/posts/:id/comments` | POST | `addComment(postId, content)` | Add comment to post |
| **Update Comment** | `/api/forum/posts/:id/comments/:commentId` | PUT | - | Edit comment |
| **Delete Comment** | `/api/forum/posts/:id/comments/:commentId` | DELETE | `deleteComment(commentId)` | Delete comment |
| **Get My Subs** | `/api/forum/my-subs` | GET | - | Get user's subforums |
| **Pin Post** | `/api/forum/posts/:subId/pin` | PUT | `togglePostPin(postId, pinned)` | Pin/unpin post |
| **Update Sub** | `/api/forum/subs/:subId` | PUT | `updateSub(subId, data)` | Edit subforum |
| **Get Mod Request Status** | `/api/forum/subs/:subId/my-mod-request` | GET | `getModRequestStatus(subId)` | Check moderator request |
| **Request Moderator** | `/api/forum/subs/:subId/mod-requests` | POST | `requestModeratorStatus(subId)` | Request moderator role |
| **Get Mod Requests** | `/api/forum/subs/:subId/mod-requests` | GET | - | List moderator requests |
| **Update Mod Request** | `/api/forum/subs/:subId/mod-requests/:requestId` | PATCH | - | Update moderator request |

**Rate Limiting:**
- Forum posts: 10 per hour
- Comments: 30 per hour

**Permissions:**
- Public: Read access to subs, posts, comments
- Authenticated: Vote, create posts, comment
- PT/Admin: Create subs, moderate content

---

## Clinic Management

### Backend Routes: `/api/clinics`
### Frontend API: `frontend/src/api/clinics.js`

| Feature | API Endpoint | Method | Frontend Function | Description |
|---------|-------------|--------|-------------------|-------------|
| **Get All Clinics** | `/api/clinics` | GET | - | Get all clinics (admin) |
| **Get Clinic by ID** | `/api/clinics/:id` | GET | - | Get specific clinic details |
| **Get Clinics by User** | `/api/clinics/user/:userId` | GET | - | Get clinics for specific user |
| **Get Clinics Owned by PT** | `/api/clinics/owned-by-pt/:ptId` | GET | - | Get clinics owned by PT |
| **Get Clinics PT Works At** | `/api/clinics/pt-work/:ptId` | GET | - | Get clinics where PT works |
| **Create Clinic** | `/api/clinics` | POST | - | Create new clinic with image |
| **Update Clinic** | `/api/clinics/:id` | PUT | - | Update clinic details |
| **Delete Clinic** | `/api/clinics/:id` | DELETE | - | Delete clinic |
| **Create PT Request** | `/api/clinics/:clinicId/requests` | POST | - | Clinic owner invites PT |
| **Get PT Requests** | `/api/clinics/:clinicId/requests` | GET | - | Get clinic's PT requests |
| **Get My PT Requests** | `/api/clinics/my-requests` | GET | - | Get PT's pending requests |
| **Respond to PT Request** | `/api/clinics/requests/:requestId/respond` | PUT | - | PT accepts/declines invitation |
| **Cancel PT Request** | `/api/clinics/requests/:requestId` | DELETE | - | Cancel pending request |

**File Upload:** Clinic logo/image

---

## Promotions & Sponsorships

### Backend Routes: `/api/promotions`
### Frontend API: `frontend/src/api/promotions.js`

### PT Promotions

| Feature | API Endpoint | Method | Frontend Function | Description |
|---------|-------------|--------|-------------------|-------------|
| **Create PT Promotion** | `/api/promotions/pt/create` | POST | - | Create PT promotion with Stripe |
| **Get Active PT Promotions** | `/api/promotions/pt` | GET | - | Get currently active PT promotions |
| **Get PT Promotion by ID** | `/api/promotions/pt/:id` | GET | - | Get specific PT promotion |
| **Stripe Webhook** | `/api/promotions/pt/webhook` | POST | - | Handle Stripe payment events |

### Clinic Promotions

| Feature | API Endpoint | Method | Frontend Function | Description |
|---------|-------------|--------|-------------------|-------------|
| **Get Active Clinic Promotions** | `/api/promotions/clinic` | GET | - | Get currently active clinic promotions |
| **Get My Clinic Promotions** | `/api/promotions/clinic/my-promotions` | GET | - | Get user's clinic promotions |
| **Create Clinic Promotion** | `/api/promotions/clinic` | POST | - | Create clinic promotion |
| **Get Clinic Promotion by ID** | `/api/promotions/clinic/:id` | GET | - | Get specific clinic promotion |
| **Update Clinic Promotion** | `/api/promotions/clinic/:id` | PUT | - | Update clinic promotion |
| **Delete Clinic Promotion** | `/api/promotions/clinic/:id` | DELETE | - | Delete clinic promotion |
| **Track Click** | `/api/promotions/clinic/:id/click` | POST | - | Track promotion click |
| **Track Impression** | `/api/promotions/clinic/:id/impression` | POST | - | Track promotion impression |

**Payment Integration:** Stripe for PT promotions

**Analytics:** Click and impression tracking for clinic promotions

---

## Sponsored Products

### Backend Routes: `/api/sponsored-products`
### Frontend API: `frontend/src/api/promotions.js` (sponsored products section)

| Feature | API Endpoint | Method | Frontend Function | Description |
|---------|-------------|--------|-------------------|-------------|
| **Get Sponsored Products** | `/api/sponsored-products` | GET | - | Get all active sponsored products |
| **Create Sponsored Product** | `/api/sponsored-products` | POST | - | Create new sponsored product |
| **Update Sponsored Product** | `/api/sponsored-products/:id` | PUT | - | Update product details |
| **Delete Sponsored Product** | `/api/sponsored-products/:id` | DELETE | - | Delete sponsored product |

**File Upload:** Product images

---

## Reviews & Ratings

### Backend Routes: `/api/reviews`
### Frontend API: `frontend/src/api/reviews.js`

| Feature | API Endpoint | Method | Frontend Function | Description |
|---------|-------------|--------|-------------------|-------------|
| **Get My Reviews** | `/api/reviews/my-reviews` | GET | - | Get current user's reviews |
| **Create Review** | `/api/reviews` | POST | - | Create new review |
| **Get Clinic Reviews** | `/api/reviews/clinic/:clinicId` | GET | - | Get reviews for specific clinic |
| **Get Physiotherapist Reviews** | `/api/reviews/physiotherapist/:physiotherapistId` | GET | - | Get reviews for specific PT |
| **Update Review** | `/api/reviews/:reviewId` | PUT | - | Update existing review |
| **Delete Review** | `/api/reviews/:reviewId` | DELETE | - | Delete review |

**Authentication:** All routes require authentication

---

## Notifications

### Backend Routes: `/api/notifications`
### Frontend API: `frontend/src/api/notifications.js`

| Feature | API Endpoint | Method | Frontend Function | Description |
|---------|-------------|--------|-------------------|-------------|
| **Get Notifications** | `/api/notifications` | GET | - | Get user notifications with pagination |
| **Get Unread Count** | `/api/notifications/unread/count` | GET | - | Get unread notification count |
| **Mark as Read** | `/api/notifications/:notificationId/read` | PUT | - | Mark specific notification as read |
| **Mark All Read** | `/api/notifications/read-all` | PATCH | - | Mark all notifications as read |
| **Delete Notification** | `/api/notifications/:notificationId` | DELETE | - | Delete specific notification |
| **Clear All Notifications** | `/api/notifications` | DELETE | - | Clear all user notifications |
| **Send System Notification** | `/api/notifications/send-system` | POST | - | Admin sends system notification |

**Authentication:** All routes require authentication

**Real-time:** Socket.io integration for instant notifications

---

## Location Services

### Backend Routes: `/api/location`
### Frontend API: `frontend/src/api/location.js`

| Feature | API Endpoint | Method | Frontend Function | Description |
|---------|-------------|--------|-------------------|-------------|
| **Get Regions** | `/api/location/regions` | GET | - | Get all regions |
| **Get Districts** | `/api/location/districts/:region` | GET | - | Get districts in region |
| **Get Wards** | `/api/location/wards/:district` | GET | - | Get wards in district |
| **Get Streets** | `/api/location/streets/:ward` | GET | - | Get streets in ward |

**Public Access:** All location endpoints are public

**Hierarchy:** Region → District → Ward → Street

---

## Admin Functions

### Backend Routes: `/api/admin`
### Frontend API: `frontend/src/api/admin.js`

### User Management

| Feature | API Endpoint | Method | Frontend Function | Description |
|---------|-------------|--------|-------------------|-------------|
| **List Users** | `/api/admin/users` | GET | - | Get all users with pagination |
| **Get User Details** | `/api/admin/users/:id` | GET | - | Get detailed user information |
| **Update User Role** | `/api/admin/users/:id/role` | PUT | - | Change user role |
| **Update License Status** | `/api/admin/users/:id/license` | PUT | - | Approve/reject license |
| **Send Email to User** | `/api/admin/users/:id/email` | POST | - | Send email to specific user |

### Appointment Management

| Feature | API Endpoint | Method | Frontend Function | Description |
|---------|-------------|--------|-------------------|-------------|
| **Get All Appointments** | `/api/admin/appointments` | GET | - | Get all appointments |
| **Get Appointment Details** | `/api/admin/appointments/:id` | GET | - | Get appointment details |
| **Update Appointment** | `/api/admin/appointments/:id` | PUT | - | Update appointment |
| **Delete Appointment** | `/api/admin/appointments/:id` | DELETE | - | Delete appointment |

### Promotion Management

| Feature | API Endpoint | Method | Frontend Function | Description |
|---------|-------------|--------|-------------------|-------------|
| **Get All PT Promotions** | `/api/admin/promotions` | GET | - | Get all PT promotions |
| **Get PT Promotion** | `/api/admin/promotions/:id` | GET | - | Get specific PT promotion |
| **Update PT Promotion** | `/api/admin/promotions/:id` | PUT | - | Update PT promotion |
| **Delete PT Promotion** | `/api/admin/promotions/:id` | DELETE | - | Delete PT promotion |

### Clinic Promotion Management

| Feature | API Endpoint | Method | Frontend Function | Description |
|---------|-------------|--------|-------------------|-------------|
| **Get All Clinic Promotions** | `/api/admin/clinic-promotions` | GET | - | Get all clinic promotions |
| **Get Clinic Promotion** | `/api/admin/clinic-promotions/:id` | GET | - | Get specific clinic promotion |
| **Update Clinic Promotion** | `/api/admin/clinic-promotions/:id` | PUT | - | Update clinic promotion |
| **Delete Clinic Promotion** | `/api/admin/clinic-promotions/:id` | DELETE | - | Delete clinic promotion |
| **Approve Clinic Promotion** | `/api/admin/clinic-promotions/:id/approve` | PATCH | - | Approve clinic promotion |
| **Reject Clinic Promotion** | `/api/admin/clinic-promotions/:id/reject` | PATCH | - | Reject clinic promotion |
| **Expire Clinic Promotion** | `/api/admin/clinic-promotions/:id/expire` | PATCH | - | Manually expire promotion |
| **Set Priority** | `/api/admin/clinic-promotions/:id/priority` | PATCH | - | Set promotion priority |
| **Get Analytics** | `/api/admin/clinic-promotions/:id/analytics` | GET | - | Get promotion analytics |

### Sponsored Product Management

| Feature | API Endpoint | Method | Frontend Function | Description |
|---------|-------------|--------|-------------------|-------------|
| **Get All Sponsored Products** | `/api/admin/sponsored-products` | GET | - | Get all sponsored products |
| **Create Sponsored Product** | `/api/admin/sponsored-products` | POST | - | Create sponsored product |
| **Get Sponsored Product** | `/api/admin/sponsored-products/:id` | GET | - | Get specific product |
| **Update Sponsored Product** | `/api/admin/sponsored-products/:id` | PUT | - | Update product |
| **Delete Sponsored Product** | `/api/admin/sponsored-products/:id` | DELETE | - | Delete product |

### Forum Sub Sponsorship

| Feature | API Endpoint | Method | Frontend Function | Description |
|---------|-------------|--------|-------------------|-------------|
| **Get Sub Sponsorship** | `/api/admin/subs/:id` | GET | - | Get sub sponsorship details |
| **Update Sponsorship** | `/api/admin/subs/:id/sponsorship` | PUT | - | Update sub sponsorship |
| **Delete Sub** | `/api/admin/subs/:id` | DELETE | - | Delete forum sub |

### Moderator Requests

| Feature | API Endpoint | Method | Frontend Function | Description |
|---------|-------------|--------|-------------------|-------------|
| **Get Mod Requests** | `/api/admin/forum/mod-requests` | GET | - | Get all moderator requests |
| **Get Mod Request** | `/api/admin/forum/mod-requests/:id` | GET | - | Get specific request |
| **Update Mod Request Role** | `/api/admin/forum/mod-requests/:id/role` | PUT | - | Approve/reject moderator request |

### Monitoring & Analytics

| Feature | API Endpoint | Method | Frontend Function | Description |
|---------|-------------|--------|-------------------|-------------|
| **Get Dashboard Data** | `/api/admin/dashboard` | GET | - | Get admin dashboard data |
| **Get Activity Logs** | `/api/admin/monitoring/logs` | GET | - | Get admin activity logs |
| **Get Admin Stats** | `/api/admin/monitoring/stats` | GET | - | Get platform statistics |
| **Unified Search** | `/api/admin/search` | GET | - | Search across all entities |

### Rate Limit Monitoring

| Feature | API Endpoint | Method | Frontend Function | Description |
|---------|-------------|--------|-------------------|-------------|
| **Get Rate Limit Stats** | `/api/admin/rate-limits/stats` | GET | - | Get rate limiting statistics |
| **Clear Rate Limit Data** | `/api/admin/rate-limits/clear` | POST | - | Clear rate limit data |

**Authentication:** All admin routes require admin authentication

**Rate Limiting:** 50 requests per minute for admin routes

---

## Contact & Support

### Backend Routes: `/api/contact`
### Frontend API: `frontend/src/api/contact.js`

| Feature | API Endpoint | Method | Frontend Function | Description |
|---------|-------------|--------|-------------------|-------------|
| **Send Contact Email** | `/api/contact` | POST | - | Send contact form email |

**Rate Limiting:** 3 requests per hour

**Email Service:** Powered by Resend

---

## Physiotherapist Management

### Backend Routes: `/api/pts`
### Frontend API: `frontend/src/api/pts.js`

| Feature | API Endpoint | Method | Frontend Function | Description |
|---------|-------------|--------|-------------------|-------------|
| **List PTs** | `/api/pts` | GET | - | Get all physiotherapists |
| **Get PTs with Active Promotions** | `/api/pts/promotions` | GET | - | Get PTs with active promotions |
| **Get PT Dashboard Stats** | `/api/pts/:id/dashboard-stats` | GET | - | Get PT dashboard statistics |
| **Get PT Dashboard** | `/api/pts/:id/dashboard` | GET | - | Get consolidated PT dashboard |
| **Get PT by ID** | `/api/pts/:id` | GET | - | Get specific PT profile |
| **Update PT Profile** | `/api/pts/:id` | PUT | - | Update PT profile |

---

## Clinic Appointments

### Backend Routes: `/api/clinic-appointments`
### Frontend API: `frontend/src/api/clinicAppointments.js`

| Feature | API Endpoint | Method | Frontend Function | Description |
|---------|-------------|--------|-------------------|-------------|
| **Request Clinic Appointment** | `/api/clinic-appointments` | POST | - | Request appointment at clinic |
| **Get Clinic Appointments** | `/api/clinic-appointments/clinic/:clinicId` | GET | - | Get clinic's appointments |
| **Get PT Clinic Appointments** | `/api/clinic-appointments/pt/:ptId` | GET | - | Get PT's clinic appointments |
| **Update Clinic Appointment** | `/api/clinic-appointments/:id` | PUT | - | Update clinic appointment |
| **Delete Clinic Appointment** | `/api/clinic-appointments/:id` | DELETE | - | Delete clinic appointment |

---

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

---

## Authentication Headers

All authenticated requests must include:
```
Authorization: Bearer <access_token>
```

---

## File Upload Format

For endpoints that support file uploads, use `FormData`:
```javascript
const formData = new FormData();
formData.append('avatar', file);
formData.append('name', 'John Doe');
```

---

## Rate Limiting Overview

| Endpoint Type | Rate Limit |
|--------------|------------|
| Authentication | 5-10 req/hour |
| Messages | 100 req/min |
| Forum Posts | 10 req/hour |
| Comments | 30 req/hour |
| Contact | 3 req/hour |
| Admin | 50 req/min |

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## WebSocket Events (Socket.io)

### Client Events
- `join_room`: Join a conversation room
- `send_message`: Send a message
- `typing`: User is typing
- `stop_typing`: User stopped typing

### Server Events
- `receive_message`: Receive new message
- `new_notification`: Receive notification
- `user_joined`: User joined conversation
- `user_left`: User left conversation

---

## Feature-to-API Mapping Summary

### Patient Features
- **Profile Management**: `/api/users/profile`
- **Therapist Search**: `/api/users/search/physiotherapists`, `/api/pts`
- **Appointment Booking**: `/api/appointments`, `/api/clinic-appointments`
- **Messaging**: `/api/messages`, `/api/conversations`
- **Forum**: `/api/forum/*`
- **Reviews**: `/api/reviews`
- **Notifications**: `/api/notifications`

### Physiotherapist Features
- **Profile Management**: `/api/pts/:id`, `/api/users/profile`
- **Availability**: `/api/pts/:id/dashboard`
- **Appointment Management**: `/api/appointments`, `/api/clinic-appointments`
- **Messaging**: `/api/messages`, `/api/conversations`
- **Promotions**: `/api/promotions/pt/*`
- **Forum**: `/api/forum/*`
- **Clinic Management**: `/api/clinics`

### Admin Features
- **User Management**: `/api/admin/users/*`
- **Content Moderation**: `/api/admin/forum/mod-requests`
- **Promotion Management**: `/api/admin/promotions/*`
- **Analytics**: `/api/admin/dashboard`, `/api/admin/monitoring/*`
- **Rate Limiting**: `/api/admin/rate-limits/*`

---

## Development Notes

1. **CORS**: All API endpoints are configured with CORS for frontend access
2. **Validation**: All inputs are validated before processing
3. **Error Handling**: Comprehensive error handling with detailed messages
4. **Logging**: Admin activities are logged for audit purposes
5. **Security**: All sensitive operations require proper authentication and authorization
6. **Testing**: Use the frontend API files for consistent API calls

---

## Additional Resources

- **Backend Routes**: `/backend/src/routes/`
- **Frontend API**: `/frontend/src/api/`
- **Controllers**: `/backend/src/controllers/`
- **Middleware**: `/backend/src/middlewares/`

For detailed implementation, refer to the respective controller and route files.
