import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { vi } from 'date-fns/locale/vi';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { Truck } from 'lucide-react';

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
  noEventsInRange: 'Không có lệnh đặt xe nào trong thời gian này.',
  showMore: total => `+ Xem thêm (${total})`
};

// Mock Data
const cars = [
  { id: 'C1', name: 'Ford Transit 16 chỗ (30G-987.65)' },
  { id: 'C2', name: 'Toyota Innova 7 chỗ (29A-123.45)' },
];

const events = [];

export default function CarBooking() {
  const navigate = useNavigate();
  const [selectedCar, setSelectedCar] = useState(cars[0].id);
  const [view, setView] = useState('work_week');
  const [date, setDate] = useState(new Date(2026, 6, 29));

  return (
    <div className="w-full flex flex-col h-[calc(100vh-8rem)]">

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Đặt xe đi công tác</h1>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Truck className="h-4 w-4 text-gray-400" />
            </div>
            <select
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-blue-500 focus:border-blue-500 appearance-none truncate"
              value={selectedCar}
              onChange={(e) => setSelectedCar(e.target.value)}
            >
              {cars.map(car => (
                <option key={car.id} value={car.id}>{car.name}</option>
              ))}
            </select>
          </div>
          <Button onClick={() => navigate('/cars/create')}>Tạo lệnh đặt</Button>
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
            navigate('/cars/create', { state: { start: slotInfo.start, end: slotInfo.end } });
          }}
          onSelectEvent={(event) => navigate(`/admin/approvals/REQ-00${event.id}`)}
          min={new Date(0, 0, 0, 6, 0, 0)}
          max={new Date(0, 0, 0, 22, 0, 0)}
          formats={{ timeGutterFormat: 'HH:mm' }}
          className="h-full font-sans text-sm"
        />
      </div>
    </div>
  );
}
