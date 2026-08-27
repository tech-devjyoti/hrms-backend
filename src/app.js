const dns = require("node:dns");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
const {
  errorHandler,
} = require("./middlewares/errorMiddleware");

dns.setServers(["8.8.8.8", "8.8.4.4"]);
const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/v1/auth", authRoutes);

app.use(errorHandler);

module.exports = app;