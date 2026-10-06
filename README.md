# AI BlogNest - Backend

AI-powered blog CMS API: Node.js + Express + MongoDB (Mongoose) + JWT + Google Gemini.

## Setup
```bash
cd server
npm install
# edit .env  (MONGO_URI, JWT_SECRET, GEMINI_API_KEY)
node utils/seedAdmin.js     # optional: creates admin@blognest.com / Admin@123
npm start                   # or: npm run dev
```

## Roles
| Role | Can do |
|---|---|
| reader | read published posts, like, comment |
| author | + create/edit/delete own posts, AI generate/summarize, own analytics |
| editor | + review queue, change post status, moderate comments, edit any post |
| admin | + manage users/roles, delete anything |

## Endpoints
**Auth**: `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me`

**Posts**
- `GET /api/posts?q=&tag=&category=&page=&limit=` (public)
- `GET /api/posts/:id` · `POST /api/posts` · `PUT /api/posts/:id` · `DELETE /api/posts/:id`
- `PUT /api/posts/:id/status` `{status, scheduledAt?}` (editor/admin)
- `GET /api/posts/queue/pending` (editor/admin) · `GET /api/posts/mine/list` · `GET /api/posts/mine/stats`
- `POST /api/posts/:id/like`

**Comments**
- `GET|POST /api/posts/:postId/comments`
- `GET /api/comments?status=pending` · `PUT /api/comments/:id/status` `{status: approved|pending|spam}` · `DELETE /api/comments/:id`

**Users (admin)**: `GET /api/users` · `PUT /api/users/:id/role` · `DELETE /api/users/:id`

**AI (author+)**
- `POST /api/ai/generate-blog` `{ "topic": "...", "tone": "friendly", "length": "medium", "keywords": ["a","b"], "save": true }`
- `POST /api/ai/summarize` `{ "text": "..." }` or `{ "postId": "..." }`

All protected routes need `Authorization: Bearer <token>`.

## Postman quick test
1. Register → copy `token`
2. Create blog: `POST /api/posts` `{"name":"Hello","message":"My first post body...","tags":"intro,news"}`
3. Admin/editor: `PUT /api/posts/:id/status` `{"status":"published"}`
4. Fetch: `GET /api/posts`
5. AI: `POST /api/ai/generate-blog` `{"topic":"Benefits of remote work","save":true}`
6. Summarize: `POST /api/ai/summarize` `{"postId":"<id>"}`

## Structure
```
server/
  server.js  app.js
  config/db.js
  models/        User, Post, Comment
  controllers/   auth, user, post, comment, ai
  routes/        auth, user, post, comment, ai
  middleware/    auth (JWT + role matrix), sanitize, error
  services/gemini.js
  utils/
```
