//const redis = require("redis");
//const redisClient = redis.createClient();
const jwt = require("jsonwebtoken");

// If authorization is required, checks to make sure a valid JWT token was sent.
const requireAuthorization = (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    // if we don't have the auth header, it's.. unauthorized.
    return res.status(401).json("Unauthorized Request");
  } else {
    // make sure it's a valid JWT token.
    // TODO: actual secret key.
    return jwt.verify(authorization, "secret", function(jwtErr, decoded) {
      if (!jwtErr && decoded) {
        // make sure it exists in redis / hasn't expired.
        // return redisClient.get(authorization, function(err, reply) {
        //   if (err || !reply) {
        //     console.log("Redis Error:", err);
        //     return res.status(401).json("Unauthorized Request");
        //   } else {
        //     // everything checks out, let user reach the endpoint.
        //     return next();
        //   }
        // });
        return next();
      } else {
        console.log("JWT Error", jwtErr);
        return res.status(401).json("Unauthorized Request");
      }
    });
  }
};

// creates a signed token containing the users id.
// stores the token in a redis db.
// returns the id & token in an object.
const authorizeNewSesssion = (email, id) => {
  // create a signed JWT token with the data email and id in it.
  const token = signAuthToken({email, id});
  return ({id, token})
  // return the created redit token, along with the user's id after storing it in redis db.
  // return createRedisToken(token, 1)
  //   .then(() => ({ id, token }))
  //   .catch(err => {
  //     console.log("create token error", err);
  //   });
};

// Does redis.set with the key and value.
// returns a promise.
const createRedisToken = (key, value) => {
  return Promise.resolve(redisClient.set(key, value));
};

// Verifies the token is in the redis database,
// Makes verifies the jwt token,
// resolves with the redis value if everything is okay.
// otherwise rejects with the error (redis or jwt).
// Returns a promise.
const checkAuth = token => {
  return new Promise(function(resolve, reject) {
    jwt.verify(token, "secret", function(jwtErr, decoded) {
      if(!jwtErr) {
        // resolve the promise with the decoded data.
        resolve(decoded.data);
      } else {
        // reject the promise, invalid token.
        console.log("JWT Error:", jwtErr);
        reject(jwtErr);
      }
    })
    // make sure token exists in redis db (it hasn't expired)
    // redisClient.get(token, function(err, reply) {
    //   if (reply && !err) {
    //     // verify the token with the "secret key"
    //     // TODO: an actual secret key.
    //     jwt.verify(token, "secret", function(jwtErr, decoded) {
    //       if(!jwtErr) {
    //         // resolve the promise with the decoded data.
    //         resolve(decoded.data);
    //       } else {
    //         // reject the promise, invalid token.
    //         console.log("JWT Error:", jwtErr);
    //         reject(jwtErr);
    //       }
    //     })
    //   } else {
    //     // reject the promise, doesn't exist in redis db / has expired.
    //     console.log("Redis Error:", err);
    //     reject(err);
    //   }
    // });
  });
};

// Signs a JWT token containing the given data.
const signAuthToken = data => {
  // TODO: use an actual secret key..
  return jwt.sign({ data: data }, "secret", { expiresIn: "48h" });
};

module.exports = {
  checkAuth,
  authorizeNewSesssion,
  requireAuthorization
};
