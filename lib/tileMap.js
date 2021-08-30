/* TileLayer based on Game Jam Library is Copyright (c) 2013 Billy D. Spelchan */
// require ssl.js
// noinspection JSUnusedGlobalSymbols

class TileMap {
	constructor(width = 64, height = 64, wrapping = false, fill=0) {
		this.width = width;		/** Width of the tile map */
		this.height = height;	/** Height of the tile map */
		this.mapChanged = true;	/** Flag indicating map changed */
		this._shouldWrap = wrapping; /** Flag true if map wraps */
		
		/** If map not wrapped, values to use for out of bounds tiles */
		this._outOfBoundsTop =  -1;
		this._outOfBoundsBottom =  -1;
		this._outOfBoundsLeft =  -1;
		this._outOfBoundsRight =  -1;
		
		/** Array [y][x] holding the map data */
		this._mapData = new Array(this.height);
		for (let cntrRow = 0; cntrRow < this.height; ++cntrRow) {
			this._mapData[cntrRow] = new Array(this.width);
			for (let cntrCol = 0; cntrCol < this.width; ++cntrCol) {
				this._mapData[cntrRow][cntrCol] = fill;
			}
		}
	}

	// ***** METHODS - Map Management *****
		
	/** Gets the tile at the indicated location. If the location specified
	 * is outside the map, the wrap state will determine if the coordinates
	 * will wrap or if the outOfBounds value will be returned.
	 * 
	 * @param x map x coordinate
	 * @param y map y coordinate
	 * @return the tile at the indicated location. */
	getTile(x, y) {
		let rv;
		
		if (this._shouldWrap) {
			let tx = x % this.width;
			if (tx < 0) tx += this.width;
			let ty = y % this.height;
			if (ty < 0) ty += this.height;
			rv = this._mapData[ty][tx];
		} else if ((x < 0) || (x >= this.width) || (y < 0) || (y >= this.height) )
			if (x < 0) rv = this._outOfBoundsLeft;
			else if (x >= this.width) rv = this._outOfBoundsRight;
			else if (y < 0) rv = this._outOfBoundsTop; 
			else rv = this._outOfBoundsBottom;
		else
			rv = this._mapData[Math.floor(y)][Math.floor(x)];
		return rv;
	}
		
	/** Sets the indicated tile to indicated value. If coordinates 
	 * specified are out of bounds, the request is IGNORED! While this
	 * could be wrapped, I feel too much danger of accidental wrapping.
	 * 
	 * @param x map x coordinate
	 * @param y map y coordinate
	 * @param value value to put into map */
	setTile(x, y, value)	{
		if ((x<0) || (y<0) || (x>=this.width) ||(y>=this.height)) {
			console.log(`setTile(${x}, ${y}, ${value}) is invalid.`);
			return;
		}
		this._mapData[y][x] = value;
		this.mapChanged = true;
	}
		
	/** Clears the map with the indicated value.
	 * 
	 * @param value value to clear the map with. */
	clearMap(value) {
		let cntrRow, cntrCol;
			
		for (cntrRow = 0; cntrRow < this.height; ++cntrRow)
			for (cntrCol = 0; cntrCol < this.width; ++cntrCol)
				this._mapData[cntrRow][cntrCol] = value;
		this.mapChanged = true;
	}
		
	/** Resizes the map. Top-Left portion of map is kept, with extra space 
	 * filled with the provided value. */
	resize(w, h, filler) {
		let cntrX, cntrY, rows, cols;
			
		if (h < this.height)
			this._mapData.splice(h);
		if (w < this.width) {
			rows = Math.min(h, this.height);
			for (cntrY = 0; cntrY < rows; ++cntrY)
				this._mapData[cntrY].splice(w);
		}
		if (h > this.height) {
			cols = Math.min(w, this.width);
			for (cntrY = this.height; cntrY < h; ++cntrY) {
				this._mapData[cntrY] = new Array(cols);
				for (cntrX = 0; cntrX > cols; ++cntrX)
					this._mapData[cntrY][cntrX] = filler;
			}
		}
		if (w > this.width) {
			for (cntrY = 0; cntrY < h; ++cntrY)
				for (cntrX = this.width; cntrX < w; ++cntrX)
					this._mapData[cntrY][cntrX] = filler;
		}
		this.width = w;
		this.height = h;
		this.mapChanged = true;
	}
	
