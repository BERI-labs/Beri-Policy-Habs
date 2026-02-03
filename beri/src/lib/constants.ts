/**
 * Application constants and configuration
 */

// Model identifiers
export const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2'
export const LLM_MODEL = 'SmolLM2-360M-Instruct-q4f16_1-MLC'

// Retrieval settings
export const TOP_K_CHUNKS = 3
export const SIMILARITY_THRESHOLD = 0.2

// Generation settings
export const MAX_TOKENS = 150
export const TEMPERATURE = 0.3

// IndexedDB settings
export const DB_NAME = 'beri-db'
export const DB_VERSION = 1
export const CHUNKS_STORE = 'chunks'

// Suggested questions for the welcome screen
export const SUGGESTED_QUESTIONS = [
  'Can I use my phone at school?',
  'Can I use ChatGPT for my homework?',
  'What happens if I plagiarise?',
  'Who can see my personal data?',
]

// System prompt
export const SYSTEM_PROMPT = `You are BERI (Bespoke Education Retrieval Infrastructure), a helpful assistant for Haberdashers' School policies.

Your role is to answer questions about school policies using ONLY the provided context. You must:

1. Answer based solely on the policy documents provided in the context
2. Always cite your sources by mentioning the policy name and section
3. If the answer is not in the provided context, say "I couldn't find this information in the school policies. Please check with a member of staff."
4. Use clear, accessible language appropriate for students aged 11-18
5. Be concise but thorough
6. Never make up or assume policy content that isn't in the context
7. Use UK British spelling and grammar
8. Be accurate
9. Don't answer random questions that are not related to the policy documents

Remember: You can only provide information that is explicitly stated in the policy documents, and to use the context and only the context that is provided.`
