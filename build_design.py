"""Generate static page shells for the independently hosted frontend."""
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parent
ICONS = {
    'plane': '<path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="m22 2-11 11"/>',
    'chart': '<path d="M4 20V10m8 10V4m8 16v-7"/>',
    'sliders': '<path d="M4 21v-7m0-5V3m8 18v-9m0-5V3m8 18v-3m0-5V3M1 9h6m2 3h6m2 6h6"/>',
    'chevron': '<path d="m7 10 5 5 5-5"/>',
    'search': '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    'check': '<path d="m5 12 4 4L19 6"/>',
    'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    'shield': '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
    'sort': '<path d="M7 4v16m-4-4 4 4 4-4M14 5h7m-7 5h5m-5 5h3"/>',
    'crown': '<path d="m3 6 5 5 4-8 4 8 5-5-2 13H5L3 6Z"/><path d="M5 22h14"/>',
    'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    'info': '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
    'arrow': '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    'left': '<path d="m14 6-6 6 6 6"/>',
    'right': '<path d="m10 6 6 6-6 6"/>',
    'plus': '<path d="M12 5v14M5 12h14"/>',
    'minus': '<path d="M5 12h14"/>',
    'external': '<path d="M14 3h7v7m0-7L10 14M10 3H3v18h18v-7"/>',
}

def icon(name, extra=''):
    return f'<svg viewBox="0 0 24 24" aria-hidden="true" {extra}>{ICONS[name]}</svg>'

PLANES = [
    ('J-11A', 'Китай', '🇨🇳', '13.3', 'VIII', 'j_11a', 342),
    ('F-16A', 'США', '🇺🇸', '12.3', 'VIII', 'f_16a_block_10', 268),
    ('MiG-29 (9-13)', 'СССР', '🇷🇺', '13.0', 'VIII', 'mig_29_9_13', 196),
    ('JAS39A', 'Швеция', '🇸🇪', '13.0', 'VIII', 'saab_jas39a', 154),
    ('Mirage 2000C-S5', 'Франция', '🇫🇷', '12.3', 'VIII', 'mirage_2000c_s5', 112),
    ('F-15A', 'США', '🇺🇸', '12.7', 'VIII', 'f_15a', 82),
    ('Su-27', 'СССР', '🇷🇺', '13.0', 'VIII', 'su_27', 58),
    ('MiG-21SMT', 'СССР', '🇷🇺', '10.3', 'VII', 'mig-21_smt', 36),
]

def image(uid, name, cls='plane-thumb'):
    return f'<img class="{cls}" src="https://static.encyclopedia.warthunder.com/slots/{uid}.png" alt="{escape(name)}" decoding="async">'

def nation(name, flag):
    # Country abbreviations also work on systems that render emoji flags as letters.
    if name == 'СССР':
        return '<span class="nation"><span class="flag" aria-hidden="true" style="color:#b67068;font-size:17px">★</span>СССР</span>'
    return f'<span class="nation"><span class="flag" aria-hidden="true">{flag}</span>{name}</span>'

def header(active):
    return f'''<header class="topbar"><div class="shell">
      <a class="brand" href="index.html" aria-label="Mlmlka wt — голосование"><span class="brand-mark">{icon('plane')}</span><div><div class="brand-name">Mlmlka wt</div><div class="brand-sub">WAR THUNDER COMMUNITY</div></div></a>
      <nav class="nav" aria-label="Основная навигация">
        <a href="index.html" class="{'active' if active == 'vote' else ''}" {'aria-current="page"' if active == 'vote' else ''}>{icon('chart')}Голосование</a>
        <a href="admin.html" data-admin-nav hidden class="{'active' if active == 'admin' else ''}" {'aria-current="page"' if active == 'admin' else ''}>{icon('sliders')}Управление</a>
      </nav><div class="profile"><span class="avatar">W</span><span class="profile-name">Mlmlka wt</span>{icon('chevron','class="chevron"')}</div>
    </div></header>'''

def footer(admin=False):
    return f'''<footer class="site-footer {'admin-footer' if admin else ''}"><span><span class="footer-brand">Mlmlka wt</span> &nbsp; / &nbsp; Сообщество War Thunder</span><span class="footer-right">Разработано by blizzard {icon('plane')}</span></footer>'''

