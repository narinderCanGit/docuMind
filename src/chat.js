import 'dotenv/config';
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import OpenAI from 'openai';

const client = new OpenAI();

async function chat() {
  const userQuery = 'Can you tell me add two numbers code?';
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large"
  });

  const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
    url: 'http://localhost:6333',
    collectionName: "docuMind",
  });

  const vectorRetriver = vectorStore.asRetriever({
    k: 3,
  });

  const relevantChunks = await vectorRetriver.invoke(userQuery);

  const SYSTEM_PROMPT = `You are an AI assistant that answers questions based on the provided context available to you from a PDF file with the content and page number.
  Only answer based on the available context from file.
  
  Context:
  ${JSON.stringify(relevantChunks)}`;

  const response = await client.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userQuery }
    ],
  });

  console.log('Response:', response.choices[0].message.content);
}

chat();