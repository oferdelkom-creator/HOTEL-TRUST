// Shared branded wrapper for every transactional email - keeps the logo
// and look consistent without repeating markup in every notify route.
export function renderEmail(bodyHtml: string): string {
  return `
  <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <img src="https://hoteltrust.org/logo.png" alt="Hotel Trust" width="160" style="max-width: 160px; height: auto;" />
    </div>
    <div style="background: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 24px; color: #1c1917; font-size: 15px; line-height: 1.5;">
      ${bodyHtml}
    </div>
    <p style="text-align: center; color: #a3a3a3; font-size: 12px; margin-top: 16px;">
      Hotel Trust - a verified-owner-only room exchange network.
    </p>
  </div>
  `;
}
