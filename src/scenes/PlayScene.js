import * as Phaser from 'phaser';

const MAX_DIFFICULTY = 20;

export default class PlayScene extends Phaser.Scene {

    constructor() {
        super({ key: 'PlayScene' });
    }


    preload() {
        let params = new URLSearchParams(window.location.search);
        let skins = ["default", "leaf"];
        this.skin = "default";
        this.difficulty = 16;
        if (params.get("skin")) {
            this.skin = params.get("skin");
        }
        if (params.get("difficulty")) {
            this.difficulty = params.get("difficulty");
        }
        for (const skinIndex in skins) {

            for (let i = 1; i <= MAX_DIFFICULTY; i++) {
                console.log(`tile${i}${skins[skinIndex]}`, `static/${skins[skinIndex]}/tile${i}.svg`);
                this.load.image(`tile${i}${skins[skinIndex]}`, `static/${skins[skinIndex]}/tile${i}.svg`);
            }
        }
    }

    create() {

        this.debug = true;
        this.grid = this.generate_grid(15, 8);  // 10x10 for simplicity
        this.graphics = this.add.graphics();
        this.tileSprites = [];
        if (this.grid) {
            this.drawTiles();
        } else {
            console.error('Failed to generate a valid grid.');
        }
    }

    drawTiles() {
        // Destroy old sprites
        this.tileSprites.forEach(sprite => sprite.destroy());
        this.tileSprites = [];

        for (let x = 0; x < this.grid.length; x++) {
            for (let y = 0; y < this.grid[x].length; y++) {
                const tileType = this.grid[x][y];
                if (tileType) {
                    const sprite = this.add.sprite(x * 64 + 32, y * 64 + 32, `tile${tileType}${this.skin}`);
                    sprite.setInteractive();

                    // On hover: 1px white outline
                    sprite.on('pointerover', () => {
                        sprite.setTint(0xaaaaaa);
                    });

                    // On hover out: remove outline
                    sprite.on('pointerout', () => {
                        sprite.clearTint();
                    });

                    // On click: 3px red outline and white tint
                    sprite.on('pointerdown', () => {
                        this.onTileClicked(x, y);
                        sprite.setTint(0xffffff);
                    });

                    this.tileSprites.push(sprite);
                }
            }
        }
    }

    onTileClicked(x, y) {
        console.log({ x, y, tile: this.grid[x][y] });
        if (this.selectedTile) {
            // Second tile clicked
            const firstTile = this.selectedTile;
            const secondTile = { x, y, tile: this.grid[x][y] };

            if (firstTile.tile === secondTile.tile &&
                (firstTile.x !== secondTile.x || firstTile.y !== secondTile.y)) {
                if (this.findPath(firstTile.x, firstTile.y, secondTile.x, secondTile.y)) {
                    this.grid[firstTile.x][firstTile.y] = null;
                    this.grid[secondTile.x][secondTile.y] = null;

                    if (this.isGameOver()) {
                        this.hasWon();
                    }
                    this.drawTiles();
                }
            }
            this.selectedTile = null;
            this.graphics.clear();
        } else {
            // First tile clicked
            this.selectedTile = { x, y, tile: this.grid[x][y] };
            this.graphics.lineStyle(3, 0xff0000, 1);
            this.graphics.strokeRect(x * 64, y * 64, 64, 64);
        }
    }

    isGameOver() {
        // Check if all tiles are removed
        for (let x = 0; x < this.grid.length; x++) {
            for (let y = 0; y < this.grid[x].length; y++) {
                if (this.grid[x][y] !== null) {
                    return false;
                }
            }
        }
        return true;
    }

