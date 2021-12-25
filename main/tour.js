// Libs
const { BrowserWindow, ipcMain } = require('electron');
const appConfig = require('electron-settings');

// Get Windows Instance
const tourWindowID = appConfig.getSync('tourWindowID');
const loginWindowID = appConfig.getSync('loginWindowID');
const mainWindowID = appConfig.getSync('mainWindowID');
const previewWindowID = appConfig.getSync('previewWindowID');
const tourWindow = BrowserWindow.fromId(tourWindowID);
const loginWindow = BrowserWindow.fromId(loginWindowID);
const mainWindow = BrowserWindow.fromId(mainWindowID);
const previewWindow = BrowserWindow.fromId(previewWindowID);

ipcMain.on('start-tour', startTour);
ipcMain.on('end-tour', endTour);

// TOUR
function startTour() {
  // Save current visibility state for restoring later
  saveWinsVisibleState();
  // Hide all windows
  hideAllWindows();
  // Show the tour window
  tourWindow.show();
  tourWindow.focus();
  // Update tour active state
  appConfig.setSync('tour.isActive', true);
}

function endTour() {
  // Update tour state
  appConfig.setSync('tour', {
    hasBeenTaken: true,
    isActive: false,
  });
  // Hide the tourWindow
  tourWindow.hide();
  // Restore windows state
  restoreWindows();
  // Update new state for next use
  saveWinsVisibleState();
}

function showWindow(context) {
  const tour = appConfig.getSync('tour');
  if (tour.isActive) {
    if (context === 'startup') {
      tourWindow.on('ready-to-show', () => {
        tourWindow.show();
        tourWindow.focus();
      });
      return;
    }
    if (context === 'activate') {
      tourWindow.show();
      tourWindow.focus();
      return;
    }
  }

  if (tour.hasBeenTaken) {
    if (context === 'startup') {
      loginWindow.once('ready-to-show', () => {
        loginWindow.show();
        loginWindow.focus();
      });
      return;
    }
    if (context === 'activate') {
      restoreWindows();
      return;
    }
  }
  startTour();
}

function restoreWindows() {
  const { isLoginWinVisible, isPreviewWinVisible } = appConfig.getSync(
    'winsLastVisibleState'
  );
  if (!isLoginWinVisible && !isPreviewWinVisible) {
    loginWindow.show();
    loginWindow.focus();
    return;
  }
  isLoginWinVisible && loginWindow.show();
  isPreviewWinVisible && previewWindow.show();
}

// HELPER FUNCTIONS
function hideAllWindows() {
  loginWindow.hide();
  mainWindow.hide();
  previewWindow.hide();
}

function saveWinsVisibleState() {
  appConfig.setSync('winsLastVisibleState', {
    isMainWinVisible: mainWindow.isVisible(),
    isPreviewWinVisible: previewWindow.isVisible(),
    isLoginWinVisible: loginWindow.isVisible(),
  });
}

module.exports = {
  showWindow,
};
