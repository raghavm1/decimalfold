import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes.js";

const app = express();

// Enable CORS for frontend deployed on Vercel
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register API routes
registerRoutes(app);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const port = parseInt(process.env.PORT ?? "5000", 10);

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
