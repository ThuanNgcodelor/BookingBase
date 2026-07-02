import React from 'react';
import { Bell, CheckCircle2, Clock, XCircle } from 'lucide-react';

export default function Notifications() {
  const allNotifications = [
    { id: 1, type: 'success', title: 'Yêu cầu của bạn đã được duyệt', desc: 'Phòng Hội đồng 1 - 10:00 30/07. Bạn có thể sử dụng phòng theo đúng lịch trình.', time: '5 phút trước', isRead: false },
    { id: 2, type: 'warning', title: 'Có yêu cầu mới cần duyệt', desc: 'Xin xe công tác Đồng Tháp của Lê Trọng Nhân.', time: '1 giờ trước', isRead: false },
    { id: 3, type: 'error', title: 'Yêu cầu bị từ chối', desc: 'Lý do: Xe 16 chỗ đã được người khác đặt trước trong khoảng thời gian này.', time: '1 ngày trước', isRead: true },
    { id: 4, type: 'success', title: 'Yêu cầu của bạn đã được duyệt', desc: 'Phòng Đào tạo (Mới) - Cả ngày 28/07.', time: '2 ngày trước', isRead: true },
  ];

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'warning': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Tất cả thông báo</h1>
          <p className="text-gray-500 mt-1">Cập nhật tình trạng các yêu cầu và tài nguyên của bạn.</p>
        </div>
        <button className="text-sm font-medium text-blue-600 hover:text-blue-800">
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {allNotifications.map(notif => (
          <div key={notif.id} className={`p-6 flex gap-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer ${notif.isRead ? 'opacity-70' : 'bg-blue-50/10'}`}>
            <div className="shrink-0 mt-0.5">
              {getIcon(notif.type)}
            </div>
            <div className="flex-1">
              <div className="flex sm:items-center justify-between flex-col sm:flex-row gap-1 sm:gap-4 mb-1">
                <h3 className={`text-base font-semibold ${notif.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                  {notif.title}
                </h3>
                <span className="text-xs font-medium text-gray-400 whitespace-nowrap">{notif.time}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{notif.desc}</p>
            </div>
            {!notif.isRead && (
              <div className="shrink-0 flex items-center">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
