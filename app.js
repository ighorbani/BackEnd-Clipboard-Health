const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");

const agentRouter = require("./routes/agentRouter");
const facilityRouter = require("./routes/facilityRouter");
const shiftRouter = require("./routes/shiftRouter");

const mongoose = require("mongoose");
const MONGODB_URI = process.env.MONGODB_URI;

const app = express();
mongoose.set("strictQuery", false);

app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// SET HEADERS FOR API
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// USER DEFIGNED ROUTES
app.use(agentRouter);
app.use(facilityRouter);
app.use(shiftRouter);

// ERROR REPORTING
app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  res.status(status).json({ message: message });
});

// CONNECT TO MONGOOSE
mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    const server = app.listen(8080);
    const io = require("./socket").init(server);
    console.log("CONNECTED MONGOOSE !!!");
  })
  .catch((err) => {
    console.log(err);
  });
