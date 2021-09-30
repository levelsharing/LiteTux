LITE_TUX_TILES = new Image();
LITE_TUX_TILES.src = "images/spritesheet.png";

LITETUX_DEFAULT_MAP_WIDTH = 162;

/** Game constants */
LITETUX_CONSTS = {
    "PIXEL_STEP" : .032,
    "GROUND_NONE" : 0,
    "GROUND_SOLID" : 1,
    "GROUND_SLIPPERY" : 2,

    "CIEL_SPIKE_VANISH_DELAY" : 15,
    "CIEL_SPIKE_ACC" : .03,
    "CIEL_SPIKE_MAX_VEL" : .1,

    "SNOWBALL_SPEED" : .04,

    "SHELL_SPEED" : .04,
    "SHELL_SQUASHED_SPEED" : .12,

    "DIVE_SPEED" : .12,
    "FLOAT_SPEED" : .04,

    "CANNON_SHOT_DELAY" : 200,
    "CANNON_BALL_SPEED" : .12,
    "CANNON_BALL_BUMP_FALL_SPEED" : 0.1,

    "PLAYER_ACCELERATION" : .04,

    // SCORE QUALIFIERS (for stats)
    "COLLECTED_COIN" : 0,
    "COLLECTED_GEM" : 1,
    "SQASHED_ENEMY" : 2,

    // GAME EVENTS SENT TO HOST
    "LEVEL_COMPLETE" : 1,
    "LOST_LIVE" : 2,
    "GAME_OVER" : 3
};

// *********************************************************************************************************

/** Gameplay statistics */
class LiteTuxLevelStats {
    constructor() {
        this.resetStats();
    }

    /**
     * Create a copy of stats
     * @param levelStats:LiteTuxLevelStats source to clone
     */
    clone(levelStats) {
        this.attemptsToCompleteLevel = levelStats.attemptsToCompleteLevel;
        this.coinsCollected = levelStats.coinsCollected;
        this.furthestColumnReached = levelStats.furthestColumnReached;
        this.gemsCollected = levelStats.gemsCollected;
        this.highestPointsEarnedInLevel = levelStats.highestPointsEarnedInLevel;
        this.jumpsMade = levelStats.jumpsMade;
        this.monstersStopmped = levelStats.monstersStopmped;
        this.totalPointsEarnedInThisLevel = levelStats.totalPointsEarnedInThisLevel;
    }

    /** resets the stats to all 0's */
    resetStats() {
        this.attemptsToCompleteLevel = 0;
        this.coinsCollected = 0;
        this.furthestColumnReached = 0;
        this.gemsCollected = 0;
        this.highestPointsEarnedInLevel = 0;
        this.jumpsMade = 0;
        this.monstersStopmped = 0;
        this.totalPointsEarnedInThisLevel = 0;
    }

    /** compare two sets of stats to see if they are identical */
    isDifferent(stats) {
        if (this.attemptsToCompleteLevel !== stats.attemptsToCompleteLevel) return true;
        if (this.coinsCollected !== stats.coinsCollected) return true;
        if (this.furthestColumnReached !== stats.furthestColumnReached) return true;
        if (this.gemsCollected !== stats.gemsCollected) return true;
        if (this.highestPointsEarnedInLevel !== stats.highestPointsEarnedInLevel) return true;
        if (this.jumpsMade !== stats.jumpsMade) return true;
        if (this.monstersStopmped !== stats.monstersStopmped) return true;
        if (this.totalPointsEarnedInThisLevel !== stats.totalPointsEarnedInThisLevel) return true;
        return false;
    }
}

// *********************************************************************************************************

/**
 * Handles the sprites in the game by creating sprites as they are needed and storing sprites into
 * pools so that they can be recycled to save on garbage collection and (very marginally) on creation
 * time.
 */
class LiteTuxSpriteManager {
    /**
     * @param worldManager:WorldManager reference to class controlling the world
     */
    constructor(worldManager) {
        this.worldManager = worldManager;
        this.classes = [null, CeilSpike, null, Owl,
                        Coin, Snowball, BigCoin, ShellEnemy,
                        null, GroundSpike, null, null,
                        null, null, null, Cannon, CannonBall];
        // set up the pools
        this.pools = [];
        for (let cntr = 0; cntr < this.classes.length; ++cntr) {
            if (this.classes[cntr] == null)
                this.pools.push(null);
            else
                this.pools.push([]);
        }
    }

