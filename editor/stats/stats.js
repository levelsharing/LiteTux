/** This is part of the LiteTux release and is available under the MIT license
 * This was created by Billy D. Spelchan as part of their research at UBC
 * (Okanagan campus) and consists of the analysis screen
 */

/**
 * A simplified version of the SLL TileMap classes so don't need to import mostly unused library
 */
class StatsMap {
    /**
     *
     * @param ltmap:TileMap|StatsMap map implementing StatsMap interface
     * @param clone:boolean should clone map or just create blank map of same size
     */
    constructor(ltmap, clone=true) {
        this.width = ltmap.width;
        this.height = ltmap.height;
        this._mapData = null;
        this.clearMap();
        if (clone)
            this.cloneMap(ltmap);
    }

    /**
     * clear the map using indicated tile value
     * @param clearValue:number tile value to use for clearing
     */
    clearMap(clearValue=0) {
        this._mapData = [];
        for (let row = 0; row < this.height; ++row) {
            let rowData = [];
            for (let col = 0; col < this.width; ++col)
                rowData.push(clearValue);
            this._mapData.push(rowData);
        }
    }

    /**
     * Copy data in source map to this map
     * @param srcMap:TileMap|StatsMap map to be copied
     */
    cloneMap(srcMap) {
        let w = Math.min(this.width, srcMap.width);
        let h = Math.min(this.height, srcMap.height);
        for (let y = 0; y < h; ++y)
            for (let x = 0; x < w; ++x)
                this._mapData[y][x] = srcMap._mapData[y][x];
    }

    /**
     * retrieve tile from map at indicated coordinate
     * @param x
     * @param y
     * @returns {*}
     */
    getTile(x, y) {
        let xx = Math.abs(x) % this.width;
        let yy = Math.abs(y) % this.height;
        return this._mapData[yy][xx];

    }

    /**
     * Set tile at indicated coordinates to indicated value
     * @param x
     * @param y
     * @param value
     */
    setTile(x, y, value) {
        let xx = Math.abs(x) % this.width;
        let yy = Math.abs(y) % this.height;
        this._mapData[yy][xx] = value;

    }
}

// ========================================================

/**
 * Node for A* type search
 */
class LTAgentNode {
    /**
     * @param parent:LTAgentNode parent of node, null if root node
     */
    constructor(parent) {
        this.parent = parent;
        if (parent == null) {
            this.x = 0;
            this.y = 0;
            this.score = 1000;
            this.state = 0;
        } else {
            this.x = parent.x;
            this.y = parent.y;
            this.score = parent.score;
            this.state = 0;
        }
        this.joiners = null;
    }

    /**
     * convert node to human readable string for debugging
     * @returns {string}
     */
    toString() {
        let s = "(" + this.x + "," + this.y + " state " + this.state + " score " + this.score;
        if (this.joiners != null)
            s = s + " with " + this.joiners.length + " joiners";
        return s;
    }

    /** Add node that joins this node */
    addJoiner(node) {
        if (this.joiners == null)
            this.joiners = [];
        this.joiners.push(node);
    }

    /** Sets coordinates of this node */
    setLocation(x, y) {
        this.x = x;
        this.y = y;
    }

    /** sets the current state of this node
     *
     * @param state
     */
    setState(state) {
        this.state = state;
    }

    /** sets weight value of this node
     *
     * @param score
     */
    setScore(score) {
        this.score = score;
    }
}

// ========================================================
/**
 * Generate programatically (due to large number) of all the states of
 * the game for a normal run and manage the transistion between states
 */
class LTSpeedrunStateManager {
    /**
     *
     * @param jumpHeight:number how high can player jump
     * @param jumpCost:number how expensive is jumping
     * @param backtrackCost: how expensive is backtracking
     */
    constructor(jumpHeight=4, jumpCost = 1, backtrackCost = 1) {
        this.jumpHeight = jumpHeight;
        this.jumpCost = jumpCost;
        this.backtrackCost = backtrackCost;
        this.jumpStart = 2;
        this.jumpAngleStart = this.jumpStart + jumpHeight;
        this.jumpBackStart = this.jumpAngleStart + jumpHeight;
        this.jumpEnd = this.jumpBackStart + jumpHeight;
        this.falling = this.jumpEnd;
        this.fallingForward = this.falling + 1;
        this.fallingBack = this.fallingForward + 1;
    }

    /** is the node provided currently in a jump state
     *
     * @param node:LTAgentNode node to check
     * @param levelMap:StatsMap map to check for bump (not jumping when bumping something)
     * @returns {boolean} true if in jump state
     */
    isNodeJumping(node, levelMap) {
        let tileAbove = levelMap.getTile(node.x, node.y - 1)
        if (tileAbove >= 8)
            return false;
        if ( (node.state >= this.jumpStart) && (node.state < this.jumpEnd) ) {
            let jumpStep = (node.state - this.jumpStart) % this.jumpHeight;
            return jumpStep < (this.jumpHeight-1);

        }
        return false;
    }

