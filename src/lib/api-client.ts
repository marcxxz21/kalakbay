import { getBrowserSessionId, sessionHeaderName } from "@/lib/session";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const sessionId = getBrowserSessionId();

  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      [sessionHeaderName]: sessionId,
      ...(init?.headers ?? {})
    }
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }

  return payload as T;
}
