/** This is part of the LiteTux release and is available under the MIT license
 * This was created by Billy D. Spelchan as part of their research at UBC
 * (Okanagan campus) and consists of some common utilities for displaying
 * vertical menu bars and mini maps.
 */

/**
 * Set of colors used by the editor to represent small (1-3 pixel squares)
 * for displaying mini-maps and small tile maps.
 */
TILESET_PALETTE = ["#08F", "#8CC", "#09B", "#888",
    "#FF0", "#FFF", "#A8C", "#0FF",
    "#555", "#8CC", "#AA5522", "#C84",
    "#C84", "#046", "#858", "#222"];

// *********************************

/** data structure for setting up look of the text columns */
DEFAULT_COLUMN_TEXT_FORMAT = {
    "size" : 14,
    "typeface" : "sans-serif",
    "bold" : false,
    "italic" : false,
    "solid" : true,
    "outline" : false,

    "textColor" : "#FC4",
    "outlineColor" : "#103",

    "alignment" : "left",
    "headlineColor" : "#FFF",
    "headlineSize" : 16
};

// *********************************

/**
 * Utility method for displaying vertical row of buttons.
 * json info used:
 *   menuLeft, menuTop, menuWidth, menuHeight -> coords/dimension of first button
 *   menuGap -> gap between buttons
 *   commands -> array of commands, with "" representing a gap in the button list
 * @param json configuration info for the menu bar
 * @param handler SLLLayer holding buttons and handles button click messages
 * @returns {*[]} returns array of SLLTextButton
 */
function buildSideMenu(json, handler) {
    let buttonList = [];

    for (let cntr = 0; cntr < json.commands.length; ++cntr) {
        let rect = new SLLRectangle(json.menuLeft, json.menuTop+cntr*(json.menuHeight+json.menuGap),
            json.menuWidth, json.menuHeight);
        if (json.commands[cntr] !== "") {
            let btn = new SLLTextButton(json.commands[cntr], rect, json.commands[cntr]);
            btn.moveTo(rect.x, rect.y);
            btn.setClickHandler(handler);
            handler.addChild(btn);
            buttonList.push(btn);
        }
    }

    return buttonList;
}

// *********************************

/**
 * Draws a list of text
 *
 * @param host:SLLLayer Layer to draw the list on
 * @param list:string[] array of strings to draw
 * @param x:number left of list
 * @param y:number top of list
 * @param w:number width of items
 * @param h:number height of items
 * @param textFormat:{} JSON text format object (see above)
 * @param hasHeading:boolean should top item be header
 * @returns {*[]} list of SLLTextLayers
 */
function buildTextColumn(host, list, x, y, w, h, textFormat=DEFAULT_COLUMN_TEXT_FORMAT, hasHeading=true,) {
    let column = [];
    let firstIndex = 0;
    let row = y;
    if (hasHeading) {
        firstIndex = 1;
        let header = new SLLTextLayer(list[0], new SLLRectangle(x,y,w,h), list[0]);
        header.setAlignment(textFormat.alignment);
        header.setColor(textFormat.headlineColor, textFormat.outlineColor);
        header.setFont(textFormat.headlineSize, textFormat.typeface, textFormat.bold,
            textFormat.italic, textFormat.solid, textFormat.outline);
        row += h;
        column.push(header);
        host.addChild(header);
    }
    for (let i = firstIndex; i < list.length; ++i) {
        let lineOfText = new SLLTextLayer(list[i], new SLLRectangle(x,row,w,h), list[i]);
        lineOfText.setColor(textFormat.textColor, textFormat.outlineColor);
        lineOfText.setAlignment(textFormat.alignment);
        lineOfText.setFont(textFormat.size, textFormat.typeface, textFormat.bold,
            textFormat.italic, textFormat.solid, textFormat.outline);
        row += h;
        column.push(lineOfText);
        host.addChild(lineOfText);
    }
    return column;
}

// *********************************

/**
 * MiniMap that lets you select location on the map to set viewport to
 */