    generate_grid(x, y, difficulty = this.difficulty) {
        let grid = Array.from({ length: x }, () => Array(y).fill(null));
        let availableTiles = new Set();
        let tileStack = [];

        // Initialize tile stack
        const totalTiles = x * y;
        for (let i = 0; i < totalTiles / 2; i++) {
            const tileType = Math.ceil(Math.random() * difficulty);
            tileStack.push(tileType);
        }
        // Shuffle the tileStack
        tileStack = this.shuffle(tileStack);

        // While there is tiles to lay out
        while (tileStack.length > 0) {
            const tileType = tileStack.pop();
            //console.log(`tiles left : ${tileStack.length}`);
            availableTiles = this.getEmptyTiles(grid);
            if (availableTiles.size === 0) {
                console.error("No available tiles left when laying tile 1");
                break; // Or some other error-handling logic
            }

            const tile = this.getRandomFromSet(availableTiles);
            const [x, y] = tile.split(',').map(Number);
            grid[x][y] = tileType;
            //console.log(`placed ${tileType} on {${x},${y}} & `);
            availableTiles = this.getEmptyTiles(grid);
            if (availableTiles.size === 0) {
                console.error("No available tiles left when laying second tile, should never happen.");
                break; // Or some other error-handling logic
            }
            const tile2 = this.getRandomFromSet(availableTiles);
            const [x2, y2] = tile2.split(',').map(Number);
            grid[x2][y2] = tileType;

        }

        return grid;
    }
    generate_grid_random(x, y) {
        let grid = Array.from({ length: x }, () => Array(y).fill(null));
        let availableTiles = new Set();
        let tileStack = [];

        // Initialize tile stack
        const totalTiles = x * y;
        for (let i = 0; i < totalTiles / 2; i++) {
            const tileType = Math.ceil(Math.random() * 12);
            tileStack.push(tileType);
        }
        // Shuffle the tileStack
        tileStack = this.shuffle(tileStack);

        // Place the first tile randomly and update availableTiles
        const firstX = Math.floor(Math.random() * x);
        const firstY = Math.floor(Math.random() * y);
        const firstTileType = tileStack.pop();
        grid[firstX][firstY] = firstTileType;
        this.updateAvailableTiles(firstX, firstY, grid, availableTiles);
        while (tileStack.length > 0) {
            const tileType = tileStack.pop();

            if (availableTiles.size === 0) {
                console.error("No available tiles left");
                break; // Or some other error-handling logic
            }

            // Choose a random position from availableTiles for the first tile
            const randomPos = this.getRandomFromSet(availableTiles);
            if (!randomPos) continue;

            const [randomX1, randomY1] = randomPos.split(',').map(Number);

            // Generate a list of valid tiles for the second tile
            const validPathTiles = new Set();
            for (const pos of availableTiles) {
                const [x, y] = pos.split(',').map(Number);
                if (this.findPath(randomX1, randomY1, x, y, grid)) {
                    validPathTiles.add(pos);
                }
            }

            if (validPathTiles.size === 0) {
                console.error("No valid path found for second tile");
                continue; // Or some other error-handling logic
            }

            // Choose a random position from validPathTiles for the second tile
            const randomPos2 = this.getRandomFromSet(validPathTiles);
            if (!randomPos2) {
                continue;
                console.error("should never show");
            }
            const [randomX2, randomY2] = randomPos2.split(',').map(Number);
            // Update grid and availableTiles for the first tile
            grid[randomX1][randomY1] = tileType;
            availableTiles.delete(randomPos);
            this.updateAvailableTiles(randomX1, randomY1, grid, availableTiles);
            // Update grid and availableTiles for the second tile
            grid[randomX2][randomY2] = tileType;
            availableTiles.delete(randomPos2);
            this.updateAvailableTiles(randomX2, randomY2, grid, availableTiles);
        }

        return grid;


    }

    getEmptyTiles(grid) {
        let emptyTiles = new Set();
        for (let i = 0; i < grid.length; i++) {
            for (let j = 0; j < grid[0].length; j++) {
                if (grid[i][j] !== null) {
                    continue;
                }
                const pos = `${i},${j}`;
                emptyTiles.add(pos);
            }
        }
        return emptyTiles;
    }

    // Helper function to update availableTiles based on neighbors of (x, y)
    updateAvailableTiles(x, y, grid, availableTiles) {
        const directions = [
            { dx: 0, dy: -1 }, // Up
            { dx: 0, dy: 1 },  // Down
            { dx: -1, dy: 0 }, // Left
            { dx: 1, dy: 0 },  // Right
        ];

        for (const { dx, dy } of directions) {
            const newX = x + dx;
            const newY = y + dy;

            if (newX >= 0 && newX < grid.length && newY >= 0 && newY < grid[0].length) {
                // Skip if the tile is already defined in the grid
                if (grid[newX][newY] !== null) continue;

                const pos = `${newX},${newY}`;
                availableTiles.add(pos);
            }
        }
    }


