import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { vi } from 'date-fns/locale/vi';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';

const locales = { 'vi': vi };
const localizer = dateFnsLocalizer({
  format, parse, startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), getDay, locales,
});

const messages = {
  today: 'Hôm nay',
  previous: 'Trước',
  next: 'Tiếp',
  month: 'Tháng',
  week: 'Tuần',
  work_week: 'Tuần làm việc',
  day: 'Ngày',
  agenda: 'Lịch trình',
  date: 'Ngày',
  time: 'Thời gian',
  event: 'Sự kiện',
  noEventsInRange: 'Không có lịch đặt nào trong thời gian này.',
  showMore: total => `+ Xem thêm (${total})`
};

// Mock Data
const rooms = [
  { id: 'R1', name: 'Phòng Hội đồng 1 (Sức chứa 20 người)' },
  { id: 'R2', name: 'Phòng Hội đồng 2 (Sức chứa 10 người)' },
  { id: 'R3', name: 'Phòng Đào tạo (Sức chứa 50 người)' },
];

const events = [
  { id: 1, title: 'Họp Marketing', start: new Date(2026, 6, 29, 9, 0), end: new Date(2026, 6, 29, 10, 30), user: 'Duy', status: 'APPROVED' },
];

export default function RoomBooking() {
  const navigate = useNavigate();
  const [selectedRoom, setSelectedRoom] = useState(rooms[0].id);
  const [view, setView] = useState('work_week');
  const [date, setDate] = useState(new Date(2026, 6, 29));

  return (
    <div className="w-full flex flex-col h-[calc(100vh-8rem)]">

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Đặt phòng họp</h1>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building2 className="h-4 w-4 text-gray-400" />
            </div>
            <select
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-blue-500 focus:border-blue-500 appearance-none"
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
            >
              {rooms.map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
          </div>
          <Button onClick={() => navigate('/rooms/create')}>Đặt phòng</Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-4 overflow-hidden flex flex-col">
        <style>{`
          .rbc-time-view, .rbc-month-view { border: none; }
          .rbc-time-header { border-bottom: 1px solid #f3f4f6; }
          .rbc-time-content { border-top: none; }
          .rbc-time-slot { min-height: 40px; border-bottom: 1px solid #f9fafb; }
          .rbc-timeslot-group { border-bottom: 1px solid #e5e7eb; }
          .rbc-day-slot .rbc-time-slot { border-top: none; }
          .rbc-event { background-color: transparent !important; padding: 0 !important; border: none !important; }
          .rbc-header { padding: 10px 0; border-bottom: none; font-weight: 500; color: #4b5563; }
          .rbc-today { background-color: #f8fafc; }
          .rbc-time-gutter .rbc-timeslot-group { border-right: none; }
          .rbc-label { font-size: 0.75rem; color: #6b7280; padding: 0 4px; }
        `}</style>

        <Calendar
          localizer={localizer}
          events={events}
          messages={messages}
          defaultView="work_week"
          views={['work_week', 'day', 'agenda']}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          selectable
          onSelectSlot={(slotInfo) => {
            if (slotInfo.start < new Date()) {
              alert("Không thể đặt lịch trong quá khứ!");
              return;
            }
            navigate('/rooms/create', { state: { start: slotInfo.start, end: slotInfo.end } });
          }}
          onSelectEvent={(event) => navigate(`/admin/approvals/REQ-00${event.id}`)}
          min={new Date(0, 0, 0, 7, 0, 0)}
          max={new Date(0, 0, 0, 20, 0, 0)}
          formats={{ timeGutterFormat: 'HH:mm' }}
          components={{
            event: ({ event }) => (
              <div className={`${event.status === 'APPROVED' ? 'bg-[#3bb371]' : 'bg-[#eab308]'} text-white text-xs p-1.5 rounded h-full overflow-hidden leading-tight`}>
                <div className="font-semibold truncate">{event.user}</div>
                <div className="truncate opacity-90">{event.title}</div>
              </div>
            )
          }}
          className="h-full font-sans text-sm"
        />
      </div>
    </div >
  );
}