    /**
     * Check to see if falling (ends when land on somethign)
     * @param node:LTAgentNode node to check if falling
     * @param levelMap:StatsMap map to check for ground
     * @returns {boolean} true if in falling state
     */
    isNodeFalling(node, levelMap) {
        let tileOn = levelMap.getTile(node.x, node.y + 1)
        if ( (tileOn < 8) || (tileOn === 9)) {
//            console.log(`falling = ${!this.isNodeJumping(node, levelMap)}`)
            return !this.isNodeJumping(node, levelMap);
        }
        return false;
    }

    /**
     * Checks node position to see if valid position on the map
     * @param node:LTAgentNode node to check if valid
     * @param levelMap:StatsMap map to check if in valid tile
     * @returns {boolean} true if can enter tile node is in
     */
    canEnter(node, levelMap) {
        if  (   (node.x < 0) ||
                (node.x >= levelMap.width) ||
                (node.y < 0) ||
                (node.y >= levelMap.height)
            )
            return false;
        let tileIn = levelMap.getTile(node.x, node.y);
        return !((tileIn > 9) || (tileIn === 8));
    }

    /**
     * Checks to see if node is alive or just entered death area or enemy
     * @param node:LTAgentNode node to check if still alive
     * @param levelMap:StatsMap map to check if in none-deadly position
     * @returns {boolean} true if still alive in node location
     */
    isAlive(node, levelMap) {
        let tileIn = levelMap.getTile(node.x, node.y)
        if ((tileIn % 2) === 1) {
            let above = false;
            if (node.parent != null) {
                if (node.y < node.parent.y)
                    above = true;
            }
            return above;
        }
        return node.y < (levelMap.height - 1);
    }

    /**
     * checks to see if node is on tile that forces jump such as landing on
     * an enemy tile
     * @param node:LTAgentNode node to check if forced to jump
     * @param levelMap:StatsMap map to check if in none-deadly position
     * @returns {boolean} true if still alive in node location
     */
    forceJump(node, levelMap) {
        let tileOn = levelMap.getTile(node.x, node.y+1)
        if (tileOn > 7) return false;
        //return (tileOn % 2) === 1;
    }

    /**
     * Generate node from the existing node by applying target location
     * and state then if node is valid, add to path board (which is a backing
     * board and priority queue)
     * @param board:LTPathBoard holds nodes in potential paths
     * @param node:LTAgentNode parent node
     * @param levelMap:StatsMap map being explored
     * @param targetX:number target X coordinate for child
     * @param targetY:number target Y coordinate for child
     * @param targetState: target state for the new node
     */
    generateNode(board, node, levelMap, targetX, targetY, targetState) {
        let child = new LTAgentNode(node);
        child.setLocation(targetX, targetY);
        child.state = targetState;
        let cost = 1;
        if  (
                (targetState === this.jumpStart) ||
                (targetState === this.jumpBackStart) ||
                (targetState === this.jumpAngleStart)
            )
            cost = this.jumpCost;
        if ( (targetState === this.fallingBack) || (targetState === 1) )
            cost = this.backtrackCost;
        child.score -= cost;

        if (this.canEnter(child, levelMap)) {
            if (this.isAlive(node, levelMap)) {
                if (this.forceJump(node, levelMap)) {
                    child.setLocation(targetX, targetY - 1)
                    child.state = this.jumpStart;
                }
                board.addNode(child);
            }
        }
    }

    /** Find all potential children from existing node
     *
     * @param board:LTPathBoard board for tracking nodes in paths
     * @param node:LTAgentNode node to explore
     * @param levelMap:StatsMap map being explored
     */
    generateChildren(board, node, levelMap) {
        if (this.isNodeFalling(node, levelMap)) {
            this.generateNode(board, node, levelMap, node.x - 1, node.y + 1, this.fallingBack);
            this.generateNode(board, node, levelMap, node.x, node.y + 1, this.falling);
            this.generateNode(board, node, levelMap, node.x + 1, node.y + 1, this.fallingForward);
        }
        else if (this.isNodeJumping(node, levelMap)) {
            let jumpStep = ((node.state - this.jumpStart) % this.jumpHeight) + 1
            //console.log(`jumpStep is ${jumpStep}`);
            let nodeY = Math.max(0, node.y - 1);
            this.generateNode(board, node, levelMap, node.x - 1, nodeY, this.jumpBackStart + jumpStep);
            this.generateNode(board, node, levelMap, node.x, nodeY, this.jumpStart + jumpStep);
            this.generateNode(board, node, levelMap, node.x + 1, nodeY, this.jumpAngleStart + jumpStep);
        }
        else {
            this.generateNode(board, node, levelMap, node.x + 1, node.y, 0);
            this.generateNode(board, node, levelMap, node.x - 1, node.y, 1);
            this.generateNode(board, node, levelMap, node.x - 1, node.y - 1, this.jumpBackStart);
            this.generateNode(board, node, levelMap, node.x, node.y - 1, this.jumpStart);
            this.generateNode(board, node, levelMap, node.x + 1, node.y - 1, this.jumpAngleStart);
        }
    }

