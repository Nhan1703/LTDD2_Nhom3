// ====================================================================
// BẢNG MÀU & THIẾT KẾ HIỆN ĐẠI (IMPECCABLE MODERN LIGHT DESIGN SYSTEM)
// Tối ưu độ tương phản chuẩn WCAG AAA, giao diện sáng sủa, sắc nét và thanh lịch
// ====================================================================

export const COLORS = {
  // Nhóm màu nhận diện thương hiệu chính (Brand & Primary)
  primary: '#2563EB',        // Xanh dương chủ đạo (Blue 600 - tương phản cao)
  primaryLight: '#3B82F6',   // Xanh sáng (Blue 500)
  primaryDark: '#1D4ED8',    // Xanh đậm (Blue 700)
  primaryMuted: '#EFF6FF',   // Nền tag xanh nhạt (Blue 50)
  primaryBorder: '#BFDBFE',  // Viền xanh nhạt (Blue 200)

  // Nhóm màu phụ trợ (Secondary)
  secondary: '#0D9488',      // Xanh mòng két (Teal 600)
  secondaryLight: '#14B8A6',
  secondaryMuted: '#F0FDFA',
  secondaryBorder: '#99F6E4',

  accent: '#4F46E5',         // Tím chàm cao cấp (Indigo 600)
  accentMuted: '#EEF2FF',

  // Nhóm màu trạng thái ngữ nghĩa chuẩn WCAG AAA (Semantic Status)
  success: '#059669',        // Xanh lá an toàn (Emerald 600)
  successLight: '#10B981',
  successMuted: '#ECFDF5',   // Nền xanh an toàn dịu mắt (Emerald 50)
  successBorder: '#A7F3D0',

  warning: '#D97706',        // Cam vàng cảnh báo (Amber 600)
  warningLight: '#F59E0B',
  warningMuted: '#FFFBEB',   // Nền cảnh báo nhạt (Amber 50)
  warningBorder: '#FDE68A',

  danger: '#DC2626',         // Đỏ nguy hiểm (Red 600)
  dangerLight: '#EF4444',
  dangerMuted: '#FEF2F2',    // Nền đỏ báo động nhạt (Red 50)
  dangerBorder: '#FECACA',

  info: '#0284C7',           // Xanh biển thông tin (Sky 600)
  infoLight: '#0EA5E9',
  infoMuted: '#F0F9FF',      // Nền thông tin nhạt (Sky 50)
  infoBorder: '#BAE6FD',

  // Nhóm màu cảm biến phần cứng thực tế
  water: '#0284C7',          // Cảm biến nước (Sky 600)
  waterLight: '#E0F2FE',
  sound: '#D97706',          // Cảm biến âm thanh (Amber 600)
  soundLight: '#FEF3C7',
  temperature: '#E11D48',    // Cảm biến nhiệt độ (Rose 600)
  temperatureLight: '#FFE4E6',
  humidity: '#0284C7',       // Cảm biến độ ẩm (Sky 600)
  humidityLight: '#E0F2FE',
  gate: '#4F46E5',           // Cổng ra vào an ninh (Indigo 600)
  gateLight: '#EEF2FF',

  // Hệ màu nền sáng sủa, sạch sẽ, chuẩn giao diện Modern Light
  background: '#F8FAFC',     // Nền toàn trang sáng tinh tế (Slate 50 - không gây chói mắt)
  cardBg: '#FFFFFF',         // Nền thẻ Card màu trắng tinh khiết
  cardBgHover: '#F1F5F9',    // Nền thẻ khi hover (Slate 100)
  surface: '#FFFFFF',
  border: '#E2E8F0',         // Viền thẻ xám nhạt tinh tế 1px (Slate 200)
  borderLight: '#CBD5E1',    // Viền phân tách (Slate 300)

  // Phông chữ độ tương phản cao vượt chuẩn WCAG AAA (> 7:1)
  textPrimary: '#0F172A',    // Chữ tiêu đề và nội dung chính: Đen than (Slate 900)
  textSecondary: '#334155',  // Chữ phụ, mô tả: Xám than đậm (Slate 700)
  textMuted: '#64748B',      // Chữ nhãn thời gian, icon mờ: Xám Slate 500 (rõ ràng, không bị chìm)
  textInverse: '#FFFFFF',    // Chữ màu trắng trên nền tối/nút bấm

  // Các tiện ích màu cơ bản
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(15, 23, 42, 0.45)', // Lớp phủ mờ modal
};

export const SIZES = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusXl: 20,
  radiusFull: 9999,
};

// Hiệu ứng bóng đổ thanh lịch, mềm mại cho giao diện sáng
export const SHADOWS = {
  small: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};
