/**
 * Configuration values for the sprites to allow the sprite images to be
 * easily adjusted without requiring modifying the sprite code.
 */
LITE_TUX_SPRITE_INFO = {
    "EMPTY" : 0, // spawn placenolder
    "CEIL_SPIKE" : 1,
    "CLOUD" : 2,// spawn placenolder
    "HOVER_ENEMY" : 3,
    "COIN" : 4,
    "ENEMY": 5,
    "BIG_COIN" : 6,
    "SHELL_ENEMY" : 7,
    "GROUND" : 8,
    "GROUND_SPIKE" : 9,
    "BREAKABLE_BRICK" : 10,
    "SLIPPERY_GROUND" : 11,
    "COINBOX" : 12,
    "COLLAPSING_WALL" : 13,
    "POWERUP" : 14,
    "CANNON" : 15,

    "ALWAYS_ACTIVE_START" : 16,
    "CANNON_BALL" : 16,

    "GROUND_SPIKE_SPRITE_INDEX" : 32,
    "CEILING_SPIKE_SPRITE_INDEX" : 33,
    "SPIKE_BOUNDING_WIDTH": .6,
    //
    // environmental sprites here - id is starting frame
    "SPINNING_COIN" : 35,
    "SPINNING_COIN_CLIP" : new SLLRectangle(32*2,32,32,32),
    "SPINNING_COIN_ANIM" : [0,1,2,3,4,5],
    "BIG_COIN_CLIP": new SLLRectangle(32*20,32,32,32),
    "BIG_COIN_ANIM" : [0,1,2,3,3,2,1,0],
    "BLOCK_COIN" : 40,
    "BLOCK_COIN_ANIM": [0,1,2,3,4,5,6],
    "GROUND_BUMP" : 64,
    "BUMP_ANIM" : [0,1,2,3,2,1],
    "COIN_BOX_BUMP": 68,
    "POWERUP_BUMP": 72,
    "GROUND_COLLAPSE": 128,
    "GROUND_COLLAPSE_ANIM": [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31],

    // constants for collapsing Ground
    "COLLAPSE_STATE_COLLAPSING" : 0,
    "COLLAPSE_STATE_COLLAPSED" : 1,
    "COLLAPSE_STATE_RESPAWNING" : 2,
    "FRAMES_TO_STAY_COLLAPSED" : 240,
};


/** Your basic sprite. */
class Sprite extends SLLImageLayer {
    /**
     *
     * @param lid:number|string label for sprite
     * @param image:Image atlas image used for this sprite
     * @param clip:SLLRectangle first frame of the sprite. additional frames should be right of sprite.
     * @param worldpos:SLLPoint|SLLRectangle where in the world the player is
     * @param worldManager:WorldManager Class that implements worldManager interface
     */
    constructor(lid, image, clip, worldpos, worldManager) {
        super(lid, image, clip);
        this.frame0Clip = new SLLRectangle(clip.x, clip.y, clip.width, clip.height);
        this.worldPosition = new SLLRectangle( worldpos.x, worldpos.y, 1, 1);
        this.worldManager = worldManager;
        this.FRAME_TIME = 34;
        this.timeBank = 0;

        this.markedForRemoval = false;

        // animation support
        this.currentSequence = [0];
        this.movingRight = true;
        this.currentSequenceFrame = 0;
        this.framesSinceLastChange = 0;
        this.intervalBetweenFrames = 4;
    }

    /** @return SLLRectangle bounding box for use with collision detection.
     *     Override if need non-unit bounding box.
     */
    getBoundingBox() {
        return this.worldPosition;
    }

    /**
     * placeholder for overridden sprites to handle collisions
     * @param sprite sprite that collided with this sprite
     */
    handleCollision(sprite) { /* place collision handling here */ }

    /**
     * marks a sprite as needing to be removed for list management purposes.
     */
    removeSprite() {
        this.markedForRemoval = true;
    }

    /**
     * Resets the sprite to starting state moving to indicated coordinates.
     * This is useful for recycling sprites to reduce garbage.
     * @param x:number new x world position of sprite
     * @param y:number new y world position of sprite
     */
    reset(x,y) {
        this.worldPosition.moveTo(x,y);
        this.currentSequenceFrame = 0;
        this.framesSinceLastChange = 0;
        this.markedForRemoval = false;
    }

