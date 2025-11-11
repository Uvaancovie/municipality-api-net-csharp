utlise these structures to manage complex relationships and optimize the display of service request status 
in depth explanataion are provided for each of implemented data structure detailed its role and contribuition to the efficiency of the service request status feature with relevant examples 
significant insights into key learnings acquired throughout the project , including new skills , problem solving , approaches , and programming techs 
the discsussion reflects a deep understanding of the learning process during the project 
# Task 3 – Municipal Services Application

Task 3 focuses on the final implementation of the Municipal Services Application. The emphasis is on integrating advanced data structures and algorithms, including:

- basic trees
- binary trees
- binary search trees
- AVL trees
- red-black trees
- heaps
- graphs
- graph traversal techniques
- minimum spanning tree algorithms

## Scenario

The municipal services application is a comprehensive platform for residents. It must allow community members to:

- report municipal issues
- access local events and announcements
- track service requests

## Implementation Overview

### Technology Stack

- C# .NET 8
- ASP.NET Core Web API with Swagger
- React (or Next.js) frontend
- Persistent storage (e.g., SQLite or SQL Server)

### Core Functional Areas

- **Report Issues:** capture detailed service requests
- **Local Events and Announcements:** maintain separate listings for events and announcements
- **Service Request Status:** allow residents to monitor previously submitted issues

## Service Request Status Page Requirements

When users navigate to the service request status page, implement the following features:

- display an organised list of submitted service requests, including their current status
- enable tracking by unique identifiers
- employ advanced data structures (graphs, binary search trees, heaps, etc.) to manage and present information efficiently

## Technical Requirements

### 1. Tree Implementations (20 marks)

- implement basic trees, binary trees, binary search trees, AVL trees, and red-black trees
- use these structures to organise and retrieve service request information effectively

### 2. Heaps and Graph Algorithms (30 marks)

- implement heaps to prioritise service requests
- implement graphs, graph traversal, and minimum spanning tree algorithms to manage relationships and optimise status displays

## Documentation Deliverables

### Implementation Report (20 marks)

- compile a detailed README that explains how to compile, run, and use the application
- for each implemented data structure, describe its role in the service request status feature and provide relevant examples

### Project Completion Report (20 marks)

- summarise the overall project completion
- discuss challenges faced during Task 3 and how they were resolved
- share insights and key learnings (new skills, problem-solving approaches, programming techniques)

### Technology Recommendations (10 marks)

- suggest additional technologies or tools that could enhance the application
- justify each recommendation with expected benefits and compatibility considerations

## Submission Checklist

1. Word document containing the comprehensive report
2. Complete source code for the functioning application
3. README with instructions for compiling, running, and using the software
4. Change log documenting updates made in response to lecturer feedback
	- _Note: “You were asked to separate events and announcements, otherwise Very Nice.”_

## Lecturer Feedback (30 points)

> The Main Menu is flawlessly implemented with organised options, and all features work perfectly without any errors.
>
> The implementation effectively utilises stacks, queues, or priority queues for managing event-related data structures.
>
> Hash tables, dictionaries, or sorted dictionaries are seamlessly integrated for organising and retrieving event information.
>
> Sets are effectively incorporated to handle unique categories or dates efficiently.
>
> The recommendation feature is seamlessly integrated, analysing user search patterns and preferences. An appropriate algorithm or data structure is used to suggest related or recommended events. Recommendations are presented in a user-friendly manner within the application.

## Professional Tips

- Use Swagger UI to demonstrate data structures (trees, heaps, graphs)
- Deploy the backend with Docker so it can run alongside the frontend (e.g., on Vercel)

## Acceptance Criteria

- Tree implementations provide efficient organisation and retrieval of service request information
- Integration of data structures is flawless and addresses potential issues effectively
- Heaps, graphs, graph traversal, and minimum spanning tree algorithms manage complex relationships and optimise status displays
- The implementation demonstrates a deep understanding of each structure’s role and efficient utilisation

### Documentation Quality

- README is detailed, clear, and provides comprehensive instructions for compiling, running, and using the program
- Explanations for each data structure are in-depth, illustrate their contribution to the service request status feature, and include clear examples

### Project Reflection

- Project completion report captures significant insights, new skills, problem-solving approaches, and programming techniques
- Discussion reflects a deep understanding of the overall learning journey

### Technology Recommendations

- Suggestions directly enhance application functionality or performance
- Justifications clearly outline benefits and compatibility with the project goals