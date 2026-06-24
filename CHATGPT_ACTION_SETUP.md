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
3. Replace `https://YOUR-VERCEL-DOMAIN.vercel.app` with the deployed Vercel URL.
4. Create a Custom GPT or action-enabled GPT.
5. Add the OpenAPI schema.
6. Configure authentication as Bearer token.
7. Use the exact `LEXIPAPER_API_TOKEN` value as the bearer token.

## Suggested GPT instruction

```text
When the user asks to save a paper vocabulary item to LexiPaper, extract:
- word
- partOfSpeech when inferable
- Korean meaning
- exact paper sentence
- paperTitle
- page
- DOI or source URL
- 1-4 tags
- a short Korean note about usage in academic writing

Call saveLexiPaperWord only when the user clearly wants the item saved. If a required field is missing, infer conservatively from the provided text and leave unknown optional fields empty.
```
