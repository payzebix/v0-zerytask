/**
 * UUID validation utility
 * Validates that a string is a valid UUIDv4 format
 */

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Check if a string is a valid UUID (v4 format)
 * @param value - The value to validate
 * @returns true if valid UUID, false otherwise
 */
export function isValidUUID(value: any): value is string {
  if (typeof value !== 'string') {
    return false
  }
  return UUID_V4_REGEX.test(value)
}

/**
 * Validate UUID or throw an error with a custom message
 * @param value - The value to validate
 * @param fieldName - The name of the field being validated (for error message)
 * @throws Error if not a valid UUID
 */
export function validateUUID(value: any, fieldName: string = 'ID'): asserts value is string {
  if (!isValidUUID(value)) {
    throw new Error(`Invalid ${fieldName}: "${value}" is not a valid UUID`)
  }
}

/**
 * Create a safe response for invalid UUID
 * @param fieldName - The name of the field that was invalid
 * @returns NextResponse with 400 status
 */
export function invalidUUIDResponse(fieldName: string = 'ID') {
  return {
    error: `Invalid ${fieldName} format`,
    status: 400,
  }
}
