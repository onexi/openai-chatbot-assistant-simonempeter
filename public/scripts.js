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
    } else {
      writeToMessages('Error creating thread.');
      console.error('Error creating thread:', data.error);
    }
  } catch (error) {
    console.error('Error fetching thread:', error);
    writeToMessages('Error creating thread.');
  }
}


async function getResponse() {
  const messageInput = document.getElementById('messageInput');
  const message = messageInput.value;

  // Ensure that a thread has been created before sending a message
  if (!state.threadId) {
    // Try to create a new thread
    await getThread();

    // If still no thread, display an error message
    if (!state.threadId) {
      writeToMessages('Error: No thread created. Please try again.');
      return;
    }
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

      // Clear the input field after the message is sent
      messageInput.value = '';

      // Display assistant's latest message
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
