// src/lib/admin.ts
const ADMIN_EMAILS = ["adm@gmail.com"]

export function isAdminEmail(email?: string | null) {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.trim().toLowerCase())
}