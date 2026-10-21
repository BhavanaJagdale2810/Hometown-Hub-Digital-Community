# Hometown Hub – Digital Community Platform

A full-stack community platform that connects people within their hometowns and helps them share updates, discover communities, participate in events, and stay connected.

## 📌 Project Overview

Hometown Hub is a web-based community platform developed as part of an internship project. It provides a common space for users to create posts, interact with other community members, manage their profiles, explore communities, and participate in local events.

## ✨ Features

- **User Authentication:** Secure registration and login.
- **User Profiles:** View and manage profile information and profile photos.
- **Community Posts:** Create, view, edit, and delete posts.
- **Likes and Comments:** Interact with posts shared by community members.
- **Search:** Find relevant posts and content.
- **Communities:** Explore and participate in communities.
- **Events:** View upcoming and past events, join or leave events, and manage event participation.
- **Notifications:** Receive and manage notifications.
- **Admin Dashboard:** Administrative access for managing platform activities.
- **Responsive Interface:** Access the platform through a modern web interface.

## 🛠️ Technology Stack

### Frontend
- React.js
- Vite
- JavaScript
- HTML5
- CSS3

### Backend
- Node.js
- Express.js
- REST API

### Database
- MongoDB
- Mongoose

### Authentication and Security
- JSON Web Tokens (JWT)
- bcrypt password hashing
- Environment variables for sensitive configuration

### Deployment
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

## 🌐 Live Demo

**Frontend:** https://hometown-hub-digital-community.vercel.app/

## 📂 Project Structure

```text
Hometown-Hub-Digital-Community/
├── backend/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── uploads/
│   ├── server.js
│   └── package.json
├── src/
│   ├── components/
│   ├── pages/
│   └── ...
├── public/
├── package.json
└── README.md
```

*Note: The project structure above is representative. Verify folder and file names against the actual repository.*

## ⚙️ Getting Started

### Prerequisites

Install the following before running the project:

- Node.js and npm
- MongoDB database or a MongoDB Atlas connection

### 1. Clone the Repository

```bash
git clone https://github.com/BhavanaJagdale2810/Hometown-Hub-Digital-Community.git
cd Hometown-Hub-Digital-Community
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Configure the Backend

Open the backend directory:

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory and configure the environment variables required by the application. Refer to the backend configuration and server code for the exact variable names.

**Security:** Never commit `.env` files, database credentials, JWT secrets, email credentials, or other sensitive information to GitHub.

### 4. Start the Backend

From the `backend` directory, run:

```bash
npm start
```

### 5. Start the Frontend

Open a separate terminal in the project root and run:

```bash
npm run dev
```

Vite will display the local development URL in the terminal.

## 🔐 Security

- Passwords are hashed before storage.
- Authentication uses JWT.
- Sensitive configuration is managed through environment variables.
- Uploaded images are subject to file type and size restrictions.

## 🎯 Project Objectives

- Build a full-stack web application.
- Implement authentication and REST APIs.
- Integrate MongoDB with a Node.js backend.
- Provide community interaction and event management features.
- Practice software development, testing, and deployment.

## 👩‍💻 Internship Project

**Project Name:** Hometown Hub – Digital Community Platform  
**Project Type:** Full-Stack Web Development  
**Purpose:** Community engagement and local connectivity

## 📄 License

This project was developed for internship and learning purposes. Add a formal license if you intend to distribute the project under specific reuse terms.

This project was developed for internship and learning purposes. Add a formal license if you intend to distribute the project under specific reuse terms.
