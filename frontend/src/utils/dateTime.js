const pad2 = (value) => String(value).padStart(2, '0');

export function toDateTimeLocalValue(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }

  return [
    date.getFullYear(),
    pad2(date.getMonth() + 1),
    pad2(date.getDate()),
  ].join('-') + `T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function toApiLocalDateTime(value) {
  if (!value) {
    return value;
  }

  return value.length === 16 ? `${value}:00` : value;
}

export function parseApiDateTime(value) {
  if (value instanceof Date) {
    return value;
  }

  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value;
    return new Date(year, month - 1, day, hour, minute, second);
  }

  if (typeof value !== 'string') {
    return new Date(value);
  }

  const localMatch = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,9})?)?$/
  );

  if (localMatch) {
    const [, year, month, day, hour, minute, second = '0'] = localMatch;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    );
  }

  return new Date(value);
}

export function formatViDateTime(value, options) {
  return parseApiDateTime(value).toLocaleString('vi-VN', options);
}

export function formatViDate(value, options) {
  return parseApiDateTime(value).toLocaleDateString('vi-VN', options);
}

export function formatViTime(value, options = { hour: '2-digit', minute: '2-digit' }) {
  return parseApiDateTime(value).toLocaleTimeString('vi-VN', options);
}
