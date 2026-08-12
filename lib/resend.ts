import { Resend } from "resend";

// The Resend SDK throws at construction time if the key is missing, which
// happens during Next.js's build-time page-data collection (not just at
// request time) - a fallback placeholder keeps the build from breaking if
// the real env var isn't set yet. Sends will just fail (caught as
// best-effort by every caller) instead of taking down the whole app.
export const resend = new Resend(process.env.RESEND_API_KEY ?? "re_build_placeholder");

// hoteltrust.org needs to be verified as a Resend sending domain before
// this address can actually deliver - see README. Domain verification
// covers the whole domain, so any @hoteltrust.org address below can send
// without further Resend setup.
export const EMAIL_FROM = "Hotel Trust <notifications@hoteltrust.org>";
// Human-toned sends (apologies, manual outreach) - kept distinct from the
// automated notifications@ address so they read as a real person writing.
// Note: hoteltrust.org's inbound MX record isn't verified yet, so replies
// to this address won't actually arrive anywhere until that's fixed in DNS.
export const EMAIL_SUPPORT = "Hotel Trust Support <support@hoteltrust.org>";
// General-inquiries address, for anything that isn't a system notification
// or a support reply-to.
export const EMAIL_INFO = "Hotel Trust <info@hoteltrust.org>";
export const ADMIN_EMAIL = "ofer.delkom@gmail.com";
