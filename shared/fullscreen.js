export const setupFullscreenButton = (button) => {
  const sync = () => {
    button.hidden = Boolean(document.fullscreenElement);
  };

  button.addEventListener('click', () => {
    document.documentElement.requestFullscreen?.().catch(() => {});
  });

  document.addEventListener('fullscreenchange', sync);
  sync();
};
