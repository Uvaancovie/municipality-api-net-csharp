🧠 Recommendation Algorithm

Tracks user search frequency and suggests events sharing categories or dates:

var topSearch = searchStats.OrderByDescending(s => s.Value).First().Key;
var recommendations = events.Values
  .Where(e => e.Category.Contains(topSearch, StringComparison.OrdinalIgnoreCase))
  .Take(3);