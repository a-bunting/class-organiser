const jwt = require('jsonwebtoken');

let invalidTokens = [];

function setInvalidToken(token) {
    let find = invalidTokens.find(a => a === token);
    if(!find) {
        invalidTokens.push(token);
    }
}

function hasTokenBeenInvalidated(token) {
    return invalidTokens.find(a => a === token) ? true : false;
}

/**
 * Gets the header info from a request and decodes the token to return the user id.
 * @param {*} req
 * @returns
 */
function getUserDataFromToken(req) {
  // decode the token to get the userid without having the user send it.
  const token = req.headers.authorization.split(" ")[1];
  const userData = jwt.decode(token);
  return userData;
}

module.exports.getUserDataFromToken = getUserDataFromToken;
module.exports.setInvalidToken = setInvalidToken;
module.exports.hasTokenBeenInvalidated = hasTokenBeenInvalidated;