    getNumStates() { return this.fallingBack+1;}

    /**
     * Get all potiential moved from the current node as an arrow id
     * @param node:LTAgentNode node to find potential moves from
     * @returns {number} id of arrow sprite representing all moves from tile
     */
    getArrowID(node) {
        let aid = 0;
        if (node.state === 0) aid = 4; // forward
        else if (node.state === 1) aid = 64; // back
        else if (node.state < this.jumpAngleStart) aid = 1; // jumping
        else if (node.state < this.jumpBackStart) aid = 2; // jumping at angle
        else if (node.state < this.jumpEnd) aid = 128;   // jumping backwards
        else if (node.state === this.falling) aid = 16;
        else if (node.state === this.fallingForward) aid = 8;
        else if (node.state === this.fallingBack) aid = 32;
        return aid;
    }

    calculateNodeWeight(node, levelMap) {
        return node.score + node.x - levelMap.width;
    }
}

// ************************************************************************

/**
 * Holds all the best moves (from different possible states) on the map and
 * tracks which nodes are still active. When entering a tile only the best
 * node of a given state is stored, but alternatives to that tile are tracked
 * for
 */
class LTPathBoard {
    constructor(ltMap, ltStateManager) {
        this.levelMap = new StatsMap(ltMap);
        this.stateManager = ltStateManager;
        this.bestNodes = []
        for (let st = 0; st < ltStateManager.getNumStates(); ++st) {
            let state = [];
            for (let r = 0; r < ltMap.height; ++r) {
                let row = [];
                for (let c = 0; c < ltMap.width; ++c) {
                    row.push(null);
                }
                state.push(row);
            }
            this.bestNodes.push(state);
        }
        this.queue = [];
    }

    /**
     * debug routine for displaying all items still in the queue
     */
    dumpQueue() {
        for (let i = 0; i < this.queue.length; ++i)
            console.log(this.queue[i].toString());
    }

    /**
     * finds the paths from the indicated start location to end of map
     * @param startX
     * @param startY
     */
    processAllPaths(startX, startY) {
        let rootNode = new LTAgentNode(null);
        rootNode.setLocation(startX, startY)
        this.addNodeToQueue(rootNode);
        while (this.queue.length > 0) {
            let node = this.queue.shift();
            this.stateManager.generateChildren(this, node, this.levelMap);
        }
    }

    /**
     * removes an indicated node from the priority queue (if better node in
     * existing location and state has been found)
     * @param node
     */
    removeFromQueue(node) {
        let indx = this.queue.indexOf(node);
        if (indx >= 0)
            this.queue.splice(indx, 1);
    }

    /**
     * adds a node to the priority queue
     * @param node:LTAgentNode node to be added
     */
    addNodeToQueue(node) {
        let nodeWeight = this.stateManager.calculateNodeWeight(node, this.levelMap);
        let indx = -1;
        for (let i = 0; i < this.queue.length; ++i) {
            let curWeight = this.stateManager.calculateNodeWeight(this.queue[i], this.levelMap);
            if (nodeWeight > curWeight) {
                indx = i;
                break;
            }
        }
        if (indx >= 0)
            this.queue.splice(indx,0,node);
        else
            this.queue.push(node);
    }

    /**
     * Adds a node to the board, making sure it either replaces an existing
     * node at that location or joins a node and removes any displaced
     * node from the priority queue
     * @param node:LTAgentNode node to be added to the queue
     */
    addNode(node) {
        let bestNode = this.bestNodes[node.state][node.y][node.x];
        if (bestNode == null) {
            bestNode = node;
            this.addNodeToQueue(node)
        }
        else if (bestNode.score < node.score) {
            node.addJoiner(bestNode);
            this.removeFromQueue(bestNode);
            bestNode = node;
            this.addNodeToQueue(node)
        } else
            bestNode.addJoiner(node);
        this.bestNodes[node.state][node.y][node.x] = bestNode;
    }

    /** retrieves a list of nodes at the current map location, if any. There
     * can be more than one node as different states for a given location
     * are treated as separate paths
     * @param x
     * @param y
     * @returns {*[]}
     */
    getNodesAtLocation(x, y) {
        let locationNodes = [];
        for (let state = 0; state < this.stateManager.getNumStates(); ++state)
            if (this.bestNodes[state][y][x] != null)
                locationNodes.push(this.bestNodes[state][y][x]);
        return locationNodes;
    }

