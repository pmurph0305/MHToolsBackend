const jwtAuth = require("./jwtAuth");

// primary route that does all the responses.
const handleSignin = (db, crypt) => (req, res) => {
  const { authorization } = req.headers;
  if (authorization) {
    // if theres an auth header, verify then respond.
    jwtAuth
      .checkAuth(authorization)
      .then(reply => {
        res.status(200).json(reply);
      })
      .catch(err => {
        res.status(401).json("Unauthorized Request");
      });
  } else {
    // otherwise, use the helper signin function.
    handleNewSignin(db, crypt, req)
      .then(data => {
        res.status(200).json(data);
      })
      .catch(err => {
        res.status(400).json(err);
      });
  }
};

const handleNewSignin = (db, bcrypt, req) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return Promise.reject("Invalid signin request");
  }
  // verify email & pass.
  return db("users")
    .select("email", "id", "hash")
    .where("email", email)
    .then(data => {
      return bcrypt
        .compare(password, data[0].hash)
        .then(isCorrectPassword => {
          return isCorrectPassword
            // authorize user by creating JWT & return ({id, token})
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