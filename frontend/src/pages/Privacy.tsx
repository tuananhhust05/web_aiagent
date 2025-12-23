import Header from '../components/Header'
import { Shield, Lock, Eye, Database, Globe, Mail, Trash2, Clock } from 'lucide-react'

export default function Privacy() {
  const sections = [
    {
      icon: <Eye className="h-6 w-6" />,
      title: 'Chúng tôi thu thập gì',
      content: [
        'Dữ liệu Gmail do người dùng cấp phép: nội dung email, địa chỉ gửi/nhận/cc/bcc, tiêu đề, thời gian.',
        'Thông tin tài khoản cơ bản (tên, email, công ty) và thiết lập chiến dịch do người dùng nhập.',
        'Log gửi chỉ chứa metadata (người nhận, tiêu đề, thời gian, trạng thái).',
      ],
    },
    {
      icon: <Database className="h-6 w-6" />,
      title: 'Mục đích sử dụng',
      content: [
        'Tạo/gửi trả lời tự động dựa trên nội dung email người dùng nhận được.',
        'Gửi email marketing/CSKH thay người dùng tới danh sách họ cung cấp.',
        'Vận hành, bảo vệ, và cải thiện sản phẩm; không dùng dữ liệu Gmail cho quảng cáo hay bán lại.',
      ],
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: 'Lưu trữ & thời gian lưu',
      content: [
        'Cache tạm để xử lý/gợi ý trả lời sẽ xóa ngay sau khi hoàn tất.',
        'Log gửi (metadata) mặc định giữ 90 ngày; người dùng có thể yêu cầu ngắn hơn hoặc xóa ngay.',
        'Không lưu lâu dài nội dung/đính kèm email trừ khi người dùng chọn lưu mẫu/nháp và có thể xóa bất cứ lúc nào.',
      ],
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: 'Chia sẻ dữ liệu',
      content: [
        'Không bán hoặc cho thuê dữ liệu Gmail.',
        'Chỉ chia sẻ cho nhà cung cấp hạ tầng phục vụ vận hành (tuân thủ bảo mật).',
        'Chia sẻ khi luật pháp yêu cầu hoặc để phòng chống gian lận/abuse.',
      ],
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: 'Bảo mật',
      content: [
        'Mã hóa trong truyền tải (HTTPS/TLS) và mã hóa token ở trạng thái lưu.',
        'Nguyên tắc quyền tối thiểu, kiểm soát truy cập và log kiểm toán.',
        'Đánh giá bảo mật định kỳ, quy trình ứng phó sự cố.',
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Chính sách Quyền riêng tư
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Mô tả cách chúng tôi dùng quyền đọc/gửi Gmail để tự động trả lời và gửi email marketing thay bạn.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-gray-600 leading-relaxed mb-4">
              For Skale cam kết chỉ truy cập Gmail khi bạn cấp quyền và chỉ cho mục đích vận hành tính năng: đọc email để tạo/gửi trả lời tự động và gửi chiến dịch email marketing/CSKH thay bạn. Không sử dụng dữ liệu Gmail cho quảng cáo, hồ sơ hành vi hay bán lại.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              Bạn có thể thu hồi quyền tại Google Security bất cứ lúc nào; khi thu hồi, chúng tôi dừng truy cập và xóa token/cache liên quan.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section, index) => (
              <div key={index} className="bg-white p-7 rounded-2xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center mb-5 text-white">
                  {section.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{section.title}</h3>
                <ul className="space-y-2 text-gray-700 leading-relaxed">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Sections */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Phạm vi quyền Gmail</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Chỉ yêu cầu phạm vi tối thiểu để vận hành tính năng: <code>gmail.readonly</code> (hoặc metadata/modify nếu đủ) để đọc email phục vụ trả lời tự động và <code>gmail.send</code> để gửi thay bạn.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Chỉ truy cập khi bạn dùng tính năng (ví dụ: bật tự động trả lời, tạo chiến dịch). Không quét nền hàng loạt khi không cần thiết.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Xóa dữ liệu & thu hồi</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Bạn có thể yêu cầu xóa dữ liệu qua <a href="mailto:privacy@forskale.com" className="text-blue-600 underline">privacy@forskale.com</a>. Khi nhận yêu cầu, chúng tôi xóa cache, token và log gửi (nếu pháp luật không yêu cầu giữ lại).
            </p>
            <p className="text-gray-700 leading-relaxed">
              Khi bạn thu hồi OAuth tại Google Security, chúng tôi dừng truy cập ngay và vô hiệu hóa token còn lại.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Cookies & phân tích</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Dùng cookie cần thiết để đăng nhập và vận hành sản phẩm; cookie phân tích giúp hiểu cách bạn sử dụng, có thể tắt qua cài đặt trình duyệt.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Không dùng cookie/ID để theo dõi phục vụ quảng cáo bên thứ ba.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Quyền của bạn</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-2">
              <li>Truy cập, nhận bản sao dữ liệu liên quan đến bạn.</li>
              <li>Chỉnh sửa, yêu cầu xóa, hoặc hạn chế xử lý dữ liệu.</li>
              <li>Thu hồi sự đồng ý/OAuth bất kỳ lúc nào.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-4">
            Cần hỗ trợ về quyền riêng tư?
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Liên hệ đội ngũ của chúng tôi để được hỗ trợ xóa dữ liệu hoặc giải đáp thắc mắc.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:privacy@forskale.com"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Mail className="mr-2 h-5 w-5" />
              privacy@forskale.com
            </a>
            <a
              href="/help"
              className="inline-flex items-center px-8 py-4 border border-white/40 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
            >
              Trung tâm trợ giúp
            </a>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6 text-sm text-blue-100">
            <div className="inline-flex items-center gap-2 justify-center">
              <Trash2 className="h-4 w-4" />
              Hỗ trợ “Xóa dữ liệu của tôi”
            </div>
            <div className="inline-flex items-center gap-2 justify-center">
              <Lock className="h-4 w-4" />
              Thu hồi OAuth tại Google Security bất cứ lúc nào
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
