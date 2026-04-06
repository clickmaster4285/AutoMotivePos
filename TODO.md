# Contact Form Auto-Reply Fix

## Steps:
### 1. ✅ Update backend/utils/sendEmail.js
   - Add `to` param support
   - Use `to` instead of hardcoded `RECEIVER_EMAIL`
   - Keep `replyTo` for admin notifications

### 2. [ ] Test
   - LandingPage contact form → verify auto-reply to user's email
