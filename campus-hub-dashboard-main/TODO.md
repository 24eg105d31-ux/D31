# Resource Booking Conflict Enforcement - Progress Tracker

## Approved Plan Summary
- Backend: Already prevents double-bookings with transactions/locks
- Fix: Sync resource status, enhance LiveAvailability, disable unavailable slots
- Clean DB duplicates, add real-time slot matrix

## Steps (0/6 Complete)

### 1. Clean duplicate bookings from database.json ✅
- Copy campus-hub-dashboard-main/server/database-cleaned.json → database.json
- Restart backend: Ctrl+C backend terminal, `node campus-hub-dashboard-main/server/server.js`

### 2. Update server/database.js - Sync resource status from bookings ✅
- Added updateResourceStatusesFromBookings() called in initResources/createBooking
- Sets 'booked' if any approved/pending booking next 7 days

**Next Step: 3/6 LiveAvailability.tsx**

### 3. Update LiveAvailability.tsx - Time-specific availability
- Add date picker + slot matrix/grid
- Fetch /api/bookings/check for each slot, color-code available/booked
- Auto-poll every 10s

### 4. Update resource pages (LabsPage/ClassroomsPage/HallsPage.tsx)
- Fetch all time slots availability on dialog open
- Disable unavailable slots in Select

### 5. Test conflicts
- Login 2 users, book same slot -> should block 2nd
- Check LiveAvailability shows real-time

### 6. Restart servers & demo
- Frontend dev server
- Backend node server.js

**Next Step: 1/6 Clean DB**
