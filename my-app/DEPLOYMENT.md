# WYD deployment checklist

The existing Next.js app is server-rendered and requires a running Node.js server. It cannot be packaged as a static export without replacing the translation API. The Android app connects to the HTTPS deployment and does not contain Supabase credentials or a translation service.

## Configuration

Install with `npm ci`, configure the existing Supabase project's URL and publishable/anon key using `.env.local`, and run `npm run build` followed by `npm run start`. Never expose a Supabase service-role key or a translation-provider secret through `NEXT_PUBLIC_` variables. Do not commit `.env.local`. The `/api/health` endpoint reports whether the two public Supabase settings are present, not whether the database is healthy.

The translation endpoint uses MyMemory, with an optional contact email. Its quotas and availability are controlled by the provider. The cache avoids repeat requests and parallelizes chunks, but cannot guarantee latency or production capacity. A dedicated paid translation provider, quota controls and monitoring should be configured before use with a large international event.

## Production acceptance

- Confirm the actual Supabase schema and migrations. The current repository does not include a complete database migration history. Back up the existing database before changing it.
- Audit Row Level Security, authenticated membership, organizer privileges, read receipts and room termination. The legacy UI uses a locally generated sender ID; this alone is not secure authentication or proof of ownership. Do not assume client-side owner checks enforce authorization.
- Test two independent devices with different languages, including joining by QR, sending and receiving messages, concurrent translations, editing and deleting announcements, schedule and meeting changes, reconnecting after network loss and leaving/ending rooms.
- Confirm public URL, HTTPS, rate limits, provider quotas, privacy notices, data retention and event-specific access policy.
- Verify Android debug APK builds and device camera behavior. Configure a stable app URL and release signing before distribution. Debug builds are not store-ready releases.

The native application is a development deliverable. Production launch remains blocked until the above security and operational checks are completed.
