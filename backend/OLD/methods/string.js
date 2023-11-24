/**
 * Generates a random string
 * @returns
 */
function generateRandomString(characterCount = 10, randomWords = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
  let newCode = '';
  // generate an id
  for(let i = 0 ; i < characterCount ; i++) {
      let randomNumber = Math.floor(Math.random() * randomWords.length)
      newCode += randomWords.charAt(randomNumber);
  }
return newCode;
}

function getDateInDBFormat() {
  const date = new Date();
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

module.exports.generateRandomString = generateRandomString;
module.exports.getDateInDBFormat = getDateInDBFormat;
