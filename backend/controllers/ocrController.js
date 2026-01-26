const multer = require('multer');
const sharp = require('sharp');
const geminiService = require('../services/geminiService');
const Expense = require('../models/Expense');

// Configure multer for image upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const processReceiptImage = async (req, res) => {
  try {
    console.log('Processing OCR request...');
    
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    console.log('File received:', req.file.originalname, req.file.size);

    // Process image with Sharp
    const processedImage = await sharp(req.file.buffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    console.log('Image processed, calling Gemini AI...');

    // Extract expense data using Gemini AI
    const expenseData = await geminiService.extractExpenseFromImage(processedImage);

    console.log('Extracted data:', expenseData);

    res.json({
      success: true,
      data: expenseData,
      message: 'Expense data extracted successfully'
    });
  } catch (error) {
    console.error('OCR Processing Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to process image',
      error: error.toString()
    });
  }
};

const createExpenseFromOCR = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Process image
    const processedImage = await sharp(req.file.buffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Extract expense data
    const expenseData = await geminiService.extractExpenseFromImage(processedImage);

    // Create expense in database
    const expense = await Expense.create({
      title: expenseData.title,
      amount: expenseData.amount,
      category: expenseData.category,
      date: expenseData.date,
      notes: expenseData.merchant ? `Merchant: ${expenseData.merchant}` : 'Auto-extracted from image',
      userId: req.user._id
    });

    res.status(201).json({
      success: true,
      expense,
      extractedData: expenseData,
      message: 'Expense created successfully from image'
    });
  } catch (error) {
    console.error('OCR Expense Creation Error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to create expense from image' 
    });
  }
};

module.exports = {
  upload,
  processReceiptImage,
  createExpenseFromOCR
};