    /** Spawns sprite tied to tileID or null if not a spawnable tile */
    spawnTile(wx, wy, tid) {
        let sprite = null;
        if (this.classes[tid] != null) {
            if (this.pools[tid].length > 0) {
                sprite = this.pools[tid].pop();
            } else {
                sprite = new this.classes[tid](new SLLPoint(wx,wy), this.worldManager);
            }
            sprite.reset(wx,wy);
        }

        return sprite;
    }

    /**
     * create the specified sprite (reusing recycled if possible)
     *
     * @param wx:number world x location
     * @param wy:number world y location
     * @param effectID:number id of the desired effect (from constants)
     * @return {EnvironmentalEffect} sprite for displaying the effect
     */
    spawnEffect(wx, wy, effectID) {
        // TODO pool environmental sprites
        // todo proper type selection ... how?
        let sprite;
        let pos = new SLLPoint(wx, wy);
        switch (effectID) {
            case LITE_TUX_SPRITE_INFO.COIN_BOX_BUMP:
                sprite = new CoinBox(pos, this.worldManager);
                break;
            case LITE_TUX_SPRITE_INFO.BLOCK_COIN:
                sprite = new EnvironmentalEffect(pos, this.worldManager, effectID, LITE_TUX_SPRITE_INFO.BLOCK_COIN_ANIM);
                break;
            case LITE_TUX_SPRITE_INFO.GROUND_COLLAPSE:
                sprite = new CollapsingGround(pos, this.worldManager);
                break;
            default:
                sprite = new EnvironmentalEffect(pos, this.worldManager, 64, [0,1,2,3]);
        }
        return sprite;
    }

    /**
     * stores sprite for recycling
     * @param sprite:Sprite sprite to be recycled
     */
    recycleSprite(sprite) {
        if (sprite == null)
            return;
        if (sprite.effectId != null) {
            // console.log("Can't recycle environment Effect sprites yet...TO DO");
            this.worldManager.effectSprites[sprite.id] = null;
        } else {
            this.pools[sprite.id].push(sprite);
        }
    }
}

// *********************************************************************************************************

/**
 * Game screen. This can be used by itself, as is done in the case of the editor, or can be
 * combined with other screens (see litetux_screens.js) to form a stand-alone game.
 */
class LiteTuxGame extends TileMapLayer {
    /**
     * @param host class hosting the game (needs playSound and gameEvent methods)
     */
    constructor(host) {
        super("game", 640,480, new TileMap(LITETUX_DEFAULT_MAP_WIDTH,14),
                new TileImageRenderer(LITE_TUX_TILES, new SLLRectangle(0,0,32,32),1,16));
        this.host = host;
        this.stats = new LiteTuxLevelStats();
        this.startPoint = new SLLPoint(1, 1);
        this.player = new PlayerSprite(this);
        this.addChild(this.player);
        this.leftKeyPressed = false;
        this.rightKeyPressed = false;
        this.spriteManager = new LiteTuxSpriteManager(this);
        this.sprites = [];
        this.effectSprites = {};
        this.gameOver = false;
        this.levelCompleteOverlay = new SLLImageLayer("complete", LITETUX_LEVELCOMPLETE, new SLLRectangle(0,0,640,480))
        this.levelCompleteOverlay.setVisible(false);
        this.addChild(this.levelCompleteOverlay);
        this.score = 0;
        this.scoreThisRound = 0;
        this.scoreText = new SLLTextLayer("scoreTxt",
            new SLLRectangle(5,5,630,50),
            "Score: 0");
        this.scoreText.setFont(30,"sans-serif", true, true, true, true);
        this.scoreText.setAlignment("left");
        this.addChild(this.scoreText);
        this.highScore = 0;
        this.highText = new SLLTextLayer("highTxt",
            new SLLRectangle(5,5,630,50),
            "High: 0");
        this.highText.setFont(30,"sans-serif", true, true, true, true);
        this.highText.setAlignment("right");
        this.addChild(this.highText);

        this.lives = 4;
        this.livesText = new SLLTextLayer("livesTxt",
            new SLLRectangle(5,5,630,50),
            "Lives: 4");
        this.livesText.setFont(30,"sans-serif", true, true, true, true);
        this.livesText.setAlignment("center");
        this.addChild(this.livesText);

    }

    /**
     * changes the game map - useful for special tiles and possibly scripted events in future.
     * @param x:number map x coordinate of tile to be altered
     * @param y:number map y coordinate of tile to be altered
     * @param tid:number new tile id to replace existing tile with.
     */
    alterMapTile(x,y,tid) {
        console.log(`alterMapTile(${x},${y},${tid}`);
        this.tilemap.setTile(Math.floor(x),Math.floor(y),Math.floor(tid));
        // note: should we track changes and restore them? currently relying on reset
    }

