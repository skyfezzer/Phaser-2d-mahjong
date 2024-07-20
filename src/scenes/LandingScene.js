import * as Phaser from 'phaser';

export default class LandingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LandingScene' });
    }

    create(){
        this.add.text(10, 10, 'Menu', { font: '48px Arial', fill: '#FFFFFF' });
        this.input.once('pointerdown', function ()
        {

            console.log('From SceneA to SceneB');

            this.scene.start('PlayScene');

        }, this);
    }

    update(time,delta){

    }
}