    // Helper function to get a random element from a Set
    getRandomFromSet(set) {
        const items = Array.from(set);
        return items[Math.floor(Math.random() * items.length)];
    }

    // Helper function to shuffle an array
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    findPath(startX, startY, endX, endY, grid = this.grid) {
        const checkStraightLine = (x1, y1, x2, y2, grid) => {
            if (x1 === x2) {
                if (x1 >= grid.length || x1 < 0) {
                    return true;
                }
                let start = Math.min(y1, y2);
                let end = Math.max(y1, y2);
                for (let y = start + 1; y < end; y++) {
                    if (y >= 0 && y < grid[0].length && grid[x1]?.[y] !== null) return false;
                }
            } else if (y1 === y2) {
                if (y1 >= grid[0].length || y1 < 0) {
                    return true;
                }
                let start = Math.min(x1, x2);
                let end = Math.max(x1, x2);
                for (let x = start + 1; x < end; x++) {
                    if (x >= 0 && x < grid.length && grid[x]?.[y1] !== null) return false;
                }
            } else {
                return false;
            }
            return true;
        };

        // Direct link
        if (checkStraightLine(startX, startY, endX, endY, grid)) {
            //console.log("Direct connection.");
            return true;
        }

        // Loop to check for 1-turn and 2-turn connections
        for (let x = -1; x <= grid.length; x++) {
            for (let y = -1; y <= grid[0].length; y++) {
                // Skip over the start and end tiles
                if ((x === startX && y === startY) || (x === endX && y === endY)) continue;

                // Check if the pivot tile is empty or out-of-bounds
                const isCurrentTileValid = (x < 0 || x >= grid.length || y < 0 || y >= grid[0].length)
                    ? true : (grid[x]?.[y] === null);
                if (isCurrentTileValid &&
                    checkStraightLine(startX, startY, x, y, grid) &&
                    checkStraightLine(x, y, endX, endY, grid)) {
                    //console.log("1-turn connection via ", x, y);
                    return true;
                }

                // Check for a 2-turn path via this point
                for (let x2 = -1; x2 <= grid.length; x2++) {
                    for (let y2 = -1; y2 <= grid[0].length; y2++) {
                        // Skip over the start and end tiles
                        if ((x2 === startX && y2 === startY) || (x2 === endX && y2 === endY)) continue;
                        //console.log("Checking 2-turn via: ", x, y, " and ", x2, y2);
                        const isNextTileValid = (x2 < 0 || x2 >= grid.length || y2 < 0 || y2 >= grid[0].length)
                            ? true : (grid[x2]?.[y2] === null);

                        if (isCurrentTileValid &&
                            isNextTileValid &&
                            checkStraightLine(startX, startY, x, y, grid) &&
                            checkStraightLine(x, y, x2, y2, grid) &&
                            checkStraightLine(x2, y2, endX, endY, grid)) {
                            //console.log("2-turn connection via ", x, y, " and ", x2, y2);
                            return true;
                        }
                    }
                }
            }
        }
        //console.log("No connection available.");
        return false;
    }

    validate_grid(grid) {
        // Grid got generated by algorithm, it is 100% valid.
        return true;
    }

    hasWon() {
        this.displayWinText();

    }

    afterWin() {
        if (this.difficulty < MAX_DIFFICULTY) {
            this.difficulty++;
        } else {
            this.difficulty = MAX_DIFFICULTY;
        }
        if(this.skin == "leaf"){
            this.skin = "default";
        }else{
            this.skin = "leaf";
        }
        
        this.grid = this.generate_grid(15, 8);
        this.drawTiles();
    }

    displayWinText() {
        // Create the text to display
        const text = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 3, 'VICTOIRE !', {
            font: '40px Arial',
            fill: '#33ff33'
        });
        text.setOrigin(0.5);

        const text2 = this.add.text(this.sys.game.config.width / 2, this.sys.game.config.height / 2, 'niveau suivant...', {
            font: '40px Arial',
            fill: '#33ff33'
        });
        text2.setOrigin(0.5);

        // Display the text for 3 seconds
        this.time.delayedCall(500, () => {
            // Gradually make the text transparent over 1 second
            this.tweens.add({
                targets: [text,text2],
                alpha: 0,
                duration: 2500,
                onComplete: () => {
                    // Remove the text when animation is complete
                    text.destroy();
                    this.afterWin();
                }
            });
        });
    }
}