    /**
     * retrieves a list of nodes in the column indicated
     * @param column
     * @returns {*[]}
     */
    getNodesInColumn(column) {
        let columnNodes = [];
        for (let row = 0; row < this.levelMap.height; ++row)
            for (let state = 0; state < this.stateManager.getNumStates(); ++state)
                if (this.bestNodes[state][row][column] != null)
                    columnNodes.push(this.bestNodes[state][row][column]);
        return columnNodes;
    }

}

// ************************************************************************

/**
 * Types of tile placement constraints that can occur for particular tile types.
 */
TILE_PLACEMENT_CONSTRAINTS = {
    "EMPTY_ABOVE": 1,
    "SOLID_ABOVE": 2,
    "EMPTY_BELOW": 4,
    "ON_SOLID": 8,
    "ABOVE_SOLID": 16,

    "TILES" : [
        0, //     "Empty" : 0,
        2, // "FallingSpike" : 1,
        0, // "Cloud" : 2,
        4+16, // "Owl" : 3,
        0, // "Coin" : 4,
        16, // "Snowball" : 5,
        0,  // "LargeCoin" : 6,
        16, // "MrIceblock" : 7,
        0, // "Ground" : 8,
        1+8, // "GroundSpike" : 9,
        0, // "BreakableBrick" : 10,
        1, // "SlipperyGround" : 11,
        4, // "Coinbox" : 12,
        1+4, // "CollapsingWall" : 13,
        4, // "PowerUp" : 14,
        8 // "Cannon" : 15
    ]
}

/**
 * Types of usage constraints that can occur for particular tile types.
 */
TILE_USAGE_CONSTRAINTS = {
    "REACHABLE" : 1,
    "ABOVE_PATH" : 2,
    "RIGHT_OF_PATH" : 4,
    "RIGHT_OR_LEFT_OF_PATH" : 8,
    "BUMPABLE" : 16,
    "WALKABLE" : 32,

    TILES : [
        0, //     "Empty" : 0,
        2, // "FallingSpike" : 1,
        0, // "Cloud" : 2,
        2, // "Owl" : 3,
        1, // "Coin" : 4,
        8, // "Snowball" : 5,
        1,  // "LargeCoin" : 6,
        8, // "MrIceblock" : 7,
        0, // "Ground" : 8,
        1+8, // "GroundSpike" : 9,
        0, // "BreakableBrick" : 10,
        32, // "SlipperyGround" : 11,
        16, // "Coinbox" : 12,
        32, // "CollapsingWall" : 13,
        16, // "PowerUp" : 14,
        4 // "Cannon" : 15
    ]
}

// ************************************************************************

/**
 * Holds all the different types of metrics that can occur for a map and
 * provides reports of these metrics.
 */
class MapMetrics {
    constructor(levelmap) {
        this.levelmap = new StatsMap(levelmap);
        this.nodeStateManager =  new LTSpeedrunStateManager(4,2,2);
        this.ltPathBoard = new LTPathBoard(levelmap, this.nodeStateManager);
        this.nodeJumpStateManager =  new LTSpeedrunStateManager(4,1,1);
        this.ltJumpPathBoard = new LTPathBoard(levelmap, this.nodeJumpStateManager);
        this.tileCounts = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
        this.findTileCounts();

    }

    findTileCounts() {
        for (let cntr = 0; cntr< 16; ++cntr) {
            this.tileCounts[cntr] = 0;
        }
        this.totalTiles = this.levelmap.width * this.levelmap.height;
        this.invalidTiles = 0;
        for (let y = 0; y < this.levelmap.height; ++y)
            for (let x = 0; x < this.levelmap.width; ++x) {
                let t = this.levelmap.getTile(x,y);
                if ((t < 0) || (t > 15))
                    ++this.invalidTiles;
                else
                    ++this.tileCounts[t];
            }
        this.ltPathBoard.processAllPaths(0,0);
        this.ltJumpPathBoard.processAllPaths(0,0);
    }

    // ***** TILE information statistics *****

    getEmptySpaceCount() {
        return this.tileCounts[LITE_TUX_TILE_IDS.Empty] +
            this.tileCounts[LITE_TUX_TILE_IDS.Cloud];
    }

    getInterestingCount() {
        return this.tileCounts[LITE_TUX_TILE_IDS.FallingSpike] +
            this.tileCounts[LITE_TUX_TILE_IDS.Cloud] +
            this.tileCounts[LITE_TUX_TILE_IDS.GroundSpike] +
            this.tileCounts[LITE_TUX_TILE_IDS.BreakableBrick] +
            this.tileCounts[LITE_TUX_TILE_IDS.SlipperyGround] +
            this.tileCounts[LITE_TUX_TILE_IDS.Coinbox] +
            this.tileCounts[LITE_TUX_TILE_IDS.CollapsingWall] +
            this.tileCounts[LITE_TUX_TILE_IDS.PowerUp] +
            this.tileCounts[LITE_TUX_TILE_IDS.Cannon];
    }

