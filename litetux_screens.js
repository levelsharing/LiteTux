/** ids for the different screens */
LITE_TUX_SCREEN_IDS = {
    "TITLE" : 0,
    "INSTRUCTIONS" : 1,
    "WORLDS" : 2,
    "GAME" : 3
}

/** ids for the different sounds that the game can produce */
LITE_TUX_SOUND_IDS = {
    "CANNON" : 0,
    "COIN" : 1,
    "DEATH" : 2,
    "GEM" : 3,
    "JUMP" : 4,
    "STOMP" : 5,
    "NUM_SOUNDS" : 6
}

// ********************************************************************

/**
 * Title screen for game
 */
class LiteTuxTitle extends SLLImageLayer {
    /**
     * @param owner screen manager for controlling this screen
     */
    constructor(owner) {
        super("litetuxtitle", LITETUX_TITLE, new SLLRectangle(0,0,640,480));
        this.owner = owner;

        this.instructButton = owner.buildDisplayButton(this,
                 new SLLRectangle(20, 400, 160,40), "Instructions");

        this.playButton = owner.buildDisplayButton(this,
                new SLLRectangle(450, 400, 160,40), "Play game");
    }

    /**
     * handle clicking on a button
     * @param btn:SLLTextButton button that was clicked
     */
    buttonClicked(btn) {
        if (btn === this.instructButton) {
            this.owner.swapDisplays(LITE_TUX_SCREEN_IDS.INSTRUCTIONS);
        } else if (btn === this.playButton) {
            this.owner.swapDisplays(LITE_TUX_SCREEN_IDS.WORLDS);
//            this.owner.swapDisplays(LITE_TUX_SCREEN_IDS.GAME);
        } else {
            console.log("Unknown button event " + btn.id)
        }
    }

    update() {}

    restart() { }

}

// *********************************************************************************************************

/**
 * Instructions screen for the game.
 */
class LiteTuxInstructions extends SLLImageLayer {
    /**
     * @param owner screen manager for controlling this screen
     */
    constructor(owner) {
        super("litetuxInst", LITETUX_INSTRUCTIONS, new SLLRectangle(0,0,640,480));
        this.owner = owner;
        this.exitButton = owner.buildDisplayButton(this,
                new SLLRectangle(20, 400, 160,40), "Exit");
    }

    /**
     * handle clicking on a button
     * @param btn:SLLTextButton button that was clicked
     */
    buttonClicked(btn) {
        if (btn === this.exitButton) {
            this.owner.swapDisplays(LITE_TUX_SCREEN_IDS.TITLE);
        }
    }

    update(){}
    restart() { }

}

// *********************************************************************************************************

/**
 * Level selection screen. The first level in each of the worlds is available with
 * the other levels unlocked as the player reaches those levels
 */
class LiteTuxWorldSelection extends SLLLayer {
    /**
     * @param owner screen manager for controlling this screen
     * @param bounds size of display
     */
    constructor(owner, bounds) {
        super("WORLD_SELECT", bounds.width, bounds.height);
        this.owner = owner;

        this.setBackgroundColor("#003");
        let header = new SLLTextLayer("wsl", new SLLRectangle(10,10,bounds.width-20,100),
            "Select starting level");
        header.setAlignment("center");
        header.setFont(64);
        this.addChild(header);
        this.worldButtons = [];
        for (let w=0; w<WORLDS.length;++w) {
            let world = [];
            for (let l=0; l<WORLDS[w].length;++l) {
                let s = `World ${w+1}-${l+1}`;
                let btn = owner.buildDisplayButton(this,
                    new SLLRectangle(50+w*100,100+l*45,95,35),s);
                btn.setDisabled(l>0);
                world.push(btn);
            }
            this.worldButtons.push(world);
        }
    }

    /**
     * handle clicking on a button
     * @param btn:SLLTextButton button that was clicked
     */
    buttonClicked(btn) {
        let world = 1, lvl = 0;
        for (let w = 0; w < WORLDS.length;++w) {
            for (let l = 0; l < WORLDS[w].length; ++l) {
                if (this.worldButtons[w][l] === btn){
                    world = w;
                    lvl = l;
                }
            }
        }
        this.owner.startGame(world,lvl);
    }

    update(){}
    restart() { }

}

// *********************************************************************************************************

/**
 * Main game aka stage which swaps between the different screens and handles sound
 * and game events.
 */
