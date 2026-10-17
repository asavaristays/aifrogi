function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;", "'": "&#039;" })[character] || character);
}

export function buildPasswordResetEmail(link: string, expiresAt: Date) {
  const expiry = `${expiresAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST`;
  const safeLink = escapeHtml(link);
  return {
    subject: "Reset your AiFrogi password",
    body: `Hello,\n\nUse this secure link to reset your AiFrogi password:\n${link}\n\nThis link expires at ${expiry}.\n\nIf you did not request this, ignore this email. Never share passwords, OTPs, or Meta credentials.\n\nAiFrogi`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#101010"><h1>Reset your AiFrogi password</h1><p>Hello,</p><p>Use this secure link to reset your AiFrogi password:</p><p><a href="${safeLink}" style="display:inline-block;padding:12px 18px;background:#101010;color:#fff;text-decoration:none;border-radius:6px">Reset password</a></p><p>If the button does not open, copy and paste this address into your browser:</p><p style="word-break:break-all"><a href="${safeLink}">${safeLink}</a></p><p>This link expires at ${escapeHtml(expiry)}.</p><p>If you did not request this, ignore this email. Never share passwords, OTPs, or Meta credentials.</p><p>AiFrogi</p></div>`
  };
}
