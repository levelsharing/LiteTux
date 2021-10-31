
TILESET_TILES_IMG = new Image();
TILESET_TILES_IMG.src = 'res/spritesheet.png';

ARROWS_IMG = new Image();
ARROWS_IMG.src = "res/arrows.png";

TOOL_ICONS_IMG = new Image();
TOOL_ICONS_IMG.src = "res/tools.png";

/* Constants for the tools in the tool palette */
TOOL_PALETTE = {
	"DRAW" : 0,
	"FILL_UP" : 1,
	"FILL_DOWN" : 2,
	"FLOOD_FILL" : 3,
	"FILL_RECT" : 4,
	"SELECTION" : 5,
	"STAMP"	: 6,
	"FUTURE" : 7 // always make this last item
};

/* Constants for the different editor screens */
DISPLAY_MODES = {
	"EDITOR" : 0,
	"PATH_EDIT" : 1, // alt editor mode not currently supported but plan on revisiting
	"TEST_LEVEL" : 2,
	"ANALYSIS" : 3,
	"HELP" : 4,
	"FUTURE" : 5 // sentinel
};

// ************************************************************************

/**
 * Run the current game that the editor is configured for
 */
class TestLevel extends SLLLayer {
	/**
	 * Set up an instance of the game for testing purposes. Can change the game
	 * being edited by simply replacing this (and tiles).
	 *
	 * @param bounds:SLLRectangle bounds of the display
	 * @param owner:{} class with swapDisplays method
	 */
	constructor(bounds, owner) {
		super("testLevel", bounds.width, bounds.height);
		this.owner = owner;
		this.virtualGamepad = this.owner.virtualGamepad;
		this.exitButton = new SLLTextButton(
			"exitBtn",
			new SLLRectangle(700, 500, 200, 40),
			"Exit Tester"
		);
		this.exitButton.moveTo(750, 500);
		this.exitButton.setClickHandler(this);
		this.addChild(this.exitButton);

		this.jumpButton = new SLLTextButton("jump",
			new SLLRectangle( 800, 300, 50,50), "^");
		this.addChild(this.jumpButton);
		this.owner.virtualGamepad.addGUIButton(GAMEPAD_BUTTONS.A, this.jumpButton);
		this.leftButton = new SLLTextButton("jump",
			new SLLRectangle( 700, 350, 50,50), "<-");
		this.addChild(this.leftButton);
		this.owner.virtualGamepad.addGUIButton(GAMEPAD_BUTTONS.DPadLeft, this.leftButton);
		this.rightButton = new SLLTextButton("jump",
			new SLLRectangle( 900, 350, 50,50), "->");
		this.addChild(this.rightButton);
		this.owner.virtualGamepad.addGUIButton(GAMEPAD_BUTTONS.DPadRight, this.rightButton);
		this.game = new LiteTuxGame(this);
		this.addChild(this.game);


		this.currentStats = new LiteTuxLevelStats();
		let labels = ["Attempts to Complete Level",  "Coins Collected",
			"Furthest Column Reached", "Gems Collected", "Highest Points Earned in Level" ,
			"Jumps Made", "Monsters Stopmped", "Total Points Earned in This Level"];
		this.statLabels = [];
		this.statValues = [];
		for (let i = 0; i < labels.length; ++i) {
			let labelText = new SLLTextLayer(labels[i]+"Txt",
				new SLLRectangle(650, 20 + 30*i, 200, 25), labels[i]);
			labelText.setFont(16);
			labelText.setColor("#DD0", "#222");
			this.addChild(labelText)
			this.statLabels.push(labelText);

			let labelValue = new SLLTextLayer(labels[i]+"",
				new SLLRectangle(910, 20 + 30*i, 200, 25), "0");
			labelValue.setFont(16);
			labelValue.setColor("#FFF", "#222");
			this.addChild(labelValue)
			this.statValues.push(labelValue);
		}
	}

	/** sets the level to be tested and passes that to the game */
	setLevel(levelMap) {
		this.game.setLevel(levelMap);
		this.game.restart();
	}

	// *** Event Handlers ***

	/** placeholder for game as it uses this method to play sounds. This can be
	 * configured to actually play sounds if desired but for testing I don't believe
	 * this is a necessity.
	 * @param sid id of sound to be played
	 */
	playSound(sid) {}

	/** The game communicates with it's host by sending game event messages. We
	 * don't really need to handle these but could in the future.
	 * @param e game event that was sent
	 */
	gameEvent(e) {}

	/**
	 * handle a button being clicked on. Right now we simply
	 * @param btn
	 */
	buttonClicked(btn) {
		if(btn.id === "exitBtn")
			this.owner.swapDisplays(DISPLAY_MODES.EDITOR);
	}

