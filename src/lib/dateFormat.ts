/**
 * Shared date formatting utility
 * Format: MMMM D, YYYY h:mm A (e.g., August 16, 2018 8:02 PM)
 */

export function formatDate(dateInput: string | Date): string {
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput

    if (isNaN(date.getTime())) {
      return 'Invalid date'
    }

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]

    const month = months[date.getMonth()]
    const day = date.getDate()
    const year = date.getFullYear()

    let hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    hours = hours ? hours : 12 // 0 becomes 12

    return `${month} ${day}, ${year} ${hours}:${minutes} ${ampm}`
  } catch {
    return 'Invalid date'
  }
}

/**
 * Short date format for mobile screens
 * Format: MMM D, h:mm A (e.g., Aug 16, 8:02 PM)
 */
export function formatDateShort(dateInput: string | Date): string {
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput

    if (isNaN(date.getTime())) {
      return 'Invalid date'
    }

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]

    const month = months[date.getMonth()]
    const day = date.getDate()

    let hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    hours = hours ? hours : 12 // 0 becomes 12

    return `${month} ${day}, ${hours}:${minutes} ${ampm}`
  } catch {
    return 'Invalid date'
  }
}

/**
 * Ultra-short date format for very small mobile screens
 * Format: M/D H:mm (e.g., 8/16 20:02)
 */
export function formatDateUltraShort(dateInput: string | Date): string {
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput

    if (isNaN(date.getTime())) {
      return 'Invalid date'
    }

    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, '0')

    return `${month}/${day} ${hours}:${minutes}`
  } catch {
    return 'Invalid date'
  }
}
