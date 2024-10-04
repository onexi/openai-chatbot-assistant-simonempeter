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

// Route to get the assistant by its assistant_id
app.post('/api/assistants', async (req, res) => {
  let assistant_id = req.body.name;

  try {
    console.log('Fetching assistant with ID:', assistant_id);  // Log the assistant_id

    // Fetch the assistant by its ID
    let myAssistant = await openai.beta.assistants.retrieve(assistant_id);
    console.log('Retrieved Assistant:', myAssistant);  // Log the assistant object

    // Update state with the assistant details
    state.assistant_id = myAssistant.id;
    state.assistant_name = myAssistant.name;

    res.status(200).json(state);
  } catch (error) {
    console.error('Error fetching assistant:', error);  // Log the error
    res.status(500).json({ error: 'Failed to fetch assistant' });
  }
});


// Route to create a new Thread
app.post('/api/threads', async (req, res) => {
  try {
    // Create a new thread
    let response = await openai.beta.threads.create();

    // Ensure the response contains a valid thread ID
    if (response && response.id) {
      state.threadId = response.id;
      console.log(`Thread created with ID: ${state.threadId}`);

      // Reset messages for the new thread
      state.messages = [];

      res.json({ threadId: state.threadId });
    } else {
      throw new Error('Thread creation failed. No ID returned.');
    }
  } catch (error) {
    console.error('Error creating thread:', error);
    res.status(500).json({ error: 'Failed to create thread' });
  }
});

// Route to send a message and run the Assistant
app.post('/api/run', async (req, res) => {
  const { message } = req.body;

  // Check if we have a valid thread ID
  if (!state.threadId) {
    return res.status(400).json({ error: 'No thread ID found. Please create a thread first.' });
  }

  // Push the user message to the state
  state.messages.push({ role: 'user', content: message });

  try {
    // Send the user's message to the thread
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

    if (!messages.data || messages.data.length === 0) {
      throw new Error('No messages returned from the assistant.');
    }

    // Extract and return all relevant messages
    let all_messages = get_all_messages(messages.data);
    console.log(`Run Finished: ${JSON.stringify(all_messages)}`);

    res.json({ messages: all_messages });
  } catch (error) {
    console.error('Error running assistant:', error);
    res.status(500).json({ error: 'Failed to run assistant' });
  }
});

// Helper function to retrieve all messages
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
