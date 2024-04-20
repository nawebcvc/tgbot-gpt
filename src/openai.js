import { OpenAI } from "openai";
import config from "config";
import { createReadStream } from "fs";

class OpenAIService {
  roles = {
    ASSISTANT: "assistant",
    SYSTEM: "system",
    USER: "user",
    TOOL: "tool",
    FUNCTION: "function",
  };

  constructor() {
    this.openAIClient = new OpenAI({ apiKey: config.get("OPENAI_KEY") });
  }

  async chat(messages) {
    try {
      const response = await this.openAIClient.chat.completions.create({
        model: "gpt-3.5-turbo-0125",
        messages,
      });
      return response.choices[0].message.content;
    } catch (e) {
      console.log("Error while gpt chat", e.message);
    }
  }

  async transcription(filepath) {
    try {
      const response = await this.openAIClient.audio.transcriptions.create({
        file: createReadStream(filepath),
        model: "whisper-1",
      });
      return response.text;
    } catch (e) {
      console.log("Error while transcription: " + e.message);
    }
  }
}

export const openai = new OpenAIService();
