const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

const userSchema = mongoose.Schema({
  username: String,
});
const exSchema = mongoose.Schema({
  userID: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: Date,
});

const USER = mongoose.model('User', userSchema);
const EXERCISE = mongoose.model('Exercise', exSchema);

app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post(
  '/api/exercise/new-user',
  bodyParser.urlencoded({ extended: false }),
  (req, res) => {
    USER.findOneAndUpdate(
      { username: req.body.username },
      { username: req.body.username },
      { new: true, upsert: true }
    ).exec((err, result) => {
      if (err) throw err;
      res.json({ username: result.username, _id: result._id });
    });
  }
);

app.get('/api/exercise/users', (req, res) => {
  USER.find((err, result) => {
    if (err) throw err;
    // let arr = new Array(result);
    res.send(result);
    return;
  });
});

app.post(
  '/api/exercise/add',
  bodyParser.urlencoded({ extended: false }),
  (req, res) => {
    let userId = req.body.userId;
    let description = req.body.description;
    let duration = req.body.duration;
    let date = req.body.date || Date.now();

    const exe = new EXERCISE({
      userId,
      description,
      duration,
      date,
    });
    exe.save((err) => {
      if (err) throw err;
      res.json({ user: exe });
    });
  }
);

app.get('/api/exercise/log/:userId/:from?/:to?/:limit?', (req, res) => {
  let user = req.params.userId;
  let resObj = {};
  let { _, from, to, limit } = request.body;
  EXERCISE.find({ userID: user }, (err, result) => {
    if (err) throw err;
    resObj['log'] = result;
  });
  EXERCISE.find({}).countDocuments((err, count) => {
    if (err) throw err;
    resObj['count'] = count;
  });
  if (!from && !to && !limit) {
    res.json(resObj);
  } else {
    EXERCISE.find()
      .where('date')
      .gt(from)
      .lt(to)
      .limit(limit)
      .exec((err, result) => {
        if (err) throw err;
        res.json(result);
      });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
