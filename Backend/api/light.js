// Vercel Serverless Function: Điều khiển Bật / Tắt đèn LED qua Cloud Firebase
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Chỉ chấp nhận phương thức POST' });
  }

  const firebaseUrl = 'https://ltdd-945a5-default-rtdb.asia-southeast1.firebasedatabase.app';
  const { light, on } = req.body || {};

  const nextState = light !== undefined ? Boolean(light) : Boolean(on);

  try {
    // 1. Gửi lệnh điều khiển vào hàng đợi cho ESP32 nhận
    await fetch(`${firebaseUrl}/smart_home/commands.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ light: nextState }),
    });

    // 2. Cập nhật ngay lên telemetry để giao diện phản hồi tức thì
    await fetch(`${firebaseUrl}/smart_home/telemetry.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ light: nextState }),
    });

    return res.status(200).json({
      success: true,
      light: nextState,
      timestamp: Date.now(),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi điều khiển đèn', details: error.message });
  }
}