	/** Handle a tick event (animation frame) */
	tick(delta) {
		this.game.update();
		if (this.currentStats.isDifferent(this.game.stats)) {
			let gs = this.game.stats;
			this.statValues[0].setText(""+gs.attemptsToCompleteLevel);
			this.statValues[1].setText(""+gs.coinsCollected);
			this.statValues[2].setText(""+gs.furthestColumnReached);
			this.statValues[3].setText(""+gs.gemsCollected);
			this.statValues[4].setText(""+gs.highestPointsEarnedInLevel);
			this.statValues[5].setText(""+gs.jumpsMade);
			this.statValues[6].setText(""+gs.monstersStopmped);
			this.statValues[7].setText(""+gs.totalPointsEarnedInThisLevel);
			this.currentStats.clone(gs);
		}

	}
}

// ************************************************************************

/**
 * An extended version of the TileMapLayer used for communicating with
 * web workers to generate suggestions in the background. This works by
 * setting up the URL of the web worker and the set of parameters to add
 * to the map chunk when the generator is called. The web worker can use
 * the provided map chunk to generate a new map chunk and will respond by
 * sending back the chunk with the suggestions in it.
 *
 * As this method is a TileMapLayer, it is then able to be used right on
 * the editor in order to display the suggested map.
 */
class SuggestedMap extends TileMapLayer {
	/**
	 *
	 * @param lid:string|number id for the suggestion generator to differentiate them
	 * @param bounds:SLLRectangle display bounds for the suggestion on the editor window
	 * @param generator:string url for the web worker script to be called
	 * @param owner:{} editor who owns the suggestion manager
	 * @param params:{} json object to be used as parameter field when sending
	 * @param rows:number how many rows there are in a slice
	 * @param cols:number how many columns there are in a slice
	 */
	constructor(lid, bounds, generator, owner, params = "", rows=14, cols = 18) {
		//let renderer = new TileRenderer(TILESET_PALETTE, 0, new SLLDimension(2,2));
		let renderer = new TileImageRenderer(TILESET_TILES_IMG,
			new SLLRectangle(0,0,32,32), rows, cols);
		super(lid, cols*32, rows*32, new TileMap(cols, rows), renderer);
		//super(lid, bounds.width, bounds.height, new TileMap(cols, rows), renderer);
		//this.moveTo(bounds.x, bounds.y);
		this.adjustPosition(bounds);
		this.owner = owner;
		this.params = params;
		this.worker = new Worker(generator);
		this.worker.owner = this;
		this.worker.onmessage = function(m) {
			this.owner.workerMessage(m);
		};
		this.workInProgress = false;
		this.nextMapInQueue = null;

	}

	/**
	 * add a map segment to ask for suggestions for. To prevent irrelevent updates
	 * when lots of quick requests happen, only the last map segement sent between
	 * web worker calls is used.
	 *
	 * @param mapSegment:TileMap map segment to have suggestions applied to
	 */
	generateMap(mapSegment) {
		// limit calls to worker to just most recent so we don't get plugged with irrelevant updates
		if (this.workInProgress) {
			this.nextMapInQueue = mapSegment;
		} else {
			this.workInProgress = true;
			mapSegment["params"] = this.params;
			let m = JSON.stringify(mapSegment);
			this.worker.postMessage(m);
			console.log("Posted worker message");
		}
	}

	/**
	 * When a web worker finishes creating it's suggestion, this gets called
	 * and updates the display and if there is another suggestion queued up,
	 * will call the web worker again to start the next suggestion
	 * @param m:WebWorkerEvent
	 */
	workerMessage(m) {
		console.log("SuggestMap received " );
		let segment = JSON.parse(m.data);
		this.tilemap._mapData = segment._mapData;
		this.tilemap.mapChanged = true;
		this.workInProgress = false;
		if (this.nextMapInQueue != null) {
			this.generateMap(this.nextMapInQueue);
			this.nextMapInQueue = null;
		}
		draw();
	}

	/**
	 * Handles the suggestion being clicked on.
	 * @param x:number coordinate where mouse released
	 * @param y:number coordinate where mouse released
	 * @returns {*}
	 */
	mouseUp(x,y) {
		let dirty = super.mouseUp(x,y);
		if (this.findRealPosition().containsCoordinate(x,y)) {
			this.owner.suggestionSelected(this);
			dirty = true
		}
		return dirty;
	}
}

// ************************************************************************

/** tile layer with support for different drawing commands that can be
 * applied when a click on the layer occurs
 */
class EditableMap extends TileMapLayer {
	/**
	 * @param lid:string|number label for this editing window
	 * @param bounds:SLLRectangle bounds of layer
	 * @param tilemap:TileMap Backing tile map for
	 * @param renderer:TileRenderer what draws the tiles
	 * @param owner:SLLLayer who owns the layer
	 */
	constructor(lid, bounds, tilemap, renderer, owner) {
		super(lid, bounds.width, bounds.height, tilemap, renderer);

		this.owner = owner;
		this.moveTo(bounds.x, bounds.y);
		this.drawingTile = 0;
		this.drawingMode = TOOL_PALETTE.DRAW;
		this.isDrawing = false;
		this.lastDrawStartLocation = new SLLPoint(0,0);
		this.MAX_UNDO_LEVEL = 3;
		this.undoList = [];
		//this.lastDrawEndLocation = this.lastDrawStartLocation;
		this.selectionTL = new SLLPoint(10,7);
		this.selectionBR = new SLLPoint(20,11);
		this.selectionInProgress = false;

		this.selection = new SLLLayer(lid+"_select", bounds.width, bounds.height);
		this.selection.setBackgroundColor("rgba(200,0,200,.5");
		this.addChild(this.selection);
		this.currentClip = new TileMap(1,1);
	}

