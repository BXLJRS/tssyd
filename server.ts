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
const DATA_DIR = path.resolve("./data");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

const INITIAL_APP_DATA: AppData = {
  users: [], notices: [], handovers: [], inventory: [], 
  reservations: [], schedules: [], reports: [], tasks: [], 
  template: [], recipes: [], lastUpdated: 0
};

function getStorePath(storeId: string) {
  return path.join(DATA_DIR, `${storeId}.json`);
}

function loadStoreData(storeId: string): AppData {
  const filePath = getStorePath(storeId);
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch (e) {
      console.error(`Error loading data for ${storeId}:`, e);
    }
  }
  return { ...INITIAL_APP_DATA };
}

function saveStoreData(storeId: string, data: AppData) {
  const filePath = getStorePath(storeId);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

app.use(express.json());

// API Routes
app.get("/api/data/:storeId", (req, res) => {
  const { storeId } = req.params;
  const data = loadStoreData(storeId);
  res.json(data);
});

// Socket.io logic
io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);

  socket.on("join-store", (rawStoreId: string) => {
    if (!rawStoreId) return;
    const storeId = rawStoreId.trim().toLowerCase();
    socket.join(storeId);
    console.log(`Socket ${socket.id} joined store: ${storeId}`);
    
    // Send a confirmation back to the client
    socket.emit("joined", { storeId, socketId: socket.id });
  });

  socket.on("update-data", ({ storeId: rawStoreId, key, data }: { storeId: string, key: keyof AppData, data: any }) => {
    const storeId = rawStoreId.trim().toLowerCase();
    console.log(`Update received for store ${storeId}, key ${key}`);
    const storeData = loadStoreData(storeId);
    
    // Update the specific key
    (storeData as any)[key] = data;
    storeData.lastUpdated = Date.now();

    saveStoreData(storeId, storeData);

    // Broadcast the update to everyone else in the store
    socket.to(storeId).emit("data-updated", { key, data, lastUpdated: storeData.lastUpdated });
    console.log(`Broadcasted update for ${key} to store ${storeId}`);
  });

  socket.on("disconnect", (reason) => {
    console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
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
