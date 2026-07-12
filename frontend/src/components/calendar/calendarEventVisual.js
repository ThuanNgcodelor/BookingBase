export function getCalendarEventVisual(event, now = new Date()) {
  const start = event?.start instanceof Date ? event.start : new Date(event?.start);
  const end = event?.end instanceof Date ? event.end : new Date(event?.end);
  const status = event?.status;
  const isPast = end < now;
  const isInProgress = start <= now && end >= now;
  const isOverduePending = status === 'PENDING' && isPast;

  if (isOverduePending) {
    return {
      state: 'overdue',
      label: 'Quá hạn',
      containerClass: 'border-orange-300 bg-orange-50 text-orange-900 ring-1 ring-orange-200',
      avatarClass: 'bg-orange-100 text-orange-700 border-orange-200',
      dotClass: 'bg-orange-500',
      monthClass: 'border border-orange-300 bg-orange-50 text-orange-900',
      badgeClass: 'bg-orange-100 text-orange-700',
    };
  }

  if (isInProgress) {
    return {
      state: 'active',
      label: 'Đang diễn ra',
      containerClass: 'border-blue-300 bg-blue-100 text-blue-900 ring-1 ring-blue-200',
      avatarClass: 'bg-blue-50 text-blue-700 border-blue-200',
      dotClass: 'bg-blue-600',
      monthClass: 'border border-blue-300 bg-blue-100 text-blue-900',
      badgeClass: 'bg-blue-200 text-blue-800',
    };
  }

  if (isPast) {
    return {
      state: 'past',
      label: 'Đã qua',
      containerClass: 'border-gray-300 bg-gray-100 text-gray-600',
      avatarClass: 'bg-gray-200 text-gray-600 border-gray-300',
      dotClass: 'bg-gray-400',
      monthClass: 'border border-gray-300 bg-gray-100 text-gray-600',
      badgeClass: 'bg-gray-200 text-gray-600',
    };
  }

  if (status === 'PENDING') {
    return {
      state: 'pending',
      label: 'Chờ duyệt',
      containerClass: 'border-amber-300 bg-amber-500 text-white',
      avatarClass: 'bg-amber-100 text-amber-700 border-white/40',
      dotClass: 'bg-amber-200',
      monthClass: 'bg-amber-500 text-white',
      badgeClass: 'bg-white/20 text-white',
    };
  }

  return {
    state: 'approved',
    label: '',
    containerClass: 'border-blue-700/10 bg-blue-600 text-white',
    avatarClass: 'bg-emerald-100 text-teal-700 border-white/40',
    dotClass: 'bg-emerald-300',
    monthClass: 'bg-blue-600 text-white',
    badgeClass: 'bg-white/20 text-white',
  };
}
