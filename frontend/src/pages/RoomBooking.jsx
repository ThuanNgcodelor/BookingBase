import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { endOfDay, endOfMonth, endOfWeek, format, getDay, parse, startOfDay, startOfMonth, startOfWeek } from 'date-fns';
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
import { useResponsiveCalendarView } from '../hooks/useResponsiveCalendarView';
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

const getCalendarRange = (currentDate, currentView) => {
  if (currentView === 'month') {
    return {
      start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
    };
  }

  if (currentView === 'day') {
    return {
      start: startOfDay(currentDate),
      end: endOfDay(currentDate)
    };
  }

  return {
    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
    end: endOfWeek(currentDate, { weekStartsOn: 1 })
  };
};

function isRequestCanceled(error) {
  return error?.name === 'CanceledError' || error?.name === 'AbortError' || error?.code === 'ERR_CANCELED';
}

function RoomBooking() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const { view, setView, layoutRevision } = useResponsiveCalendarView();
  const [date, setDate] = useState(new Date());
  const bookingRequestSeq = useRef(0);

  useEffect(() => {
    const controller = new AbortController();

    const fetchRooms = async () => {
      try {
        const roomsData = await resourceApi.getRooms({ signal: controller.signal });
        setRooms(roomsData || []);
        if (roomsData && roomsData.length > 0) {
          setSelectedRoom((currentRoom) => currentRoom || roomsData[0].id);
        }
      } catch (err) {
        if (isRequestCanceled(err)) return;
        console.error("Lỗi tải danh sách phòng:", err);
      }
    };

    fetchRooms();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const requestSeq = bookingRequestSeq.current + 1;
    bookingRequestSeq.current = requestSeq;

    const fetchBookings = async () => {
      const range = getCalendarRange(date, view);

      try {
        const bookingsData = await bookingApi.getRoomBookings({
          start: format(range.start, "yyyy-MM-dd'T'HH:mm:ss"),
          end: format(range.end, "yyyy-MM-dd'T'HH:mm:ss"),
          roomId: selectedRoom || undefined,
          status: selectedStatus || undefined,
        }, { signal: controller.signal });

        if (controller.signal.aborted || requestSeq !== bookingRequestSeq.current) return;
        setBookings(bookingsData || []);
      } catch (err) {
        if (isRequestCanceled(err) || requestSeq !== bookingRequestSeq.current) return;
        console.error("Lỗi tải dữ liệu lịch:", err);
      }
    };

    fetchBookings();

    return () => controller.abort();
  }, [date, selectedRoom, selectedStatus, view]);

  const events = useMemo(() => (bookings || []).map(b => ({
    id: b.id,
    title: b.title,
    start: parseApiDateTime(b.startTime),
    end: parseApiDateTime(b.endTime),
    user: b.requester?.fullName || 'User',
    avatarUrl: b.requester?.avatarUrl,
    status: b.status,
    roomId: b.room?.id
  })), [bookings]);

  const filteredEvents = useMemo(() => events.filter(e =>
    e.status !== 'REJECTED' && e.status !== 'CANCELLED' &&
    (selectedRoom ? e.roomId === selectedRoom : true)
  ), [events, selectedRoom]);

  const calendarComponents = useMemo(() => ({
    event: CustomEvent,
    month: {
      event: CustomMonthEvent
    },
    header: CustomDateHeader
  }), []);

  const calendarFormats = useMemo(() => ({
    timeGutterFormat: "H'h'",
  }), []);

  const handleCreateClick = useCallback(() => navigate('/rooms/create'), [navigate]);

  const handleSelectSlot = useCallback((slotInfo) => {
    if (slotInfo.start < new Date()) {
      toast.error("Không thể đặt lịch trong quá khứ!");
      return;
    }
    navigate('/rooms/create', { state: { start: slotInfo.start, end: slotInfo.end } });
  }, [navigate]);

  const handleSelectEvent = useCallback((event) => {
    navigate(`/admin/approvals/${event.id}`);
  }, [navigate]);

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
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          resourceType="room"
          onCreateClick={handleCreateClick}
        />

        <Calendar
          key={`room-calendar-${layoutRevision}`}
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
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          scrollToTime={new Date(1970, 1, 1, 7)}
          formats={calendarFormats}
          toolbar={false}
          components={calendarComponents}
          className="booking-calendar h-full font-sans text-sm"
        />
      </div>
    </div >
  );
}

export default memo(RoomBooking);