	/* internal function for updating the current portion of the display (if any)
	that is being highlighted. This is used by selection and rectangle tools so that
	the affected area can be shown before action is taken.
	 */
	updateSelection() {
		let x = this.selectionTL.x * this.owner.config.TileSize - this.viewport.x;
		let y = this.selectionTL.y * this.owner.config.TileSize - this.viewport.y;
		let x2 = (this.selectionBR.x + 1) * this.owner.config.TileSize - this.viewport.x;
		let y2 = (this.selectionBR.y + 1) * this.owner.config.TileSize - this.viewport.y;
		if ((x2 < 0) || (y2 < 0) || (x > this.owner.config.editmapWidth) || (y > this.owner.config.editmapHeight)) {
			this.selection.setVisible(false);
			return;
		} else {
			this.selection.setVisible(true)
		}

		if (x < 0) x = 0;
		if (y < 0) y = 0;
		if (x2 > this.owner.config.editmapWidth)
			x2 = this.owner.config.editmapWidth;
		if (y2 > this.owner.config.editmapHeight)
			y2 = this.owner.config.editmapHeight;

		let w = x2 - x;
		let h = y2 - y;

		let pos = new SLLRectangle(x,y,w,h);
		this.selection.adjustPosition(pos);
	}

	/**
	 * Overridden method to add drwaing of the selection area to the display
	 * @param ctx:Context canvas context to render into
	 * @param bounds:SLLRectangle bounds of layer
	 */
	render(ctx, bounds) {
		if (this.selectionInProgress)
			this.updateSelection();
		this.selection.setVisible(this.selectionInProgress);
		super.render(ctx, bounds);
	}

	/**
	 * handle mouse click at provided coordinates
	 * @param x
	 * @param y
	 * @returns {*}
	 */
	mouseDown(x,y) {
		let dirty = super.mouseDown(x,y);
		if (this.findRealPosition().containsCoordinate(x,y)) {
			this.lastDrawStartLocation = this.findTileFromRealCoordinate(x,y);
			this.isDrawing = true;
			this.undoList.push(this.tilemap.createClip(0,0,this.tilemap.width,this.tilemap.height));
			if (this.undoList.length > this.MAX_UNDO_LEVEL)
				this.undoList.unshift();
			dirty |= this.performDraw(x,y);
			if (this.selectionInProgress) {
				this.selectionTL.x = this.selectionBR.x = this.lastDrawStartLocation.x;
				this.selectionTL.y = this.selectionBR.y = this.lastDrawStartLocation.y;
			}
		}
		return dirty;
	}

	/**
	 * handle mouse movement
	 * @param x
	 * @param y
	 * @returns {*}
	 */
	mouseMove(x,y) {
		let dirty = super.mouseDown(x,y);
		if (this.isDrawing)
			dirty |= this.performDraw(x,y);
		return dirty;
	}

	/**
	 * handle mouse button release
	 * @param x
	 * @param y
	 * @returns {*}
	 */
	mouseUp(x,y){
		let dirty = super.mouseDown(x,y);
		if (this.isDrawing) {
			dirty |= this.performDraw(x, y, true);
			this.owner.updateSuggestions();
		}
		this.isDrawing = false;
		return dirty;
	}

	// *** Drawing commands ***

	/** takes a real (click on the screen) coordinate and convert it into
	 * which tile on the tilemap was clicked returning the tilemap coordinates
	 * of that tile.
	 *
	 * @param x
	 * @param y
	 * @returns {SLLPoint}
	 */
	findTileFromRealCoordinate(x, y) {
		let pm = this.convertRealPointToLogicalPoint(new SLLPoint(x,y));
		let tx = Math.floor((this.viewport.x + pm.x) / this.renderer.tileSize.width);
		let ty = Math.floor((this.viewport.y + pm.y) / this.renderer.tileSize.height);
		pm.x = tx;
		pm.y = ty;
		return pm;
	}

