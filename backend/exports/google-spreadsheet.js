const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
// const creds = require('../class-organiser-google.json');

async function createNewSpreadsheet() {

    const SCOPES = [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
      ];

      const jwt = new JWT({
        email: process.env.CLIENT_EMAIL,
        key: process.env.PRIVATE_KEY,
        scopes: SCOPES,
      });

    //   const jwt = new JWT({
    //     email: creds.client_email,
    //     key: creds.private_key,
    //     scopes: SCOPES,
    //   });
        
    const newSpreadsheet = await GoogleSpreadsheet.createNewSpreadsheetDocument(jwt, { title: 'This is new!'});
    newSpreadsheet.setPublicAccessLevel('reader');
    let firstSheet = newSpreadsheet.addSheet({ title: 'one' });

    await (await firstSheet).loadCells('A1:D5');
    const cellA1 = (await firstSheet).getCell(0, 0);

    cellA1.value = 1359;

    await (await firstSheet).saveUpdatedCells();

    console.log(newSpreadsheet._spreadsheetUrl);

    return newSpreadsheet;
}

module.exports.createNewSpreadsheet = createNewSpreadsheet;
