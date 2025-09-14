# Email Configuration Setup

This application supports magic link authentication via email. To enable this feature, you need to configure email environment variables.

## Environment Variables

Add the following variables to your `.env.local` file:

```env
# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here-change-in-production
NEXTAUTH_URL=http://localhost:3000

# Email Configuration
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

## Email Provider Options

### Gmail (Recommended for Development)
1. Enable 2-factor authentication on your Gmail account
2. Generate an "App Password" for this application
3. Use the app password instead of your regular password

### SendGrid (Recommended for Production)
```env
EMAIL_SERVER_HOST=smtp.sendgrid.net
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=apikey
EMAIL_SERVER_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
```

### Mailgun
```env
EMAIL_SERVER_HOST=smtp.mailgun.org
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-mailgun-smtp-username
EMAIL_SERVER_PASSWORD=your-mailgun-smtp-password
EMAIL_FROM=noreply@yourdomain.com
```

### Resend
```env
EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=resend
EMAIL_SERVER_PASSWORD=your-resend-api-key
EMAIL_FROM=noreply@yourdomain.com
```

## Current Status

- ✅ Email provider is conditionally loaded (only when configured)
- ✅ Graceful fallback to demo credentials when email is not configured
- ✅ Clear user messaging about email availability
- ✅ Demo credentials work without email configuration

## Testing

1. **Without Email Configuration**: Use demo credentials (demo@example.com / demo123)
2. **With Email Configuration**: Magic link will be sent to the provided email address

The application will automatically detect if email is properly configured and show appropriate UI messages.