class MiniMapSelector extends SLLLayer {
    /**
     *
     * @param tid:string ID of layer
     * @param map:TileMap Map to be displayed
     * @param owner:SLLLayer owner of the layer
     * @param tilePalette:string[] array of colors
     */
    constructor(tid, map, owner=null, tilePalette = TILESET_PALETTE) {
        super(tid, map.width+2, map.height+2);
        this.owner = owner;
        this.tilemap = map;
        //this.overlapMap
        this.renderer = new TileRenderer(tilePalette, 0, new SLLDimension(1,1));
        this.overlayRenderer = new TileRenderer(["rgba(0,0,0,0)","rgba(255,255,255,.6)", "#F00", "#000"],0, new SLLDimension(1,1));

        this.minimap = new TileMapLayer("mini", this.tilemap.width, this.tilemap.height, this.tilemap, this.renderer);
        this.minimap.moveTo(1,1);
        this.minimap.sharedMap = true;
        this.addChild(this.minimap);

        //this.overlapMap
        this.selectWidth = map.height+2;
        if (owner != null)
            if (owner.config != null)
                this.selectWidth = owner.config.editmapTileWidth+2;

                this.selection = new SLLLayer("selection", this.selectWidth, map.height+2 );
        this.selection.setBackgroundColor("rgba(128,0,128,.5)");
        this.addChild(this.selection);
        this.isChangingViewport = false;

    }

    /** Change the portion of the map being highlightd
     *
     * @param x new hightlight x coordinate
     */
    adjustViewport(x) {
        let targetX = x;
        let limit =this.tilemap.width - this.selectWidth;
        if (x < 0)
            targetX = 0;
        else if (x >= limit)
            targetX = limit;
        if (this.owner != null)
            this.owner.mapPositionChanged(targetX);
        this.selection.moveTo(targetX, 0);
    }

    /**
     * find current viewport x location
     * @returns {number}
     */
    getViewportX() {
        return this.selection.getPosition().x;
    }

    /**
     * handle clicking on component
     * @param x:number x coordinate of click
     * @param y:number y coordinate of click
     * @returns {*}
     */
    mouseDown(x,y) {
        console.log(`minimap clicked ${x}, ${y}`);
        let dirty = super.mouseDown(x,y);
        if (this.findRealPosition().containsCoordinate(x,y)) {
            this.isChangingViewport = true;
            let p = new SLLPoint(x, y);
            p = this.convertRealPointToLogicalPoint(p);
            this.adjustViewport(p.x);
            dirty = true
        }
        return dirty;
    }

    /**
     * handle moving over component
     * @param x:number x coordinate of click
     * @param y:number y coordinate of click
     * @returns {*}
     */
    mouseMove(x,y) {
        let dirty = super.mouseDown(x,y);
        if (this.isChangingViewport) {
            let p = new SLLPoint(x, y);
            p = this.convertRealPointToLogicalPoint(p);
            this.adjustViewport(p.x);
            dirty = true;
        }
        return dirty;
    }

    /**
     * handle releasing click on component
     * @param x:number x coordinate of click
     * @param y:number y coordinate of click
     * @returns {*}
     */
    mouseUp(x,y){
        let dirty = super.mouseDown(x,y);
        if (this.isChangingViewport) {
            let p = new SLLPoint(x, y);
            p = this.convertRealPointToLogicalPoint(p);
            this.adjustViewport(p.x);
            console.log(`mouse up at logical point ${p.x}, ${p.y} `);
            this.isChangingViewport = false;
            dirty = true;
        }
        return dirty;
    }

}

// ************************************************************************

/** extended version of mini-map selector that can also display list of nodes
 * over the mini-map
 */
class MiniMapAndNodesSelector extends MiniMapSelector {
    /**
     *
     * @param tid:string ID of layer
     * @param map:TileMap Map to be displayed
     * @param nodes:[] list of nodes to be displayed.
     * @param owner:SLLLayer owner of the layer
     * @param tilePalette:string[] array of colors
     */
    constructor(tid, map, nodes, owner=null, tilePalette = TILESET_PALETTE) {
        super(tid, map, owner, tilePalette);
        // create overlay map
        this.overlayMap = new TileMap(map.width, map.height);
        this.refreshNodes(nodes);

        // create renderable version of node map
        this.mininodemap = new TileMapLayer("mini", this.overlayMap.width, this.overlayMap.height, this.overlayMap, this.overlayRenderer);
        this.mininodemap.moveTo(1,1);
        this.mininodemap.sharedMap = true;
        this.addChild(this.mininodemap);
    }

    /**
     * Change the list of nodes that are to be displayed
     * @param nodes
     */
    refreshNodes(nodes) {
        this.overlayMap.clearMap(0);
        this.nodes = nodes;
        for (let i = 0; i < this.nodes.length; ++i)
            this.overlayMap.setTile(this.nodes[i].x, this.nodes[i].y, 1);
    }
}