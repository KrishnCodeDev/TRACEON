# Contributing to Logistics Monitoring System

Thank you for your interest in contributing! We welcome contributions of all kinds.

## 🚀 How to Contribute

### 1. **Set Up Your Development Environment**
- Fork the repository
- Clone your fork: `git clone https://github.com/YOUR-USERNAME/web-dashboard.git`
- Navigate to the project: `cd web-dashboard`
- Install dependencies: `npm install`
- Configure Firebase credentials in `.env.local`
- Start development server: `npm run dev`

### 2. **Areas Open for Contribution**

#### **Priority: Transport Agent Workflow** 🔄
- **Assigned Parcels View** - List and manage pickup assignments
- **Pickup Process** - Confirm pickups with device validation
- **Transit Monitoring** - Real-time sensor monitoring dashboard
- **Delivery Completion** - Delivery confirmation with signature/OTP
- **Location Tracking** - GPS/Map integration for parcel tracking

**Related Files to Modify:**
- `src/components/dashboards/TransporterDashboard.jsx` (create this)
- `src/hooks/useParcels.js` (extend for transport operations)
- `src/components/modals/` (add delivery-related modals)

#### **Secondary: Data & Analytics**
- Device performance analytics
- Delivery metrics dashboard
- Data archival for completed parcels
- User activity logging

#### **Tertiary: UX/Polish**
- Mobile responsiveness improvements
- Map integration for tracking
- QR code scanning interface
- Email/SMS notifications

### 3. **Development Guidelines**

**Before Starting:**
- Check existing issues to avoid duplication
- Comment on issues to express interest
- Wait for maintainer feedback before major work

**While Coding:**
- Follow React best practices and hooks patterns
- Use Tailwind CSS for styling (no custom CSS files)
- Keep components focused and reusable
- Add proper error handling and loading states
- Use react-hot-toast for user notifications

**Code Quality:**
```bash
npm run lint              # Check code quality
npm run lint -- --fix     # Auto-fix issues
```

**Naming Conventions:**
- Components: PascalCase (`CreateParcelModal.jsx`)
- Hooks: camelCase with `use` prefix (`useDevices.js`)
- Functions: camelCase (`handleSubmit`, `fetchDevices`)
- Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)

### 4. **Commit Guidelines**

```bash
# Feature branches
git checkout -b feature/transport-agent-pickup
git checkout -b feature/map-integration

# Bug fix branches
git checkout -b fix/device-offline-detection

# Commit messages
git commit -m "feat: Add pickup assignment interface for transport agents"
git commit -m "fix: Resolve device offline detection timeout issue"
git commit -m "docs: Update README with deployment instructions"
```

**Commit Message Format:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style (formatting, missing semicolons, etc.)
- `refactor:` Code restructuring
- `perf:` Performance improvements
- `test:` Adding or updating tests

### 5. **Pull Request Process**

1. **Before Submitting:**
   - Ensure all changes are tested
   - Run `npm run lint -- --fix`
   - Update README if adding new features
   - Add/update relevant documentation

2. **PR Title Format:**
   ```
   [FEATURE] Transport Agent Pickup Assignment
   [FIX] Device Offline Detection Bug
   [DOCS] Update Deployment Guide
   ```

3. **PR Description Template:**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] New Feature
   - [ ] Bug Fix
   - [ ] Documentation Update
   - [ ] UI/UX Improvement

   ## Related Issue
   Fixes #123

   ## Testing
   How to test these changes

   ## Screenshots (if UI changes)
   [Add screenshots here]

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Documentation updated
   - [ ] No new warnings generated
   - [ ] Tested on different user roles
   ```

### 6. **Testing**

**Test with Different User Roles:**
```javascript
// Admin/Warehouse Manager
Email: warehouse@logistics.com

// Transport Agent
Email: transport@logistics.com

// Parcel Owner
Email: owner@example.com
```

**Manual Testing Checklist:**
- [ ] Feature works on Chrome, Firefox, Safari
- [ ] Responsive design on mobile/tablet
- [ ] Real-time updates working (Firebase subscriptions)
- [ ] Error states handled properly
- [ ] Toast notifications display correctly
- [ ] No console errors or warnings

### 7. **Documentation**

**Add Comments For:**
- Complex logic or algorithms
- Custom hooks or utilities
- Firebase queries or updates
- Component prop descriptions

**Example:**
```javascript
// Filters available devices that are online and not assigned
const selectableDevices = availableDevices.filter(d => 
  d.info?.status === 'available' && d.info?.isOnline === true
);
```

### 8. **Common Issues & Solutions**

**Firebase Permission Denied**
- Check `.env.local` credentials
- Verify Firebase rules in Console
- Ensure user role is set in database

**Devices Not Showing**
- Check Firebase Database Rules (fix path to `users/{uid}/profile/role`)
- Verify device data exists in SmartParcels path
- Check browser console for errors

**Hot Reload Not Working**
- Restart dev server: `npm run dev`
- Clear browser cache (Cmd/Ctrl + Shift + Delete)
- Check Vite HMR configuration in vite.config.js

### 9. **Getting Help**

- **Discord/Slack**: [Add community channel link]
- **Issues**: Open GitHub issue with detailed description
- **Discussions**: Start a discussion for feature ideas
- **Email**: [Add maintainer email if applicable]

### 10. **Code Review Process**

Your PR will be reviewed by maintainers who may:
- Request changes or clarifications
- Suggest improvements
- Ask for additional testing
- Request documentation updates

**Response Time:** Usually 2-5 business days

---

## 📋 Checklist Before Pushing

```bash
# Final checks
npm run lint -- --fix          # Fix all lint issues
npm run build                  # Ensure build succeeds
git status                     # Check for unwanted files
git diff                       # Review all changes
```

---

## 🎯 Current Priorities

1. **Transport Agent Dashboard** - In High Demand
2. **Map Integration** - Needed for tracking feature
3. **Data Archival System** - Post-MVP feature
4. **Admin User Management** - Currently showing 0 users

---

Thank you for contributing to make logistics monitoring better! 🚀
