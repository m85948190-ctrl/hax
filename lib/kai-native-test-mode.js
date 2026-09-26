// Temporary native-only test switch for HAxBRO intelligence.
// Keep all provider configuration intact; this only prevents external AI-provider execution.
export const KAI_NATIVE_ONLY = true;
export function externalAIEnabled(){ return !KAI_NATIVE_ONLY; }