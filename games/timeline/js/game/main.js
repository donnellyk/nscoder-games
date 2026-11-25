import { openChannel, helloMessage } from '../../../../shared/channel.js';
import { itemsById } from '../../data/items.js';
import { mountStage } from './stage.js';
import { setupFullscreenButton } from '../../../../shared/fullscreen.js';

const app = document.getElementById('game-root');
setupFullscreenButton(document.getElementById('fullscreen-button'));

const stage = mountStage(app, itemsById);
stage.render(null);

const channel = openChannel('timeline');
channel.subscribe((message) => {
  if (message.type === 'state') {
    // The stage itself carries the theme (see stage.js), but the projector
    // page's own letterbox area sits outside the stage box, so it needs the
    // same data-theme mirrored onto the document to match.
    document.documentElement.dataset.theme = message.state?.settings?.theme ?? 'store';
    stage.render(message.state);
  } else if (message.type === 'drag') {
    stage.setDragPosition(message.x === null ? null : { x: message.x, y: message.y });
  }
});
channel.send(helloMessage());
