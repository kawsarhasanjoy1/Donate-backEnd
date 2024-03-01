const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const userCollection = client.db("T2-Assignment-7").collection("users");
    const clothCollection = client.db("T2-Assignment-7").collection("cloth");
    const commentCollection = client
      .db("T2-Assignment-7")
      .collection("comment");
    const reviewCollection = client.db("T2-Assignment-7").collection("review");
    const volunteerCollection = client
      .db("T2-Assignment-7")
      .collection("volunteer");

    // User Registration
    app.post("/api/v1/register", async (req, res) => {
      const { Name, Email, Password, Image } = req.body;
      // Check if email already exists
      const existingUser = await userCollection.findOne({ email: Email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(Password, 10);

      // Insert user into the database
      await userCollection.insertOne({
        name: Name,
        email: Email,
        Password: hashedPassword,
        image: Image,
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
      });
    });
    app.get("/api/v1/registers", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.status(200).json({
        success: true,
        message: "User fetched successfully",
        data: result,
      });
    });

    // User Login
    app.post("/api/v1/login", async (req, res) => {
      const { Email, Password } = req.body;

      // Find user by email
      const user = await userCollection.findOne({ email: Email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      console.log(user);
      // Compare hashed password
      const isPasswordValid = await bcrypt.compare(Password, user.Password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const sendUser = {
        id: user?._id,
        name: user?.name,
        email: user?.email,
        image: user?.image,
      };
      // Generate JWT token
      const token = jwt.sign({ user: sendUser }, process.env.JWT_SECRET, {
        expiresIn: process.env.EXPIRES_IN,
      });

      res.json({
        success: true,
        message: "Login successful",
        token,
      });
    });

    // ==============================================================
    // WRITE YOUR CODE HERE

    //Post cloth
    app.post("/api/v1/create-cloth", async (req, res) => {
      const cloth = req.body;
      const result = await clothCollection.insertOne(cloth);
      res.json({
        success: true,
        message: "Cloth created successful",
        data: result,
      });
    });

    // get all cloth
    app.get("/api/v1/all-clothes", async (req, res) => {
      try {
        const result = await clothCollection.find().toArray();
        res.json({
          success: true,
          message: "Cloth fetched successful",
          data: result,
        });
      } catch (err) {
        res.json({
          success: false,
          message: err?.message,
        });
      }
    });

    app.get("/api/v1/cloth/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await clothCollection.findOne(query);
      res.json({
        success: true,
        message: "Cloth fetched successful",
        data: result,
      });
    });

    app.get("/api/v1/top-donor-creator", async (req, res) => {
      try {
        const result = await clothCollection
          .aggregate([
            {
              $group: {
                _id: "$userEmail",
                clothCount: { $sum: 1 },
              },
            },
            {
              $sort: { clothCount: -1 },
            },
            {
              $limit: 10,
            },
          ])
          .toArray();
          console.log(result)
        if (result.length === 0) {
          return res.json({
            success: true,
            message: "No cloth creators found",
            data: null,
          });
        }

        const topCreatorEmail = result;

        res.json({
          success: true,
          message: "Top cloth creator fetched successfully",
          data: {
            userEmail: topCreatorEmail,
          },
        });
      } catch (err) {
        res.json({
          success: false,
          message: err?.message,
        });
      }
    });

    app.delete("/api/v1/delete-cloth/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await clothCollection.deleteOne(query);
      res.status({
        success: true,
        message: "Cloth deleted successful",
      });
    });
    app.put("/api/v1/up-cloth/:id", async (req, res) => {
      const id = req.params.id;
      const cloth = req.body;
      console.log(id, cloth);
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: cloth,
      };
      const result = await clothCollection.updateOne(query, updateDoc);
      console.log(result);
      res.status({
        success: true,
        message: "Cloth updated successful",
      });
    });

    // app.post("/api/v1/buy-cloth", async (req, res) => {
    //   const cloth = req.body;
    //   console.log(cloth);
    //   const result = await clothCollection.insertOne(cloth);
    //   res.json({
    //     success: true,
    //     message: "Cloth buy successful",
    //     data: result,
    //   });
    // });
    app.post("/api/v1/comment", async (req, res) => {
      const comment = req.body;

      const result = await commentCollection.insertOne(comment);
      res.json({
        success: true,
        message: "comment successfully sent",
        data: result,
      });
    });
    app.get("/api/v1/comments", async (req, res) => {
      const result = await commentCollection.find().toArray();
      res.json({
        success: true,
        message: "comment fetched successful",
        data: result,
      });
    });
    app.post("/api/v1/review", async (req, res) => {
      const review = req.body;

      const result = await reviewCollection.insertOne(review);
      res.json({
        success: true,
        message: "review successfully sent",
        data: result,
      });
    });
    app.get("/api/v1/reviews", async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.json({
        success: true,
        message: "review fetched successful",
        data: result,
      });
    });
    app.post("/api/v1/volunteer", async (req, res) => {
      const volunteer = req.body;

      const result = await volunteerCollection.insertOne(volunteer);
      res.json({
        success: true,
        message: "volunteer successfully sent",
        data: result,
      });
    });
    app.get("/api/v1/volunteers", async (req, res) => {
      const result = await volunteerCollection.find().toArray();
      res.json({
        success: true,
        message: "volunteer fetched successful",
        data: result,
      });
    });

    // ==============================================================

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running smoothly",
    timestamp: new Date(),
  };
  res.json(serverStatus);
});
