// State object initialization
let state = {
  assistant_id: null,
  assistant_name: null,
  threadId: null,
  messages: [],
};

// Function to get the assistant
async function getAssistant() {
  let name = document.getElementById('assistant_name').value;
  console.log(`Fetching assistant with name: ${name}`);
  const response = await fetch('/api/assistants', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: name }),
  });

  state = await response.json(); // Update state with the assistant details

  if (state.assistant_name && state.assistant_id) {
    writeToMessages(`Assistant ${state.assistant_name} is ready to chat`, 'system', false, true);
    console.log(`Assistant details: ${JSON.stringify(state)}`);

    // Display the assistant_id in the respective field
    document.getElementById('assistant_id').value = state.assistant_id;
  } else {
    writeToMessages('Error fetching assistant.', 'system', false, true);
  }
}

// Function to create a new thread
async function getThread() {
  const response = await fetch('/api/threads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (data.threadId) {
    state.threadId = data.threadId;
    console.log(`New thread created with ID: ${state.threadId}`);
    writeToMessages('A new thread has been created. Start chatting!', 'system', false, true);

    // Display the threadId in the respective field
    document.getElementById('thread_id').value = state.threadId;
  } else {
    writeToMessages('Error creating thread.', 'system', false, true);
  }
}

// Initialize visibility settings when the page loads
window.onload = function () {
  const sendBtn = document.getElementById('sendBtn');
  const loadingDollar = document.getElementById('loadingDollar');

  // Make sure the "Send" button is visible and the rotating dollar is hidden
  sendBtn.style.display = 'inline-block';
  loadingDollar.style.display = 'none';
};

// Function to get the assistant's response
async function getResponse() {
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const loadingDollar = document.getElementById('loadingDollar');
  const runIdField = document.getElementById('run_id');
  const message = messageInput.value;

  if (!message) {
    return;
  }

  // Display user message immediately
  writeToMessages(message, 'user');
  messageInput.value = ''; // Clear the input field

  // Show the rotating dollar sign container and hide the Send button
  sendBtn.style.display = 'none';
  loadingDollar.style.display = 'flex'; // Make the dollar sign container visible

  // Ensure that a thread has been created before sending a message
  if (!state.threadId) {
    await getThread();

    if (!state.threadId) {
      writeToMessages('Error: No thread created. Please try again.', 'assistant');
      sendBtn.style.display = 'inline-block';
      loadingDollar.style.display = 'none';
      return;
    }
  }

  try {
    const response = await fetch('/api/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: message }),
    });

    const data = await response.json();

    console.log('Server Response:', data); // Debugging line to check the response structure

    if (
      response.ok &&
      Array.isArray(data.message) &&
      data.message.length > 0 &&
      data.message[0].text &&
      Array.isArray(data.message[0].text.value) &&
      data.message[0].text.value.length > 0 &&
      data.message[0].text.value[0].text &&
      typeof data.message[0].text.value[0].text.value === 'string'
    ) {
      // Extract the text content from the nested structure
      let content = data.message[0].text.value[0].text.value;
      content = content.replace(/【\d+:\d+†[\w.]+】/g, ''); // Remove citations if any
      writeToMessages(marked.parse(content), 'assistant', true);

      // Update the Current Run ID
      if (data.run_id) {
        state.run_id = data.run_id; // Update the state with the run_id
        runIdField.value = state.run_id; // Display the run_id
      }
    } else {
      console.error('No valid message returned from the server.');
      writeToMessages('No valid message returned from the server.', 'assistant');
    }
  } catch (error) {
    console.error('Error fetching response:', error);
    writeToMessages('Error: Unable to communicate with the assistant.', 'assistant');
  } finally {
    // Show the Send button and hide the rotating dollar sign container
    sendBtn.style.display = 'inline-block';
    loadingDollar.style.display = 'none';
  }
}


// Function to write messages to the chat window
function writeToMessages(message, role, isHTML = false, isSystemMessage = false) {
  const messageContainer = document.getElementById("message-container");

  if (isSystemMessage) {
    // Handle system messages
    const systemMessage = document.createElement("div");
    systemMessage.textContent = message;
    systemMessage.style.color = '#cccccc'; // Match the color of placeholders
    systemMessage.style.fontStyle = 'italic'; // Italicize the text
    systemMessage.style.marginBottom = '10px';
    messageContainer.appendChild(systemMessage);
  } else {
    // Handle user and assistant messages
    const messageWrapper = document.createElement("div");
    messageWrapper.classList.add("message-wrapper");

    const newMessage = document.createElement("div");
    newMessage.classList.add("message");

    if (isHTML) {
      newMessage.innerHTML = message; // Render as HTML for Markdown formatting
    } else {
      newMessage.textContent = message;
    }

    if (role === "user") {
      newMessage.classList.add("user");
    } else {
      newMessage.classList.add("assistant");
    }

    messageWrapper.appendChild(newMessage);
    messageContainer.appendChild(messageWrapper);
  }

  messageContainer.scrollTop = messageContainer.scrollHeight; // Auto-scroll to the bottom
}
