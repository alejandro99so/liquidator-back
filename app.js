const express = require("express");
const app = express();
const cors = require("cors");
const port = 3000;
require("dotenv").config();
const connectDB = require("./config/db");
const { authUser } = require("./utils/auth");

app.use(
  cors({
    origin:
      process.env.STAGE == "dev"
        ? "http://localhost:3001"
        : "http://localhost:3001",
    methods: "GET,POST",
  })
);

app.use(express.json());

const authMiddleware = async (req, res, next) => {
  console.log(req.headers);
  console.log(req.body);
  const { authorization } = req.headers;
  const auth = await authUser(authorization);
  if (auth.error || !auth.payload) {
    res.send({ message: auth.message });
    return;
  }
  req.payload = auth.payload;
  next();
};

app.use(authMiddleware);

const initializeServer = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB");
    app.use("/user", require("./routes/api/user")());
    app.use("/room", require("./routes/api/room")());
    app.use("/chat", require("./routes/api/chat")());
    app.use("/contact", require("./routes/api/contact")());
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }
};
initializeServer();
