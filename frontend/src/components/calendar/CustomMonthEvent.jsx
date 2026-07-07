import React from 'react';
import { format } from 'date-fns';

const CustomMonthEvent = ({ event }) => {
  const isApproved = event.status === 'APPROVED';
  const isRejected = event.status === 'REJECTED';
  const isPending = event.status === 'PENDING';

  let bgClass = "bg-[#7bb3e8]"; 
  if (isPending) bgClass = "bg-[#f6b26b]"; 
  if (isRejected) bgClass = "bg-[#e06666]";

  const timeString = format(event.start, 'HH:mm');

  return (
    <div className={`w-full rounded ${bgClass} text-white shadow-sm hover:brightness-95 transition-all border border-black/5 px-1 py-0.5 flex items-center gap-1 overflow-hidden h-5 sm:h-6`}>
      <span className="text-[9px] sm:text-[10px] font-bold whitespace-nowrap">
        {timeString}
      </span>
      <span className="text-[9px] sm:text-[10px] font-semibold truncate">
        {event.user}
      </span>
    </div>
  );
};

export default CustomMonthEvent;
