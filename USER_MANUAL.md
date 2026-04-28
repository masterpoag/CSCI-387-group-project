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
  - [Workouts](#workouts)
    - [Browse Workouts](#browse-workouts)
    - [Create a Workout](#create-a-workout)
  - [Account Roles](#account-roles)

---

## Introduction

NutriFlow is a web application that helps people plan meals and workouts in one
place. Users can register an account, build personal recipes from a shared food
library, save workout routines, and browse public content shared by chefs and
fitness instructors.

The production application is hosted at
**https://gp.vroey.us/~group3sp26/** with the API at **https://gp.vroey.us**.

This manual has two audiences:

- **System creators** who want to host their own copy of NutriFlow. See
  [Requirements and Instructions for System Creators](#requirements-and-instructions-for-system-creators).
- **NutriFlow users** who want to use the live application. See
  [Requirements for NutriFlow Users](#requirements-for-nutriflow-users).

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
**https://gp.vroey.us/~group3sp26/** in any modern browser to begin.

### Account Setup

#### Create an Account

(1) Click **Login** in the top navigation bar.
<img width="1920" height="1080" alt="ss_2026-04-28_13-01-19" src="https://github.com/user-attachments/assets/fb8270c9-42ae-42c9-ad69-bdac2422ab51" />


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

(2) Use the **search box** to filter recipes by name, description, or
instructions.

> ![Recipes page with search box, Create Recipe button, results counter, and a grid of recipe cards](docs/images/recipes-page.png)
>
> *Figure 5 — Recipes page. The counter under the search box shows how many
> recipes match the current search.*

Each recipe card displays:

- The recipe name.
- The description (if provided).
- The list of ingredients in the format `2.50 Cup of rice (200 cal)`.
- The instructions (if provided).
- A badge showing **Global** for public recipes or **Personal** for your own
  private recipes.

If no recipes match the search, the page shows the message *"No recipes
found — Try a different keyword."*

#### Create a Recipe

You must be logged in to create a recipe.

(1) Click **Create Recipe +** at the top-left of the Recipes page. The Create
New Recipe modal opens.

> ![Create New Recipe modal with Recipe Name, Description, Instructions, Unit dropdown, Food dropdown, and ingredient table](docs/images/create-recipe-modal.png)
>
> *Figure 6 — Create New Recipe modal. Required fields are marked with an
> asterisk.*

(2) Fill in the recipe details:

| Field         | Required | Notes                                       |
|---------------|----------|---------------------------------------------|
| Recipe Name   | Yes      | For example, *Chicken Stir Fry*.            |
| Description   | No       | A short summary of the recipe.              |
| Instructions  | No       | Step-by-step cooking directions.            |

(3) Add at least one ingredient:

  a. Choose a **Unit** from the dropdown (Pound, Ounce, Cup, or Teaspoon).

  b. Choose a **Food** from the searchable dropdown. If your food is not in
     the list, click **+ New food…** and follow [Add a New Food](#add-a-new-food).

  c. The food is added to the ingredient table. Edit its **Quantity** in the
     table. Click the **×** button to remove an ingredient.

> ![Ingredient table inside the Create Recipe modal showing two foods with quantity, calories, unit, and remove button](docs/images/recipe-ingredients.png)
>
> *Figure 7 — Ingredient table. Edit quantity directly in the row. Click ×
> to remove an ingredient.*

(4) **Chef and Admin accounts only:** check the **Public Recipe** box if you
want this recipe to be eligible for publishing.

(5) Click **Create Recipe**. The modal closes and the new recipe appears in
the grid. Click **Cancel** to close without saving.

If the recipe name is missing, the recipe has no ingredients, or you already
have a recipe with the same name, an error message appears at the top of the
modal.

#### Add a New Food

When the food you need is not already in the dropdown, you can create it
during recipe creation.

(1) In the Create Recipe modal, select a **Unit** first (the New Food option
is disabled until a unit is selected).

(2) Open the **Food** dropdown and click **+ New food…**.

> ![New Food modal with Food name field and Calories field labeled with the selected unit](docs/images/new-food-modal.png)
>
> *Figure 8 — New Food modal. The calorie label updates to match the unit you
> selected.*

(3) Enter the **Food name** and **Calories per 1 [unit]**.

(4) Click **Save food**. The new food is added to the recipe's ingredient
table and becomes available in the food dropdown.

### Workouts

The Workouts page (URL: `/workouts`) works the same way as Recipes.

#### Browse Workouts

(1) Click **Workouts** in the top navigation bar.

(2) Use the **search box** to filter workouts by name or instructions.

> ![Workouts page with search box, Create Workout button, and a grid of workout cards](docs/images/workouts-page.png)
>
> *Figure 9 — Workouts page.*

Each workout card displays the workout name, the instructions (if provided),
and a **Public** or **Private** badge.

#### Create a Workout

You must be logged in to create a workout.

(1) Click **Create Workout +** at the top-left of the Workouts page. The
Create Workout modal opens.

> ![Create Workout modal with Workout Name, Instructions, optional Public checkbox, and Save Workout button](docs/images/create-workout-modal.png)
>
> *Figure 10 — Create Workout modal.*

(2) Enter:

| Field         | Required | Notes                                       |
|---------------|----------|---------------------------------------------|
| Workout Name  | Yes      | For example, *Push Day*.                    |
| Instructions  | No       | The routine, sets, and reps.                |

(3) **Fitness Instructor and Admin accounts only:** check the **Public** box
to mark the workout as eligible for publishing.

(4) Click **Save Workout**. Click **Cancel** to close without saving.

### Account Roles

NutriFlow has four account roles. Your role determines which features you can
access.

| Role                | Capabilities                                                                       |
|---------------------|------------------------------------------------------------------------------------|
| Base User           | Create personal recipes and workouts. Browse public content. Report content.       |
| Chef                | Everything a Base User can do, plus mark recipes as publishable.                   |
| Fitness Instructor  | Everything a Base User can do, plus mark workouts as publishable.                  |
| Admin               | All capabilities, plus manage users, delete any content, and review all reports.   |

New accounts are created as Base Users. An Admin can promote you to Chef or
Fitness Instructor.
