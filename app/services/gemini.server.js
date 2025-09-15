/**
 * Gemini Service
 * Manages interactions with the Google Gemini API
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import AppConfig from "./config.server";
import systemPrompts from "../prompts/prompts.json";

/**
 * Creates a Gemini service instance
 * @param {string} apiKey - Gemini API key
 * @returns {Object} Gemini service with methods for interacting with Gemini API
 */
export function createGeminiService(apiKey = process.env.GEMINI_API_KEY) {
  // Debug logging
  console.log('Creating Gemini service with API key:', apiKey ? 'API key provided' : 'No API key');
  console.log('Environment GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Available' : 'Not available');

  if (!apiKey) {
    console.error('No Gemini API key provided!');
    throw new Error('Authentication failed with Gemini API - Please check your API key in environment variables');
  }

  // Initialize Gemini client
  const genAI = new GoogleGenerativeAI(apiKey);

  /**
   * Streams a conversation with Gemini
   * @param {Object} params - Stream parameters
   * @param {Array} params.messages - Conversation history
   * @param {string} params.promptType - The type of system prompt to use
   * @param {Array} params.tools - Available tools for Gemini
   * @param {Object} streamHandlers - Stream event handlers
   * @param {Function} streamHandlers.onText - Handles text chunks
   * @param {Function} streamHandlers.onMessage - Handles complete messages
   * @param {Function} streamHandlers.onToolUse - Handles tool use requests
   * @returns {Promise<Object>} The final message
   */
  const streamConversation = async ({
    messages,
    promptType = AppConfig.api.defaultPromptType,
    tools
  }, streamHandlers) => {
    // Get system prompt from configuration or use default
    const systemInstruction = getSystemPrompt(promptType);

    // Initialize the model with system instruction and tools
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction,
      tools: tools && tools.length > 0 ? convertToolsForGemini(tools) : undefined
    });

    // Convert message format for Gemini
    const geminiMessages = convertMessagesForGemini(messages);

    // Get the latest user message text
    const latestMessage = geminiMessages[geminiMessages.length - 1];
    const messageText = latestMessage.parts.map(part => part.text).join('');

    try {
      // Send message directly to model (non-streaming for now)
      const result = await model.generateContent(messageText);
      const response = result.response;

      let fullResponse = response.text();
      let toolCalls = [];

      // Send text immediately
      if (fullResponse && streamHandlers.onText) {
        streamHandlers.onText(fullResponse);
      }

      // Check for function calls (tool usage)
      if (response.functionCalls && response.functionCalls.length > 0) {
        toolCalls = response.functionCalls;
      }

      // Create final message in Claude-compatible format
      const finalMessage = {
        role: "assistant",
        content: [],
        stop_reason: toolCalls.length > 0 ? "tool_use" : "end_turn"
      };

      // Add text content if available
      if (fullResponse) {
        finalMessage.content.push({
          type: "text",
          text: fullResponse
        });
      }

      // Add tool calls if available
      for (const toolCall of toolCalls) {
        finalMessage.content.push({
          type: "tool_use",
          id: generateToolUseId(),
          name: toolCall.name,
          input: toolCall.args
        });
      }

      // Call completion handlers
      if (streamHandlers.onMessage) {
        streamHandlers.onMessage(finalMessage);
      }

      if (streamHandlers.onContentBlock) {
        for (const content of finalMessage.content) {
          streamHandlers.onContentBlock(content);
        }
      }

      // Handle tool use requests
      if (streamHandlers.onToolUse && finalMessage.content) {
        for (const content of finalMessage.content) {
          if (content.type === "tool_use") {
            await streamHandlers.onToolUse(content);
          }
        }
      }

      return finalMessage;
    } catch (error) {
      console.error('Error in Gemini streaming:', error);
      throw error;
    }
  };

  /**
   * Gets the system prompt content for a given prompt type
   * @param {string} promptType - The prompt type to retrieve
   * @returns {string} The system prompt content
   */
  const getSystemPrompt = (promptType) => {
    return systemPrompts.systemPrompts[promptType]?.content ||
      systemPrompts.systemPrompts[AppConfig.api.defaultPromptType].content;
  };

  /**
   * Converts Claude message format to Gemini format
   * @param {Array} messages - Messages in Claude format
   * @returns {Array} Messages in Gemini format
   */
  const convertMessagesForGemini = (messages) => {
    return messages.map(message => {
      if (message.role === "user") {
        return {
          role: "user",
          parts: [{ text: typeof message.content === 'string' ? message.content : message.content[0]?.text || '' }]
        };
      } else if (message.role === "assistant") {
        const parts = [];

        if (typeof message.content === 'string') {
          parts.push({ text: message.content });
        } else if (Array.isArray(message.content)) {
          for (const content of message.content) {
            if (content.type === "text") {
              parts.push({ text: content.text });
            } else if (content.type === "tool_use") {
              parts.push({
                functionCall: {
                  name: content.name,
                  args: content.input
                }
              });
            }
          }
        }

        return {
          role: "model",
          parts: parts
        };
      } else if (message.role === "tool") {
        // Handle tool response messages
        return {
          role: "function",
          parts: [{
            functionResponse: {
              name: message.tool_use_id || "unknown_tool",
              response: typeof message.content === 'string' ?
                { result: message.content } :
                message.content
            }
          }]
        };
      }

      return message;
    });
  };

  /**
   * Converts Claude tools format to Gemini format
   * @param {Array} tools - Tools in Claude format
   * @returns {Array} Tools in Gemini format
   */
  const convertToolsForGemini = (tools) => {
    return tools.map(tool => ({
      functionDeclaration: {
        name: tool.name,
        description: tool.description,
        parameters: tool.input_schema
      }
    }));
  };

  /**
   * Generates a unique tool use ID
   * @returns {string} Unique ID for tool use
   */
  const generateToolUseId = () => {
    return `toolu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  return {
    streamConversation,
    getSystemPrompt
  };
}

export default {
  createGeminiService
};