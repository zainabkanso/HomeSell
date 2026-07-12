# Home Selling Platform

A beginner-friendly full-stack real estate app built with Node.js, Express, MongoDB, Mongoose, Bootstrap, and vanilla JavaScript.

## Project Structure

- `backend/` - API server, auth, homes, favorites, uploads
- `frontend/` - static pages, styles, client-side JavaScript
- `README.md` - setup and usage

## Backend Setup

1. Open a terminal in `backend/`
2. Install packages:
   ```bash
   npm install
   ```
3. Create a `.env` file in `backend/`:
   ```bash
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/home-selling
   JWT_SECRET=your_jwt_secret
   AI_SERVICE_URL=http://127.0.0.1:5001
   FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
   ```
   Or set `FIREBASE_SERVICE_ACCOUNT` to the full JSON service account string instead of `GOOGLE_APPLICATION_CREDENTIALS`.
4. In Firebase Console, enable **Storage** and download a service account key from **Project settings > Service accounts**.
5. Start the backend server:
   ```bash
   npm run dev
   ```

## Frontend Access

With the backend running, open:

- `http://localhost:5000/index.html`
- `http://localhost:5000/login.html`
- `http://localhost:5000/register.html`
- `http://localhost:5000/homes.html`
- `http://localhost:5000/home-details.html?id=<homeId>`
- `http://localhost:5000/favorites.html`
- `http://localhost:5000/add-home.html`
- `http://localhost:5000/admin-dashboard.html`

## Features

- User registration and login with JWT authentication
- Password hashing with bcrypt
- Home listing CRUD with image uploads via Firebase Storage
- Favorite homes for signed-in users
- Responsive Bootstrap frontend
- Clean MVC backend structure

## Notes

- The backend serves frontend files directly from `frontend/`.
- Uploaded property images and chat files are stored in Firebase Storage.
- Use the admin dashboard to manage listings.

## AI Service (House Price Prediction)

1. Open a terminal in `AI/`
2. Install packages:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the Flask service locally:
   ```bash
   python app.py
   ```
4. Verify health check:
   ```text
   http://127.0.0.1:5001/health
   ```

### Render deployment

Create a **Web Service** with:

- **Root Directory:** `AI`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `gunicorn app:app`

Ensure these files are committed to GitHub:

- `AI/app.py`
- `AI/requirements.txt`
- `AI/random_forest_model.pkl`
- `AI/label_encoders.pkl`
- `AI/x_columns.pkl`

In the Node backend Render environment, set:

```text
AI_SERVICE_URL=https://YOUR-AI-SERVICE.onrender.com
```
