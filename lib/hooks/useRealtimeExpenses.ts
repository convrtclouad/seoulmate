"use client";

// Realtime disabled — using localStorage instead of Supabase
// This hook is kept as a no-op for backward compatibility
export function useRealtimeExpenses(_tripId: string) {
  // No-op: localStorage changes trigger React Query invalidation directly
}
