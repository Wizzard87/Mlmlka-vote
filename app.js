(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const nations = {USA:'США',Germany:'Германия',USSR:'СССР',Britain:'Великобритания',Japan:'Япония',China:'Китай',Italy:'Италия',France:'Франция',Sweden:'Швеция',Israel:'Израиль'};
  const base = (window.WARDEN_CONFIG?.apiBaseUrl || '').replace(/\/$/, '');
  const aircraftImage = (a, cls='plane-thumb') => {
    const uid = window.WARDEN_AIRCRAFT_IMAGES?.[a.id];
    return uid ? `<img class="${cls}" src="https://static.encyclopedia.warthunder.com/slots/${encodeURIComponent(uid)}.png" alt="${esc(a.name)}" loading="lazy">` : '<span class="aircraft-symbol" aria-hidden="true">✈</span>';
  };
  const admin = location.pathname.endsWith('admin.html');
  let token = sessionStorage.getItem('warden.session'), me = null, poll = null, myVote = null, submitting = false;
  let deadline = 0;
  const notice = document.createElement('div'); notice.className = 'api-notice'; notice.setAttribute('role','status'); notice.hidden = true;
  $('main').prepend(notice);
  const auth = document.createElement('div'); auth.className = 'auth-strip';
  auth.innerHTML = '<span id="account-label">Просмотр без входа</span><button id="login-button" class="outline-button" type="button">Войти через Discord</button>';
  $('.intro').after(auth); $('.profile')?.remove();
  const message = (text, error = false) => { notice.textContent = text; notice.hidden = !text; notice.classList.toggle('error',error); };
  async function api(path, options = {}) {
    if (!base) throw new Error('Укажите адрес API в config.js.');
    if (location.protocol === 'https:' && !base.startsWith('https://')) throw new Error('Для GitHub Pages укажите HTTPS-адрес API в config.js.');
    let response;
    try { response = await fetch(base + path, {...options, headers:{'Content-Type':'application/json', ...(token ? {Authorization:`Bearer ${token}`} : {}), ...options.headers}, signal:AbortSignal.timeout(15000)}); }
    catch { throw new Error('Не удалось подключиться к API. Проверьте адрес, HTTPS и разрешённый CORS origin.'); }
    if (response.status === 204) return null;
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(body.message || `Ошибка API: ${response.status}`); error.status = response.status; error.code = body.code;
      if (response.status === 401) { token = null; me = null; sessionStorage.removeItem('warden.session'); renderAccount(); }
      throw error;
    }
    return body;
  }
  const post = (path, body) => api(path, {method:'POST', body:JSON.stringify(body)});
  function renderAccount() {
    document.querySelectorAll('[data-admin-nav]').forEach(link => { link.hidden = !me?.isStreamer; });
    $('#account-label').textContent = me ? `${me.displayName}${me.isStreamer ? ' · Стример' : ''}` : 'Просмотр без входа';
    $('#login-button').textContent = me ? 'Выйти' : 'Войти через Discord';
    if (admin) $('.admin-actions .primary-button').disabled = !me?.isStreamer;
  }
  async function login() {
    if (me) { await post('/api/auth/logout', {}); token = null; me = null; sessionStorage.removeItem('warden.session'); location.reload(); return; }
    if (location.protocol === 'https:' && !base.startsWith('https://')) throw new Error('Для входа нужен HTTPS-адрес API.');
    const verifier = [...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join('');
    const hash = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier));
    const challenge = [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
    sessionStorage.setItem('warden.verifier', verifier);
    sessionStorage.setItem('warden.return', admin ? 'admin.html' : 'index.html');
    location.assign(base + '/api/auth/discord/login?challenge=' + challenge);
  }
  $('#login-button').onclick = () => login().catch(e=>message(e.message,true));
  async function initAuth() {
    const fragment = new URLSearchParams(location.hash.slice(1));
    if (fragment.has('login_ticket') || fragment.has('login_error')) {
      history.replaceState(null,'',location.pathname + location.search);
      if (fragment.has('login_error')) { sessionStorage.removeItem('warden.verifier'); throw new Error('Вход через Discord отменён или недоступен. Попробуйте снова.'); }
      const verifier = sessionStorage.getItem('warden.verifier'); sessionStorage.removeItem('warden.verifier');
      const session = await post('/api/auth/session', {ticket:fragment.get('login_ticket'), verifier});
      token = session.accessToken; sessionStorage.setItem('warden.session',token);
      const target = sessionStorage.getItem('warden.return'); sessionStorage.removeItem('warden.return');
      if (target === 'admin.html' && !admin) { location.replace('admin.html'); return; }
    }
    if (token) me = await api('/api/auth/me');
    renderAccount();
  }

  const tableHeader = '<div class="table-head" role="row"><span>№</span><span class="tech-label">ТЕХНИКА</span><span class="nation-label">НАЦИЯ</span><span class="br-label">BR</span><span class="votes-label">ГОЛОСА</span></div>';
  function renderPoll() {
    const select = $('#aircraft-choice'), button = $('.vote-box .primary-button');
    const previous = select.value;
    $('#ranking-title .count').textContent = poll?.aircraft.length || 0;
    $('.poll-id').textContent = poll ? 'Голосование · ' + poll.id.slice(0,8) : 'Нет активного голосования';
    $('.status').textContent = poll?.status === 'open' ? 'Идёт голосование' : 'Голосование закрыто';
    $('h1').textContent = poll?.title || 'Голосование за технику';
    select.innerHTML = '<option value="">Выберите самолёт из списка…</option>' + (poll?.aircraft || []).map(a=>`<option value="${a.id}">${esc(a.name)} · ${esc(nations[a.nation] || a.nation)} · BR ${a.battleRating.toFixed(1)}</option>`).join('');
    select.value = myVote === null ? previous : String(myVote);
    select.disabled = !poll || poll.status !== 'open' || myVote !== null;
    button.disabled = !poll || poll.status !== 'open' || myVote !== null || submitting;
    button.textContent = myVote !== null ? 'Голос принят' : me ? 'Проголосовать' : 'Войти и проголосовать';
    $('.ranking').innerHTML = tableHeader + (poll?.aircraft || []).map((a,i)=>`<div class="plane-row ${i===0 && a.votes>0 ? 'leader' : ''}" role="row"><span class="rank-number">${i+1}</span>${aircraftImage(a)}<div><div class="plane-name">${esc(a.name)}</div><div class="plane-meta">${esc(a.rank)} ранг</div></div><span class="nation">${esc(nations[a.nation]||a.nation)}</span><span class="br">${a.battleRating.toFixed(1)}</span><div class="vote-data"><span class="vote-number">${a.votes}</span><span class="vote-share">${poll.totalVotes ? (100*a.votes/poll.totalVotes).toFixed(1) : 0}%</span><div class="progress"><span style="width:${poll.aircraft[0].votes ? a.votes/poll.aircraft[0].votes*100 : 0}%"></span></div></div></div>`).join('');
    if (!poll) $('.ranking').insertAdjacentHTML('beforeend','<p class="empty-state">Стример ещё не открыл голосование.</p>');
    $('.ranking-foot').textContent = `Всего ${poll?.totalVotes || 0} голосов`;
    const leader = poll?.aircraft[0];
    $('.leader-card').innerHTML = leader && leader.votes > 0 ? `<p class="label">Лидер голосования</p>${aircraftImage(leader,'leader-image')}<h2 class="leader-title">${esc(leader.name)}</h2><p class="leader-description">${esc(nations[leader.nation]||leader.nation)} / ${esc(leader.rank)} ранг / BR ${leader.battleRating.toFixed(1)}</p><div class="leader-stats"><div><strong>${leader.votes}</strong><small>голосов за технику</small></div><strong class="percent">${(100*leader.votes/poll.totalVotes).toFixed(1)}%</strong></div>` : '<p class="label">Лидер голосования</p><p class="empty-state">Первые голоса определят лидера.</p>';
    $('.info-card').innerHTML = `<h3>Условия голосования</h3><div class="condition"><span>Режим</span><strong>Воздушные РБ</strong></div><div class="condition"><span>Техника</span><strong>${poll?.aircraft.length || 0} самолётов</strong></div><div class="condition"><span>Длительность</span><strong>${poll?.durationSeconds || 0} сек.</strong></div><div class="condition"><span>Осталось</span><strong id="countdown">—</strong></div><div class="info-bottom">Один Discord-аккаунт — один голос</div>`;
    updateCountdown();
  }
  function updateCountdown() {
    if (admin || !$('#countdown')) return;
    const seconds = poll?.status === 'open' ? Math.max(0,Math.ceil((deadline-Date.now())/1000)) : 0;
    $('#countdown').textContent = `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
    if (seconds===0) { $('.vote-box .primary-button').disabled = true; $('#aircraft-choice').disabled = true; }
  }
  async function refreshPoll() {
    const active = await api('/api/polls/active');
    poll = active || (poll ? await api('/api/polls/' + poll.id) : null);
    deadline = Date.now() + (poll?.remainingSeconds || 0)*1000;
    myVote = me && poll ? (await api(`/api/polls/${poll.id}/my-vote`)).aircraftId : null;
    renderPoll();
  }
  async function startPublic() {
    renderPoll();
    $('.vote-box .primary-button').onclick = async () => {
      if (!me) { await login().catch(e=>message(e.message,true)); return; }
      if (!poll || submitting) return;
      const id = Number($('#aircraft-choice').value);
      if (!id) { message('Выберите самолёт.',true); return; }
      submitting = true; $('.vote-box .primary-button').disabled = true;
      try { await post(`/api/polls/${poll.id}/votes`,{aircraftId:id}); message('Ваш голос принят. Спасибо!'); }
      catch(e) { message(e.message,true); }
      finally { submitting = false; await refreshPoll().catch(e=>message(e.message,true)); }
    };
    const tick = async () => { try { await refreshPoll(); } catch(e) { message(e.message,true); $('.vote-box .primary-button').disabled=true; } finally { setTimeout(tick,2000); } };
    tick(); setInterval(updateCountdown,250);
  }

  async function startAdmin() {
    let offset=0, total=0, rows=[], requestNumber=0; const limit=25, selected=new Map();
    const catalogPanel = $('.catalog-heading').parentElement;
    $('.catalog-heading .count').textContent = '…';
    document.querySelectorAll('.catalog-row').forEach(e=>e.remove());
    $('.name-panel .helper').textContent = 'Название и длительность нового голосования.';
    $('.name-panel').insertAdjacentHTML('beforeend','<div class="duration-field"><label class="field-label" for="duration">Длительность, секунд</label><input class="text-input" id="duration" type="number" min="1" max="86400" step="1" value="60"><small>60 секунд = 1 минута</small></div>');
    $('#nation').innerHTML = '<option value="">Все нации</option>' + Object.entries(nations).map(([k,v])=>`<option value="${k}">${v}</option>`).join('');
    $('#rank').innerHTML = '<option value="">Все ранги</option>' + ['I','II','III','IV','V','VI','VII','VIII','IX'].map(r=>`<option>${r}</option>`).join('');
    for (const id of ['min-br','max-br']) {
      $('#'+id).innerHTML = MlmlkaVoting.battleRatings.map(br=>`<option value="${br}">${br}</option>`).join('');
    }
    $('#min-br').value='1.0'; $('#max-br').value='14.7';
    let jet='';
    const typeButtons=[...document.querySelectorAll('.segmented button')];
    typeButtons.forEach((b,i)=>{b.classList.toggle('selected',i===0);b.setAttribute('aria-pressed',String(i===0));b.onclick=()=>{jet=['','true','false'][i];typeButtons.forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b));});reload();};});
    function draw() {
      document.querySelectorAll('.catalog-row').forEach(e=>e.remove());
      $('.selected-tag').textContent=selected.size ? `Вручную: ${selected.size}` : `По фильтрам: ${total}`;
      $('.admin-actions .helper').textContent=selected.size
        ? `В голосовании будут только выбранные вручную самолёты: ${selected.size}. Уберите выбор кнопками «−», чтобы использовать все самолёты по фильтрам.`
        : `В голосование войдут все ${total} самолётов по текущим фильтрам и поиску, со всех страниц каталога.`;
      const html=rows.map(a=>`<div class="catalog-row ${selected.has(a.id)?'selected-row':''}">${aircraftImage(a)}<div><div class="plane-name">${esc(a.name)}</div><div class="plane-meta">${esc(a.rank)} ранг · ${a.isJet?'Реактивный':'Винтовой'}${a.isPremium?' · Премиум':''}</div></div><span class="nation">${esc(nations[a.nation]||a.nation)}</span><span class="br">${a.battleRating.toFixed(1)}</span><button type="button" class="add-remove" data-aircraft="${a.id}" aria-label="${selected.has(a.id)?'Убрать':'Добавить'} ${esc(a.name)}">${selected.has(a.id)?'−':'+'}</button></div>`).join('');
      $('.catalog-footer').insertAdjacentHTML('beforebegin', html || '<div class="catalog-row"><span>Ничего не найдено</span></div>');
      $('.catalog-heading .count').textContent=total;
      $('.catalog-footer>span').textContent = `${total ? offset+1 : 0}–${Math.min(offset+limit,total)} из ${total}`;
      const pages=[...document.querySelectorAll('.pagination button')];pages[0].disabled=offset===0;pages[1].disabled=offset+limit>=total;
    }
    function currentFilters() {
      const q=new URLSearchParams();
      for(const [k,v] of Object.entries({search:$('.catalog-search input').value,nation:$('#nation').value,rank:$('#rank').value,minBr:$('#min-br').value,maxBr:$('#max-br').value,isJet:jet,isPremium:$('.check-row input').checked?'':'false'})) if(v!=='') q.set(k,v);
      return q;
    }
    async function load() {
      const current=++requestNumber;
      const q=currentFilters();q.set('offset',offset);q.set('limit',limit);
      try {const data=await api('/api/aircraft?'+q);if(current!==requestNumber)return;rows=data.items;total=data.total;draw();}
      catch(e){if(current===requestNumber)message(e.message,true);}
    }
    function reload(){offset=0;load();}
    let debounce;
    $('.catalog-search input').oninput=()=>{clearTimeout(debounce);debounce=setTimeout(reload,250);};
    for(const s of ['#nation','#rank','.check-row input']) $(s).onchange=reload;
    for(const id of ['min-br','max-br']) $('#'+id).onchange=()=>{
      if(Number($('#min-br').value)>Number($('#max-br').value)) {
        $(id==='min-br'?'#max-br':'#min-br').value=$('#'+id).value;
      }
      reload();
    };
    catalogPanel.onclick=e=>{const b=e.target.closest('[data-aircraft]');if(!b)return;const id=Number(b.dataset.aircraft);selected.has(id)?selected.delete(id):selected.set(id,rows.find(a=>a.id===id));draw();};
    const pages=[...document.querySelectorAll('.pagination button')];pages[0].onclick=()=>{offset=Math.max(0,offset-limit);load();};pages[1].onclick=()=>{offset+=limit;load();};
    $('.filter-bottom button').onclick=()=>{$('#nation').value='';$('#rank').value='';$('#min-br').value='1.0';$('#max-br').value='14.7';$('.check-row input').checked=true;$('.catalog-search input').value='';typeButtons[0].click();};
    const activeBox=document.createElement('div');activeBox.className='panel active-poll';$('.admin-right').prepend(activeBox);
    async function refreshActive(){
      const current=await api('/api/polls/active');
      activeBox.textContent=current?`Сейчас: ${current.title} · осталось ${current.remainingSeconds} сек.`:'Нет активного голосования';
      if(current&&me?.isStreamer){const close=document.createElement('button');close.type='button';close.className='outline-button';close.textContent='Завершить';close.onclick=async()=>{close.disabled=true;try{await post(`/api/admin/polls/${current.id}/close`,{});await refreshActive();message('Голосование завершено.');}catch(e){message(e.message,true);close.disabled=false;}};activeBox.append(close);}
    }
    $('.admin-actions .primary-button').onclick=async()=>{
      if(!me?.isStreamer){message('Открыть голосование может только стример.',true);return;}
      const durationSeconds=Number($('#duration').value),title=$('#poll-title').value.trim();
      if(!Number.isInteger(durationSeconds)||durationSeconds<1||durationSeconds>86400||!title){message('Введите название и длительность от 1 до 86400 секунд.',true);return;}
      const b=$('.admin-actions .primary-button');b.disabled=true;
      try{
        const aircraftIds=await MlmlkaVoting.resolveAircraftIds([...selected.keys()],currentFilters(),api);
        await post('/api/admin/polls',{title,durationSeconds,aircraftIds});
        message(`Голосование открыто. Самолётов: ${aircraftIds.length}.`);await refreshActive();
      }catch(e){message(e.message,true);}finally{b.disabled=!me?.isStreamer;}
    };
    if(!me?.isStreamer)message(me?'Ваш Discord-аккаунт не указан в списке стримеров.':'Для открытия голосования войдите через Discord.');
    renderAccount();await load();
    const tick=async()=>{try{await refreshActive();}catch(e){message(e.message,true);}finally{setTimeout(tick,3000);}};tick();
  }
  $('.footer-right').textContent='Разработано by blizzard';
  if (admin) { document.querySelectorAll('.catalog-row').forEach(e=>e.remove()); $('.selected-tag').textContent='Выбрано 0'; $('.admin-actions .primary-button').disabled=true; } else renderPoll();
  initAuth().catch(e=>message(e.message,true)).finally(()=>admin?startAdmin():startPublic());
})();
