// Initiate the state object with the assistant_id and threadId as null and an empty array for messages
let state = {
  assistant_id: null,
  assistant_name: null,
  threadId: null,
  messages: [],
};

async function getAssistant() {
  const name = document.getElementById('assistant_name').value;
  const idField = document.getElementById('assistant_id');

  if (!name) {
    writeToMessages('Please enter an assistant name.');
    return;
  }

  try {
    const response = await fetch('/api/assistants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: name }),
    });

    const data = await response.json();

    if (response.ok) {
      // Update state and populate the ID field with the assistant's ID
      state.assistant_id = data.assistant_id;
      state.assistant_name = data.assistant_name;
      idField.value = data.assistant_id;

      writeToMessages(`Assistant ${data.assistant_name} is ready to chat`);
      console.log(`Assistant retrieved: ${JSON.stringify(data)}`);
    } else {
      writeToMessages('Error fetching assistant.');
    }
  } catch (error) {
    console.error('Error fetching assistant:', error);
    writeToMessages('Error fetching assistant.');
  }
}


async function getThread() {
  try {
    const response = await fetch('/api/threads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok && data.threadId) {
      state.threadId = data.threadId;
      console.log(`New thread created with ID: ${state.threadId}`);
      writeToMessages('A new thread has been created. Start chatting!');

      // Update the Thread ID field with the newly created thread ID
      document.getElementById('thread_id').value = state.threadId;
    } else {
      writeToMessages('Error creating thread.');
      console.error('Error creating thread:', data.error);
    }
  } catch (error) {
    console.error('Error fetching thread:', error);
    writeToMessages('Error creating thread.');
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

    if (response.ok) {
      if (data.message) {
        console.log(`Assistant Response: ${data.message}`);

        // Display the assistant's message
        writeToMessages(marked.parse(data.message), 'assistant');

        // Update the Agent Context Window with the exact console message
        const agentContext = document.getElementById("agent_context");
        agentContext.value = JSON.stringify([{ role: 'assistant', content: data.message }], null, 2);
        agentContext.scrollTop = agentContext.scrollHeight; // Auto-scroll to the bottom

        // Update the Current Run ID
        if (data.run_id) {
          runIdField.value = data.run_id; // Display the run_id
        }
      } else {
        console.error('No messages returned from the server.');
        writeToMessages('No messages returned from the server.', 'assistant');
      }
    } else {
      console.error('Error:', data.error);
      writeToMessages('Error: Unable to send message.', 'assistant');
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


function writeToMessages(message, role = 'system') {
  const messageContainer = document.getElementById("message-container");
  const newMessage = document.createElement("div");

  // Apply different classes based on the role
  if (role === 'system') {
    newMessage.classList.add('system-message');
    newMessage.textContent = message; // Use plain text for system messages
  } else {
    newMessage.classList.add('message-wrapper');

    const messageBox = document.createElement("div");
    messageBox.classList.add('message', role);
    messageBox.innerHTML = marked.parse(message);

    newMessage.appendChild(messageBox);
  }

  messageContainer.appendChild(newMessage);
  messageContainer.scrollTop = messageContainer.scrollHeight;
}


