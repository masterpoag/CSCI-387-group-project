# User Manual for the NutriFlow Web App

---

## Table of Contents

- [Introduction](#introduction)
- [Requirements and Instructions for System Creators](#requirements-and-instructions-for-system-creators)
  - [System Requirements](#system-requirements)
  - [Database Instructions](#database-instructions)
  - [System Files Instructions](#system-files-instructions)
  - [Backend Instructions](#backend-instructions)
- [Requirements for NutriFlow Users](#requirements-for-nutriflow-users)
  - [Account Setup](#account-setup)
    - [Create an Account](#create-an-account)
    - [Log In](#log-in)
    - [Log Out](#log-out)
  - [Theme Toggle](#theme-toggle)
  - [Home Page](#home-page)
  - [Recipes](#recipes)
    - [Browse Recipes](#browse-recipes)
    - [Create a Recipe](#create-a-recipe)
    - [Add a New Food](#add-a-new-food)
    - [Delete a Recipe](#delete-a-recipe)
    - [Report a Recipe](#report-a-recipe)
  - [Workouts](#workouts)
    - [Browse Workouts](#browse-workouts)
    - [Create a Workout](#create-a-workout)
    - [Delete a Workout](#delete-a-workout)
    - [Report a Workout](#report-a-workout)
  - [Nutritionist Dashboard](#nutritionist-dashboard)
  - [Gym Instructor Dashboard](#gym-instructor-dashboard)
  - [Admin Dashboard](#admin-dashboard)
    - [Manage Users](#manage-users)
    - [Review Reports](#review-reports)
  - [Account Roles](#account-roles)

---

## Introduction

NutriFlow is a web application that helps people plan meals and workouts in one
place. Users can register an account, build personal recipes from a shared food
library, save workout routines, and browse public content shared by chefs and
fitness instructors.

The production application is hosted at
**https://turing.cs.olemiss.edu/~group3sp26** with the API at **https://gp.vroey.us**.

This manual has two audiences:

- **System creators** who want to host their own copy of NutriFlow. See
  [Requirements and Instructions for System Creators](#requirements-and-instructions-for-system-creators).
- **NutriFlow users** who want to use the live application.
  [Requirements for NutriFlow Users](#requirements-for-nutriflow-users). This includes all site user types (Amdmin, Nutritionist, etc.).

---

## Requirements and Instructions for System Creators

The next four sections cover everything you need to host your own copy of
NutriFlow.

### System Requirements

| Component | Version |
|-----------|---------|
| Node.js   | 18.19.1 |
| Python    | 3.10 or newer |
| MySQL     | 8.0 or newer (MariaDB 10.3+ also supported) |
| npm       | Bundled with Node.js |
| Ubuntu    | LTS 24.02 or newer | 

### Database Instructions

NutriFlow uses MySQL. The schema script lives at
[src/backend/Meal_Tracker_PROD_create.sql](src/backend/Meal_Tracker_PROD_create.sql).
It creates seven tables: `User`, `Admin`, `Recipe`, `Food`, `Quantity`,
`Workout`, and `Report`.

(1) Create an empty database in MySQL. From the MySQL shell:

```sql
CREATE DATABASE nutriflow;
```

(2) From the project root, source the schema file. Replace `{username}` and
`{databasename}` with your values:

```bash
mysql -u {username} -p {databasename} < src/backend/Meal_Tracker_PROD_create.sql
```

(3) Configure the backend's database credentials. Copy the example file and
fill in your values:

```bash
cp src/.EXAMPLEENV src/backend/database.env
```

Open `src/backend/database.env` and replace the placeholders:

```json
{
  "servername": "localhost",
  "username":   "YOUR_USERNAME",
  "password":   "YOUR_PASSWORD",
  "dbname":     "nutriflow"
}
```

To reset the database later, source
[src/backend/Meal_Tracker_PROD_drop.sql](src/backend/Meal_Tracker_PROD_drop.sql)
the same way to drop all tables.

Note the database is not pre-seeded with `Meal_Tracker_PROD_create.sql`. System Creators will need to seed data into the database or rely on users to add new data.

### System Files Instructions

(1) Clone the repository:

```bash
git clone <repository-url>
cd CSCI-387-group-project
```

(2) Install frontend dependencies:

```bash
npm install
```

(3) Start the frontend dev server:

```bash
npm run dev
```

The app will be available at the URL Vite prints in the terminal (typically
`http://localhost:5173/~group3sp26/`).

Other npm scripts:

| Command           | Purpose                                  |
|-------------------|------------------------------------------|
| `npm run dev`     | Start Vite dev server with hot reload    |
| `npm run build`   | Build production bundle into `dist/`     |
| `npm run preview` | Serve the production build locally       |
| `npm run lint`    | Run ESLint on the project                |

(4)
In the root directory, create a file called `.env` with the following text field:
```env
VITE_API_BASE="<PROTOCOL>://<DATABASE_IP>:<PORT>"
```

Replace with the your respective ip and port (typically : `http://localhost:8000`).
> [!NOTE]
> If this enviroment variable fails to be loaded, the project will fall back to `https://gp.vroey.us`

### Backend Instructions

The Python backend uses FastAPI and lives in
[src/backend/](src/backend/).

(1) Create a Python virtual environment and install FastAPI plus the MySQL
connector:

```bash
python3 -m venv venv
source venv/bin/activate
pip install fastapi[standard] mysql-connector-python
```

(2) Make sure `src/backend/database.env` is in place (see
[Database Instructions](#database-instructions)).

(3) Start the backend with the included script:

```bash
cd src/backend
./bgk_run.sh
```

This starts FastAPI in development mode on `localhost:8000`. To run in
production mode, pass the `-r` flag:

```bash
./bgk_run.sh -r
```

The interactive API docs are available at `http://localhost:8000/docs`.

---

## Requirements for NutriFlow Users

The next sections are for people using the live NutriFlow application. Open
**https://turing.cs.olemiss.edu/~group3sp26** in any modern browser to begin.

### Account Setup

#### Create an Account

(1) Click **Login** in the top navigation bar.
<img width="1920" height="1080" alt="ss_2026-04-28_13-01-19" src="https://i.imgur.com/ZqSU2et.png" />


(2) Click **Create one** at the bottom of the login card.

> <img width="1920" height="1080" alt="ss_2026-04-28_13-08-06" src="https://github.com/user-attachments/assets/ce299135-4c60-4ef0-857a-18d4af86af7e" />
>
> *Figure 1 — Registration form. Click "Create one" to switch from Login to
> Create Account mode.*

(3) Fill in your **email**, **password**, and **confirm password**.
<img width="1920" height="1080" alt="ss_2026-04-28_13-14-19" src="https://github.com/user-attachments/assets/40ac927c-88ed-4391-8e0b-35281b27a342" />

(4) Click **Create Account**.
<img width="1920" height="1080" alt="ss_2026-04-28_13-16-39" src="https://github.com/user-attachments/assets/0823c2ae-665b-444b-9984-dde100787157" />

(5) When the success popup appears, click **OK**. You will be returned to the
login form.
<img width="1920" height="1080" alt="ss_2026-04-28_13-17-32" src="https://github.com/user-attachments/assets/7a6d6b6f-9da5-42f2-9034-a5795afa156b" />

#### Log In

(1) From the login card, enter the **email** and **password** you registered
with.

> <img width="1920" height="1080" alt="ss_2026-04-28_13-20-20" src="https://github.com/user-attachments/assets/21d5bae1-3bfc-43fd-aa43-dcea63e7ab65" />
>
> *Figure 2 — Login form. Click Login after entering credentials.*

(2) Click **Login**. On success, you are redirected to the home page and the
top navigation now shows a **Logout** button.
<img width="1920" height="1080" alt="ss_2026-04-28_13-20-20" src="https://github.com/user-attachments/assets/4e97e0c0-1fb5-4307-8f16-6d86ef7a785b" />

If your credentials are incorrect, an error message appears below the form in
red.

#### Log Out

Click **Logout** in the top navigation bar at any time. Your session token is
cleared and you are returned to a logged-out state.
<img width="1920" height="1080" alt="ss_2026-04-28_15-07-31" src="https://github.com/user-attachments/assets/22d6ab44-1ae5-407a-8650-0c7494e2918e" />

### Theme Toggle

NutriFlow supports light mode and dark mode. The toggle button sits at the
right end of the top navigation bar.

> ![Top navigation bar with the sun and moon theme toggle button on the right](docs/images/theme-toggle.png)
>
> *Figure 3 — Theme toggle button. The sun icon (☀) appears in light mode and
> the moon icon (☾) appears in dark mode.*

Click the icon to switch themes. Your choice is saved across visits. On first
visit, NutriFlow follows your system theme preference.

### Home Page

The home page introduces NutriFlow and provides quick links to the main
features.

> ![Home page showing the hero section, three feature cards, and the workflow steps](docs/images/home-page.png)
>
> *Figure 4 — Home page sections.*

The page contains:

- **Get Started** — links to the login/registration page.
- **Browse Recipes** — links to the Recipes page.
- **Browse Workouts** — links to the Workouts page.
- **Feature cards** describing Smart Planning, Recipe Discovery, and
  Goal-Aware Choices.
- **How it works** — a three-step overview of the typical user flow.

### Recipes

The Recipes page (URL: `/food`) is where users browse and create recipes.

#### Browse Recipes

(1) Click **Recipes** in the top navigation bar.
<img width="2554" height="1271" alt="image" src="https://github.com/user-attachments/assets/cf2cf8a6-99e9-46de-a28d-1dffd025a9f7" />

(2) Use the **search box** to filter recipes by name, description, or
instructions.
<img width="2545" height="1276" alt="image" src="https://github.com/user-attachments/assets/6ff88da2-d507-4fb6-9509-28285a4985ef" />

*Figure 5 — Recipes page. The counter under the search box shows how many recipes match the current search.*
<img width="2536" height="1272" alt="image" src="https://github.com/user-attachments/assets/b1bc7707-a3bb-448c-9b8b-f45d1e8ca10e" />

Each recipe card displays:

- The recipe name.
- The description (if provided).
- The list of ingredients in the format `2.50 Cup of rice (200 cal)`.
- The instructions (if provided).
- A badge showing **Global** for public recipes or **Personal** for your own
  private recipes.
- A button to allow for deletion or reporting depending on if you own it or not 
<img width="2545" height="1272" alt="image" src="https://github.com/user-attachments/assets/19bda95a-b0c2-4b55-b899-c7a0f55b5915" />


If no recipes match the search, the page shows the message *"No recipes
found — Try a different keyword."*
<img width="2545" height="1274" alt="image" src="https://github.com/user-attachments/assets/0a8e4980-33e7-4bb8-a7d1-47645787ad2f" />

#### Create a Recipe

You must be logged in to create a recipe.

(1) Click **Create Recipe +** at the top-left of the Recipes page. The Create
New Recipe modal opens.
<img width="2543" height="1274" alt="image" src="https://github.com/user-attachments/assets/c3bcdccd-94cf-4158-b1ba-1d5965720d33" />



(2) Fill in the recipe details:

| Field         | Required | Notes                                       |
|---------------|----------|---------------------------------------------|
| Recipe Name   | Yes      | For example, *Chicken Stir Fry*.            |
| Description   | No       | A short summary of the recipe.              |
| Instructions  | No       | Step-by-step cooking directions.            |
<img width="2542" height="1272" alt="image" src="https://github.com/user-attachments/assets/0e711550-425c-4a5d-824c-ad9a2bd823e8" />


(3) Add at least one ingredient:

  a. Choose a **Unit** from the dropdown (Pound, Ounce, Cup, or Teaspoon).
  <img width="2535" height="1275" alt="image" src="https://github.com/user-attachments/assets/e098c4d7-4163-4e12-a711-42beab42f692" />

  b. Choose a **Food** from the searchable dropdown. If your food is not in
     the list, click **+ New food…** and follow [Add a New Food](#add-a-new-food).
  <img width="2543" height="1279" alt="image" src="https://github.com/user-attachments/assets/029d74a6-25e7-4159-84b2-25c4f7de1974" />

  c. The food is added to the ingredient table. Edit its **Quantity** in the
     table. Click the **×** button to remove an ingredient.
<img width="2545" height="1277" alt="image" src="https://github.com/user-attachments/assets/b7b21e89-96dc-4408-90e5-58a3a95611da" />

> ![Ingredient table inside the Create Recipe modal showing two foods with quantity, calories, unit, and remove button](docs/images/recipe-ingredients.png)
>
> *Figure 7 — Ingredient table. Edit quantity directly in the row. Click ×
> to remove an ingredient.*

(4) switch the **Keep Private** switchbox if you
want this recipe to be eligible for publishing.
This changes the title to **Submit for Publishing**.
<img width="2539" height="1278" alt="image" src="https://github.com/user-attachments/assets/ebdff121-e2fa-41d9-8c9d-1a3de54f5300" />

(5) Click **Create Recipe**. The modal closes and the new recipe appears in
the grid. Click **Cancel** to close without saving.
<img width="2540" height="1274" alt="image" src="https://github.com/user-attachments/assets/5f790428-1263-4e78-b360-0062439ddf71" />

If the recipe name is missing, the recipe has no ingredients, or you already
have a recipe with the same name, an error message appears at the bottom of the
modal.
<img width="2540" height="1270" alt="image" src="https://github.com/user-attachments/assets/401512c1-9c5f-4430-988f-778632abe4c7" />

#### Add a New Food

When the food you need is not already in the dropdown, you can create it
during recipe creation.

(1) In the Create Recipe modal, select a **Unit** first (the New Food option
is disabled until a unit is selected).
<img width="2535" height="1275" alt="image" src="https://github.com/user-attachments/assets/e098c4d7-4163-4e12-a711-42beab42f692" />
(2) Open the **Food** dropdown and click **+ New food…**.
<img width="2543" height="1277" alt="image" src="https://github.com/user-attachments/assets/ed50ebd0-1871-4037-81af-f759d623b04c" />

New Food modal with Food name field and Calories field labeled with the selected unit
<img width="2541" height="1273" alt="image" src="https://github.com/user-attachments/assets/e9b34735-c93f-48e9-aa97-4353d4ba8fc6" />


(3) Enter the **Food name** and **Calories per 1 [unit]**.
<img width="2547" height="1274" alt="image" src="https://github.com/user-attachments/assets/ea6bdacd-ab97-4419-b09a-93d933c25934" />


(4) Click **Save food**. The new food is added to the recipe's ingredient
table and becomes available in the food dropdown or cancel to stop making a new food.
<img width="2542" height="1271" alt="image" src="https://github.com/user-attachments/assets/ee59a7b3-7ffb-497e-bbaa-b0bccebe66d0" />

#### Delete a Recipe

You can delete any recipe you own. The trash icon (**🗑**) only appears on
recipe cards you are allowed to delete.

(1) On the **Recipes** page, find the recipe you want to delete.

(2) Click the **🗑** icon in the top-right of the recipe card.

> <img width="1920" height="1080" alt="ss_2026-04-28_17-08-58" src="https://github.com/user-attachments/assets/f9ae0b2c-8e17-4ae8-97bf-c8576028f696" />
>
> *Figure 15 — Trash icon on a recipe card.*

(3) A confirmation dialog appears asking *"Are you sure you want to delete
this recipe?"* Click **OK** to confirm or **Cancel** to back out. Note: This
confirmation dialog may appear differntly depending on browser choice.
<img width="1920" height="1080" alt="ss_2026-04-28_17-08-58" src="https://github.com/user-attachments/assets/5a1c95b9-2730-4d55-b87a-d986f4576524" />

(4) After confirmation, the recipe disappears from the grid.

#### Report a Recipe

If you see a public recipe that you believe vilotaes reasonable decentcy, you can report
it for an admin to review.

(1) On a public recipe card (badge shows **Global**), click the **🚩** icon
in the top-right. The flag icon does not appear on personal recipes.

> <img width="1920" height="1080" alt="ss_2026-04-28_17-08-58" src="https://github.com/user-attachments/assets/9c5bec01-9d7f-44b5-8da3-da2815e9b739" />
>
> *Figure 16 — Flag icon on a public recipe card.*

(2) A confirmation dialog appears asking *"Are you sure you want to report
this recipe?"* Click **OK** to continue.
<img width="1920" height="1080" alt="ss_2026-04-28_17-13-14" src="https://github.com/user-attachments/assets/f0c3b9ef-2885-4782-aa84-ecbf5cc05c1e" />

(3) When prompted, enter a short **name** for the report and click **OK**.
<img width="1920" height="1080" alt="ss_2026-04-28_17-14-41" src="https://github.com/user-attachments/assets/42f932c7-8fee-44e8-bac1-551ac64aded5" />

(4) When prompted, enter a **description** explaining why you are reporting
the recipe and click **OK**.

(5) An alert confirms the report was filed: *"Recipe reported successfully."*
An admin will review it from the Admin Dashboard.

If you cancel either prompt, the report is not submitted.

### Workouts

The Workouts page (URL: `/workouts`) works the same way as Recipes.

#### Browse Workouts

(1) Click **Workouts** in the top navigation bar.
<img width="2559" height="1276" alt="image" src="https://github.com/user-attachments/assets/85ff68c5-36c7-4877-a69e-bc8d1e544d0c" />

(2) Use the **search box** to filter workouts by name or instructions.
<img width="2541" height="1279" alt="image" src="https://github.com/user-attachments/assets/a1df43f9-d5b4-45d0-985c-8673ffe7756f" />

Each workout card displays the workout name, the instructions (if provided),
and a **Public** or **Private** badge.
<img width="2545" height="1273" alt="image" src="https://github.com/user-attachments/assets/b99cc53a-b97e-4cf3-a122-932d4eec7eea" />

#### Create a Workout

You must be logged in to create a workout.

(1) Click **Create Workout +** at the top-left of the Workouts page. The
Create Workout modal opens.
<img width="2540" height="1272" alt="image" src="https://github.com/user-attachments/assets/1f6ec047-1cf2-4d3f-b037-e81e7d41f559" />
(2) Enter:

| Field         | Required | Notes                                       |
|---------------|----------|---------------------------------------------|
| Workout Name  | Yes      | For example, *Push Day*.                    |
| Instructions  | No       | The routine, sets, and reps.                |
<img width="2547" height="1275" alt="image" src="https://github.com/user-attachments/assets/d3a7d528-50ff-458f-b404-c2bb64905b9b" />

(3)  Switch between **Keep Private** and **Submit for Publishing** toggle
to mark if the workout is eligible for publishing or not.
<img width="2540" height="1276" alt="image" src="https://github.com/user-attachments/assets/4536f8d6-3190-416e-8282-8d4f9df0f651" />

(4) Click **Save Workout**. Click **Cancel** to close without saving.
<img width="2536" height="1275" alt="image" src="https://github.com/user-attachments/assets/007f58a5-7dab-4a87-ab2a-2ea59338413e" />

#### Delete a Workout

You can delete any workout you own. The trash icon (**🗑**) only appears on
workout cards you are allowed to delete.

(1) On the **Workouts** page, find the workout you want to delete.
<img width="2542" height="1278" alt="image" src="https://github.com/user-attachments/assets/d7baf76a-38cf-4584-a887-4a7f33904045" />

(2) Click the **🗑** icon in the top-right of the workout card.
<img width="2540" height="1270" alt="image" src="https://github.com/user-attachments/assets/0901eda9-10ce-4e0e-8af0-58cbd591743f" />

(3) A confirmation dialog appears asking *"Are you sure you want to delete
this workout?"* Click **OK** to confirm or **Cancel** to back out.
<img width="2543" height="1347" alt="image" src="https://github.com/user-attachments/assets/1c62b37e-66a0-4496-8960-06614c194c65" />

(4) After confirmation, the workout disappears from the grid.
<img width="2543" height="1275" alt="image" src="https://github.com/user-attachments/assets/1ff0a2d5-0c9b-4871-91e5-bc6444f78d56" />

#### Report a Workout

If you see a public workout that violates community standards, you can
report it for an admin to review.

(1) On a public workout card (badge shows **Public**), click the **🚩** icon
in the top-right. The flag icon does not appear on private workouts.
<img width="2546" height="1275" alt="image" src="https://github.com/user-attachments/assets/fa3d8d21-88ae-4063-be83-f07e1ebc39dd" />

(2) A confirmation dialog appears asking *"Are you sure you want to report
this workout?"* Click **OK** to continue.
<img width="2539" height="1348" alt="image" src="https://github.com/user-attachments/assets/dc680734-7fb6-427f-b1b4-d24f50ea20fe" />

(3) When prompted, enter a short **name** for the report and click **OK**.
<img width="2542" height="1350" alt="image" src="https://github.com/user-attachments/assets/657b41ac-b40a-46da-b0e0-766cfe328d46" />

(4) When prompted, enter a **description** explaining why you are reporting
the workout and click **OK**.
<img width="2538" height="1344" alt="image" src="https://github.com/user-attachments/assets/4a862dfa-7256-4f15-a161-a623b4c996e4" />

(5) An alert confirms the report was filed: *"Workout reported successfully."*
An admin will review it from the Admin Dashboard.
<img width="2541" height="1345" alt="image" src="https://github.com/user-attachments/assets/f56a1adc-f999-4ca5-83d8-1a45900ed453" />

If you cancel either prompt, the report is not submitted.

### Nutritionist Dashboard

The Nutritionist Dashboard (URL: `/chef`) is shown only to users with the
**Chef** account type and to Admins. A **Chef** link appears in the top
navigation bar when you are signed in with one of these roles.

<img width="2552" height="1277" alt="image" src="https://github.com/user-attachments/assets/96dca57e-058b-44d7-9846-c91b558efdfd" />


The page lists every recipe a user has flagged as **publishable** during
recipe creation (see [Create a Recipe](#create-a-recipe), step 4). The header
shows a counter — for example, *"3 recipe(s) awaiting review."* Each card
displays the recipe name, description, instructions, ingredient list, and
owner.

To review a recipe:

(1) Read the recipe details on the card.<img width="2541" height="1275" alt="image" src="https://github.com/user-attachments/assets/7cdfad6d-a4f3-4faf-a42a-d6988de38375" />

(2) Click **Approve & Publish** to publish the recipe to all users, or
**Reject** to remove it from the review list.
<img width="2541" height="1273" alt="image" src="https://github.com/user-attachments/assets/c023dde7-920d-4f89-b08b-68919e3a2dc7" />

(3) A confirmation dialog appears. Click **OK** to confirm or **Cancel** to
back out.
<img width="2543" height="1350" alt="image" src="https://github.com/user-attachments/assets/1284a495-cdc3-4ea2-a379-e3134d11286a" />

(4) On success, the card disappears from the list. On failure, an alert
message describes the error.
<img width="2543" height="1273" alt="image" src="https://github.com/user-attachments/assets/01f8abb2-d45c-40ba-940c-aa49dd9940fe" />

When the queue is empty, the page shows *"No recipes to review — All caught
up!"*
<img width="2545" height="1277" alt="image" src="https://github.com/user-attachments/assets/4236b2a5-43fb-47ff-92f6-44186f63496c" />

### Gym Instructor Dashboard

The Gym Instructor Dashboard (URL: `/fit`) is shown only to users with the
**Trainer** account type and to Admins. A **Fitness** link appears in the
top navigation bar when you are signed in with one of these roles.

<img width="2555" height="1275" alt="image" src="https://github.com/user-attachments/assets/90e2607a-14d7-4e7e-98fc-de2c448f045b" />

The page lists every workout a user has flagged as **publishable** during
workout creation (see [Create a Workout](#create-a-workout), step 3). The
header shows a counter — for example, *"2 workout(s) awaiting review."*
Each card displays the workout name, instructions, and owner.

To review a workout:

(1) Read the workout details on the card.
<img width="2545" height="1279" alt="image" src="https://github.com/user-attachments/assets/e6357e85-cfb7-4ea3-ac56-4be8143ae94f" />

(2) Click **Approve & Publish** to publish the workout to all users, or
**Reject** to remove it from the review list.
<img width="2541" height="1281" alt="image" src="https://github.com/user-attachments/assets/d49e0e56-f236-41a7-8786-968ec19b2c81" />

(3) A confirmation dialog appears. Click **OK** to confirm or **Cancel** to
back out.
<img width="2538" height="1357" alt="image" src="https://github.com/user-attachments/assets/4544a000-4199-4d03-8549-381114d89bb7" />

(4) On success, the card disappears from the list. On failure, an alert
message describes the error.

<img width="2550" height="1282" alt="image" src="https://github.com/user-attachments/assets/596a3309-b53d-4b16-b2e9-d6da2502209c" />

When the queue is empty, the page shows *"No workouts to review — All caught
up!"*

<img width="2544" height="1280" alt="image" src="https://github.com/user-attachments/assets/fadc6df6-a072-452e-a8e6-01b3fca00757" />

### Admin Dashboard

The Admin Dashboard (URL: `/admin`) is shown only to users with the **Admin**
account type. An **Admin** link appears in the top navigation bar. Admins
also see the **Chef** and **Fitness** links and can use those dashboards.

<img width="2560" height="1275" alt="image" src="https://github.com/user-attachments/assets/1c8cdd33-a2c1-43cf-b055-d1846329a55b" />

The page has two tabs at the top: **User Management** and **Reports**. The
Reports tab label includes the current count — for example, *"Reports (5)."*

<img width="2543" height="1279" alt="image" src="https://github.com/user-attachments/assets/61bee8f0-2149-4787-bd2f-73e974848e2e" />

#### Manage Users

(1) Click the **User Management** tab.

<img width="2544" height="1276" alt="image" src="https://github.com/user-attachments/assets/38bb61ee-3cd8-4a57-8e92-3dc8c960a117" />

(2) Use the **search box** to filter users by ID, username, or email.

<img width="2539" height="1275" alt="image" src="https://github.com/user-attachments/assets/3a61eef8-3793-4985-b577-2eabac282aa8" />

(3) Each user card displays the role badge, user ID, and email
address.

<img width="2541" height="1276" alt="image" src="https://github.com/user-attachments/assets/de7ab503-1e0a-43b9-9534-ce485a324f0f" />

(4) To change a user's role, choose a new value from the **Change Type**
dropdown (Standard, Chef, or Trainer). A confirmation dialog appears before
the change is saved.

<img width="2539" height="1276" alt="image" src="https://github.com/user-attachments/assets/f0b060b7-41af-4db3-a619-7920fd61c728" />

<img width="2538" height="1348" alt="image" src="https://github.com/user-attachments/assets/f85a7b7e-73e8-4538-891d-19bdfeb4f3c5" />

(5) To remove a user, click **Delete User**. A confirmation dialog appears.
**This action cannot be undone.**

<img width="2539" height="1276" alt="image" src="https://github.com/user-attachments/assets/5862361b-21e4-48d4-b8dc-591569ae6fd1" />

<img width="2541" height="1347" alt="image" src="https://github.com/user-attachments/assets/14bd9037-c801-4720-8a94-b8dd2a0ae77b" />

Admin accounts have no actions on their cards — Admins cannot be demoted or
deleted from this dashboard.

<img width="2543" height="1275" alt="image" src="https://github.com/user-attachments/assets/de218c2a-1463-444a-bc0c-dddbc07d4941" />

#### Review Reports

(1) Click the **Reports** tab.

<img width="2543" height="1276" alt="image" src="https://github.com/user-attachments/assets/02a56dee-81b3-4fad-aa69-87a94fbec169" />

(2) Each report card shows:
  - The report title and the type of content reported (Recipe, Workout, or
    Food).
  - The report description.
  - The username of the reporter.
  - Details of the reported item, including its name and owner.

<img width="2541" height="1264" alt="image" src="https://github.com/user-attachments/assets/5a54b7fd-c726-407b-ac04-de7f4b832e78" />

(3) To dismiss a report without removing the reported content, click
**Delete Report**.

<img width="2544" height="1276" alt="image" src="https://github.com/user-attachments/assets/7cba87f8-2123-4659-8ad4-10bb5d03cccd" />

(4) To remove the reported content itself, click **Delete Recipe** or
**Delete Workout**. The matching button is shown automatically based on the
report type.

<img width="2540" height="1269" alt="image" src="https://github.com/user-attachments/assets/e031e403-b743-4fb2-8bc1-3eb50a40290f" />

(5) A confirmation dialog appears for every action.

<img width="2544" height="1350" alt="image" src="https://github.com/user-attachments/assets/ac005de7-a805-4c6c-94d9-2ba727c38d5b" />


When there are no reports, the page shows *"No reports found."*

<img width="2541" height="1273" alt="image" src="https://github.com/user-attachments/assets/7b533bf5-dad9-4b90-8a85-70f8b2674dea" />

### Account Roles

NutriFlow has four account roles. Your role determines which features and
navigation links are available to you.

| Role                       | In-app label | Capabilities                                                                                                                      |
|----------------------------|--------------|-----------------------------------------------------------------------------------------------------------------------------------|
| Standard User              | Standard     | Create personal recipes and workouts. Browse public content. Report content.                                                      |
| Nutritionist               | Chef         | Everything a Standard User can do, plus mark recipes as publishable and approve or reject recipes from the Nutritionist Dashboard. |
| Gym Instructor             | Trainer      | Everything a Standard User can do, plus mark workouts as publishable and approve or reject workouts from the Gym Instructor Dashboard. |
| Admin                      | Admin        | All capabilities above, plus access to the Admin Dashboard for user management and report review.                                 |

New accounts are created as Standard users. Only an Admin can change a user's
role from the Admin Dashboard.
