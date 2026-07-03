# StitchMate Tailor Measurement Card Tool

StitchMate is a single-page local app built with HTML, CSS, and vanilla JavaScript. It runs entirely in the browser using Local Storage, so there is no backend server or database required.

## Features
- Customer measurement form with required fields
- Save, search, view, print, export, and delete actions
- Local persistence using browser Local Storage
- Responsive layout for desktop and mobile screens
- CSV export for all saved records

## Setup
1. Open the project folder in a browser.
2. Launch the app by opening [index.html](index.html) directly in the latest version of Chrome.

## Run Steps
1. Fill in the customer form.
2. Enter all required measurements and notes.
3. Click Save Record.
4. Use search to find records by customer name or phone number.
5. Choose View Card to preview and print the measurement card.
6. Click Export CSV to download a CSV file with all records.

## Storage Behavior
- Records are stored in browser Local Storage.
- Saved records remain available after a refresh or browser restart on the same device.
- Clearing browser storage or using private/incognito mode will remove saved data.

## CSV Export
- Click Export CSV to download a file named stitchmate-records.csv.
- The file includes the record number, customer details, measurements, and notes.

## Browser Requirement
- The app is designed for the latest Chrome browser.
- For the best experience, use a current desktop or mobile Chrome version.
