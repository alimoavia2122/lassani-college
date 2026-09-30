// Zero-dependency Node.js server (Node 18+). Serves the site and proxies chat to Groq,
// so the API key stays on the server and is never exposed in the browser.
const http = require('http'), fs = require('fs'), path = require('path');

// Tiny .env loader
try { fs.readFileSync('.env', 'utf8').split('\n').forEach(l => {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m) process.env[m[1]] ??= m[2];
}); } catch {}

// NOTE: llama-3.1-8b-instant was shut down by Groq, so we use openai/gpt-oss-20b
const { GROQ_API_KEY, GROQ_MODEL = 'openai/gpt-oss-20b', PORT = 3000 } = process.env;

const SYSTEM_PROMPT = `You are the friendly assistant of Lasani Public School & College, Jhammat Shumali.
Answer ONLY using the facts below. Keep replies short (2-5 sentences), polite and clear. Reply in the language the visitor uses (English, Urdu or Roman Urdu).
FACTS:
- Fees: 1st Year Rs. 30,000 per annum. 2nd Year Rs. 20,000 per annum.
- Subjects: Biology, Physics, Chemistry, Islamiat, Urdu, English, Math, Pak Studies, Computer.
- Teachers: Ali, Faisal, Saleem, Hassan, Usman, Arhum, Akmal, Abdul Qadoos, Ziauddin, Iqbal, Baseer.
- Extra-curricular activities: Sports Gala, Annual Dinner, Bonfire, Qawali Night, Milad, Farewell.
- Admission: admission fee Rs. 5,000; CNIC copy (front and back); father or mother must come along with the student.
RULES: If asked about anything not in the facts above, say you don't have that information and suggest visiting the college office. If the question is unrelated to the college, say: "I am here only to answer college related questions." Never invent details (dates, phone numbers, addresses, names).`;

const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
const hits = new Map(); // simple rate limit: 20 requests/min per IP

http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/chat') {
    const ip = req.socket.remoteAddress, now = Date.now();
    const recent = (hits.get(ip) || []).filter(t => now - t < 60000);
    if (recent.length >= 20) return send(res, 429, { reply: 'Too many messages. Please wait a minute.' });
    hits.set(ip, [...recent, now]);
    try {
      const { messages = [] } = JSON.parse(await body(req));
      const history = messages.slice(-10).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content).slice(0, 500) }));
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({ model: GROQ_MODEL, temperature: 0.3, max_tokens: 1200, reasoning_effort: 'low',
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history] })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error?.message || 'Groq error');
      send(res, 200, { reply: data.choices[0].message.content });
    } catch (e) {
      console.error(e.message);
      send(res, 500, { reply: 'Sorry, something went wrong. Please try again.' });
    }
    return;
  }
  const file = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : path.normalize(req.url).replace(/^(\.\.[\/\\])+/, ''));
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => console.log(`Running at http://localhost:${PORT}`));

function body(req) { return new Promise(r => { let d = ''; req.on('data', c => d += c); req.on('end', () => r(d)); }); }
function send(res, code, obj) { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); }