    /** check to see if a tile can be entered. we take advantage of bitplane structure of
     * the tileset to determine this.
     * @param x:number map x coordinate of tile to be altered
     * @param y:number map y coordinate of tile to be altered
     * @return {boolean} return true if can enter, false otherwise.
     */
    canEnterTile(x,y) {
        return (this.tilemap.getTile(x, y) & 8) == 0;
    }

    /**
     * Checks to see if the bounding box provided is valid within the bounds of the map.
     * @param bounds:SLLRectangle bounds of the object to check if can be placed on map
     * @return {boolean} true if can be placed, false otherwise.
     */
    canEnter(bounds) {
        let top = Math.floor(bounds.y);
        let bottom = Math.floor(bounds.y + bounds.height);
        let left = Math.floor(bounds.x);
        let right = Math.floor(bounds.x + bounds.width);
        let enterable = this.tilemap.getTile(left, top) & 8;
        enterable |= (this.tilemap.getTile(right, top) & 8);
        enterable |= (this.tilemap.getTile(left, bottom) & 8);
        enterable |= (this.tilemap.getTile(right, bottom) & 8);
        return enterable !== 8;
    }

    /**
     * checks to see if the bounds are causing a tile to be bumped
     * @param bounds:SLLRectangle bounds of the object to check if causing bump
     */
    checkBump(bounds) {
        let top = Math.floor(bounds.y);
        let left = Math.floor(bounds.x);
        let right = Math.floor(bounds.x+bounds.width);
        for (let tx = left; tx <= right; ++tx) {
            let tid = this.tilemap.getTile(tx,top);
            // check if tile is one that has bump effect
            if (    (tid === LITE_TUX_SPRITE_INFO.BREAKABLE_BRICK) ||
                    (tid === LITE_TUX_SPRITE_INFO.COINBOX) ||
                    (tid === LITE_TUX_SPRITE_INFO.POWERUP) ) {
                // check if effect already in progress
                let envSprite = this.effectSprites[`${tx}_${top}`]
                if ( envSprite == null) {
                    //console.log("TO DO Need to spawn correct environmental sprite");
                    if (tid === LITE_TUX_SPRITE_INFO.COINBOX)
                        this.spawnEffectSprite(tx, top, LITE_TUX_SPRITE_INFO.COIN_BOX_BUMP);
                    else
                        this.spawnEffectSprite(tx,top, 0);
                } else {
                    envSprite.bumpedAgain(bounds);
                }
            }

        }
    }

    /**
     * Checks to see if the indicated sprite is colliding with another sprite
     * @param sprite
     */
    checkSpriteCollision(sprite) {
        let boundingBox = sprite.getBoundingBox();
        for (let cntr = 0; cntr < this.sprites.length; ++cntr)
            if (this.sprites[cntr]._visible) {
                if (this.sprites[cntr] !== sprite) {
                    if (this.sprites[cntr].getBoundingBox().intersects(boundingBox)) {
                        let cb = this.sprites[cntr].getBoundingBox();
                        console.log(`debug collision between [${boundingBox.x},${boundingBox.y},${boundingBox.width},${boundingBox.height} and (${cb.x},${cb.y},${cb.width},${cb.height})`)
                        sprite.handleCollision(this.sprites[cntr]);
                    }
                }
            }

    }

    /**
     * Earn points and update appropriate statistics
     * @param score:number amount of points to reward player
     * @param reason:number constant describing reason for reward
     */
    earnPoints(score, reason = LITETUX_CONSTS.COLLECTED_COIN) {
        this.score += score;
        this.scoreThisRound += score;
        this.totalPointsEarnedInThisLevel += score;
        this.scoreText.setText("Score: " + this.score);
        if (reason === LITETUX_CONSTS.COLLECTED_COIN)
            ++this.stats.coinsCollected;
        else if (reason === LITETUX_CONSTS.COLLECTED_GEM)
            ++this.stats.gemsCollected;
        else if (reason === LITETUX_CONSTS.SQASHED_ENEMY)
            ++this.stats.monstersStopmped;
    }

    /**
     * end the player's life, and possibly end the game if player out of lives
     */
    endLife() {
        // TODO delay then restart
        this.host.playSound(LITE_TUX_SOUND_IDS.DEATH);
        if (this.stats.highestPointsEarnedInLevel < this.scoreThisRound)
            this.stats.highestPointsEarnedInLevel = this.scoreThisRound;
        ++this.stats.attemptsToCompleteLevel;
        --this.lives;
        this.livesText.setText(`Lives: ${this.lives}`);
        if (this.lives < 0)
            this.returnToTitle();
        else
            this.restartLevel(this.currentLevel);
    }


