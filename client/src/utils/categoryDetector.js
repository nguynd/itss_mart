export const detectCategory = (name) => {
  if (!name) return null;
  const lowerName = name.toLowerCase();
  
  const rauCuKeywords = ['rau', 'khoai', 'cà', 'cải', 'hành', 'tỏi', 'ớt', 'nấm', 'bí', 'bầu', 'mướp', 'giá', 'chanh', 'đậu', 'gừng', 'sả'];
  const thitCaKeywords = ['thịt', 'nạc', 'mỡ', 'vai', 'sườn', 'bò', 'gà', 'heo', 'cá', 'tôm', 'mực', 'cua', 'trứng', 'xương', 'vịt', 'ngao'];
  const giaViKeywords = ['tiêu', 'đường', 'mắm', 'nước mắm', 'muối', 'bột ngọt', 'hạt nêm', 'dầu ăn', 'tương', 'giấm', 'sa tế'];
  const doKhoKeywords = ['gạo', 'bún', 'phở', 'miến', 'mì', 'đậu phộng', 'hạt', 'mộc nhĩ', 'nấm hương', 'bột'];
  
  if (rauCuKeywords.some(kw => lowerName.includes(kw))) return 'Rau củ';
  if (thitCaKeywords.some(kw => lowerName.includes(kw))) return 'Thịt cá';
  if (giaViKeywords.some(kw => lowerName.includes(kw))) return 'Gia vị';
  if (doKhoKeywords.some(kw => lowerName.includes(kw))) return 'Đồ khô';
  
  return null;
};
