const pool = require('../config/db');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const getUploadedImageUrl = (req, filename) => {
  if (!filename) return null;
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
};

const getStoragePathFromImage = (imageUrl) => {
  if (!imageUrl) return null;
  const uploadSegment = '/uploads/';
  const idx = imageUrl.indexOf(uploadSegment);
  if (idx === -1) return null;
  const fileName = imageUrl.slice(idx + uploadSegment.length);
  return path.join(__dirname, '..', '..', 'public', 'uploads', fileName);
};

// GET /api/books — Lấy toàn bộ danh sách sách
const getAllBooks = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, c.name as category_name
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      ORDER BY b.id DESC
    `);
    res.json({
      status: 'success',
      data: result.rows,
      total: result.rowCount
    });
  } catch (err) {
    console.error('getAllBooks error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi lấy danh sách sách' });
  }
};

// GET /api/books/:id — Lấy một quyển sách theo ID
const getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT b.*, c.name as category_name
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.id = $1
    `, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: `Không tìm thấy sách với id = ${id}` });
    }

    res.json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('getBookById error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi lấy thông tin sách' });
  }
};

// POST /api/books — Thêm sách mới
const createBook = async (req, res) => {
  try {
    const { title, author, category_id, price, quantity, image, description } = req.body;
    const parsedCategoryId = category_id ? parseInt(category_id, 10) : null;
    const parsedPrice = price !== undefined ? parseFloat(price) : null;
    const parsedQuantity = quantity !== undefined && quantity !== null ? parseInt(quantity, 10) : 0;
    const uploadedImage = req.file ? getUploadedImageUrl(req, req.file.filename) : image || null;

    if (!title || !author || !parsedPrice) {
      return res.status(400).json({
        status: 'error',
        message: 'Các trường title, author, price là bắt buộc'
      });
    }

    const sql = `
      INSERT INTO books (title, author, category_id, price, quantity, image, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await pool.query(sql, [title, author, parsedCategoryId, parsedPrice, parsedQuantity, uploadedImage, description]);

    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('createBook error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi thêm sách mới' });
  }
};

// PUT /api/books/:id — Cập nhật sách theo ID
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, category_id, price, quantity, image, description } = req.body;
    const parsedCategoryId = category_id ? parseInt(category_id, 10) : null;
    const parsedPrice = price !== undefined ? parseFloat(price) : null;
    const parsedQuantity = quantity !== undefined && quantity !== null ? parseInt(quantity, 10) : 0;
    const newImage = req.file ? getUploadedImageUrl(req, req.file.filename) : image || null;

    const currentResult = await pool.query('SELECT image FROM books WHERE id = $1', [id]);
    if (currentResult.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: `Không tìm thấy sách với id = ${id}` });
    }

    const previousImage = currentResult.rows[0].image;
    if (req.file && previousImage) {
      const previousPath = getStoragePathFromImage(previousImage);
      if (previousPath && fs.existsSync(previousPath)) {
        fs.unlinkSync(previousPath);
      }
    }

    const sql = `
      UPDATE books
      SET title = $1, author = $2, category_id = $3, price = $4, quantity = $5, image = $6, description = $7
      WHERE id = $8
      RETURNING *
    `;
    const result = await pool.query(sql, [title, author, parsedCategoryId, parsedPrice, parsedQuantity, newImage, description, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: `Không tìm thấy sách với id = ${id}` });
    }

    res.json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('updateBook error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi cập nhật sách' });
  }
};

// PATCH /api/books/:id/quantity — Cập nhật tồn kho sách (có thể tăng hoặc giảm)
const updateBookQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, delta } = req.body;

    let newQuantity;

    if (delta !== undefined && typeof delta === 'number') {
      // Nếu có delta, lấy quantity hiện tại và cộng delta
      const currentResult = await pool.query('SELECT quantity FROM books WHERE id = $1', [id]);
      if (currentResult.rowCount === 0) {
        return res.status(404).json({ status: 'error', message: `Không tìm thấy sách với id = ${id}` });
      }
      newQuantity = currentResult.rows[0].quantity + delta;
    } else if (quantity !== undefined && typeof quantity === 'number' && quantity >= 0) {
      // Nếu có quantity tuyệt đối
      newQuantity = quantity;
    } else {
      return res.status(400).json({ status: 'error', message: 'Cần cung cấp quantity (tuyệt đối) hoặc delta (tương đối)' });
    }

    if (newQuantity < 0) {
      return res.status(400).json({ status: 'error', message: 'Số lượng không thể âm' });
    }

    const result = await pool.query(
      'UPDATE books SET quantity = $1 WHERE id = $2 RETURNING *',
      [newQuantity, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: `Không tìm thấy sách với id = ${id}` });
    }

    res.json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('updateBookQuantity error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi cập nhật tồn kho sách' });
  }
};

// DELETE /api/books/:id — Xóa sách theo ID
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM books WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: `Không tìm thấy sách với id = ${id}` });
    }

    res.json({
      status: 'success',
      message: `Đã xóa sách "${result.rows[0].title}" thành công`
    });
  } catch (err) {
    console.error('deleteBook error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi xóa sách' });
  }
};

// Hàm sinh tệp mẫu Excel tự động
const generateExcelTemplate = () => {
  try {
    const templatesDir = path.join(__dirname, '..', '..', 'public', 'templates');
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }
    const filePath = path.join(templatesDir, 'book_import_template.xlsx');

    // Mẫu dữ liệu
    const data = [
      {
        'Tên sách': 'Nhà Giả Kim',
        'Tác giả': 'Paulo Coelho',
        'Thể loại': 'Viễn tưởng',
        'Giá sách (VND)': 79000,
        'Số lượng tồn': 50,
        'Mô tả': 'Một cuốn sách tuyệt vời về việc theo đuổi ước mơ và vận mệnh của mình.',
        'Ảnh bìa (URL)': 'https://upload.wikimedia.org/wikipedia/vi/c/c4/Nh%C3%A0_gi%E1%BA%A3_kim_%28s%C3%A1ch%29.jpg'
      },
      {
        'Tên sách': 'Sapiens: Lược Sử Loài Người',
        'Tác giả': 'Yuval Noah Harari',
        'Thể loại': 'Khoa học',
        'Giá sách (VND)': 149000,
        'Số lượng tồn': 20,
        'Mô tả': 'Lịch sử phát triển và tiến hóa của loài người từ thời tối cổ đến hiện đại.',
        'Ảnh bìa (URL)': 'https://images-na.ssl-images-amazon.com/images/I/41+grC6v6FL._SX324_BO1,204,203,200_.jpg'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Thiết lập chiều rộng cột
    const colWidths = [
      { wch: 30 }, // Tên sách
      { wch: 25 }, // Tác giả
      { wch: 15 }, // Thể loại
      { wch: 15 }, // Giá sách
      { wch: 12 }, // Số lượng
      { wch: 45 }, // Mô tả
      { wch: 45 }  // Ảnh bìa
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mẫu Nhập Sách');
    XLSX.writeFile(workbook, filePath);
    console.log('✅ Đã tạo/cập nhật tệp mẫu Excel thành công!');
  } catch (err) {
    console.error('❌ Lỗi khi sinh tệp mẫu Excel:', err.message);
  }
};

// Gọi sinh tệp mẫu ngay khi module được import
generateExcelTemplate();

// POST /api/books/import-excel — Nhập sách hàng loạt từ tệp Excel
const importBooksFromExcel = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'Vui lòng tải lên tệp Excel (.xlsx hoặc .xls).' });
  }

  try {
    // Đọc workbook từ buffer
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Chuyển đổi sheet thành mảng JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    if (rawData.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Tệp Excel trống hoặc không đúng cấu trúc.' });
    }

    const successList = [];
    const errorsList = [];
    let successCount = 0;

    // Giới hạn tối đa 500 dòng
    const MAX_ROWS = 500;
    const processData = rawData.slice(0, MAX_ROWS);

    // Xử lý từng dòng dữ liệu
    for (let i = 0; i < processData.length; i++) {
      const row = processData[i];
      const rowIndex = i + 2; // Dòng dữ liệu bắt đầu từ dòng 2 (dòng 1 là header)

      // Đọc các giá trị cột linh hoạt (hỗ trợ cả tiếng Việt và tiếng Anh)
      const title = (row['Tên sách'] || row['title'] || '').toString().trim();
      const author = (row['Tác giả'] || row['author'] || '').toString().trim();
      const categoryName = (row['Thể loại'] || row['category'] || '').toString().trim();
      const priceRaw = row['Giá sách (VND)'] || row['Giá'] || row['price'];
      const quantityRaw = row['Số lượng tồn'] || row['Số lượng'] || row['quantity'];
      const description = (row['Mô tả'] || row['description'] || '').toString().trim();
      const image = (row['Ảnh bìa (URL)'] || row['Ảnh bìa'] || row['image'] || '').toString().trim();

      // Validate bắt buộc
      if (!title) {
        errorsList.push({ row: rowIndex, message: 'Tên sách không được để trống.' });
        continue;
      }
      if (!author) {
        errorsList.push({ row: rowIndex, message: `Sách "${title}" thiếu tên tác giả.` });
        continue;
      }
      if (!categoryName) {
        errorsList.push({ row: rowIndex, message: `Sách "${title}" thiếu thể loại.` });
        continue;
      }

      const price = parseInt(priceRaw, 10);
      if (isNaN(price) || price <= 0) {
        errorsList.push({ row: rowIndex, message: `Sách "${title}" có giá không hợp lệ (phải là số nguyên lớn hơn 0).` });
        continue;
      }

      const quantity = quantityRaw !== undefined ? parseInt(quantityRaw, 10) : 0;
      if (isNaN(quantity) || quantity < 0) {
        errorsList.push({ row: rowIndex, message: `Sách "${title}" có số lượng không hợp lệ (phải là số nguyên >= 0).` });
        continue;
      }

      try {
        let categoryId = null;
        
        // Truy vấn xem thể loại đã có chưa
        const catCheck = await pool.query(
          'SELECT id FROM categories WHERE LOWER(name) = LOWER($1)',
          [categoryName]
        );

        if (catCheck.rowCount > 0) {
          categoryId = catCheck.rows[0].id;
        } else {
          // Tạo mới thể loại
          const catInsert = await pool.query(
            'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id',
            [categoryName, `Thể loại được tạo tự động khi nhập sách "${title}" bằng Excel`]
          );
          categoryId = catInsert.rows[0].id;
          console.log(`📂 Đã tự động tạo thể loại mới: "${categoryName}"`);
        }

        // Lưu sách mới
        const sql = `
          INSERT INTO books (title, author, category_id, price, quantity, image, description)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, title
        `;
        const bookInsert = await pool.query(sql, [
          title,
          author,
          categoryId,
          price,
          quantity,
          image || null,
          description || null
        ]);

        successList.push({
          row: rowIndex,
          id: bookInsert.rows[0].id,
          title: bookInsert.rows[0].title
        });
        successCount++;

      } catch (dbErr) {
        console.error(`Lỗi CSDL tại dòng ${rowIndex}:`, dbErr.message);
        errorsList.push({ row: rowIndex, message: `Lỗi CSDL khi lưu sách: ${dbErr.message}` });
      }
    }

    res.status(200).json({
      status: 'success',
      message: `Đã nhập xong dữ liệu Excel. Thành công: ${successCount}/${processData.length}`,
      data: {
        totalProcessed: processData.length,
        successCount: successCount,
        successList: successList,
        errorCount: errorsList.length,
        errors: errorsList
      }
    });

  } catch (err) {
    console.error('Lỗi xử lý import excel:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi máy chủ trong quá trình xử lý tệp Excel.' });
  }
};

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  updateBookQuantity,
  deleteBook,
  importBooksFromExcel
};
