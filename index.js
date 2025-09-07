const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

/*
 * This script creates a WhatsApp bot that uses Google's Gemini API to
 * generate responses to incoming messages. It uses the `whatsapp-web.js`
 * library to connect to WhatsApp via the web client and authenticate
 * using a QR code. When a message is received, the bot forwards the
 * message text to the Gemini model and replies with the model's output.
 *
 * Before running this script you need to:
 * 1. Copy `.env.example` to `.env` and set `GEMINI_API_KEY` to your
 *    Gemini API key.
 * 2. Install dependencies with `npm install`.
 * 3. Run the script with `node index.js` and scan the QR code in the
 *    terminal using WhatsApp on your phone.
 */

// Initialize the Gemini AI client using the API key from the environment.
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not set in the environment. Please add it to your .env file.');
}
const genAI = new GoogleGenerativeAI(apiKey);

// Configure the model. gemini-pro is a general-purpose model suitable
// for text generation tasks. See Google's API docs for other options.
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Set up the WhatsApp client. LocalAuth will store session data on disk
// so you don’t need to re-scan the QR code on every run.
const client = new Client({
  authStrategy: new LocalAuth()
});

// Display a QR code in the terminal when it's time to authenticate.
client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
  console.log('Scan the QR code above to connect the bot to your WhatsApp account.');
});

// Notify when the client is ready.
client.on('ready', () => {
  console.log('WhatsApp client is ready. Listening for messages...');
});

// Handle incoming messages. For each message, send the content to
// Gemini and reply with the generated text.
client.on('message', async (msg) => {
  const userMessage = msg.body?.trim();
  if (!userMessage) return;

  console.log(`Received message from ${msg.from}: ${userMessage}`);
  try {
    // Generate content using Gemini.
    const result = await model.generateContent(userMessage);
    const response = await result.response;
    const generatedText = response.text();

    // Send the AI-generated response back to the chat.
    await msg.reply(generatedText);
  } catch (err) {
    console.error('Error generating or sending response:', err);
    await msg.reply('מצטערים, הייתה בעיה בטיפול בבקשתך.');
  }
});

// Start the WhatsApp client.
client.initialize();
