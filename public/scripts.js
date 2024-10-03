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
  state = await response.json(); // Update state with the assistant details
  writeToMessages(`Assistant ${state.assistant_name} is ready to chat`);
  console.log(`back from fetch with state: ${JSON.stringify(state)}`);
}

async function getThread() {
  const response = await fetch('/api/threads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  state.threadId = data.threadId;
  console.log(`New thread created with ID: ${state.threadId}`);
  writeToMessages('A new thread has been created. Start chatting!');
}

async function getResponse() {
  const message = document.getElementById('messageInput').value;

  // Send the user's message to the server
  const response = await fetch('/api/run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: message }),
  });

  const data = await response.json();
  console.log(`Messages: ${JSON.stringify(data.messages)}`);

  // Update the UI with user and assistant messages
  writeToMessages(`You: ${message}`);
  data.messages.forEach((msg) => {
    if (msg.role === 'assistant') {
      writeToMessages(`Assistant: ${msg.content}`);
    }
  });
}

async function writeToMessages(message) {
  const messageContainer = document.getElementById("message-container");
  const newMessage = document.createElement("div");
  newMessage.textContent = message;

  if (message.startsWith("You:")) {
    newMessage.classList.add("message", "user");
  } else {
    newMessage.classList.add("message", "assistant");
  }

  messageContainer.appendChild(newMessage);
  messageContainer.scrollTop = messageContainer.scrollHeight; // Auto-scroll to the bottom
}
