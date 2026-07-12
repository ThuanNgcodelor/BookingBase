import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Building2, Car, Clock } from 'lucide-react';
import { bookingApi } from '../api/bookingApi';
import { formatViDateTime } from '../utils/dateTime';

function buildCarPurpose(booking) {
  if (booking.title) return booking.title;
  const route = [booking.departure, booking.destination].filter(Boolean).join(' - ');
  return route || 'Đặt xe công tác';
}

export default function AdminApprovals() {
  const navigate = useNavigate();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const [rooms, cars] = await Promise.all([
          bookingApi.getRoomBookings(),
          bookingApi.getCarBookings()
        ]);

        const mappedRooms = (rooms || []).filter(r => r.status === 'PENDING').map(r => ({
          id: r.id,
          type: 'ROOM',
          resourceName: r.room?.name,
          purpose: r.title,
          timeInfo: `${formatViDateTime(r.startTime)} - ${formatViDateTime(r.endTime)}`,
          booker: {
            fullName: r.requester?.fullName,
            department: r.requester?.department || 'Nhân viên',
            avatar: r.requester?.avatarUrl,
          },
          raw: r
        }));

        const mappedCars = (cars || []).filter(c => c.status === 'PENDING').map(c => ({
          id: c.id,
          type: 'CAR',
          resourceName: c.vehicle ? `${c.vehicle.vehicleType?.name} - ${c.vehicle.licensePlate}` : 'Chưa xếp xe',
          purpose: buildCarPurpose(c),
          timeInfo: `${formatViDateTime(c.startTime)} - ${formatViDateTime(c.endTime)}`,
          booker: {
            fullName: c.requester?.fullName,
            department: c.requester?.department || 'Nhân viên',
            avatar: c.requester?.avatarUrl,
          },
          raw: c
        }));

        setPendingRequests([...mappedRooms, ...mappedCars]);
      } catch (e) {
        console.error("Lỗi lấy danh sách pending:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, []);

  return (
    <div className="w-full flex-1 flex flex-col h-full">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Duyệt yêu cầu</h1>
        <p className="text-gray-500 mt-1">Quản lý và xét duyệt các yêu cầu sử dụng tài nguyên đang chờ xử lý.</p>
      </div>

      <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Người yêu cầu</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tài nguyên</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Thời gian</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Hành động</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">Đang tải...</td>
              </tr>
            ) : pendingRequests.map(req => (
              <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {req.booker.avatar ? (
                      <img 
                        className="h-8 w-8 rounded-full border border-gray-200 object-cover shrink-0" 
                        src={req.booker.avatar} 
                        alt=""
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(req.booker.fullName || 'U')}&background=dbeafe&color=1d4ed8`;
                        }}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold border border-gray-200 shrink-0">
                        {req.booker.fullName?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{req.booker.fullName}</div>
                      <div className="text-xs text-gray-500">{req.booker.department}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 font-medium flex items-center gap-2">
                    {req.type === 'ROOM' ? <Building2 className="w-4 h-4 text-blue-500" /> : <Car className="w-4 h-4 text-green-500" />}
                    {req.resourceName}
                  </div>
                  <div className="text-sm text-gray-500 truncate max-w-[250px] mt-0.5">{req.purpose}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/50">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    {req.timeInfo}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/admin/approvals/${req.id}`)}>
                    Xem chi tiết
                  </Button>
                </td>
              </tr>
            ))}

            {!loading && pendingRequests.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                  Không có yêu cầu nào đang chờ duyệt.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-10 text-center text-gray-500">
            Đang tải...
          </div>
        ) : pendingRequests.map((req) => (
          <div key={req.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-start gap-3">
              {req.booker.avatar ? (
                <img
                  className="h-10 w-10 rounded-full border border-gray-200 object-cover shrink-0"
                  src={req.booker.avatar}
                  alt=""
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(req.booker.fullName || 'U')}&background=dbeafe&color=1d4ed8`;
                  }}
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold border border-gray-200 shrink-0">
                  {req.booker.fullName?.charAt(0) || 'U'}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{req.booker.fullName}</div>
                    <div className="text-xs text-gray-500">{req.booker.department}</div>
                  </div>
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${req.type === 'ROOM' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                    {req.type === 'ROOM' ? <Building2 className="h-3.5 w-3.5" /> : <Car className="h-3.5 w-3.5" />}
                    {req.type === 'ROOM' ? 'Phòng' : 'Xe'}
                  </span>
                </div>

                <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2">
                  <div className="text-sm font-medium text-gray-900 break-words">{req.resourceName}</div>
                  <div className="mt-1 text-sm text-gray-500 break-words">{req.purpose}</div>
                </div>

                <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200/60">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="break-words">{req.timeInfo}</span>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    onClick={() => navigate(`/admin/approvals/${req.id}`)}
                  >
                    Xem chi tiết
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {!loading && pendingRequests.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-10 text-center text-gray-500">
            Không có yêu cầu nào đang chờ duyệt.
          </div>
        )}
      </div>

    </div>
  );
}
