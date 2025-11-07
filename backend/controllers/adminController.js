const csv = require("csv-parser");
const fs = require("fs");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Faculty = require("../models/Faculty");
const Section = require("../models/Section");
const path = require("path");

// 🧾 Get All Students
exports.getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .populate("sectionRef", "name code department year")
      .select("-passwordHash")
      .sort({ name: 1 });
    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🧾 Get All Faculty
exports.getAllFaculty = async (req, res) => {
  try {
    const faculty = await User.find({ role: "faculty" })
      .populate("facultyInfo")
      .select("-passwordHash")
      .sort({ name: 1 });
    
    // Also get Faculty model data for subjects
    const facultyWithSubjects = await Promise.all(
      faculty.map(async (user) => {
        const facultyData = await Faculty.findOne({ email: user.email })
          .populate("subjects");
        return {
          ...user.toObject(),
          facultyData: facultyData || null
        };
      })
    );
    
    res.json({ success: true, faculty: facultyWithSubjects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🧾 Manual Student Account Creation
exports.createStudentAccount = async (req, res) => {
  try {
    const {
      name,
      email,
      regNumber,
      mobile,
      sectionId,
      rollNumber,
      year,
      batch,
      department,
    } = req.body;

    // Validate required fields
    if (!name || !email || !sectionId) {
      return res
        .status(400)
        .json({ error: "Name, email, and section are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    // Verify section exists
    const section = await Section.findById(sectionId);
    if (!section) {
      return res.status(404).json({ error: "Section not found" });
    }

    // Generate default password
    const defaultPassword = "student123";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // Create User account
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "student",
      regNumber: regNumber?.toUpperCase(),
      mobile,
      sectionRef: sectionId,
      rollNumber,
    });

    // Recalculate section strength
    const studentCount = await User.countDocuments({
      sectionRef: sectionId,
      role: 'student',
      isActive: true
    });
    await Section.findByIdAndUpdate(sectionId, { strength: studentCount });

    res.status(201).json({
      success: true,
      message: "Student account created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        regNumber: user.regNumber,
        section: section.name,
      },
      credentials: {
        email: user.email,
        password: defaultPassword,
      },
    });
  } catch (error) {
    console.error("Error creating student account:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🧾 Manual Faculty Account Creation
exports.createFacultyAccount = async (req, res) => {
  try {
    const { name, email, mobile, department, employeeId, designation } = req.body;

    // Validate required fields
    if (!name || !email || !department) {
      return res
        .status(400)
        .json({ error: "Name, email, and department are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    // Generate default password
    const defaultPassword = "faculty123";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // Create User account
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "faculty",
      mobile,
      facultyInfo: {
        employeeId,
        department,
        designation,
      },
    });

    // Create or update Faculty model entry
    let faculty = await Faculty.findOne({ email: user.email });
    if (!faculty) {
      faculty = await Faculty.create({
        name: user.name,
        email: user.email,
        maxHoursPerWeek: 40,
      });
    }

    res.status(201).json({
      success: true,
      message: "Faculty account created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        department: user.facultyInfo?.department,
      },
      credentials: {
        email: user.email,
        password: defaultPassword,
      },
    });
  } catch (error) {
    console.error("Error creating faculty account:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🧾 Upload Student CSV
exports.uploadStudentCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const results = [];
    const filePath = req.file.path;

    // Read CSV file
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        // Normalize column names (handle spaces, case variations)
        const normalizedRow = {};
        Object.keys(row).forEach((key) => {
          const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, "");
          normalizedRow[normalizedKey] = row[key]?.trim() || "";
        });
        results.push(normalizedRow);
      })
      .on("end", async () => {
        try {
          const created = [];
          const errors = [];
          const affectedSectionIds = new Set();

          for (const r of results) {
            try {
              // Find section by name
              const section = await Section.findOne({
                $or: [
                  { name: r.section },
                  { code: r.section },
                  { name: { $regex: new RegExp(r.section, "i") } },
                ],
              });

              if (!section) {
                errors.push({
                  row: r,
                  error: `Section "${r.section}" not found`,
                });
                continue;
              }

              // Check if user already exists
              const existingUser = await User.findOne({ email: r.email?.toLowerCase() });
              if (existingUser) {
                errors.push({
                  row: r,
                  error: `User with email ${r.email} already exists`,
                });
                continue;
              }

              // Generate password hash
              const passwordHash = await bcrypt.hash("student123", 10);

              // Create User account
              const user = await User.create({
                name: r.name,
                email: r.email?.toLowerCase(),
                passwordHash,
                role: "student",
                mobile: r.mobile || "",
                regNumber: r.regnumber?.toUpperCase() || r.regNumber?.toUpperCase(),
                rollNumber: r.rollnumber || r.rollNumber,
                sectionRef: section._id,
              });

              // Track affected sections for strength recalculation
              affectedSectionIds.add(section._id.toString());

              created.push({
                name: user.name,
                email: user.email,
                regNumber: user.regNumber,
                section: section.name,
              });
            } catch (err) {
              errors.push({
                row: r,
                error: err.message,
              });
            }
          }

          // Recalculate section strengths for affected sections
          for (const sectionId of affectedSectionIds) {
            const studentCount = await User.countDocuments({
              sectionRef: sectionId,
              role: 'student',
              isActive: true
            });
            await Section.findByIdAndUpdate(sectionId, { strength: studentCount });
          }

          // Delete uploaded file
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }

          res.json({
            success: true,
            message: `✅ ${created.length} students imported successfully. ${errors.length} errors.`,
            created,
            errors: errors.length > 0 ? errors : undefined,
          });
        } catch (err) {
          // Delete uploaded file on error
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          res.status(500).json({ error: err.message });
        }
      })
      .on("error", (error) => {
        // Delete uploaded file on error
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        res.status(500).json({ error: error.message });
      });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🧾 Upload Faculty CSV
exports.uploadFacultyCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const results = [];
    const filePath = req.file.path;

    // Read CSV file
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        // Normalize column names
        const normalizedRow = {};
        Object.keys(row).forEach((key) => {
          const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, "");
          normalizedRow[normalizedKey] = row[key]?.trim() || "";
        });
        results.push(normalizedRow);
      })
      .on("end", async () => {
        try {
          const created = [];
          const errors = [];

          for (const r of results) {
            try {
              // Check if user already exists
              const existingUser = await User.findOne({
                email: r.email?.toLowerCase(),
              });
              if (existingUser) {
                errors.push({
                  row: r,
                  error: `User with email ${r.email} already exists`,
                });
                continue;
              }

              // Generate password hash
              const passwordHash = await bcrypt.hash("faculty123", 10);

              // Create User account
              const user = await User.create({
                name: r.name,
                email: r.email?.toLowerCase(),
                passwordHash,
                role: "faculty",
                mobile: r.mobile || "",
                facultyInfo: {
                  department: r.department || "",
                  employeeId: r.employeeid || r.employeeId || "",
                  designation: r.designation || "",
                },
              });

              // Create or update Faculty model entry
              let faculty = await Faculty.findOne({ email: user.email });
              if (!faculty) {
                faculty = await Faculty.create({
                  name: user.name,
                  email: user.email,
                  maxHoursPerWeek: 40,
                });
              }

              created.push({
                name: user.name,
                email: user.email,
                department: user.facultyInfo?.department,
              });
            } catch (err) {
              errors.push({
                row: r,
                error: err.message,
              });
            }
          }

          // Delete uploaded file
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }

          res.json({
            success: true,
            message: `✅ ${created.length} faculty members imported successfully. ${errors.length} errors.`,
            created,
            errors: errors.length > 0 ? errors : undefined,
          });
        } catch (err) {
          // Delete uploaded file on error
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          res.status(500).json({ error: err.message });
        }
      })
      .on("error", (error) => {
        // Delete uploaded file on error
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        res.status(500).json({ error: error.message });
      });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

