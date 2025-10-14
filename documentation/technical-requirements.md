Backend (ASP.NET Core)

Controller: EventsController.cs with endpoints:

GET /api/events – return all events

GET /api/events/search?query= – filter events

GET /api/events/recommend – generate recommendations

Models:

Event.cs (Title, Category, Date, Description, Priority, ImagePath)

Issue.cs (reuse from Part 1)

Services:

EventService.cs manages data structures (SortedDictionary, Stack, Queue, etc.)

Store data in SeedData.cs (populate 15+ events).

Frontend (React / Next.js)

pages/index.tsx – Main menu (Report Issues, Events, Service Status).

pages/events.tsx – Displays Local Events & Announcements.

Components:

EventCard.tsx – Event card layout

SearchBar.tsx – Search input + filter controls

RecommendationList.tsx – Recommended events grid

State management: Context API or Redux Toolkit.