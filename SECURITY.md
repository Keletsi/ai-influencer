# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Motion Studio Pro, please report it responsibly:

1. **DO NOT** open a public GitHub issue
2. Email the details to: security@yourdomain.com (or your security contact)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and provide a timeline for a fix.

## Security Best Practices

### For Users (Deploying Their Own Instance)

#### 1. Environment Variables

**✅ DO:**
- Store all secrets in environment variables
- Use different credentials for development and production
- Rotate API keys regularly (every 90 days)
- Use strong, unique passwords for Supabase

**❌ DON'T:**
- Never commit `.env` files to version control
- Never hardcode credentials in source code
- Never share API keys publicly
- Never use production credentials in development

#### 2. Supabase Security

**✅ DO:**
- Always enable Row Level Security (RLS)
- Use the anon key in frontend code
- Keep service role key server-side only
- Enable email verification for production
- Set up custom SMTP for email delivery
- Regularly review user access and permissions

**❌ DON'T:**
- Never disable RLS policies
- Never expose service role key in frontend
- Never skip email verification in production
- Never use default email templates (customize them)

#### 3. API Keys

**✅ DO:**
- Store Kling AI keys in environment variables
- Use per-user API keys feature (optional)
- Implement rate limiting if needed
- Monitor API usage for anomalies

**❌ DON'T:**
- Never expose API keys in frontend code
- Never share keys between environments
- Never commit keys to git history

#### 4. Database Security

**✅ DO:**
- Use RLS policies for data isolation
- Validate all user inputs
- Use parameterized queries
- Regularly backup your database
- Monitor for unusual queries

**❌ DON'T:**
- Never trust user input
- Never run migrations without backups
- Never expose raw SQL queries to users

#### 5. File Upload Security

**✅ DO:**
- Validate file types and sizes
- Set maximum file size limits
- Use Content-Type checking
- Implement virus scanning (optional)
- Set up automatic cleanup for old files

**❌ DON'T:**
- Never allow unlimited file uploads
- Never trust client-side validation alone
- Never store files without validation

#### 6. Authentication

**✅ DO:**
- Use HTTPS in production (always)
- Enable multi-factor authentication (if available)
- Implement password strength requirements
- Use secure session management
- Log authentication attempts

**❌ DON'T:**
- Never use HTTP in production
- Never store passwords in plain text
- Never implement custom auth without expertise
- Never ignore failed login attempts

### For Developers (Contributing)

#### 1. Code Review

**✅ DO:**
- Review all pull requests for security issues
- Check for hardcoded secrets
- Validate input handling
- Test authentication flows
- Review RLS policy changes

#### 2. Dependencies

**✅ DO:**
- Keep dependencies updated
- Run `npm audit` regularly
- Use `npm audit fix` for auto-fixes
- Review dependency licenses
- Remove unused dependencies

**❌ DON'T:**
- Never ignore security warnings
- Never use packages with known vulnerabilities
- Never add dependencies without review

#### 3. Error Handling

**✅ DO:**
- Log errors securely
- Show generic error messages to users
- Never expose stack traces in production
- Use proper error boundaries

**❌ DON'T:**
- Never log sensitive data (passwords, keys)
- Never expose internal error details
- Never ignore errors silently

## Security Features Included

### ✅ Authentication
- Email/password authentication via Supabase
- OAuth support (Google, GitHub)
- Session management
- Email verification (configurable)

### ✅ Authorization
- Row Level Security (RLS) policies
- User data isolation
- Protected routes
- API authentication

### ✅ Data Protection
- Environment-based secrets
- Secure credential storage
- Encrypted connections (HTTPS)
- API key rotation support

### ✅ Input Validation
- File type validation
- File size limits
- Form validation
- SQL injection protection (via Supabase)

### ✅ Rate Limiting
- Supabase built-in rate limiting
- Optional custom rate limiting
- API request throttling

## Common Vulnerabilities Mitigated

### Cross-Site Scripting (XSS)
- React escapes output by default
- No `dangerouslySetInnerHTML` usage
- Content Security Policy (CSP) ready

### SQL Injection
- Supabase uses parameterized queries
- No raw SQL in frontend
- RLS policies validate access

### Cross-Site Request Forgery (CSRF)
- SameSite cookie attributes
- JWT token authentication
- CORS configuration

### Authentication Bypass
- Protected routes enforce authentication
- Server-side session validation
- RLS policies on database level

### Insecure Direct Object References
- RLS policies prevent unauthorized access
- User ID validation on all requests
- No predictable resource IDs exposed

## Security Checklist

Before deploying to production:

- [ ] All environment variables configured
- [ ] HTTPS enabled (automatic on Vercel/Netlify)
- [ ] RLS policies enabled on all tables
- [ ] Email verification enabled
- [ ] Custom email templates configured
- [ ] Strong database password set
- [ ] API keys rotated from defaults
- [ ] Backup system configured
- [ ] Error logging set up (not logging secrets)
- [ ] Rate limiting configured (if needed)
- [ ] File upload limits set
- [ ] CORS properly configured
- [ ] Dependencies audited (`npm audit`)
- [ ] `.env` not committed to git
- [ ] Production vs development keys separated

## Incident Response

If a security incident occurs:

1. **Immediate Action:**
   - Rotate all API keys immediately
   - Revoke compromised user sessions
   - Block malicious IP addresses (if applicable)
   - Take affected services offline if needed

2. **Investigation:**
   - Check access logs
   - Review database audit logs
   - Identify scope of compromise
   - Document timeline of events

3. **Recovery:**
   - Restore from clean backups if needed
   - Patch vulnerability
   - Deploy fixes
   - Monitor for further issues

4. **Post-Incident:**
   - Notify affected users (if personal data compromised)
   - Update security documentation
   - Improve monitoring
   - Review and update policies

## Security Updates

We regularly review and update security practices:

- **Weekly**: Dependency audits
- **Monthly**: Security review of new code
- **Quarterly**: Full security audit
- **Yearly**: Penetration testing (recommended)

## Contact

For security concerns:
- **Email**: security@yourdomain.com
- **PGP Key**: [Link to PGP key]

---

**Last Updated**: January 2026

This security policy is subject to updates. Check this file regularly for changes.
