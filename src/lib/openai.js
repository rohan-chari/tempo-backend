const OpenAI = require('openai');

let client;

function getOpenAIClient () {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY');
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}

module.exports = getOpenAIClient;

