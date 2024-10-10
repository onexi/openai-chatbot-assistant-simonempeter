// Initiate the state object with the assistant_id and threadId as null and an empty array for messages
let state = {
  assistant_id: null,
  assistant_name: null,
  threadId: null,
  messages: [],
};

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

  if (state.assistant_name) {
    writeToMessages(`Assistant ${state.assistant_name} is ready to chat`, 'system');
    console.log(`Assistant details: ${JSON.stringify(state)}`);
  } else {
    writeToMessages('Error fetching assistant.', 'system');
  }
}

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
    writeToMessages('A new thread has been created. Start chatting!', 'system');
  } else {
    writeToMessages('Error creating thread.', 'system');
  }
}

async function getResponse() {
  const messageInput = document.getElementById('messageInput');
  const message = messageInput.value;

  // Ensure that a thread has been created before sending a message
  if (!state.threadId) {
    writeToMessages('Error: No thread created. Please create a thread first.', 'system');
    return;
  }

  // Display the user's message immediately on the right
  writeToMessages(message, 'user');
  messageInput.value = ''; // Clear the input field

  // Send the message to the server
  const response = await fetch('/api/run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: message }),
  });

  const data = await response.json();

  if (response.ok) {
    if (data.messages) {
      console.log(`Messages: ${JSON.stringify(data.messages)}`);

      // Display assistant messages on the left
      data.messages.forEach((msg) => {
        if (msg.role === 'assistant') {
          writeToMessages(msg.content, 'assistant');
        }
      });
    } else {
      console.error('No messages returned from the server.');
      writeToMessages('No messages returned from the server.', 'system');
    }
  } else {
    console.error('Error:', data.error);
    writeToMessages('Error: Unable to send message.', 'system');
  }
}

function writeToMessages(message, role = 'system') {
  const messageContainer = document.getElementById("message-container");
  const newMessage = document.createElement("div");
  newMessage.textContent = message;

  // Apply different styles based on the role
  if (role === 'user') {
    newMessage.classList.add("message", "user");
  } else if (role === 'assistant') {
    newMessage.classList.add("message", "assistant");
  } else {
    newMessage.classList.add("system-message");
    newMessage.style.color = '#cccccc'; // Light grey for system messages
    newMessage.style.fontStyle = 'italic'; // Italic style for system messages
  }

  messageContainer.appendChild(newMessage);
  messageContainer.scrollTop = messageContainer.scrollHeight; // Auto-scroll to the bottom
}
