const redis = require("redis");
const redisClient = redis.createClient();
const jwt = require("jsonwebtoken");

const requireAuthorization = (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).json("Unauthorized Request");
  } else {
    return redisClient.get(authorization, function(err, reply) {
      if (err || !reply) {
        return res.status(401).json("Unauthorized Request");
      }
      return next();
    });
  }
};

const authorizeNewSesssion = (email, id) => {
  const token = signAuthToken(email);
  return createRedisToken(token, id)
    .then(() => ({ id, token }))
    .catch(err => {
      console.log("create token error", err);
    });
};

const createRedisToken = (key, value) => {
  return Promise.resolve(redisClient.set(key, value));
};

const checkAuth = token => {
  return new Promise(function(resolve, reject) {
    redisClient.get(token, function(err, reply) {
      if (reply && !err) {
        resolve(reply);
      } else {
        reject(err);
      }
    });
  });
};

const signAuthToken = data => {
  return jwt.sign({ data: data }, "secret", { expiresIn: "48h" });
};

module.exports = {
  checkAuth,
  authorizeNewSesssion,
  requireAuthorization
};