	/**
	 * based on the currently selected drawing command.
	 * (Note: in future revision should refactor to command design pattern)
	 * @param x:number screen x coordinate of click
	 * @param y:number screen y coordinate of click
	 * @param release:boolean has button just been released
	 * @returns {boolean} return true if display has changed
	 */
	performDraw(x,y, release=false) {
		let dirty = false;
		this.selectionInProgress = false;
		let pm = this.findTileFromRealCoordinate(x,y);
		let tx = pm.x;
		let ty = pm.y;
		switch (this.drawingMode) {
			case TOOL_PALETTE.DRAW:
				dirty = this.commandDraw(tx, ty);
				break;
			case TOOL_PALETTE.FILL_DOWN:
			case TOOL_PALETTE.FILL_UP:
				dirty = this.commandVerticalFill(tx, ty);
				break;
			case TOOL_PALETTE.FLOOD_FILL:
				dirty = true;
				this.commandFlood(tx,ty);
				this.isDrawing = false;
				break;
			case TOOL_PALETTE.FILL_RECT:
				dirty = this.performSelection(tx,ty);

				if (release) {
					this.commandFillRect(
						this.lastDrawStartLocation.x, this.lastDrawStartLocation.y, tx, ty);
					this.selectionInProgress = false;
					this.tilemap.mapChanged = true;
					dirty = true;
				}
				break;
			case TOOL_PALETTE.SELECTION:
				dirty = this.performSelection(tx,ty);

				if (release) {
					this.currentClip = this.tilemap.createClip(
						this.selectionTL.x, this.selectionTL.y,
						this.selectionBR.x - this.selectionTL.x + 1,
						this.selectionBR.y - this.selectionTL.y + 1
					);
				}
				break;
			case TOOL_PALETTE.STAMP:
				this.tilemap.pasteClip(this.currentClip, tx, ty);
				this.isDrawing = false;
				dirty = true;
				break;
		}
		this.tilemap.mapChanged |= dirty;
		//this.owner.updateSuggestions();
		return dirty;
	}

	/** handle the selection command as it is occuring by adjusting the
	 * current selected area based on how the mouse has been dragged.
	 * @param tx:number tile X location
	 * @param ty:number  tile Y location
	 * @returns {boolean} return true if display needs updating
	 */
	performSelection(tx, ty) {
		let oldX1 = this.selectionTL.x;
		let oldY1 = this.selectionTL.y;
		let oldX2 = this.selectionBR.x;
		let oldY2 = this.selectionBR.y;

		if (tx < this.lastDrawStartLocation.x)
			this.selectionTL.x = tx;
		else
			this.selectionBR.x = tx;
		if (ty < this.lastDrawStartLocation.y)
			this.selectionTL.y = ty;
		else
			this.selectionBR.y = ty;
		this.selectionInProgress = true;

		return (	(oldX1 !== this.selectionTL.x) ||
			(oldY1 !== this.selectionTL.y) ||
			(oldX2 !== this.selectionBR.x) ||
			(oldY2 !== this.selectionBR.y)
		)
	}

	/** undo the last drawing command if possible */
	performUndo() {
		if (this.undoList.length < 1)
			return false;
		let clip = this.undoList.pop();
		this.tilemap.pasteClip(clip,0,0);
		this.tilemap.mapChanged = true;
	}

	/**
	 * basic draw command which simply replaces the tile at the given tilemap
	 * coordinates with the currently selected tile
	 * @param tx:number tile X location
	 * @param ty:number  tile Y location
	 * @returns {boolean} return true if display needs updating
	 */
	commandDraw(tx, ty) {
		if ((tx >= 0) && (tx < this.tilemap.width) && (ty >= 0) && (ty < this.tilemap.height)) {
			if (this.tilemap.getTile(tx, ty) !== this.drawingTile)
				this.tilemap.setTile(tx, ty, this.drawingTile);
			return true;
		}
		return false;
	}

	/**
	 * perform a flood fill starting from the selected tile replacing tiles of the type
	 * at the selected point with the indicated tile
	 * @param tx:number tile x coordinate for flood fill start
	 * @param ty:number tile y coordinate for flood fill start
	 * @param tileToReplace -1 for existing tile, other tile value for recursive use
	 */
	commandFlood(tx,ty, tileToReplace = -1) {
		if ((tx < 0) || (tx >= this.tilemap.width) || (ty < 0) || (ty >= this.tilemap.height))
			return;
		if (tileToReplace === -1)
			tileToReplace = this.tilemap.getTile(tx,ty);
		if (this.tilemap.getTile(tx,ty) !== tileToReplace)
			return;
		this.tilemap.setTile(tx,ty, this.drawingTile);
		this.commandFlood(tx-1, ty, tileToReplace);
		this.commandFlood(tx+1, ty, tileToReplace);
		this.commandFlood(tx, ty-1, tileToReplace);
		this.commandFlood(tx, ty+1, tileToReplace);
	}

	/**
	 * Note, once a rectangle has been drawn using selection mechanics,
	 * this method gets called to
	 * @param tx1:number left tile coordinate  of rectangle
	 * @param ty1:number top tile coordinate of rectangle
	 * @param tx2:number right tile coordinate of rectangle inclusive
	 * @param ty2:number bottom tile coordinate of rectangle inclusive
	 * @returns {boolean} true if tilemap has changed
	 */
	commandFillRect(tx1,ty1,tx2,ty2) {
		let x1 = Math.min(tx1,tx2);
		let x2 = Math.max(tx1, tx2);
		let y1 = Math.min(ty1,ty2);
		let y2 = Math.max(ty1, ty2);
		for (let y = y1; y <= y2; ++y)
			for (let x = x1; x <= x2; ++x)
				this.tilemap.setTile(x, y, this.drawingTile);
		return true;
	}

