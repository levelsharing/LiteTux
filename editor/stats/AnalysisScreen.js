/** This is part of the LiteTux release and is available under the MIT license
 * This was created by Billy D. Spelchan as part of their research at UBC
 * (Okanagan campus) and consists of the analysis screen
 */


// ************************************************************************

/**
 * An analysis screen displaying the map with all paths and the current
 * metrics and statistics for the map.
 */
class AnalysisScreen extends SLLLayer {
    /**
     *
     * @param bounds:SLLRectangle bounds for screen
     * @param owner:{} class containing swapDisplay's method
     * @param config:{} JSON configuration file for editor
     */
    constructor(bounds, owner, config=EDITOR_CONFIG) {
        super("tiledit", bounds.width,bounds.height);
        this.owner = owner;
        this.config = config;

        console.log(EDITOR_CONFIG);
        console.log(config);
        this.mainMap = new TileMap(config.mapWidth, config.mapHeight);

        this.tileImageRenderer = new TileImageRenderer(TILESET_TILES_IMG, new SLLRectangle(0,0,32,32), 1, 16);
        this.view = new TileMapLayer("x", config.AnalysisViewportWidth, 448/*config.AnalysisViewportHeight*/, this.mainMap, this.tileImageRenderer);
        this.addChild(this.view);

        this.nodeStateManager =  new LTSpeedrunStateManager(4,2,2);

        this.arrowMap = new TileMap(config.mapWidth, config.mapHeight);

        this.arrowImageRenderer = new TileImageRenderer(ARROWS_IMG, new SLLRectangle(0,0,32,32), 16,16)
        this.arrowView = new TileMapLayer("nodeArrows", config.AnalysisViewportWidth, config.AnalysisViewportHeight, this.arrowMap, this.arrowImageRenderer);
        this.addChild(this.arrowView)

        this.nodes = [];
        this.minimap = new MiniMapAndNodesSelector("mininode", this.mainMap, this.nodes, this);
        this.minimap.adjustPosition(new SLLRectangle(config.AnalyisMiniX,config.AnalyisMiniY,config.AnalyisMiniWidth,config.AnalyisMiniHeight));
        this.addChild(this.minimap);

        // button menu
        this.exitButton = new SLLTextButton("Exit", new SLLRectangle(
            config.exitButtonX, config.exitButtonY, config.exitButtonWidth, config.exitButtonHeight),
            "Exit");
        this.exitButton.setClickHandler(this);
        this.exitButton.moveTo(config.exitButtonX, config.exitButtonY);
        this.addChild(this.exitButton);

        this.tileStats = buildTextColumn(this, config.analysisTileStats, 10,500,250,18);
        this.difficultyStats = buildTextColumn(this, config.analysisDificulty, 270,500,250,20);
        this.structureStats = buildTextColumn(this, config.analysisStructure, 530,500,250,20);
        this.motionStats = buildTextColumn(this, config.analysisMotion, 740,500,250,20);
    }

    /**
     * Updates the indicated column message text for showing the stats on the screen
     * @param column:SLLTextLayer[] Column of stat text
     * @param columnLabels:string Label to use for the column
     * @param index:number index in the column
     * @param count: current count for the column
     * @param showPercent:boolean true if should be shown as a percent
     */
    updateColumnEntry(column, columnLabels, index, count, showPercent=false) {
        if (isFinite(count))
            count = Math.round(count * 10000) / 10000;
        let s = columnLabels[index] + count;
        if (showPercent) {
            let pct = Math.floor(count / this.mapMetrics.totalTiles * 1000000) / 10000;
            s = s + " (" + pct + "%)";
        }
        column[index].setText(s);
    }

