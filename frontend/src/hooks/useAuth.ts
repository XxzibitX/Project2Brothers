import { useQuery } from "@tanstack/react-query";
import { getMe, type AuthUser, type UserRole } from "@/api";

export const PROFILE_QUERY_KEY = ["auth", "me"] as const;

export function useAuth() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: getMe,
    retry: false,
    staleTime: 60_000,
  });

  const user: AuthUser | null =
    data && !isError ? data : null;

  const hasRole = (role: UserRole): boolean => user?.role === role;

  const hasAnyRole = (roles: UserRole[]): boolean =>
    user ? roles.includes(user.role) : false;

  const isStaff = user?.role === "manager" || user?.role === "owner";

  return {
    user,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    isAuthenticated: Boolean(user),
    isManager: isStaff,
    isOwner: hasRole("owner"),
    hasRole,
    hasAnyRole,
  };
}