    /**
     * Frames start at 0 and are relative to the specified sprite sheet frame used
     * in the constructor.
     * @param n:number frame to go to
     */
    setFrame(n) {
        let rect = new SLLRectangle();
        rect.clone(this.frame0Clip);
        rect.x = this.frame0Clip.x + this.frame0Clip.width * n;
        this.setClip(rect);
    }

    /**
     * Moves the sprite to a specified world position
     * @param x:number world x position to move sprite to
     * @param y:number world y position ot move sprite to
     */
    setWorldPosition(x, y) {
        this.worldPosition.x = x;
        this.worldPosition.y = y;
    }

    /** per frame handling of the sprite. Default behavior is sequenced
     * animation calling sequenceDone when a loop is finished. Override to add
     * more specialized activity.
     */
    update() {
        ++this.framesSinceLastChange;
        if (this.framesSinceLastChange > this.intervalBetweenFrames) {
            this.framesSinceLastChange = 0;
            ++this.currentSequenceFrame;
            if (this.currentSequenceFrame >= this.currentSequence.length) {
                this.currentSequenceFrame = 0;
                this.sequenceDone();
            }
            this.setFrame(this.currentSequence[this.currentSequenceFrame]);
        }
    }

    /* override if need to act on animation sequence changes */
    sequenceDone() {  /* place handling code here if needed */ }
}

// *********************************************************************************************************

/** Big coin (gems) sprite for collecting */
class BigCoin extends Sprite {
    /**
     * @param worldPos:SLLPoint|SLLRectangle where in world to place sprite
     * @param worldManager:WorldManager class managing the sprites
     */
    constructor(worldPos, worldManager) {
        super(LITE_TUX_SPRITE_INFO.BIG_COIN, LITE_TUX_TILES,
            LITE_TUX_SPRITE_INFO.BIG_COIN_CLIP,
            worldPos, worldManager);
        this.currentSequence = LITE_TUX_SPRITE_INFO.BIG_COIN_ANIM;
    }
}

// *********************************************************************************************************

/** Your average game coin that players collect */
class Coin extends Sprite {
    /**
     * @param worldPos:SLLPoint|SLLRectangle where in world to place sprite
     * @param worldManager:WorldManager class managing the sprites
     */
    constructor(worldPos, worldManager) {
        super(LITE_TUX_SPRITE_INFO.COIN, LITE_TUX_TILES,
            LITE_TUX_SPRITE_INFO.SPINNING_COIN_CLIP,
            worldPos, worldManager);
        this.currentSequence = LITE_TUX_SPRITE_INFO.SPINNING_COIN_ANIM;
    }
}

// *********************************************************************************************************

/**
 * Basic sprite for enemies as it has support methods for aiding in implementing AI logic.
 */
class Enemy extends Sprite {
    /**
     * @param worldPos:SLLPoint|SLLRectangle where to place the sprite in the world
     * @param worldManager:WorldManager who controls the sprites
     * @param id:number identifier for distinguishing this particular sprite from others
     * @param frame:number sprite frame from sprite atlas
     * @param boundWidth:number width of bounding box (will be adjusted so bounding box centered)
     * @param boundHeight:number height of enemy from ground
     */
    constructor(worldPos, worldManager, id, frame, boundWidth= 1, boundHeight = 1) {
        super(id, LITE_TUX_TILES,
            new SLLRectangle((frame % 32) * 32,Math.floor(frame/32)*32,32,32),
            worldPos, worldManager);
        this.movingLeft = true;
        this.fallSpeed = 0;
        this.pointsForSquash = 100;
        this.envelope = new SLLRectangle();
        this.playerEarnedPointsForSquashing = false;
        this.boundsXAdj = (1.0 - boundWidth) / 2;
        this.boundsYAdj = 1.0 - boundHeight;
        this.bounds = new SLLRectangle(worldPos.x + this.boundsXAdj, worldPos.y + this.boundsYAdj,
                boundWidth, boundHeight);
    }

