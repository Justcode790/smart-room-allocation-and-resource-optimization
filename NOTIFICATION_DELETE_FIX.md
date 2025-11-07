# Notification Multiple Delete Fix

## Issue
DELETE requests to `/api/notifications/delete-multiple` and `/api/notifications/delete-all-read` were failing with 500 errors.

## Changes Made

### 1. Fixed Route Order (`smart/backend/routes/notificationRoutes.js`)
Moved specific routes BEFORE parameterized routes to prevent route matching issues:

```javascript
// ✅ CORRECT - Specific routes first
router.delete('/delete-multiple', authenticate, notificationController.deleteMultipleNotifications);
router.delete('/delete-all-read', authenticate, notificationController.deleteAllRead);
router.delete('/:id', authenticate, notificationController.deleteNotification);
```

### 2. Enhanced Error Handling (`smart/backend/controllers/notificationController.js`)
Added comprehensive validation and logging:

- Validates `notificationIds` is present, is an array, and is not empty
- Validates all IDs are valid MongoDB ObjectIds
- Added detailed console logging for debugging
- Returns specific error messages for each validation failure

### 3. Added Debug Middleware
Added temporary debugging middleware to log request details.

## Testing Instructions

### Step 1: Restart Backend Server
```bash
cd smart/backend
# Stop the current server (Ctrl+C)
npm run dev
```

### Step 2: Test Delete Multiple
1. Open the frontend notifications page
2. Select multiple notifications
3. Click "Delete Selected"
4. Check backend console for logs:
   ```
   [Route Debug] DELETE /delete-multiple hit
   [Route Debug] Body: { notificationIds: [...] }
   [Delete Multiple] Request body: { notificationIds: [...] }
   [Delete Multiple] Notification IDs: [...]
   [Delete Multiple] Delete result: { deletedCount: X }
   ```

### Step 3: Test Delete All Read
1. Mark some notifications as read
2. Click "Delete All Read"
3. Check backend console for logs:
   ```
   [Delete All Read] User ID: ...
   [Delete All Read] Delete result: { deletedCount: X }
   ```

## Expected Behavior

### Success Response
```json
{
  "message": "2 notifications deleted",
  "deletedCount": 2
}
```

### Error Responses

**Missing notificationIds:**
```json
{
  "error": "notificationIds is required in request body"
}
```

**Invalid array:**
```json
{
  "error": "notificationIds must be an array"
}
```

**Empty array:**
```json
{
  "error": "notificationIds array cannot be empty"
}
```

**Invalid ObjectIds:**
```json
{
  "error": "Invalid notification IDs",
  "invalidIds": ["invalid-id-1", "invalid-id-2"]
}
```

## Troubleshooting

### Still Getting 500 Error?

1. **Check Backend Console Logs**
   Look for the debug logs to see what data is being received:
   ```
   [Route Debug] DELETE /delete-multiple hit
   [Route Debug] Body: ...
   ```

2. **Verify Request Format**
   The frontend should send:
   ```javascript
   axios.delete('/notifications/delete-multiple', {
     data: { notificationIds: ['id1', 'id2'] }
   })
   ```

3. **Check Authentication**
   Ensure the user is authenticated and `req.user` exists.

4. **Verify MongoDB Connection**
   Ensure MongoDB is running and connected.

### Common Issues

**Issue: Body is empty `{}`**
- **Cause**: Body parser middleware not working for DELETE requests
- **Solution**: Verify `express.json()` middleware is registered before routes

**Issue: "Invalid notification IDs" error**
- **Cause**: IDs are not valid MongoDB ObjectIds
- **Solution**: Check that frontend is sending correct ID format

**Issue: "Notification not found" but IDs are valid**
- **Cause**: Notifications belong to different user
- **Solution**: Verify `userId` filter is correct

## Cleanup

Once confirmed working, remove the debug middleware from `notificationRoutes.js`:

```javascript
// Remove this debug middleware:
router.delete('/delete-multiple', 
  (req, res, next) => {
    console.log('[Route Debug] DELETE /delete-multiple hit');
    console.log('[Route Debug] Body:', req.body);
    console.log('[Route Debug] Headers:', req.headers);
    next();
  },
  authenticate, 
  notificationController.deleteMultipleNotifications
);

// Replace with:
router.delete('/delete-multiple', authenticate, notificationController.deleteMultipleNotifications);
```

## Files Modified

1. `smart/backend/routes/notificationRoutes.js` - Fixed route order, added debug middleware
2. `smart/backend/controllers/notificationController.js` - Enhanced validation and error handling

---

**Status**: ✅ Fixed - Restart backend server to apply changes
**Next Step**: Test the functionality and check backend console logs