def page(title, active, body):
    favicon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="%232c4132"/><path d="m25 7-7 19-4-9-9-3L25 7Z" fill="none" stroke="%23dce8cb" stroke-width="1.6"/></svg>'
    return f'''<!doctype html>
<html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><meta name="description" content="Голосование за технику War Thunder — Mlmlka wt."><title>{title} — Mlmlka wt</title><link rel="icon" href='data:image/svg+xml,{favicon}'><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="preconnect" href="https://static.encyclopedia.warthunder.com"><link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="live.css"><script defer src="config.js"></script><script defer src="aircraft-images.js"></script><script defer src="voting-options.js"></script><script defer src="app.js"></script></head><body>{header(active)}<main class="shell">{body}{footer(active == 'admin')}</main></body></html>'''

def vote_page():
    rows = []
    for i, (name, country, flag, br, rank, uid, votes) in enumerate(PLANES, 1):
        percent = f'{votes/1248*100:.1f}'.replace('.', ',')
        position = icon('crown') if i == 1 else f'{i:02d}'
        rows.append(f'''<div class="plane-row {'leader' if i == 1 else ''}" role="row">
          <span class="rank-number" role="cell" aria-label="Место {i}">{position}</span>
          <span role="cell">{image(uid,name)}</span>
          <div role="cell"><div class="plane-name">{name}</div><div class="plane-meta">{rank} ранг <span aria-hidden="true">·</span> Реактивный</div></div>
          {nation(country,flag)}<span class="br" aria-label="Боевой рейтинг {br}">{br}</span>
          <div class="vote-data" role="cell"><span class="vote-number">{votes}</span><span class="vote-share">{percent}%</span><div class="progress" aria-hidden="true"><span style="width:{votes/342*100:.1f}%"></span></div></div>
        </div>''')
    options = ''.join(f'<option>{name} · {country} · BR {br}</option>' for name,country,flag,br,*rest in PLANES)
    return page('Голосование за технику', 'vote', f'''
    <div class="overline"><span class="eyebrow">ВЫБОР СООБЩЕСТВА</span><span class="poll-id">Голосование № 004</span></div>
    <div class="heading-line"><h1>Голосование за технику</h1><span class="status"><span class="dot"></span>Идёт голосование</span></div>
    <p class="intro">Выбирайте любимый самолёт. Поднимайте его в рейтинге.</p>
    <section class="vote-box" aria-label="Ваш голос">
      <label class="field-label" for="aircraft-choice">За какую технику голосуем?</label>
      <div class="search-field">{icon('search')}<select id="aircraft-choice"><option selected disabled value="">Выберите самолёт из списка…</option>{options}</select></div>
      <button type="button" class="primary-button">{icon('check')}Проголосовать</button>
      <p class="helper">{icon('shield')}Один участник — один голос</p>
    </section>
    <section class="last-result-card panel" aria-labelledby="last-result-title"><h2 id="last-result-title">Последнее голосование</h2><p class="last-result-note">Загрузка результата…</p></section>
    <div class="results-layout"><section aria-labelledby="ranking-title">
      <div class="section-heading"><h2 id="ranking-title">Рейтинг техники <span class="count">8</span></h2><span class="sort">{icon('sort')}По количеству голосов</span></div>
      <div class="ranking" role="table" aria-label="Рейтинг самолётов">
        <div class="table-head" role="row"><span>№</span><span class="tech-label">ТЕХНИКА</span><span class="nation-label">НАЦИЯ</span><span class="br-label">BR</span><span class="votes-label">ГОЛОСА</span></div>
        {''.join(rows)}
      </div>
      <div class="ranking-foot"><span>{icon('chart')}Всего 1 248 голосов</span><span>Результаты по убыванию голосов</span></div>
    </section><aside class="sidebar">
      <section class="leader-card" aria-label="Лидер голосования"><p class="label">{icon('crown')}Лидер голосования</p>{image('j_11a','J-11A','leader-image')}<h2 class="leader-title">J-11A</h2><p class="leader-description">Китай &nbsp; / &nbsp; VIII ранг &nbsp; / &nbsp; BR 13.3</p><div class="leader-stats"><div><strong>342</strong><small>голоса за технику</small></div><div style="text-align:right"><strong class="percent">27,4%</strong><small>от всех голосов</small></div></div></section>
      <section class="info-card"><h3>Условия голосования</h3><div class="condition"><span>Режим</span><strong>Воздушные РБ</strong></div><div class="condition"><span>Нации</span><strong>Все нации</strong></div><div class="condition"><span>Боевой рейтинг</span><strong>10.0 — 14.0</strong></div><div class="condition"><span>Тип техники</span><strong>Реактивные</strong></div><div class="info-bottom">{icon('clock')}Открыто 26 сентября 2026</div></section>
      <p class="mini-note">{icon('info')}Побеждает техника, набравшая больше всего голосов.</p>
    </aside></div>
    ''')