    /** check to see if player is inside search envelope */
    checkEnvelope(left = 0, right = 0, height = 36 ) {
        this.envelope.setBounds(
            this.worldPosition.x - left,
            this.worldPosition.y + this.worldPosition.height,
            left + right + this.worldPosition.width,
            height
        );
        return ( this.envelope.intersects(this.worldManager.player.worldPosition) ) ;
    }

    /** @return SLLRectangle bounding box for use with collision detection. */
    getBoundingBox() {
        this.bounds.x = this.worldPosition.x + this.boundsXAdj;
        this.bounds.y = this.worldPosition.y + this.boundsYAdj;
        return this.bounds;
    }

    /**
     * Resets the sprite to starting state moving to indicated coordinates.
     * This is useful for recycling sprites to reduce garbage.
     * @param x:number new x world position of sprite
     * @param y:number new y world position of sprite
     */
    reset(x, y) {
        super.reset(x, y);
        this.movingLeft = true;
        this.fallSpeed = 0;
        this.playerEarnedPointsForSquashing = false;
    }

    /**
     * move the enemy left or right based on provided speed
     * @param speed
     */
    moveLeftRight(speed) {
        let xAdjust = this.movingLeft ? - speed : speed;
        let tx = this.worldPosition.x + xAdjust;
        if ( ! this.movingLeft)
            tx +=this.worldPosition.width;
        if (this.worldManager.canEnterTile(tx,this.worldPosition.y)) {
            this.worldPosition.x += xAdjust;
        } else {
            this.movingLeft = !this.movingLeft;
        }
        if (this.worldManager.getGroundType(this.worldPosition ) === LITETUX_CONSTS.GROUND_NONE) {
            this.fallSpeed = Math.min(this.fallSpeed+LITETUX_CONSTS.CIEL_SPIKE_ACC,
                LITETUX_CONSTS.CIEL_SPIKE_MAX_VEL);
            this.worldPosition.y += this.fallSpeed;
        } else
            this.fallSpeed = 0;

    }

    /**
     * utility method for updating score if player squashes enemy (capped at once per enemy)
     */
    handleSquashScore() {
        if ( ! this.playerEarnedPointsForSquashing ) {
            this.playerEarnedPointsForSquashing = true;
            this.worldManager.earnPoints(this.pointsForSquash, LITETUX_CONSTS.SQASHED_ENEMY);
        }
    }

    /**
     * handle being squashed
     * @param player
     */
    squashed(player) {
        // FUTURE WORK: proper end animation handler and timeout until vanish
        this.markedForRemoval = true;
        this.handleSquashScore();
    }

    /** Override this to add support for per-turn modifications */
    update() {
        super.update();
    }
}

// *********************************************************************************************************

/**
 * Enemy that when within viewport will fire a cannon ball at a set duration
 */
class Cannon extends Enemy {
    /**
     * @param worldPos:SLLPoint|SLLRectangle where in world to place sprite
     * @param worldManager:WorldManager class managing the sprites
     */
    constructor(worldPos, worldManager) {
        super(worldPos, worldManager, LITE_TUX_SPRITE_INFO.CANNON, LITE_TUX_SPRITE_INFO.CANNON);
        this.nextShotDelay = 0;
        this.isBroken = false;
    }

    /**
     * Resets the sprite to starting state moving to indicated coordinates.
     * This is useful for recycling sprites to reduce garbage.
     * @param x:number new x world position of sprite
     * @param y:number new y world position of sprite
     */
    reset(x, y) {
        super.reset(x, y);
        this.nextShotDelay = 0;
        this.isBroken = false;
    }

    /* future plan on allowing cannons to be broken by stomping them*/
    squashed(player) {
        this.isBroken = true;
        console.log("Cannon squashed");
    }

    /** fire cannon at regular interval when on display */
    update() {
        if (this.isBroken) return;
        if (this.nextShotDelay <= 0) {
            this.worldManager.spawnSprite(this.worldPosition.x-1, this.worldPosition.y, LITE_TUX_SPRITE_INFO.CANNON_BALL);
            this.nextShotDelay = LITETUX_CONSTS.CANNON_SHOT_DELAY;
            this.worldManager.playSound(LITE_TUX_SOUND_IDS.CANNON);
        } else
            --this.nextShotDelay;
    }
}

