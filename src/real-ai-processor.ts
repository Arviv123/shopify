import axios from 'axios';

export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'gemini';
  apiKey: string;
  model: string;
}

export interface FlightQuery {
  userMessage: string;
  context?: any;
}

export interface AIResponse {
  success: boolean;
  response?: string;
  searchParams?: any;
  error?: string;
  confidence?: number;
}

export class RealAIProcessor {
  private config: AIConfig;

  constructor() {
    this.config = {
      provider: (process.env.AI_PROVIDER as any) || 'openai',
      apiKey: process.env.AI_API_KEY || '',
      model: process.env.AI_MODEL || 'gpt-3.5-turbo'
    };
  }

  async processFlightQuery(query: FlightQuery): Promise<AIResponse> {
    console.log('🤖 Processing flight query with real AI:', query.userMessage);

    if (!this.config.apiKey) {
      console.log('⚠️ No AI API key configured, using rule-based processing');
      return this.fallbackRuleBasedProcessing(query.userMessage);
    }

    try {
      const prompt = this.buildFlightAnalysisPrompt(query.userMessage);
      let aiResponse: string;

      switch (this.config.provider) {
        case 'openai':
          aiResponse = await this.callOpenAI(prompt);
          break;
        case 'anthropic':
          aiResponse = await this.callAnthropic(prompt);
          break;
        case 'gemini':
          aiResponse = await this.callGemini(prompt);
          break;
        default:
          throw new Error(`Unsupported AI provider: ${this.config.provider}`);
      }

      // Parse AI response to extract flight search parameters
      const parsedResponse = this.parseAIResponse(aiResponse);
      
      return {
        success: true,
        response: parsedResponse.userMessage,
        searchParams: parsedResponse.searchParams,
        confidence: parsedResponse.confidence
      };

    } catch (error: any) {
      console.error('❌ AI processing error:', error.message);
      console.log('🔄 Falling back to rule-based processing');
      return this.fallbackRuleBasedProcessing(query.userMessage);
    }
  }

  private buildFlightAnalysisPrompt(userMessage: string): string {
    return `
You are a professional flight booking assistant AI. Analyze the following user query and extract flight search parameters.

User Query: "${userMessage}"

Please respond in JSON format with the following structure:
{
  "userMessage": "A friendly response in Hebrew explaining what you understood",
  "searchParams": {
    "origin": "TLV",
    "destination": "airport_code_or_null",
    "departureDate": "YYYY-MM-DD_or_null",
    "returnDate": "YYYY-MM-DD_or_null",
    "passengers": number,
    "class": "Economy|Business|First"
  },
  "confidence": 0.0-1.0,
  "needsMoreInfo": boolean,
  "suggestedQuestions": ["question1", "question2"] // if needsMoreInfo is true
}

Guidelines:
1. Default origin is TLV (Tel Aviv)
2. Common destinations in Hebrew:
   - ניו יורק = JFK
   - לונדון = LHR  
   - פריז = CDG
   - רומא = FCO
   - איסטנבול = IST
   - דובאי = DXB
   - פרנקפורט = FRA
   - לוס אנג'לס = LAX

3. Date patterns:
   - מחר = tomorrow
   - עוד שבוע = next week
   - חודש הבא = next month
   
4. Default to Economy class, 1 passenger if not specified
5. Respond in Hebrew for userMessage
6. Set needsMoreInfo=true if essential information is missing

Example response:
{
  "userMessage": "הבנתי שאתם רוצים לטוס לניו יורק! מתי תרצו לטוס?",
  "searchParams": {
    "origin": "TLV",
    "destination": "JFK", 
    "departureDate": null,
    "returnDate": null,
    "passengers": 1,
    "class": "Economy"
  },
  "confidence": 0.8,
  "needsMoreInfo": true,
  "suggestedQuestions": ["מתי תרצו לטוס?", "כמה נוסעים?"]
}
`;
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: this.config.model,
      messages: [
        {
          role: 'system',
          content: 'You are a professional flight booking assistant. Always respond in valid JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    }, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    return response.data.choices[0].message.content;
  }

  private async callAnthropic(prompt: string): Promise<string> {
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: this.config.model,
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3
    }, {
      headers: {
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    return response.data.content[0].text;
  }

  private async callGemini(prompt: string): Promise<string> {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return response.data.candidates[0].content.parts[0].text;
  }

  private parseAIResponse(aiResponse: string): any {
    try {
      // Clean up the response - sometimes AI adds markdown formatting
      const cleanResponse = aiResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^\s*```.*$/gm, '')
        .trim();

      const parsed = JSON.parse(cleanResponse);
      
      // Validate the response structure
      if (!parsed.userMessage || !parsed.searchParams) {
        throw new Error('Invalid AI response structure');
      }

      // Set default confidence if not provided
      parsed.confidence = parsed.confidence || 0.7;

      return parsed;
    } catch (error) {
      console.error('❌ Failed to parse AI response:', error);
      console.log('Raw AI response:', aiResponse);
      
      // Return a basic fallback response
      return {
        userMessage: 'מצטער, לא הצלחתי להבין בדיוק את הבקשה. אנא נסחו מחדש.',
        searchParams: null,
        confidence: 0.1,
        needsMoreInfo: true
      };
    }
  }

  private fallbackRuleBasedProcessing(userMessage: string): AIResponse {
    console.log('🔧 Using rule-based processing for:', userMessage);
    
    const message = userMessage.toLowerCase();
    
    // Simple destination detection
    const destinations: { [key: string]: string } = {
      'ניו יורק': 'JFK',
      'new york': 'JFK',
      'ny': 'JFK',
      'לונדון': 'LHR',
      'london': 'LHR',
      'פריז': 'CDG',
      'paris': 'CDG',
      'רומא': 'FCO',
      'rome': 'FCO',
      'איסטנבול': 'IST',
      'istanbul': 'IST',
      'דובאי': 'DXB',
      'dubai': 'DXB'
    };

    let destination: string | null = null;
    let destinationName = '';
    
    for (const [name, code] of Object.entries(destinations)) {
      if (message.includes(name)) {
        destination = code;
        destinationName = name;
        break;
      }
    }

    // Simple date detection
    let departureDate: string | null = null;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (message.includes('מחר') || message.includes('tomorrow')) {
      departureDate = tomorrow.toISOString().split('T')[0];
    } else if (message.includes('עוד שבוע')) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      departureDate = nextWeek.toISOString().split('T')[0];
    }

    // Passenger count detection
    let passengers = 1;
    const passengerMatch = message.match(/(\d+)\s*(נוסעים|passengers)/);
    if (passengerMatch) {
      passengers = parseInt(passengerMatch[1]);
    }

    // Class detection
    let travelClass = 'Economy';
    if (message.includes('עסקים') || message.includes('business')) {
      travelClass = 'Business';
    } else if (message.includes('ראשונה') || message.includes('first')) {
      travelClass = 'First';
    }

    if (destination) {
      const searchParams = {
        origin: 'TLV',
        destination,
        departureDate,
        returnDate: null,
        passengers,
        class: travelClass
      };

      return {
        success: true,
        response: `הבנתי שאתם רוצים לטוס ל${destinationName}! ${departureDate ? `בתאריך ${departureDate}` : 'מתי תרצו לטוס?'}`,
        searchParams,
        confidence: 0.8
      };
    } else {
      return {
        success: true,
        response: 'לא הצלחתי לזהות יעד ספציפי. אנא ציינו לאן תרצו לטוס (למשל: ניו יורק, לונדון, פריז)',
        searchParams: null,
        confidence: 0.3
      };
    }
  }
}