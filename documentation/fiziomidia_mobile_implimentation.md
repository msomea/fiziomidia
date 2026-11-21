# FizioMidia React Native Migration Plan

This plan outlines the complete migration of FizioMidia's member and physiotherapist features from React web to React Native, creating a separate mobile app that works alongside the existing web version while keeping all admin features web-only.

## Project Overview

**Scope**: Create a new React Native mobile app (`fiziomidia_mobile`) for iOS and Android featuring member and PT functionality only, with no backend changes required.

**Target Features**:
- ✅ Member authentication & profiles
- ✅ PT authentication & profiles  
- ✅ Appointment booking & management
- ✅ Real-time messaging
- ✅ Forum functionality
- ✅ Clinic management
- ✅ Service promotions
- ❌ Admin dashboard (web-only)

## Phase 1: Project Setup & Architecture

### 1.1 Initialize React Native Project
```bash
npx react-native@latest init fiziomidia_mobile --template react-native-template-typescript
cd fiziomidia_mobile
```

### 1.2 Project Structure
```
fiziomidia_mobile/
├── src/
│   ├── api/           # API layer (axios)
│   ├── components/    # Reusable UI components
│   ├── contexts/      # React contexts
│   ├── navigation/    # React Navigation setup
│   ├── screens/       # Screen components
│   ├── utils/         # Helper functions
│   ├── hooks/         # Custom hooks
│   ├── types/         # TypeScript definitions
│   └── assets/        # Images, fonts, etc.
├── android/           # Android-specific code
├── ios/               # iOS-specific code
└── package.json
```

### 1.3 Essential Dependencies
```json
{
  "dependencies": {
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/stack": "^6.3.20",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "react-native-screens": "^3.29.0",
    "react-native-safe-area-context": "^4.8.2",
    "react-native-gesture-handler": "^2.14.0",
    "axios": "^1.12.2",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "react-native-vector-icons": "^10.0.2",
    "react-native-image-picker": "^7.0.1",
    "react-native-webview": "^13.6.4",
    "socket.io-client": "^4.8.1",
    "react-native-toast-message": "^2.1.6",
    "react-native-calendars": "^1.1302.0",
    "react-native-maps": "^1.8.0",
    "react-native-geolocation-service": "^5.3.1",
    "@react-native-community/netinfo": "^11.3.1",
    "react-native-permissions": "^4.0.4",
    "react-native-keychain": "^8.1.3",
    "i18next": "^23.0.0",
    "react-i18next": "^13.0.0",
    "react-native-date-picker": "^4.3.3",
    "react-native-modal": "^13.0.1",
    "react-native-reanimated": "^3.6.2"
  }
}
```

## Phase 2: Core Infrastructure

### 2.1 API Layer Migration
- Port existing `axios.js` configuration
- Implement AsyncStorage instead of localStorage
- Maintain JWT refresh token logic
- Keep same API endpoints (no backend changes)

### 2.2 Authentication System
- Migrate AuthContext with AsyncStorage
- Implement biometric authentication option
- Handle deep linking for email verification
- Maintain same token management

### 2.3 Navigation Structure
```
Tab Navigator:
├── Auth Stack (when not authenticated)
│   ├── Login
│   ├── Signup
│   ├── Forgot Password
│   └── Email Verification
├── Member Tabs (member users)
│   ├── Home
│   ├── Search
│   ├── Appointments
│   ├── Messages
│   ├── Forum
│   └── Profile
└── PT Tabs (physiotherapist users)
    ├── Dashboard
    ├── Appointments
    ├── Messages
    ├── Forum
    ├── Services
    └── Profile
```

## Phase 3: Feature Migration

### 3.1 Member Features
#### Authentication & Profile
- Login/Signup with form validation
- Profile management with image upload
- Settings and preferences
- Password reset flow

#### Appointment System
- Search PTs by location/specialty
- View PT profiles and availability
- Book appointments with calendar integration
- Manage upcoming/past appointments
- In-app notifications

#### Messaging
- Real-time chat with Socket.io
- Conversation list
- Image/file sharing
- Push notifications for new messages

#### Forum Access
- Browse forum categories
- Read and create posts
- Comment on posts
- Rich text editing (simplified for mobile)

### 3.2 Physiotherapist Features
#### Professional Profile
- Detailed PT profile management
- Services and specialties
- Availability calendar
- Photo gallery

#### Appointment Management
- Dashboard with appointment overview
- Accept/decline appointment requests
- Calendar view with schedule
- Patient communication

#### Services & Promotions
- Create/manage service listings
- Promotion management
- Clinic information
- Payment tracking

#### Forum Participation
- Create educational posts
- Respond to patient questions
- Professional community engagement

## Phase 4: React Native Specific Implementations

### 4.1 UI Components Migration
**Web → React Native Mappings:**
- `div` → `View`
- `span/p` → `Text`
- CSS → `StyleSheet` or styled-components
- TailwindCSS → NativeWind or StyleSheet
- DaisyUI → Custom components

### 4.2 Key Dependencies Migration
- **TipTap** → React Native rich text editor (react-native-render-html or custom)
- **React Router** → React Navigation
- **Socket.io Client** → Same library (works in RN)
- **Axios** → Same library
- **i18next** → Same library with react-i18next
- **Lucide React** → React Native Vector Icons

### 4.3 Native Features Integration
- **Push Notifications**: Firebase Cloud Messaging
- **Location Services**: Google Places API for PT search
- **Camera/Gallery**: Image picker for profile pictures
- **Biometric Auth**: Touch ID/Face ID
- **Deep Linking**: Handle email verification links

## Phase 5: Testing & Deployment

### 5.1 Testing Strategy
- Unit tests with Jest
- Integration tests for API calls
- E2E testing with Detox
- Manual testing on physical devices

### 5.2 Build Configuration
#### iOS
- Configure Xcode project
- Set up Bundle Identifier
- Configure Info.plist for permissions
- App Store preparation

#### Android
- Configure Android Studio project
- Set up package name
- Configure AndroidManifest.xml
- Google Play Store preparation

### 5.3 Deployment Pipeline
- GitHub Actions for CI/CD
- Automated testing on build
- TestFlight (iOS) and Internal Testing (Android)
- Production deployment

## Phase 6: Post-Launch Considerations

### 6.1 Performance Optimization
- Bundle size optimization
- Image optimization
- Memory management
- Network request optimization

### 6.2 Analytics & Monitoring
- Crash reporting (Crashlytics)
- Performance monitoring
- User analytics
- Error tracking

### 6.3 Maintenance Plan
- Regular dependency updates
- OS version compatibility
- Feature parity with web version
- User feedback integration

## Implementation Timeline

**Week 1-2**: Project setup, navigation, authentication
**Week 3-4**: Core features (profiles, appointments)
**Week 5-6**: Messaging and real-time features
**Week 7-8**: Forum and services
**Week 9-10**: Testing, optimization, deployment

## Success Criteria

- ✅ All member and PT features functional
- ✅ Smooth user experience on iOS and Android
- ✅ Real-time features working properly
- ✅ No backend modifications required
- ✅ App Store and Google Play approval

## Risks & Mitigations

**Risk**: React Native learning curve
**Mitigation**: Start with simple features, use existing patterns

**Risk**: Performance issues with complex features
**Mitigation**: Optimize early, use native modules when needed

**Risk**: API compatibility issues
**Mitigation**: Test thoroughly with existing backend

**Risk**: App store rejection
**Mitigation**: Follow guidelines, test thoroughly before submission