// *********************************************************************************************************

/**
 * The cannonball fired by the cannon
 */
class CannonBall extends Enemy {
    /**
     * @param worldPos:SLLPoint|SLLRectangle where in world to place sprite
     * @param worldManager:WorldManager class managing the sprites
     */
    constructor(worldPos, worldManager) {
        super(worldPos, worldManager, LITE_TUX_SPRITE_INFO.CANNON_BALL, 32+19);
        this.worldPosition.height = .9;
    }

    /**
     * causes cannon ball to fall out of sky
     * @param player
     */
    squashed(player) {
        this.fallSpeed = LITETUX_CONSTS.CANNON_BALL_BUMP_FALL_SPEED;
    }

    /**
     * keep moving until hit something or go outside map
     */
    update() {
        this.worldPosition.x -= LITETUX_CONSTS.CANNON_BALL_SPEED;
        this.worldPosition.y += this.fallSpeed;
        if ( ( ! this.worldManager.canEnter(this.worldPosition) ) || (this.worldPosition.x < 0) )
            this.markedForRemoval = true;
    }
}

// *********************************************************************************************************

/**
 * Ceiling spikes are hazards that fall if player goes under them
 */
class CeilSpike extends Sprite {
    /**
     * @param worldPos:SLLPoint|SLLRectangle where in world to place sprite
     * @param worldManager:WorldManager class managing the sprites
     */
    constructor(worldPos, worldManager) {
        super(LITE_TUX_SPRITE_INFO.CEIL_SPIKE, LITE_TUX_TILES,
            new SLLRectangle(LITE_TUX_SPRITE_INFO.CEIL_SPIKE*32,0,32,32),
            worldPos, worldManager);
        this.velocity = 0;
        this.vanishDelay = 0;
        this.envelope = new SLLRectangle(worldPos.x, worldPos.y, 1, 32);
        this.boundXAdj = (1 - LITE_TUX_SPRITE_INFO.SPIKE_BOUNDING_WIDTH) / 2;
        this.bounds = new SLLRectangle(worldPos.x+this.boundXAdj,worldPos.y,
            LITE_TUX_SPRITE_INFO.SPIKE_BOUNDING_WIDTH,1);
    }

    /** @return SLLRectangle bounding box for use with collision detection. */
    getBoundingBox() {
        this.bounds.x = this.worldPosition.x + this.boundXAdj;
        this.bounds.y = this.worldPosition.y;
        return this.bounds;
    }

    /**
     * Resets the sprite to starting state moving to indicated coordinates.
     * This is useful for recycling sprites to reduce garbage.
     * @param x:number new x world position of sprite
     * @param y:number new y world position of sprite
     */
    reset(x,y) {
        super.reset(x,y);
        this.velocity = 0;
        this.vanishDelay = 0;
        this.envelope.moveTo(x,y);
    }

    /** if falling, fall until hit ground or go outside map otherwise wait
     * until player is underneath and then fall.
     */
    update() {
        if (this.velocity > 0) {
            this.velocity = Math.min(this.velocity+LITETUX_CONSTS.CIEL_SPIKE_ACC,
                LITETUX_CONSTS.CIEL_SPIKE_MAX_VEL);
            this.worldPosition.y += this.velocity;
            if (this.worldManager.canEnter(this.worldPosition) === false) {
                this.velocity = 0;
                this.vanishDelay = LITETUX_CONSTS.CIEL_SPIKE_VANISH_DELAY;
            }
        } else if (this.vanishDelay > 0) {
            --this.vanishDelay;
            if (this.vanishDelay <= 0)
                this.removeSprite();
        } else {
            if (this.envelope.intersects(this.worldManager.player.worldPosition))
                this.velocity = LITETUX_CONSTS.CIEL_SPIKE_ACC;
        }
    }
}

// *********************************************************************************************************

/**
 * Snowball enemies simply walk
 */
