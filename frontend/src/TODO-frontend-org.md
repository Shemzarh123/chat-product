# Frontend Feature-Based Organization Tracker

## 📋 Steps (0/12 complete)

### Phase 1: Setup & Shared (1/3)
- [ ] 1. Create features/, pages/ dirs (implicit via files)
- [ ] 2. Move shared: ProtectedRoute.js, PasswordStrengthMeter.js → components/
- [ ] 3. Verify shared no moves needed

### Phase 2: Move Feature Files (7/7)
- [ ] 4. auth/: AuthModal.js, LoginPage.js, RegisterPage.js
- [ ] 5. chat/: ChatSidebar.js, ChatWidget.js, ChatWindow.js  
- [ ] 6. whatsapp/: WhatsAppLayout.js, WhatsAppLogin.js, WhatsAppRegister.js
- [ ] 7. dashboard/: AdminDashboard.js, PnLDashboard.js, PnLAlert.js
- [ ] 8. billing/: SubscriptionPlans.js, Notifications.js (+ .css)
- [ ] 9. profile/: BusinessProfile.js (+ .css)
- [ ] 10. pages/: TermsOfService.js, PrivacyPolicy.js, StatusView.js

### Phase 3: Update Imports & Cleanup (3/3)
- [ ] 11. Edit App.js: Update all imports to new paths
- [ ] 12. Search/edit cross-feature imports (e.g. WhatsAppLayout → chat/ChatSidebar)
- [ ] 13. Delete empty components/ files; test: cd frontend && npm run build

**Next: Phase 1 → Phase 2 moves**

