const express = require("express");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const homeRoutes = require("./routes/homeRoutes");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const fs = require("fs");

const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/homes", homeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/feedbacks", feedbackRoutes);

const predictionRoutes = require("./routes/predictionRoutes");
app.use("/api", predictionRoutes);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("deleteMessage", (data) => {
    io.to(data.chatId).emit("messageDeleted", data.messageId);
  });
  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    console.log(`User joined chat ${chatId}`);
  });

  socket.on("sendMessage", (messageData) => {
    io.to(messageData.chatId).emit("receiveMessage", messageData);
  });


  socket.on("editMessage", (data) => {
    io.to(data.chatId).emit("messageEdited", data.message);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

app.use(express.static(path.join(__dirname, "../frontend")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.use((err, req, res, next) => {
  if (err.name === "MulterError" || err.message?.includes("Only JPG")) {
    return res
      .status(400)
      .json({ message: err.message || "Invalid file upload" });
  }

  console.error(err);
  res.status(500).json({ message: "Server error", error: err.message });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
