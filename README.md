# Unlimited Digital Marketplace

A clean Next.js + Supabase application designed for deployment on Vercel.

## Stack
- Next.js App Router
- React + TypeScript
- Supabase Auth and PostgreSQL
- `@supabase/ssr` for cookie-based authentication
- Vercel for deployment

## Included
- Responsive marketplace homepage
- Customer registration and sign-in
- Customer password reset
- Separate protected admin sign-in
- Protected customer account area
- Supabase browser and server clients
- Authentication session middleware

## Environment variables

Set these in Vercel Project Settings → Environment Variables:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Do not commit `.env.local` or any Supabase secret/service-role key to GitHub. Only the publishable key belongs in the `NEXT_PUBLIC_*` variable used by the browser.

## Vercel deployment

This is a standard Next.js project and does not require an AppDeploy runtime, SDK, client, backend, or configuration. Vercel can detect the Next.js framework automatically.

Use the repository root as the Root Directory and keep the default Next.js build settings. Add the Supabase environment variables before deploying.

## Supabase requirements

The application expects the Supabase database/auth configuration used by the app, including the `profiles` table and appropriate Row Level Security policies. Review RLS policies before production use.

## Security

Never place privileged Supabase secret/service-role keys in client-side code or `NEXT_PUBLIC_*` variables.

This project is intended for lawful digital products and services. Do not use it to sell stolen credentials, compromised accounts, payment-card data, or unauthorized access.
