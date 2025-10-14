# Municipal API Testing Guide

## Recent Fixes Applied

### ✅ Category Filtering
- **Issue**: Category filters weren't working properly in the Events page
- **Fix**: 
  - Updated backend to serialize enums as strings instead of numbers
  - Added `JsonStringEnumConverter` in Program.cs
  - Updated frontend filtering logic to handle both enum names and formatted names
  - Categories now match between backend (e.g., "Public_Safety") and frontend display (e.g., "Public Safety")

### ✅ Event Creation
- **Issue**: Events weren't being posted successfully
- **Fix**:
  - Updated create-event component to send category as enum name string
  - Fixed category selection dropdown to use enum names directly
  - Added event to EventService in-memory data structures upon creation
  - Set default status to "Published" so events appear immediately

### ✅ Issue Reporting
- **Status**: Already working correctly
- **Verification**: Issues are saved to database with proper data structures

## Testing Instructions

### 1. Start the Backend
```powershell
# From d:\MunicipalApi directory
dotnet run
```
Backend will be available at: http://localhost:5120

### 2. Start the Frontend
```powershell
# From d:\MunicipalApi\municipal-nextjs directory
cd municipal-nextjs
npm run dev
```
Frontend will be available at: http://localhost:3000

### 3. Test Category Filtering

#### Test Categories:
Navigate to the Events page and test filtering with these categories:
- Community
- Government
- Public_Safety (displays as "Public Safety")
- Infrastructure
- Health
- Education
- Recreation
- Environment
- Other

#### Expected Behavior:
1. Click on the category dropdown
2. Select any category
3. Events should filter to show only events in that category
4. Category badge on each event card should match the selected filter
5. Results count should update correctly

#### API Test:
```powershell
# Test search with category filter
curl "http://localhost:5120/api/Events/search?category=Community"

# Should return only Community events
curl "http://localhost:5120/api/Events/search?category=Health"

# Test getting all categories
curl "http://localhost:5120/api/Events/categories"
```

### 4. Test Event Creation

#### Frontend Test:
1. Navigate to "Create Event" page
2. Fill in all required fields:
   - **Title**: "Test Community Meeting"
   - **Description**: "A test event to verify event creation"
   - **Organizer**: "Municipal Testing Team"
   - **Start Date**: Select a future date
   - **Location**: "Test Location, Durban"
   - **Category**: Select "Community"
   - **Max Attendees**: 50
   - **Registration Required**: Check the box
   - **Contact Email**: test@durban.gov.za
3. Click "Create Event"
4. Should see success message
5. Navigate back to Events page
6. Your new event should appear in the list

#### API Test:
```powershell
# Create event via API
curl -X POST http://localhost:5120/api/Events `
  -H "Content-Type: application/json" `
  -d '{
    "title": "Test API Event",
    "description": "Testing event creation via API",
    "startsAt": "2025-11-01T10:00:00Z",
    "endsAt": "2025-11-01T12:00:00Z",
    "location": "Test Location",
    "category": "Community",
    "maxAttendees": 100,
    "requiresRegistration": true,
    "contactInfo": "test@example.com"
  }'
```

Expected Response:
```json
{
  "id": "some-guid",
  "title": "Test API Event",
  "category": "Community",
  "status": "Published",
  ...
}
```

### 5. Test Issue Reporting

#### Frontend Test:
1. Navigate to "Report Issues" page
2. Fill in the form:
   - **Title**: "Test Pothole Report"
   - **Description**: "Large pothole on Main Road"
   - **Location**: "Main Road, Durban"
   - **Category**: Select "Roads"
3. Optionally upload images
4. Click "Submit"
5. Should see success message with reference number

#### API Test:
```powershell
# Create issue via API
curl -X POST http://localhost:5120/api/Issues `
  -H "Content-Type: application/json" `
  -d '{
    "title": "Test Water Leak",
    "description": "Water leak on Street Name",
    "location": "123 Test Street, Durban",
    "category": "Water",
    "mediaUrls": []
  }'
```

### 6. Test Data Structures (Part 2 Requirements)

#### Test SortedDictionary (Chronological Ordering):
```powershell
# Get all events - should be sorted by date
curl "http://localhost:5120/api/Events/service/all"
```
✅ Events should be returned in chronological order (earliest first)

