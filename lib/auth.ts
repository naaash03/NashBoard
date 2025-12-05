import { cookies } from "next/headers";

const USER_COOKIE = "nashboard_user_id";

export async function getCurrentUserId(): Promise<string | null> {
  try {
    const store = cookies();
    const value = store.get(USER_COOKIE)?.value ?? null;
    return value;
  } catch {
    // If cookies() is unavailable in this context, fail soft.
    return null;
  }
}

export function setUserCookie(response: Response, userId: string): Response {
  // Placeholder for centralized cookie handling (set directly in routes for now)
  void userId;
  return response;
}

export const USER_COOKIE_NAME = USER_COOKIE;
