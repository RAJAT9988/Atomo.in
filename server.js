require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Load service account credentials
const KEYFILEPATH = path.join(__dirname, 'credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});

const sheets = google.sheets({ version: 'v4', auth });


const SPREADSHEET_ID = '1JcBITj2nCug8vvxtOeu7G27SnpVN45WfXSBFpIUIMtk';

// Helper function to append data to sheet
async function appendToSheet(sheetName, values) {
  try {
    // Check if sheet exists
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheetExists = spreadsheet.data.sheets.some(sheet => sheet.properties.title === sheetName);

    if (!sheetExists) {
      // Create the sheet
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: sheetName,
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 20
                }
              },
            },
          }],
        },
      });
    }

    // Add headers if sheet is empty or first row is empty or contains default text
    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:Z1`,
    });
    const firstRow = getResponse.data.values ? getResponse.data.values[0] : [];
    const isEmptyRow = firstRow.length === 0 || firstRow.every(cell => cell === '' || cell.toString().toLowerCase().includes('type "@date"'));
    if (!getResponse.data.values || isEmptyRow) {
      let headers = [];
      if (sheetName === 'Subscribers') {
        headers = ['Timestamp', 'Email', 'FirstName', 'LastName', 'Company', 'Website', 'Mobile', 'City', 'Country', 'UseCase', 'AdditionalInfo', 'Consent'];
      } else if (sheetName === 'SupportRequests') {
        headers = ['Timestamp', 'FirstName', 'LastName', 'Company', 'Website', 'Email', 'Mobile', 'City', 'Country', 'UseCase', 'AdditionalInfo', 'Consent'];
      }
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [headers],
        },
      });
    }

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A2`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [values],
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Combined endpoint to append all data to single sheet "Subscribers"
app.post('/api/subscribe', async (req, res) => {
  try {
    const {
      email,
      firstName,
      lastName,
      company,
      website,
      mobile,
      city,
      country,
      useCase,
      additionalInfo,
      consent,
    } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Convert timestamp to IST timezone string with correct offset and format
    const date = new Date();
    const options = { timeZone: 'Asia/Kolkata', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const formatter = new Intl.DateTimeFormat('en-GB', options);
    const parts = formatter.formatToParts(date);
    const dateParts = {};
    parts.forEach(({ type, value }) => {
      dateParts[type] = value;
    });
    const timestamp = `${dateParts.year}-${dateParts.month}-${dateParts.day} ${dateParts.hour}:${dateParts.minute}:${dateParts.second}`;

    // Prepare row with all possible fields, empty string if missing
    const row = [
      timestamp,
      email,
      firstName || '',
      lastName || '',
      company || '',
      website || '',
      mobile || '',
      city || '',
      country || '',
      useCase || '',
      additionalInfo || '',
      consent !== undefined ? consent : '',
    ];

    await appendToSheet('Subscribers', row);
    res.json({ success: true, message: 'Data submitted successfully' });
  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint for support requests
app.post('/api/support', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      company,
      website,
      email,
      mobile,
      city,
      country,
      useCase,
      additionalInfo,
      consent,
    } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Convert timestamp to IST timezone string with correct offset and format
    const date = new Date();
    const options = { timeZone: 'Asia/Kolkata', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const formatter = new Intl.DateTimeFormat('en-GB', options);
    const parts = formatter.formatToParts(date);
    const dateParts = {};
    parts.forEach(({ type, value }) => {
      dateParts[type] = value;
    });
    const timestamp = `${dateParts.year}-${dateParts.month}-${dateParts.day} ${dateParts.hour}:${dateParts.minute}:${dateParts.second}`;

    // Prepare row with fields in SupportRequests order
    const row = [
      timestamp,
      firstName || '',
      lastName || '',
      company || '',
      website || '',
      email,
      mobile || '',
      city || '',
      country || '',
      useCase || '',
      additionalInfo || '',
      consent !== undefined ? consent : '',
    ];

    await appendToSheet('SupportRequests', row);
    res.json({ success: true, message: 'Support request submitted successfully' });
  } catch (error) {
    console.error('Support submit error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const ejs = require('ejs');

// Serve data viewing page
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/view-data/:sheetName', async (req, res) => {
  const sheetName = req.params.sheetName;
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:Z1000`,
    });
    const rows = response.data.values || [];
    res.render('view-data', { sheetName, rows });
  } catch (error) {
    res.status(500).send('Error fetching data: ' + error.message);
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  exec(`start http://localhost:${port}/index.html`);
});