#### Test Search with Filters:
```powershell
# Search by query
curl "http://localhost:5120/api/Events/search?query=community"

# Search by category
curl "http://localhost:5120/api/Events/search?category=Health"

# Search by date range
curl "http://localhost:5120/api/Events/search?startDate=2025-10-15&endDate=2025-11-30"

# Combined search
curl "http://localhost:5120/api/Events/search?query=workshop&category=Education"
```
✅ HashSet ensures O(1) category lookups

#### Test Stack (Recently Viewed - LIFO):
```powershell
# View an event (adds to stack)
curl "http://localhost:5120/api/Events/service/[event-id]"

# Get recently viewed
curl "http://localhost:5120/api/Events/recently-viewed?count=5"
```
✅ Most recently viewed events appear first

#### Test Queue (Upcoming Events - FIFO):
```powershell
# Get upcoming events
curl "http://localhost:5120/api/Events/upcoming?count=10"
```
✅ Events are queued in order of start date

#### Test Recommendations (Dictionary tracking):
```powershell
# Track a search
curl -X POST http://localhost:5120/api/Events/track-search `
  -H "Content-Type: application/json" `
  -d '{"query": "community"}'

# Get recommendations
curl "http://localhost:5120/api/Events/recommendations?count=5"
```
✅ Dictionary tracks search frequency and provides personalized recommendations

### 7. Verify Database Operations

#### Check SQLite Database:
```powershell
# List events in database
curl "http://localhost:5120/api/Events"

# List issues in database
curl "http://localhost:5120/api/Issues"
```

### 8. End-to-End Workflow Test

1. **Create an Event**: Use the Create Event form
2. **Search for it**: Use the Events page search
3. **Filter by its category**: Select the category in the dropdown
4. **View the event**: Click on the event card
5. **Check recently viewed**: Should appear in recently viewed section
6. **Report an Issue**: Use the Report Issue form
7. **Check Status page**: Verify issue appears in the status list

## Common Issues and Solutions

### Issue: "Events not filtering by category"
**Solution**: 
- Ensure backend is running with the latest code
- Check browser console for errors
- Verify category names match enum values (Community, Health, etc.)

### Issue: "Event creation fails"
**Solution**:
- Check that all required fields are filled
- Ensure start date is in the future
- Verify category is selected
- Check backend logs for validation errors

### Issue: "Categories show with underscores"
**Solution**:
- Frontend now automatically replaces underscores with spaces for display
- Backend stores as "Public_Safety", frontend shows as "Public Safety"

### Issue: "Search not working"
**Solution**:
- Clear browser cache
- Verify EventService is registered as singleton in Program.cs
- Check that search query is being tracked

## Data Structure Verification

### SortedDictionary<DateTime, List<EventItem>>
- **Purpose**: Maintain chronological order
- **Verification**: Events in `/api/Events/service/all` are sorted by date
- **Time Complexity**: O(log n) insertion, O(n) retrieval

### Stack<EventItem>
- **Purpose**: Track recently viewed events (LIFO)
- **Verification**: `/api/Events/recently-viewed` returns most recent first
- **Time Complexity**: O(1) push/pop

### Queue<EventItem>
- **Purpose**: Manage upcoming events (FIFO)
- **Verification**: `/api/Events/upcoming` returns events in queue order
- **Time Complexity**: O(1) enqueue/dequeue

### HashSet<EventCategory>
- **Purpose**: O(1) category lookups for filtering
- **Verification**: `/api/Events/categories` returns unique categories
- **Time Complexity**: O(1) contains check

### Dictionary<string, int>
- **Purpose**: Track search frequency for recommendations
- **Verification**: `/api/Events/recommendations` uses search history
- **Time Complexity**: O(1) get/set

## Success Criteria

✅ All 16 seeded events load successfully
✅ Category filtering works for all 9 categories
✅ New events can be created and appear immediately
✅ Issues can be reported with all required fields
✅ Search functionality works with queries and filters
✅ Recently viewed events update dynamically
✅ Recommendations appear based on search history
✅ All data structures function as designed
✅ Navigation bar works across all pages
✅ No console errors or build warnings
