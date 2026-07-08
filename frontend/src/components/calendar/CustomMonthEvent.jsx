import React from 'react';
import { format } from 'date-fns';

const CustomMonthEvent = ({ event }) => {
  const isRejected = event.status === 'REJECTED';
  const isPending = event.status === 'PENDING';
  const bgClass = isRejected ? 'bg-red-500' : isPending ? 'bg-amber-500' : 'bg-blue-600';

  const timeString = format(event.start, 'HH:mm');
  const label = event.title || event.user;

  return (
    <div
      title={`${timeString} ${label}`}
      className={`flex h-[18px] w-full items-center gap-1 overflow-hidden rounded ${bgClass} px-1 text-white shadow-sm transition-all hover:brightness-95 sm:h-5`}
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
