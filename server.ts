import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { AppData } from "./types";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = 3000;
const DATA_FILE = path.resolve("./data/app_data.json");
const DATA_DIR = path.resolve("./data");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

const INITIAL_APP_DATA: AppData = {
  users: [], notices: [], handovers: [], inventory: [], 
  reservations: [], schedules: [], reports: [], tasks: [], 
  template: [], recipes: [], lastUpdated: 0
};

function loadStoreData(): AppData {
  if (fs.existsSync(DATA_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    } catch (e) {
      console.error(`Error loading data:`, e);
    }
  }
  return { ...INITIAL_APP_DATA };
}

function saveStoreData(data: AppData) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.use(express.json());

// API Routes
app.get("/api/data", (req, res) => {
  const data = loadStoreData();
  res.json(data);
});

// Socket.io logic
io.on("connection", (socket) => {
  console.log(`[SOCKET] New connection: ${socket.id}`);
  
  // Join a single default room
  socket.join("main_room");
  console.log(`[SOCKET] Socket ${socket.id} joined main_room`);

  socket.on("update-data", ({ key, data }: { key: keyof AppData, data: any }) => {
    const timestamp = Date.now();
    console.log(`[DATA] Update received for key: ${key} at ${timestamp}`);
    
    const storeData = loadStoreData();
    (storeData as any)[key] = data;
    storeData.lastUpdated = timestamp;

    saveStoreData(storeData);

    // Broadcast to EVERYONE (including sender, client handles deduplication)
    io.emit("data-updated", { key, data, lastUpdated: timestamp });
    console.log(`[DATA] Broadcasted update for ${key} to all clients`);
  });

  socket.on("disconnect", (reason) => {
    console.log(`[SOCKET] Client disconnected: ${socket.id}, reason: ${reason}`);
  });
});

// Vite middleware for development
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }
}

setupVite().then(() => {
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
