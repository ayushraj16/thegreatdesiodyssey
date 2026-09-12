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
      background:
        radial-gradient(circle at 78% 4%, rgba(79,130,111,.3), transparent 33rem),
        linear-gradient(135deg, #0a1c1b 0%, #102925 55%, #0a1c1b 100%);
      color: #d5dace;
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.7;
      min-height: 100vh;
    }
    body::before { content:''; position:fixed; inset:0; z-index:-1; opacity:.16; pointer-events:none; background-image:linear-gradient(rgba(244,182,95,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(244,182,95,.12) 1px,transparent 1px); background-size:48px 48px; mask-image:linear-gradient(to bottom,black,transparent 75%); }
    .doc-site-header { max-width:1180px; margin:0 auto; padding:32px clamp(22px,5vw,64px); display:flex; align-items:center; justify-content:space-between; gap:28px; }
    .doc-brand { display:flex; align-items:center; gap:12px; color:#fff6e3; font-size:11px; font-weight:800; letter-spacing:.16em; text-decoration:none; }
    .doc-brand span { display:grid; place-items:center; width:38px; height:38px; border:1px solid #d7ad6a; border-radius:50%; color:#f4b65f; font-size:24px; }
    .doc-site-header nav { display:flex; gap:clamp(16px,3vw,36px); }
    .doc-site-header nav a,.doc-site-footer a { color:#fff6e3; text-decoration:none; text-transform:uppercase; font-size:11px; font-weight:700; letter-spacing:.12em; border-bottom:1px solid transparent; }
    .doc-site-header nav a:hover,.doc-site-header nav a.active,.doc-site-footer a:hover { color:#f4b65f; border-color:#f4b65f; }
    .container {
      max-width: 880px;
      margin: 36px auto 80px;
      padding: clamp(30px,6vw,72px);
      background: rgba(8,26,24,.78);
      border: 1px solid rgba(244,182,95,.22);
      border-radius: 10px;
      box-shadow: 0 28px 80px rgba(0,0,0,.3);
      backdrop-filter: blur(16px);
    }
    .doc-kicker { display:flex; align-items:center; gap:12px; margin-bottom:18px; color:#d9bc89; font-size:10px; font-weight:800; letter-spacing:.22em; }
    .doc-kicker::before { content:''; width:32px; height:2px; background:#e9a74b; }
    h1, h2, h3 { color: #f4b65f; margin-top: 1.65em; margin-bottom: 0.55em; }
    h1 { margin-top: 0; color:#fff6e3; font-family:Georgia,'Times New Roman',serif; font-size:clamp(42px,7vw,72px); font-weight:500; letter-spacing:-.035em; line-height:1.02; border-bottom:1px solid rgba(244,182,95,.2); padding-bottom:24px; }
    h2 { font-family:Georgia,'Times New Roman',serif; font-size:clamp(25px,4vw,36px); font-weight:500; }
    h3 { color:#edcd9b; }
    #doc-container a { color:#f4b65f; text-decoration-color:rgba(244,182,95,.4); text-underline-offset:3px; }
    #doc-container a:hover { color:#ffcf8b; }
    .back-btn {
      display: inline-block;
      margin-bottom: 34px;
      color: #b5c1b1;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      transition: color 0.2s;
    }
    .back-btn:hover { color:#f4b65f; text-decoration:none; }
    ul { padding-left: 20px; margin-bottom: 1.5em; }
    li { margin-bottom: 8px; }
    p { margin-bottom: 1.5em; }
    strong { color:#fff6e3; }
    pre { background:#071412; padding:20px; border-radius:8px; overflow-x:auto; border:1px solid rgba(244,182,95,.15); }
    code { background:rgba(244,182,95,.11); color:#f2d5a8; padding:3px 6px; border-radius:4px; font-family:ui-monospace,monospace; font-size:.9em; }
    pre code { background: none; padding: 0; border-radius: 0; }
    img { max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0; }
    blockquote { border-left:4px solid #f4b65f; margin:0; padding-left:20px; color:#b5c1b1; }
    .doc-site-footer { max-width:1180px; margin:0 auto; padding:0 clamp(22px,5vw,64px) 36px; display:flex; justify-content:space-between; gap:20px; }
    
    @media (max-width: 768px) {
      .doc-site-header { align-items:flex-start; padding-top:22px; }
      .doc-brand { font-size:0; }
      .doc-site-header nav { gap:14px; padding-top:10px; }
      .doc-site-header nav a { font-size:9px; }
      .container { margin:10px 18px 50px; padding:32px 22px; }
      .doc-site-footer { padding-bottom:24px; }
      .doc-site-footer a { font-size:9px; }
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
