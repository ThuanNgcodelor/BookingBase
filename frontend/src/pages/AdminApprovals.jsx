import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Building2, Calendar, Car, Clock } from 'lucide-react';

// Fake Data for Pending Approvals
const pendingRequests = [
  {
    id: 'REQ-001',
    type: 'ROOM',
    resourceName: 'Phòng Hội đồng 1',
    purpose: 'Họp giao ban tuần ban Giám đốc',
    timeInfo: '14:00 - 16:00, Hôm nay',
    booker: {
      fullName: 'Nguyễn Văn A',
      email: 'a.nguyen@booking.base.vn',
      phone: '0901.234.567',
      department: 'Phòng Phát triển Kinh doanh',
      avatar: 'https://i.pravatar.cc/150?u=a.nguyen',
    }
  },
  {
    id: 'REQ-002',
    type: 'CAR',
    resourceName: 'Ford Transit 16 Chỗ (30G-987.65)',
    purpose: 'Đưa đón đoàn đối tác từ Sân bay Nội Bài',
    timeInfo: '08:00 - 11:30, Ngày mai',
    booker: {
      fullName: 'Trần Thị B',
      email: 'b.tran@booking.base.vn',
      phone: '0988.765.432',
      department: 'Phòng Hành chính Nhân sự',
      avatar: 'https://i.pravatar.cc/150?u=b.tran',
    }
  }
];

export default function AdminApprovals() {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Duyệt yêu cầu</h1>
        <p className="text-gray-500 mt-1">Quản lý và xét duyệt các yêu cầu sử dụng tài nguyên đang chờ xử lý.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã YC</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Người yêu cầu</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tài nguyên</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Thời gian</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Hành động</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {pendingRequests.map(req => (
              <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {req.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img className="h-8 w-8 rounded-full border border-gray-200" src={req.booker.avatar} alt="" />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{req.booker.fullName}</div>
                      <div className="text-xs text-gray-500">{req.booker.department}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 font-medium flex items-center gap-2">
                    {req.type === 'ROOM' ? <Building2 className="w-4 h-4 text-blue-500"/> : <Car className="w-4 h-4 text-green-500"/>}
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
            
            {pendingRequests.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                  Không có yêu cầu nào đang chờ duyệt.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
