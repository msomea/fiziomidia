# PROJECT OVERVIEW

**FizioMidia** is a comprehensive healthcare platform connecting patients with certified Physiotherapists. This is a full-stack web application built with modern technologies to facilitate seamless healthcare service delivery.

## Tech Stack
- **Frontend**: React 19.1.1, Vite, TailwindCSS + DaisyUI, React Router 7, Socket.io Client
- **Backend**: Node.js, Express.js, MongoDB + Mongoose, Socket.io, Redis
- **Services**: JWT, bcrypt, Cloudinary, Stripe, Resend
- **Development**: ESLint, Nodemon, Docker

## Live Deployment
- **Production URL**: https://fiziomidia.org
- **Status**: Live and active

# CORE FUNCTIONALITIES

## For Patients
- **Profile Management**: Create and manage personal health profiles
- **Therapist Search**: Find Physiotherapists by location, specialty, and availability
- **Appointment Booking**: Schedule and manage appointments with calendar integration
- **Secure Messaging**: Direct communication with therapists
- **Payment Processing**: Secure online payment for consultations
- **Forum Access**: Community discussions and educational content

## For Physiotherapists
- **Professional Profile**: Showcase qualifications, experience, and services
- **Availability Management**: Set and update schedule availability
- **Appointment Dashboard**: Manage upcoming and past appointments
- **Patient Communication**: Secure messaging with patients
- **Payment Tracking**: Monitor earnings and payment history
- **Forum Participation**: Share expertise and build professional reputation

## For Administrators
- **User Management**: Oversee patient and therapist accounts
- **Content Moderation**: Manage forum posts and user-generated content
- **Analytics Dashboard**: Track platform usage and engagement metrics
- **Promotion Management**: Create and manage promotional campaigns

# DOC

## Key Documentation Files
- **README.md**: Comprehensive project documentation with API endpoints
- **structure.txt**: Complete file structure reference
- **REDIS_SETUP.md**: Redis configuration instructions
- **welcome-message-examples.md**: Message templates reference

## API Documentation
The backend follows RESTful principles with the following main endpoint categories:
- **Authentication**: `/api/auth/*` - Registration, login, logout
- **Users**: `/api/users/*` - User profile management
- **Appointments**: `/api/appointments/*` - Appointment CRUD operations
- **Messages**: `/api/messages/*` - Real-time messaging
- **Forum**: `/api/forum/*` - Forum posts and discussions
- **Admin**: `/api/admin/*` - Administrative functions

# CURRENT FILE STRUCTURE

## Backend Structure (`/backend/src/`)
```
├── controllers/          # Request handlers for different features
│   ├── admin/           # Admin-specific controllers
│   ├── auth.js          # Authentication logic
│   ├── appointmentController.js
│   ├── forumController.js
│   └── messageController.js
├── models/              # MongoDB schema definitions
├── routes/              # API route definitions
├── middlewares/         # Custom middleware functions
├── services/            # Business logic services
├── utils/               # Utility functions
├── cron/                # Scheduled tasks
└── config/              # Configuration files
```

