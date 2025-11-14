<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/9dad00de-1658-4905-b8fd-0574b619c282" /># Logistics Monitoring System - Web Interface and Dashboard

A comprehensive real-time web Interface and dashboard for monitoring IoT-enabled parcels throughout their entire logistics journey. Built with React, Vite, Firebase, and Tailwind CSS, this dashboard provides role-based access control for warehouse managers, transport agents, and parcel owners to track temperature, humidity, vibration, and location data.

<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/6ffc75d9-3a1b-4447-9c47-2879b281236d" />

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [User Roles & Workflows](#user-roles--workflows)
- [Getting Started](#getting-started)
- [Complete User Journey](#complete-user-journey)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Environment Setup](#environment-setup)
- [Running the Application](#running-the-application)

---

## 🎯 Overview

The Logistics Monitoring System tracks IoT-enabled parcels in real-time, ensuring temperature, humidity, and vibration conditions are maintained throughout the shipping process. The web dashboard serves as the central monitoring hub where different stakeholders can:

- **Warehouse Managers**: Create parcels, assign IoT devices, and monitor warehouse operations
- **Transport Agents**: Accept parcel pickups, manage deliveries, and monitor conditions during transit *(In Development)*
- **Parcel Owners**: Track their parcels, view real-time sensor data, and receive alerts

---

## ✨ Features

### Core Capabilities

✅ **Real-Time Device Monitoring**
- Live temperature, humidity, and vibration sensor readings
- Device online/offline status detection
- Last seen timestamp tracking
- Historical data visualization

✅ **Parcel Management**
- Create parcels with custom sensor thresholds (temperature, humidity, vibration limits)
- Assign IoT devices to parcels automatically
- Device status tracking (available, assigned, offline)
- Parcel assignment and tracking

✅ **Alert System**
- Real-time notifications when sensor thresholds are exceeded
- Toast notifications for user actions and system events
- Alert history tracking
- Automatic alert clearing on device reassignment

✅ **Role-Based Access Control (RBAC)**
- Admin dashboard for system management
- Warehouse manager operations
- Transport agent assignment workflows *(In Development)*
- Owner real-time tracking view

✅ **Firebase Integration**
- Real-time database synchronization
- Secure authentication
- Role-based database rules
- Persistent data storage

---

## 👥 User Roles & Workflows

### 1. **Warehouse Manager** 

#### Responsibilities
- Create new parcels with temperature, humidity, and vibration thresholds
- Assign IoT SmartParcels (devices) to parcels
- Monitor all devices in the warehouse
- View device pool and availability status
- Manage sensor calibration thresholds

#### Key Dashboard Sections

**Device Pool View**
- Display all devices with current status
- Show temperature, humidity and 6 IMU Parmeters (3-Axis Acc(X/Y/Z), 3-Axis Gyro(X/Y/Z)) readings
- Display last activity timestamp
- Filter devices by status (available, assigned, offline)
<img width="1366" height="768" alt="Screenshot (222)" src="https://github.com/user-attachments/assets/53602fce-a53d-4cd4-b5ee-0b61a6542486" />
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/eba4b9dd-221f-4d54-a24c-ffb433b6f15d" />
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/575ccdfb-24b0-4d15-899c-9f5d13895f08" />



**Warehouse Dashboard**
- Dashboard statistics (total devices, active parcels, offline devices)
- Real-time parcel and device counts
- Quick actions for parcel creation
- System health overview
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/77a75fe2-62b8-415f-b101-20f7facf65a5" />



**Create Parcel Modal**
- Input parcel details (origin, destination, receiver info)
- Set custom sensor thresholds
- Select an available device from dropdown
- Device dropdown shows only `status='available'` and `isOnline=true` devices
<img width="1366" height="768" alt="Screenshot (164)" src="https://github.com/user-attachments/assets/2ec1f235-0f18-468e-8d0d-5dbf04f0a4be" />



#### Workflow Steps
1. Navigate to "Create Parcel" button
2. Enter parcel information (weight, dimensions, receiver contact)
3. Set custom sensor thresholds (temp range, humidity range, vibration limit)
4. Select available device from dropdown
5. Click "Assign Device"
6. Confirm parcel created successfully
7. Device status changes to "assigned"
8. Monitor device in Device Pool View

#### Implementation Status
✅ **Fully Implemented**

---

### 2. **Transport Agent** (In Development)

#### Responsibilities
- Accept parcel pickup assignments
- Manage vehicle device assignments
- Monitor parcel conditions during transit
- Record delivery completion
- Generate delivery reports

#### Key Dashboard Sections

**Assigned Parcels View** *(Open for Contribution)*
- List of parcels awaiting pickup
- Parcel details (origin, destination, weight, receiver)
- Accept/Reject pickup functionality

**Pickup Process** *(Open for Contribution)*
- Confirm parcel pickup
- Scan or verify parcel ID
- Update parcel status to "In Transit"
- Record pickup time and location

**Transit Monitoring** *(Open for Contribution)*
- Real-time sensor data during transit
- Map view showing parcel location
- Alert notifications for threshold violations
- Temperature, humidity, vibration graphs
<img width="1153" height="571" alt="image" src="https://github.com/user-attachments/assets/7a5ae704-657a-46fb-bc44-ba4d52b468de" />


**Delivery Completion** *(Open for Contribution)*
- Confirm delivery location
- Obtain delivery signature or OTP verification
- Update parcel status to "Delivered"
- Retrieve device from parcel


#### Workflow Steps *(To be Implemented)*
1. View assigned parcels in transport dashboard
2. Accept parcel pickup assignment
3. Navigate to pickup location
4. Scan parcel QR code
5. Confirm device is attached and functional
6. Update status to "In Transit"
7. Monitor real-time sensor data during transport
8. Receive alerts if thresholds are breached
9. Navigate to delivery address
10. Confirm delivery location
11. Update parcel status to "Delivered"
12. Retrieve device and confirm in working condition
13. Record delivery timestamp and location
14. Generate delivery report

#### Implementation Status
🔄 **Open for Contribution** - Ready to accept pull requests for:
- Pickup assignment acceptance/rejection
- In-transit monitoring with real-time alerts
- Delivery confirmation workflow
- Location tracking integration
- Device handoff process

---

### 3. **Parcel Owner** (User)

#### Responsibilities
- Track parcel location and status in real-time
- Monitor sensor conditions throughout transit
- Receive notifications for delivery status
- View complete delivery history

#### Key Dashboard Sections

**Active Parcels Tracking**
- Live parcel location map
- Current sensor readings (temperature, humidity, vibration)
- Estimated delivery time
- Real-time status updates
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/8e5b4b42-0363-4061-a890-f37aa1142774" />


**Parcel Details Modal**
- Full parcel information (origin, destination, receiver)
- Device information (device ID, sensor type)
- Temperature, humidity and 6 IMU Parmeters (3-Axis Acc(X/Y/Z), 3-Axis Gyro(X/Y/Z)) graphs over time
- Vibration data visualization
- Alert history with timestamps
<img width="1152" height="563" alt="image" src="https://github.com/user-attachments/assets/c7dcfbb2-2c89-4f73-b374-5b35ee719df7" />
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/5cb6fe93-873d-42f8-8328-3b648df71420" />


**Notifications**
- Delivery status updates
- Threshold breach alerts
- Estimated delivery alerts
- Package arrived notifications

#### Workflow Steps
1. Login to dashboard with owner credentials
2. View "Track Parcel" section
3. Enter parcel ID or see auto-populated parcels
4. View real-time location on map
5. Check current sensor conditions
6. Review historical temperature/humidity graph
7. Receive notification when parcel is nearby
8. Receive confirmation when parcel is delivered
9. Download delivery report

#### Implementation Status
✅ **Partially Implemented** - Core tracking functional, map integration recommended for enhancement

---

## 🚀 Complete User Journey

### End-to-End Parcel Flow (Current Implementation)

```
┌─────────────────────────────────────────────────────────────────┐
│                    WAREHOUSE MANAGER                            │
│                    Creates Parcel                               │
│                                                                 │
│  1. Navigate to Dashboard                                       │
│  2. Click "Create Parcel" Button                                │
│  3. Fill Parcel Details Form:                                   │
│     - Receiver Name & Contact                                   │
│     - Origin & Destination                                      │
│     - Parcel Weight & Dimensions                                │
│     - Custom Thresholds (Temp, Humidity, Vibration)             │
│  4. Select Available Device from Dropdown                       │
│  5. Click "Assign Device"                                       │
│  6. System Updates:                                             │
│     ✓ Creates parcel record in Firebase                         |
│     ✓ Updates device status to "assigned"                       │
│     ✓ Syncs thresholds to device firmware                       │
│     ✓ Clears old alerts/history from previous parcel            │
│  7. Toast notification confirms success                         │
│  8. Device visible in Device Pool with assigned status          │
│                                                                 |
│                                                                 |
|                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    DEVICE MONITORING                            │
│                    (Warehouse Manager)                          │
│                                                                 │
│  • Device Pool View shows real-time status:                     │
│    - Device ID, Status (available/assigned)                     │
│    - Current Temperature & Humidity                             │
│    - Online/Offline indicator                                   │
│    - Last Seen timestamp                                        │
│    - Assigned Parcel ID (if assigned)                           │
│  • Devices stream live data from IoT sensors                    │
│  • Automatic offline detection (>2 min no update)               │
│  • Filter devices by status and online status                   │
│                                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│              TRANSPORT AGENT WORKFLOW (TODO)                   │
│           🔄 Open for Community Contribution                   |
│                                                                │
│  Phase 1: Pickup Assignment                                    │
│  ├─ View assigned parcels for today                            │
│  ├─ Accept/Reject pickup requests                              │
│  ├─ Route optimization to pickup location                      │
│  └─ Confirm device is operational at warehouse                 │
│                                                                │
│  Phase 2: In-Transit Monitoring                                │
│  ├─ Real-time sensor data streaming                            │
│  ├─ Alert notifications for threshold breaches                 │
│  ├─ Location tracking (GPS/Map integration)                    │
│  ├─ Temperature/Humidity trend visualization                   │
│  └─ Emergency alert handling                                   │
│                                                                │
│  Phase 3: Delivery Completion                                  │
│  ├─ Navigate to delivery address                               │
│  ├─ Confirm delivery location (GPS/Manual)                     │
│  ├─ Obtain receiver signature or OTP verification              │
│  ├─ Update parcel status to "Delivered"                        │
│  ├─ Device validation and retrieval                            │
│  └─ Generate delivery report with photos/notes                 │
│                                                                │
|                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                    PARCEL OWNER TRACKING                       │
│                   (Real-Time Monitoring)                       │
│                                                                │
│  1. Owner logs in to dashboard                                 │
│  2. Views "My Parcels" / "Track Parcels" section               │
│  3. Parcel appears with:                                       │
│     - Real-time status (In Warehouse/In Transit/Delivered)     │
│     - Current location (if available)                          │
│     - Current sensor readings                                  │
│     - Estimated delivery time                                  │
│  4. Click parcel to view detailed modal:                       │
│     - Temperature graph over time                              │
│     - Humidity graph over time                                 │
│     - Vibration data                                           │
│     - Alert history with breach details                        │
│  5. Receive notifications:                                     │
│     - Parcel picked up from warehouse                          │
│     - Temperature/Humidity threshold breached                  │
│     - Parcel out for delivery                                  │
│     - Delivery successful confirmation                         │
│  6. Download delivery report                                   │
│                                                                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 🛠 Technology Stack

| Technology | Purpose | Version |
|-----------|---------|---------|
| **React** | UI Framework | ^18.3 |
| **Vite** | Build Tool & Dev Server | ^5.0 |
| **Firebase** | Real-time Database & Auth | ^10.0 |
| **Tailwind CSS** | Styling Framework | ^3.4 |
| **React Hot Toast** | Toast Notifications | ^2.4.1 |
| **Node.js** | Runtime Environment | ^18.0 |

---

## 📁 Project Structure

```
web-dashboard/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx              # Main dashboard router
│   │   ├── Login.jsx                  # Authentication screen
│   │   ├── Sidebar.jsx                # Navigation menu
│   │   │
│   │   ├── cards/
│   │   │   └── ParcelCard.jsx         # Parcel display card
│   │   │
│   │   ├── dashboards/
│   │   │   ├── AdminDashboard.jsx     # Warehouse manager view
│   │   │   ├── OwnerDashboard.jsx     # Parcel owner tracking
│   │   │   ├── TransporterDashboard.jsx  # Transport agent view (TODO)
│   │   │   └── WarehouseDashboard.jsx # Warehouse operations
│   │   │
│   │   ├── modals/
│   │   │   ├── CreateParcelModal.jsx  # Parcel creation form
│   │   │   ├── ParcelDetailModal.jsx  # View parcel details
│   │   │   └── UserSettingsModal.jsx  # User preferences
│   │   │
│   │   ├── shared/
│   │   │   └── DashboardStats.jsx     # Statistics component
│   │   │
│   │   └── views/
│   │       └── DevicePoolView.jsx     # Device monitoring table
│   │
│   ├── hooks/
│   │   ├── useAuth.js                 # Authentication logic
│   │   ├── useDevices.js              # Device data fetching
│   │   ├── useNotifications.js        # Notification handling
│   │   ├── useParcels.js              # Parcel data management
│   │   ├── useUsers.js                # User management
│   │   └── useToast.js                # Toast notification wrapper
│   │
│   ├── firebase/
│   │   └── config.js                  # Firebase initialization
│   │
│   ├── utils/
│   │   └── firebase.js                # Firebase helpers
│   │
│   ├── App.jsx                        # Root component
│   ├── main.jsx                       # Entry point
│   └── index.css                      # Global styles
│
├── public/                            # Static assets
├── package.json                       # Dependencies
├── vite.config.js                     # Build configuration
├── tailwind.config.js                 # Tailwind settings
├── postcss.config.js                  # CSS processing
└── eslint.config.js                   # Linting rules
```

### Key Component Descriptions

**Dashboard.jsx** - Central routing component that determines which user dashboard to display based on logged-in user role

**AdminDashboard.jsx** - Warehouse manager interface with device pool, parcel creation, and device assignment controls

**DevicePoolView.jsx** - Real-time table showing all devices with status, temperature, humidity, online/offline status, and assigned parcel IDs

**CreateParcelModal.jsx** - Form for creating new parcels with:
- Parcel details input fields
- Custom sensor threshold configuration
- Device selection (filtered to show only available devices)
- Firebase integration for parcel and device status updates
- Automatic alert clearing and threshold syncing

**ParcelDetailModal.jsx** - Detailed view showing:
- Complete parcel information
- Real-time sensor data streams (temperature, humidity, vibration)
- Historical graphs and charts
- Alert history with timestamps
- Device performance metrics

---

## ⚙️ Environment Setup

### Prerequisites
- Node.js v18.0 or higher
- npm or yarn package manager
- Firebase project with Realtime Database enabled
- Internet connection for real-time data sync

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd web-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a `.env.local` file in the root directory
   - Add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Configure Firebase Database Rules**
   - Navigate to Firebase Console > Realtime Database > Rules
   - Apply the following rules structure:
   ```json
   {
     "rules": {
       "SmartParcels": {
         "$deviceId": {
           ".read": "root.child('users').child(auth.uid).child('profile').child('role').val() === 'owner' || root.child('users').child(auth.uid).child('profile').child('role').val() === 'admin' || root.child('users').child(auth.uid).child('profile').child('role').val() === 'warehouse'",
           ".write": "root.child('users').child(auth.uid).child('profile').child('role').val() === 'admin' || root.child('users').child(auth.uid).child('profile').child('role').val() === 'warehouse'",
           "info": {
             ".validate": "newData.hasChildren(['status', 'assignedParcelId', 'thresholds'])"
           }
         }
       },
       "parcels": {
         "$parcelId": {
           ".read": "true",
           ".write": "root.child('users').child(auth.uid).child('profile').child('role').val() === 'admin' || root.child('users').child(auth.uid).child('profile').child('role').val() === 'warehouse' || data.child('ownerId').val() === auth.uid"
         }
       },
       "users": {
         "$uid": {
           ".read": "auth.uid === $uid",
           ".write": "auth.uid === $uid",
           "profile": {
             ".validate": "newData.hasChildren(['email', 'role'])"
           }
         }
       }
     }
   }
   ```

---

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```
- Application runs on `http://localhost:5173`
- Hot Module Replacement (HMR) enabled for instant updates
- Open browser and navigate to the URL

### Production Build
```bash
npm run build
```
- Optimized build output in `dist/` directory
- Ready for deployment to hosting platform

### Preview Build
```bash
npm run preview
```
- Preview production build locally on port 4173

### Linting
```bash
npm run lint
```
- Check code quality and style compliance
- Fix issues automatically with `npm run lint -- --fix`

---

## 📊 User Access & Login Credentials

### Test Accounts (for demonstration)

```
┌──────────────────────────────────────────────────────────────┐
│                  WAREHOUSE MANAGER (Admin)                   │
├──────────────────────────────────────────────────────────────┤
│  Email: warehouse@logistics.com                              │
│  Password: [configured in Firebase]                          │
│  Role: admin                                                 │
│  Access: Full dashboard, create parcels, manage devices      │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    TRANSPORT AGENT                           │
├──────────────────────────────────────────────────────────────┤
│  Email: transport@logistics.com                              │
│  Password: [configured in Firebase]                          │
│  Role: transporter                                           │
│  Access: Assigned parcels, in-transit monitoring (TODO)      │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    PARCEL OWNER                              │
├──────────────────────────────────────────────────────────────┤
│  Email: owner@example.com                                    │
│  Password: [configured in Firebase]                          │
│  Role: owner                                                 │
│  Access: Track own parcels, view real-time sensors           │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow & Real-Time Updates

### Firebase Database Structure

```
firebase-project/
├── SmartParcels/
│   ├── {deviceId}/
│   │   ├── info/
│   │   │   ├── status: "available" | "assigned" | "offline"
│   │   │   ├── assignedParcelId: "parcel-123"
│   │   │   ├── isOnline: true | false
│   │   │   ├── thresholds: {
│   │   │   │   ├── temperature: { min: 15, max: 25 }
│   │   │   │   ├── humidity: { min: 30, max: 70 }
│   │   │   │   └── vibration: 5.0
│   │   │   └── lastSeen: 1699876543000
│   │   ├── current/
│   │   │   ├── temperature: 22.5
│   │   │   ├── humidity: 55
│   │   │   ├── vibration: 0.2
│   │   │   └── timestamp: 1699876543000
│   │   ├── history/
│   │   │   ├── reading1: { temp, humidity, vibration, timestamp }
│   │   │   └── reading2: { temp, humidity, vibration, timestamp }
│   │   └── alerts/
│   │       ├── alert1: { type: "HIGH_TEMP", value: 28.5, timestamp }
│   │       └── alert2: { type: "HIGH_HUMIDITY", value: 75, timestamp }
│   │
│   └── {deviceId2}/
│       └── [same structure]
│
├── parcels/
│   ├── {parcelId}/
│   │   ├── info: {
│   │   │   ├── receiverName: "receiver"
│   │   │   ├── receiverContact: "+1234567890"
│   │   │   ├── origin: "Warehouse A"
│   │   │   ├── destination: "City B"
│   │   │   ├── deviceId: "device-123"
│   │   │   ├── status: "In Transit"
│   │   │   ├── weight: 2.5
│   │   │   ├── dimensions: "20x15x10 cm"
│   │   │   ├── thresholds: {
│   │   │   │   ├── temperature: { min: 15, max: 25 }
│   │   │   │   ├── humidity: { min: 40, max: 60 }
│   │   │   │   └── vibration: 5.0
│   │   │   ├── createdAt: 1699876543000
│   │   │   └── deliveredAt: null
│   │   └── deviceLog: { ... }
│   │
│   └── {parcelId2}/
│       └── [same structure]
│
└── users/
    ├── {uid}/
    │   └── profile: {
    │       ├── email: "user@example.com"
    │       ├── role: "admin" | "transporter" | "owner"
    │       ├── verified: true | false
    │       ├── banned: false
    │       └── createdAt: 1699876543000
    │
    └── {uid2}/
        └── [same structure]
```

### Real-Time Data Flow

1. **Device Sends Data** → IoT device publishes temperature, humidity, vibration to Firebase every 5 seconds
2. **Firebase Updates** → `SmartParcels/{deviceId}/current/` is updated with latest readings
3. **React Hook Listens** → `useDevices()` hook subscribes to real-time changes
4. **Component Updates** → DevicePoolView and ParcelDetailModal re-render with new data
5. **Threshold Check** → If sensor value exceeds threshold, alert is generated in `SmartParcels/{deviceId}/alerts/`
6. **User Notification** → Toast notification displays alert to user in real-time

---

## ⚠️ Known Issues & Future Enhancements

### Current Implementation
✅ Device pool monitoring with real-time sensor data
✅ Parcel creation with device assignment
✅ Role-based dashboard access
✅ Real-time alerts and notifications
✅ Alert history tracking

### In Development / Open for Contribution
🔄 **Transport Agent Workflow**
   - Parcel pickup acceptance/rejection system
   - In-transit real-time monitoring with alerts
   - Location tracking and map integration
   - Delivery confirmation with signature/OTP
   - Device handoff and validation process
   - Delivery report generation with photos

🔄 **Advanced Features**
   - Data archival for delivered parcels
   - Complete device lifecycle management
   - User management and admin controls
   - Advanced alert lifecycle with auto-resolution
   - Firmware threshold reading verification

### Future Roadmap
- [ ] Mobile app for transport agents
- [ ] GPS/Map integration for location tracking
- [ ] QR code scanning for device/parcel verification
- [ ] Email/SMS notifications for owners
- [ ] Analytics dashboard with delivery metrics
- [ ] Device calibration and maintenance scheduling
- [ ] Offline mode for transport agents
- [ ] Integration with IoT backend API

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Areas Open for Contribution

1. **Transport Agent Dashboard Implementation**
   - Create `TransporterDashboard.jsx` with full workflow
   - Implement pickup assignment interface
   - Build in-transit monitoring system
   - Create delivery confirmation flow

2. **Device Tracking Enhancements**
   - Add GPS/location mapping
   - Implement QR code scanning
   - Create device calibration interface

3. **User Management System**
   - Build admin user management interface
   - Implement user role assignment
   - Create user activity logging

4. **Data Visualization**
   - Enhanced charts for sensor history
   - Real-time alert dashboard
   - Delivery analytics and metrics

### Development Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/transport-agent-pickup`)
3. Make your changes following React best practices
4. Test thoroughly with different user roles
5. Commit with clear messages (`git commit -m 'Add transport agent pickup workflow'`)
6. Push to your branch
7. Create a Pull Request with description of changes

---

## 📞 Support & Documentation

For questions, issues, or feature requests:
- Open an issue on the project repository
- Review Firebase documentation: https://firebase.google.com/docs
- React documentation: https://react.dev
- Tailwind CSS docs: https://tailwindcss.com/docs

---

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 🎓 Getting Started Quick Reference

| Task | Command |
|------|---------|
| Install dependencies | `npm install` |
| Start development server | `npm run dev` |
| Build for production | `npm run build` |
| Preview production build | `npm run preview` |
| Run linter | `npm run lint` |
| Configure Firebase | Edit `.env.local` with Firebase credentials |

---

## 📝 Version History

**v1.0.0** (Current)
- ✅ Warehouse manager dashboard
- ✅ Device pool monitoring
- ✅ Parcel creation with device assignment
- ✅ Real-time sensor data streaming
- ✅ Alert system with notifications
- ✅ Role-based access control
- 🔄 Transport agent workflow (In Progress)

---

**Last Updated**: November 2025
**Project Status**: Active Development - Ready for Demo & Community Contributions



