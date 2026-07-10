import { QueueManager } from './QueueManager.js';

const urlParams = new URLSearchParams(window.location.search);
const streamKey = urlParams.get('key');

if (!streamKey) {
  console.error('No stream key provided in URL! Use ?key=...');
} else {
  new QueueManager(streamKey);
}
