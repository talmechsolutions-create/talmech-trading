# Talmech trader/login/header fix

Replace the files in your project with the same paths from this patch.

## Main fixes
- Fixed `QuotaExceededError` during OTP sign-in by saving only a small safe user session to `localStorage`.
- Prevented full trader/buyer/seller registration objects, base64 images, documents, and raw data from being stored in browser storage.
- Compressed uploaded verification images before sending them to the API to reduce JSON payload size.
- Updated `/api/user-registrations` to return a safe public user summary for sign-in/status checks while keeping full admin data available in the admin user list.
- Added trader preferred registration flow from RoleGate to the sign-in form.
- Cleaned the header UI with final override CSS for better alignment, softer typography, no Home underline, compact right-side trader/account controls, and mobile responsiveness.

## After replacing files
Run:

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Then clear old large localStorage once in browser console:

```js
localStorage.removeItem('talmech-user');
localStorage.removeItem('talmech-registration-draft');
localStorage.removeItem('talmech-upload-preview');
localStorage.removeItem('talmech-documents');
localStorage.removeItem('talmech-images');
location.reload();
```
