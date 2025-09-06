# Supabase Email Setup Guide

This guide helps you configure Supabase to properly handle email change confirmations and redirect users to the correct page in your Image Generator application.

## 1. Supabase Dashboard Configuration

### Redirect URLs Configuration

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Settings** > **URL Configuration**
3. Add the following redirect URLs:

```
http://localhost:5173/auth/confirm
http://localhost:5173/reset-password
https://yourdomain.com/auth/confirm
https://yourdomain.com/reset-password
```

Replace `yourdomain.com` with your actual production domain.

### Site URL Configuration

Set your Site URL to:
- Development: `http://localhost:5173`
- Production: `https://yourdomain.com`

## 2. Email Template Configuration

### Email Change Confirmation Template

1. Go to **Authentication** > **Email Templates**
2. Select **Change Email Address** template
3. Update the email template with your custom HTML template:

```html
<!-- Use the EnhancedEmailChangeTemplate.html content here -->
<!-- Replace variables as needed: -->
<!-- {{OLD_EMAIL}} -> {{ .Email }} -->
<!-- {{NEW_EMAIL}} -> {{ .NewEmail }} -->
<!-- {{CONFIRMATION_LINK}} -> {{ .ConfirmationURL }} -->
<!-- {{SUPPORT_EMAIL}} -> your-support@yourdomain.com -->
<!-- {{CURRENT_YEAR}} -> 2024 -->
<!-- {{CURRENT_DATE}} -> {{ .Date }} -->
```

### Required Email Template Variables

Make sure to update these placeholders in your template:
- `{{OLD_EMAIL}}` → `{{ .Email }}`
- `{{NEW_EMAIL}}` → `{{ .NewEmail }}`
- `{{CONFIRMATION_LINK}}` → `{{ .ConfirmationURL }}`
- `{{SUPPORT_EMAIL}}` → Your actual support email
- `{{CURRENT_YEAR}}` → Current year or `{{ .Date | date "2006" }}`
- `{{CURRENT_DATE}}` → `{{ .Date | date "January 2, 2006" }}`

## 3. SMTP Configuration (Optional but Recommended)

For better email deliverability, configure custom SMTP:

1. Go to **Settings** > **Auth** > **SMTP Settings**
2. Configure your SMTP provider (SendGrid, Mailgun, etc.)
3. Test the configuration

## 4. Email Settings

### Authentication Settings

1. Go to **Authentication** > **Settings**
2. Configure the following:
   - **Enable email confirmations**: ✅
   - **Enable email change confirmations**: ✅
   - **Double confirm email changes**: ✅ (Recommended for security)

### Security Settings

- **Confirmation token expiry**: 24 hours (default)
- **Enable secure email change flow**: ✅

## 5. Testing the Email Flow

### Test Email Change

1. Sign in to your application
2. Go to Profile Settings
3. Change your email address
4. Check both old and new email inboxes
5. Click the confirmation link
6. Verify you're redirected to `/auth/confirm`
7. Confirm the success message appears
8. Try signing in with the new email

### Expected Flow

1. User initiates email change → Gets logged out
2. Confirmation emails sent to both addresses
3. User clicks confirmation link
4. Redirected to `/auth/confirm` page
5. Success message displayed
6. Auto-redirect to home page after 3 seconds
7. User can sign in with new email

## 6. Troubleshooting

### Common Issues

1. **Redirect to landing page instead of confirm page**
   - Check redirect URL configuration in Supabase dashboard
   - Verify `/auth/confirm` route exists in your application

2. **Email not received**
   - Check spam folder
   - Verify SMTP configuration
   - Check email template is properly saved

3. **Confirmation link invalid**
   - Check token expiry settings
   - Verify URL parameters are being passed correctly

4. **Styling issues in email**
   - Test email template in different email clients
   - Ensure CSS is inline for better compatibility

### Debug Steps

1. Check browser console for errors
2. Verify URL parameters on `/auth/confirm` page
3. Test with different email providers
4. Check Supabase logs for authentication events

## 7. Production Deployment

### Environment Variables

Ensure these are set in production:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Domain Configuration

Update redirect URLs in Supabase dashboard with your production domain:
```
https://yourdomain.com/auth/confirm
```

## 8. Security Considerations

1. **Auto-logout on email change**: The application automatically logs users out when they change their email for security
2. **Double confirmation**: Both old and new email addresses receive confirmation emails
3. **Token expiry**: Confirmation tokens expire after 24 hours
4. **HTTPS in production**: Always use HTTPS for production deployments

## Support

If you encounter issues:
1. Check Supabase dashboard logs
2. Verify all configuration steps
3. Test in incognito/private browser mode
4. Contact support with specific error messages