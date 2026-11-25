import { openChannel, helloMessage } from '../../../../shared/channel.js';
import { setupFullscreenButton } from '../../../../shared/fullscreen.js';
import { questionsById } from '../../data/questions.js';
import { mountStage } from './stage.js';

setupFullscreenButton(document.getElementById('fullscreen-button'));

const stage = mountStage(document.getElementById('game-root'), questionsById);
stage.render(null);

const channel = openChannel('trivia');
channel.subscribe((message) => {
  if (message.type !== 'state') return;
  document.documentElement.dataset.theme = message.state?.settings?.theme ?? 'store';
  stage.render(message.state);
});
channel.send(helloMessage());