class LiteTuxMain extends SLLLayer {
    /**
     * @param bounds:SLLRectangle size of display
     * @param config game configuration
     * @param levelCompleteURL holdover from earlier should probably remove
     */
    constructor(bounds, config, levelCompleteURL = null) {
        super("EDITOR", bounds.width,bounds.height);

        this.levelCompleteURL = levelCompleteURL;
        // activate gamepads
        this.virtualGamepad = new VirtualGamepad();

        // Different screen classes go here
        this.titleScreen = new LiteTuxTitle(this);
        this.instructionScreen = new LiteTuxInstructions(this);
        this.gameScreen = new LiteTuxGame(this);
        this.gameScreen.setLevel(LEVEL_1);
        //this.gameScreen.restartLevel(LEVEL_1);

        this.worldsScreen = new LiteTuxWorldSelection(this, bounds);

        // set up current mode and appropriate screen for it
        this.screens = [this.titleScreen, this.instructionScreen, this.worldsScreen, this.gameScreen];
        this.currentDisplayMode = 0;
        this.currentScreen = this.titleScreen;
        this.addChild(this.currentScreen);

        this.sounds = [];
        for (let cntr = 0; cntr < LITE_TUX_SOUND_IDS.NUM_SOUNDS; ++cntr) {
            this.sounds.push(document.createElement("audio"))
        }
        this.sounds[LITE_TUX_SOUND_IDS.CANNON].src = config.CANNON;
        this.sounds[LITE_TUX_SOUND_IDS.COIN].src = config.COIN;
        this.sounds[LITE_TUX_SOUND_IDS.DEATH].src = config.DEATH;
        this.sounds[LITE_TUX_SOUND_IDS.GEM].src = config.GEM;
        this.sounds[LITE_TUX_SOUND_IDS.JUMP].src = config.JUMP;
        this.sounds[LITE_TUX_SOUND_IDS.STOMP].src = config.STOMP;

        this.backgroundMusic = document.createElement("audio");
        this.backgroundMusic.src = config.BACKGROUND;
        this.backgroundMusic.loop = true;
        //this.backgroundMusicStarted = false;
        //this.backgroundMusic.play();
    }

    /** utility method for child displays to quickly build UI buttons
     *
     * @param display:SLLLayer screen to draw buttons on
     * @param rect:SLLRectangle where to place button
     * @param label:string text to show in button (and id of button)
     * @returns {SLLTextButton} button that was created
     */
    buildDisplayButton(display, rect, label) {
        let btn = new SLLTextButton(label, rect, label);
        btn.moveTo(rect.x,rect.y);
        btn.onClickHandler = display;
        display.addChild(btn);
        return btn;
    }

    /**
     * switches to a different screen
     * @param newDisplayMode:number id of screen to switch to
     */
    swapDisplays(newDisplayMode) {
        if (this.currentDisplayMode === newDisplayMode)
            return;
        if ( this.currentDisplayMode === LITE_TUX_SCREEN_IDS.GAME) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
        }
        else if (newDisplayMode === LITE_TUX_SCREEN_IDS.GAME)
            this.backgroundMusic.play();

        this.removeChild(this.currentScreen);
        this.currentScreen = this.screens[newDisplayMode];
        this.addChild(this.currentScreen);
        this.currentScreen.restart();
        this.currentDisplayMode = newDisplayMode
    }

    /**
     * keyboard support
     * @param key key that was pushed
     * @return {boolean} true if need to draw the display
     */
    handleKeyDown(key) {
        this.virtualGamepad.keyDown(key);
        return false;
    }

    /**
     * keyboard support
     * @param key key that was pushed
     * @return {boolean} true if need to draw the display
     */
    handleKeyUp(key) {
        this.virtualGamepad.keyUp(key);
        return false;
    }

    /**
     * handle animation frame time notification
     * @param delta:number time since last update
     * @return {boolean} true if need to draw the display
     */
    tick(delta) {
        this.currentScreen.update();
        return true;
    }

    /**
     * Internal handler for completing a level. Goes to next level (unlocking it)
     * or if world complete returns to title screen
     */
    levelCompleted() {
        ++this.currentLevel;
        if (this.currentLevel < WORLDS[this.currentWorld].length) {
            //console.log("should be playing level " + this.currentLevel);
            this.worldsScreen.worldButtons[this.currentWorld][this.currentLevel].setDisabled(false);
            this.gameScreen.setLevel(WORLDS[this.currentWorld][this.currentLevel]);
        }
        else {
            this.swapDisplays(LITE_TUX_SCREEN_IDS.TITLE);
        }
    }

    /** Handle litetux game events
     * @param eventID:number id (from constants) of event type
     */
    gameEvent(eventID) {
        if ((eventID === LITETUX_CONSTS.LEVEL_COMPLETE)  ) {
            this.backgroundMusic.pause();
            this.levelCompleted();
        } else if (eventID === LITETUX_CONSTS.GAME_OVER) {
            this.swapDisplays(LITE_TUX_SCREEN_IDS.TITLE);
        }
    }

    /** starts a game by setting the appropriate level and switching to the
     * game screen.
     * @param world which world to play
     * @param lvl which level in the world to start at.
     */
    startGame(world, lvl) {
        this.currentWorld = world;
        this.currentLevel = lvl;
        this.gameScreen.setLevel(WORLDS[world][lvl]);
        console.log(`Selected world${world}-${lvl}`);
        this.gameScreen.restart();
        this.swapDisplays(LITE_TUX_SCREEN_IDS.GAME);
    }

    /**
     * play the indicated sound effect
     * @param soundID:number id of sound to play
     */
    playSound(soundID) {
        this.sounds[soundID].cloneNode(true).play();
    }
}