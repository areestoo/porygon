var GoogleSpreadsheet = require('google-spreadsheet');
var creds = require('./client_secret.json');

// doc URL ID (pull from URL)
var doc = new GoogleSpreadsheet('17JBrg3obR-Z6ngJLLB7b89rMtIdGt1lejKVXqJEvEv8');

botWorksheetTitle = '4.1';

// Authenticate with the Google Spreadsheets API.
doc.useServiceAccountAuth(creds, function (err) {
  doc.getInfo(function(err, info) {
    //Find sheet name from botWorksheetTitle variable
    console.log('Loaded doc: '+info.title+' by '+info.author.email);
      for (i=0; i<info.worksheets.length; i++){
        if (info.worksheets[i].title == botWorksheetTitle){
          var sheet = info.worksheets[i];
          break;
        }
      }
      console.log('Worksheet selected: '+sheet.title+' '+sheet.rowCount+'x'+sheet.colCount);

    // Get all of the rows from the spreadsheet.
    doc.getRows(1, function (err, rows) {
      console.log(rows);
    });
  });
});