class Snowball extends Enemy {
    /**
     * @param worldPos:SLLPoint|SLLRectangle where in world to place sprite
     * @param worldManager:WorldManager class managing the sprites
     */
    constructor(worldPos, worldManager) {
        super(worldPos, worldManager, LITE_TUX_SPRITE_INFO.ENEMY,  LITE_TUX_SPRITE_INFO.ENEMY);
    }

    update() {
        this.moveLeftRight(LITETUX_CONSTS.SNOWBALL_SPEED);
    }
}

// *********************************************************************************************************

/**
 * Ground spikes are stationary  hazards
 */
class GroundSpike extends Sprite {
    /**
     * @param worldPos:SLLPoint|SLLRectangle where in world to place sprite
     * @param worldManager:WorldManager class managing the sprites
     */
    constructor(worldPos, worldManager) {
        super(LITE_TUX_SPRITE_INFO.GROUND_SPIKE, LITE_TUX_TILES,
            new SLLRectangle(LITE_TUX_SPRITE_INFO.GROUND_SPIKE*32,0,32,32),
            worldPos, worldManager);
        this.bounds = new SLLRectangle(worldPos.x+this.boundXAdj,worldPos.y,
            LITE_TUX_SPRITE_INFO.SPIKE_BOUNDING_WIDTH,1);
    }

    /** @return SLLRectangle bounding box for use with collision detection. */
    getBoundingBox() {
        this.bounds.x = this.worldPosition.x + this.boundXAdj;
        this.bounds.y = this.worldPosition.y;
        return this.bounds;
    }
}

// *********************************************************************************************************

/**
 * Owls stay in the air until player goes underneath them and then dive-bomb
 * the player.
 */
class Owl extends Enemy {
    /**
     * @param worldPos:SLLPoint|SLLRectangle where in world to place sprite
     * @param worldManager:WorldManager class managing the sprites
     */
    constructor(worldPos, worldManager) {
        super(worldPos, worldManager, LITE_TUX_SPRITE_INFO.HOVER_ENEMY, LITE_TUX_SPRITE_INFO.HOVER_ENEMY);
        this.home = new SLLPoint(worldPos.x, worldPos.y);
        this.diving = false;
    }

    /**
     * When stompped on, fall to ground then rise but stays alive
     * @param player
     */
    squashed(player) {
        this.diving = true;
    }

    /**
     * dive when player underneath. When not diving, return to home position
     */
    update() {
        if (this.diving) {
            if (this.worldManager.canEnterTile(this.worldPosition.x, this.worldPosition.y + this.worldPosition.height + LITETUX_CONSTS.DIVE_SPEED) )
                this.worldPosition.y += LITETUX_CONSTS.DIVE_SPEED;
            else
                this.diving = false;
        }  else {
            if (this.worldPosition.y > this.home.y)
                this.worldPosition.y -= LITETUX_CONSTS.FLOAT_SPEED;
            if (this.checkEnvelope())
                this.diving = true;
        }
    }
}

// *********************************************************************************************************

/**
 * Shell enemies (ice cubes) get stunned when stompped but if stomped again
 * start moving again but at a faster rate.
 */
class ShellEnemy extends Enemy {
    /**
     * @param worldPos:SLLPoint|SLLRectangle where in world to place sprite
     * @param worldManager:WorldManager class managing the sprites
     */
    constructor(worldPos, worldManager) {
        super(worldPos, worldManager, LITE_TUX_SPRITE_INFO.SHELL_ENEMY, LITE_TUX_SPRITE_INFO.SHELL_ENEMY);
        this.inSquashedState = false;
        this.stopped = false;
    }

    /**
     * Resets the sprite to starting state moving to indicated coordinates.
     * This is useful for recycling sprites to reduce garbage.
     * @param x:number new x world position of sprite
     * @param y:number new y world position of sprite
     */
    reset(x, y) {
        super.reset(x, y);
        this.inSquashedState = this.stopped = false;
    }

