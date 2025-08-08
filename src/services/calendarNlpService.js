const getOpenAIClient = require('../lib/openai');
const logger = require('../utils/logger');

const SYSTEM_PROMPT = `
You are an expert assistant for a conversational calendar app.  
Given a user's natural language input, you will convert it into a **strict, valid JSON object** that represents the intended calendar operation.  
The user may request to view, add, update, or delete events in their calendar.  
They may also refer to contacts, locations, or recurring events.  

The JSON must follow this structure exactly:

{
  "action": "GET" | "CREATE" | "UPDATE" | "DELETE",  // The calendar operation
  "date": "YYYY-MM-DD" | null,                       // Event date or date to check; null if not specified
  "timeStart": "HH:MM" | null,                       // Start time in 24h format, null if not specified
  "timeEnd": "HH:MM" | null,                         // End time in 24h format, null if not specified
  "title": "string" | null,                          // Event title, e.g. "Lunch with Mom"
  "location": "string" | null,                       // Event location
  "contacts": [ "string", ... ],                     // Names of people involved
  "recurrence": "none" | "daily" | "weekly" | "monthly" | null, // Recurrence rule if any
  "notes": "string" | null,                          // Additional notes or description
  "isPrivate": true | false                          // true if the event should be marked private
}

**Rules:**
- If the user requests to see their schedule, set "action" to "GET".
- If the user requests to add an event, set "action" to "CREATE".
- If the user requests to remove an event, set "action" to "DELETE".
- If the user requests to modify an existing event, set "action" to "UPDATE".
- Parse any date and time mentioned. If missing, set them to null.
- If only a time range is given without a date, assume today's date.
- Extract contacts from the text if possible.
- If a location is specified, put it in "location".
- If recurrence is implied (e.g., "every Monday", "daily", "weekly"), set "recurrence" accordingly.
- "isPrivate" should be true if the request suggests it’s personal (e.g., mentions “private” or “don’t share”).
- Do **not** add any fields not listed above.
- Return **only** the JSON object. No text, no explanation.

This needs to be processed as quickly as possible — under 5 seconds.
`;

async function parseCalendarIntent (userInput, { timeoutMs = 4500 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userInput || '' },
      ],
      temperature: 0.1,
    }, { signal: controller.signal });

    const content = response?.choices?.[0]?.message?.content;
    if (!content) {
      const err = new Error('AI returned no content');
      err.status = 503;
      throw err;
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      const err = new Error('AI returned invalid JSON');
      err.status = 502;
      throw err;
    }

    const requiredKeys = ['action', 'date', 'timeStart', 'timeEnd', 'title', 'location', 'contacts', 'recurrence', 'notes', 'isPrivate'];
    const hasAll = requiredKeys.every(k => Object.prototype.hasOwnProperty.call(parsed, k));
    if (!hasAll) {
      const err = new Error('AI JSON missing required fields');
      err.status = 502;
      throw err;
    }

    return parsed;
  } catch (error) {
    logger.error('Calendar NLP parse failed:', error);
    if (error.status) throw error;
    if (error.name === 'AbortError') {
      const err = new Error('AI request timed out');
      err.status = 504;
      throw err;
    }
    const status = error.response?.status;
    const norm = new Error(error.message || 'AI request failed');
    norm.status = status || 500;
    throw norm;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { parseCalendarIntent };

