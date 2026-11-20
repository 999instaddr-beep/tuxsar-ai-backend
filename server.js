import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 10000;

app.use(cors({
  origin: "https://999instaddr-beep.github.io"
}));

app.use(express.json({ limit: "10mb" }));

app.use(rateLimit({
  windowMs: 60 * 1000,
  limit: 10
}));

app.get("/", (req, res) => {
  res.send("TUXSAR AI Backend is running!");
});

app.post("/analyze", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64 || !mimeType) {
      return res.status(400).json({
        error: "Image is required"
      });
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
      return res.status(400).json({
        error: "Unsupported image type"
      });
    }

    if (imageBase64.length > 8 * 1024 * 1024) {
      return res.status(413).json({
        error: "Image is too large"
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Gemini key is not configured");
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [{
        role: "user",
        parts: [
          {
            text: "Analyze this Free Fire game account screenshot. Identify only clearly visible bundles, gun skins, EVO skins, emotes and rare items. Do not guess. Return a clear organized list."
          },
          {
            inlineData: {
              mimeType,
              data: imageBase64
            }
          }
        ]
      }]
    });

    res.json({ result: response.text });

  } catch (error) {
    console.error("AI error:", error.message);
    res.status(500).json({
      error: "AI analysis failed. Please try again."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`TUXSAR AI running on port ${PORT}`);
});