	/** sets tiles from the map with data from a one-dimensional array 
	 *
	 * @param data 1D array containing data to set map with
	 * @param width number of columns in data array
	 * @param height number of rows in data array
	 * @param offX offset X coordinate to start copying to
	 * @param offY offset Y coordinate to start copying to
	 * @param resize set to true if size of tilemap should be adjusted to hold added data. */
	setTilesFromRawData(data, width, height, offX=0, offY=0, resize=false) {
		let offsetX = offX;
		let offsetY = offY
		if ((offsetX < 0) || (offsetY < 0))
			return;
		if ((resize !== undefined) && (resize === true))
			this.resize(width + offsetX, height+offsetY);
		let w = Math.min(width, this.width - offsetX);
		let h = Math.min(height, this.height - offsetY);
		let indx = 0;
		for (let cntrY = 0; cntrY < h; ++cntrY) {
			for (let cntrX = 0; cntrX < w; ++cntrX) {
				this._mapData[cntrY + offsetY][cntrX + offsetX] = data[indx];
				++indx;
			}
		}
		this.mapChanged = true;
	}
	
	/** create a new tile map that is a portion of this tile map
	 *
	 * @param x map x coordinate to start copying from
	 * @param y map y coordinate to start copying from
	 * @param w width of clip
	 * @param h height of clip
	 * @return TileMap containing indicated data*/
	createClip(x, y, w, h)
	{
		let clip = new TileMap(w,h);
		for (let cntrRow = 0; cntrRow < h; ++cntrRow)
			for (let cntrCol = 0; cntrCol < w; ++cntrCol)
				clip.setTile(cntrCol, cntrRow, this.getTile(x + cntrCol, y + cntrRow));
		return clip;
	}
	
	/** paste a tile map onto this tile map
	 *
	 * @param clip tile map to paste
	 * @param x map x coordinate to start copying to
	 * @param y map y coordinate to start copying to
	 * @param nw width of clip to copy default width of clip
	 * @param nh height of clip to copy default height of clip */
	pasteClip(clip, x, y, nw=-1, nh=-1) {
		let clipW = nw;
		if (nw === -1) clipW = clip.width;
		let clipH = nh;
		if (nh === -1) clipH = clip.height;
		for (let cntrY = 0; cntrY < clipH; ++cntrY)
			for (let cntrX = 0; cntrX < clipW; ++cntrX)
				this.setTile(x + cntrX, y+cntrY, clip._mapData[cntrY][cntrX]);
		this.mapChanged = true;
	}

	/** Fill the map with a solid block of tiles.
	 *
	 * @param x map x coordinate to start copying from
	 * @param y map y coordinate to start copying from
	 * @param w width of clip
	 * @param h height of clip
	 * @param value value to put into map */
	fillRect(x, y, w, h, value) {
		for (let cntrY = 0; cntrY < h; ++cntrY)
			for (let cntrX = 0; cntrX < w; ++cntrX)
				this.setTile(x + cntrX, y+cntrY, value);
		this.mapChanged = true;
	}
	
}

// ==========================================================================

/**
 * Base class for rendering tiles. This is a solid-color renderer so is useful
 * for things such as auto-maps or for prototyping.
 */
class TileRenderer {
	constructor(colors = null, offset = 0, tileSize = null) {
		if (colors == null) {
			this._colors = ["#000", "#F00", "#0F0", "#FF0",
					"#00F", "#F0F", "#0FF", "#FFF"];
		} else
			this._colors = colors;
		this.offset = offset;
		if (tileSize == null)
			this.tileSize = new SLLDimension(32,32);
		else
			this.tileSize = tileSize
	}

	/**
	 * draws indicated tile (tileID) into specified rectangle on context
	 * @param ctx canvas context
	 * @param tileID tile to draw
	 * @param rect location ond size of drawing
	 */
	render(ctx, tileID, rect) {
		let tid = (tileID - this.offset) % this._colors.length;
		if (tid < 0) tid += this._colors.length;
		ctx.save();
		let oldFill = ctx.fillStyle;
		ctx.fillStyle = this._colors[tid];
		ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
		ctx.fillStyle = oldFill;
		ctx.restore();
	}
}

// ==========================================================================

/**
 * Tile renderer for drawing tiles from image atlas
 */
class TileImageRenderer {
	/**
	 *
	 * @param img image that contains tile strip or grid
	 * @param firstTileClip:SLLRectangle clip of first tile for location.size
	 * @param rows how many rows of tiles there are
	 * @param cols how many tiles per row of tiles
	 */
	constructor(img, firstTileClip, rows, cols) {
		this.img = img;
		this.tileSize = firstTileClip;
		this.rows = rows;
		this.cols = cols;
	}

