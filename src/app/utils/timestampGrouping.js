
/**
 * Groups messages by time proximity and sender for smart timestamp display
 */
export function groupMessagesByTime(messages) {
  if (messages.length === 0) return [];

  const groups = [];
  const TIME_GROUP_WINDOW = 5 * 60 * 1000; // 5 minutes
  const LARGE_GAP_THRESHOLD = 30 * 60 * 1000; // 30 minutes

  for (let i = 0; i < messages.length; i++) {
    const currentMsg = messages[i];
    const prevMsg = messages[i - 1];
    const nextMsg = messages[i + 1];

    const currentTime = new Date(currentMsg.timestamp);
    const prevTime = prevMsg ? new Date(prevMsg.timestamp) : null;
    const nextTime = nextMsg ? new Date(nextMsg.timestamp) : null;

    // Check if this is the start of a new group
    const isNewGroup = !prevMsg ||
      prevMsg.senderId !== currentMsg.senderId ||
      prevMsg.type !== currentMsg.type ||
      (prevTime && currentTime.getTime() - prevTime.getTime() > TIME_GROUP_WINDOW) ||
      !isSameDay(currentTime, prevTime);

    // Check if this is the end of a group
    const isEndOfGroup = !nextMsg ||
      nextMsg.senderId !== currentMsg.senderId ||
      nextMsg.type !== currentMsg.type ||
      (nextTime && nextTime.getTime() - currentTime.getTime() > TIME_GROUP_WINDOW) ||
      !isSameDay(currentTime, nextTime);

    // Determine if we should show timestamp
    const shouldShowTimestamp = isNewGroup ||
      (prevTime && currentTime.getTime() - prevTime.getTime() > LARGE_GAP_THRESHOLD) ||
      !isSameDay(currentTime, prevTime);

    // Check for date boundary
    const shouldShowDateSeparator = !prevMsg || !isSameDay(currentTime, prevTime);

    // Generate time separator text for large gaps within the same day
    let timeSeparatorText;
    if (prevTime && isSameDay(currentTime, prevTime) && (currentTime.getTime() - prevTime.getTime() > LARGE_GAP_THRESHOLD)) {
      timeSeparatorText = formatTimeSeparator(currentTime);
    }

    groups.push({
      messages: [currentMsg],
      isFirstInGroup: isNewGroup,
      isLastInGroup: isEndOfGroup,
      shouldShowTimestamp,
      shouldShowDateSeparator,
      timeSeparatorText
    });
  }

  return groups;
}

/**
 * Checks if two dates are on the same day
 */
function isSameDay(date1, date2) {
  if (!date2) return false;
  return date1.toDateString() === date2.toDateString();
}

/**
 * Formats progressive timestamp based on message age
 */
export function formatProgressiveTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Today - show time only (24-hour by default)
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  } else if (diffDays === 1) {
    // Yesterday
    return 'Yesterday';
  } else if (diffDays < 7) {
    // This week - show day name
    return date.toLocaleDateString([], {
      weekday: 'short',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  } else {
    // Older - show date
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  }
}

/**
 * Formats time separator text for large gaps
 */
function formatTimeSeparator(timestamp, is24Hour = true) {
  // Show time-of-day only to avoid repeating date labels like 'Yesterday'
  return timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !is24Hour
  });
}

/**
 * Formats a compact time-of-day for inline message timestamps (HH:mm)
 */
export function formatTimeOfDay(input, is24Hour = true) {
  const date = typeof input === 'string' ? new Date(input) : input;

  // Check if date is valid
  if (!date || isNaN(date.getTime())) {
    return '--:--';
  }

  // The database stores timestamps as TIMESTAMP (without timezone info)
  // These are stored in the server's local time, but we need to display them in the user's local time
  // Since the server and client might be in different timezones, we need to handle this properly

  // For now, we'll treat the timestamp as-is and let the browser handle the timezone conversion
  // This assumes the server is storing timestamps in a consistent timezone (preferably UTC)

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !is24Hour,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
}

/**
 * Formats date separator for different dates
 */
export function formatDateSeparator(timestamp) {
  const date = new Date(timestamp);

  // Check if date is valid
  if (!date || isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  // The database stores timestamps as TIMESTAMP (without timezone info)
  // Display in the user's local timezone for better UX
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], {
      weekday: 'long',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  } else {
    return date.toLocaleDateString([], {
      month: 'long',
      day: 'numeric',
      ...(date.getFullYear() !== now.getFullYear() && { year: 'numeric' }),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  }
}

/**
 * Gets precise timestamp for hover display
 */
export function getPreciseTimestamp(timestamp, is24Hour = true) {
  const date = new Date(timestamp);

  // Check if date is valid
  if (!date || isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  // The database stores timestamps as TIMESTAMP (without timezone info)
  // Display in the user's local timezone for better UX

  return date.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: !is24Hour,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
}