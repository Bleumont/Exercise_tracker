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
const exSchema = mongoose.Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: Date,
});

const userSchema = mongoose.Schema({
  username: String,
  log: [exSchema],
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
    res.send(result);
    return;
  });
});

app.post(
  '/api/exercise/add',
  bodyParser.urlencoded({ extended: false }),
  (req, res) => {
    let ndate = new Date();
    const exe = new EXERCISE({
      description: req.body.description,
      duration: req.body.duration,
      date: req.body.date || ndate,
    });

    USER.findByIdAndUpdate(
      req.body.userId,
      { $push: { log: exe } },
      { new: true },
      (err, updatedUser) => {
        if (!err) {
          const resObj = {
            _id: updatedUser.id,
            username: updatedUser.username,
            description: exe.description,
            duration: exe.duration,
            date: exe.date.toString().substring(0, 15),
          };
          res.json(resObj);
        }
      }
    );
  }
);

app.get('/api/exercise/log', (request, response) => {
  USER.findById(request.query.userId, (error, result) => {
    if (!error) {
      let responseObject = result;

      if (request.query.from || request.query.to) {
        let fromDate = new Date(0);
        let toDate = new Date();

        if (request.query.from) {
          fromDate = new Date(request.query.from);
        }

        if (request.query.to) {
          toDate = new Date(request.query.to);
        }

        fromDate = fromDate.getTime();
        toDate = toDate.getTime();

        responseObject.log = responseObject.log.filter((session) => {
          let sessionDate = new Date(session.date).getTime();

          return sessionDate >= fromDate && sessionDate <= toDate;
        });
      }

      if (request.query.limit) {
        responseObject.log = responseObject.log.slice(0, request.query.limit);
      }

      responseObject = responseObject.toJSON();
      responseObject['count'] = result.log.length;
      response.json(responseObject);
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
