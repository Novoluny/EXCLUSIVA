//мобильное меню
const nav = document.getElementById('nav');
document.getElementById('burger').addEventListener('click', () => nav.classList.toggle('is-open'));
nav.addEventListener('click', e => { if (e.target.tagName === 'A') nav.classList.remove('is-open'); });

//Состояние записи 
const state = { service: null, price: 0, duration: '', barber: '', date: null, time: '' };
const $ = id => document.getElementById(id);
const money = n => n.toLocaleString('ru-RU') + ' ₽';

/**
 * Назначение: обновляет блок итоговой записи (#sService, #sPrice, #sBarber,
 * #sDate, #sTime, #sDuration, #sTotal) по текущему состоянию state
 * и подсвечивает пройденные шаги в списке .step.
 * Побочные эффекты: изменяет текстовое содержимое элементов сводки,
 * переключает класс is-active у .step, скрывает #bookError.
 */
function render() {
  $('bookError').hidden = true;
  $('sService').textContent = state.service || '—';
  $('sPrice').textContent = state.service ? money(state.price) : '';
  $('sBarber').textContent = state.barber || '—';
  $('sDate').textContent = state.date
    ? state.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  $('sTime').textContent = state.time || '—';
  $('sDuration').textContent = state.duration || '—';
  $('sTotal').textContent = money(state.price);
  const done = [state.service, state.barber, state.date && state.time, state.service && state.barber && state.date && state.time];
  document.querySelectorAll('.step').forEach((s, i) => s.classList.toggle('is-active', i === 0 || !!done[i - 1]));
}

/**
 * Назначение: навешивает на контейнер делегированный обработчик клика,
 * который обеспечивает выбор ровно одного элемента из группы
 * (услуга / барбер / время), снимая выделение с остальных.
 * Параметры:
 * container — DOM-элемент, внутри которого происходит выбор;
 * selector  — CSS-селектор выбираемых элементов;
 * onPick    — функция обратного вызова, принимающая выбранный элемент.
 * Побочные эффекты: изменяет классы is-selected у элементов группы,
 * вызывает onPick и render().
 */
function singleSelect(container, selector, onPick) {
  container.addEventListener('click', e => {
    const item = e.target.closest(selector);
    if (!item) return;
    container.querySelectorAll(selector).forEach(el => el.classList.remove('is-selected'));
    item.classList.add('is-selected');
    onPick(item);
    render();
  });
}
singleSelect($('services'), '.option', el => {
  state.service = el.dataset.name; state.price = +el.dataset.price; state.duration = el.dataset.duration;
});
singleSelect($('barbers'), '.option', el => { state.barber = el.dataset.name; });
singleSelect($('times'), 'button', el => { state.time = el.textContent; });

let view = new Date(); view.setDate(1);
const today = new Date(); today.setHours(0, 0, 0, 0);

/**
 * Назначение: формирует сетку календаря для текущего отображаемого месяца
 * (переменная view), блокирует прошедшие дни и воскресенья,
 * отмечает выбранную дату и обновляет подпись месяца.
 * Побочные эффекты: изменяет innerHTML элемента #calendar,
 * текст #monthLabel, навешивает обработчики click на дни.
 */
function renderCalendar() {
  const grid = $('calendar');
  grid.innerHTML = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'].map(d => `<span class="dow">${d}</span>`).join('');
  $('monthLabel').textContent = view.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  const y = view.getFullYear(), m = view.getMonth();
  const first = (new Date(y, m, 1).getDay() + 6) % 7, 
         days = new Date(y, m + 1, 0).getDate();
  for (let i = 0; i < first; i++) grid.insertAdjacentHTML('beforeend', '<span></span>');
  for (let d = 1; d <= days; d++) {
    const date = new Date(y, m, d);
    const btn = document.createElement('button');
    btn.textContent = d;
    btn.disabled = date < today || date.getDay() === 0;
    if (state.date && +state.date === +date) btn.classList.add('is-selected');
    btn.addEventListener('click', () => { state.date = date; renderCalendar(); render(); });
    grid.appendChild(btn);
  }
}
$('prev').addEventListener('click', () => { view.setMonth(view.getMonth() - 1); renderCalendar(); });
$('next').addEventListener('click', () => { view.setMonth(view.getMonth() + 1); renderCalendar(); });

