import multer from "multer";
import fs from "fs";
import path from "path";

// Ensure directory exists
const uploadDir = "./public/temp";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Define allowed file types (example: images)
// const allowedFileTypes = /jpeg|jpg|png|gif|pdf/;
//allow all types
const allowedFileTypes = /.*/;

// Define storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Save to the 'public/temp' directory
  },
  filename: function (req, file, cb) {
    // Create a unique filename using current timestamp and original file name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname).toLowerCase();
    cb(null, uniqueSuffix + fileExtension); // Ensure file extension remains intact
  },
});

// File filter to limit allowed file types
const fileFilter = (req, file, cb) => {
  const isAllowed = allowedFileTypes.test(path.extname(file.originalname).toLowerCase()) && allowedFileTypes.test(file.mimetype);

  if (isAllowed) {
    cb(null, true); // Accept file
  } else {
    cb(new Error("Only image or PDF files are allowed."), false); // Reject file
  }
};

// Set file size limit (example: 10MB)
const fileSizeLimit = 10 * 1024 * 1024; // 10MB

// Multer instance with additional configurations
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: fileSizeLimit, // Limit file size
  },
});
