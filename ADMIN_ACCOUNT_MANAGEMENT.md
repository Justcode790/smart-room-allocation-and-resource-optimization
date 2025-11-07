# Admin Account Management Documentation

## Overview
This feature allows administrators to create and manage student and faculty accounts through:
1. Manual account creation via forms
2. Bulk CSV upload for both students and faculty
3. Automatic credential generation
4. Section linking for students

## Features

### ✅ Manual Account Creation
- Create individual student accounts with section assignment
- Create individual faculty accounts with department information
- Automatic password generation (student123 / faculty123)
- Real-time validation and error handling

### ✅ CSV Bulk Upload
- Upload CSV files to create multiple accounts at once
- Automatic section linking for students
- Error reporting for failed imports
- Progress feedback

### ✅ Automatic Features
- Auto credential generation (default passwords)
- Section linking for students
- Department assignment for faculty
- Section strength recalculation

## CSV Format

### Students CSV
Expected columns:
```
name, regNumber, email, mobile, section, year, batch, department, rollNumber
```

Example:
```csv
name,regNumber,email,mobile,section,year,batch,department,rollNumber
Aman Verma,3YA001,aman@vignan.edu,9999999999,3rd Year A,3,2023-2027,CSE,01
Raj Kumar,3YA002,raj@vignan.edu,8888888888,3rd Year A,3,2023-2027,CSE,02
```

**Required fields:**
- name
- email
- section (must match an existing section name/code)

**Optional fields:**
- regNumber
- mobile
- rollNumber
- year
- batch
- department

**Note:** Section must exist in the system. The section name/code is case-insensitive and can match by name, code, or partial match.

### Faculty CSV
Expected columns:
```
name, email, mobile, department
```

Example:
```csv
name,email,mobile,department
Dr. John Smith,john.smith@vignan.edu,8888888888,CSE
Dr. Jane Doe,jane.doe@vignan.edu,7777777777,ECE
```

**Required fields:**
- name
- email
- department

**Optional fields:**
- mobile
- employeeId
- designation

## API Endpoints

### Manual Account Creation
- `POST /api/admin/create-student` - Create student account
- `POST /api/admin/create-faculty` - Create faculty account

### Get All Accounts
- `GET /api/admin/students` - Get all students
- `GET /api/admin/faculty` - Get all faculty

### CSV Upload
- `POST /api/admin/upload-students` - Upload students CSV
- `POST /api/admin/upload-faculty` - Upload faculty CSV

All endpoints require admin authentication.

## Default Credentials

- **Students:** Password is `student123` (default)
- **Faculty:** Password is `faculty123` (default)

**⚠️ Important:** Users should change their passwords after first login for security.

## Usage

### Accessing the Feature
1. Log in as admin
2. Navigate to Admin Dashboard
3. Click on "Manage Accounts" card
4. Select "Students" or "Faculty" tab

### Manual Account Creation
1. Fill in the required fields in the form
2. For students, select a section from the dropdown
3. Click "Create Student/Faculty Account"
4. Credentials will be displayed in the success message

### CSV Bulk Upload
1. Prepare your CSV file according to the format above
2. Click "Select CSV File" and choose your file
3. Click "Upload CSV"
4. Wait for processing - success/error messages will be displayed
5. Review any errors if they occur

## Error Handling

### Common Errors
- **"Section not found"** - The section name in CSV doesn't match any existing section
- **"User with this email already exists"** - Email is already registered
- **"No file uploaded"** - CSV file was not selected
- **"Only CSV files are allowed"** - File format is incorrect

### CSV Upload Errors
- Errors are logged per row
- Successful imports continue even if some rows fail
- Error details are included in the response

## Section Linking

Students are automatically linked to sections based on:
- Section name (exact match)
- Section code (exact match)
- Section name (case-insensitive partial match)

Section strength is automatically recalculated after bulk imports.

## Security

- All routes require admin authentication
- File uploads are limited to 5MB
- Only CSV files are accepted
- Uploaded files are automatically deleted after processing
- Default passwords should be changed by users

## Frontend Route

The feature is accessible at: `/admin/accounts`

## File Storage

- Uploaded CSV files are temporarily stored in `backend/uploads/`
- Files are automatically deleted after processing
- Ensure the uploads directory has write permissions

## Real-time Updates

The system integrates with Socket.io for real-time updates:
- New account creation notifications
- Dashboard statistics updates
- Section strength updates

