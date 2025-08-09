import axios from 'axios';

const HF_API_TOKEN = "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";
const HF_API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn";

export const summarizeContent = async (text: string) => {
  try {
    const response = await axios.post(
      HF_API_URL,
      { inputs: text },
      {
        headers: {
          Authorization: `Bearer ${HF_API_TOKEN}`,
        },
      }
    );
    return response.data[0]?.summary_text || "No summary generated";
  } catch (error) {
    console.error("Summarization error:", error);
    return text.split(/\s+/).slice(0, 50).join(" ") + "..."; // Fallback
  }
};