    /**
     * When stompped, if not stunned, become stunned otherwise start moving at fast speed.
     * @param player
     */
    squashed(player) {
        if (this.inSquashedState) {
            if (this.stopped) {
                this.stopped = false;
                let playerCenter = player.worldPosition.x + player.worldPosition.width / 2;
                let shellCenter = this.worldPosition.x + this.worldPosition.width / 2;
                this.movingRight = playerCenter > shellCenter;
            } else {
                this.stopped = true;
            }
        }
        else {
            this.inSquashedState = true;
            this.stopped = true;
        }
    }

    /** if not stunned, move */
    update() {
        super.update();
        if ( ! this.stopped) {
            let speed = this.inSquashedState ? LITETUX_CONSTS.SHELL_SQUASHED_SPEED : LITETUX_CONSTS.SHELL_SPEED;
            this.moveLeftRight(speed);
        }
    }
}

// *********************************************************************************************************

/** Environmental effects are animated effects for regular tiles */
class EnvironmentalEffect extends Sprite {
    /**
     * @param worldPos:SLLPoint|SLLRectangle where to place effect animation
     * @param worldManager:WorldManager who controls world
     * @param startTile:number frame to start
     * @param seq:number[] sequence to play frames
     * @param frameRepeat delay between frames
     */
    constructor(worldPos, worldManager, startTile, seq = [0], frameRepeat=4) {
        super(`${worldPos.x}_${worldPos.y}`, LITE_TUX_TILES,
            new SLLRectangle((startTile % 32) * 32,Math.floor(startTile/32)*32,32,32),
            worldPos, worldManager);
        this.currentSequence = seq;
        this.intervalBetweenFrames = frameRepeat;
        this.effectId = startTile;
        this.sequenceDoneCallback = null;
    }

    /** override to handle additional bump, default is to ignore. */
    bumpedAgain() {
        // override to handle additional bump, default is to ignore.
    }

    /** default behavior is to remove effect after animation */
    sequenceDone() {
        this.markedForRemoval = true;
        if (this.sequenceDoneCallback != null)
            this.sequenceDoneCallback.spriteEvent(this);
    }
}

// *********************************************************************************************************

class CoinBox extends EnvironmentalEffect {
    /**
     * @param worldPos:SLLPoint|SLLRectangle where in world to place sprite
     * @param worldManager:WorldManager class managing the sprites
     */
    constructor(worldPos, worldManager) {
        super(worldPos, worldManager, LITE_TUX_SPRITE_INFO.COIN_BOX_BUMP, LITE_TUX_SPRITE_INFO.BUMP_ANIM,2);
        this.bumpInProgress = false;
        this.coinInProgress = false;
        this.coinCount = 5;
        this.bumpedAgain();
    }

    /** handle bumping a coin box again will, if coin sequence finished, release up
     * to 5 coins afterwhich is just a normal bump
     */
    bumpedAgain() {
        if (this.bumpInProgress)
            return;
        if (( ! this.coinInProgress) && (this.coinCount > 0)){
            this.coinCount -= 1;
            this.coinInProgress = true;
            let coin = this.worldManager.spawnEffectSprite(
                this.worldPosition.x, this.worldPosition.y-1, LITE_TUX_SPRITE_INFO.BLOCK_COIN);
            coin.sequenceDoneCallback = this;
            this.worldManager.earnPoints(10);
            this.worldManager.playSound(LITE_TUX_SOUND_IDS.COIN);
            console.log(`coin animatiion ${coin.id} should be visible`);
        }
        this.cur_frame = 0;
        this.currentSequenceFrame = 0;
        this.setVisible(true);
        this.bumpInProgress = true;
    }

    sequenceDone() {
        this.bumpInProgress = false;
        this.setVisible(false);
    }

    /* when coin animation finished, this gets called */
    spriteEvent(coin) {
        console.log("Coin has finished it's animation")
        coin.sequenceDoneCallback = null;
        this.coinInProgress = false;
    }

    update() {
        if (this.bumpInProgress)
            super.update();
    }
}

// *********************************************************************************************************

/**
 * Ground that starts collapsing when player steps on it
 */
