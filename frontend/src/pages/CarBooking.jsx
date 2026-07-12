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
  noEventsInRange: 'Không có lệnh đặt xe nào trong thời gian này.',
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

function buildCarEventTitle(booking) {
  if (booking.title) return booking.title;
  const route = [booking.departure, booking.destination].filter(Boolean).join(' - ');
  return route || 'Đặt xe';
}

function CarBooking() {
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedCar, setSelectedCar] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const { view, setView, layoutRevision } = useResponsiveCalendarView();
  const [date, setDate] = useState(new Date());
  const bookingRequestSeq = useRef(0);

  useEffect(() => {
    const controller = new AbortController();

    const fetchCars = async () => {
      try {
        const carsData = await resourceApi.getCars({ signal: controller.signal });
        setCars(carsData || []);
        if (carsData && carsData.length > 0) {
          setSelectedCar((currentCar) => currentCar || carsData[0].id);
        }
      } catch (err) {
        if (isRequestCanceled(err)) return;
        console.error("Lỗi tải danh sách xe:", err);
      }
    };

    fetchCars();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const requestSeq = bookingRequestSeq.current + 1;
    bookingRequestSeq.current = requestSeq;

    const fetchBookings = async () => {
      const range = getCalendarRange(date, view);

      try {
        const bookingsData = await bookingApi.getCarBookings({
          start: format(range.start, "yyyy-MM-dd'T'HH:mm:ss"),
          end: format(range.end, "yyyy-MM-dd'T'HH:mm:ss"),
          vehicleId: selectedCar || undefined,
          status: selectedStatus || undefined,
        }, { signal: controller.signal });

        if (controller.signal.aborted || requestSeq !== bookingRequestSeq.current) return;
        setBookings(bookingsData || []);
      } catch (err) {
        if (isRequestCanceled(err) || requestSeq !== bookingRequestSeq.current) return;
        console.error("Lỗi tải dữ liệu lịch xe:", err);
      }
    };

    fetchBookings();

    return () => controller.abort();
  }, [date, selectedCar, selectedStatus, view]);

  const events = useMemo(() => (bookings || []).map(b => ({
    id: b.id,
    title: buildCarEventTitle(b),
    start: parseApiDateTime(b.startTime),
    end: parseApiDateTime(b.endTime),
    user: b.requester?.fullName || 'User',
    avatarUrl: b.requester?.avatarUrl,
    status: b.status,
    vehicleId: b.vehicle?.id
  })), [bookings]);

  const filteredEvents = useMemo(() => events.filter(e =>
    e.status !== 'REJECTED' && e.status !== 'CANCELLED' &&
    (selectedCar ? e.vehicleId === selectedCar : true)
  ), [events, selectedCar]);

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

  const handleCreateClick = useCallback(() => navigate('/cars/create'), [navigate]);

  const handleSelectSlot = useCallback((slotInfo) => {
    if (slotInfo.start < new Date()) {
      toast.error("Không thể đặt lịch trong quá khứ!");
      return;
    }
    navigate('/cars/create', { state: { start: slotInfo.start, end: slotInfo.end } });
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
          resources={cars}
          selectedResource={selectedCar}
          onResourceChange={setSelectedCar}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          resourceType="car"
          onCreateClick={handleCreateClick}
        />

        <Calendar
          key={`car-calendar-${layoutRevision}`}
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
          scrollToTime={new Date(1970, 1, 1, 6)}
          formats={calendarFormats}
          toolbar={false}
          components={calendarComponents}
          className="booking-calendar h-full font-sans text-sm"
        />
      </div>
    </div>
  );
}

export default memo(CarBooking);
