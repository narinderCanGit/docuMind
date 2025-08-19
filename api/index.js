import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import OpenAI from "openai";

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file storage
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "uploads");

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// OpenAI client
const client = new OpenAI();

// Embeddings configuration
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large",
});

// Vector store configuration (Qdrant)
const qdrantConfig = {
  url: process.env.QDRANT_URL || "http://localhost:6333",
  collectionName: process.env.COLLECTION_NAME || "docuMind",
};

// Endpoint to save free text
app.post("/api/save-text", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    // Create a simple document from the text
    const docs = [
      {
        pageContent: text,
        metadata: { source: "user-input", timestamp: new Date().toISOString() },
      },
    ];

    // Store in Qdrant
    await QdrantVectorStore.fromDocuments(docs, embeddings, qdrantConfig);

    res.json({ success: true, message: "Text saved successfully" });
  } catch (error) {
    console.error("Error saving text:", error);
    res.status(500).json({ error: "Failed to save text" });
  }
});

// Endpoint to handle file uploads
app.post(
  "/api/upload-document",
  upload.single("document"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const filePath = req.file.path;
      const fileExtension = path.extname(filePath).toLowerCase();
      let docs = [];

      // Process different file types
      if (fileExtension === ".pdf") {
        const loader = new PDFLoader(filePath);
        docs = await loader.load();
      } else if (fileExtension === ".csv") {
        const loader = new CSVLoader(filePath);
        docs = await loader.load();
      } else {
        return res.status(400).json({ error: "Unsupported file type" });
      }

      // Store in Qdrant
      await QdrantVectorStore.fromDocuments(docs, embeddings, qdrantConfig);

      // Clean up the file after processing
      fs.unlinkSync(filePath);

      res.json({
        success: true,
        message: "Document processed and saved successfully",
      });
    } catch (error) {
      console.error("Error processing document:", error);
      res.status(500).json({ error: "Failed to process document" });
    }
  }
);

// Endpoint to process website content
app.post("/api/process-website", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "No URL provided" });
    }

    let docs = [];

    // Check if URL is a PDF
    if (url.toLowerCase().endsWith(".pdf")) {
      const loader = new WebPDFLoader(url);
      docs = await loader.load();
    } else {
      // Otherwise load as a webpage
      const loader = new CheerioWebBaseLoader(url);
      docs = await loader.load();
    }

    // Store in Qdrant
    await QdrantVectorStore.fromDocuments(docs, embeddings, qdrantConfig);

    res.json({
      success: true,
      message: "Website content processed and saved successfully",
    });
  } catch (error) {
    console.error("Error processing website:", error);
    res.status(500).json({ error: "Failed to process website content" });
  }
});

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "No query provided" });
    }

    // Connect to existing vector store
    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      qdrantConfig
    );

    // Create retriever
    const vectorRetriever = vectorStore.asRetriever({
      k: 3, // Number of documents to retrieve
    });

    // Get relevant chunks
    const relevantChunks = await vectorRetriever.invoke(query);

    // Create system prompt with context
    const SYSTEM_PROMPT = `You are an AI assistant that answers questions based on the provided context.
    Only answer based on the available context from the documents.
    
    Context:
    ${JSON.stringify(relevantChunks)}`;

    // Generate response from OpenAI
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: query },
      ],
    });

    res.json({
      answer: response.choices[0].message.content,
      sources: relevantChunks.map((chunk) => ({
        content: chunk.pageContent.substring(0, 150) + "...",
        metadata: chunk.metadata,
      })),
    });
  } catch (error) {
    console.error("Error generating chat response:", error);
    res.status(500).json({ error: "Failed to generate response" });
  }
});

// Serve static assets from the build folder in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../dist/index.html"));
  });
}

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