class CollapsingGround extends EnvironmentalEffect {
    /**
     * @param worldPos:SLLPoint|SLLRectangle where in world to place sprite
     * @param worldManager:WorldManager class managing the sprites
     */
    constructor(worldPos, worldManager) {
        super(worldPos, worldManager, LITE_TUX_SPRITE_INFO.GROUND_COLLAPSE, LITE_TUX_SPRITE_INFO.GROUND_COLLAPSE_ANIM);
        this.collapseState = LITE_TUX_SPRITE_INFO.COLLAPSE_STATE_COLLAPSING;
        this.countdown = LITE_TUX_SPRITE_INFO.FRAMES_TO_STAY_COLLAPSED;
        this.collapseClip = new SLLRectangle(this.frame0Clip.x, this.frame0Clip.y, this.frame0Clip.width, this.frame0Clip.height)
        this.emptyClip = new SLLRectangle(768, 0, this.frame0Clip.width, this.frame0Clip.height)
    }

    /** when animation done, remove wall */
    sequenceDone() {
        if (this.collapseState !== LITE_TUX_SPRITE_INFO.COLLAPSE_STATE_COLLAPSING)
            return;
        this.worldManager.alterMapTile(this.worldPosition.x, this.worldPosition.y, LITE_TUX_SPRITE_INFO.EMPTY)
        this.collapseState = LITE_TUX_SPRITE_INFO.COLLAPSE_STATE_COLLAPSED;
        this.frame0Clip = this.emptyClip;
        this.cur_frame = 0;
    }

    /** after wall has vanished, wait a bit then restore */
    update() {
        if (this.collapseState === LITE_TUX_SPRITE_INFO.COLLAPSE_STATE_COLLAPSING)
            super.update();
        else {
            --this.countdown;
            if (this.countdown < 0) {
                console.log(`Attempting to replace tile`);
                this.worldManager.alterMapTile(this.worldPosition.x, this.worldPosition.y, LITE_TUX_SPRITE_INFO.COLLAPSING_WALL);
                this.markedForRemoval = true;
                this.frame0Clip = this.collapseClip;
                this.cur_frame = 0;
                this.currentSequenceFrame = 0;
            }
        }
    }
}

// *********************************************************************************************************

/** the PLAYER!!! */
class PlayerSprite extends Sprite {
    /**
     * @param worldManager:WorldManager class managing the sprites
     */
    constructor(worldManager) {
        super("player", LITE_TUX_TILES, new SLLRectangle(0,192,32,32),
            new SLLPoint(worldManager.startPoint.x, worldManager.startPoint.y), worldManager);
        this.walkVelocity = 0;
        this.ACCELERATION = .04;
        this.MAX_FALL_SPEED = .25;
        this.fallingSpeed = 0;
        this.jumpBoostFramesRemaining = 0;
        this.boundsAdjustX = .1; // if issues change back to 0
        this.boundsAdjustY = .1;
        this.testingBounds = new SLLRectangle(this.worldPosition.x+this.boundsAdjustX,
            this.worldPosition.y+this.boundsAdjustY, 1-2*this.boundsAdjustX,1-this.boundsAdjustY);
    }

    getBoundingBox() {
        return this.testingBounds;
    }

    /**
     * handle collision based on hat player ran into
     * @param sprite:Sprite what the player collided with
     */
    handleCollision(sprite) {
        let y2 = this.worldPosition.y + this.worldPosition.height;
        //let centerX = this.worldPosition.x + this.worldPosition.width/2;
        let spriteSquishArea = sprite.worldPosition.y + sprite.worldPosition.height * .8;
        switch(sprite.id) {

            case LITE_TUX_SPRITE_INFO.GROUND_SPIKE:
            case LITE_TUX_SPRITE_INFO.CEIL_SPIKE:
                this.takeDamage();
                break;
            case LITE_TUX_SPRITE_INFO.BIG_COIN:
                this.worldManager.earnPoints(100, LITETUX_CONSTS.COLLECTED_GEM);
                this.worldManager.playSound(LITE_TUX_SOUND_IDS.GEM);
                sprite.removeSprite();
                break;
            case LITE_TUX_SPRITE_INFO.COIN:
                this.worldManager.earnPoints(10);
                this.worldManager.playSound(LITE_TUX_SOUND_IDS.COIN);
                sprite.removeSprite();
                break;

            case LITE_TUX_SPRITE_INFO.ENEMY:
            case LITE_TUX_SPRITE_INFO.SHELL_ENEMY:
            case LITE_TUX_SPRITE_INFO.HOVER_ENEMY:
            case LITE_TUX_SPRITE_INFO.CANNON_BALL:
                if (y2 < spriteSquishArea) {
                    sprite.squashed(this);
                    this.worldManager.playSound(LITE_TUX_SOUND_IDS.STOMP)
                    this.startJump(true);
                } else
                    this.takeDamage();
                break;


            default:
                console.log("TODO handle hitting sprite " + sprite.id);
        }

    }

