const jwtAuth = require("./jwtAuth");

const saltRounds = 10;

const handleRegister = (db, bcrypt) => (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    res.status(400).json("Invalid register request");
  } else {
    const hash = bcrypt.hashSync(password, saltRounds);
    db("users")
      .insert({
        username: username,
        email: email,
        hash: hash
      })
      .returning(["email", "id"])
      .then(data => {
        jwtAuth
          .authorizeNewSesssion(data[0].email, data[0].id)
          .then(token => {
            res.status(200).json(token);
          })
          .catch(err => {
            res
              .status(500)
              .json("Error creating session. Please try to sign in." + err);
          });
      })
      .catch(err => {
        res
          .status(500)
          .json(
            "Error working with database. Please try to register again." + err
          );
      });
  }
};

module.exports = {
  handleRegister
};
