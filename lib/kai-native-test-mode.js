// HAxBRO provider switch.
// Provider configuration stays server-side; KAI 51 remains the orchestrator and native fallback.
export const KAI_NATIVE_ONLY = false;
export function externalAIEnabled(){ return !KAI_NATIVE_ONLY; }