(() => {
  'use strict';

  const form = document.querySelector('#investigation-form');
  const input = document.querySelector('#investigation-input');
  const conversation = document.querySelector('#conversation');
  const button = document.querySelector('#investigate-button');
  const formMessage = document.querySelector('#form-message');
  const agentState = document.querySelector('#agent-state');
  const clearButton = document.querySelector('#clear-conversation');
  const exampleButtons = document.querySelectorAll('[data-prompt]');
  const history = [];
  const MAX_CLIENT_HISTORY = 8;

  function setFormMessage(message, isError = false) {
    formMessage.textContent = message;
    formMessage.classList.toggle('is-error', isError);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function renderInline(value) {
    return escapeHtml(value)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  }

  function renderMarkdown(value) {
    const lines = String(value).replace(/\r\n/g, '\n').split('\n');
    const fragments = [];
    let listType = null;
    let listItems = [];
    let paragraph = [];

    function flushParagraph() {
      if (paragraph.length) {
        fragments.push(`<p>${paragraph.map(renderInline).join('<br>')}</p>`);
        paragraph = [];
      }
    }

    function flushList() {
      if (!listItems.length) return;
      fragments.push(`<${listType}>${listItems.map((item) => `<li>${renderInline(item)}</li>`).join('')}</${listType}>`);
      listItems = [];
      listType = null;
    }

    lines.forEach((rawLine) => {
      const line = rawLine.trim();
      const heading = line.match(/^(#{1,3})\s+(.+)$/);
      const unordered = line.match(/^[-*]\s+(.+)$/);
      const ordered = line.match(/^\d+[.)]\s+(.+)$/);

      if (heading) {
        flushParagraph();
        flushList();
        const level = Math.min(heading[1].length + 1, 4);
        fragments.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      } else if (unordered || ordered) {
        flushParagraph();
        const nextType = unordered ? 'ul' : 'ol';
        if (listType && listType !== nextType) flushList();
        listType = nextType;
        listItems.push((unordered || ordered)[1]);
      } else if (!line) {
        flushParagraph();
        flushList();
      } else {
        flushList();
        paragraph.push(line);
      }
    });

    flushParagraph();
    flushList();
    return fragments.join('') || '<p>No analysis was returned.</p>';
  }

  function addMessage(role, content, loading = false) {
    const article = document.createElement('article');
    article.className = `message ${role === 'user' ? 'user-message' : 'assistant-message'}${loading ? ' is-loading' : ''}`;

    const label = document.createElement('p');
    label.className = 'message-label';
    label.textContent = role === 'user' ? 'Your proposition' : 'The Recursive Observer';

    const body = document.createElement('div');
    body.className = 'message-content';
    if (loading) {
      body.textContent = content;
    } else if (role === 'assistant') {
      body.innerHTML = renderMarkdown(content);
    } else {
      body.textContent = content;
    }

    article.append(label, body);
    conversation.append(article);
    article.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return article;
  }

  function resetConversation() {
    history.splice(0, history.length);
    conversation.innerHTML = '';
    addMessage('assistant', 'Present one proposition, experience, or question. I will separate what the reasoning establishes from what it merely permits.');
    setFormMessage('Conversation context cleared from this browser session.');
    input.focus();
  }

  function pushHistory(role, content) {
    history.push({ role, content });
    while (history.length > MAX_CLIENT_HISTORY) history.shift();
  }

  async function getAgentStatus() {
    try {
      const response = await fetch('/api/recursive-observer/status', { headers: { Accept: 'application/json' } });
      const data = await response.json();
      if (data.ok && data.configured) {
        agentState.textContent = 'Secure reasoning service available';
        agentState.classList.add('is-ready');
      } else {
        agentState.textContent = 'Secure reasoning service awaits configuration';
        agentState.classList.add('is-offline');
      }
    } catch (_) {
      agentState.textContent = 'Service status unavailable';
      agentState.classList.add('is-offline');
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = input.value.trim();

    if (message.length < 3) {
      setFormMessage('Enter at least a short claim or question before beginning.', true);
      input.focus();
      return;
    }

    button.disabled = true;
    input.disabled = true;
    setFormMessage('Separating premise, inference, and evidence…');
    addMessage('user', message);
    const loading = addMessage('assistant', 'Constructing a disciplined investigation…', true);
    const priorHistory = history.slice(-MAX_CLIENT_HISTORY);

    try {
      const response = await fetch('/api/recursive-observer/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ message, history: priorHistory }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'The investigation could not be completed right now.');
      }

      loading.remove();
      addMessage('assistant', data.analysis);
      pushHistory('user', message);
      pushHistory('assistant', data.analysis);
      input.value = '';
      setFormMessage('Analysis complete. The conversation is retained only in this browser tab until cleared or closed.');
    } catch (error) {
      loading.remove();
      addMessage('assistant', `## Open question\nThe investigation is unavailable at the moment. This does not evaluate the proposition one way or the other.\n\n**Next step:** ${error.message}`);
      setFormMessage(error.message, true);
    } finally {
      button.disabled = false;
      input.disabled = false;
      input.focus();
    }
  });

  clearButton.addEventListener('click', resetConversation);

  exampleButtons.forEach((example) => {
    example.addEventListener('click', () => {
      input.value = example.dataset.prompt || '';
      input.focus();
      setFormMessage('Example inserted. Edit it to reflect your own wording if needed.');
    });
  });

  getAgentStatus();
})();
