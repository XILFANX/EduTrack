/**
 * Centralized auth utility for role-based routing.
 *
 * Access model — 4 portals only:
 *  - /admin          → platform_owner (jxilfanx@gmail.com — hardcoded)
 *  - /dashboard      → landlord (signs up via main website)
 *  - /caretaker      → caretaker (accesses via permanent invite link)
 *  - /tenant         → tenant (accesses via permanent invite link)
 */

export const PLATFORM_OWNER_EMAIL = 'jxilfanx@gmail.com'

export type UserRole =
  | 'landlord'
  | 'caretaker'
  | 'tenant'
  | 'platform_owner'

/**
 * Returns the correct redirect URL for a given role.
 * Legacy roles (property_manager, accountant) map to /dashboard.
 */
export function getPortalUrl(role: UserRole | string | null, hasLandlordRecord: boolean = true): string {
  switch (role) {
    case 'platform_owner':
      return '/admin/dashboard'
    case 'tenant':
      return '/tenant/dashboard'
    case 'caretaker':
      return '/caretaker/dashboard'
    case 'landlord':
      return hasLandlordRecord ? '/dashboard' : '/onboarding'
    // Legacy roles — redirect to landlord portal
    case 'property_manager':
    case 'accountant':
      return '/dashboard'
    default:
      return '/onboarding'
  }
}

/**
 * Checks if an email is the hardcoded platform owner.
 */
export function isPlatformOwner(email: string | null | undefined): boolean {
  return email?.toLowerCase() === PLATFORM_OWNER_EMAIL.toLowerCase()
}
