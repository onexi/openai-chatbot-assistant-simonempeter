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
  messages: [], // Store all conversation messages here
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Route to get the assistant by its assistant_id
app.post('/api/assistants', async (req, res) => {
  const assistantName = req.body.name;

  try {
    console.log('Fetching assistant with name:', assistantName);

    // Get the list of assistants
    const assistants = await openai.beta.assistants.list({
      limit: 50, // Adjust as necessary to match the number of assistants you have
    });

    // Find the assistant by name
    const assistant = assistants.data.find(a => a.name.toLowerCase() === assistantName.toLowerCase());

    if (!assistant) {
      return res.status(404).json({ error: 'Assistant not found' });
    }

    console.log('Retrieved Assistant:', assistant);

    // Update state with the assistant details
    state.assistant_id = assistant.id;
    state.assistant_name = assistant.name;

    res.status(200).json({
      assistant_id: assistant.id,
      assistant_name: assistant.name,
    });
  } catch (error) {
    console.error('Error fetching assistant:', error);
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

      // Respond with the thread ID
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

    // Retrieve the most recent messages in the thread, ordered by time
    let messages = await openai.beta.threads.messages.list(state.threadId, {
      order: 'asc', // Ensures messages are returned in chronological order
    });

    if (!messages.data || messages.data.length === 0) {
      throw new Error('No messages returned from the assistant.');
    }

    // Find the most recent assistant message
    const latestAssistantMessage = messages.data
      .filter(msg => msg.role === 'assistant')
      .slice(-1)[0]; // Get the last assistant message

    if (!latestAssistantMessage) {
      throw new Error('No assistant response found.');
    }

    // Push the assistant's response to the state messages
    state.messages.push({ role: 'assistant', content: latestAssistantMessage.content });

    // Return only the most recent assistant message
    res.json({
      message: [{ text: { value: latestAssistantMessage.content }, type: 'text' }],
      run_id: state.run_id,
    });
  } catch (error) {
    console.error('Error running assistant:', error);
    res.status(500).json({ error: 'Failed to run assistant' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
