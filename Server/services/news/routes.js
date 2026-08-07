import express from "express";
import { getIndianNews } from "./service.js";

const router = express.Router();

router.get("/:symbol", async (req, res) => {
  try {
    const data = await getIndianNews(req.params.symbol);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

export default router;