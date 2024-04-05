export const promotionalLinks = (containerEl: HTMLElement): HTMLElement => {
  const linksDiv = containerEl.createEl('div');
  linksDiv.classList.add('ait-promotional-links');
  const twitterSpan = linksDiv.createDiv('coffee');
  twitterSpan.addClass('ex-twitter-span');
  const captionText = twitterSpan.createDiv();
  captionText.innerText = 'Learn more about my work at:';
  twitterSpan.appendChild(captionText);
  const twitterLink = twitterSpan.createEl('a', { href: 'https://tfthacker.com' });
  twitterLink.innerText = 'https://tfthacker.com';
  return linksDiv;
};
