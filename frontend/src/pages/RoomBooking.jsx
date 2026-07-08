import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { vi } from 'date-fns/locale/vi';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useNavigate } from 'react-router-dom';
import { resourceApi } from '../api/resourceApi';
import { bookingApi } from '../api/bookingApi';
import CustomToolbar from '../components/calendar/CustomToolbar';
import CustomEvent from '../components/calendar/CustomEvent';
import CustomMonthEvent from '../components/calendar/CustomMonthEvent';
import CustomDateHeader from '../components/calendar/CustomDateHeader';
import '../components/calendar/bookingCalendar.css';
import { parseApiDateTime } from '../utils/dateTime';
import toast from 'react-hot-toast';

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

export default function RoomBooking() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [view, setView] = useState(window.innerWidth < 768 ? 'day' : 'week');
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsData, bookingsData] = await Promise.all([
          resourceApi.getRooms(),
          bookingApi.getRoomBookings()
        ]);
        
        setRooms(roomsData || []);
        if (roomsData && roomsData.length > 0) {
          setSelectedRoom(roomsData[0].id);
        }

        const mappedEvents = (bookingsData || []).map(b => ({
          id: b.id,
          title: b.title,
          start: parseApiDateTime(b.startTime),
          end: parseApiDateTime(b.endTime),
          user: b.requester?.fullName || 'User',
          avatarUrl: b.requester?.avatarUrl,
          status: b.status,
          roomId: b.room?.id
        }));
        setEvents(mappedEvents);
      } catch (err) {
        console.error("Lỗi tải dữ liệu lịch:", err);
      }
    };
    fetchData();
  }, []);

  const filteredEvents = events.filter(e => 
    e.status !== 'REJECTED' && e.status !== 'CANCELLED' && 
    (selectedRoom ? e.roomId === selectedRoom : true)
  );

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Calendar Grid */}
      <div className="flex-1 bg-white p-4 sm:px-6 overflow-y-auto overflow-x-hidden flex flex-col">
        <CustomToolbar 
          date={date}
          view={view}
          onNavigate={setDate}
          onView={setView}
          resources={rooms}
          selectedResource={selectedRoom}
          onResourceChange={setSelectedRoom}
          resourceType="room"
          onCreateClick={() => navigate('/rooms/create')}
        />

        <Calendar
          localizer={localizer}
          events={filteredEvents}
          messages={messages}
          defaultView="week"
          views={['month', 'week', 'day']}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          step={30}
          timeslots={2}
          min={new Date(1970, 0, 1, 0, 0)}
          max={new Date(1970, 0, 1, 23, 59)}
          showMultiDayTimes={true}
          selectable
          popup
          showAllEvents={false}
          allDayMaxRows={1}
          dayLayoutAlgorithm="no-overlap"
          onSelectSlot={(slotInfo) => {
            if (slotInfo.start < new Date()) {
              toast.error("Không thể đặt lịch trong quá khứ!");
              return;
            }
            navigate('/rooms/create', { state: { start: slotInfo.start, end: slotInfo.end } });
          }}
          onSelectEvent={(event) => navigate(`/admin/approvals/${event.id}`)}
          scrollToTime={new Date(1970, 1, 1, 7)}
          formats={{ 
            timeGutterFormat: "H'h'",
          }}
          toolbar={false}
          components={{
            event: CustomEvent,
            month: {
              event: CustomMonthEvent
            },
            header: CustomDateHeader
          }}
          className="booking-calendar h-full font-sans text-sm"
        />
      </div>
    </div >
  );
}