    getEnemiesCount() {
        return this.tileCounts[LITE_TUX_TILE_IDS.Owl] +
        this.tileCounts[LITE_TUX_TILE_IDS.Snowball] +
        this.tileCounts[LITE_TUX_TILE_IDS.MrIceblock] +
        this.tileCounts[LITE_TUX_TILE_IDS.Cannon] ;
    }

    getHazardCount() {
        return this.tileCounts[LITE_TUX_TILE_IDS.FallingSpike] +
        this.tileCounts[LITE_TUX_TILE_IDS.GroundSpike] +
        this.tileCounts[LITE_TUX_TILE_IDS.SlipperyGround] +
        this.tileCounts[LITE_TUX_TILE_IDS.CollapsingWall] ;
    }

    getRewardsCount() {
        return this.tileCounts[LITE_TUX_TILE_IDS.Coin] +
        this.tileCounts[LITE_TUX_TILE_IDS.LargeCoin] +
        this.tileCounts[LITE_TUX_TILE_IDS.Coinbox] +
        this.tileCounts[LITE_TUX_TILE_IDS.PowerUp] ;
    }

    // ***** Difficulty (Leniency) *****

    getBaseLeniency() {
        let gaps = this.getGapCount();
        let hazards = this.getHazardCount();
        let enemies = this.getEnemiesCount();
        let rewards = this.getRewardsCount();
        return gaps + hazards + enemies - rewards;
    }

    getAdjustedLeniency() {
        let gaps = this.getGapCount() * 2;
        let hazards = this.tileCounts[LITE_TUX_TILE_IDS.FallingSpike]  * .5 +
            this.tileCounts[LITE_TUX_TILE_IDS.GroundSpike] * .3 +
            this.tileCounts[LITE_TUX_TILE_IDS.SlipperyGround] * .1 +
            this.tileCounts[LITE_TUX_TILE_IDS.CollapsingWall] * .2;
        let enemies = this.tileCounts[LITE_TUX_TILE_IDS.Owl]  * .6 +
            this.tileCounts[LITE_TUX_TILE_IDS.Snowball] * .5 +
            this.tileCounts[LITE_TUX_TILE_IDS.MrIceblock]  *.75 +
            this.tileCounts[LITE_TUX_TILE_IDS.Cannon] ;

        let rewards = this.tileCounts[LITE_TUX_TILE_IDS.Coin] +
            this.tileCounts[LITE_TUX_TILE_IDS.LargeCoin] * 5 +
            this.tileCounts[LITE_TUX_TILE_IDS.Coinbox] * 5 +
            this.tileCounts[LITE_TUX_TILE_IDS.PowerUp] * 5;
        return gaps + hazards + enemies - rewards;
    }

    getPathLeniency() {
        let endPaths = this.countEndPaths();
        if (endPaths === 0)
            return 0;
        return this.countDeathPaths() / endPaths;
    }

    getCompletable() {
        let lastColumnPaths = this.ltPathBoard.getNodesInColumn(this.levelmap.width-1);
        return lastColumnPaths.length > 0;
    }

    getFurthestReachableColumn() {
        let reachableColumn = this.levelmap.width - 1;
        while ((reachableColumn > 0) &&
            (this.ltPathBoard.getNodesInColumn(reachableColumn).length < 1) )
            --reachableColumn;

        return reachableColumn +1;
    }

    // ***** Structure *****

    getLinearity() {
        let sumX = 0, sumX2 = 0, sumY = 0, sumY2 = 0, sumXY = 0, n = 0;

        for(let y = 0; y < this.levelmap.height; ++y) {
            for (let x = 0; x < this.levelmap.width; ++x) {
                let t = this.levelmap.getTile(x,y);
                if (t >= 8) {
                    sumX += x;
                    sumX2 = sumX2 + x*x;
                    sumY += y;
                    sumY2 = sumY2 + y*y;
                    sumXY = sumXY + x*y;
                    ++n;
                }
            }
        }

        console.log(`sum X = ${sumX}, x^2 = ${sumX2}, sum X = ${sumY}, x^2 = ${sumY2}, xy = ${sumXY}, n=${n} `);
        // y_prediction = b + ax
        let a = 0;
        let b = 0;
        let d = n*sumX2 - sumX*sumX;
        if (d !== 0) {
            a = (sumY * sumX2 - sumX * sumXY) / d;
            b = (n*sumXY - sumX*sumY) / d;
        }
        console.log(`y-pred = ${b} + ${a}x`);

        // r
        let r = 0;
        let ds =(n*sumX2 - sumX*sumX)*(n*sumY2-sumY*sumY);
        if (ds !== 0) {
            r = (n*sumXY - sumX*sumY)/Math.sqrt(ds);
        }
        return r*r;
    }

