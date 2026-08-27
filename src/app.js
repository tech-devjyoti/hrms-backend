const dns = require("node:dns");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

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

app.get("/api/hrms", (req, res) => {
  res.status(200).json({
    success: true,
    message: "HRMS API is running",
  });
});

module.exports = app;