//окно подтверждения записи 
const modal = $('bookModal');
const phoneInput = $('phone');

//кнопка подтвердить запись
$('confirm').addEventListener('click', () => {
  const missing = !state.service ? 'услугу' : !state.barber ? 'барбера' : !state.date ? 'дату' : !state.time ? 'время' : null;
  $('bookError').hidden = !missing;
  if (missing) { $('bookError').textContent = 'Выберите ' + missing; return; }
  openBook();
});

/**
 * Назначение: открывает модальное окно подтверждения записи (#bookModal),
 * заполняет его сводку текущими данными state, сбрасывает
 * состояние формы и блокирует прокрутку страницы под окном.
 * Побочные эффекты: изменяет содержимое #mService, #mBarber, #mDateTime,
 * #mPrice, #bookTitle; переключает hidden у #bookForm,
 * #bookDone, #phoneError, #bookModal; меняет overflow body;
 * устанавливает фокус на поле телефона.
 */
function openBook() {
  $('mService').textContent = state.service;
  $('mBarber').textContent = state.barber;
  $('mDateTime').textContent = $('sDate').textContent + ', ' + state.time;
  $('mPrice').textContent = money(state.price);
  $('bookTitle').textContent = 'Подтверждение записи';
  $('bookForm').hidden = false;
  $('bookDone').hidden = true;
  $('phoneError').hidden = true;
  modal.hidden = false;
  document.body.style.overflow = 'hidden'; 
  phoneInput.focus();
}
/**
 * Назначение: закрывает модальное окно подтверждения записи и снимает
 * блокировку прокрутки страницы.
 * Параметры: не предусмотрены.
 * Побочные эффекты: скрывает #bookModal, восстанавливает overflow body.
 */
function closeBook() { modal.hidden = true; document.body.style.overflow = ''; }
$('bookClose').addEventListener('click', closeBook);
$('doneClose').addEventListener('click', closeBook);
modal.addEventListener('click', e => { if (e.target === modal) closeBook(); }); // клик по размытому фону
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeBook(); });

//маска телефона
phoneInput.addEventListener('input', () => {
  let d = phoneInput.value.replace(/\D/g, '');
  if (d[0] === '7' || d[0] === '8') d = d.slice(1); 
  d = d.slice(0, 10);
  let out = '+7';
  if (d.length) out += ' (' + d.slice(0, 3);
  if (d.length >= 3) out += ')';
  if (d.length > 3) out += ' ' + d.slice(3, 6);
  if (d.length > 6) out += '-' + d.slice(6, 8);
  if (d.length > 8) out += '-' + d.slice(8, 10);
  phoneInput.value = out;
});

//отправка формы
$('bookForm').addEventListener('submit', e => {
  e.preventDefault();
  if (phoneInput.value.replace(/\D/g, '').length !== 11) {
    $('phoneError').hidden = false;
    phoneInput.focus();
    return;
  }
  const name = $('clientName').value.trim();
  const booking = { ...state, name, phone: phoneInput.value };
  console.log('Запись:', booking);

  $('bookTitle').textContent = 'Запись подтверждена';
  $('doneText').textContent = name ? name + ', ждём вас!' : 'Ждём вас!';
  $('bookForm').hidden = true;
  $('bookDone').hidden = false;
});

const s = document.querySelector('#services .is-selected');
state.service = s.dataset.name; state.price = +s.dataset.price; state.duration = s.dataset.duration;
state.barber = document.querySelector('#barbers .is-selected').dataset.name;
state.time = document.querySelector('#times .is-selected').textContent;
renderCalendar(); render();
