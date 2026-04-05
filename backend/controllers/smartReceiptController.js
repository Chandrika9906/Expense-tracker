const geminiService = require('../services/geminiService');
const multer = require('multer');
const sharp = require('sharp');

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const smartReceiptScan = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Process image with sharp for better quality
    const processedImage = await sharp(req.file.buffer)
      .resize(1200, 1600, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();

    const result = await geminiService.extractAdvancedReceiptData(processedImage);
    
    res.json({
      success: true,
      data: result.data,
      confidence: result.confidence,
      language: result.detectedLanguage,
      processingTime: result.processingTime
    });
  } catch (error) {
    console.error('Smart receipt scan error:', error);
    res.status(500).json({ success: false, message: 'Failed to process receipt' });
  }
};

module.exports = {
  upload,
  smartReceiptScan
};