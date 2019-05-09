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
          res.status(401).json("unauthorized Request");
      }
      return next();
    })
  }
}

const authorizeNewSesssion = (email, id) => {
  const token = signAuthToken(email);
  return createRedisToken(token, id)
    .then(() => ({ id, token }))
    .catch(err => {

    });
};

const createRedisToken = (key, value) => {
  return Promise.resolve(redisClient.set(key, value));
};

// does the response itself as getAsync requires bluebird.
const checkAuthRespondWithId = (res, token) => {
  return redisClient.get(token, function(err, reply) {
    if (reply) {
      return res.json({id: reply});
    } else {
      console.log('Key/Token not found:', err);
      return res.status(401).json("Unauthorized Request");
    }
  })
}

const signAuthToken = data => {
  return jwt.sign({ data: data }, "secret", { expiresIn: "48h" });
};


module.exports = {
  checkAuthRespondWithId,
  authorizeNewSesssion,
  requireAuthorization,
};