	/**
	 * draws indicated tile (tileID) into specified rectangle on context
	 * @param ctx canvas context
	 * @param tileID tile to draw
	 * @param rect location ond size of drawing
	 */
	render(ctx, tileID, rect) {
		ctx.save();
		let clip = new SLLRectangle();
		clip.clone(this.tileSize);
		let r = Math.floor(tileID / this.cols);
		let c = tileID % this.cols;
		clip.x = clip.x + c*clip.width;
		clip.y = clip.y + r*clip.height;

		ctx.drawImage(this.img, clip.x, clip.y, clip.width,clip.height,
				rect.x, rect.y, rect.width, rect.height);
		ctx.restore();
	}

}

// ==========================================================================

/**
 * SLLLayer that holds view of tile map
 */
class TileMapLayer extends SLLLayer {
	/**
	 *
	 * @param id:string label assigned to layer
	 * @param width:number logical width of layer
	 * @param height:number logical height of layer
	 * @param tilemap:TileMap Source map for layer
	 * @param renderer:TileRenderer Renderer for drawing the tiles
	 */
	constructor(id, width, height, tilemap, renderer) {
		super(id, width, height);
		this.tilemap = tilemap;
		this.renderer = renderer;
		this.viewport = new SLLRectangle(0,0,width,height);
		this.lastViewport = new SLLRectangle();
		this.canvas = null
		this.sharedMap = false;
	}

	/**
	 * Draws map to canvas to speed up rendering scaled viewport
	 */
	renderToOffscreenCanvas() {
		if (this.canvas == null)
			this.canvas = document.createElement('canvas');
		let ts = this.renderer.tileSize;
		this.canvas.width = this.viewport.width;//cw;
		this.canvas.height = this.viewport.height;//ch;
		let ctx = this.canvas.getContext('2d');

		let rect = new SLLRectangle(0,0, ts.width, ts.height);
		let startRow = Math.floor(this.viewport.y / ts.height);
		let endRow = Math.floor((this.viewport.y + this.viewport.height) / ts.height);
		let startCol = Math.floor(this.viewport.x / ts.width);
		let endCol = Math.floor((this.viewport.x + this.viewport.width) / ts.width);
		for (let cntrRow = startRow; cntrRow <= endRow; ++cntrRow) {
			for (let cntrCol = startCol; cntrCol <= endCol; ++cntrCol) {
				let tid = this.tilemap.getTile(cntrCol, cntrRow);
				rect.x = cntrCol * ts.width - this.viewport.x;
				rect.y = cntrRow * ts.height - this.viewport.y;
				this.renderer.render(ctx, tid, rect);
			}
		}
		
		this.tilemap.mapChanged = false;
	}

	/**
	 * used to draw self.
	 * @param ctx display conext to draw to
	 * @param bounds where viewport appears
	 * @param drawOutsideBounds
	 * @returns {*}
	 */
	drawSelf(ctx, bounds, drawOutsideBounds = false) {
		if (this.findRealPosition().intersects(bounds) === false)
			return bounds;
		if (this._visible) {
			ctx.save();
			let realRect = this.findRealPosition();
			let scaleX = realRect.width / this._logicalPosition.width;
			let scaleY = realRect.height / this._logicalPosition.height;
			if ( (this.lastViewport.x !== this.viewport.x) || (this.lastViewport.y !== this.viewport.y) ) {
				this.tilemap.mapChanged = true;
				this.lastViewport.x = this.viewport.x;
				this.lastViewport.y = this.viewport.y;
			}
			if ((this.canvas == null) || (this.tilemap.mapChanged) || (this.sharedMap) )
				this.renderToOffscreenCanvas();
			let rect = this._realPosition.getIntersection(bounds);
			let offscreenCtx = this.canvas.getContext('2d');
			ctx.drawImage(this.canvas, 0, 0, this.viewport.width, this.viewport.height,
					realRect.x, realRect.y, realRect.width, realRect.height);
			ctx.restore();
		}
		
		return bounds;		
	}
}


// ==========================================================================

/** creates a tool or palette from tile set */
class TilePalette extends SLLLayer {
	constructor( lid, cols, rows, renderer, gap = 2) {
		super(lid, cols * (renderer.tileSize.width + gap * 2),
				rows * (renderer.tileSize.height + gap * 2));
		this.rows = rows;
		this.cols = cols;
		this.gap = gap;
		this.renderer = renderer;
		this._backgroundColor = "#FFF";
		this.overColor = "#0FF";
		this.selectedColor = "#F0F";
		this.currentSelected = 0;
		this.currentOver = 0;
		this.changeHandler = null;
	}

