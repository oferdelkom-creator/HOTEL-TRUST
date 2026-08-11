"use client";

import { useState } from "react";

const INVITE_TEXT =
  "I'm on Hotel Trust - a room exchange network for verified hotel owners. Offer your vacant nights, earn credits, and use them to vacation at other member hotels. Join here:";
const INVITE_URL = "https://hoteltrust.org";

export default function InviteButton() {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text: INVITE_TEXT, url: INVITE_URL });
        return;
      } catch {
        // user cancelled the share sheet or it failed - fall through to copy
      }
    }

    await navigator.clipboard.writeText(`${INVITE_TEXT} ${INVITE_URL}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleClick}
      className="rounded-lg border border-brand-green bg-white p-6 text-left hover:border-brand-gold w-full"
    >
      <h2 className="font-medium mb-1 text-brand-green">Invite a hotel owner</h2>
      <p className="text-sm text-neutral-500">
        {copied ? "Copied - paste it anywhere" : "Share Hotel Trust with a friend who owns a hotel"}
      </p>
    </button>
  );
}
