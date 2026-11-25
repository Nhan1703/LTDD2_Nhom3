// Vercel Serverless Function: Lấy dữ liệu cảm biến thời gian thực từ Firebase Cloud
export default async function handler(req, res) {
  // Thiết lập CORS cho phép Web và Mobile gọi API tự do
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const firebaseUrl = 'https://ltdd-945a5-default-rtdb.asia-southeast1.firebasedatabase.app';

  try {
    const response = await fetch(`${firebaseUrl}/smart_home/telemetry.json`);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Không thể kết nối đến Firebase Cloud' });
    }
    const data = await response.json();
    return res.status(200).json(data || {});
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi máy chủ nội bộ', details: error.message });
  }
}
