const { app, BrowserWindow, screen, ipcMain, net } = require('electron');
const path = require('path');
const { parseBoard } = require('./providers/fr24Board');

// FlightRadar24 sits behind bot protection that rejects ordinary HTTP clients
// on their TLS fingerprint alone -- correct browser headers are not enough.
// `net.fetch` goes through Chromium's own network stack, so it presents a real
// Chrome fingerprint and is let through.
const AIRPORT_URL = 'https://api.flightradar24.com/common/v1/airport.json';
const FLIGHT_LIMIT = 100;

const REQUEST_HEADERS = {
  accept: 'application/json',
  'accept-language': 'en-US,en;q=0.9',
  origin: 'https://www.flightradar24.com',
  referer: 'https://www.flightradar24.com/'
};

async function fetchBoard(airportCode, mode) {
  if (!/^[A-Z]{3,4}$/.test(airportCode)) {
    throw new Error(`Invalid airport code: ${airportCode}`);
  }
  const board = mode === 'arrivals' ? 'arrivals' : 'departures';

  const url = `${AIRPORT_URL}?format=json&code=${airportCode}&limit=${FLIGHT_LIMIT}&page=1`;
  const res = await net.fetch(url, { headers: REQUEST_HEADERS });
  if (!res.ok) {
    throw new Error(`FlightRadar24 returned HTTP ${res.status} for ${airportCode}`);
  }

  const payload = await res.json();
  const response = payload?.result?.response;
  if (!response) {
    throw new Error(`Unexpected response shape for ${airportCode}`);
  }

  return parseBoard(response, board);
}

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    x: width - 820,
    y: 20,
    frame: false,
    transparent: true,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');

  // マウスイベントを透過させる場合は以下のコメントを外す
  // mainWindow.setIgnoreMouseEvents(true);
}

app.whenReady().then(() => {
  // The renderer cannot call net.fetch itself, so it asks for boards over IPC.
  ipcMain.handle('flights:fetch', (_event, { airport, mode }) => fetchBoard(airport, mode));

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