## Frontend Structure (`/frontend/src/`)
```
├── components/          # Reusable UI components
│   ├── admin/          # Admin dashboard components
│   ├── auth/           # Authentication forms
│   ├── dashboard/      # Dashboard components
│   ├── forum/          # Forum-related components
│   └── profiles/       # Profile management components
├── pages/               # Page-level components
│   ├── admin/          # Admin pages
│   ├── auth/           # Authentication pages
│   ├── forum/          # Forum pages
│   └── member/         # Member dashboard pages
├── api/                 # API client functions
├── contexts/            # React contexts
├── hooks/               # Custom React hooks
├── locales/             # Internationalization files
└── routes/              # Route definitions
```
# CACHE IMPLEMENTATION
| Cache Type          | Cache Key Pattern                 | TTL      | Purpose                              | Used In |
| ------------------- | ---------------------------------- | ------- | ------------------------------------ | ------------------------ |
| User Profile        | `user:{id}:profile`                | MEDIUM  | Store user profile data              | `userController.js`      |
| PT Profile          | `pt:{id}:profile`                  | MEDIUM  | Store physiotherapist profiles       | `redis.js`               |
| Admin Dashboard     | `dashboard:admin:{id}:filters`     | SHORT   | Store filtered admin dashboard data  | `adminController.js`     |
| PT Dashboard        | `dashboard:pt:{id}`                | SHORT   | Store physiotherapist dashboard data | `redis.js`               |
| Member Dashboard    | `dashboard:member:{id}`            | SHORT   | Store member dashboard data          | `redis.js`               |
| Forum Subs List     | `forum:subs:list`                  | MEDIUM  | Store forum subcategories list       | `redis.js`               |
| Forum Sub Details   | `forum:sub:{id}`                   | MEDIUM  | Store individual subforum details    | `redis.js`               |
| Forum Posts (Paged) | `forum:sub:{id}:posts:page:{page}` | MEDIUM  | Store paginated forum posts          | `forumPageController.js` |
| Forum Post          | `forum:post:{id}`                  | MEDIUM  | Store single forum post              | `redis.js`               |
| Forum Management    | `forum:sub:{id}:management`        | MEDIUM  | Store moderation & management data   | `redis.js`               |

# TTL Categories
| **Category** | **Duration** | **Best For**                                            |
| ------------ | ------------ | ------------------------------------------------------- |
| SHORT        | 5 minutes    | Frequently changing data (e.g., dashboards, live stats) |
| MEDIUM       | 30 minutes   | Moderately dynamic data (e.g., profiles, forum content) |
| LONG         | 2 hours      | Rarely updated data                                     |
| VERY_LONG    | 24 hours     | Static or reference data                                |

# Cache Invalidation Strategy

- User Updates: Automatically invalidate `user:{id}:profile` cache
- Forum Changes: Invalidate all `forum:sub:{id}*` related caches  
- Dashboard Updates: Invalidate `dashboard:admin:{id}*` caches


# CURRENT WORKING FEATURES

## ✅ Fully Implemented
- **User Authentication**: JWT-based auth with email verification
- **Profile Management**: Complete profiles for patients and therapists
- **Appointment System**: Booking, scheduling, and management
- **Real-time Messaging**: Socket.io powered chat system
- **Forum System**: Posts, comments, and moderation
- **File Uploads**: Cloudinary integration for images
- **Admin Dashboard**: User management and analytics
- **Multi-language Support**: English and Swahili (i18next)
- **Responsive Design**: Mobile-first design with TailwindCSS
- **Rate Limiting**: Redis-based rate limiting
- **Email Notifications**: Resend email service integration

## 🔧 Advanced Features
- **Clinic Management**: Multi-therapist clinic support
- **Promotion System**: PT and clinic promotions
- **Sponsored Products**: Product sponsorship features
- **Forum Moderation**: Sub-moderator permissions
- **Activity Logging**: Admin activity tracking
- **Location Services**: Geolocation-based therapist search

# FEATURES TO ADD

## 🚀 Planned Enhancements
- **Mobile Application**: iOS/Android native apps
- **Video Consultation**: Telehealth video integration
- **Advanced Analytics**: Enhanced analytics dashboard
- **Multi-language Expansion**: Additional language support
- **Healthcare Integration**: EHR system integration
- **AI Recommendations**: AI-powered therapist matching
- **Advanced Search**: Enhanced filtering and search capabilities
- **Calendar Integration**: Google Calendar/Outlook sync
- **Review System**: Enhanced rating and review features
- **Notification System**: Push notifications for mobile
- **Payment Integration**: Stripe payment processing

## 🛠️ Technical Improvements
- **Performance Optimization**: Code splitting and lazy loading
- **Enhanced Security**: Additional security layers
- **API Documentation**: OpenAPI/Swagger documentation
- **Testing Suite**: Comprehensive unit and integration tests
- **CI/CD Pipeline**: Automated deployment workflows
- **Monitoring**: Application performance monitoring
- **Error Tracking**: Enhanced error reporting
- **Database Optimization**: Query performance improvements