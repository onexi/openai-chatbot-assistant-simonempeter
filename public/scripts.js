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
    writeToMessages(`Assistant ${state.assistant_name} is ready to chat`, 'system', false, true);
    console.log(`Assistant details: ${JSON.stringify(state)}`);
  } else {
    writeToMessages('Error fetching assistant.', 'system', false, true);
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
    writeToMessages('A new thread has been created. Start chatting!', 'system', false, true);
  } else {
    writeToMessages('Error creating thread.', 'system', false, true);
  }
}

async function getResponse() {
  const messageInput = document.getElementById('messageInput');
  const message = messageInput.value;

  // Ensure that a thread has been created before sending a message
  if (!state.threadId) {
    writeToMessages('Error: No thread created. Please create a thread first.', 'system', false, true);
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
          // Parse the assistant's response as Markdown and format accordingly
          const formattedContent = marked.parse(msg.content.replace(/【\d+:\d+†[\w.]+】/g, '')); // Removing citations
          writeToMessages(formattedContent, 'assistant', true);
        }
      });
    } else {
      console.error('No messages returned from the server.');
      writeToMessages('No messages returned from the server.', 'system', false, true);
    }
  } else {
    console.error('Error:', data.error);
    writeToMessages('Error: Unable to send message.', 'system', false, true);
  }
}

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
