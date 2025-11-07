const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  createStudentAccount,
  createFacultyAccount,
  getAllStudents,
  getAllFaculty,
  uploadStudentCSV,
  uploadFacultyCSV,
} = require("../controllers/adminController");
const { authenticate, authorize } = require("../utils/auth");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || path.extname(file.originalname).toLowerCase() === ".csv") {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  },
});

// All routes require admin authentication
router.use(authenticate);
router.use(authorize("admin"));

// Manual account creation routes
router.post("/create-student", createStudentAccount);
router.post("/create-faculty", createFacultyAccount);

// Get all accounts routes
router.get("/students", getAllStudents);
router.get("/faculty", getAllFaculty);

// CSV Upload routes
router.post("/upload-students", upload.single("file"), uploadStudentCSV);
router.post("/upload-faculty", upload.single("file"), uploadFacultyCSV);

module.exports = router;

