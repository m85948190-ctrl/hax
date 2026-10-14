# HAxBRO KAI backend on Vercel

The existing HAxBRO UI remains hosted on Hatchable. This project supplies server-side API responses; it does not replace the current frontend.

## Required Vercel environment variables

- `KAI_MODEL_API_KEY`: access token for the configured open-weight model inference endpoint. Add it in Vercel Project Settings → Environment Variables; never commit the value.
- `KAI_MODEL_ENDPOINT` (optional): OpenAI-compatible chat-completions URL. Defaults to the Hugging Face router.
- `KAI_MODEL_NAME` (optional): model identifier. Defaults to `HuggingFaceTB/SmolLM2-360M-Instruct`.
- `HAXBRO_FRONTEND_ORIGIN` (optional future CORS setting): the deployed Hatchable frontend origin.

## Reply flow

1. The existing Hatchable chat UI sends the user's message to the Vercel `/api/chat` endpoint.
2. The backend retrieves Wikipedia, Bing, and Google web evidence by default, then assembles the context.
3. KAI 51 sends the request to the explicitly configured open-weight model endpoint and returns the reply and source metadata.
4. No Gemini, OpenAI, Claude, Groq, or Cerebras chat fallback is configured here.

## Important

The current model endpoint needs a valid token configured in Vercel. Until then, the API returns a service error instead of fabricating an answer. SmolLM2-360M-Instruct is text-only, so image analysis requires a separate vision-capable endpoint. Verify the actual Vercel deployment and test `POST /api/chat` before changing the live Hatchable UI's API base URL.