	/**
	 * fills from current coordinate to top or bottom (dependent on
	 * current drowing mode) of the tile map.
	 * @param tx:number tile X location
	 * @param ty:number  tile Y location
	 * @returns {boolean} return true if display needs updating
	 */
	commandVerticalFill(tx,ty) {
		let tidToFill = this.tilemap.getTile(tx, ty);
		if (tidToFill === this.drawingTile)
			return false;
		let direction = -1;
		if (this.drawingMode === TOOL_PALETTE.FILL_DOWN)
			direction = 1;
		let stillDrawing = true;
		let nextY = ty;
		while (stillDrawing) {
			let nextTile = this.tilemap.getTile(tx, nextY);
			if (nextTile === tidToFill) {
				this.tilemap.setTile(tx, nextY, this.drawingTile);
				nextY += direction;
				stillDrawing = ((nextY >= 0) && (nextY < this.tilemap.height));
			} else
				stillDrawing = false;
		}
		return true;
	}

	/** Sets the current drawing mode
	 *
	 * @param mode Drawing mode (see constants)
	 */
	setDrawMode(mode) {
		if ((mode < 0) || (mode >= TOOL_PALETTE.FUTURE)) {
			this.drawingMode = 0;
		} else
			this.drawingMode = mode;
	}


}

// ************************************************************************

/**
 * The main editor screen
 */
class TileEditor extends SLLLayer {
	/**
	 * @param bounds:SLLRecangle bounds of display
	 * @param owner:{} class hosting the editor
	 * @param config:{} json-type structure holding configuration variables
	 */
	constructor(bounds, owner, config=EDITOR_CONFIG) {
		super("tiledit", bounds.width,bounds.height);
		this.owner = owner;
		this.config = config;
		this.base64 = new Base64url();

		// editable map
		this.mainMap = new TileMap(config.mapWidth, config.mapHeight);
		this.tileImageRenderer = new TileImageRenderer(TILESET_TILES_IMG, new SLLRectangle(0,0,32,32), 1, 16);
		this.editableMap = new EditableMap("gameViewport",
			new SLLRectangle(config.viewportX,config.viewportY, config.viewportWidth, config.viewportHeight),
			this.mainMap, this.tileImageRenderer, this);
		this.editableMap.adjustPosition(
			new SLLRectangle(config.editmapX,config.editmapY,config.editmapWidth,config.editmapHeight));
		this.addChild(this.editableMap);

		// tools - palette
		this.paletteLabel = new SLLTextLayer("pl",
			new SLLRectangle(config.TilePaletteX,config.TilePaletteY-config.LabelHeight,
				config.TilePaletteWidth,config.LabelHeight),"Tile Palette");
		this.addChild(this.paletteLabel);
		this.palette = new TilePalette("tilepal", 8,2,this.tileImageRenderer,4);
		this.palette.setChangeHandler(this);
		this.palette.adjustPosition(new SLLRectangle(config.TilePaletteX,config.TilePaletteY, config.TilePaletteWidth,config.TilePaletteHeight));
		this.addChild(this.palette);

		// tools - commands
		this.toolsMetrics = [0,0,0,0,0,0,0,0];
		this.toolsLabel = new SLLTextLayer("tl", new SLLRectangle(config.ToolsPaletteX,config.ToolsPaletteY-config.LabelHeight,
			config.ToolsPaletteWidth,config.LabelHeight),"Tools Palette");
		this.addChild(this.toolsLabel);
		this.toolImageRenderer = new TileImageRenderer(TOOL_ICONS_IMG, new SLLRectangle(0,0,32,32), 1, 16);
		this.tools = new TilePalette("toolpal", 7,1,this.toolImageRenderer,4);
		this.tools.setChangeHandler(this);
		this.tools.moveTo(config.ToolsPaletteX, config.ToolsPaletteY);
		this.addChild(this.tools);

		// generators
		this.generatorMetrics = [];
		this.generatorsLabel = new SLLTextLayer("gl", new SLLRectangle(600,240,320,16),"Recomendations");
		this.addChild(this.generatorsLabel);
		let gens = config.suggestionGenerators;
		let params = config.suggestionGeneratorParams;
		// ["","","","3","8","11", {"noise":0.01},  {"noise":0.05}, {"noise":0.1}];
		let segment = this.mainMap.createClip(0,0,config.editmapTileWidth,config.editmapTileHeight);
		this.generators = [];
		for (let gid = 0; gid < this.config.suggestionRects.length; ++gid) {
			this.generatorMetrics.push(0);
			let g = this.config.suggestionRects[gid];
			let gen = new SuggestedMap(gid,
				new SLLRectangle(g.x, g.y, g.width, g.height),
				gens[gid], this, params[gid]);
			gen.generateMap(segment);
			this.addChild(gen);
			this.generators.push(gen);

		}

		// minimap
		this.minimapLabel = new SLLTextLayer("mml",
			new SLLRectangle(config.minimapX,config.minimapY-config.LabelHeight,config.minimapWidth,config.LabelHeight),"Mini-map (click to change location)");
		this.addChild(this.minimapLabel);
		this.minimap = new MiniMapSelector("minimap", this.mainMap, this);
		//this.minimap.moveTo(600,550);
		this.minimap.adjustPosition(new SLLRectangle(config.minimapX, config.minimapY, config.minimapWidth, config.minimapHeight));
		this.addChild(this.minimap);
		this.miniMapLeft = new SLLTextButton("miniLeft",
			new SLLRectangle(config.minimapX - config.minimapArrowWidth - 1, config.minimapY,
				config.minimapArrowWidth, config.minimapHeight), "<<");
		this.miniMapLeft.setClickHandler(this);
		this.addChild(this.miniMapLeft);
		this.miniMapRight = new SLLTextButton("miniRight",
			new SLLRectangle(config.minimapX + config.minimapWidth + 1, config.minimapY,
				config.minimapArrowWidth, config.minimapHeight), ">>");
		this.miniMapRight.setClickHandler(this);
		this.addChild(this.miniMapRight);

		// button menu
		let side_config = {
			"menuTop": 20, "menuLeft" : 940, "menuWidth" : 120, "menuHeight" : 40, "menuGap" : 10,
			"commands" : ["Help", "", "New", "Load", "Save", "Test", "Analyse", "", "Undo", "", "Share"]
		}
		this.buttons = buildSideMenu(side_config, this);

	}

