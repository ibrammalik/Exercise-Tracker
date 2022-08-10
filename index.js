const express = require('express')
const app = express()
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const cors = require('cors')
require('dotenv').config()


app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(cors())
app.use(express.static('public'))



//Database Setup
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
let userSchema = new mongoose.Schema ({
  username : String,
  count: Number,
  log: [{
    description: String,
    duration: Number,
    date: String
  }]
});

let User = mongoose.model('User', userSchema);


//API
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
      //Get list of users
app.get("/api/users", (req, res) => {
  User.find((err, data) => {
    let listUsers = []
    data.forEach(objectUser => {
      let newObjectUser = {
        "_id": objectUser._id, 
        "username": objectUser.username, 
        "__v": objectUser.__v
      }
      listUsers.push(newObjectUser)
    });
    res.send(listUsers)
  })
})

      //Create Users
app.post('/api/users', (req, res) => {
  const username = req.body.username
  let newUser = new User ({
    username : username
  })
  newUser.save((err, data) => {
    if (err) return console.error(err);
    console.log(data);
    res.json({username:data.username, _id:data._id})
  })
});

      //Add Exercises
app.post('/api/users/:_id/exercises', (req, res) => {
  const _id = req.params.id
  const description = req.body.description
  const duration = Number(req.body.duration)
  const date = () => {
    if (!req.body.date) return new Date().toDateString()
    return new Date(req.body.date).toDateString()
  }
  const update = {$push:{ log: {
    description: description,
    duration: duration,
    date: date()
  }}}
  User.findOneAndUpdate({_id: _id}, update, (err,data) => {
    res.send({username:data.username, description, duration, date:date(), _id,})
    let logLength = data.log.length + 1
    console.log(logLength)
    User.findOneAndUpdate({_id: _id}, {count: logLength}, (err,data) => {
      if (err) throw err
    })
  })
})

      ///Get User's Exercise Logs
app.get('/api/users/:_id/logs', (req, res) => {
  const _id = req.params._id
  let log =[]
  User.findById(_id, (err, data) => {
    data.log.forEach(objExercises => {
      let newObjExercises = {
        "description": objExercises.description,
        "duration": objExercises.duration,
        "date": objExercises.date
      }
      log.push(newObjExercises)
    })
    res.send({username:data.username, count:data.count, _id:data._id, log})
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
