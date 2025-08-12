const getOpenAIClient = require('../lib/openai');
const logger = require('../utils/logger');

const SYSTEM_PROMPT = `You are an expert assistant for a conversational calendar app. Convert user input into a strict JSON object representing calendar operations.

JSON structure:
{
"action": "GET"|"CREATE"|"UPDATE"|"DELETE",
"startDate": "YYYY-MM-DD"|null,
"endDate": "YYYY-MM-DD"|null,
"timeStart": "HH:MM"|null,
"timeEnd": "HH:MM"|null,
"title": "string"|null,
"location": "string"|null,
"contacts": ["string",...],
"contactDetails": [
  {
    "id": "string",
    "name": "string", 
    "emails": ["string"],
    "phoneNumbers": ["string"]
  }
],
"recurrence": "none"|"daily"|"weekly"|"monthly"|null,
"notes": "string"|null,
"isPrivate": true|false
}

Rules:
- GET=view schedule, CREATE=add event, UPDATE=modify event, DELETE=remove event
- Single date: set both startDate and endDate to the same date
- Date range: set both startDate and endDate to different dates
- ALWAYS provide both startDate and endDate (never leave endDate as null)
- No time specified: timeStart="00:00", timeEnd="23:59"
- "this weekend"=Saturday to Sunday current week
- "next weekend"=Saturday to Sunday next week
- "today"=current date, "tomorrow"=next day
- "this week"=Monday to Sunday current week
- "next week"=Monday to Sunday next week
- IMPORTANT: When user says "tomorrow" or "tomorrow evening", calculate the actual date (current date + 1 day)
- For "tomorrow evening" use timeStart="18:00", timeEnd="20:00" unless specific time given
- For "tomorrow morning" use timeStart="09:00", timeEnd="11:00" unless specific time given
- For "tomorrow afternoon" use timeStart="12:00", timeEnd="17:00" unless specific time given
- Default duration: If only start time is specified without end time, set duration to 1 hour (e.g., if timeStart="14:00", set timeEnd="15:00")
- Event titles: Be creative and descriptive based on context. Examples:
  * "dinner with rohit" → "Dinner with Rohit"
  * "lunch meeting" → "Lunch Meeting"
  * "coffee chat" → "Coffee Chat"
  * "team sync" → "Team Sync"
  * "doctor appointment" → "Doctor Appointment"
  * "movie night" → "Movie Night"
  * "gym session" → "Gym Session"
  * "date night" → "Date Night"
  * "client call" → "Client Call"
  * "family dinner" → "Family Dinner"
- Notes: Only use for actual event-related notes like "bring laptop", "prepare agenda", "dress code: formal"
- Do NOT put casual comments, contact descriptions, or personal remarks in notes
- Examples of what NOT to put in notes: "she's cute", "he's funny", "love this person", etc.
- If unsure, leave notes as null
- Extract contacts from user input (e.g., "@rohit", "with John", "meeting with Sarah")
- For contacts: extract names mentioned in the message
- contactDetails should contain full contact objects with id, name, emails, phoneNumbers if available
- Extract location, recurrence if mentioned
- isPrivate=true if "private" or "don't share" mentioned
- Return only JSON object, no text or explanation.`;

async function parseCalendarIntent (userInput, { timeoutMs = 10000, contacts = [] } = {}) {
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

    // Get current date/time context
    const now = new Date();
    const today = now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    // Add contacts context if available
    const contactsContext = contacts.length > 0 
      ? `\nAvailable contacts: ${JSON.stringify(contacts, null, 2)}`
      : '';

    const requestPayload = {
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: `Today's date and time: ${today} at ${currentTime}${contactsContext}` },
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
      today,
      currentTime,
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

    const requiredKeys = ['action', 'startDate', 'timeStart', 'timeEnd', 'title', 'location', 'contacts', 'contactDetails', 'recurrence', 'notes', 'isPrivate'];
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

    // Ensure endDate is always set - if null, use same as startDate
    if (!parsed.endDate && parsed.startDate) {
      parsed.endDate = parsed.startDate;
    }

    // Validate that we have both startDate and endDate
    if (!parsed.startDate || !parsed.endDate) {
      logger.error('Missing startDate or endDate after processing', {
        startDate: parsed.startDate,
        endDate: parsed.endDate,
        parsedContent: parsed,
      });
      const err = new Error('Missing required date fields');
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

