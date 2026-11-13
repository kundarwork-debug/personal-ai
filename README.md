# NOVA

NOVA is a private personal assistant workspace.

## Stack
- React 18
- Vite
- Lucide icons

## Local development
```bash
npm install
npm run dev
```

## Production build
```bash
npm run build
npm run preview
```

## Security and deployment
NOVA is being designed as a private application. Do not deploy this frontend publicly until the hosting access gate is configured. Google sign-in and the email allowlist must be enforced at the hosting/edge layer or by a server-side authentication service; a frontend-only password screen is not security.

Authorized Google accounts are configured separately from this public source code. Never commit OAuth client secrets, session secrets, or APML service credentials.