    /**
     * See what type of ground object is on (if any)
     * @param bounds bounds of object trying to find out type of ground it is on
     * @param isPlayer true if player checking otherwise false
     * @return {number} type of ground
     */
    getGroundType(bounds, isPlayer=false) {
        let groundY = bounds.y + bounds.height + LITETUX_CONSTS.PIXEL_STEP;
        let groundType = LITETUX_CONSTS.GROUND_NONE
        for (let groundX = Math.floor(bounds.x); groundX < Math.ceil(bounds.x + bounds.width); ++groundX) {
            let groundTile = this.tilemap.getTile(groundX, groundY);
            let testGroundType = this.getTileGroundType(groundTile);
            // handle breakable ground
            if (isPlayer) {
                if (groundTile === LITE_TUX_SPRITE_INFO.COLLAPSING_WALL) {
                    let envSprite = this.effectSprites[`${groundX}_${groundY}`]
                    if ( envSprite == null) {
                        this.spawnEffectSprite(groundX,groundY, LITE_TUX_SPRITE_INFO.GROUND_COLLAPSE);
                    }
                }
            }
            if (testGroundType > groundType)
                groundType = testGroundType;
        }

        return groundType;
    }

    /**
     * converts tile into ground type
     * @param tileID tile for which ground type is to be determined
     * @return {number} ground type
     */
    getTileGroundType(tileID) {
        let result = tileID >= 8 ? LITETUX_CONSTS.GROUND_SOLID : LITETUX_CONSTS.GROUND_NONE;
        if (tileID === LITE_TUX_SPRITE_INFO.SLIPPERY_GROUND)
            result = LITETUX_CONSTS.GROUND_SLIPPERY;

        return result;
    }

    /**
     * check the controller to see what the player is doing
     */
    handlePlayerMove() {
        this.leftKeyPressed = this.host.virtualGamepad.isButtonDown(GAMEPAD_BUTTONS.DPadLeft);
        this.rightKeyPressed = this.host.virtualGamepad.isButtonDown(GAMEPAD_BUTTONS.DPadRight);
        if (this.host.virtualGamepad.isButtonDown(GAMEPAD_BUTTONS.A) ||
                this.host.virtualGamepad.isButtonDown(GAMEPAD_BUTTONS.DPadUp)) {
            this.player.startJump()
        }
        if (this.player.worldPosition.x > this.stats.furthestColumnReached)
            this.stats.furthestColumnReached = this.player.worldPosition.x;
        this.player.update();
    }

    /**
     * Move all the active sprites, which for litetux are the sprites within the viewport
     * but it would certainly be possible to have an extended range (apron) that gets checked
     * so that sprites outside view could be active.
     */
    moveSprites() {
        // calculate extents where sprites "exist" // 8 tile apron to left
        let viewportX = this.viewport.x - 32 * 8;
        let viewportY = this.viewport.y - 32 * 8;
        let viewportX2 = this.viewport.x + this.viewport.width;
        let viewportY2 = this.viewport.y + this.viewport.height;

        let removalIndex = -1;
        for (let cntr = 0; cntr < this.sprites.length; ++cntr) {
            let sprite = this.sprites[cntr];
            let spX = sprite.worldPosition.x * 32 ;
            let spY = sprite.worldPosition.y * 32 ;
            sprite.moveTo(spX - this.viewport.x, spY - this.viewport.y);
            let active = ( (spX > viewportX) && (spY > viewportY) && (spX <= viewportX2) &&(spY <= viewportY2) );
            // special case tiles have ids >= ALWAYS_ACTIVE_START
            active = active || (sprite.id >= LITE_TUX_SPRITE_INFO.ALWAYS_ACTIVE_START);
            if (active)
                sprite.update();
            if (sprite.markedForRemoval)
                removalIndex = cntr;
            sprite.setVisible(active);
        }
        if (removalIndex >= 0) {
            this.removeChild(this.sprites[removalIndex]);
            this.spriteManager.recycleSprite(this.sprites[removalIndex]);
            this.sprites.splice(removalIndex,1);
        }
    }

    /**
     * call host to play the sound. This could be done directly here but then more sound control
     * and sound checking logic would be needed here which is way overloading the responsibility
     * of this class.
     *
     * @param id:number sound to request be played
     */
    playSound(id) {
        this.host.playSound(id);
    }

