const { MongoClient } = require("mongodb");
const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const cron = require("node-cron");
const path = require("path");
const Razorpay = require("razorpay");
const cors = require("cors");
const nodemailer = require("nodemailer");
const urlrewrite = require("express-urlrewrite");

const app = express();
const url = "mongodb+srv://admin:7nefQ3yWuyneyZZK@cluster0.ajguymm.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(url);

app.use(urlrewrite("/onlinePayment", "/onlinefee.html"));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

app.get("/admin", async (req, res) => {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("studentdb");
    const studentsCollection = db.collection("students");
    const students = await studentsCollection
      .find()
      .sort({ feesPaid: 1 })
      .toArray();

    const html = fs.readFileSync(path.join(__dirname, "admin.html"), "utf8");
    const updatedHtml = html.replace(
      "{{tableContent}}",
      generateTableContent(students)
    );

    res.send(updatedHtml);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
});

function generateTableContent(students) {
  let tableContent = "";

  students.forEach((student) => {
    const feeStatus = student.feesPaid ? "Paid" : "Not Paid";

    tableContent += `
      <tr>
        <td><center>${student.id}</center></td>
        <td><center>${student.name}</center></td>
        <td><center>${feeStatus}</center></td>
        <td><center><button class="submit-button" onclick="toggleFeesPaid('${student.id}')">Change</button></center></td>
        <td><center><button class="submit-button1" onclick="deleteStudent('${student.id}')">Delete</button></center></td>
      </tr>`;
  });

  return tableContent;
}

app.post("/addStudent", express.json(), async (req, res) => {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("studentdb");
    const studentsCollection = db.collection("students");

    const { id, name, feesPaid } = req.body;

    // Check if the student with the same ID already exists
    const existingStudent = await studentsCollection.findOne({ id: id });
    if (existingStudent) {
      return res
        .status(400)
        .json({ error: "Student with the same ID already exists" });
    }

    const student = {
      id: id,
      name: name,
      feesPaid: Boolean(feesPaid),
    };

    const result = await studentsCollection.insertOne(student);

    console.log("New student added:", result.insertedId);

    res.sendStatus(200);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
});

app.put("/toggleFeesPaid/:id", async (req, res) => {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("studentdb");
    const studentsCollection = db.collection("students");

    const studentId = req.params.id;

    const student = await studentsCollection.findOne({ id: studentId });
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const updatedFeesPaid = !student.feesPaid;
    await studentsCollection.updateOne(
      { id: studentId },
      { $set: { feesPaid: updatedFeesPaid } }
    );

    console.log(`FeesPaid status toggled for student ${studentId}`);
    res.sendStatus(200);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
});

app.delete("/deleteStudent/:id", async (req, res) => {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("studentdb");
    const studentsCollection = db.collection("students");

    const { id } = req.params;

    const result = await studentsCollection.deleteOne({
      $or: [{ id: id }, { _id: id }],
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    console.log(`Student ${id} deleted`);
    res.sendStatus(200);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
});


app.post("/payment", async (req, res) => {
  try {
    let { amount, name, regnum, classSelect, fees, email } = req.body;

    var instance = new Razorpay({
      key_id: "rzp_test_QS5nYws4WQAItA",
      key_secret: "l5aowPd0lXdZIFe9QryfjOkI",
    });

    let order = await instance.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: "receipt#1",
    });

    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("studentdb");
    const studentsCollection = db.collection("feesPayment");

    // Check if the student with the same registration number already exists
    const existingStudent = await studentsCollection.findOne({
      registration_number: regnum,
    });
    if (existingStudent) {
      return res
        .status(400)
        .json({
          error: "Student with the same registration number already exists",
        });
    }

    const paymentData = {
      name,
      registration_number: regnum,
      class: classSelect,
      fees: parseFloat(fees),
      paymentStatus: order.status === "created" ? "success" : "failed",
      date: new Date(),
    };

    const result = await studentsCollection.insertOne(paymentData);

    console.log("New student added:", result.insertedId);

    if (order.status === "created") {
      const receipt = `<h1>Recipt for Your Payment</h1>
      <h2>Student Name: ${name}</h2>
      <h2>Registration Number: ${regnum}</h2>
      <h2>Class: ${classSelect}</h2>
      <h2>Fees: ${fees}</h2>
      <h2>Payment Status: ${order.status}</h2>
      <h2>Date: ${new Date()}</h2>
      `;

      // Create a nodemailer transporter using your email service provider details
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "demotoasting11@gmail.com",
          pass: "wfbqkrnxsdynvwna",
        },
      });

      // Setup email data
      const mailOptions = {
        from: "demotoasting11@gmail.com",
        to: email,
        subject: "Payment Receipt",
        html: receipt,
      };

      // Send email
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
        } else {
          console.log("Email sent:", info.response);
        }
      });

      // Return the response with success message
      res.status(201).json({
        success: true,
        message: `Payment is successful for ${name} with ID ${regnum}`,
        order,
        amount,
        receipt,
      });
    } else {
      res.status(500).json({ error: "Payment failed" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
});

app.post("/feesdo", async (req, res) => {
  res.sendFile(path.join(__dirname, "receipt.html"));
});


app.get("/feesPayment", async (req, res) => {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("studentdb");
    const studentsCollection = db.collection("feesPayment");
    const students = await studentsCollection.find().toArray();

    const html = fs.readFileSync(
      path.join(__dirname, "feesPayment.html"),
      "utf8"
    );
    const updatedHtml = html.replace(
      "{{tableContent}}",
      generateTableContent1(students)
    );

    res.send(updatedHtml);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
});

function generateTableContent1(students) {
  students.sort((a, b) => new Date(b.date) - new Date(a.date));

  let tableContent = "";
  let counter = 1;

  students.forEach((student) => {
    tableContent += `
        <tr>
          <td><center>${student.registration_number}</center></td>
          <td><center>${student.name}</center></td>
          <td><center>${student.class}</center></td>
          <td><center>${student.fees}</center></td>
          <td><center>${student.paymentStatus}</center></td>
          <td><center>${new Date(student.date).toLocaleString()}</center></td>
        </tr>`;
    counter++;
  });

  return tableContent;
}

app.post("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});


// Cron job to reset feesPaid field to false on the 5th day of each month at 12:00 AM
cron.schedule("0 0 5 * *", async () => {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("studentdb");
    const studentsCollection = db.collection("students");

    await studentsCollection.updateMany({}, { $set: { feesPaid: false } });

    console.log("FeesPaid field reset for all students");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port 3000");
});
