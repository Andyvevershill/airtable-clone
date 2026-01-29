# AirTable Clone Project

Project link:
https://lyra-airtable-clone-andrew-hills-projects-e6822b9b.vercel.app/

Real Airtable (for UI comparison): 
https://airtable.com/

##  🛠️ Tech Stack


Tech: Next.js, TypeScript, React, Zustand, tRPC, Tailwind CSS, Tanstack, BetterAuth, shadcn/ui

Database + Deployment: PostgreSQL with Drizzle ORM + Neon, Vercel

##  Important info

The main reason for this project is to match UI 1-1 with airtable and create some complex functionality. 

I have built this demo in ≈ three weeks so it's important to understand the functional limitations outlined below:

1. You can only enter with Google Log In.
2. Once inside the dashbaord: => create => "Build an app on your own", creates a new base, a default table and a default view.
3. After creating your first base, the dashboard will show all created bases ordered by last accesssed, where you can customise, favourite, rename.
4. Columns => there are only 3 types of columns: text, number and checkbox. Any standard field in the dropdown with "number" in its title with be created as number type, and so on for text + checkbox. No other column types can be created.
5. Functionality => Filtering, sorting and searching are implimented through the backend for scalability of large datasets.
6. Views => fully functional: rename, change active, duplicate, delete. Any changes to filtering/sorting/hidden fields, will automatically be saved to the view and preloaded into the table when reselecting this view.

As a junior, feedback is priceless. If you have the time to play around with the app and look through the code, I would welcome and constructive criticism, Please reach out and message me on LinkedIn: https://www.linkedin.com/in/andrew-hill-90b920234/



