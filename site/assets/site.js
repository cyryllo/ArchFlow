// "Copy" buttons on code blocks
document.querySelectorAll('.code').forEach((block) => {
  const button = document.createElement('button');
  button.className = 'copy';
  button.type = 'button';
  const label = document.documentElement.lang === 'pl' ? ['Kopiuj', 'Skopiowano'] : ['Copy', 'Copied'];
  button.textContent = label[0];
  button.addEventListener('click', async () => {
    // Copy only the commands, without "# comment" lines
    const text = block.querySelector('code').innerText
      .split('\n')
      .map((line) => line.replace(/\s+#.*$/, ''))
      .filter((line) => line.trim() && !line.trim().startsWith('#'))
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = label[1];
      setTimeout(() => { button.textContent = label[0]; }, 1500);
    } catch (e) {
      console.error('Copy failed', e);
    }
  });
  block.appendChild(button);
});
