# Smart Attendance Deployment Guide

This project consists of three services:
1. **Frontend**: Next.js (Deploy on Vercel)
2. **Backend**: Express/Node.js (Deploy on Render)
3. **ML Service**: FastAPI/Python (Deploy on Render)

## 1. Deploy ML Service (Option A: Render / Option B: Hugging Face Spaces)

### Option A: Render
- **Environment**: Python
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python main.py`
- **Plan**: Starter (at least 2GB RAM recommended)

### Option B: Hugging Face Spaces (Docker - Recommended)
1. Create a new Space on [Hugging Face](https://huggingface.co/new-space).
2. Choose **Docker** as the SDK.
3. Choose the **Blank** template.
4. Upload everything inside the `ml_service` folder (including the `Dockerfile`).
5. Choose **Apache 2.0** as the License.
6. Your Space will build and serve on port 7860 automatically.
7. Your API URL will be: `https://<your-username>-<space-name>.hf.space`

---

## 2. Deploy Backend (Render)
- **Environment**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Env Vars**:
  - `PORT`: 5001
  - `MONGODB_URI`: Your MongoDB Connection String
  - `JWT_SECRET`: A random secure string
  - `ML_SERVICE_URL`: URL of your deployed ML Service (e.g., `https://ml-service.onrender.com`)
  - `FRONTEND_URL`: URL of your deployed Frontend (e.g., `https://your-app.vercel.app`)

## 3. Deploy Frontend (Vercel)
- **Framework**: Next.js
- **Env Vars**:
  - `NEXT_PUBLIC_API_URL`: URL of your deployed Backend + `/api` (e.g., `https://backend-service.onrender.com/api`)

## Important Hosting Notes:
- **Cold Starts**: On Render Free tier, the ML service might take 30-60s to wake up. This will cause the first attendance scan to time out.
- **SSL**: The system handles SSL verification internally for model downloads.
- **Memory**: If the ML service crashes, upgrade to a higher RAM plan on Render. InsightFace loads large models into memory.
