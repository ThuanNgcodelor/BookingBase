import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, User, Clock, FileText, XCircle, Send } from 'lucide-react';

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fake Data
  const request = {
    id: id,
    title: 'XIN XE CÔNG TÁC THỊ TRƯỜNG ĐỒNG THÁP',
    status: 'Đã phê duyệt',
    creator: {
      name: 'Lê Trọng Nhân',
      avatar: 'https://i.pravatar.cc/150?u=a',
    },
    startTime: '06:00 - 01/07/2026',
    endTime: '18:00 - 02/07/2026',
    description: 'Công tác tiếp xúc hệ thống khách hàng truyền thống và khách hàng mới tiềm năng tại Đồng Tháp.',
    followers: [
      { name: 'Lê Bá Quốc', role: 'Đội trưởng đội xe', avatar: 'https://i.pravatar.cc/150?u=b' },
      { name: 'Lê Trọng Nhân', role: 'Trưởng phòng Kinh doanh', avatar: 'https://i.pravatar.cc/150?u=a' }
    ],
    approvers: [
      { name: 'Bùi Hữu Thọ', role: 'Phó phòng Tổ chức hành chính', status: 'approved' },
      { name: 'Phan Thị Minh Diễn', role: 'Trưởng phòng Tổ chức hành chính', status: 'approved' }
    ],
    resource: {
      name: 'Xe bán tải - 51L - 846.28',
      manager: 'Phan Thị Minh Diễn',
    },
    logs: [
      { time: '10:34 29/06', action: 'đăng kí đã được tạo', user: 'Lê Trọng Nhân', role: 'tạo đăng kí này' },
      { time: '14:20 29/06', action: 'đăng kí đã được phê duyệt', user: 'Bùi Hữu Thọ' },
    ]
  };

  return (
    <div className="flex flex-col min-h-full bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-[#1a56d6] text-white px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-medium text-sm uppercase tracking-wide">
            {request.title}
          </span>
        </div>
        <button className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
          <XCircle className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-start w-full">
        {/* Cột trái (Thông tin chính) */}
        <div className="flex-1 w-full bg-white md:border-r border-gray-100 flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-xl font-bold text-gray-900 uppercase mb-2">
              {request.title}
            </h1>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Trạng thái:</span>
              <span className="text-green-600 font-semibold">{request.status}</span>
            </div>

            <h3 className="mt-8 mb-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Thông tin</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">Người tạo</p>
                  <p className="text-sm font-medium text-gray-900">{request.creator.name}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">Bắt đầu lúc</p>
                  <p className="text-sm font-medium text-gray-900">{request.startTime}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:col-start-2">
                <Clock className="w-5 h-5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">Kết thúc lúc</p>
                  <p className="text-sm font-medium text-gray-900">{request.endTime}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:col-span-2">
                <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">Mô tả</p>
                  <p className="text-sm text-gray-800 leading-relaxed">{request.description}</p>
                </div>
              </div>
            </div>

            <h3 className="mt-8 mb-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Người theo dõi</h3>
            <div className="space-y-4">
              {request.followers.map((f, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <img src={f.avatar} alt="" className="w-8 h-8 rounded-full border border-gray-200" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{f.name}</p>
                    <p className="text-xs text-gray-500">{f.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Log & Comment Box */}
          <div className="bg-gray-50 p-6 flex-1 flex flex-col">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Giao việc trên Request</h3>
            
            <div className="space-y-4 flex-1">
              {/* Logs */}
              {request.logs.map((log, idx) => (
                <div key={idx} className="flex gap-3 text-sm">
                  <div className="text-gray-400 w-12 shrink-0">{log.time.split(' ')[0]}</div>
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0"></div>
                  <div>
                    <span className="text-gray-600">{log.action} </span>
                    <span className="font-semibold text-gray-900">{log.user}</span>
                    {log.role && <span className="text-gray-500"> {log.role}</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-2 border border-gray-200 bg-white rounded-full px-4 py-2 shadow-sm">
              <input 
                type="text" 
                placeholder="Viết bình luận của bạn..." 
                className="flex-1 outline-none text-sm bg-transparent"
              />
              <button className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-full transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Cột phải (Luồng duyệt & Tài nguyên) */}
        <div className="w-full md:w-80 bg-gray-50 flex flex-col shrink-0 border-t md:border-t-0 md:border-l border-gray-100">
          {/* Người Duyệt */}
          <div className="p-4 border-b border-gray-100 bg-[#fbfbfb]">
            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Người Duyệt</h3>
            <div className="space-y-3">
              {request.approvers.map((ap, idx) => (
                <div key={idx} className="flex items-start justify-between bg-white p-3 border border-gray-100 rounded shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 font-bold shrink-0">
                      {ap.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{ap.name}</p>
                      <p className="text-[11px] text-gray-500 leading-tight">{ap.role}</p>
                    </div>
                  </div>
                  {ap.status === 'approved' && (
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-1" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Thông tin tài nguyên */}
          <div className="p-4">
            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Thông tin Tài nguyên</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[11px] text-gray-500 mb-1 flex items-center gap-1">Tên</p>
                <p className="text-sm font-medium text-gray-900">{request.resource.name}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500 mb-1 flex items-center gap-1">Người quản lý</p>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 font-bold">
                    {request.resource.manager.charAt(0)}
                  </div>
                  <p className="text-sm text-gray-900">{request.resource.manager}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
