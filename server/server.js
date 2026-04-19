// ================= IMPORTS =================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Task = require("./models/Task");
const User = require("./models/User");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const authMiddleware = require("./middleware/authMiddleware");

const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= DATABASE =================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected "))
  .catch((err) => console.log("MongoDB Error ", err));

// ================= TEST ROUTE =================
app.get("/", (req, res) => {
  res.send("API is running...");
});


// =====================================================
// ================= AUTH ROUTES ========================
// =====================================================

// 🔐 REGISTER
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists " });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully " });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// 🔐 LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found " });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials " });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      "secret123",
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful ",
      token
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// =====================================================
// ================= PROTECTED ROUTES ===================
// =====================================================

// 👤 PROFILE
app.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});



// =====================================================
// ================= TASK ROUTES ========================
// =====================================================

// ➕ CREATE TASK (with collaboration)
app.post("/tasks", authMiddleware, async (req, res) => {
  try {
    const { title, description, deadline, assignedTo } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required " });
    }

    // 🔥 Smart Priority
    let priority = "Low";
    if (deadline) {
      const daysLeft = (new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24);
      if (daysLeft <= 2) priority = "High";
      else if (daysLeft <= 5) priority = "Medium";
    }

    const newTask = new Task({
      title,
      description,
      deadline,
      priority,
      status: "To Do",
      userId: req.user.id,
      assignedTo: assignedTo || null
    });

    await newTask.save();

    res.status(201).json({
      message: "Task created successfully ",
      task: newTask
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// 📥 GET TASKS (MY + TEAM TASKS)
app.get("/tasks", authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({
      $or: [
        { userId: req.user.id },        // your tasks
        { assignedTo: req.user.email }  // assigned tasks
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Tasks fetched successfully ",
      tasks
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ✏️ UPDATE TASK
app.put("/tasks/:id", authMiddleware, async (req, res) => {
  try {
    const { title, description, deadline, status } = req.body;

    const updateFields = {};

    if (title) updateFields.title = title;
    if (description) updateFields.description = description;
    if (deadline) updateFields.deadline = deadline;
    if (status) updateFields.status = status;

    const updatedTask = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [
          { userId: req.user.id },
          { assignedTo: req.user.email }
        ]
      },
      updateFields,
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found " });
    }

    res.status(200).json({
      message: "Task updated successfully ",
      task: updatedTask
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ❌ DELETE TASK
app.delete("/tasks/:id", authMiddleware, async (req, res) => {
  try {
    const deletedTask = await Task.findOneAndDelete({
      _id: req.params.id,
      $or: [
        { userId: req.user.id },
        { assignedTo: req.user.email }
      ]
    });

    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found " });
    }

    res.status(200).json({
      message: "Task deleted successfully "
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// =====================================================
// ================= SERVER =============================
// =====================================================

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} `);
});