    /**
     * restart the level
     * @param tilemap:Tilemap map to use (either new level or exiting level)
     */
    restartLevel(tilemap) {
        this.tilemap.resize(tilemap.width, tilemap.height);
        if (this.score>this.highScore) {
            this.highScore = this.score;
            this.highText.setText("High: " + this.highScore);
        }
        this.scoreThisRound = 0;

        let sprite = null;
        // clear sprite list
        while (this.sprites.length > 0){
            sprite = this.sprites.pop();
            this.spriteManager.recycleSprite();
            this.removeChild(sprite);
        }
        this.effectSprites = {};
        // process map
        for (let row = 0; row < tilemap.height; ++row) {
            for (let col = 0; col < tilemap.width; ++col) {
                // TODO reset tiles building srpites from tileid as necessary
                let sprite = this.spriteManager.spawnTile(col, row, tilemap._mapData[row][col]);
                if (sprite == null)
                    this.tilemap.setTile(col, row, tilemap._mapData[row][col]);
                else {
                    // special case for cannon (could be is solid flag for future support)
                    let tid =  (sprite.id === LITE_TUX_SPRITE_INFO.CANNON) ? LITE_TUX_SPRITE_INFO.CANNON : 0;
                    this.tilemap.setTile(col, row, tid);
                    this.sprites.push(sprite);
                    this.addChild(sprite);
                }
            }
        }
        this.player.setWorldPosition(this.startPoint.x, this.startPoint.y);
        this.livesText.setText(`Lives: ${this.lives}`);
    }

    /**
     * Changes the map that the game should be displaying
     * @param levelMap:Tilemap map to be used
     */
    setLevel(levelMap) {
        this.stats.resetStats();
        this.currentLevel = levelMap;
        this.restartLevel(levelMap);
        this.gameOver = false;
        this.levelCompleteOverlay.setVisible(false);
    }

    /** Restart the game */
    restart() {
        this.score = 0;
        this.lives = 4;
        this.restartLevel(this.currentLevel);
        this.gameOver = false;
        this.levelCompleteOverlay.setVisible(false);
    }

    /**
     * Spawn a sprite on the map (using sprite manager)
     * @param x:number world x location of sprite
     * @param y:number world y location of sprite
     * @param type:number  type of sprite (from constants) to create
     */
    spawnSprite(x, y, type) {
        let sprite = this.spriteManager.spawnTile(x,y,type);
        this.addChild(sprite);
        this.sprites.push(sprite);
    }

    /**
     * Spawn an environmental sprite on the map (using sprite manager)
     * @param x:number world x location of sprite
     * @param y:number world y location of sprite
     * @param type:number  type of sprite (from constants) to create
     */
    spawnEffectSprite(x,y,type) {
        let sprite = this.spriteManager.spawnEffect(x,y,type);
        this.effectSprites[sprite.id] = sprite;
        this.sprites.push(sprite);
        console.log(`spawned ${sprite.id}`);
        this.addChild(sprite);
        return sprite;
    }

    /**
     * exit to the title (or whatever the host does) by indicating game over
     * @param reason:number reason from constants for exiting the game
     */
    returnToTitle(reason = LITETUX_CONSTS.GAME_OVER) {
        this.stats.totalPointsEarnedInThisLevel = this.score;
        this.host.gameEvent(reason);
    }

    /**
     * update the game (adjust viewport, move player and monsters and animate effects)
     */
    update() {
        if (this.gameOver)
        {
            ++this.gameOverDelayCount;
            if (this.gameOverDelayCount > 150) {
                this.returnToTitle(LITETUX_CONSTS.LEVEL_COMPLETE);
            }
        } else {
            this.handlePlayerMove();

            //  find appropriate viewport location
            this.viewport.x = Math.floor(Math.max(this.player.worldPosition.x * 32 - 32*10, 0));
            let maxX = this.tilemap.width*32 - 640;
            if (this.viewport.x > maxX)
                this.viewport.x = maxX;
            this.viewport.y = Math.floor(Math.max(this.player.worldPosition.y * 32 - 32*8, 0));
            let maxY = this.tilemap.height*32 - 480;
            if (this.viewport.y > maxY)
                this.viewport.y = maxY;
            this.player.moveTo(Math.floor(this.player.worldPosition.x * 32) - this.viewport.x,
                Math.floor(this.player.worldPosition.y * 32) - this.viewport.y);
            this.moveSprites();
            this.checkSpriteCollision(this.player);

            if (this.player.worldPosition.x >= (this.tilemap.width - 2) ) {
                this.gameOverDelayCount = 0;
                this.gameOver = true;
                this.levelCompleteOverlay.setVisible(true);
            }
        }

    }
}


