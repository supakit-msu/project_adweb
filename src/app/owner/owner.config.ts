// ชี้ตรงไปยัง Server Backend บน Render เท่านั้น
export const API_ENDPOINT = 'https://node-express-mysql-3eto.onrender.com';

// พิกัดร้าน (แถว ม.มหาสารคาม) ใช้ค่าเดียวกับฝั่งไรเดอร์
export const SHOP = { lat: 16.2465, lng: 103.2535 };

// กติกาธุรกิจตาม Project.pdf (ยังรอตกลงกับอาจารย์ว่ายึดฉบับไหน)
export const RULES = {
  maxOrdersPerRider: 3,
  pricePerBox: 65,
  costPerBox: 40,
  riderFeePerTrip: 15,
  feePerKmPerBox: 2,
  speedKmh: 30,
  deadlineMin: 60, // ออก 11:30 ต้องถึงก่อน 12:30
  departHour: 11,
  departMin: 30,
};
