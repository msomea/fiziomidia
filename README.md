# FizioMidia

🏥 **A comprehensive healthcare platform connecting patients with Physiotherapists**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-fiziomidia.org-blue?style=for-the-badge)](https://fiziomidia.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?style=for-the-badge)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.1.1-blue?style=for-the-badge)](https://reactjs.org/)

## 🌟 About FizioMidia

FizioMidia is a modern, full-stack web application designed to bridge the gap between patients seeking physical therapy and certified professionals. Our platform offers:

- **🔍 Find Professionals**: Search and connect with certified Physiotherapists in your area
- **📅 Book Appointments**: Seamless scheduling system with real-time availability
- **💬 Real-time Communication**: Built-in messaging system for patient-therapist communication
- **🏛️ Community Forum**: Educational content and peer support discussions
- **💳 Secure Payments**: Integrated payment processing for consultations
- **📱 Responsive Design**: Optimized for desktop, tablet, and mobile devices

## 🚀 Live Page

Visit our live application at **[fiziomidia.org](https://fiziomidia.org)**

## 🛠️ Tech Stack

### Frontend
- **React 19.1.1** - Modern UI framework
- **Vite** - Fast development build tool
- **TailwindCSS + DaisyUI** - Utility-first CSS framework
- **React Router 7** - Client-side routing
- **Axios** - HTTP client
- **Socket.io Client** - Real-time communication
- **TipTap** - Rich text editor
- **i18next** - Internationalization support
- **Lucide React** - Icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB + Mongoose** - Database and ODM
- **Socket.io** - Real-time bidirectional communication
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Cloudinary** - Cloud image storage
- **Stripe** - Payment processing
- **Resend** - Email services
- **Redis** - Session storage and rate limiting

### Development Tools
- **ESLint** - Code linting
- **Nodemon** - Auto-restart development server
- **Docker** - Containerization support

## 📁 Project Structure

```
fiziomidia/
├── backend/                 # Node.js/Express API server
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── middlewares/    # Custom middlewares
│   │   ├── services/       # Business logic
│   │   └── config/         # Configuration files
│   ├── Dockerfile
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── routes/        # Route definitions
│   │   └── assets/        # Static assets
│   ├── public/            # Public assets
│   └── package.json
└── README.md
```

## 📱 Features

### For Patients
- **Profile Management**: Create and manage personal health profiles
- **Therapist Search**: Find Physiotherapists by location, specialty, and availability
- **Appointment Booking**: Schedule and manage appointments with easy calendar integration
- **Secure Messaging**: Communicate directly with therapists through our platform
- **Payment Processing**: Secure online payment for consultations
- **Forum Access**: Join community discussions and access educational content

### For Physiotherapists
- **Professional Profile**: Showcase qualifications, experience, and services
- **Availability Management**: Set and update schedule availability
- **Appointment Dashboard**: Manage upcoming and past appointments
- **Patient Communication**: Secure messaging with patients
- **Payment Tracking**: Monitor earnings and payment history
- **Forum Participation**: Share expertise and build professional reputation

### Administrative Features
- **User Management**: Oversee patient and therapist accounts
- **Content Moderation**: Manage forum posts and user-generated content
- **Analytics Dashboard**: Track platform usage and engagement metrics
- **Promotion Management**: Create and manage promotional campaigns

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt encryption for user passwords
- **Rate Limiting**: Redis-based rate limiting to prevent abuse
- **CORS Configuration**: Cross-origin resource sharing controls
- **Input Validation**: Comprehensive input sanitization and validation
- **Helmet.js**: Security headers for Express applications

## 🌐 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/pts` - List Physiotherapists

### Appointments
- `GET /api/appointments` - List user appointments
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/:id` - Update appointment

### Messaging
- `GET /api/messages` - Get conversations
- `POST /api/messages` - Send message

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint configuration
- Write clean, commented code
- Ensure all tests pass
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** - For the amazing React framework
- **Express.js** - For the robust backend framework
- **MongoDB** - For the flexible database solution
- **TailwindCSS** - For the utility-first CSS framework
- All our contributors and users who make this platform possible

## 📞 Support

- **Email**: support@fiziomidia.org
- **Website**: [fiziomidia.org](https://fiziomidia.org)
- **Issues**: [GitHub Issues](https://github.com/yourusername/fiziomidia/issues)

## 🗺️ Roadmap

- [ ] Mobile application (iOS/Android)
- [ ] Video consultation integration
- [ ] Advanced analytics dashboard
- [ ] Multi-language support expansion
- [ ] Integration with healthcare systems
- [ ] AI-powered therapist recommendations

---

**Made with ❤️ for better healthcare accessibility**

