# Aryan-Acad-bacekend

# Student Management System

This is a simple Student Management System web application built using Node.js, Express, MongoDB, and Razorpay for online fee payment. It allows you to manage student records, toggle their fee payment status, and accept online fee payments.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Endpoints](#endpoints)
- [Database](#database)
- [Online Fee Payment](#online-fee-payment)
- [Cron Job](#cron-job)

## Prerequisites
- Node.js installed on your system
- MongoDB database set up with the appropriate connection URL
- Razorpay API credentials (for online fee payment)
- Gmail account credentials (for sending email receipts)

## Installation
1. Clone this repository:


2. Install dependencies:


3. Set up your environment variables. Create a `.env` file in the root of your project and add the following:
  - MONGODB_URI=your_mongodb_connection_url
  - RAZORPAY_KEY_ID=your_razorpay_key_id
  - RAZORPAY_KEY_SECRET=your_razorpay_key_secret
  - GMAIL_USER=your_gmail_username
  - GMAIL_PASS=your_gmail_password


4. Start the server:



## Usage
Access the Student Management System through your web browser by navigating to `http://localhost:3000/admin`.

## Endpoints
- `/admin`: View and manage student records.
- `/addStudent`: Add a new student.
- `/toggleFeesPaid/:id`: Toggle a student's fee payment status.
- `/deleteStudent/:id`: Delete a student.
- `/payment`: Accept online fee payments.
- `/feesdo`: Show the payment receipt.

## Database
The application uses MongoDB for storing student and fee payment records. MongoDB is a NoSQL database that should be set up separately. Update the `MONGODB_URI` in the `.env` file with your database connection URL.

## Online Fee Payment
Razorpay is used to accept online fee payments. You will need to obtain API credentials from the Razorpay dashboard and set the `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in the `.env` file.

## Cron Job
A cron job is scheduled to run on the 5th day of each month at 12:00 AM to reset the `feesPaid` field to false for all students. This is done using the `node-cron` library.




## Deployed Link
**https://aryanacademyback.onrender.com/**
😊😊