    /**
     * Sets the level to be tested and runs the tests on the level
     * @param levelMap:TileMap map to be processed
     */
    setLevelMap(levelMap) {
        this.mainMap.pasteClip(levelMap,0,0);
        this.mainMap.mapChanged = true;
        this.ltPathBoard = new LTPathBoard(this.mainMap, this.nodeStateManager);
        this.ltPathBoard.processAllPaths(0,0);
        this.nodes = [];
        // populate with nodes
        for (let c = 0; c < this.mainMap.width; ++c) {
            let columnNodes = this.ltPathBoard.getNodesInColumn(c);
            for (let n = 0; n < columnNodes.length; ++n )
                this.nodes.push(columnNodes[n]);
        }
        console.log("Number of nodes is " + this.nodes.length);
        this.minimap.refreshNodes(this.nodes);
        // arrow setup
        this.arrowMap.clearMap(0);
        for(let n = 0; n < this.nodes.length; ++n) {
            let node = this.nodes[n];
            let parent = node.parent;
            if (parent == null)
                parent = node;
            let arrows = this.arrowMap.getTile(parent.x, parent.y);
            arrows |= this.nodeStateManager.getArrowID(node);
           this.arrowMap.setTile(parent.x, parent.y, arrows);
        }

        // TILE Statistics updated
        this.mapMetrics = new MapMetrics(this.mainMap);

        this.updateColumnEntry(this.tileStats, this.config.analysisTileStats, this.config.ANALYSIS_EMPTY_TILES,
            this.mapMetrics.getEmptySpaceCount(), true);
        this.updateColumnEntry(this.tileStats, this.config.analysisTileStats, this.config.ANALYSIS_INTERESTING_TILES,
            this.mapMetrics.getInterestingCount(), true);
        this.updateColumnEntry(this.tileStats, this.config.analysisTileStats, this.config.ANALYSIS_ENEMY_TILES,
            this.mapMetrics.getEnemiesCount(), true);
        this.updateColumnEntry(this.tileStats, this.config.analysisTileStats, this.config.ANALYSIS_HAZARD_TILES,
            this.mapMetrics.getHazardCount(), true);
        this.updateColumnEntry(this.tileStats, this.config.analysisTileStats, this.config.ANALYSIS_REWARDS_TILES,
            this.mapMetrics.getRewardsCount(), true);

        // Leniency statistics updated
        this.updateColumnEntry(this.difficultyStats, this.config.analysisDificulty, this.config.ANALYSIS_LENIENCY,
            this.mapMetrics.getBaseLeniency());
        this.updateColumnEntry(this.difficultyStats, this.config.analysisDificulty, this.config.ANALYSIS_ADJ_LENIENCY,
            this.mapMetrics.getAdjustedLeniency());
        this.updateColumnEntry(this.difficultyStats, this.config.analysisDificulty, this.config.ANALYSIS_PATH_LENIENCY,
            this.mapMetrics.getPathLeniency());
        this.updateColumnEntry(this.difficultyStats, this.config.analysisDificulty, this.config.ANALYSIS_COMPLETABLE,
            this.mapMetrics.getCompletable());

        // Structure statistics updated
        this.updateColumnEntry(this.structureStats, this.config.analysisStructure, this.config.ANALYSIS_LINEARITY,
            this.mapMetrics.getLinearity());
        this.updateColumnEntry(this.structureStats, this.config.analysisStructure, this.config.ANALYSIS_NEGATIVE_SPACE,
            this.mapMetrics.getNegativeSpace());
        this.updateColumnEntry(this.structureStats, this.config.analysisStructure, this.config.ANALYSIS_DENSITY,
            this.mapMetrics.getDensity());
        this.updateColumnEntry(this.structureStats, this.config.analysisStructure, this.config.ANALYSIS_GAPS,
            this.mapMetrics.getGapCount());

        // Movement statistics updated
        this.updateColumnEntry(this.motionStats, this.config.analysisMotion, this.config.ANALYSIS_JUMPS,
            this.mapMetrics.getJumps());
        this.updateColumnEntry(this.motionStats, this.config.analysisMotion, this.config.ANALYSIS_REQUIRED_JUMPS,
            this.mapMetrics.getRequiredJumps());
        this.updateColumnEntry(this.motionStats, this.config.analysisMotion, this.config.ANALYSIS_REWARD_JUMPS,
            this.mapMetrics.getRewardJumps());

        console.log("New map should be ready");
    }

    // *** Event Handlers ***

    /**
     * Hendle the exit button being clicked by calling swapDisplays to the root display.
     * @param btn:SLLTextButton button that was clicked
     */
    buttonClicked(btn) {
        if (btn.id === "Exit") {
            this.owner.swapDisplays(0);
        } else {
            console.log(`unknown button id provided: ${btn.id}`);
        }
    }

    /**
     * Update the map to show the currently selected portion of the map
     * @param targetX:number selected portion of the map.
     */
    mapPositionChanged(targetX) {
        this.view.viewport.x = targetX * 32;
        this.arrowView.viewport.x = targetX * 32;
        this.mainMap.mapChanged = true;
        this.arrowMap.mapChanged = true;
    }
}
