import { Game, AUTO } from 'phaser';
import PlayScene from './src/scenes/PlayScene';
import LandingScene from './src/scenes/LandingScene';

const config = {
  name: 'app',
  type: AUTO,
  width: 992,
  height: 552,
  scene: [LandingScene, PlayScene],
};

window.game = new Game(config);