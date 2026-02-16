import { useActor } from '@/hooks/useActor';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UserProfile, UserRole } from '@/backend';
import { safeErrorMessage } from '../partyPayments/components/safeErrorMessage';

const USER_PROFILE_QUERY_KEY = ['currentUserProfile'];
const USER_ROLE_QUERY_KEY = ['currentUserRole'];

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: USER_PROFILE_QUERY_KEY,
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getCallerUserProfile();
      } catch (error: any) {
        // If unauthorized, return null (user not registered yet)
        if (error.message?.includes('Unauthorized')) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetCallerUserRole() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserRole | null>({
    queryKey: USER_ROLE_QUERY_KEY,
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getCallerUserRole();
      } catch (error: any) {
        // If unauthorized, return guest role
        if (error.message?.includes('Unauthorized')) {
          return 'guest' as UserRole;
        }
        throw error;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch (error: any) {
        return false;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useRegisterUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.registerUser();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_ROLE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: USER_PROFILE_QUERY_KEY });
    },
    onError: (error: any) => {
      console.error('Registration error:', safeErrorMessage(error));
    },
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_PROFILE_QUERY_KEY });
    },
    onError: (error: any) => {
      console.error('Save profile error:', safeErrorMessage(error));
    },
  });
}