    getNegativeSpace() {
        console.log("GetNegativeSpace() called");
        let emptyCount = 0;
        let reachableEmpty = 0
        for(let y = 0; y < this.levelmap.height; ++y) {
            for (let x = 0; x < this.levelmap.width; ++x) {
                let t = this.levelmap.getTile(x, y);
                if ((t === LITE_TUX_TILE_IDS.Empty) || (t === LITE_TUX_TILE_IDS.Cloud)) {
                    ++emptyCount;
                    let nodes = this.ltPathBoard.getNodesAtLocation(x,y);
                    if (nodes.length > 0)
                        ++reachableEmpty;
                }
            }
        }
        console.log(`empty count ${emptyCount}, reachable count ${reachableEmpty}`);
        if (emptyCount === 0)
            return 0;
        else
            return reachableEmpty / emptyCount;
    }

    /* Number of overlapping mountains, as we don't have layers we are using number of distinct
    levels per column
     */
    getDensity() {
        let densitySum = 0;
        for (let x = 0; x < this.levelmap.width; ++x) {
            let columnDensity = 0;
            for(let y = 1; y < this.levelmap.height; ++y) {
                let t = this.levelmap.getTile(x,y);
                if (t >= 8) {
                    let tAbove = this.levelmap.getTile(x,y-1);
                    if (tAbove < 8)
                        ++columnDensity;
                }
            }
            //console.log(`Debug: density of column ${x} is ${columnDensity}.`);
            densitySum += columnDensity;
        }

        return densitySum / this.levelmap.width;
    }

    getGapCount() {
        let gapCount = 0;
        let bottom = this.levelmap.height - 1;
        for (let c = 0; c < this.levelmap.width; ++c) {
            let t = this.levelmap.getTile(c,bottom);
            if ( (t === LITE_TUX_TILE_IDS.Empty) || (t === LITE_TUX_TILE_IDS.Cloud) ||
                    (t === LITE_TUX_TILE_IDS.Coin) || (t === LITE_TUX_TILE_IDS.LargeCoin) )
                ++gapCount;
        }
        return gapCount;
    }

    // ***** Movement *****

    countJumpsInBestPath(board) {
        let paths = [];
        let lastCol = this.levelmap.width;
        while ((paths.length < 1) && (lastCol >= 0)) {
            --lastCol;
            paths = board.getNodesInColumn(lastCol);
        }
        if (paths.length <= 0)
            return 0;
        let bestNode = paths[0];
        for (let cntr = 1; cntr < paths.length; ++cntr)
            if (bestNode.score > paths[cntr].score)
                bestNode = paths[cntr];
        let curNode = bestNode;
        let jumpCount = 0;
        while (curNode.parent != null) {
            if  ( (curNode.state === board.stateManager.jumpStart) ||
                (curNode.state === board.stateManager.jumpAngleStart) ||
                (curNode.state === board.stateManager.jumpBackStart) )
                ++jumpCount;
            curNode = curNode.parent;
        }
        return jumpCount;
    }

    getJumps() {
        return this.countJumpsInBestPath(this.ltJumpPathBoard);
    }

    getRequiredJumps() {
        return this.countJumpsInBestPath(this.ltPathBoard);
    }

    checkForJumpingNode(nodes) {
        let jumpedForReward = false
        for (let n = 0; n < nodes.length; ++n)
            if ( (nodes[n].state >= this.nodeStateManager.jumpStart) ||
                (nodes[n].state <= this.nodeStateManager.jumpEnd)) {
                jumpedForReward = true;
                break
            }
        return jumpedForReward;
    }

    getRewardJumps() {
        let rewardJumps = 0;

        for (let x = 0; x < this.levelmap.width; ++x) {
            for (let y = 0; y < (this.levelmap.height - 1); ++y) {
                let t = this.levelmap.getTile(x, y);
                if ((t === LITE_TUX_TILE_IDS.Coin) || (t === LITE_TUX_TILE_IDS.LargeCoin)) {
                    if (this.checkForJumpingNode(this.ltPathBoard.getNodesAtLocation(x, y)))
                        ++rewardJumps;
                } else if (t === LITE_TUX_TILE_IDS.Coinbox) {
                    if (this.checkForJumpingNode(this.ltPathBoard.getNodesAtLocation(x, y+1)))
                        rewardJumps += 5;
                } else if (t === LITE_TUX_TILE_IDS.PowerUp) {
                    if (this.checkForJumpingNode(this.ltPathBoard.getNodesAtLocation(x, y+1)))
                        ++rewardJumps;
                }
            }
        }

        return rewardJumps;
    }

    countNodePaths(node) {
        let count = 1;
        let current=node;
        while(current != null) {
            if (current.joiners != null) {
                for (let i = 0; i < current.joiners.length; ++i)
                    count += current.joiners.length;//this.countNodePaths(current.joiners[i]);
            }
            current = current.parent;
        }
        return count;
    }

