import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

// hoteltrust.org needs to be verified as a Resend sending domain before
// this address can actually deliver - see README.
export const EMAIL_FROM = "Hotel Trust <notifications@hoteltrust.org>";
export const ADMIN_EMAIL = "ofer.delkom@gmail.com";
