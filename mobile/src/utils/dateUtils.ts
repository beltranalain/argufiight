// Simple date formatting utilities to avoid external dependencies

export function formatDistanceToNow(date: Date | string, options?: { addSuffix?: boolean }): string {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  let result = '';

  if (diffSeconds < 60) {
    result = 'just now';
  } else if (diffMinutes < 60) {
    result = `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    result = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    result = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else if (diffWeeks < 4) {
    result = `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
  } else if (diffMonths < 12) {
    result = `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
  } else {
    result = `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
  }

  if (options?.addSuffix === false) {
    return result.replace(' ago', '');
  }

  return result;
}



