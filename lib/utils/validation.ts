/**
 * Input validation utilities for security
 */

/**
 * Sanitize string input - remove potentially dangerous characters
 */
export function sanitizeString(input: string, maxLength?: number): string {
  if (typeof input !== 'string') {
    return ''
  }

  // Trim whitespace
  let sanitized = input.trim()

  // Limit length if specified
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }

  return sanitized
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim().toLowerCase())
}

/**
 * Validate username format
 * - 3-20 characters
 * - Alphanumeric, underscore, hyphen only
 * - No spaces
 */
export function isValidUsername(username: string): boolean {
  if (!username || typeof username !== 'string') {
    return false
  }

  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/
  return usernameRegex.test(username.trim())
}

/**
 * Validate password strength
 * - At least 8 characters
 * - Contains at least one letter and one number
 */
export function isValidPassword(password: string): boolean {
  if (!password || typeof password !== 'string') {
    return false
  }

  if (password.length < 8) {
    return false
  }

  // At least one letter and one number
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)

  return hasLetter && hasNumber
}

/**
 * Validate debate topic
 * - 5-200 characters
 * - No HTML tags
 */
export function isValidDebateTopic(topic: string): boolean {
  if (!topic || typeof topic !== 'string') {
    return false
  }

  const trimmed = topic.trim()
  if (trimmed.length < 5 || trimmed.length > 200) {
    return false
  }

  // Check for HTML tags
  const htmlTagRegex = /<[^>]*>/g
  if (htmlTagRegex.test(trimmed)) {
    return false
  }

  return true
}

/**
 * Validate debate description
 * - Max 1000 characters
 * - No HTML tags
 */
export function isValidDebateDescription(description: string | null | undefined): boolean {
  if (!description) {
    return true // Description is optional
  }

  if (typeof description !== 'string') {
    return false
  }

  if (description.length > 1000) {
    return false
  }

  // Check for HTML tags
  const htmlTagRegex = /<[^>]*>/g
  if (htmlTagRegex.test(description)) {
    return false
  }

  return true
}

/**
 * Validate statement content
 * - 10-5000 characters
 * - No HTML tags
 */
export function isValidStatement(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false
  }

  const trimmed = content.trim()
  if (trimmed.length < 10 || trimmed.length > 5000) {
    return false
  }

  // Check for HTML tags
  const htmlTagRegex = /<[^>]*>/g
  if (htmlTagRegex.test(trimmed)) {
    return false
  }

  return true
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') {
    return false
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(text: string): string {
  if (typeof text !== 'string') {
    return ''
  }

  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }

  return text.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * Validate category name
 */
export function isValidCategoryName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false
  }

  // Uppercase, alphanumeric, underscore only
  const categoryRegex = /^[A-Z0-9_]+$/
  return categoryRegex.test(name.trim())
}
