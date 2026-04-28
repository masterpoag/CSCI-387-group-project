#!/usr/bin/env python3

import requests
import argparse
import json
import random
import sys
from faker import Faker

fake = Faker()

DEFAULT_API_BASE = "https://gp.vroey.us"

# ================= FOOD DATABASE =================

FOODS = [
    {"fname": "Eggs", "cal": 72, "base_measurement": 0},
    {"fname": "Chicken Breast", "cal": 165, "base_measurement": 0},
    {"fname": "Rice", "cal": 206, "base_measurement": 2},
    {"fname": "Bread", "cal": 79, "base_measurement": 2},
    {"fname": "Butter", "cal": 102, "base_measurement": 3},
    {"fname": "Milk", "cal": 103, "base_measurement": 1},
    {"fname": "Cheddar Cheese", "cal": 113, "base_measurement": 2},
    {"fname": "Tomato", "cal": 22, "base_measurement": 2},
    {"fname": "Lettuce", "cal": 5, "base_measurement": 2},
    {"fname": "Olive Oil", "cal": 119, "base_measurement": 3},
    {"fname": "Pasta", "cal": 221, "base_measurement": 2},
    {"fname": "Ground Beef", "cal": 250, "base_measurement": 0},
    {"fname": "Onion", "cal": 44, "base_measurement": 2},
    {"fname": "Garlic", "cal": 4, "base_measurement": 2},
    {"fname": "Black Pepper", "cal": 0, "base_measurement": 3},
    {"fname": "Salt", "cal": 0, "base_measurement": 3},
    {"fname": "Potato", "cal": 161, "base_measurement": 0},
    {"fname": "Bacon", "cal": 43, "base_measurement": 0},
    {"fname": "Spinach", "cal": 7, "base_measurement": 2},
]

ADJECTIVES = [
    "Spicy",
    "Creamy",
    "Savory",
    "Crispy",
    "Smoky",
    "Sweet",
    "Tangy",
    "Classic",
    "Loaded",
    "Ultimate",
]

MEAL_TYPES = [
    "Pasta",
    "Skillet",
    "Salad",
    "Sandwich",
    "Bowl",
    "Breakfast",
    "Dinner",
    "Wrap",
    "Soup",
    "Stir Fry",
]

# ================= GENERATORS =================

def generate_foods():
    food_count = random.randint(3, 7)
    chosen = random.sample(FOODS, food_count)

    foods = []

    for food in chosen:
        foods.append({
            "fname": food["fname"],
            "qty": round(random.uniform(0.5, 4.0), 1),
            "isNew": False,
            "cal": food["cal"],
            "base_measurement": food["base_measurement"]
        })

    return foods

def generate_recipe():
    adjective = random.choice(ADJECTIVES)
    meal = random.choice(MEAL_TYPES)

    foods = generate_foods()

    recipe_name = f"{adjective} {meal}"

    instructions = []
    step_count = random.randint(4, 7)

    for i in range(step_count):
        instructions.append(
            f"{i+1}. {fake.sentence(nb_words=random.randint(6, 12))}"
        )

    return {
        "nr": {
            "rname": recipe_name,
            "desc": fake.sentence(nb_words=10),
            "instruct": " ".join(instructions),
            "isPublishable": random.choice([True, False])
        },
        "foods": foods
    }

def generate_workout():
    workout_types = [
        "Push Workout",
        "Leg Day",
        "HIIT Routine",
        "Core Training",
        "Cardio Blast",
        "Upper Body",
        "Yoga Flow",
        "Stretch Session",
    ]

    instructions = []

    for i in range(random.randint(4, 8)):
        instructions.append(
            f"{i+1}. {fake.sentence(nb_words=random.randint(8, 14))}"
        )

    return {
        "name": random.choice(workout_types),
        "instructions": " ".join(instructions),
        "isPublishable": random.choice([True, False])
    }

# ================= API FUNCTIONS =================

def create_recipe(token, username, api_base, recipe):
    url = f"{api_base}/api/create-recipe?huid={token}&uname={username}"

    payload = json.dumps(recipe)

    response = requests.post(
        url,
        headers={"Content-Type": "application/json"},
        data=payload
    )

    print("\nSTATUS:", response.status_code)
    print("RESPONSE:", response.text)

    if response.ok:
        print(f"✅ Created recipe: {recipe['nr']['rname']}")
        return True

    print(f"❌ Failed recipe: {recipe['nr']['rname']}")
    return False

def create_workout(token, username, api_base, workout):
    url = f"{api_base}/api/create-workout?huid={token}&uname={username}"

    payload = json.dumps(workout)

    response = requests.post(
        url,
        headers={"Content-Type": "application/json"},
        data=payload
    )

    print("\nSTATUS:", response.status_code)
    print("RESPONSE:", response.text)

    if response.ok:
        print(f"✅ Created workout: {workout['name']}")
        return True

    print(f"❌ Failed workout: {workout['name']}")
    return False

# ================= MAIN =================

def main():
    parser = argparse.ArgumentParser()

    parser.add_argument("--token", required=True)
    parser.add_argument("--username", required=True)

    parser.add_argument("--api-base", default=DEFAULT_API_BASE)

    parser.add_argument("--recipes", type=int, default=0)
    parser.add_argument("--workouts", type=int, default=0)

    args = parser.parse_args()

    if args.recipes == 0 and args.workouts == 0:
        print("Provide --recipes or --workouts")
        sys.exit(1)

    # Generate Recipes
    if args.recipes > 0:
        print("\n" + "=" * 50)
        print("GENERATING RECIPES")
        print("=" * 50)

        for _ in range(args.recipes):
            recipe = generate_recipe()
            create_recipe(
                args.token,
                args.username,
                args.api_base,
                recipe
            )

    # Generate Workouts
    if args.workouts > 0:
        print("\n" + "=" * 50)
        print("GENERATING WORKOUTS")
        print("=" * 50)

        for _ in range(args.workouts):
            workout = generate_workout()
            create_workout(
                args.token,
                args.username,
                args.api_base,
                workout
            )

if __name__ == "__main__":
    main()