    countEndPaths() {
        let endPathCount = 0;
        let endNodes = this.ltPathBoard.getNodesInColumn(this.levelmap.width-1);
        for (let i = 0; i < endNodes.length; ++i) {
            let pathsFromNode = this.countNodePaths(endNodes[i]);
            console.log(`node ${endNodes[i]} has ${pathsFromNode}`);
            endPathCount += pathsFromNode;
        }
        return endPathCount;
    }

    countDeathPaths() {
        // falling to death
        let count = 0;
        let deathRow = this.levelmap.height - 1;
        for(let c = 0; c < this.levelmap.width; ++c) {
            if (this.levelmap.getTile(c, deathRow) < 8) {
                let paths = this.ltPathBoard.getNodesAtLocation(c,deathRow-1);
                for (let i = 0; i < paths.length; ++i)
                    count += this.countNodePaths(paths[i]);
            }
        }
        console.log(`falling deaths ${count}`);

        // running into monsters and hazards
        for(let c = 0; c < this.levelmap.width; ++c) {
            for (let r = 0; r < deathRow; ++r) {
                let tile = this.levelmap.getTile(c,r);
                if ( (LITE_TUX_TILE_IDS.Owl) || (LITE_TUX_TILE_IDS.FallingSpike) ) {
                    if (c > 0)
                        count += this.countNodePaths(c-1, r);
                    if ((c+1) < this.levelmap.width)
                        count += this.countNodePaths(c+1, r);
                    count += this.countNodePaths(c, r+1);
                }
                if ( (LITE_TUX_TILE_IDS.GroundSpike) ) {
                    if (c > 0)
                        count += this.countNodePaths(c-1, r);
                    if ((c+1) < this.levelmap.width)
                        count += this.countNodePaths(c+1, r);
                    if (r > 0)
                        count += this.countNodePaths(c, r-1);
                }
                if ( (LITE_TUX_TILE_IDS.Snowball) || (LITE_TUX_TILE_IDS.MrIceblock) ) {
                    if (c > 0)
                        count += this.countNodePaths(c-1, r);
                    if ((c+1) < this.levelmap.width)
                        count += this.countNodePaths(c+1, r);
                }

            }
        }
        return count;
    }

    countPlacementConstraintViolations() {
        let count = 0;
        for(let c = 0; c < this.levelmap.width; ++c) {
            for (let r = 0; r < this.levelmap.height-1; ++r) {
                let checkTile, tile = this.levelmap.getTile(c, r);
                let constraints = TILE_PLACEMENT_CONSTRAINTS.TILES[tile];
                let meetsConstraints = true;

                if ((constraints & TILE_PLACEMENT_CONSTRAINTS.EMPTY_ABOVE) > 0) {
                    if (r > 0) {
                        checkTile = this.levelmap.getTile(c,r-1);
                        if (checkTile >= 8) {
                            console.log(`${c},${r}  empty above constraint failed`);
                            meetsConstraints = false;
                        }
                    }
                }

                if ((constraints & TILE_PLACEMENT_CONSTRAINTS.SOLID_ABOVE) > 0) {
                    if (r > 0) {
                        checkTile = this.levelmap.getTile(c,r-1);
                        if (checkTile < 8) {
                            console.log(`${c},${r} solid above constraint failed`);
                            meetsConstraints = false;
                        }
                    }
                }

                if ((constraints & TILE_PLACEMENT_CONSTRAINTS.EMPTY_BELOW) > 0) {
                    if (r < (this.levelmap.height-1)) {
                        checkTile = this.levelmap.getTile(c,r+1);
                        if (checkTile >= 8) {
                            console.log(`${c},${r} empty below constraint failed`);
                            meetsConstraints = false;
                        }
                    }
                }

                if ((constraints & TILE_PLACEMENT_CONSTRAINTS.ON_SOLID) > 0) {
                    if (r < (this.levelmap.height-1)) {
                        checkTile = this.levelmap.getTile(c,r+1);
                        if (checkTile < 8) {
                            console.log(`${c},${r} on solid constraint failed`);
                            meetsConstraints = false;
                        }
                    }
                }

                if ((constraints & TILE_PLACEMENT_CONSTRAINTS.ABOVE_SOLID) > 0) {
                    let aboveSolid = false
                    for (let i = r+1; i < this.levelmap.height; ++i) {
                        checkTile = this.levelmap.getTile(c,r+1);
                        if (checkTile >= 8) {
                            aboveSolid = true;
                            break;
                        }
                    }
                    if ( ! aboveSolid) {
                        console.log(`${c},${r} above solid constraint failed`);
                        meetsConstraints = false;
                    }
                }

                if ( ! meetsConstraints)
                    ++count;
            }
        }
        return count;
    }

