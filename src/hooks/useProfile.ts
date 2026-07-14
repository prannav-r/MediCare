// ============================================================
// src/hooks/useProfile.ts
// TanStack Query hooks for profile data.
//
// WHY TanStack Query?
// Without it, you'd need to manually manage:
//   - loading states (useState)
//   - error states (useState)
//   - refetching after mutations
//   - caching to prevent redundant API calls
//   - background refresh
//
// TanStack Query handles ALL of this automatically.
//
// PATTERN:
//   useQuery = read data (GET)
//   useMutation = write data (POST/PUT/DELETE)
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profileService } from '@/services/profileService'
import { useAuth } from '@/contexts/AuthContext'
import type { ProfileFormData } from '@/schemas'

// Query key factory — centralizing query keys prevents typos
// and makes cache invalidation reliable across the app.
export const profileKeys = {
  all: ['profiles'] as const,
  detail: (userId: string) => ['profiles', userId] as const,
}

// ── useProfile ───────────────────────────────────────────────
// Fetches the current user's profile (meal timings).
export function useProfile() {
  const { user } = useAuth()

  return useQuery({
    queryKey: profileKeys.detail(user?.id ?? ''),
    queryFn: () => profileService.getProfile(user!.id),
    // Only run this query when user is logged in
    enabled: !!user?.id,
    // Keep data fresh for 5 minutes — meal timings don't change often
    staleTime: 5 * 60 * 1000,
  })
}

// ── useUpsertProfile ─────────────────────────────────────────
// Create or update the profile (meal timings).
export function useUpsertProfile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData: ProfileFormData) =>
      profileService.upsertProfile(user!.id, formData),

    // After a successful mutation, invalidate the profile cache
    // so useProfile() automatically refetches the fresh data.
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: profileKeys.detail(user?.id ?? ''),
      })
    },
  })
}