	/**
	 * colors for the selector and selected tiles
	 * @param back background color of control
	 * @param over box color for tile to be selected
	 * @param selected box color of currently selected tile
	 */
	setColors(back, over, selected) {
		this._backgroundColor = back;
		this.overColor = "#0FF";
		this.selectedColor = "#F0F";
	}

	/**
	 *
	 * @param handler callback class with paletteChanged(this) method
	 */
	setChangeHandler(handler) {
		this.changeHandler = handler;
	}

	/**
	 * used to draw self.
	 * @param ctx display conext to draw to
	 * @param bounds where viewport appears
	 * @param drawOutsideBounds
	 * @returns {*}
	 */
	drawSelf(ctx, bounds, drawOutsideBounds = false) {
		if (this.findRealPosition().intersects(bounds) === false)
			return bounds;
		if (this._visible) {
			ctx.save();
			let oldFill = ctx.fillStyle;

			let scaleX = this._realPosition.width / this._logicalSize.width;
			let scaleY = this._realPosition.height / this._logicalSize.height;

			let rect = new SLLRectangle(this._realPosition.x,this._realPosition.y,
								(this.renderer.tileSize.width + this.gap * 2) * scaleX,
								(this.renderer.tileSize.height + this.gap * 2) * scaleY);
			let renderRect = new SLLRectangle(this.gap* scaleX, this.gap * scaleY,
								this.renderer.tileSize.width * scaleX,
								this.renderer.tileSize.height * scaleY);

			for (let r = 0; r < this.rows; ++r) {
				for (let c = 0; c < this.cols; ++c) {
					let tid = r*this.cols+c;
					let color = this._backgroundColor;
					if (tid === this.currentOver)
						color = this.overColor;
					if (tid === this.currentSelected)
						color = this.selectedColor;
					rect.x = this._realPosition.x + c * rect.width;
					rect.y = this._realPosition.y +r * rect.height;
					ctx.fillStyle = color;
					ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
					renderRect.x = rect.x + this.gap * scaleX;
					renderRect.y = rect.y + this.gap * scaleY;
					this.renderer.render(ctx, tid, renderRect);
				}
			}
			ctx.fillStyle = oldFill;
			ctx.restore();
		}
		
		return bounds;		
	}

	/**
	 * Finds tile at indicated screen coordinate
	 * @param x:number screen x coordinate
	 * @param y:number screen y coordinate
	 * @returns {number} returns tile at that location
	 */
	findTileAtRealCoordinate(x,y) {
		let tileID = -1;
		let p = this.convertRealPointToLogicalPoint(new SLLPoint(x,y));
		let itemWidth = this.renderer.tileSize.width + this.gap * 2;
		let itemHeight = this.renderer.tileSize.width + this.gap * 2;
		let selectedCol = Math.floor(p.x / itemWidth);
		let selectedRow = Math.floor(p.y / itemHeight);
		if ((selectedRow >= 0) && (selectedRow < this.rows) && (selectedCol >= 0) && (selectedCol < this.cols)) {
			tileID = selectedRow * this.cols + selectedCol;
		}
		return tileID;
	}

	/**
	 * handle mouse down event
	 * @param x mouse real x coordinate
	 * @param y mouse real y coordinate
	 * @returns {boolean} true if caused display change
	 */
	mouseDown(x, y)
	{
		let dirty = super.mouseDown(x,y);
		let tileID = this.findTileAtRealCoordinate(x,y);
		if (tileID >= 0) {
			dirty |= !(this.currentSelected === tileID);
			this.currentSelected = tileID;
			if (this.changeHandler != null)
				{ // noinspection JSUnresolvedFunction
					this.changeHandler.paletteChanged(this);
				}
		}
		
		return dirty;
	}

	/**
	 * handle mouse move event
	 * @param x mouse real x coordinate
	 * @param y mouse real y coordinate
	 * @returns {boolean} true if caused display change
	 */
	mouseMove(x, y)
	{
		let dirty = super.mouseMove(x,y);
		let tileID = this.findTileAtRealCoordinate(x,y);
		dirty |= !(this.currentOver === tileID);
		this.currentOver = tileID;		
		return dirty;
	}

}
	