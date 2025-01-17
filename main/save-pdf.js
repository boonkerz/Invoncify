// Libs
const { BrowserWindow, ipcMain, shell } = require('electron');
const appConfig = require('electron-settings');
const path = require('path');
const fs = require('fs');

ipcMain.on('save-pdf', (event, docId) => {
  const exportDir = appConfig.getSync('invoice.exportDir');
  const pdfPath = path.join(exportDir, `${docId}.pdf`);
  const win = BrowserWindow.fromWebContents(event.sender);

  let printOptions;
  if (appConfig.hasSync('general.printOptions')) {
    printOptions = appConfig.getSync('general.printOptions');
  } else {
    printOptions = {
      landscape: false,
      marginsType: 0,
      printBackground: true,
      printSelectionOnly: false,
    };
  }


  win.webContents.printToPDF(printOptions)
    .then(data => {
      fs.writeFileSync(pdfPath, data);

      if (appConfig.getSync('general.previewPDF')) {
        // Open the PDF with default Reader
        shell.openPath(pdfPath);
      }
      // Show notification
      event.sender.send('pdf-exported',
        {
          title: 'PDF Exported',
          body: 'Click to reveal file.',
          location: pdfPath,
        });

    }).catch(err => { throw err; });



});

ipcMain.on('reveal-file', (event, location) => {
  shell.showItemInFolder(location);
});
