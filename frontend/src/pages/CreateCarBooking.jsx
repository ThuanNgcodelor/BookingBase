import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Truck, AlignLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function CreateCarBooking() {
  const navigate = useNavigate();
  const location = useLocation();
  
  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Đăng kí Xe công tác</h1>
          <p className="text-sm text-gray-500 mt-1">Vui lòng cung cấp chi tiết hành trình chuyến đi.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <form className="space-y-6">
          
          {/* Tên chuyến đi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề (Mục đích chuyến đi) <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              placeholder="VD: Đi tiếp khách tại Đồng Tháp..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          {/* Chọn Xe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Đề xuất Xe <span className="text-red-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Truck className="w-5 h-5 text-gray-400" />
              </div>
              <select className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none bg-white">
                <option value="C1">Ford Transit 16 chỗ (30G-987.65)</option>
                <option value="C2">Toyota Innova 7 chỗ (29A-123.45)</option>
                <option value="">Chưa rõ - Để Hành chính sắp xếp</option>
              </select>
            </div>
          </div>

          {/* Hành trình */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Điểm đón <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="w-5 h-5 text-green-500" />
                </div>
                <input 
                  type="text" 
                  placeholder="VD: Trụ sở công ty"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Điểm đến <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="w-5 h-5 text-red-500" />
                </div>
                <input 
                  type="text" 
                  placeholder="VD: UBND Tỉnh Đồng Tháp"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Thời gian */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian xuất phát <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock className="w-5 h-5 text-gray-400" />
                </div>
                <input 
                  type="datetime-local" 
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dự kiến kết thúc <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock className="w-5 h-5 text-gray-400" />
                </div>
                <input 
                  type="datetime-local" 
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả chi tiết chuyến đi</label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <AlignLeft className="w-5 h-5 text-gray-400" />
              </div>
              <textarea 
                rows="4"
                placeholder="VD: Gồm 3 người đi, dự kiến ở lại qua đêm..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              ></textarea>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => navigate(-1)}>Hủy bỏ</Button>
            <Button type="submit">Gửi đăng kí</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