	/**
	 * Sets level into editor (for local storage and shared url use)
	 * @param lvl:TileMap level to set in editor
	 */
	setLevel(lvl) {
		this.mainMap.pasteClip(lvl, 0, 0);
        this.updateSuggestions();
	}

	/**
	 * call the suggestion generators to let them know the map (or editing location)
	 * has been changed so they generate a new suggestion. Suggestion generators will
	 * drop requests keeping only the last request if multiple requests are made before
	 * the suggestion they are currently working on is finished.
	 */
	updateSuggestions() {
		let tileX = Math.floor(this.editableMap.viewport.x / 32);
		let segment = this.mainMap.createClip(tileX,0,this.config.editmapTileWidth,this.config.editmapTileHeight);
		for (let cntr = 0; cntr < this.generators.length; ++cntr)
			this.generators[cntr].generateMap(segment);
	}

	// *** Communicating with the Server ***

	/** For open source version, not using server but am keeping code here for anybody
	 * who wants to implement their own server code.
	 * @param e server error event
	 */
	handleCallbackError(e) {
		console.log(`Server returned error: ${e}`);
		//console.log(`debug - owner of this is ${this.id}`);
	}

	/** For open source version, not using server but am keeping code here for anybody
	 * who wants to implement their own server code.
	 * @param e server success event
	 */
	handleCallbackSuccess(e) {
		console.log(`Server returned success: ${e}`);
		//console.log(`debug - owner of this is ${this.id}`);
	}

	/** For open source version, not using server but am keeping code here for anybody
	 * who wants to implement their own server code.
	 * @param e server success event
	 */
	handleLoadCallbackSuccess(e) {
		//console.log(`Returned: ${e}`);
		let tempMap = JSON.parse(e.trim());
		if (tempMap.width !== undefined) {
			this.mainMap.pasteClip(tempMap, 0, 0);
			for (let i = 0; i < tempMap.toolUse.length; ++i)
				this.toolsMetrics[i] = tempMap.toolUse[i];
			for (let i = 0; i < tempMap.suggestionUse.length; ++i)
				this.generatorMetrics[i] = tempMap.suggestionUse[i];
		}
		this.updateSuggestions();
	}

	/**For open source version, not using server but am keeping code here for anybody
	 * who wants to implement their own server code.
	 *
	 * @param command server command to be issued
	 * @param data data to send to the server
	 * @param callbackSuccess handler for success
	 * @param callbackError handler for error
	 */
	sendCommand(command, data, callbackSuccess, callbackError) {
		let xhr = new XMLHttpRequest();
		let fd = new FormData();
		fd.append("command", command);
		fd.append("data", data);
		console.log(`sending date ${data}`);
		xhr.onreadystatechange = function() {
			// JSLint disable once CoercedEqualsUsing
			if (this.readyState === 4 && this.status === 200) {
				callbackSuccess(this.responseText);
			}
		};
//		xhr.addEventListener('load', () => {callbackSuccess(this);});
		xhr.addEventListener('error', () => {callbackError(this.responseText);});

		xhr.open("POST", "editor/STServer.php");
		xhr.send(fd);
	}

	// *** Event Handlers ***

