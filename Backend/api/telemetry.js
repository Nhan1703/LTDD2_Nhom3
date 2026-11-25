// Vercel Serverless Function: Quản lý Telemetry cảm biến thời gian thực
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const firebaseUrl = 'https://ltdd-945a5-default-rtdb.asia-southeast1.firebasedatabase.app';

  try {
    if (req.method === 'GET') {
      const response = await fetch(`${firebaseUrl}/smart_home/telemetry.json`);
      const data = await response.json();
      return res.status(200).json(data || {});
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      const response = await fetch(`${firebaseUrl}/smart_home/telemetry.json`, {
        method: req.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body || {}),
      });
      const data = await response.json();
      return res.status(200).json(data || {});
    }

    return res.status(405).json({ error: 'Phương thức không được hỗ trợ' });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi xử lý telemetry', details: error.message });
  }
}
