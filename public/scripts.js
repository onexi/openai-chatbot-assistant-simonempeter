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


async function getResponse() {
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const runIdField = document.getElementById('run_id');
  const message = messageInput.value;

  if (!message) {
    return;
  }

  // Display user message immediately
  writeToMessages(message, 'user');
  messageInput.value = ''; // Clear the input field

  // Show the loading spinner and hide the Send button
  sendBtn.style.display = 'none';
  loadingSpinner.style.display = 'inline-block';

  // Ensure that a thread has been created before sending a message
  if (!state.threadId) {
    await getThread();

    if (!state.threadId) {
      writeToMessages('Error: No thread created. Please try again.', 'assistant');
      sendBtn.style.display = 'inline-block';
      loadingSpinner.style.display = 'none';
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
      if (data.messages) {
        console.log(`Messages: ${JSON.stringify(data.messages)}`);

        // Display assistant's latest message with Markdown formatting
        let assistantResponseFound = false;
        data.messages.forEach((msg) => {
          if (msg.role === 'assistant') {
            // Remove citations like "【number:number†source】" from the message content
            const filteredContent = msg.content.replace(/【\d+:\d+†source】/g, '');
            writeToMessages(marked.parse(filteredContent), 'assistant', true);
            assistantResponseFound = true;
          }
        });

        // Update the Agent Context Window with the exact console message only if an assistant response was found
        if (assistantResponseFound) {
          const agentContext = document.getElementById("agent_context");
          agentContext.value = JSON.stringify(data.messages, null, 2); // Format JSON for readability
          agentContext.scrollTop = agentContext.scrollHeight; // Auto-scroll to the bottom
        }

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
    // Show the Send button and hide the loading spinner
    sendBtn.style.display = 'inline-block';
    loadingSpinner.style.display = 'none';
  }
}

function writeToMessages(message, role, isHTML = false) {
  const messageContainer = document.getElementById("message-container");
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
  messageContainer.scrollTop = messageContainer.scrollHeight; // Auto-scroll to the bottom
}
