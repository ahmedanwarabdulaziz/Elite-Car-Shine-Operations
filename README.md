# Elite Car Detailing - Business Management System

A comprehensive web application for managing car detailing business operations, built with React, Firebase, and Material-UI.

## 🚗 Features

- **Dashboard**: Overview of business metrics and key performance indicators
- **Categories Management**: Full CRUD operations with manual sorting and status control
- **Work Orders**: Create and manage service orders (Coming Soon)
- **Invoices**: Generate and track customer invoices (Coming Soon)
- **Finance**: Track revenue, expenses, and financial reports (Coming Soon)
- **Employee Management**: Staff attendance and performance tracking (Coming Soon)
- **Analytics**: Business insights and reporting (Coming Soon)
- **Settings**: System configuration and preferences (Coming Soon)

## 🛠️ Tech Stack

- **Frontend**: React 18
- **UI Framework**: Material-UI (MUI) v5
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Routing**: React Router v6
- **Styling**: Emotion (CSS-in-JS)

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase project setup

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd elite-car-detailing-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Configuration**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore Database
   - Get your Firebase configuration
   - Update `src/firebase/config.js` with your Firebase credentials:

   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "your-app-id"
   };
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
src/
├── components/
│   └── Layout/
│       ├── Header.js          # Top navigation header
│       ├── Sidebar.js         # Left navigation sidebar
│       └── MainLayout.js      # Main layout wrapper
├── pages/
│   ├── Dashboard/
│   │   └── DashboardPage.js   # Dashboard overview
│   └── Categories/
│       └── CategoriesPage.js  # Categories management
├── firebase/
│   └── config.js              # Firebase configuration
├── theme/
│   └── theme.js               # Material-UI theme configuration
├── App.js                     # Main app component with routing
└── index.js                   # App entry point
```

## 🎨 Design System

The application uses a professional, corporate design system with:

- **Primary Color**: Professional blue (#1976d2)
- **Secondary Color**: Accent red (#dc004e)
- **Typography**: Roboto font family
- **Spacing**: Consistent 8px grid system
- **Shadows**: Subtle elevation with 2px-8px shadows
- **Border Radius**: 8px for cards, 12px for containers

## 🔧 Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🔐 Firebase Collections

The application uses the following Firestore collections:

- `categories` - Service categories with order and status
- `work_orders` - Customer service orders (Coming Soon)
- `invoices` - Customer invoices (Coming Soon)
- `employees` - Staff information (Coming Soon)
- `customers` - Customer database (Coming Soon)

## 🚀 Deployment

### Azure Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to Azure Static Web Apps**
   - Connect your repository to Azure Static Web Apps
   - Configure build settings
   - Set environment variables for Firebase configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please contact the development team.

---

**Elite Car Detailing Business Management System** - Streamlining your car detailing operations with professional efficiency. 