    /** @return 1 if starting jump otherwise 0 */
    startJump(forcedBounce = false) {
        if ( (this.jumpBoostFramesRemaining > 0) && (forcedBounce === false) )
            return;
        this.testingBounds.x = this.worldPosition.x + this.boundsAdjustX;
        this.testingBounds.y = this.worldPosition.y + this.boundsAdjustY+.07;
        if (! this.worldManager.canEnter(this.testingBounds) || (forcedBounce)) {
            //console.log("Starting Jump");
            this.jumpBoostFramesRemaining = 16;
            this.worldManager.playSound(LITE_TUX_SOUND_IDS.JUMP);
            ++this.worldManager.stats.jumpsMade;
        }
    }

    /** die, but may add powers in future */
    takeDamage() {
        // If super added will need to check if immortal and if powered up
        // if all else failed, dead
        this.worldManager.endLife();
    }

    /**
     * based on player actions, update player sprite
     */
    update() {
        if (this.jumpBoostFramesRemaining > 0) {
            let boost = this.ACCELERATION * (this.jumpBoostFramesRemaining);
            this.testingBounds.y = this.worldPosition.y + this.boundsAdjustY - boost;
            --this.jumpBoostFramesRemaining;
        } else
            this.testingBounds.y = this.worldPosition.y + this.boundsAdjustY + this.fallingSpeed;
        this.testingBounds.x = this.worldPosition.x + this.boundsAdjustX;
        this.worldManager.checkBump(this.testingBounds);
        this.isFalling = this.worldManager.canEnter(this.testingBounds);
        if (this.isFalling) {
            this.fallingSpeed = Math.min(this.fallingSpeed + this.ACCELERATION, this.MAX_FALL_SPEED);
        } else {
            if (this.jumpBoostFramesRemaining > 0/*this.fallingSpeed < 0*/) {
                this.testingBounds.y = Math.floor(this.worldPosition.y);
                this.jumpBoostFramesRemaining = 0;
            }
            else {
                this.testingBounds.y = Math.floor(this.worldPosition.y + this.boundsAdjustY) + .96;
            }
            this.fallingSpeed = .04;
            this.testingBounds.y = this.worldPosition.y+ this.boundsAdjustY;
        }
        this.worldPosition.y = this.testingBounds.y - this.boundsAdjustY;

        let moving = false;
        let jumpOrFalling = (this.fallingSpeed > 0.06) || (this.fallingSpeed < 0);
        if (this.worldManager.getGroundType(this.worldPosition, true) === LITETUX_CONSTS.GROUND_SLIPPERY) {
            moving = true;
        }

        if (this.worldManager.leftKeyPressed) {
            this.walkVelocity = Math.max(-.2, this.walkVelocity - LITETUX_CONSTS.PLAYER_ACCELERATION)
            this.movingRight = false;
            moving = true;
        }
        if (this.worldManager.rightKeyPressed){
            this.walkVelocity = Math.min(.2, this.walkVelocity + LITETUX_CONSTS.PLAYER_ACCELERATION)
            this.movingRight = true;
            moving = true;
        }

        if (moving) {
            this.testingBounds.x += this.walkVelocity;
        } else
            this.walkVelocity = 0;

        if (this.worldManager.canEnter(this.testingBounds))
            this.worldPosition.x = this.testingBounds.x - this.boundsAdjustX;
        if (this.worldPosition.y >= (this.worldManager.tilemap.height-1.1))
            this.worldManager.endLife();

        // FUTURE WORK animation

        super.update();
    }

}

