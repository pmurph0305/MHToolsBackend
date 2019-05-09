const jwtAuth = require("./jwtAuth");

const handleSignin = (db, crypt) => (req, res) => {
  const { authorization } = req.headers;
  if (authorization) {
    jwtAuth
      .checkAuth(authorization)
      .then(reply => {
        res.status(200).json(reply);
      })
      .catch(err => {
        res.status(401).json("Unauthorized Request");
      });
  } else {
    handleNewSignin(db, crypt, req)
      .then(token => {
        res.status(200).json(token);
      })
      .catch(err => {
        res.status(400).json(err);
      });
  }
};

const handleNewSignin = (db, bcrypt, req) => {
  const { email, password } = req.body;
  return db("users")
    .select("email", "id", "hash")
    .where("email", email)
    .then(data => {
      return bcrypt
        .compare(password, data[0].hash)
        .then(isCorrectPassword => {
          return isCorrectPassword
            ? jwtAuth.authorizeNewSesssion(email, data[0].id)
            : Promise.reject("Invalid password");
        })
        .catch(err => {
          console.log(err);
          return Promise.reject("bcrypt error");
        });
    })
    .catch(err => {
      console.log(err);
      // All errors respond with this promise, but are logged on backend.
      return Promise.reject("Invalid signin request.");
    });
};

module.exports = {
  handleSignin
};

//schema: id, user, email, hash, date joined

// bcrypt.hash(pass, saltRounds).then(function(hash) {
//     db('users')
//     .where('email', email)
//     .update({ hash: hash })
//     .then(d=> console.log('d', d))
//     .catch(e => console.log('e', e))
// });
