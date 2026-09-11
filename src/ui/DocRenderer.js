export const parseMd = (text) => {
  text = text.replace(/\r\n/g, '\n');

  text = text
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/^[\*\-]\s+(.*$)/gim, '<li>$1</li>');

  // Wrap contiguous <li> tags in <ul>
  text = text.replace(/(<li>[\s\S]*?<\/li>)/gim, '<ul>$1</ul>');
  text = text.replace(/<\/ul>\n<ul>/gim, '\n');

  text = text
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/!\[(.*?)\]\((.*?)\)/gim, "<img alt='$1' src='$2' />")
    .replace(/\[(.*?)\]\((.*?)\)/gim, "<a href='$2' target='_blank'>$1</a>")
    .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
    .replace(/`(.*?)`/gim, '<code>$1</code>');

  // Replace double newlines with paragraph tags
  text = '<p>' + text.split(/\n\n+/).join('</p><p>') + '</p>';
  
  // Cleanup paragraphs wrapping block elements
  text = text.replace(/<p>\s*<(h1|h2|h3|ul|blockquote|pre)/gim, '<$1');
  text = text.replace(/<\/(h1|h2|h3|ul|blockquote|pre)>\s*<\/p>/gim, '</$1>');

  return text;
};

const injectStyles = () => {
  if (document.getElementById('doc-shared-styles')) return;
  const style = document.createElement('style');
  style.id = 'doc-shared-styles';
  style.textContent = `
    body {
      margin: 0; padding: 0;
      background: #0a0a14;
      color: #e0e0e0;
      font-family: 'Outfit', -apple-system, sans-serif;
      line-height: 1.7;
    }
    .container {
      max-width: 760px;
      margin: 60px auto;
      padding: 50px 60px;
      background: #13131f;
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 16px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    }
    h1, h2, h3 { color: #FF9933; margin-top: 1.5em; margin-bottom: 0.5em; }
    h1 { margin-top: 0; font-size: 2.2em; line-height: 1.2; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px; }
    h2 { font-size: 1.6em; }
    a { color: #4fc3f7; text-decoration: none; transition: color 0.2s; }
    a:hover { color: #81d4fa; text-decoration: underline; }
    .back-btn {
      display: inline-block;
      margin-bottom: 30px;
      color: rgba(255,255,255,0.5);
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      transition: color 0.2s;
    }
    .back-btn:hover { color: #FF9933; text-decoration: none; }
    ul { padding-left: 20px; margin-bottom: 1.5em; }
    li { margin-bottom: 8px; }
    p { margin-bottom: 1.5em; }
    strong { color: #fff; }
    pre { background: #050508; padding: 20px; border-radius: 8px; overflow-x: auto; border: 1px solid rgba(255,255,255,0.05); }
    code { background: rgba(255,255,255,0.1); padding: 3px 6px; border-radius: 4px; font-family: 'Fira Code', monospace; font-size: 0.9em; }
    pre code { background: none; padding: 0; border-radius: 0; }
    img { max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0; }
    blockquote { border-left: 4px solid #FF9933; margin: 0; padding-left: 20px; color: rgba(255,255,255,0.7); }
    
    @media (max-width: 768px) {
      .container { margin: 20px; padding: 30px 20px; }
    }
  `;
  document.head.appendChild(style);
};

export const renderDoc = (title, text) => {
  injectStyles();
  document.title = `${title} - The Great Desi Odyssey`;
  const container = document.getElementById('doc-container');
  if (container) {
    container.innerHTML = parseMd(text);
  }
};
