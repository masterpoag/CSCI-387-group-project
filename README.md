# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
=======
Meal Planner

To do

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
