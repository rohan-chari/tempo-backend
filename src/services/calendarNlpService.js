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
- "isPrivate" should be true if the request suggests it's personal (e.g., mentions "private" or "don't share").
- Do **not** add any fields not listed above.
- Return **only** the JSON object. No text, no explanation.

This needs to be processed as quickly as possible — under 5 seconds.
`;

async function parseCalendarIntent (userInput, { timeoutMs = 4500 } = {}) {
  const startTime = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // Log the incoming request
  logger.info('Calendar NLP request started', {
    userInput,
    timeoutMs,
    timestamp: new Date().toISOString(),
  });

  try {
    const openai = getOpenAIClient();
    logger.info('OpenAI client initialized, making API request');

    // Compute current datetime context for the model
    const now = new Date();
    const nowIso = now.toISOString();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const requestPayload = {
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: `Current datetime: ${nowIso} (${dayOfWeek}) [Timezone: ${timeZone}]` },
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userInput || '' },
      ],
      temperature: 0.1,
    };

    logger.info('OpenAI API request payload', {
      model: requestPayload.model,
      responseFormat: requestPayload.response_format,
      temperature: requestPayload.temperature,
      userMessageLength: userInput?.length || 0,
      systemPromptLength: SYSTEM_PROMPT.length,
      nowIso,
      dayOfWeek,
      timeZone,
    });

    const response = await openai.chat.completions.create(requestPayload, { signal: controller.signal });

    // Log the raw OpenAI response
    logger.info('OpenAI API response received', {
      responseId: response?.id,
      model: response?.model,
      usage: response?.usage,
      choicesCount: response?.choices?.length || 0,
      finishReason: response?.choices?.[0]?.finish_reason,
      contentLength: response?.choices?.[0]?.message?.content?.length || 0,
    });

    const content = response?.choices?.[0]?.message?.content;
    if (!content) {
      logger.error('OpenAI returned empty content', {
        responseId: response?.id,
        choices: response?.choices,
      });
      const err = new Error('AI returned no content');
      err.status = 503;
      throw err;
    }

    // Log the raw content from OpenAI
    logger.info('OpenAI raw content', {
      content,
      contentLength: content.length,
      first100Chars: content.substring(0, 100),
    });

    let parsed;
    try {
      parsed = JSON.parse(content);
      logger.info('OpenAI content parsed successfully', {
        parsedKeys: Object.keys(parsed),
        parsedValues: parsed,
      });
    } catch (e) {
      logger.error('OpenAI returned invalid JSON', {
        content,
        parseError: e.message,
      });
      const err = new Error('AI returned invalid JSON');
      err.status = 502;
      throw err;
    }

    const requiredKeys = ['action', 'date', 'timeStart', 'timeEnd', 'title', 'location', 'contacts', 'recurrence', 'notes', 'isPrivate'];
    const hasAll = requiredKeys.every(k => Object.prototype.hasOwnProperty.call(parsed, k));

    // Log validation results
    logger.info('Calendar intent validation', {
      requiredKeys,
      parsedKeys: Object.keys(parsed),
      hasAllRequiredKeys: hasAll,
      missingKeys: requiredKeys.filter(k => !Object.prototype.hasOwnProperty.call(parsed, k)),
    });

    if (!hasAll) {
      logger.error('OpenAI JSON missing required fields', {
        requiredKeys,
        parsedKeys: Object.keys(parsed),
        missingKeys: requiredKeys.filter(k => !Object.prototype.hasOwnProperty.call(parsed, k)),
        parsedContent: parsed,
      });
      const err = new Error('AI JSON missing required fields');
      err.status = 502;
      throw err;
    }

    const responseTime = Date.now() - startTime;
    logger.info('Calendar NLP request completed successfully', {
      userInput,
      parsedIntent: parsed,
      responseTime,
    });

    return parsed;
  } catch (error) {
    // Enhanced error logging
    logger.error('Calendar NLP parse failed', {
      userInput,
      error: {
        message: error.message,
        name: error.name,
        status: error.status,
        stack: error.stack,
      },
      openaiError: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      } : null,
    });

    if (error.status) throw error;
    if (error.name === 'AbortError') {
      logger.warn('Calendar NLP request timed out', {
        userInput,
        timeoutMs,
      });
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

