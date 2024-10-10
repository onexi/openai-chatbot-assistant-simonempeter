[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/ZjtTJ8eb)
# PS03OpenAIAssistantChatBot
### create a .env file and put in your OPENAI_API_KEY

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Banking Assistant Chatbot
## Simone Peter (smpeter) - MIT 1.125 Architecting and Engineering Software Systems

This website serves as an interface for a chatbot powered by an OpenAI assistant. The chatbot is designed to interact with users by answering questions or providing information about banking-related topics. The web application allows users to interact with the assistant in a conversational manner, managing chat threads, sending messages, and displaying responses in a user-friendly interface.

## Features

- **Assistant Selection**: Users can select a specific assistant by its ID to interact with.
- **Create New Thread**: A new conversation thread can be created, resetting the chat history.
- **Send Messages**: Users can input text messages, which will be sent to the assistant for a response.
- **Display Assistant Responses**: The assistant's responses are displayed in the chat window using Markdown formatting.
- **Context Window**: The full conversation log is shown in the Agent Context Window for reference.
- **Rotating Indicator**: While the assistant processes the request, a rotating dollar sign appears, indicating the assistant is working.

## Getting Started

### Prerequisites

- Node.js installed on your local machine
- An OpenAI API key

### Setup

1. **Clone the repository** to your local machine.

2. **Navigate to the project directory**.

3. **Install dependencies** by running:

    ```bash
    npm install
    ```

4. **Create a `.env` file** in the root directory and add your OpenAI API key:

    ```
    OPENAI_API_KEY=your_openai_api_key_here
    ```

5. **Start the server**:

    ```bash
    node server.js
    ```

6. **Access the website**:

    Open a web browser and navigate to `http://localhost:3000`.

## How to Use

1. **Selecting an Assistant**

    - Enter the Assistant Name and click **Get Assistant**. The assistant's ID will be displayed.

2. **Creating a New Thread**

    - Click on the **Create New Thread** button. The thread ID will be displayed.

3. **Sending a Message**

    - Type a message and click **Send**. Your message will appear in the chat window.
    - A rotating dollar sign indicates the assistant is processing your request.
    - The assistant's response will appear in the chat window.

4. **Viewing Conversation History**

    - The Agent Context Window displays the full conversation log in JSON format.

## Additional Information

- The **Run ID** of the latest conversation is displayed after sending a message.
- System messages like *"Assistant is ready to chat"* and *"New thread created"* appear in a light grey italic font.

## Technologies Used

- **Node.js** and **Express** for server-side implementation
- **OpenAI API** for assistant capabilities
- **Bootstrap** for front-end design
- **Marked.js** for Markdown rendering

## Troubleshooting

- Ensure the OpenAI API key is correctly set in the `.env` file.
- Check the console for error messages if the assistant doesn't respond.
- Verify your internet connection and OpenAI API accessibility if issues persist.

## License

This project is licensed under the MIT License.


