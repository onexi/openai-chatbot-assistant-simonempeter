// Load environment variables
import dotenv from 'dotenv';
dotenv.config();
import OpenAI from 'openai';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files from the 'public' directory

// State dictionary
let state = {
  assistant_id: null,
  assistant_name: null,
  threadId: null,
  run_id: null,
  messages: [],
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Get list of Assistants and retrieve the one by its assistant_id
app.post('/api/assistants', async (req, res) => {
  let assistant_id = req.body.name;
  console.log('Fetching assistant with ID:', assistant_id);

  try {
    const response = await openai.beta.assistants.list({
      order: "desc",
      limit: 20,
    });
    let myAssistant = await openai.beta.assistants.retrieve(assistant_id);

    state.assistant_id = myAssistant.id;
    state.assistant_name = myAssistant.name;

    res.status(200).json(state);
  } catch (error) {
    console.error('Error fetching assistant:', error);
    res.status(500).json({ error: 'Failed to fetch assistant' });
  }
});

// Create a new thread
app.post('/api/threads', async (req, res) => {
  try {
    let response = await openai.beta.threads.create();
    state.threadId = response.id;

    // Reset messages for the new thread
    state.messages = [];

    res.json({ threadId: state.threadId });
  } catch (error) {
    console.error('Error creating thread:', error);
    res.status(500).json({ error: 'Failed to create thread' });
  }
});

// Run the Assistant, Poll for Completion, and Get Responses
app.post('/api/run', async (req, res) => {
  const { message } = req.body;

  // Push the user message to the state
  state.messages.push({ role: 'user', content: message });

  try {
    // Send the user's message
    await openai.beta.threads.messages.create(state.threadId, {
      role: "user",
      content: message,
    });

    // Run the thread and poll for the assistant's response
    let run = await openai.beta.threads.runs.createAndPoll(state.threadId, {
      assistant_id: state.assistant_id,
    });

    state.run_id = run.id;

    // Retrieve all the messages in the thread
    let messages = await openai.beta.threads.messages.list(state.threadId);

    // Extract and return all relevant messages
    let all_messages = get_all_messages(messages.data);
    console.log(`Run Finished: ${JSON.stringify(all_messages)}`);

    res.json({ messages: all_messages });
  } catch (error) {
    console.error('Error running assistant:', error);
    res.status(500).json({ error: 'Failed to run assistant' });
  }
});

// Helper function to retrieve all messages from the thread
function get_all_messages(messages) {
  let result = [];

  messages.forEach((msg) => {
    if (msg.role === 'user' || msg.role === 'assistant') {
      result.push({
        role: msg.role,
        content: msg.content,
      });
    }
  });

  return result;
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
