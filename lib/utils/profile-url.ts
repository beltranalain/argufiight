/**
 * Utility functions for generating profile URLs
 * Uses Instagram-style URLs: domain.com/username
 */

/**
 * Generate a profile URL from a username
 * @param username - The user's username
 * @returns Profile URL (e.g., "/username")
 */
export function getProfileUrl(username: string | null | undefined): string {
  if (!username) {
    return '/'
  }
  return `/${username}`
}

/**
 * Generate a profile URL from user object
 * @param user - User object with username property
 * @returns Profile URL
 */
export function getProfileUrlFromUser(user: { username: string } | null | undefined): string {
  if (!user?.username) {
    return '/'
  }
  return `/${user.username}`
}

