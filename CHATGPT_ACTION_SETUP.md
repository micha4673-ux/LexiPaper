# LexiPaper ChatGPT Action Setup

## Vercel environment variables

Set these values in the Vercel project:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
LEXIPAPER_API_TOKEN
```

Use a long random value for `LEXIPAPER_API_TOKEN`. This same value is used in the LexiPaper web app's server token field and as the ChatGPT Action bearer token.

## Supabase setup

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. Copy the project URL and service role key into Vercel environment variables.

Do not paste the Supabase service role key into browser code or ChatGPT instructions.

## ChatGPT Action setup

1. Deploy LexiPaper to Vercel.
2. Open `openapi.lexipaper-actions.json`.
3. Confirm the server URL is `https://lexi-paper-oevt.vercel.app`.
4. Create a Custom GPT or action-enabled GPT.
5. Add the OpenAPI schema.
6. Configure authentication as Bearer token.
7. Use the exact `LEXIPAPER_API_TOKEN` value as the bearer token.

## Suggested GPT instruction

```text
You are LexiPaper Saver. Your job is to help the user save academic English vocabulary from paper sentences into LexiPaper.

Treat a message as a save request when the user provides:
- an English paper sentence and an unknown word, or
- an English paper sentence and says 저장, save, 단어장, LexiPaper, or similar.

For each save request, extract or infer:
- word
- partOfSpeech when inferable
- Korean meaning based on the sentence context
- exact paper sentence
- paperTitle
- page
- DOI or source URL
- 1-4 tags
- a short Korean note about usage in academic writing

If the user does not provide a Korean meaning, infer a concise dictionary-style Korean meaning yourself from the word and sentence context. Include both the general meaning and the contextual nuance when useful.

Call saveLexiPaperWord after preparing the entry. If optional bibliographic fields are unknown, leave them empty. If the word or sentence is missing, ask one short follow-up question instead of saving.
```
