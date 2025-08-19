import 'dotenv/config';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";


async function init() {
  const pdfPath = "./assets/nodejs.pdf";
  const loader = new PDFLoader(pdfPath);
  const docs = await loader.load();

  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large"
  });

  const vectorStore = await QdrantVectorStore.fromDocuments(docs, embeddings, {
    url: 'http://localhost:6333',
    collectionName: "docuMind",
  });

  console.log('Indexing complete. Vector store ready to use.');
}

init();