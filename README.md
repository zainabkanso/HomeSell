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
3. Create a `.env` file in `backend/` or use the provided one:
   ```bash
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/home-selling
   JWT_SECRET=your_jwt_secret
   ```
4. Start the backend server:
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
- Home listing CRUD with image uploads via multer
- Favorite homes for signed-in users
- Responsive Bootstrap frontend
- Clean MVC backend structure

## Notes

- The backend serves frontend files directly from `frontend/`.
- Uploaded property images are stored in `backend/uploads/`.
- Use the admin dashboard to manage listings.
