# OPDFlow-AI / DevFusion 4.0 — Production Deployment Guide

This guide details the step-by-step instructions to take the application from local development to production readiness for the hackathon.

---

## 1. Architecture Overview

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS deployed on **Vercel**.
- **Backend**: Express + TypeScript + Prisma 5 deployed on **Render** (or any Node.js host).
- **Database**: Managed **PostgreSQL** (Neon, Supabase, or Render PostgreSQL).
- **Authentication**: JWT-based session tokens with HTTP-only cookies and Bearer token authorization header fallback.

---

## 2. Step 1: Provision Managed PostgreSQL

A managed cloud PostgreSQL instance is required. **Neon** or **Supabase** are recommended for free, fast serverless setup.

### Option A: Supabase (Recommended for OPDFlow-AI)
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and click **New Project**.
2. Set Name: `opdflow-db` and create a strong database password (keep this password handy).
3. Once the project finishes provisioning (~1 minute), go to **Project Settings** (gear icon) > **Database**.
4. Scroll down to **Connection String** > select **URI**:
   - Choose **Session mode (Port 5432)**:
     ```
     postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require
     ```
   - Alternatively, choose **Direct Connection (Port 5432)**.
   - Replace `[YOUR-PASSWORD]` with your actual database password.
   - Ensure `?sslmode=require` is present at the end of the connection string.
   *(Note: Using Port 5432 allows both runtime queries and `npx prisma db push` schema creation to execute seamlessly).*

### Option B: Neon
1. Go to [https://neon.tech](https://neon.tech) and create a project named `devfusion`.
2. Copy the connection string ending with `?sslmode=require`.

---

## 3. Step 2: Initialize Remote Database Schema

Once you have your Supabase `DATABASE_URL`:

1. In your local terminal, navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Run Prisma schema push to create all tables safely on Supabase:
   ```bash
   # On Windows PowerShell:
   $env:DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require"
   npx prisma db push
   ```
   *(This creates all 20+ hospital management tables defined in schema.prisma without dropping any data).*
3. (Optional) Seed demo accounts and department catalogs:
   ```bash
   npm run db:seed
   ```

---

## 4. Step 3: Deploy Backend to Render

1. Go to [https://dashboard.render.com](https://dashboard.render.com).
2. Click **New + > Web Service**.
3. Connect your GitHub repository (`OPDFlow-AI-main`).
4. Configure the Web Service settings:
   - **Name**: `devfusion-backend` (or `opdflow-backend`)
   - **Region**: Choose the region closest to your Supabase database (e.g., Ohio or Frankfurt)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: Free

5. Add **Environment Variables** in Render Dashboard:
   | Variable | Value | Description |
   |---|---|---|
   | `NODE_ENV` | `production` | Enables production optimizations and security rules |
   | `PORT` | `10000` | Render assigns this automatically |
   | `DATABASE_URL` | `postgresql://postgres.[REF]:[PASS]...@...:5432/postgres?sslmode=require` | Your Supabase connection string |
   | `JWT_SECRET` | *(generate 32+ char random string)* | Production secret for signing session JWTs |
   | `FRONTEND_URL` | `https://smart-med-ai-beryl.vercel.app` | Your active deployed Vercel frontend URL |
   | `BACKEND_URL` | `https://<your-render-service>.onrender.com` | Your public Render backend URL (available after creation) |


6. Click **Deploy Web Service**.
7. In **Settings > Health Check Path**, set `/health`.

---

## 5. Step 4: Configure Frontend on Vercel

1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard) and select your existing `OPDFlow-AI` project.
2. Under **Settings > General**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Under **Settings > Environment Variables**, add:
   | Variable | Value | Description |
   |---|---|---|
   | `VITE_API_BASE_URL` | `https://<your-backend>.onrender.com/api/v1` | Points frontend to hosted backend |
4. Redeploy the project (**Deployments > Redeploy**).

The repository includes `vercel.json` configured with client-side SPA routing rewrites:
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 6. Step 5: Post-Deployment Verification

Verify all endpoints once services are live:

1. **Backend Liveness**:
   ```bash
   curl -i https://<your-backend>.onrender.com/health
   # Expected response: {"status":"ok","service":"devfusion-backend", ...}
   ```
2. **Backend Database Connectivity**:
   ```bash
   curl -i https://<your-backend>.onrender.com/health?db=true
   # Expected response: {"status":"ok","database":"connected", ...}
   ```
3. **CORS Validation**:
   ```bash
   curl -H "Origin: https://<your-frontend>.vercel.app" \
        -H "Access-Control-Request-Method: GET" \
        -X OPTIONS -i https://<your-backend>.onrender.com/api/v1/health
   # Expected response: HTTP 204 or 200 with Access-Control-Allow-Origin header
   ```
4. **Deep-Link Refresh on Vercel**:
   Open `https://<your-frontend>.vercel.app/login` in your browser and reload the page. Confirm it does not show a 404 error.

---

## 7. Working with Ongoing Authentication Work

- The backend login system includes 3-attempt account lockout security (`authRouter.post("/login")`).
- Tokens are issued both as HTTP-only cookies and in the JSON response payload (`{ token, user }`).
- Client API calls can authenticate using either cookies or `Authorization: Bearer <token>`.
- Incoming changes from teammates on `origin/main` can be safely pulled with:
  ```bash
  git pull origin main
  ```
  *(Local changes made in this readiness pass do not conflict with the incoming commit).*
