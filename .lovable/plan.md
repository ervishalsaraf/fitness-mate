

## Plan: Enable SMTP Email Notifications for FitConnect24

This plan will set up a complete email notification system for your app using Resend as the email service provider. It will cover authentication emails, event notifications, and social/buddy notifications.

---

### Overview

Your app will be able to send emails for:
- **Authentication**: Password reset links, email verification, welcome emails
- **Event notifications**: Upcoming event reminders, new member joined, event updates/cancellations
- **Social notifications**: New buddy requests, buddy request accepted, new messages received

---

### What You'll Need to Do First

Before I can implement the email system, you'll need to:

1. **Sign up for Resend** (free tier available)
   - Go to https://resend.com and create an account

2. **Verify your email domain**
   - Go to https://resend.com/domains and add your domain (e.g., fitconnect24.com)
   - This ensures emails are sent from your domain, not a generic one

3. **Create an API key**
   - Go to https://resend.com/api-keys and create a new API key
   - You'll provide this key when prompted

---

### Implementation Steps

#### Step 1: Add Email Preferences to User Profiles

Add a new database column to allow users to opt-in/out of email notifications:

```text
profiles table additions:
- email_notifications: boolean (default: true)
```

#### Step 2: Create Email Templates

Create a reusable edge function with React Email templates:

```text
supabase/functions/send-email/
  ├── index.ts (main handler)
  └── _templates/
      ├── password-reset.tsx
      ├── welcome.tsx
      ├── event-reminder.tsx
      ├── event-update.tsx
      ├── buddy-request.tsx
      └── new-message.tsx
```

Each template will be branded with FitConnect24 styling and responsive for mobile.

#### Step 3: Create Notification Edge Functions

Create dedicated edge functions for each notification type:

| Function | Purpose | Trigger |
|----------|---------|---------|
| `send-auth-email` | Password reset, verification | Auth events |
| `send-event-notification` | Event reminders, updates | Cron job + manual |
| `send-buddy-notification` | Buddy requests, accepts | Database trigger |

#### Step 4: Set Up Database Triggers

Create triggers to automatically send emails when:
- A new buddy connection is created (pending status)
- A buddy request is accepted
- An event is updated or cancelled
- A new message is received (digest or instant)

#### Step 5: Add Email Notification Settings in Profile

Update the Profile page to include email notification preferences:
- Toggle for all email notifications
- Optional: granular controls for different notification types

---

### Technical Architecture

```text
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│   User Action   │────▶│  Database/Auth   │────▶│  Edge Func  │
│ (buddy request) │     │    (trigger)     │     │(send-email) │
└─────────────────┘     └──────────────────┘     └──────┬──────┘
                                                        │
                                                        ▼
                                                 ┌─────────────┐
                                                 │   Resend    │
                                                 │    API      │
                                                 └──────┬──────┘
                                                        │
                                                        ▼
                                                 ┌─────────────┐
                                                 │  User Email │
                                                 └─────────────┘
```

---

### Email Types Summary

| Category | Email Type | When Sent |
|----------|------------|-----------|
| Auth | Password Reset | User requests reset |
| Auth | Welcome | After signup |
| Auth | Email Verification | After signup (if enabled) |
| Event | Reminder | 24h before event |
| Event | Update | Event details changed |
| Event | Cancellation | Event cancelled |
| Event | New Member | Someone joins your event |
| Social | Buddy Request | Someone sends you a request |
| Social | Request Accepted | Your request was accepted |
| Social | New Message | You receive a message |

---

### Required Secret

Once you approve this plan, I'll ask you to provide:

- **RESEND_API_KEY**: Your API key from Resend dashboard

---

### Files to Create/Modify

**New Files:**
- `supabase/functions/send-email/index.ts`
- `supabase/functions/send-email/_templates/password-reset.tsx`
- `supabase/functions/send-email/_templates/welcome.tsx`
- `supabase/functions/send-email/_templates/event-reminder.tsx`
- `supabase/functions/send-email/_templates/buddy-request.tsx`
- `supabase/functions/send-notification-email/index.ts` (wrapper for app notifications)

**Modified Files:**
- `src/pages/Profile.tsx` (add email notification toggle)
- Database migration (add `email_notifications` column)
- `supabase/config.toml` (add new functions)

