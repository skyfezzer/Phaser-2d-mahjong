import { Game, AUTO } from 'phaser';
import PlayScene from './src/scenes/PlayScene';

const config = {
  name: 'app',
  type: AUTO,
  width: 992,
  height: 552,
  scene: [PlayScene],
};

window.game = new Game(config);