	/**
	 * Handle the menu command buttons. This is handled concretely but in
	 * future will replace this with a command pattern where command handlers
	 * will be provided with the menu so the menu will be flexible and commands
	 * can be changed easier.
	 *
	 * @param btn:SLLTextButton button that was clicked on.
	 */
	buttonClicked(btn) {
		let myStorage = window.localStorage;
		if (btn.id === "New") {
			this.mainMap.clearMap(0);
		} else if (btn.id === "Load") {
			// local storage version using base64 string
			let b64 = myStorage.getItem("EditorSavedLevel");
			if (b64 != null) {
				let tm = this.base64.hexToTileMap(this.base64.decodeHexString(b64));
				this.setLevel(tm);
			}
			// if implementing server, can use this with some changes
			/*
			this.sendCommand("load",
				`{"userID" : ${this.config.userID}, "session" : ${this.config.session}, "mapID" : ${this.config.mapId}}`,
				this.handleLoadCallbackSuccess.bind(this),
				this.handleCallbackError.bind(this)
			);
			 */
		} else if (btn.id === "Save") {
			// local storage version using base64 string
			let b64 = this.base64.encodeHexString(this.base64.tileMapToHex(this.mainMap));
			myStorage.setItem("EditorSavedLevel", b64);

			// Note if using server can use the following, though may want to remove usage stats
			/*
			let tempMap = this.mainMap.createClip(0, 0, this.mainMap.width, this.mainMap.height)
			tempMap.userID = this.config.userID;
			tempMap.session = this.config.session;
			tempMap.levelID = this.config.mapId;
			tempMap.mapType = this.config.mapType;
			tempMap.toolUse = this.toolsMetrics;
			tempMap.suggestionUse = this.generatorMetrics;
			if (btn.id === "Done")
				tempMap.finished = 1;

			let data = JSON.stringify(tempMap);
			this.sendCommand("save", data,
				this.handleCallbackSuccess.bind(this), this.handleCallbackError.bind(this));
			console.log(`debug - should be calling server...${this.id} with ${data}`);
			*/
		} else if (btn.id === "Share") {
			shareLevel(this.mainMap);
		}  else if (btn.id === "Test"){
			this.owner.swapDisplays(DISPLAY_MODES.TEST_LEVEL);
		}  else if (btn.id === "Analyse"){
			this.owner.swapDisplays(DISPLAY_MODES.ANALYSIS);
		} else if (btn.id === "Undo") {
			this.editableMap.performUndo();
		} else if (btn.id === "Help") {
			console.log("should be showing help")
			this.owner.swapDisplays(DISPLAY_MODES.HELP);
		} else if (btn.id === "miniLeft") {
			this.minimap.adjustViewport(this.minimap.getViewportX() - Math.floor(this.config.editmapTileWidth/2));
		} else if (btn.id === "miniRight") {
			this.minimap.adjustViewport(this.minimap.getViewportX() + Math.floor(this.config.editmapTileWidth/2));
		} else {
			console.log(`unknown button id provided: ${btn.id}`);
		}
	}

	/**
	 * This gets called whenever the mini-map changed
	 * @param targetX
	 */
	mapPositionChanged(targetX) {
		this.editableMap.viewport.x = targetX*32;
		this.editableMap.setDirty(true);
		this.mainMap.mapChanged = true; // kludge
		this.updateSuggestions();
	}

	/**
	 * This gets called when one of the pallets (tiles or tools) has a
	 * different choice selected.
	 *
	 * @param palette:TilePalette palette that has different icon selected.
	 */
	paletteChanged(palette) {
		if (palette === this.palette)
			this.editableMap.drawingTile = this.palette.currentSelected;
		if (palette === this.tools){
			this.editableMap.setDrawMode(this.tools.currentSelected);
			++this.toolsMetrics[this.tools.currentSelected];
		}
	}

	/**
	 * This gets called when a suggestion has been selected and currently replaces
	 * the current viewport tiles with the suggestion tiles though in the future
	 * would like to have a duel-pane editor pop up so can cut and paste from
	 * the suggestion.
	 *
	 * @param suggestion
	 */
	suggestionSelected(suggestion) {
		++this.generatorMetrics[suggestion.id];
		let tileX = Math.floor(this.editableMap.viewport.x / 32);
		this.mainMap.pasteClip(suggestion.tilemap, tileX, 0);
		this.updateSuggestions();
	}

}

// ------------------------------------------------------------------------------------

/**
 * A very simple help system where there is a menu of buttons with each button
 * linking to a image to be displayed.
 */
