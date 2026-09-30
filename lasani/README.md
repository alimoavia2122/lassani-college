# Lasani Public School & College – Chatbot Sample Project

## Run
1. Install Node.js 18+
2. Put your Groq key in `.env` (GROQ_API_KEY=...)
3. `npm start` → open http://localhost:3000

## How it works
- `public/index.html` + `style.css` + Tailwind (CDN) = the website
- `public/app.js` = page content + chat widget (bottom-right)
- `server.js` = Node.js server; the browser calls `/api/chat`, the server adds the secret key and calls Groq
- The college facts and rules live in `SYSTEM_PROMPT` inside `server.js` – edit it to change what the bot knows

## Important
Never put the API key in front-end JS. Never commit `.env` (it is in `.gitignore`).
