const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Room = require('../models/Room');
const Subject = require('../models/Subject');
const Faculty = require('../models/Faculty');
const Section = require('../models/Section');
const Mapping = require('../models/Mapping');
const Timetable = require('../models/Timetable');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smartcampus';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Room.deleteMany({});
    await Subject.deleteMany({});
    await Faculty.deleteMany({});
    await Section.deleteMany({});
    await Mapping.deleteMany({});
    await Timetable.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create Admin User
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@smartcampus.edu',
      passwordHash: adminPassword,
      role: 'admin',
      mobile: '1234567890'
    });
    console.log('👤 Created admin user');

    // Create Rooms
    const rooms = await Room.create([
      {
        code: '407',
        name: 'Room 407',
        building: 'A',
        floor: 4,
        type: 'Classroom',
        capacity: 60,
        equipment: ['Projector', 'Whiteboard'],
        status: 'active',
        allowTheoryClass: true,
        allowLabClass: false
      },
      {
        code: '301',
        name: 'Room 301',
        building: 'A',
        floor: 3,
        type: 'Classroom',
        capacity: 50,
        equipment: ['Projector', 'Whiteboard'],
        status: 'active',
        allowTheoryClass: true,
        allowLabClass: false
      },
      {
        code: '317',
        name: 'Room 317',
        building: 'A',
        floor: 3,
        type: 'Lab',
        capacity: 40,
        equipment: ['Computers', 'Projector'],
        status: 'active',
        allowTheoryClass: true,
        allowLabClass: true
      },
      {
        code: 'A-202',
        name: 'Lab A-202',
        building: 'A',
        floor: 2,
        type: 'Lab',
        capacity: 35,
        equipment: ['Computers', 'Network Equipment'],
        status: 'active',
        allowTheoryClass: false,
        allowLabClass: true
      },
      {
        code: 'A-301',
        name: 'Room A-301',
        building: 'A',
        floor: 3,
        type: 'Classroom',
        capacity: 55,
        equipment: ['Projector', 'Whiteboard', 'Audio System'],
        status: 'active',
        allowTheoryClass: true,
        allowLabClass: false
      }
    ]);
    console.log('🏫 Created 5 rooms');

    // Create Section
    const section = await Section.create({
      name: '3rd Year A',
      year: 3,
      preferredBuildings: ['A'],
      totalPeriodsPerWeek: 30
    });
    console.log('📚 Created section: 3rd Year A');

    // Create Subjects (matching Section-1 timetable)
    const subjects = await Subject.create([
      { code: 'CD', name: 'Compiler Design', type: 'Theory', weeklyPeriods: 3, preferredRoomType: 'Classroom' },
      { code: 'DMT', name: 'Discrete Mathematics', type: 'Theory', weeklyPeriods: 3, preferredRoomType: 'Classroom' },
      { code: 'CN', name: 'Computer Networks', type: 'Theory', weeklyPeriods: 3, preferredRoomType: 'Classroom' },
      { code: 'CN-LAB', name: 'Computer Networks Lab', type: 'Lab', weeklyPeriods: 2, preferredRoomType: 'Lab' },
      { code: 'MSD', name: 'Modern Software Development', type: 'Theory', weeklyPeriods: 3, preferredRoomType: 'Classroom' },
      { code: 'IAI', name: 'Introduction to AI', type: 'Theory', weeklyPeriods: 3, preferredRoomType: 'Classroom' },
      { code: 'WT', name: 'Web Technologies', type: 'Theory', weeklyPeriods: 3, preferredRoomType: 'Classroom' },
      { code: 'IDP', name: 'Industry Defined Project', type: 'Project', weeklyPeriods: 2, preferredRoomType: 'Lab' }
    ]);
    console.log('📖 Created 8 subjects');

    // Create Faculty
    const faculty = await Faculty.create([
      {
        name: 'Dr. John Smith',
        email: 'john.smith@smartcampus.edu',
        maxHoursPerWeek: 40,
        subjects: [subjects[0]._id], // CD
        availability: { dayOfWeek: [0, 1, 2, 3, 4, 5] }
      },
      {
        name: 'Prof. Sarah Johnson',
        email: 'sarah.johnson@smartcampus.edu',
        maxHoursPerWeek: 40,
        subjects: [subjects[1]._id], // DMT
        availability: { dayOfWeek: [0, 1, 2, 3, 4, 5] }
      },
      {
        name: 'Dr. Michael Brown',
        email: 'michael.brown@smartcampus.edu',
        maxHoursPerWeek: 40,
        subjects: [subjects[2]._id, subjects[3]._id], // CN, CN-LAB
        availability: { dayOfWeek: [0, 1, 2, 3, 4, 5] }
      },
      {
        name: 'Prof. Emily Davis',
        email: 'emily.davis@smartcampus.edu',
        maxHoursPerWeek: 40,
        subjects: [subjects[4]._id], // MSD
        availability: { dayOfWeek: [0, 1, 2, 3, 4, 5] }
      },
      {
        name: 'Dr. Robert Wilson',
        email: 'robert.wilson@smartcampus.edu',
        maxHoursPerWeek: 40,
        subjects: [subjects[5]._id], // IAI
        availability: { dayOfWeek: [0, 1, 2, 3, 4, 5] }
      },
      {
        name: 'Prof. Lisa Anderson',
        email: 'lisa.anderson@smartcampus.edu',
        maxHoursPerWeek: 40,
        subjects: [subjects[6]._id], // WT
        availability: { dayOfWeek: [0, 1, 2, 3, 4, 5] }
      },
      {
        name: 'Dr. James Martinez',
        email: 'james.martinez@smartcampus.edu',
        maxHoursPerWeek: 40,
        subjects: [subjects[7]._id], // IDP
        availability: { dayOfWeek: [0, 1, 2, 3, 4, 5] }
      }
    ]);
    console.log('👨‍🏫 Created 7 faculty members');

    // Create Faculty Users
    const facultyPassword = await bcrypt.hash('faculty123', 10);
    for (const f of faculty) {
      await User.create({
        name: f.name,
        email: f.email,
        passwordHash: facultyPassword,
        role: 'faculty',
        mobile: '1234567890'
      });
    }
    console.log('👥 Created faculty users');

    // Create Student User
    const studentPassword = await bcrypt.hash('student123', 10);
    const student = await User.create({
      name: 'Student User',
      email: 'student@smartcampus.edu',
      passwordHash: studentPassword,
      role: 'student',
      regNumber: '3YA001',
      mobile: '1234567890',
      sectionRef: section._id
    });
    console.log('🎓 Created student user');

    // Create Mappings
    const mappings = await Mapping.create([
      { sectionRef: section._id, subjectRef: subjects[0]._id, facultyRef: faculty[0]._id }, // CD
      { sectionRef: section._id, subjectRef: subjects[1]._id, facultyRef: faculty[1]._id }, // DMT
      { sectionRef: section._id, subjectRef: subjects[2]._id, facultyRef: faculty[2]._id }, // CN
      { sectionRef: section._id, subjectRef: subjects[3]._id, facultyRef: faculty[2]._id }, // CN-LAB
      { sectionRef: section._id, subjectRef: subjects[4]._id, facultyRef: faculty[3]._id }, // MSD
      { sectionRef: section._id, subjectRef: subjects[5]._id, facultyRef: faculty[4]._id }, // IAI
      { sectionRef: section._id, subjectRef: subjects[6]._id, facultyRef: faculty[5]._id }, // WT
      { sectionRef: section._id, subjectRef: subjects[7]._id, facultyRef: faculty[6]._id }  // IDP
    ]);
    console.log('🔗 Created mappings');

    // Create Demo Timetable (matching Section-1 structure)
    const timetable = await Timetable.create({
      sectionRef: section._id,
      version: '1.0',
      generatedAt: new Date(),
      isPublished: true,
      schedule: [
        // Monday
        { day: 'Monday', period: 1, startTime: '08:00', endTime: '08:50', subjectRef: subjects[0]._id, facultyRef: faculty[0]._id, roomRef: rooms[0]._id, note: '' }, // CD
        { day: 'Monday', period: 2, startTime: '09:00', endTime: '09:50', subjectRef: subjects[1]._id, facultyRef: faculty[1]._id, roomRef: rooms[1]._id, note: '' }, // DMT
        { day: 'Monday', period: 4, startTime: '10:30', endTime: '11:20', subjectRef: subjects[2]._id, facultyRef: faculty[2]._id, roomRef: rooms[4]._id, note: '' }, // CN
        { day: 'Monday', period: 6, startTime: '13:40', endTime: '14:30', subjectRef: subjects[4]._id, facultyRef: faculty[3]._id, roomRef: rooms[0]._id, note: '' }, // MSD
        { day: 'Monday', period: 7, startTime: '14:30', endTime: '15:20', subjectRef: subjects[5]._id, facultyRef: faculty[4]._id, roomRef: rooms[1]._id, note: '' }, // IAI
        
        // Tuesday
        { day: 'Tuesday', period: 1, startTime: '08:00', endTime: '08:50', subjectRef: subjects[6]._id, facultyRef: faculty[5]._id, roomRef: rooms[4]._id, note: '' }, // WT
        { day: 'Tuesday', period: 2, startTime: '09:00', endTime: '09:50', subjectRef: subjects[0]._id, facultyRef: faculty[0]._id, roomRef: rooms[0]._id, note: '' }, // CD
        { day: 'Tuesday', period: 4, startTime: '10:30', endTime: '11:20', subjectRef: subjects[1]._id, facultyRef: faculty[1]._id, roomRef: rooms[1]._id, note: '' }, // DMT
        { day: 'Tuesday', period: 6, startTime: '13:40', endTime: '14:30', subjectRef: subjects[2]._id, facultyRef: faculty[2]._id, roomRef: rooms[4]._id, note: '' }, // CN
        { day: 'Tuesday', period: 7, startTime: '14:30', endTime: '15:20', subjectRef: subjects[4]._id, facultyRef: faculty[3]._id, roomRef: rooms[0]._id, note: '' }, // MSD
        
        // Wednesday
        { day: 'Wednesday', period: 1, startTime: '08:00', endTime: '08:50', subjectRef: subjects[5]._id, facultyRef: faculty[4]._id, roomRef: rooms[1]._id, note: '' }, // IAI
        { day: 'Wednesday', period: 2, startTime: '09:00', endTime: '09:50', subjectRef: subjects[6]._id, facultyRef: faculty[5]._id, roomRef: rooms[4]._id, note: '' }, // WT
        { day: 'Wednesday', period: 4, startTime: '10:30', endTime: '11:20', subjectRef: subjects[0]._id, facultyRef: faculty[0]._id, roomRef: rooms[0]._id, note: '' }, // CD
        { day: 'Wednesday', period: 6, startTime: '13:40', endTime: '15:20', subjectRef: subjects[3]._id, facultyRef: faculty[2]._id, roomRef: rooms[2]._id, note: '' }, // CN-LAB (2 periods)
        { day: 'Wednesday', period: 7, startTime: '14:30', endTime: '15:20', subjectRef: subjects[3]._id, facultyRef: faculty[2]._id, roomRef: rooms[2]._id, note: '' }, // CN-LAB contd
        
        // Thursday
        { day: 'Thursday', period: 1, startTime: '08:00', endTime: '08:50', subjectRef: subjects[1]._id, facultyRef: faculty[1]._id, roomRef: rooms[1]._id, note: '' }, // DMT
        { day: 'Thursday', period: 2, startTime: '09:00', endTime: '09:50', subjectRef: subjects[5]._id, facultyRef: faculty[4]._id, roomRef: rooms[0]._id, note: '' }, // IAI
        { day: 'Thursday', period: 4, startTime: '10:30', endTime: '11:20', subjectRef: subjects[6]._id, facultyRef: faculty[5]._id, roomRef: rooms[4]._id, note: '' }, // WT
        { day: 'Thursday', period: 6, startTime: '13:40', endTime: '14:30', subjectRef: subjects[2]._id, facultyRef: faculty[2]._id, roomRef: rooms[1]._id, note: '' }, // CN
        { day: 'Thursday', period: 7, startTime: '14:30', endTime: '15:20', subjectRef: subjects[4]._id, facultyRef: faculty[3]._id, roomRef: rooms[4]._id, note: '' }, // MSD
        
        // Friday
        { day: 'Friday', period: 1, startTime: '08:00', endTime: '08:50', subjectRef: subjects[4]._id, facultyRef: faculty[3]._id, roomRef: rooms[0]._id, note: '' }, // MSD
        { day: 'Friday', period: 2, startTime: '09:00', endTime: '09:50', subjectRef: subjects[2]._id, facultyRef: faculty[2]._id, roomRef: rooms[1]._id, note: '' }, // CN
        { day: 'Friday', period: 4, startTime: '10:30', endTime: '11:20', subjectRef: subjects[5]._id, facultyRef: faculty[4]._id, roomRef: rooms[4]._id, note: '' }, // IAI
        { day: 'Friday', period: 6, startTime: '13:40', endTime: '15:20', subjectRef: subjects[7]._id, facultyRef: faculty[6]._id, roomRef: rooms[3]._id, note: '' }, // IDP (2 periods)
        { day: 'Friday', period: 7, startTime: '14:30', endTime: '15:20', subjectRef: subjects[7]._id, facultyRef: faculty[6]._id, roomRef: rooms[3]._id, note: '' }, // IDP contd
        
        // Saturday
        { day: 'Saturday', period: 1, startTime: '08:00', endTime: '08:50', subjectRef: subjects[6]._id, facultyRef: faculty[5]._id, roomRef: rooms[4]._id, note: '' }, // WT
        { day: 'Saturday', period: 2, startTime: '09:00', endTime: '09:50', subjectRef: subjects[0]._id, facultyRef: faculty[0]._id, roomRef: rooms[0]._id, note: '' }  // CD
      ]
    });
    console.log('📅 Created demo timetable for 3rd Year A');

    console.log('\n✅ Seed data created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Admin: admin@smartcampus.edu / admin123');
    console.log('   Faculty: Use any faculty email / faculty123');
    console.log('   Student: student@smartcampus.edu / student123');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seed();

