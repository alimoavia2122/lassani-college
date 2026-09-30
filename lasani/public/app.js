// ---------- Page content ----------
const subjects = ['Biology','Physics','Chemistry','Islamiat','Urdu','English','Math','Pak Studies','Computer'];
const teachers = ['Ali','Faisal','Saleem','Hassan','Usman','Arhum','Akmal','Abdul Qadoos','Ziauddin','Iqbal','Baseer'];
const activities = [['🏅','Sports Gala'],['🍽️','Annual Dinner'],['🔥','Bonfire'],['🎶','Qawali Night'],['🕌','Milad'],['🎓','Farewell']];

subjects.forEach(s => subjectsEl().insertAdjacentHTML('beforeend', `<span class="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm">${s}</span>`));
teachers.forEach(t => teacherGrid.insertAdjacentHTML('beforeend',
  `<div class="bg-white rounded-xl shadow p-4 text-center"><div class="w-14 h-14 mx-auto rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl font-bold">${t[0]}</div><p class="mt-2 font-medium text-sm">Sir ${t}</p></div>`));
activities.forEach(([i, n]) => activityGrid.insertAdjacentHTML('beforeend',
  `<div class="bg-white/10 rounded-xl p-5 text-center"><p class="text-3xl">${i}</p><p class="mt-2 font-medium">${n}</p></div>`));
function subjectsEl() { return document.getElementById('subjects'); }
document.getElementById('yr').textContent = new Date().getFullYear();
menuBtn.onclick = () => menu.classList.toggle('hidden');
menu.onclick = e => { if (e.target.tagName === 'A') menu.classList.add('hidden'); };

// ---------- Chatbot ----------
const history = []; // conversation sent to the server each time
const quick = ['What are the fees?', 'Admission requirements', 'Subjects offered', 'Activities'];

function toggleChat(open) {
  const show = open ?? chatBox.classList.contains('hidden');
  chatBox.classList.toggle('hidden', !show);
  if (show && !msgs.children.length) addMsg('bot', 'Assalam o Alaikum! 👋 I can help with fees, admission, subjects, teachers and activities.');
  if (show) chatInput.focus();
}
function addMsg(role, text) {
  const d = document.createElement('div');
  d.className = `bubble ${role}`; d.textContent = text;
  msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; return d;
}
quick.forEach(q => { const b = document.createElement('button');
  b.className = 'border border-emerald-600 text-emerald-700 rounded-full px-3 py-1 hover:bg-emerald-50';
  b.textContent = q; b.onclick = () => send(q); chips.appendChild(b); });

chatForm.onsubmit = e => { e.preventDefault(); send(chatInput.value.trim()); };

async function send(text) {
  if (!text) return;
  chatInput.value = ''; addMsg('user', text); history.push({ role: 'user', content: text });
  const typing = addMsg('bot', 'Typing…');
  try {
    const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history }) });
    const { reply } = await r.json();
    typing.textContent = reply; history.push({ role: 'assistant', content: reply });
  } catch { typing.textContent = 'Connection problem. Please try again.'; }
  msgs.scrollTop = msgs.scrollHeight;
}