    countUsageConstraintViolations() {
        let count = 0;
        for(let c = 0; c < this.levelmap.width; ++c) {
            for (let r = 0; r < this.levelmap.height - 1; ++r) {
                let checkPaths, tile = this.levelmap.getTile(c, r);
                let constraints = TILE_USAGE_CONSTRAINTS.TILES[tile];
                let meetsConstraints = true;

                if ((constraints & TILE_USAGE_CONSTRAINTS.REACHABLE) > 0) {
                    checkPaths = this.ltPathBoard.getNodesAtLocation(c,r);
                    if (checkPaths.length === 0) {
                        console.log(`${c}, ${r} reachable constraint not met`);
                        meetsConstraints = false;
                    }
                }

                if ((constraints & TILE_USAGE_CONSTRAINTS.ABOVE_PATH) > 0) {
                    checkPaths = this.ltPathBoard.getNodesInColumn(c);
                    let isAbove = false;
                    for (let i = 0; i < checkPaths.length; ++i) {
                        if (checkPaths[i].y > r) {
                            isAbove = true;
                            break;
                        }
                    }
                    if ( !isAbove) {
                        console.log(`${c}, ${r} above path constraint not met`);
                        meetsConstraints = false;
                    }
                }

                let rightOfPathConstraintMet = true;
                if ((constraints & TILE_USAGE_CONSTRAINTS.RIGHT_OF_PATH) > 0) {
                    if (c < 1) {
                        console.log(`${c}, ${r} right of path constraint not met`);
                        meetsConstraints = false;
                        rightOfPathConstraintMet = false;
                    } else {
                        checkPaths = this.ltPathBoard.getNodesAtLocation(c-1,r);
                        if (checkPaths.length === 0) {
                            console.log(`${c}, ${r} right of path constraint not met`);
                            meetsConstraints = false;
                            rightOfPathConstraintMet = false;
                        }
                    }

                }

                if ((constraints & TILE_USAGE_CONSTRAINTS.RIGHT_OR_LEFT_OF_PATH) > 0) {
                    if ( (c >= (this.levelmap.width - 1)) || (!rightOfPathConstraintMet) ) {
                        console.log(`${c}, ${r} left or right of path constraint not met`);
                        meetsConstraints = false;
                    } else {
                        checkPaths = this.ltPathBoard.getNodesAtLocation(c+1,r);
                        if (checkPaths.length === 0) {
                            console.log(`${c}, ${r} left or right of path constraint not met`);
                            meetsConstraints = false;
                        }
                    }
                }

                if ((constraints & TILE_USAGE_CONSTRAINTS.BUMPABLE) > 0) {
                    if ( r >= (this.levelmap.height - 1) ) {
                        console.log(`${c}, ${r} bumpable constraint not met`);
                        meetsConstraints = false;
                    } else {
                        checkPaths = this.ltPathBoard.getNodesAtLocation(c,r+1);
                        if (checkPaths.length === 0) {
                            console.log(`${c}, ${r} bumpable constraint not met`);
                            meetsConstraints = false;
                        }
                    }
                }

                if ((constraints & TILE_USAGE_CONSTRAINTS.WALKABLE) > 0) {
                    if ( r < 1 ) {
                        console.log(`${c}, ${r} walkable constraint not met`);
                        meetsConstraints = false;
                    } else {
                        checkPaths = this.ltPathBoard.getNodesAtLocation(c,r-1);
                        if (checkPaths.length === 0) {
                            console.log(`${c}, ${r} walkable constraint not met`);
                            meetsConstraints = false;
                        }
                    }
                }

                if ( ! meetsConstraints)
                    ++count;

            }
        }

        return count;
    }

    getCSVHeaderString() {
        return "Map name, groupID, Empty, Interesting, Enemy, Hazards, Rewards, " +
        "Leniency, Adj. Leniency, Path Leniency, Completable, " +
        "Linearity, Negative Space, Density, Gaps, " +
        "Jumps, Required Jumps, Reward Jumps, " +
        "placement constraint violations, usage constraint violations";
    }

    getStatsCSVString(mapName="unknown", groupID=0) {
        let s = mapName + ", " + groupID + ", ";
        // Tile Statistics
        s += this.getEmptySpaceCount() + ", ";
        s += this.getInterestingCount() + ", ";
        s += this.getEnemiesCount() + ", ";
        s += this.getHazardCount() + ", ";
        s += this.getRewardsCount() + ", ";
        // Difficulty
        s += this.getBaseLeniency() + ", ";
        s += this.getAdjustedLeniency() + ", ";
        s += this.getPathLeniency() + ", ";
        s += this.getCompletable() + ", ";
        // structure
        s += this.getLinearity() + ", ";
        s += this.getNegativeSpace() + ", ";
        s += this.getDensity() + ", ";
        s += this.getGapCount() + ", ";
        // motion
        s += this.getJumps() + ", ";
        s += this.getRequiredJumps() + ", ";
        s += this.getRewardJumps() + ", ";
        // contraints
        s += this.countPlacementConstraintViolations() + ", ";
        s += this.countUsageConstraintViolations()+"," + this.getFurthestReachableColumn();

        return s;
    }
}

