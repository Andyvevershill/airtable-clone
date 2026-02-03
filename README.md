# AirTable Clone Project

Project link:
https://airtable-clone-andrew-hills-projects.vercel.app


Real Airtable (for UI comparison): 
https://airtable.com/

##  🛠️ Tech Stack

Tech: Next.js, TypeScript, React, Zustand, tRPC, Tailwind CSS, Tanstack, BetterAuth, shadcn/ui, Vercel

Database: PostgreSQL with Drizzle ORM + Neon

##  Important info

The main reason for this project is to match UI 1-1 with airtable and create some complex and scalable functionality. 

This is a demo, so it's important to understand the functional limitations outlined below:

1. You can only enter with Google Log In.
2. Once inside the dashboard: => create => "Build an app on your own", creates a new base, a default table and a default view.
3. New tables will always be created with fake data from Faker.js.
4. After creating your first base, the dashboard will show all created bases ordered by last accesssed, where you can favourite, rename, delete.
5. Columns => there are only 3 types of working columns: text, number and checkbox. Any standard field in the dropdown with "number" in its title with be created as number type, and so on for text + checkbox. No other column types can be created.
6. Functionality => Hiding, filtering, sorting and searching. These filters are implimented via the backend for scalability of large datasets. (We do not use Tanstacks built in states for anything other than hidden fields).
7. Views => Views are fully functional: create, rename, switch between, duplicate, delete. Any changes to filtering/sorting/hidden fields, will automatically be saved to the currect active view and preloaded into the table when switching between views. Only Grid views can be created from the dropdown menu.

##  Additional features

- Infinite scroll with cursor pagination - only fetches what you need as you scroll through data
- Virtualised rendering with TanStack Table - renders visible rows only, so you can scroll through hundreds of thousands of rows without lag
- Optimistic + Caching updates - UI responds instantly whilst changes sync in the background
- End-to-end type safety with tRPC 
- tab/table based routing system


As a junior, feedback is priceless. If you have the time to play around with the app and look through the code, I would welcome any and all constructive criticism, Please reach out and message me on LinkedIn: https://www.linkedin.com/in/andrew-hill-90b920234/