def admin_page():
    rows = []
    for i, (name,country,flag,br,rank,uid,votes) in enumerate(PLANES):
        selected = i < 5
        rows.append(f'''<div class="catalog-row {'selected-row' if selected else ''}">{image(uid,name)}<div><div class="plane-name">{name}</div><div class="plane-meta">{rank} ранг · Реактивный</div></div>{nation(country,flag)}<span class="br">{br}</span><button type="button" class="add-remove" aria-label="{'Убрать' if selected else 'Добавить'} {name}" title="{'Убрать из голосования' if selected else 'Добавить в голосование'}">{icon('minus' if selected else 'plus')}</button></div>''')
    nations = ''.join(f'<option>{name}</option>' for name in ['США','Германия','СССР','Великобритания','Япония','Китай','Италия','Франция','Швеция','Израиль'])
    return page('Управление голосованием', 'admin', f'''
      <div class="overline"><span class="eyebrow">ПАНЕЛЬ УПРАВЛЕНИЯ</span><span class="poll-id">Новое голосование</span></div>
      <div class="title-row"><div><h1>Настроим голосование</h1><p class="intro">Задайте условия и выберите технику для сообщества.</p></div><a class="outline-button" href="index.html">{icon('external')}Текущее голосование</a></div>
      <div class="admin-layout"><aside><section class="panel"><h2 class="panel-title">{icon('sliders')}Фильтры техники</h2><div class="panel-body">
        <div class="field-group"><label class="field-label" for="nation">Нация</label><select class="select-input" id="nation"><option>Все нации</option>{nations}</select></div>
        <div class="field-group"><label class="field-label" for="rank">Ранг</label><select class="select-input" id="rank"><option>Все ранги</option><option>I — III</option><option>IV — VI</option><option selected>VII — IX</option></select></div>
        <div class="field-group wide"><span class="field-label">Боевой рейтинг <span style="font-weight:400;color:#9ba58e">/ Air RB</span></span><div class="double-fields"><div><label class="range-caption" for="min-br">От</label><select class="select-input" id="min-br" aria-label="Минимальный BR"><option>1.0</option></select></div><div><label class="range-caption" for="max-br">До</label><select class="select-input" id="max-br" aria-label="Максимальный BR"><option>14.7</option></select></div></div></div>
        <div class="field-group wide"><span class="field-label">Тип самолёта</span><div class="segmented" aria-label="Тип самолёта"><button type="button">Все</button><button type="button" class="selected" aria-pressed="true">Реактивные</button><button type="button">Винтовые</button></div></div>
        <div class="field-group wide"><label class="check-row"><input type="checkbox" checked>Включать премиумную технику</label></div>
      </div><div class="filter-bottom"><span>Фильтры применены</span><button type="button">Сбросить</button></div></section><p class="filter-note">{icon('info')}Без ручного выбора участвуют все самолёты по фильтрам. «+ / −» — выбор отдельных самолётов.</p></aside>
      <div class="admin-right"><section class="panel name-panel"><label class="field-label" for="poll-title">Название голосования</label><input class="text-input" id="poll-title" value="Mlmlka wt" maxlength="100"><p class="helper">Это название увидят участники голосования.</p></section>
      <section class="panel"><div class="catalog-heading"><h2>Выбор техники <span class="count">1 324</span></h2><span class="selected-tag">{icon('check')}Выбрано 5</span></div>
      <label class="search-field catalog-search">{icon('search')}<input type="search" placeholder="Найти самолёт по названию…" aria-label="Поиск техники"></label>
      <div class="catalog-head"><span class="tech-label">ТЕХНИКА</span><span class="nation-label">НАЦИЯ</span><span>BR</span><span></span></div>
      {''.join(rows)}
      <div class="catalog-footer"><span>Показано 8 самолётов</span><div class="pagination"><button type="button" aria-label="Предыдущая страница">{icon('left')}</button><button type="button" aria-label="Следующая страница">{icon('right')}</button></div></div></section>
      <div class="admin-actions"><p class="helper">{icon('info')}Новое голосование начнётся с нуля.<br>Текущее голосование будет завершено.</p><button class="primary-button" type="button">{icon('plus')}Открыть голосование</button></div>
      </div></div>
    ''')

if __name__ == '__main__':
    (ROOT / 'index.html').write_text(vote_page(), encoding='utf-8')
    (ROOT / 'admin.html').write_text(admin_page(), encoding='utf-8')
    print('Created independent frontend pages with API integration.')
