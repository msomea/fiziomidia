# FINAL REVIEW: Frontend-Backend Interaction Analysis

## Critical Issues Found

### 🔴 CRITICAL BUGS

#### 1. **MESSAGE ROUTE PARAMETER MISMATCH** 
**Location:** [backend/src/routes/message.js](backend/src/routes/message.js) vs [frontend/src/api/messages.js](frontend/src/api/messages.js)

**Backend Route:**
```javascript
router.get("/:chatId", authenticate, getMessages);
router.post("/", authenticate, sendMessage);
```

**Frontend Usage:**
```javascript
export const sendMessage = async (data) => {
  // data = { chatId, text }  ← WRONG! Should be { conversationId, content }
  const res = await API.post("/messages", data);
  return res.data;
};
```

**Issue:** 
- Frontend sends `{ chatId, text }` but backend controller expects `{ conversationId, content }`
- Parameter name mismatch will cause send message to fail
- The API docs in the controller use `conversationId` and `content`

**Fix Required:** 
Frontend should send:
```javascript
export const sendMessage = async (data) => {
  // data should have: { conversationId, content }
  const res = await API.post("/messages", data);
  return res.data;
};
```

---

#### 2. **FORUM COMMENT DELETE ROUTE MISMATCH**
**Location:** [backend/src/routes/forum.js](backend/src/routes/forum.js#L31) vs [frontend/src/api/forum.js](frontend/src/api/forum.js)

**Backend Route:**
```javascript
router.delete("/posts/:id/comments/:commentId", authenticate, comment.deleteComment);
```

**Frontend Code:**
```javascript
export const deleteComment = async (commentId, token) => {
  const res = await API.delete(`/forum/comments/${commentId}`, {  // ← WRONG PATH
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
```

**Issue:**
- Backend expects `/forum/posts/:id/comments/:commentId`
- Frontend is calling `/forum/comments/:commentId`
- The delete endpoint will not work - 404 error

**Fix Required:**
```javascript
export const deleteComment = async (postId, commentId, token) => {
  const res = await API.delete(`/forum/posts/${postId}/comments/${commentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
```

---

#### 3. **FORUM ROUTES ORDERING BUG - CONFLICTS**
**Location:** [backend/src/routes/forum.js](backend/src/routes/forum.js)

**Issue:**
```javascript
// These routes will conflict because Express matches sequentially
router.get("/", authenticate, forum.getPTPosts);              // Line 24
router.get("/:id", authenticate, forum.getPostsByPTId);       // Line 26
router.get("/posts/:id", forum.getPostById);                  // Line 22
router.get("/subs/:id", forum.getSubById);                    // Line 16
```

The route `/:id` at line 26 will catch requests intended for `/posts/:id` because it matches first.

**Fix Required:** 
Reorder routes - specific paths must come before generic ones:
```javascript
router.get("/subs", forum.listSubs);           // Specific
router.get("/subs/:id", forum.getSubById);     // Specific  
router.get("/posts/:id", forum.getPostById);   // Specific
router.post("/posts/:id/vote", ...);
router.post("/posts", ...);
// Generic routes LAST
router.get("/pt/:ptId", forum.getPostsByPTId);
router.get("/", forum.getPTPosts);             // Most generic - last
```

---

#### 4. **APPOINTMENTS STATUS UPDATE ENDPOINT MISMATCH**
**Location:** [backend/src/routes/appointments.js](backend/src/routes/appointments.js#L21) vs [frontend/src/api/appointments.js](frontend/src/api/appointments.js)

**Backend Route:**
```javascript
router.put("/:id/status", authenticate, ..., updateAppointmentStatus);
```

**Frontend Code:**
```javascript
export const updateAppointmentStatus = async (id, action, scheduledAt) => {
  const res = await API.put(`/appointments/${id}`, { action, scheduledAt });  // ← WRONG!
  return res.data;
};
```

**Issue:**
- Frontend sends to `/appointments/:id` 
- Backend expects `/appointments/:id/status`
- Will hit wrong endpoint/controller

**Fix Required:**
```javascript
export const updateAppointmentStatus = async (id, action, scheduledAt) => {
  const res = await API.put(`/appointments/${id}/status`, { action, scheduledAt });
  return res.data;
};
```

---

#### 5. **DUPLICATE ROUTES DEFINITION IN PTS.JS**
**Location:** [backend/src/routes/pts.js](backend/src/routes/pts.js)

**Issue:**
```javascript
router.get("/users/:id/saved-pts", ptController.getSavedPTsByMember)  // Line 20 - DUPLICATE

// Also defined in users.js:
// router.get("/:id/saved-pts", authenticate, requireRole(...), getSavedPTsByMember);
```

The route is defined in BOTH `pts.js` and `users.js`, but with different paths:
- `pts.js`: `/api/pts/users/:id/saved-pts`
- `users.js`: `/api/users/:id/saved-pts`

**Issue:**
- Inconsistent endpoint locations
- Frontend may be calling wrong endpoint
- [frontend/src/api/users.js](frontend/src/api/users.js) calls `/users/:id/saved-pts` which is correct

**Fix Required:**
Remove the duplicate from `pts.js` - it's already in the correct location in `users.js`.

---

### 🟡 MAJOR ISSUES

#### 6. **AUTH API - INCOMPLETE IMPLEMENTATION**
**Location:** [frontend/src/api/auth.js](frontend/src/api/auth.js)

**Issue:**
```javascript
export const registerUser = async (data) => {
  const res = await API.post("/auth/register", data);
  const { accessToken, refreshToken } = res.data;
  if (accessToken) {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  }
  return res.data;
};
```

**Problems:**
1. Backend `/auth/register` does NOT return `accessToken` or `refreshToken`
   - It returns `{ success: true, message: "Registration successful..." }`
2. Frontend is storing tokens that don't exist
3. Users are NOT logged in after registration - they must verify email first

**Fix Required:**
```javascript
export const registerUser = async (data) => {
  const res = await API.post("/auth/register", data);
  // Backend returns { success, message } - no tokens at this stage
  return res.data;
};
```

---

#### 7. **AUTH LOCAL STORAGE KEY INCONSISTENCY**
**Location:** [frontend/src/api/auth.js](frontend/src/api/auth.js) vs [frontend/src/api/axios.js](frontend/src/api/axios.js)

**Issue:**
- `auth.js` stores: `localStorage.setItem("accessToken", ...)` and `localStorage.setItem("refreshToken", ...)`
- `axios.js` reads: `localStorage.getItem("user")` and expects `JSON.parse(storedUser).accessToken`

**In axios.js:**
```javascript
const storedUser = localStorage.getItem("user");
let accessToken = storedUser ? JSON.parse(storedUser).accessToken : null;
```

**In auth.js:**
```javascript
localStorage.setItem("accessToken", accessToken);
localStorage.setItem("refreshToken", refreshToken);
```

**Fix:** Decide on ONE approach:
- Option A: Store individual tokens (current in auth.js)
- Option B: Store user object with tokens (current in axios.js)

Currently BOTH are being used inconsistently.

---

#### 8. **MESSAGES API - PARAMETER NAME MISMATCH**
**Location:** [backend/src/controllers/messageController.js](backend/src/controllers/messageController.js) vs [frontend/src/api/messages.js](frontend/src/api/messages.js)

**Backend expects:**
```javascript
export const getMessages = async (req, res) => {
  const { conversationId } = req.params;  // ← expects in URL params
  const messages = await Message.find({
    conversation: conversationId,
    ...
  });
};
```

**Backend route:**
```javascript
router.get("/:chatId", authenticate, getMessages);
```

**Frontend calls:**
```javascript
export const getMessages = async (chatId) => {
  const res = await API.get(`/messages/${chatId}`);
  return res.data;
};
```

**Issue:**
- Route parameter is `:chatId` but controller reads `conversationId`
- Should both use `conversationId` to be consistent

**Fix:** Route should be:
```javascript
router.get("/:conversationId", authenticate, getMessages);
```

---

### 🟠 MODERATE ISSUES

#### 9. **AXIOS INTERCEPTOR - HARDCODED TOKEN REFRESH URL**
**Location:** [frontend/src/api/axios.js](frontend/src/api/axios.js#L77)

**Issue:**
```javascript
const res = await axios.post("/api/auth/refresh", {
  token: refreshToken,
});  // Uses raw axios, not API instance
```

**Problems:**
1. Direct `axios.post()` call may not respect API configuration
2. No error handling if refresh endpoint fails while already in error state
3. Using `/api/` prefix directly instead of relying on baseURL

**Fix:**
```javascript
// Use a fresh axios instance configured the same way
const refreshRes = await axios.create({
  baseURL: "/api",
  withCredentials: true,
}).post("/auth/refresh", { token: refreshToken });
```

---

#### 10. **CONVERSATION CONTROLLER - POTENTIAL DATA EXPOSURE**
**Location:** [backend/src/controllers/conversationController.js](backend/src/controllers/conversationController.js#L36)

**Issue:**
```javascript
export const getConversations = async (req, res) => {
  const conversations = await Conversation.find({
    participants: userId,
    deletedBy: { $ne: userId },
  }).populate("participants", "fullName _id isLoggedIn profileImageUrl phone role");
  // Returns phone and role for all participants
};
```

**Privacy Concern:**
- Phone numbers and roles are exposed to all conversation participants
- Should filter what data is returned based on context

---

#### 11. **FORUM CONTROLLER - MISSING PAGINATION VALIDATION**
**Location:** [backend/src/controllers/forumController.js](backend/src/controllers/forumController.js#L8)

**Issue:**
```javascript
export const listSubs = async (req, res) => {
  const search = req.query.search || "";
  const page = parseInt(req.query.page) || 1;  // ← No validation
  const limit = parseInt(req.query.limit) || 100;  // ← Could be 0 or negative
  const skip = (page - 1) * limit;
```

**Problems:**
- No validation for negative or zero values
- `limit` could be set to huge number (DoS risk)
- `page` could be negative

**Fix:**
```javascript
const page = Math.max(1, parseInt(req.query.page) || 1);
const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
```

---

#### 12. **PROFILE UPDATE - MISSING FORM DATA CONFIG**
**Location:** [frontend/src/api/profile.js](frontend/src/api/profile.js)

**Issue:**
```javascript
export const updateProfile = async (data) => {
  const config = {};
  if (!(data instanceof FormData)) {
    config.headers = { "Content-Type": "application/json" };
  }
  const res = await API.put("/users/profile", data, config);
  return res.data.user;
};
```

**Problem:**
- When sending FormData (with file uploads), should NOT set Content-Type header
- Browser will automatically set correct Content-Type with boundary
- Current code is correct but could be clearer

---

#### 13. **SOCKET.IO - MISSING AUTHENTICATION**
**Location:** [backend/src/config/socket.js](backend/src/config/socket.js) vs [frontend/src/socket.js](frontend/src/socket.js)

**Issue:**
```javascript
// Backend socket.js
io.on("connection", (socket) => {
  socket.on("joinRoom", (userId) => {  // ← No authentication check!
    socket.join(userId);
  });
});

// Frontend socket.js
export const getSocket = () => {
  socket = io(import.meta.env.VITE_API_URL, {
    transports: ["websocket"],
    withCredentials: true,
  });
};
```

**Security Issue:**
- Any user can call `joinRoom` with any `userId`
- No verification that the socket connection belongs to that user
- Users can listen to other users' messages

**Fix:** 
Add socket authentication middleware and verify user identity in `joinRoom`.

---

#### 14. **PROMOTION ROUTE CONFLICT**
**Location:** [backend/src/routes/promotions.js](backend/src/routes/promotions.js)

**Issue:**
```javascript
router.post("/create-checkout-session", authenticate, createPromotionCheckout);
router.get("/:id", getPromotionById);
router.get("/", authenticate, getPTPromotion)  // ← Generic route at bottom
```

**Problem:**
- Route `/:id` might interfere with `/create-checkout-session`
- In this case it's OK (different HTTP methods), but still bad practice

---

#### 15. **ERROR HANDLING INCONSISTENCY - RESPONSE FORMATS**
**Location:** Various controllers

**Issues:**
- Some return `{ error: "..." }`
- Some return `{ message: "..." }`
- Some return `{ success: true, message: "..." }`
- Frontend may not handle all formats correctly

**Examples:**
- [authController.js](backend/src/controllers/authController.js): uses `success()` and `fail()` helpers
- [messageController.js](backend/src/controllers/messageController.js): uses `{ message: "..." }`
- [appointmentController.js](backend/src/controllers/appointmentController.js): uses `{ error: "..." }`

---

### 🔵 MINOR ISSUES / BEST PRACTICES

#### 16. **MISSING FILE ENCODING IN UPLOADABLE ROUTES**
**Location:** Multiple routes with upload

**Issue:**
Files uploaded with `upload.single()` or `upload.fields()` will store paths but:
- No validation of file types
- No size limits enforced consistently
- No cleanup of old files when updated

---

#### 17. **LOGOUT - MISSING REFRESH TOKEN PAYLOAD**
**Location:** [backend/src/routes/auth.js](backend/src/routes/auth.js#L10) vs [frontend/src/api/auth.js](frontend/src/api/auth.js)

**Frontend:**
```javascript
export const logoutUser = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  await API.post("/auth/logout", { token: refreshToken });
};
```

**Backend:**
```javascript
router.post("/logout", authenticate, auth.logoutUser);
```

**Issue:**
- Backend expects `authenticate` middleware (access token)
- Frontend also sends `token: refreshToken` in body
- Should verify the logout handler uses the right token format

---

#### 18. **CONVERSATION - UNREADCOUNT MAP USAGE**
**Location:** [backend/src/models/Conversation.js](backend/src/models/Conversation.js) vs [backend/src/controllers/conversationController.js](backend/src/controllers/conversationController.js)

**Issue:**
- Model defines `unreadCounts: { type: Map, of: Number, default: {} }`
- Controller calculates unread manually with query
- The `unreadCounts` field appears unused/redundant

---

#### 19. **APPOINTMENTS - MISSING TIMEZONE HANDLING**
**Location:** [backend/src/controllers/appointmentController.js](backend/src/controllers/appointmentController.js)

**Issue:**
```javascript
const appointment = new Appointment({
  scheduledAt,  // Stores raw datetime
  ...
});
```

**Problem:**
- No timezone info stored
- Frontend and backend may interpret times differently
- Scheduling across timezones will be wrong

---

#### 20. **NO VALIDATION ON CRITICAL INPUTS**
**Locations:** Multiple controllers

**Examples:**
- Forum post body length not validated
- Comment content not validated
- Appointment notes not validated
- User bio/location not validated

**Risk:** XSS attacks, NoSQL injection, data bloat

---

## Summary Table

| Issue # | Severity | Type | File(s) | Status |
|---------|----------|------|---------|--------|
| 1 | 🔴 CRITICAL | API Mismatch | messages.js | Will cause send message to fail |
| 2 | 🔴 CRITICAL | Route Mismatch | forum.js | Will cause 404 on delete comment |
| 3 | 🔴 CRITICAL | Route Conflict | forum.js | Generic routes shadow specific ones |
| 4 | 🔴 CRITICAL | URL Mismatch | appointments.js | Will call wrong endpoint |
| 5 | 🔴 CRITICAL | Duplicate Route | pts.js | Confusion, possible routing errors |
| 6 | 🟡 MAJOR | Logic Error | auth.js | Registration won't store tokens |
| 7 | 🟡 MAJOR | Inconsistency | axios.js, auth.js | Token storage conflict |
| 8 | 🟡 MAJOR | Parameter Mismatch | messages route | Route param doesn't match controller |
| 9 | 🟠 MODERATE | Implementation | axios.js | Hardcoded token refresh |
| 10 | 🟠 MODERATE | Privacy | conversationController.js | Exposes phone/role |
| 11 | 🟠 MODERATE | Security | forumController.js | No pagination validation |
| 12 | 🟠 MODERATE | Form Data | profile.js | Could be clearer |
| 13 | 🟠 MODERATE | Security | socket.js | No socket auth |
| 14 | 🟠 MODERATE | Route Order | promotions.js | Routes could conflict |
| 15 | 🟠 MODERATE | Inconsistency | All controllers | Different error formats |
| 16 | 🔵 MINOR | Best Practice | Upload routes | No file validation |
| 17 | 🔵 MINOR | Clarification | auth routes | Token format unclear |
| 18 | 🔵 MINOR | Unused Field | Conversation model | Unused unreadCounts |
| 19 | 🔵 MINOR | Feature Gap | appointments | No timezone handling |
| 20 | 🔵 MINOR | Validation | All controllers | Missing input validation |

---

## Recommended Fix Priority

### Phase 1 - Critical (Do First)
1. Fix message endpoint parameter mismatch (#1)
2. Fix forum comment delete route (#2)
3. Fix forum route ordering (#3)
4. Fix appointments status endpoint (#4)
5. Remove duplicate pts route (#5)

### Phase 2 - Major (Do Soon)
6. Fix auth registration token handling (#6)
7. Standardize localStorage usage (#7)
8. Fix message route parameters (#8)
9. Improve socket authentication (#13)

### Phase 3 - Quality (Do Later)
10. Standardize error response formats (#15)
11. Add input validation (#20)
12. Fix timezone handling (#19)
13. Add file upload validation (#16)

---

## Files Requiring Changes

### Backend
- [backend/src/routes/forum.js](backend/src/routes/forum.js) - Fix route ordering
- [backend/src/routes/appointments.js](backend/src/routes/appointments.js) - Verify endpoint
- [backend/src/routes/message.js](backend/src/routes/message.js) - Fix parameter names
- [backend/src/routes/pts.js](backend/src/routes/pts.js) - Remove duplicate
- [backend/src/config/socket.js](backend/src/config/socket.js) - Add authentication
- [backend/src/controllers/](backend/src/controllers/) - Standardize error formats

### Frontend
- [frontend/src/api/auth.js](frontend/src/api/auth.js) - Fix registration, token handling
- [frontend/src/api/messages.js](frontend/src/api/messages.js) - Fix parameter names
- [frontend/src/api/axios.js](frontend/src/api/axios.js) - Fix token storage consistency
- [frontend/src/api/forum.js](frontend/src/api/forum.js) - Fix delete comment route
- [frontend/src/api/appointments.js](frontend/src/api/appointments.js) - Fix status endpoint
