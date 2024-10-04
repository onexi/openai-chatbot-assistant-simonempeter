// Initiate the state object with the assistant_id and threadId as null and an empty array for messages
let state = {
  assistant_id: null,
  assistant_name: null,
  threadId: null,
  messages: [],
};

async function getAssistant() {
  let name = document.getElementById('assistant_name').value;
  console.log(`assistant_id: ${name}`);
  const response = await fetch('/api/assistants', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: name }),
  });
  
  state = await response.json();  // Update state with the assistant details
  
  if (state.assistant_name) {
    writeToMessages(`Assistant ${state.assistant_name} is ready to chat`);
    await getThread()
    console.log(`back from fetch with state: ${JSON.stringify(state)}`);
  } else {
    writeToMessages('Error fetching assistant.');
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
    writeToMessages('A new thread has been created. Start chatting!');
  } else {
    writeToMessages('Error creating thread.');
  }
}

async function getResponse() {
  const message = document.getElementById('messageInput').value;
  
  // Ensure that a thread has been created before sending a message
  if (!state.threadId) {
    writeToMessages('Error: No thread created. Please try again.');
    return;
  }

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

      // Display user message
      writeToMessages(`You: ${message}`);

      // Display assistant messages
      data.messages.forEach((msg) => {
        if (msg.role === 'assistant') {
          writeToMessages(`Assistant: ${msg.content}`);
        }
      });
    } else {
      console.error('No messages returned from the server.');
      writeToMessages('No messages returned from the server.');
    }
  } else {
    console.error('Error:', data.error);
    writeToMessages('Error: Unable to send message.');
  }
}

function writeToMessages(message) {
  const messageContainer = document.getElementById("message-container");
  const newMessage = document.createElement("div");
  newMessage.textContent = message;

  if (message.startsWith("You:")) {
    newMessage.classList.add("message", "user");
  } else {
    newMessage.classList.add("message", "assistant");
  }

  messageContainer.appendChild(newMessage);
  messageContainer.scrollTop = messageContainer.scrollHeight;  // Auto-scroll to the bottom
}
