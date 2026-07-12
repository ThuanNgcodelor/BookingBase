import React from 'react';
import { format } from 'date-fns';
import { getCalendarEventVisual } from './calendarEventVisual';

const CustomEvent = ({ event }) => {
  const visual = getCalendarEventVisual(event);
  const durationMinutes = Math.max(0, Math.round((event.end - event.start) / 60000));
  const isShortEvent = durationMinutes <= 45;

  const isMultiDay = event.start.toDateString() !== event.end.toDateString();
  const timeString = isMultiDay 
    ? `${format(event.start, 'dd/MM')} - ${format(event.end, 'dd/MM')}`
    : `${format(event.start, 'HH:mm')} - ${format(event.end, 'HH:mm')}`;

  return (
    <div className={`h-full w-full overflow-hidden rounded-md border shadow-sm transition-all hover:brightness-95 ${visual.containerClass}`}>
      <div className={`flex h-full min-h-0 flex-col ${isShortEvent ? 'justify-center px-1.5 py-0.5' : 'p-1.5'}`}>
        <div className="flex min-w-0 items-center gap-1">
          <div className="relative h-4 w-4 shrink-0 sm:h-5 sm:w-5">
            {event.avatarUrl ? (
              <img src={event.avatarUrl} referrerPolicy="no-referrer" alt={event.user} className="w-full h-full rounded-full object-cover border border-white/30" />
            ) : (
              <div className={`w-full h-full rounded-full flex items-center justify-center border ${visual.avatarClass}`}>
                <span className="text-[8px] sm:text-[10px] font-bold">
                  {event.user ? event.user.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
            )}
            <div className={`absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full border border-white sm:h-2 sm:w-2 ${visual.dotClass}`}></div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1">
              <span className="truncate text-[10px] font-semibold leading-tight sm:text-xs">
                {event.user}
              </span>
              {visual.label && !isShortEvent && (
                <span className={`shrink-0 rounded-full px-1 text-[8px] font-bold leading-3 sm:text-[9px] ${visual.badgeClass}`}>
                  {visual.label}
                </span>
              )}
            </div>
            <div className="truncate text-[9px] font-medium leading-tight opacity-95 sm:text-[11px]">
              {timeString}
            </div>
          </div>
        </div>
        {!isShortEvent && (
          <div className="mt-1 truncate text-[10px] leading-tight opacity-95 sm:text-[11px]">
            {event.title}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomEvent;
