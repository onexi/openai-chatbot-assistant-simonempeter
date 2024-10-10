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

    // Retrieve all the messages in the thread
    let messages = await openai.beta.threads.messages.list(state.threadId);

    if (!messages.data || messages.data.length === 0) {
      throw new Error('No messages returned from the assistant.');
    }

    // Find the index of the last user message in the message list
    const lastUserMessageIndex = messages.data
      .map(msg => msg.role === 'user' && msg.content === message)
      .lastIndexOf(true);

    // Get the assistant message that comes right after the last user message
    const latestAssistantMessage = messages.data
      .slice(lastUserMessageIndex + 1)
      .find(msg => msg.role === 'assistant');

    if (!latestAssistantMessage) {
      throw new Error('No new assistant message found.');
    }

    // Extract the text value from the assistant's message content, filtering out annotations
    let content = '';
    if (Array.isArray(latestAssistantMessage.content)) {
      latestAssistantMessage.content.forEach(contentItem => {
        if (contentItem.type === 'text' && contentItem.text && contentItem.text.value) {
          // Remove annotations like   using regex
          content += contentItem.text.value.replace(/【.*?】/g, '').trim(); // Regex to remove anything in square brackets
        }
      });
    } else {
      content = latestAssistantMessage.content; // Fallback in case content is not an array
    }

    console.log(`Latest Assistant Message: ${content}`);

    // Keep all messages in state but only return the latest assistant message
    state.messages.push({
      role: 'assistant',
      content: content,
    });

    // Return only the most recent assistant message
    res.json({ messages: [{ role: 'assistant', content: content }] });
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
      let content = '';

      // Check if the content is an array of objects
      if (Array.isArray(msg.content)) {
        msg.content.forEach(contentItem => {
          // Extract only the text value from the content where type is 'text'
          if (contentItem.type === 'text' && contentItem.text && contentItem.text.value) {
            content += contentItem.text.value;  // Append the value
          }
        });
      } else {
        // If the content is not an array (though, it should be in this case)
        content = msg.content;
      }

      // Push the role and content to the result array
      result.push({
        role: msg.role,
        content: content,
      });
    }
  });

  return result;
}


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
