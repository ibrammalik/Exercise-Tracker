const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static("public"));

//Database Setup
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
let userSchema = new mongoose.Schema({
  username: String,
  count: Number,
  log: [
    {
      description: String,
      duration: Number,
      date: String,
      parsedDate: Number,
    },
  ],
});

let User = mongoose.model("User", userSchema);

//API
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
//Get list of users
app.get("/api/users", (req, res) => {
  User.find((err, data) => {
    let listUsers = [];
    data.forEach((objectUser) => {
      let newObjectUser = {
        _id: objectUser._id,
        username: objectUser.username,
        __v: objectUser.__v,
      };
      listUsers.push(newObjectUser);
    });
    res.send(listUsers);
  });
});

//Create Users
app.post("/api/users", (req, res) => {
  const username = req.body.username;
  let newUser = new User({
    username: username,
  });
  newUser.save((err, data) => {
    if (err) return console.error(err);
    res.json(data);
  });
});

//Add Exercises
app.post("/api/users/:_id/exercises", (req, res) => {
  const id = req.params._id;
  const description = req.body.description;
  const duration = Number(req.body.duration);
  const date = () => {
    if (!req.body.date) return new Date().toDateString();
    return new Date(req.body.date).toDateString();
  };
  const update = {
    $push: {
      log: {
        description: description,
        duration: duration,
        date: date(),
        parsedDate: Date.parse(date()),
      },
    },
  };
  User.findOneAndUpdate({ _id: id }, update, (err, data) => {
    console.log(data);
    if (!data) res.send(`this ${id} id not found`);
    res.json({ username: data.username, description, duration, date: date(), _id: id });
    let logLength = data.log.length + 1;
    console.log(logLength);
    User.findOneAndUpdate({ _id: id }, { count: logLength }).exec();
  });
});

///Get User's Exercise Logs
app.get("/api/users/:_id/logs", async (req, res) => {
  const id = req.params._id;
  const from = req.query.from;
  const to = req.query.to;
  const limit = Number(req.query.limit);
  let userObj;
  //Filter system for from, to, limit input
  if (from & to) {
    console.log("from & to");
    userObj = await User.find({ _id: id, log: { $elemMatch: { parsedDate: { $gte: from, $lte: to } } } }).select("username count log");
  } else if (to) {
    console.log("Only to");
    userObj = await User.find({ _id: id, parsedDate: { $lte: to } }).select("username count log");
  } else if (from) {
    console.log("Only from");
    userObj = await User.find({ _id: id, parsedDate: { $gte: from } }).select("username count log");
  } else {
    console.log("No from & to");
    userObj = await User.find({ _id: id }).select("username count log");
  }
  if (limit) {
    res.json({
      username: userObj[0]["username"],
      count: userObj[0]["count"],
      _id: userObj[0]["_id"],
      log: userObj[0]["log"].slice(0, limit),
    });
  } else {
    res.json(userObj[0]);
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
