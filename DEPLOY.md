# Deployment Guide — BDA Management System Pro

Repo: https://github.com/sai23514/BDA-Management-System-Pro

| Piece | Host | Why |
| --- | --- | --- |
| Database | MongoDB Atlas (free) | Cloud MongoDB |
| Backend + chat | Render (free) | Persistent Node for Socket.io |
| Frontend | Vercel (free) | Vite React static app |

> Do **not** host the API on Vercel serverless — Messages/chat need a long-running server.

---

## 1. MongoDB Atlas

1. Open https://cloud.mongodb.com and sign up / log in.
2. **Build a Database** → Free **M0** → choose a region → Create.
3. **Database Access** → Add new database user → password auth → save username + password.
4. **Network Access** → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`).
5. **Database** → Connect → Drivers → copy the URI:

```text
mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/bda-module?retryWrites=true&w=majority
```

Replace `USER` / `PASSWORD` (URL-encode special characters in the password).

---

## 2. Backend on Render

1. Open https://dashboard.render.com → sign in with GitHub.
2. **New** → **Blueprint** → select `sai23514/BDA-Management-System-Pro`  
   *(uses `render.yaml`)*  
   **OR** **New** → **Web Service** → same repo with:

| Setting | Value |
| --- | --- |
| Root Directory | `server` |
| Runtime | Node |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Instance | Free |

3. Environment variables:

| Key | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | your Atlas URI |
| `JWT_SECRET` | long random string |
| `JWT_REFRESH_SECRET` | another long random string |
| `JWT_EXPIRE` | `15m` |
| `JWT_REFRESH_EXPIRE` | `7d` |
| `CLIENT_URL` | your Vercel URL (set after step 3; e.g. `https://xxx.vercel.app`) |
| `RATE_LIMIT_WINDOW_MS` | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | `100` |

4. Deploy → wait until **Live**.
5. Copy the service URL, e.g. `https://bda-management-api.onrender.com`.
6. Open `https://YOUR-API.onrender.com/api/v1/health` — should return JSON success.

### Seed demo users (once)

From your PC (with Atlas URI in `server/.env`):

```powershell
cd server
# set MONGODB_URI in .env to the Atlas URI
npm run seed
```

Demo logins after seed: `admin@bda.com` / `admin123`, `emily@bda.com` / `emily123`, etc.

---

## 3. Frontend on Vercel

1. Open https://vercel.com → Import `sai23514/BDA-Management-System-Pro`.
2. Configure:

| Setting | Value |
| --- | --- |
| Framework Preset | Vite |
| Root Directory | `client` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

3. Environment variable:

| Key | Value |
| --- | --- |
| `VITE_API_BASE_URL` | `https://YOUR-API.onrender.com/api/v1` |

4. Deploy → copy the frontend URL.
5. Go back to **Render** → set `CLIENT_URL` to that Vercel URL → **Manual Deploy** → Redeploy.

---

## 4. Verify

1. Open the Vercel site.
2. Log in with `admin@bda.com` / `admin123`.
3. Check Dashboard, Leads, Pipeline, Messages.

**Note:** Render free tier sleeps after ~15 minutes idle. The first request after sleep can take 30–60 seconds.

---

## 5. Optional features

Set on Render only if you want them:

- Email: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`
- AI: `OPENAI_API_KEY`, `OPENAI_MODEL`
- WhatsApp/SMS: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_SMS_FROM`, `TWILIO_WHATSAPP_FROM`
