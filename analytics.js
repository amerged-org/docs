/* Shared, consent-gated analytics for the public website and Mintlify docs. */
(() => {
  if (!['ohmyho.st', 'docs.ohmyho.st'].includes(location.hostname) || globalThis.omhAnalytics) return;
  globalThis.omhAnalytics = true;
  const id = 'G-C1PWJM238R';
  const consent = () => document.cookie.split(';').map(v => v.trim()).find(v => v.startsWith('omh_analytics='))?.split('=')[1];
  const clean = value => { try { const url = new globalThis.URL(value); return url.protocol === 'https:' || url.protocol === 'http:' ? url.origin + url.pathname : ''; } catch { return ''; } };
  let loaded = false, lastPage = '', granted = consent() === 'v1.granted', footerButton;
  const placeSettings = () => {
    if (!footerButton) return;
    const footer = document.querySelector('footer .fbot') || document.querySelector('footer, #footer');
    if (footer && footerButton.parentElement !== footer) footer.appendChild(footerButton);
  };
  globalThis['ga-disable-' + id] = !granted;
  function tag() { globalThis.dataLayer = globalThis.dataLayer || []; globalThis.dataLayer.push(arguments); }
  const page = () => {
    placeSettings();
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
    notice.setAttribute('aria-label', 'Cookie preferences');
    notice.innerHTML = '';
    const text = document.createElement('span');
    text.innerHTML = 'Optional cookies help us improve the site. <a href="https://ohmyho.st/cookies">Details</a>';
    notice.appendChild(text);

    const dialog = document.createElement('dialog');
    dialog.id = 'omh-cookie-dialog';
    dialog.setAttribute('aria-labelledby', 'omh-cookie-title');
    const title = document.createElement('h2'); title.id = 'omh-cookie-title'; title.textContent = 'Cookie preferences'; dialog.appendChild(title);
    const intro = document.createElement('p'); intro.textContent = 'Your choice applies to our website and docs.'; dialog.appendChild(intro);
    const essential = document.createElement('div'); essential.className = 'omh-cookie-option';
    essential.innerHTML = '<div><strong>Essential</strong><p>Required for sign-in and saving your choice.</p></div><span class="omh-cookie-required">Always on</span>';
    dialog.appendChild(essential);
    const analytics = document.createElement('div'); analytics.className = 'omh-cookie-option';
    const analyticsLabel = document.createElement('div');
    analyticsLabel.innerHTML = '<label for="omh-analytics-toggle">Analytics</label><p id="omh-analytics-description">Google Analytics helps us understand which pages are useful.</p>';
    analytics.appendChild(analyticsLabel);
    const toggle = document.createElement('input'); toggle.id = 'omh-analytics-toggle'; toggle.type = 'checkbox'; toggle.setAttribute('role', 'switch'); toggle.setAttribute('aria-describedby', 'omh-analytics-description'); analytics.appendChild(toggle);
    dialog.appendChild(analytics);
    const actions = document.createElement('div'); actions.className = 'omh-cookie-actions'; dialog.appendChild(actions);
    document.body.appendChild(dialog);
    const button = (parent, key, label, action) => {
      const node = document.createElement('button'); node.id = key; node.type = 'button'; node.textContent = label; node.addEventListener('click', action); parent.appendChild(node); return node;
    };
    const choose = allow => {
      const wasLoaded = loaded;
      document.cookie = 'omh_analytics=v1.' + (allow ? 'granted' : 'denied') + '; Domain=ohmyho.st; Path=/; Max-Age=15552000; Secure; SameSite=Lax';
      granted = allow && consent() === 'v1.granted';
      notice.hidden = ['v1.granted', 'v1.denied'].includes(consent());
      if (dialog.open) dialog.close();
      footerButton.focus({ preventScroll: true });
      globalThis['ga-disable-' + id] = !granted;
      if (granted) start();
      else { clearCookies(); if (wasLoaded) location.reload(); }
    };
    const dismiss = () => {
      if (!['v1.granted', 'v1.denied'].includes(consent())) choose(false);
      else { dialog.close(); notice.hidden = true; footerButton.focus({ preventScroll: true }); }
    };
    const close = button(dialog, 'omh-cookie-close', '×', dismiss); close.setAttribute('aria-label', 'Close cookie settings');
    dialog.addEventListener('cancel', event => { event.preventDefault(); dismiss(); });
    const openSettings = () => { notice.hidden = true; toggle.checked = consent() === 'v1.granted'; dialog.showModal(); };
    button(notice, 'omh-analytics-accept', 'Accept', () => choose(true));
    button(notice, 'omh-analytics-edit', 'Edit', openSettings);
    button(actions, 'omh-analytics-off', 'Turn off all', () => { toggle.checked = false; choose(false); });
    button(actions, 'omh-analytics-save', 'Save preferences', () => choose(toggle.checked));
    footerButton = document.createElement('button'); footerButton.id = 'omh-analytics-settings'; footerButton.type = 'button'; footerButton.setAttribute('aria-label', 'Cookie settings'); footerButton.setAttribute('title', 'Cookie settings');
    footerButton.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-9-9 4 4 0 0 0 4 4 4 4 0 0 0 5 5Z"/><path d="M8 8h.01M7 14h.01M12 12h.01M12 17h.01M17 15h.01"/></svg>';
    footerButton.addEventListener('click', openSettings);
    placeSettings();
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
    placeSettings();
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
