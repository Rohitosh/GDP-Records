
# GDP Records Management System

A Node.js + Express + MongoDB CRUD application to manage GDP data for countries across different years.
This project allows developers to create, read, update, and delete GDP records, providing a backend API that can be integrated with any frontend.


## Features

- Add GDP records for any country and year

- View all stored GDP records

- Update GDP values for a specific country and year

- Delete GDP entries

- RESTful API endpoints for easy integration

- MongoDB for persistent data storage


## Tech Stack

**Backend:** Node.js, Express.js

**Database:** MongoDB

**Package Manager:** npm

**Dependencies:**
- express
- mongoose
- body-parser
- cors
- otenv

## Structure
GDP Records Management System/

│

├── server.js             # Main server file

├── models/               # Mongoose schemas

│   └── gdpModel.js

├── routes/               # API route definitions

│   └── gdpRoutes.js

├── controllers/       # Request handlers

│   └── gdpController.js

├── config/               # Database configuration

│   └── db.js

├── package.json

└── .env                  # Environment variables

## Structure
GDP Records Management System/

│

├── server.js             # Main server file

├── models/               # Mongoose schemas

│   └── gdpModel.js

├── routes/               # API route definitions

│   └── gdpRoutes.js

├── controllers/       # Request handlers

│   └── gdpController.js

├── config/               # Database configuration

│   └── db.js

├── package.json

└── .env                  # Environment variables

## Setup Instructions

1. Clone the repository
2. Install dependencies


   npm install

4. Set up environment variables
PORT=5000
MONGO_URI=mongodb://localhost:27017/gdpDB

5. Run the application

   
    npm start

