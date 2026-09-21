/* Shared, consent-gated analytics for the public website and Mintlify docs. */
(() => {
  if (!['ohmyho.st', 'docs.ohmyho.st'].includes(location.hostname) || globalThis.omhAnalytics) return;
  globalThis.omhAnalytics = true;
  const id = 'G-C1PWJM238R';
  const consent = () => document.cookie.split(';').map(v => v.trim()).find(v => v.startsWith('omh_analytics='))?.split('=')[1];
  const clean = value => { try { const url = new globalThis.URL(value); return url.protocol === 'https:' || url.protocol === 'http:' ? url.origin + url.pathname : ''; } catch { return ''; } };
  let loaded = false, lastPage = '', granted = consent() === 'v1.granted';
  globalThis['ga-disable-' + id] = !granted;
  function tag() { globalThis.dataLayer = globalThis.dataLayer || []; globalThis.dataLayer.push(arguments); }
  const page = () => {
    if (!loaded) return;
    if (consent() !== 'v1.granted') { globalThis['ga-disable-' + id] = true; return; }
    const path = location.origin + location.pathname;
    if (path === lastPage) return;
    const previous = lastPage || clean(document.referrer);
    lastPage = path;
    tag('set', { page_location: path, page_referrer: previous });
    tag('event', 'page_view', { send_to: id, page_location: path, page_title: document.title, page_referrer: previous });
  };
  const start = () => {
    if (consent() !== 'v1.granted') return;
    globalThis['ga-disable-' + id] = false;
    if (!loaded) {
      loaded = true;
      tag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
      tag('js', new Date());
      tag('config', id, { send_page_view: false, page_location: location.origin + location.pathname, page_referrer: clean(document.referrer), cookie_domain: 'ohmyho.st', cookie_expires: 15552000, allow_google_signals: false, allow_ad_personalization_signals: false });
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
      document.head.appendChild(script);
    }
    page();
  };
  const clearCookies = () => {
    for (const part of document.cookie.split(';')) {
      const name = part.trim().split('=')[0];
      if (name === '_ga' || name.startsWith('_ga_')) {
        for (const domain of ['', '; Domain=ohmyho.st', '; Domain=' + location.hostname]) document.cookie = name + '=; Path=/; Max-Age=0; Secure; SameSite=Lax' + domain;
      }
    }
  };
  const mount = () => {
    let notice = document.getElementById('cookie-notice');
    if (!notice) { notice = document.createElement('aside'); notice.id = 'cookie-notice'; document.body.appendChild(notice); }
    notice.setAttribute('aria-label', 'Analytics preferences');
    notice.innerHTML = '';
    const text = document.createElement('span');
    text.innerHTML = 'Allow Google Analytics on our website and docs? Your choice is optional. <a href="https://ohmyho.st/cookies">Cookie details</a>';
    notice.appendChild(text);
    const choose = allow => {
      const wasLoaded = loaded;
      document.cookie = 'omh_analytics=v1.' + (allow ? 'granted' : 'denied') + '; Domain=ohmyho.st; Path=/; Max-Age=15552000; Secure; SameSite=Lax';
      granted = allow && consent() === 'v1.granted';
      notice.hidden = consent() === 'v1.granted' || consent() === 'v1.denied';
      globalThis['ga-disable-' + id] = !granted;
      if (granted) start();
      else { clearCookies(); if (wasLoaded) location.reload(); }
    };
    for (const [key, label, allow] of [['reject', 'Reject analytics', false], ['accept', 'Allow analytics', true]]) {
      const button = document.createElement('button'); button.id = 'omh-analytics-' + key; button.type = 'button'; button.textContent = label; button.addEventListener('click', () => choose(allow)); notice.appendChild(button);
    }
    const settings = document.createElement('button'); settings.id = 'omh-analytics-settings'; settings.type = 'button'; settings.textContent = 'Cookie settings'; settings.addEventListener('click', () => { notice.hidden = false; document.getElementById('omh-analytics-reject').focus(); }); document.body.appendChild(settings);
    notice.hidden = ['v1.granted', 'v1.denied'].includes(consent());
    if (granted) start();
  };
  for (const method of ['pushState', 'replaceState']) {
    const original = history[method];
    history[method] = function (...args) { const result = original.apply(this, args); setTimeout(page, 0); return result; };
  }
  globalThis.addEventListener('popstate', () => setTimeout(page, 0));
  // Detect preference changes made on the other host before sending further events.
  const sync = () => {
    const next = consent() === 'v1.granted';
    if (next === granted) return;
    granted = next;
    globalThis['ga-disable-' + id] = !next;
    if (next) start(); else { clearCookies(); if (loaded) location.reload(); }
  };
  globalThis.addEventListener('focus', sync);
  globalThis.setInterval(sync, 1000);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
