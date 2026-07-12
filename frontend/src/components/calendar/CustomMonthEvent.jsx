import React from 'react';
import { format } from 'date-fns';
import { getCalendarEventVisual } from './calendarEventVisual';

const CustomMonthEvent = ({ event }) => {
  const visual = getCalendarEventVisual(event);

  const timeString = format(event.start, 'HH:mm');
  const label = event.title || event.user;
  const title = visual.label ? `${visual.label} - ${timeString} ${label}` : `${timeString} ${label}`;

  return (
    <div
      title={title}
      className={`flex h-[18px] w-full items-center gap-1 overflow-hidden rounded px-1 shadow-sm transition-all hover:brightness-95 sm:h-5 ${visual.monthClass}`}
    >
      <span className="shrink-0 text-[9px] font-bold leading-none sm:text-[10px]">
        {timeString}
      </span>
      <span className="min-w-0 truncate text-[9px] font-semibold leading-none sm:text-[10px]">
        {label}
      </span>
    </div>
  );
};

export default CustomMonthEvent;
