import Header from '../components/Header'
import { FileText, ShieldCheck, MailCheck, AlertTriangle, Clock, HeartHandshake, Lock, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Terms() {
  const serviceItems = [
    {
      title: 'Dịch vụ cung cấp',
      points: [
        'Tự động trả lời email: dùng dữ liệu email người dùng cấp phép để tạo/gửi trả lời.',
        'Gửi email marketing/CSKH: đại diện người dùng gửi chiến dịch cho danh sách khách hàng họ cung cấp.',
        'Không sử dụng dữ liệu Gmail cho quảng cáo hay bán lại.',
      ],
      icon: <MailCheck className="h-6 w-6" />,
    },
    {
      title: 'Trách nhiệm người dùng',
      points: [
        'Bảo đảm nội dung gửi tuân thủ luật chống spam và có sự đồng ý của người nhận.',
        'Không được lạm dụng cho spam, phishing, phần mềm độc hại hoặc quấy rối.',
        'Tự chịu trách nhiệm về dữ liệu khách hàng và danh sách gửi do mình tải lên/cấu hình.',
      ],
      icon: <AlertTriangle className="h-6 w-6" />,
    },
    {
      title: 'Dữ liệu & quyền riêng tư',
      points: [
        'Xử lý dữ liệu theo Chính sách Quyền riêng tư; không bán/cho thuê dữ liệu Gmail.',
        'Người dùng có thể thu hồi OAuth tại Google Security và yêu cầu xóa dữ liệu bất cứ lúc nào.',
        'Chỉ lưu metadata log gửi (người nhận, tiêu đề, thời gian, trạng thái) tối đa 90 ngày hoặc ngắn hơn theo yêu cầu.',
      ],
      icon: <Lock className="h-6 w-6" />,
    },
    {
      title: 'Sẵn sàng dịch vụ & giới hạn trách nhiệm',
      points: [
        'Dịch vụ có thể gián đoạn do bảo trì hoặc giới hạn từ Google API.',
        'Cung cấp “như hiện trạng”; không bảo đảm không lỗi hay không gián đoạn.',
        'Giới hạn trách nhiệm tối đa bằng tổng phí đã trả trong 3 tháng gần nhất (nếu có).',
      ],
      icon: <Clock className="h-6 w-6" />,
    },
    {
      title: 'Tuân thủ & thực thi',
      points: [
        'Có thể tạm dừng/khóa tài khoản khi phát hiện lạm dụng, rủi ro bảo mật hoặc vi phạm pháp luật.',
        'Hợp tác với cơ quan chức năng khi có yêu cầu hợp pháp.',
        'Yêu cầu bổ sung bằng chứng về sự đồng ý của người nhận khi gửi marketing số lượng lớn.',
      ],
      icon: <ShieldCheck className="h-6 w-6" />,
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-600/20">
            <FileText className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Điều khoản Dịch vụ
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Điều chỉnh việc sử dụng tính năng đọc/gửi Gmail để tự động trả lời và gửi email marketing thay người dùng.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </section>

      {/* Summary cards */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">Quyền Gmail được yêu cầu</h3>
            </div>
            <ul className="space-y-2 text-gray-700 leading-relaxed">
              <li>• `gmail.readonly` (hoặc metadata/modify nếu đủ) để đọc email phục vụ tự động trả lời.</li>
              <li>• `gmail.send` để gửi trả lời/chiến dịch thay người dùng.</li>
              <li>• Chỉ truy cập khi người dùng kích hoạt tính năng; không quét nền hàng loạt.</li>
            </ul>
          </div>

          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <HeartHandshake className="h-6 w-6 text-emerald-600" />
              <h3 className="text-xl font-semibold text-gray-900">Quyền kiểm soát của người dùng</h3>
            </div>
            <ul className="space-y-2 text-gray-700 leading-relaxed">
              <li>• Thu hồi OAuth tại Google Security; chúng tôi dừng truy cập và xóa token/cache.</li>
              <li>• Yêu cầu xóa dữ liệu qua `privacy@forskale.com` hoặc qua mục cài đặt.</li>
              <li>• Cấu hình thời gian lưu log gửi; mặc định 90 ngày, có thể ngắn hơn hoặc xóa ngay.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-6">
          {serviceItems.map((item, idx) => (
            <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 text-white flex items-center justify-center shadow-sm">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
              </div>
              <ul className="space-y-2 text-gray-700 leading-relaxed">
                {item.points.map((point, pIdx) => (
                  <li key={pIdx}>• {point}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Legal footer */}
      <section className="pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-gray-700 space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">Luật áp dụng & giải quyết tranh chấp</h2>
          <p>
            Bạn có thể tùy chỉnh điều khoản này theo pháp luật nơi doanh nghiệp đăng ký. Khuyến nghị nêu rõ tòa án hoặc trọng tài có thẩm quyền, cùng ngôn ngữ áp dụng cho hợp đồng.
          </p>
          <p>
            Nếu có thắc mắc, liên hệ <a href="mailto:legal@forskale.com" className="text-blue-600 underline">legal@forskale.com</a>.
          </p>
          <div className="pt-2">
            <Link
              to="/privacy"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              Xem Chính sách Quyền riêng tư
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

