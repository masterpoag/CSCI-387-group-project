# TODO
  - create Add food API
  - Create the Recipe creation
    - Has a text field for {Title} {Description}
    - Ingredients Add button to add a new ingredient
      - Has a Dropdown for {Food} if the food you want isnt there it allow you to create the new food.
      - Has a text box for floats for the amount of the food  



Create python api to connect to db(using something like .env for security)

Create standard homepage with basic global variables (basic css, vars like dark mode, db data.)

Setup database framework(user data, food, meals)

Have a way to add calories and nutrients from the day

## Backend Documentation
There is an interactive API at [https://gp-test.vroey.us/docs](https://gp-test.vroey.us).

**Creating a new user**:

This endpoint requires a POST request.

Here is an example POST request when registering a new user:
```
curl -X 'POST' \
  'http://gp-test.vroey.us/api/register?hasCG=true' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "uname": "colby@test.com",
  "upass": "password123!",
  "weight": 123.12,
  "atype": 1,
  "isMetric": false,
  "calGoal": 2500
}'
```

The data part (`-d`), is important here. You are building a `NewUser()` python object. It has the following fields.
<img width="375" height="215" alt="image" src="https://github.com/user-attachments/assets/4b4dfdd3-b218-44fd-8bbb-82f42e928937" />

Fields with a red astrix (`*`), are mandatory. Additionally the `hasCG` field (hasCalorieGoal) in the URL is also mandatory. 

`weight` needs to be a float. Note that only the first two decimals (`100.xx`) will be stored in the database.

If you set the `hasCG` value to true and don't provide a `calGoal`, you will recieve an error from the database.

*Data Response*: `null`

**Loggging in**

This endpoint requires a GET request.

Here is an example GET request.
```
curl -X 'GET' \
  'http://gp-test.vroey.us/api/login?uname=colby%40test.com&upass=password123%21' \
  -H 'accept: application/json'
```

Every field is mandatory.

This GET request returns:
```
{
  "Result": "Success",
  "Message": "colby@test.com successfully signed in",
  "Data": 93.98045859812781
}
```
The `Data` field contains the hashed uid to be stored in a cookie. 

**API Response**

The api will always respond with this json object at a minimum.

Here is an example from `/hello`:
```
{
  "Result": "Success",
  "Message": "Hi! Hallo! Bonjour!",
  "Data": null
}
```
Fields:
- Result: Always either `"Success", "Failed", or "Warning".
- Message: An english description of the result.
- Data: Default: `null`, otherwise has data specified by the api endpoint. 

**Getting all foods**

This endpoint requires a GET request.

Here is an example GET request:
```
curl -X 'GET' \
  'http://gp-test.vroey.us/api/get-foods' \
  -H 'accept: application/json'
```

No parameters are required.

*Data Response*: A list of all foods in the database. Each entry contains:
- `fid`: The food's unique ID.
- `name`: The food's name.
- `cal`: Calories per base measurement unit.
- `base_measure`: Index of the base measurement unit (0=Pound, 1=Ounce, 2=Cup, 3=Teaspoon).

Example response:
```json
{
  "Result": "Success",
  "Message": "Returning Foods",
  "Data": [
    {"fid": 1, "name": "chicken breast", "cal": 165, "base_measure": 0}
  ]
}
```

**Getting all public workouts**

This endpoint requires a GET request.

Here is an example GET request:
```
curl -X 'GET' \
  'http://gp-test.vroey.us/api/get-public-workout' \
  -H 'accept: application/json'
```

No parameters are required.

*Data Response*: A list of all public workouts. Each entry contains:
- `wid`: The workout's unique ID.
- `instructions`: The workout instructions.
- `cal`: Calories burned.
- `isPublic`: Always `true` for this endpoint.
- `owner`: The username of the user who created the workout.

Example response:
```json
{
  "Result": "Success",
  "Message": "Returning all public workouts",
  "Data": [
    {
      "wid": 1,
      "instructions": "3 sets of 10 push-ups",
      "cal": 50,
      "isPublic": true,
      "owner": "colby@test.com"
    }
  ]
}
```

**Getting a user's workouts**

This endpoint requires a POST request. The user must be logged in.

Here is an example POST request:
```
curl -X 'POST' \
  'http://gp-test.vroey.us/api/get-user-workout?huid=93.98045859812781&uname=colby%40test.com' \
  -H 'accept: application/json'
```

URL parameters:
- `huid` (required): The hashed UID returned from `/api/login`.
- `uname` (required): The username of the logged-in user.

*Data Response*: A list of all workouts belonging to the authenticated user. Each entry contains:
- `wid`: The workout's unique ID.
- `instructions`: The workout instructions.
- `cal`: Calories burned.
- `isPublic`: Whether the workout is public.

Example response:
```json
{
  "Result": "Success",
  "Message": "Returning workouts for colby@test.com",
  "Data": [
    {
      "wid": 1,
      "instructions": "3 sets of 10 push-ups",
      "cal": 50,
      "isPublic": true
    }
  ]
}
```