class EditorHelp extends SLLLayer {
	/**
	 * Creates the help screen by creating a list of buttons of the different
	 * pages that make up the help manual. The list of page names and images
	 * to show for those pages are in the configuration file so can be
	 * changed easily.
	 *
	 * @param bounds bounds of the display
	 * @param owner who owns this screen
	 * @param config the config file containing the help configuration
	 */
	constructor(bounds, owner, config=EDITOR_CONFIG) {
		super("help", bounds.width,bounds.height);
		this.owner = owner;
		this.config = config;
		// button menu
		this.buttons = buildSideMenu(config.helpPages, this);
		// images
		this.pageImages = []
		for (let i = 0; i < this.config.helpPages.images.length; ++i) {
			let img = new Image();
			img.src = this.config.helpPages.images[i];
			this.pageImages.push(img);
		}

		this.pageRect = new SLLRectangle(0,0,800,600);
		this.currentPage = new SLLImageLayer("page", this.pageImages[0], this.pageRect);
		this.addChild(this.currentPage);
	}

	/**
	 * find id of command by looking at which button was clicked and going
	 * to the appropriate help page based on that command.
	 *
	 * @param btn:SLLTextButton button that was clicked
	 */
	buttonClicked(btn) {
		let pageID = -1;
		for (let i = 0; i < this.buttons.length; ++i)
			if (this.buttons[i] === btn)
				pageID = i;
		if (pageID === (this.buttons.length - 1))
			this.owner.swapDisplays(DISPLAY_MODES.EDITOR);
		else if (pageID >= 0) {
			console.log("Should go to page " + this.config.helpPages.commands[pageID]);
			this.currentPage.setImage(this.pageImages[pageID]);
		}
	}
}

// ------------------------------------------------------------------------------------

/**
 * Main class for the editor. This controls the switching between the different
 * editor screens
 */
class EditorMain extends SLLLayer {
	/**
	 * @param bounds display bounds
	 * @param config configuration for editor
	 */
	constructor(bounds, config = EDITOR_CONFIG) {
		super("EDITOR", bounds.width,bounds.height);

		// activate gamepads
		this.virtualGamepad = new VirtualGamepad();

		// Different screen classes go here
		//this.pathEditor = new PathEditor(bounds, this);
		this.tileEditor = new TileEditor(bounds, this);
		this.tileEditor.buttonClicked({"id" : "Load" });
		this.testLevel = new TestLevel(bounds, this);
		this.analysis = new AnalysisScreen(bounds, this);
		this.help = new EditorHelp(bounds, this, config)
		this.screens = [this.tileEditor, null, this.testLevel, this.analysis, this.help];
		this.currentDisplayMode = DISPLAY_MODES.HELP;
		if (config.showInstructions )
			this.currentScreen = this.help;
		else {
			this.currentDisplayMode = DISPLAY_MODES.EDITOR;
			this.currentScreen = this.tileEditor;
		}
		this.addChild(this.currentScreen);
	}

	/**
	 * Change screen to indicated screen
	 * @param newDisplayMode:number id of screen to display
	 */
	swapDisplays(newDisplayMode) {
		if (this.currentDisplayMode === newDisplayMode)
			return;
		this.removeChild(this.currentScreen);
		this.currentScreen = this.screens[newDisplayMode];
		this.addChild(this.currentScreen);
		this.currentDisplayMode = newDisplayMode
		console.log(`should be showing ${this.currentDisplayMode}`);
		if (this.currentDisplayMode === DISPLAY_MODES.TEST_LEVEL) {
			this.testLevel.setLevel(this.tileEditor.mainMap);
		}
		if (this.currentDisplayMode === DISPLAY_MODES.ANALYSIS) {
			this.analysis.setLevelMap(this.tileEditor.mainMap);
		}
	}

	/** keyboard handling for when key pressed
	 *
	 * @param key keycode for pressed key
	 * @returns {boolean}
	 */
	handleKeyDown(key) {
		this.virtualGamepad.keyDown(key);
		return this.currentDisplayMode === DISPLAY_MODES.TEST_LEVEL;

	}
	/** keyboard handling for when key released
	 *
	 * @param key keycode for pressed key
	 * @returns {boolean}
	 */
	handleKeyUp(key) {
		this.virtualGamepad.keyUp(key);
		return this.currentDisplayMode === DISPLAY_MODES.TEST_LEVEL;

	}

	/**
	 * sets the level that the editor will start with
	 * @param lvl:TileMap editor
	 */
	setStartLevel(lvl) {
		this.tileEditor.setLevel(lvl);
	}

	/**
	 * Handle animation ticks
	 * @param delta
	 * @returns {boolean}
	 */
	tick(delta) {
		if (this.currentDisplayMode === DISPLAY_MODES.TEST_LEVEL) {
			/*
			let newTime = Date.now();
			if (this.lastFrameTime+LITETUX_CONSTS.MAX_SKIP < newTime)
				this.lastFrameTime = newTime - LITETUX_CONSTS.MAX_SKIP;
			let needsRedraw = false;
			while (this.lastFrameTime+LITETUX_CONSTS.FRAME_TIME <= newTime) {
				needsRedraw |= stage.tick(LITETUX_CONSTS.FRAME_TIME);
				this.lastFrameTime += LITETUX_CONSTS.FRAME_TIME;
			}
			*/
			this.testLevel.tick(delta);
			return true;
		}
		return false;
	}

}
