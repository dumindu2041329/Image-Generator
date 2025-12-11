# Clerk + Supabase JWT Configuration Guide

## Problem
Images are not being saved to Supabase storage and database because the Clerk JWT token doesn't have the proper claims for Supabase RLS (Row Level Security) policies.

## Solution: Configure Clerk JWT Template for Supabase

### Step 1: Create Supabase JWT Template in Clerk

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **JWT Templates** in the left sidebar
4. Click **+ New Template**
5. Select **Supabase** from the template options
6. Name it: `supabase`

### Step 2: Configure the JWT Claims

In the JWT template editor, ensure these claims are set:

```json
{
  "aud": "authenticated",
  "iss": "https://{{clerk_domain}}",
  "sub": "{{user.id}}",
  "email": "{{user.primary_email_address}}",
  "app_metadata": {
    "provider": "clerk"
  },
  "user_metadata": {}
}
```

**Important:** Do NOT include `exp` or `iat` claims - these are reserved and automatically added by Clerk.

**Critical:** The `sub` claim MUST contain `{{user.id}}` - this is what matches the `user_id` in your Supabase RLS policies.

### Step 3: Verify Supabase RLS Policies

Your Supabase should have the `auth_ext_id()` function that reads the JWT `sub` claim:

```sql
create or replace function public.auth_ext_id()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::jsonb->>'sub',''),
    nullif(current_setting('request.jwt.claims', true)::jsonb->>'user_id','')
  );
$$;
```

This function is used in your RLS policies to match `user_id` with the JWT `sub` claim.

### Step 4: Test the Configuration

After setting up the JWT template:

1. **Clear your browser cache** and **log out** of the application
2. **Log back in** to get a fresh JWT token
3. Open browser DevTools → Console
4. Generate an image
5. Look for these console logs:
   - `✅ Using Clerk Supabase JWT template` (confirms template is working)
   - `🔑 JWT Claims:` (shows the claims in the token)
   - Check that `sub` matches your Clerk user ID

### Step 5: Verify Storage Upload

After generating an image, check the console for:

```
✅ Storage upload successful
✅ Public URL obtained
💾 Saving to database with storage URL
✅ Storage upload + database insert successful!
```

If you see errors, check:
- The JWT `sub` claim matches your user ID
- The file path format is `{userId}/{filename}.{ext}`
- Storage policies allow uploads to paths starting with your user ID

## Common Issues

### Issue 1: "Storage client not available"
**Solution:** Make sure you're logged in and Clerk session is active.

### Issue 2: "Storage upload failed: new row violates row-level security policy"
**Solution:** 
- Verify the JWT template is created and named `supabase`
- Check that the `sub` claim in JWT matches the `user_id` in storage path
- Ensure you've logged out and back in after creating the template

### Issue 3: "Supabase template not configured in Clerk, using default token"
**Solution:**
- Create the JWT template in Clerk Dashboard
- Name it exactly `supabase` (lowercase)
- Log out and log back in

### Issue 4: CORS errors when fetching images
**Solution:** This is expected for external image URLs. The app now has retry logic and will fall back to saving the direct URL if needed.

### Issue 5: "Found existing image with same URL or prompt, skipping save"
**Solution:** This was a bug in duplicate detection that has been fixed. The app now only checks for duplicate URLs, not prompts, so you can generate multiple images with the same prompt.

## Debugging

Enable detailed logging in the browser console to see:
1. JWT token type being used
2. JWT claims (sub, user_id, etc.)
3. Storage upload attempts and responses
4. Database insert operations
5. Error details with status codes

All logs are prefixed with emojis for easy identification:
- 🎨 Image generation
- 🔑 JWT token operations
- 📤 Storage uploads
- 💾 Database operations
- ✅ Success
- ⚠️ Warnings
- ❌ Errors

## Verification Checklist

- [ ] Clerk JWT template named `supabase` exists
- [ ] JWT template includes `sub` claim with `{{user.id}}`
- [ ] Logged out and logged back in to get fresh token
- [ ] Console shows "Using Clerk Supabase JWT template"
- [ ] JWT Claims log shows valid `sub` value
- [ ] Storage upload succeeds without RLS policy errors
- [ ] Database insert succeeds
- [ ] Images appear in "My Images" page
