import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import OpenAI from "openai";
import { Document } from "@langchain/core/documents";

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

// Function to ensure Qdrant collection exists
const ensureQdrantCollection = async () => {
  try {
    // Try to connect to existing collection, if it fails, create it
    try {
      await QdrantVectorStore.fromExistingCollection(embeddings, qdrantConfig);
    } catch (error) {
      console.log(
        `Creating new Qdrant collection: ${qdrantConfig.collectionName}`
      );
      // Initialize with an empty document to create the collection
      await QdrantVectorStore.fromDocuments(
        [
          {
            pageContent: "DocuMind initialization document",
            metadata: {
              source: "initialization",
              timestamp: new Date().toISOString(),
            },
          },
        ],
        embeddings,
        qdrantConfig
      );
      console.log(
        `Created new Qdrant collection: ${qdrantConfig.collectionName}`
      );
    }
  } catch (error) {
    console.error(`Error ensuring Qdrant collection: ${error.message}`);
    throw error;
  }
};

// Ensure collection exists when server starts
ensureQdrantCollection().catch((error) => {
  console.error(`Failed to initialize Qdrant: ${error.message}`);
});

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
        try {
          const loader = new PDFLoader(filePath);
          docs = await loader.load();
        } catch (pdfError) {
          return res.status(500).json({
            error: "Failed to process PDF file",
            details: pdfError.message,
          });
        }
      } else if (fileExtension === ".csv") {
        try {
          // Read the CSV file content for debugging
          const fileContent = fs.readFileSync(filePath, "utf8");

          // Create a simple document from the CSV content instead of parsing
          docs = [
            new Document({
              pageContent: fileContent,
              metadata: {
                source: req.file.originalname,
                type: "csv",
                timestamp: new Date().toISOString(),
              },
            }),
          ];
        } catch (csvError) {
          return res.status(500).json({
            error: "Failed to process CSV file",
            details: csvError.message,
          });
        }
      } else {
        return res.status(400).json({ error: "Unsupported file type" });
      }

      // Store in Qdrant
      try {
        await QdrantVectorStore.fromDocuments(docs, embeddings, qdrantConfig);
      } catch (storageError) {
        return res.status(500).json({
          error: "Failed to store documents in vector database",
          details: storageError.message,
        });
      }

      // Clean up the file after processing
      fs.unlinkSync(filePath);

      res.json({
        success: true,
        message: "Document processed and saved successfully",
      });
    } catch (error) {
      // If the file exists, try to keep it for debugging
      try {
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
          const debugPath = req.file.path + ".debug";
          fs.copyFileSync(req.file.path, debugPath);
        }
      } catch (fsError) {
        console.error("Error saving debug file:", fsError);
      }

      res.status(500).json({
        error: "Failed to process document",
        details: error.message,
      });
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

    // Validate URL format
    try {
      new URL(url); // This will throw if URL is invalid
    } catch (urlError) {
      return res.status(400).json({
        error: "Invalid URL format",
        details: urlError.message,
      });
    }

    let docs = [];

    // Check if URL is a PDF
    if (url.toLowerCase().endsWith(".pdf")) {
      try {
        const loader = new WebPDFLoader(url);
        docs = await loader.load();
      } catch (pdfError) {
        console.error("PDF loading error:", pdfError);
        return res.status(500).json({
          error: "Failed to process PDF from URL",
          details: pdfError.message,
        });
      }
    } else {
      // Otherwise load as a webpage
      try {
        const loader = new CheerioWebBaseLoader(url);
        docs = await loader.load();
      } catch (webError) {
        console.error("Web loading error:", webError);
        return res.status(500).json({
          error: "Failed to fetch or parse webpage",
          details: webError.message,
        });
      }
    }

    if (!docs || docs.length === 0) {
      return res.status(400).json({
        error: "No content extracted from the provided URL",
        details: "The website might be empty or blocking content extraction",
      });
    }

    // Store in Qdrant
    try {
      await QdrantVectorStore.fromDocuments(docs, embeddings, qdrantConfig);
    } catch (vectorError) {
      console.error("Vector storage error:", vectorError);
      return res.status(500).json({
        error: "Failed to store website content in vector database",
        details: vectorError.message,
      });
    }

    res.json({
      success: true,
      message: "Website content processed and saved successfully",
    });
  } catch (error) {
    console.error("Error processing website:", error);
    res.status(500).json({
      error: "Failed to process website content",
      details: error.message || "Unknown error occurred",
    });
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
      k: 5, // Number of documents to retrieve
    });

    // Get relevant chunks
    const relevantChunks = await vectorRetriever.invoke(query); // Create system prompt with context
    const SYSTEM_PROMPT = `You are an AI assistant that answers questions based on the provided context.
    
    Only answer based on the available context from the documents.
    
    At the end of your response, include a citation indicating the most relevant source for your answer, like this:
    (Source: filename.pdf, page X) or (Source: user-input) or (Source: website URL)
    
    Follow these rules for the source citation:
    1. Include only ONE source - the most relevant one
    2. Always place it at the very end of your answer
    3. Always use the format (Source: [details])
    4. If the source is a file path, only include the filename, not the full path
    5. The citation must be on the same line as the end of your answer
    
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
    });
  } catch (error) {
    console.error("Error generating chat response:", error);
    res.status(500).json({
      error: "Failed to generate response",
      details: error.message,
    });
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
