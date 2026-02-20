MRN Backend
===========

Quick start:

1. Create a MongoDB Atlas cluster and a database user `gameadmin` (or your own name). Get the connection string.
2. Copy the connection string into `.env` as `MONGO_URL` (keep credentials secret).
3. Set a strong `JWT_SECRET` in `.env`.

Local run:

```bash
npm install
npm start
```

API endpoints (basic):

- `POST /register`  { username, password } -> { token }
- `POST /login`     { username, password } -> { token }
- `POST /match`     Auth: Bearer <token> -> store match result
- `POST /score/update` Auth: Bearer <token> { scoreDelta } -> update score server-side
- `GET /me`         Auth: Bearer <token> -> get basic profile

Notes:
- Do not trust client-reported scores. Recalculate or verify server-side.
- Add input validation and rate-limiting for production.
- For deployment use Render (or similar): add `MONGO_URL` and `JWT_SECRET` as environment variables.

Deployment on Render (summary):
- Create a GitHub repo with this folder and push.
- On Render, create a new Web Service connected to the repo.
- Environment: Node
- Build command: `npm install`
- Start command: `npm start`
- Add `MONGO_URL` and `JWT_SECRET` in Render dashboard.
