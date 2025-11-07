# Admin Dashboard Showing Zero Data - Debug Guide

## Issue
Admin dashboard is showing 0 for all statistics (rooms, sections, timetables, utilization).

## Possible Causes

### 1. Database is Empty
The most common cause - no data has been seeded into the database.

### 2. API Endpoints Failing
The API calls are failing silently and returning empty arrays.

### 3. Authentication Issues
The user might not be authenticated properly.

### 4. Backend Not Running
The backend server might not be running or crashed.

## Debugging Steps

### Step 1: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors like:
   ```
   Error fetching stats: ...
   ```
4. Check Network tab for failed API requests

### Step 2: Check Backend Console
Look for any errors in the backend terminal. The dashboard makes these API calls:
- `GET /api/rooms`
- `GET /api/sections`
- `GET /api/timetables`
- `GET /api/analytics`

### Step 3: Test API Endpoints Manually

Open a new terminal and test each endpoint:

```bash
# Get auth token first
$token = (Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@example.com","password":"admin123"}').token

# Test rooms endpoint
Invoke-RestMethod -Uri "http://localhost:5000/api/rooms" -Headers @{Authorization="Bearer $token"}

# Test sections endpoint
Invoke-RestMethod -Uri "http://localhost:5000/api/sections" -Headers @{Authorization="Bearer $token"}

# Test timetables endpoint
Invoke-RestMethod -Uri "http://localhost:5000/api/timetables" -Headers @{Authorization="Bearer $token"}

# Test analytics endpoint
Invoke-RestMethod -Uri "http://localhost:5000/api/analytics" -Headers @{Authorization="Bearer $token"}
```

### Step 4: Check Database

```bash
# Connect to MongoDB
mongosh

# Switch to database
use smartcampus

# Check collections
show collections

# Count documents in each collection
db.rooms.countDocuments()
db.sections.countDocuments()
db.timetables.countDocuments()
db.users.countDocuments()
```

## Solutions

### Solution 1: Seed the Database

If the database is empty, you need to seed it with initial data:

```bash
cd smart/backend
npm run seed
```

This will create:
- Sample rooms (classrooms and labs)
- Sample sections
- Sample subjects
- Sample faculty
- Sample students
- Admin user

**Default Admin Credentials:**
- Email: `admin@example.com`
- Password: `admin123`

### Solution 2: Check Authentication

1. Make sure you're logged in as admin
2. Check localStorage for auth token:
   ```javascript
   // In browser console
   localStorage.getItem('token')
   ```
3. If no token, log out and log back in

### Solution 3: Restart Backend Server

```bash
cd smart/backend
# Stop server (Ctrl+C)
npm run dev
```

### Solution 4: Check API Response Format

The dashboard expects this response format:

**Rooms API:**
```json
[
  { "_id": "...", "code": "R101", "name": "Room 101", ... }
]
```

**Sections API:**
```json
[
  { "_id": "...", "name": "CS-A", "year": 1, ... }
]
```

**Timetables API:**
```json
[
  { "_id": "...", "sectionRef": "...", "schedule": [...], ... }
]
```

**Analytics API:**
```json
{
  "roomStats": {
    "room_id": { "utilization": 75, ... }
  },
  "suggestions": [...]
}
```

### Solution 5: Add Debug Logging

Temporarily add logging to the dashboard:

```javascript
// In AdminDashboard.jsx, modify fetchStats:
const fetchStats = async () => {
  try {
    console.log('Fetching rooms...');
    const roomsRes = await roomAPI.getAll();
    console.log('Rooms response:', roomsRes.data);
    
    console.log('Fetching sections...');
    const sectionsRes = await sectionAPI.getAll();
    console.log('Sections response:', sectionsRes.data);
    
    console.log('Fetching timetables...');
    const timetablesRes = await timetableAPI.getAll();
    console.log('Timetables response:', timetablesRes.data);
    
    console.log('Fetching analytics...');
    const analyticsRes = await analyticsAPI.getAnalytics();
    console.log('Analytics response:', analyticsRes.data);
    
    // ... rest of the code
  } catch (error) {
    console.error('Error fetching stats:', error);
    console.error('Error details:', error.response?.data);
  }
};
```

## Quick Fix Checklist

- [ ] Backend server is running (`npm run dev` in backend folder)
- [ ] Database is running (MongoDB)
- [ ] Database has been seeded (`npm run seed`)
- [ ] Logged in as admin user
- [ ] No errors in browser console
- [ ] No errors in backend console
- [ ] API endpoints return data (test manually)

## Common Issues

### Issue: "Cannot read property 'length' of undefined"
**Cause**: API is returning undefined instead of an array
**Solution**: Check backend controller is returning proper array format

### Issue: "Network Error"
**Cause**: Backend not running or wrong URL
**Solution**: Verify backend is running on port 5000

### Issue: "401 Unauthorized"
**Cause**: Not logged in or token expired
**Solution**: Log out and log back in

### Issue: "Empty arrays returned"
**Cause**: Database is empty
**Solution**: Run seed script: `npm run seed`

## Expected Behavior After Fix

After seeding the database, you should see:
- **Rooms**: 10-20 rooms
- **Sections**: 5-10 sections
- **Timetables**: 0 (until you generate them)
- **Utilization**: 0% (until timetables are generated)

## Next Steps After Seeding

1. **Generate Timetables**:
   - Go to "Generate Timetable" page
   - Select a section
   - Click "Generate Timetable"

2. **Publish Timetables**:
   - Go to "Manage Timetables" page
   - Click "Publish" on generated timetables

3. **Check Dashboard Again**:
   - Dashboard should now show correct counts
   - Utilization will be calculated after timetables are generated

## Still Not Working?

If the issue persists after trying all solutions:

1. **Check Backend Logs**: Look for specific error messages
2. **Check Browser Network Tab**: See exact API responses
3. **Verify Database Connection**: Check MongoDB is accessible
4. **Clear Browser Cache**: Sometimes cached data causes issues
5. **Try Different Browser**: Rule out browser-specific issues

## Contact Information

If you need further assistance, provide:
- Browser console errors (screenshot)
- Backend console errors (copy/paste)
- Network tab showing API responses
- Database collection counts

---

**Most Likely Solution**: Run `npm run seed` in the backend folder to populate the database with initial data.
