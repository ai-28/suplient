# Google OAuth App Verification Guide
## Complete Step-by-Step Instructions for Publishing and Verifying Suplient

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Step 1: Complete OAuth Consent Screen](#step-1-complete-oauth-consent-screen)
3. [Step 2: Prepare Required Documents](#step-2-prepare-required-documents)
4. [Step 3: Submit for Verification](#step-3-submit-for-verification)
5. [Step 4: Respond to Google's Review](#step-4-respond-to-googles-review)
6. [Step 5: After Approval](#step-5-after-approval)
7. [Timeline & Expectations](#timeline--expectations)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, make sure you have:
- ✅ Google Cloud Console account access
- ✅ Admin access to your domain (suplient.com)
- ✅ Privacy Policy URL (must be publicly accessible)
- ✅ Terms of Service URL (must be publicly accessible)
- ✅ Support email address
- ✅ App logo (recommended, 120x120px minimum)

---

## Step 1: Complete OAuth Consent Screen

### 1.1 Access OAuth Consent Screen
1. Go to: **https://console.cloud.google.com/apis/credentials/consent**
2. Sign in with your Google account
3. Select your project (or create one if needed)

### 1.2 Fill Out App Information

#### **User Type**
- Select: **External** (for public use)
- Click **CREATE**

#### **App Information Tab**

Fill in all required fields:

| Field | What to Enter | Example |
|-------|--------------|---------|
| **App name** | Your app's public name | `Suplient` or `Suplient Coaching Platform` |
| **User support email** | Support email for users | `support@suplient.com` or `aiman@suplient.com` |
| **App logo** | Upload your app logo (120x120px minimum) | Upload your logo file |
| **Application home page** | Your website homepage | `https://suplient.com` |
| **Application privacy policy link** | Your privacy policy page | `https://suplient.com/privacy` |
| **Application terms of service link** | Your terms of service page | `https://suplient.com/terms` |
| **Authorized domains** | Your domain (without http/https) | `suplient.com` |
| **Developer contact information** | Your email | `aiman@suplient.com` |

**Important Notes:**
- Privacy Policy and Terms of Service URLs **MUST be publicly accessible**
- URLs must use HTTPS (secure connection)
- Authorized domains should match your website domain

#### **Scopes Tab**

Click **ADD OR REMOVE SCOPES** and add these scopes:

1. `https://www.googleapis.com/auth/calendar`
2. `https://www.googleapis.com/auth/gmail.send`
3. `https://www.googleapis.com/auth/userinfo.profile`
4. `https://www.googleapis.com/auth/userinfo.email`

For each scope, you'll need to explain how it's used. Use the explanations provided in the "Scope Usage Explanations" section below.

#### **Test Users Tab** (Optional for now)
- You can add test users here if you want to test before verification
- This is optional - you can skip this

### 1.3 Save Your Changes
- Click **SAVE AND CONTINUE** after completing each section
- Review all information before proceeding

---

## Step 2: Prepare Required Documents

### 2.1 Privacy Policy
**Location:** Must be accessible at `https://suplient.com/privacy`

**Required Content:**
- How you collect user data
- How you use Google Calendar data
- How you store user information
- User rights regarding their data
- Contact information for privacy concerns

**Template Sections to Include:**
```
1. Information We Collect
2. How We Use Your Information
3. Google Calendar Integration
4. Data Storage and Security
5. Your Rights
6. Contact Us
```

### 2.2 Terms of Service
**Location:** Must be accessible at `https://suplient.com/terms`

**Required Content:**
- User responsibilities
- Service limitations
- Account termination policies
- Dispute resolution

### 2.3 App Logo
- **Size:** Minimum 120x120 pixels
- **Format:** PNG or JPG
- **Content:** Your app logo (should be clear and professional)

### 2.4 Video Demonstration (May be requested)
Google may ask for a video showing:
- How users connect their Google account
- How the app uses calendar integration
- The user experience flow

**Prepare:**
- 2-3 minute screen recording
- Show the complete flow from login to creating a calendar event
- Upload to YouTube (unlisted) or Google Drive

---

## Step 3: Submit for Verification

### 3.1 Final Review
Before submitting, verify:
- ✅ All required fields are filled
- ✅ Privacy Policy URL is accessible
- ✅ Terms of Service URL is accessible
- ✅ App logo is uploaded
- ✅ All scopes are added with explanations
- ✅ Support email is correct

### 3.2 Publish Your App
1. On the OAuth consent screen, look for **"Publishing status"** section
2. Click **"PUBLISH APP"** or **"SUBMIT FOR VERIFICATION"**
3. You'll see a warning - click **"CONFIRM"**

### 3.3 Fill Out Verification Form

Google will ask several questions. Here are the answers:

#### **App Purpose**
```
Suplient is a coaching platform that enables coaches to schedule sessions with their clients. 
The app automatically creates Google Calendar events with Google Meet links and sends calendar 
invitations to all participants when a session is scheduled.
```

#### **How will the scopes be used?**

**For `https://www.googleapis.com/auth/calendar`:**
```
This scope is used to create calendar events when coaches schedule sessions with clients. 
The app creates Google Calendar events with Google Meet video conference links, adds session 
details (title, description, date, time, duration), and sends calendar invitations to coaches 
and their clients. The meeting links are included in calendar event descriptions for easy access. 
This ensures coaches and clients automatically receive calendar events with meeting links, 
eliminating the need for manual calendar entry.
```

**For `https://www.googleapis.com/auth/gmail.send`:**
```
This scope is requested for future email notification capabilities. The app will use this to 
send email notifications to coaches and clients when sessions are scheduled, and send email 
reminders about upcoming sessions. Currently, calendar invitations are sent via Calendar API, 
but this scope enables future email notification features.
```

**For `https://www.googleapis.com/auth/userinfo.profile`:**
```
This scope is used to retrieve the coach's name from their Google account to display which 
Google account is connected (e.g., "Connected as: John Doe"). This helps coaches verify which 
Google account is linked to their coaching account.
```

**For `https://www.googleapis.com/auth/userinfo.email`:**
```
This scope is used to retrieve the coach's Google account email address. The email is used as 
the calendar event organizer and added to calendar event attendees to ensure coaches receive all 
calendar invitations. This also helps verify the Google account during the connection process.
```

#### **Data Handling**
- **Do you collect user data?** Yes (for calendar integration)
- **What data do you collect?** Google Calendar access for creating events, user email and profile for account identification
- **How do you store data?** Securely in our database, encrypted at rest
- **Do you share data with third parties?** No (unless required by law)

#### **Security Practices**
- **How do you protect user data?** 
  - Encrypted data storage
  - Secure API connections (HTTPS)
  - Regular security audits
  - Access controls and authentication

### 3.4 Submit
- Review all answers
- Click **"SUBMIT"**
- You'll receive a confirmation email

---

## Step 4: Respond to Google's Review

### 4.1 What Happens Next
- Google will review your submission (typically 1-2 weeks)
- You may receive emails asking for clarification
- Check your email regularly (including spam folder)

### 4.2 Common Questions Google May Ask

**Q: Can you provide a video demonstration?**
**A:** Yes, here's a link to a screen recording showing the complete user flow: [YouTube/Drive link]

**Q: Why do you need access to Gmail?**
**A:** We request Gmail send access for future email notification features. Currently, we use Calendar API for invitations, but plan to add email notifications for session reminders.

**Q: How do users revoke access?**
**A:** Users can revoke access at any time through their Google Account settings under "Third-party apps with account access" or through our app's settings page.

### 4.3 Respond Promptly
- Answer questions within 48 hours if possible
- Be clear and specific
- Provide requested documentation or videos

---

## Step 5: After Approval

### 5.1 Approval Notification
- You'll receive an email from Google
- Status will change to "Verified" in Google Cloud Console

### 5.2 What Changes
- ✅ App is now verified
- ✅ Any user can authorize (no test user list needed)
- ✅ Users won't see "unverified app" warnings
- ✅ App can be used by all coaches and clients

### 5.3 Update Your App (if needed)
- No code changes required
- The existing OAuth flow will work automatically
- Users can now connect without restrictions

---

## Timeline & Expectations

### Typical Timeline
- **Submission to first response:** 3-7 business days
- **Review process:** 1-2 weeks (can be longer)
- **Total time:** 2-4 weeks from submission to approval

### Factors That Can Delay Approval
- Missing or incomplete information
- Privacy Policy or Terms not accessible
- Unclear scope explanations
- Security concerns
- High-risk scopes without proper justification

### What to Expect
- **Week 1:** Submission confirmation, initial review
- **Week 2:** Possible questions or requests for clarification
- **Week 3-4:** Final review and approval

---

## Troubleshooting

### Issue: "Privacy Policy URL not accessible"
**Solution:** 
- Ensure the URL uses HTTPS
- Test the URL in an incognito/private browser window
- Make sure the page loads without errors

### Issue: "App logo too small"
**Solution:**
- Use an image editor to resize to at least 120x120 pixels
- Save as PNG or JPG format
- Re-upload the logo

### Issue: "Scope justification insufficient"
**Solution:**
- Be more specific about how each scope is used
- Provide examples of user benefits
- Explain why the scope is necessary (not just convenient)

### Issue: "Verification taking too long"
**Solution:**
- Check your email (including spam) for any requests
- Respond promptly to any questions
- Be patient - Google reviews thousands of apps

### Issue: "Verification rejected"
**Solution:**
- Read the rejection reason carefully
- Address all concerns mentioned
- Resubmit with improvements
- Consider reaching out to Google support if unclear

---

## Scope Usage Explanations (Copy-Paste Ready)

### For Calendar Scope
```
This scope enables Suplient to create Google Calendar events when coaches schedule sessions 
with their clients. The app automatically generates Google Meet video conference links, adds 
session details (title, description, date, time, duration), and sends calendar invitations to 
all participants. Meeting links are included in calendar event descriptions for easy access. 
This eliminates manual calendar entry and ensures coaches and clients have all meeting 
information automatically synced to their calendars.
```

### For Gmail Send Scope
```
This scope is requested for future email notification capabilities. The app will use this to 
send email notifications to coaches and clients when sessions are scheduled, and send email 
reminders about upcoming sessions. While calendar invitations are currently sent via Calendar 
API, this scope enables enhanced email notification features for better user communication.
```

### For Userinfo Profile Scope
```
This scope retrieves the coach's name from their Google account to display which Google 
account is connected to their coaching account. This helps coaches verify their account 
connection and provides a better user experience by showing personalized information.
```

### For Userinfo Email Scope
```
This scope retrieves the coach's Google account email address, which is used as the calendar 
event organizer and added to calendar event attendees. This ensures coaches receive all 
calendar invitations and helps verify the Google account during the connection process.
```

---

## Checklist Before Submission

Use this checklist before submitting:

- [ ] OAuth consent screen is complete
- [ ] App name is entered
- [ ] Support email is entered
- [ ] App logo is uploaded (120x120px minimum)
- [ ] Privacy Policy URL is accessible at https://suplient.com/privacy
- [ ] Terms of Service URL is accessible at https://suplient.com/terms
- [ ] Authorized domain is added (suplient.com)
- [ ] All 4 scopes are added
- [ ] Scope explanations are provided
- [ ] Developer contact email is correct
- [ ] All information is reviewed for accuracy
- [ ] Ready to submit for verification

---

## Important Notes

1. **Don't submit incomplete information** - It will delay the process
2. **Privacy Policy and Terms MUST be live** - Google checks these URLs
3. **Be specific in scope explanations** - Vague answers lead to questions
4. **Respond quickly to Google's questions** - Delays slow down approval
5. **Keep test users list updated** - If using testing mode, add users as needed

---

## Support Resources

- **Google Cloud Console:** https://console.cloud.google.com/
- **OAuth Consent Screen:** https://console.cloud.google.com/apis/credentials/consent
- **Google Verification Help:** https://support.google.com/cloud/answer/9110914
- **Google API Support:** https://support.google.com/cloud/contact/cloud_platform

---

## Contact Information

If you need help during the verification process:
- **Developer Email:** aiman@suplient.com
- **Support Email:** support@suplient.com (or your support email)
- **App Website:** https://suplient.com

---

**Last Updated:** [Current Date]
**Version:** 1.0

---

## Quick Reference: Key URLs

- **OAuth Consent Screen:** https://console.cloud.google.com/apis/credentials/consent
- **Privacy Policy:** https://suplient.com/privacy
- **Terms of Service:** https://suplient.com/terms
- **App Homepage:** https://suplient.com

---

**Good luck with your verification! 🚀**

