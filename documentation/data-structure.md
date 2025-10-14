SortedDictionary<DateTime, Event> eventsByDate = new();
Queue<Event> upcomingEvents = new();
Stack<Event> recentEvents = new();
PriorityQueue<Event, int> featuredEvents = new();
HashSet<string> categories = new();
Dictionary<string, int> searchFrequency = new();
