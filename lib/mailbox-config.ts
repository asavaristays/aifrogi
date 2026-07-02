import { BOOKING_INBOX_EMAIL } from "@/lib/channel-config";

export const BOOKING_INBOX_PASSWORD = process.env.BOOKING_INBOX_PASSWORD ?? "";
export const BOOKING_INBOX_FROM_NAME = process.env.BOOKING_INBOX_FROM_NAME ?? "AiFrogi";

export const BOOKING_MAILBOX = {
  email: BOOKING_INBOX_EMAIL,
  password: BOOKING_INBOX_PASSWORD,
  fromName: BOOKING_INBOX_FROM_NAME
} as const;
