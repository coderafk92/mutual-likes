

## Plan: Add Google & Apple Social Login

**Important note:** Lovable Cloud supports **Google** and **Apple** for social login. Discord, Microsoft, and Instagram are **not supported** by the platform. I will add Google and Apple sign-in buttons as optional login methods.

### Changes

**1. Update `src/pages/Auth.tsx`**
- Add Google and Apple sign-in buttons below the existing email/phone login form
- Use `lovable.auth.signInWithOAuth("google")` and `lovable.auth.signInWithOAuth("apple")`
- Add a visual "or continue with" divider between the form and social buttons
- Style buttons with recognizable Google/Apple branding icons
- Handle loading states, errors, and redirects

### Technical Details
- The `lovable` module at `src/integrations/lovable/index.ts` already has `signInWithOAuth` configured
- No database changes needed -- social login creates auth users the same way
- The existing `handle_new_user` trigger will auto-create profiles for social sign-ins
- Both providers use managed credentials (no API keys needed)

