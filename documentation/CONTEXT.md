# PROG7312 Part 2 – Municipal Services Application  
**Developer:** Uvaan Covenden (Mr Covie)  
**Institution:** Varsity College Durban North  
**Module:** PROG7312 – Advanced Programming  
**Lecturer:** Mr Denzyl Govender  
**Due Date:** October 2025  

---

## 🎯 Project Goal
Extend the Part 1 C# Municipal Services App into a **full-stack civic-engagement platform** with:
- React frontend (Events & Announcements, Report Issues, Service Status)  
- ASP.NET Core Web API backend  
- Emphasis on **advanced data structures and algorithms** (Dictionary, SortedDictionary, Stack, Queue, PriorityQueue, HashSet)

---

## 🧩 Functional Requirements
1. **Main Menu**
   - Buttons: Report Issues (enabled) | Local Events & Announcements (enabled in Part 2) | Service Request Status (disabled)
   - Persistent navigation without data loss  
   - Municipal branding and logo  

2. **Report Issues Page**
   - Capture issue details (name, location, category, description, attachments)
   - Store issues in `Dictionary<Guid, Issue>` or `List<Issue>`
   - Display confirmation and report count (engagement feature)

3. **Local Events & Announcements**
   - Display ≥ 15 sample events with title, date, category, description
   - **Search:** by date or category  
   - **Sort:** by date / category / name  
   - **Primary Storage:** `SortedDictionary<DateTime, Event>`  
   - **Stacks / Queues / Priority Queues:**  
     - Stack = recently viewed events  
     - Queue = upcoming events  
     - PriorityQueue = featured events  
   - **Sets / HashTables / Dictionaries:**  
     - Manage unique categories and dates for filtering  
   - **Recommendation Feature:**  
     - Track user search frequency with `Dictionary<string, int>`  
     - Suggest events matching most searched category/date  

4. **UI & UX Requirements**
   - Consistent theme (React + Tailwind / Shadcn)  
   - Real-time filter updates  
   - Intuitive navigation and visual feedback  
   - Municipality logo integration  

---

## 🧮 Data Structures Summary

| Use Case | Data Structure |
|:--|:--|
| Store events chronologically | SortedDictionary |
| Recent views | Stack |
| Upcoming queue | Queue |
| Featured priority | PriorityQueue |
| Unique categories / dates | HashSet |
| Search frequency | Dictionary |

---

## 🧰 Technical Stack
- **Backend:** ASP.NET Core 8 (Web API)  
- **Frontend:** React 18 + Vite or Next.js 15 (App Router)  
- **Storage:** In-memory collections (JSON seeded)  
- **Language:** C# / TypeScript  

---

## 📹 Deliverables
- ✅ Part 1 and Part 2 source code on GitHub  
- ✅ Video demo showing navigation, search, sort, recommendations  
- ✅ README with Part 1 and Part 2 YouTube links  

---

## 🧠 Agent Prompt
> You are an expert .NET and React developer. Implement the above functionality using clean, modular C# and React components, ensuring that all required data structures are explicitly used and demonstrated in code. Populate ≥ 15 sample events and provide real-time UI feedback for search, sorting and recommendations.


# 🏗️ PROG7312 – Municipal Services Application (Part 2)
**Developer:** Uvaan Covenden | Way2Fly Digital  
**Module:** PROG7312 Advanced Programming  
**Lecturer:** Mr Denzyl Govender  
**Year:** 2025  

This context file merges all supporting markdowns to guide AI agents and developers building the Part 2 deliverable.

---

## 🔹 Documentation Map
| Section | Purpose |
|:--|:--|
| `objective.md` | Defines overall vision and academic context |
| `part-2-requirements.md` | Summarises Denzyl Govender’s official brief |
| `technical-requirements.md` | Lists backend + frontend + data structure logic |
| `core-data-structures.md` | Details required advanced data structures |
| `reccommendation.md` | Explains search pattern & recommendation algorithm |
| `rubric-mapping.md` | Maps project grading outcomes |
| `Deliverables.md` | Explains submission checklist |
| `Agent Implementation Goals.md` | Defines what the AI agent must build |
| `Agent Next Steps.md` | Breaks down development order |
| `Coding Guidelines.md` | Code quality, async rules, UI consistency |
| `context-summary.md` | Brief summary for human readers |

---

## 🎯 Agent Directive
> Merge all the above documents into a coherent understanding of the system.
> You are to build a **C# ASP.NET Core 8 backend** and a **React/Next.js frontend** implementing:
> - `SortedDictionary<DateTime, Event>` for chronological storage  
> - `Stack<Event>` and `Queue<Event>` for user history and upcoming events  
> - `PriorityQueue<Event, int>` for featured events  
> - `HashSet<string>` for unique categories  
> - `Dictionary<string, int>` for search tracking and recommendations  
> - Real-time search/sort filtering on the frontend  
> - Recommendation list displayed under search results  
> - 15 sample events seeded via `SeedData.cs`

All commits must reference “PROG7312 Part 2 Implementation” in commit messages.

---
