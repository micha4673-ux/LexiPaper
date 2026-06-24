# LexiPaper Deployment

## What this version adds

- Vercel API routes for server-side saving.
- Supabase Postgres storage.
- A personal API token so only you and your ChatGPT Action can write to the app.
- Local browser storage as a fallback and backup.

## 1. Supabase

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. Copy these values:
   - Project URL
   - Service role key

Keep the service role key private. It belongs only in Vercel environment variables.

## 2. Vercel

Deploy the `outputs/lexipaper` folder as the Vercel project root.

Set these environment variables:

```text
SUPABASE_URL=<your Supabase project URL>
SUPABASE_SERVICE_ROLE_KEY=<your Supabase service role key>
LEXIPAPER_API_TOKEN=<a long private token you choose>
```

Redeploy after adding or changing environment variables.

## 3. LexiPaper app

Open the deployed Vercel URL. Paste the same `LEXIPAPER_API_TOKEN` into the server token field and click connect.

The app still works from `index.html` as local-only storage, but server sync is available only after deployment.

## 4. ChatGPT

Use `CHATGPT_ACTION_SETUP.md` and `openapi.lexipaper-actions.json`.

Replace the placeholder server URL in the OpenAPI file with the deployed Vercel URL before adding it to ChatGPT Actions.
