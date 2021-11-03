/**
 * Editor information is set up as a config object so that in the future it would be possible to use the editor
 * for different games or different configurations of the same game by simply starting an editor instance with
 * the appropriate configuration. This is still being done so much more work will need to be done before the editor
 * is in a drop-in state (which would be my ultimate goal)
 *
 * Note that this is commented, which is not supported in json files, but could remove comments to allow changing
 * editor configurations through json
 */
EDITOR_CONFIG = {
    "FRAME_TIME" : 1000.0/60.0,
    "MAX_SKIP" : 1000.0/20,

    "TilesetImageFilename"      : "LiteTuxTiles.png",
    "TileSize"                  : 32,
    // default size of the map being created
    "mapWidth"                  : 100,
    "mapHeight"                 : 14,

    "LabelHeight"               : 16,

    // placement of the editor window both virtual size and scaled size
    "viewportX"                 : 4,
    "viewportY"                 : 4,
    "viewportWidth"             : 576,  // 18 * 32
    "viewportHeight"            : 448,  // 14*32
    "editmapX"                  : 4,
    "editmapY"                  : 4,
    "editmapWidth"              : 576,  // 18 * 32
    "editmapHeight"             : 448,  // 14*32
    "editmapTileWidth"          : 18,
    "editmapTileHeight"          : 14,

    // minimap location and scale (real map is size of map + 2 for border)
    "minimapX"                  : 50,
    "minimapY"                  : 500,
    "minimapWidth"              : 408,
    "minimapHeight"             : 64,
    "minimapArrowWidth"         : 50,

    // tile palette
    "TilePaletteX"              : 600,
    "TilePaletteY"              : 25,
    "TilePaletteWidth"          : 320,
    "TilePaletteHeight"         : 80,

    // tools palette
    "ToolsPaletteX"              : 600,
    "ToolsPaletteY"              : 130,
    "ToolsPaletteWidth"          : 320,
    "ToolsPaletteHeight"         : 80,

    //  Suggestions
    "suggestionWidth"           : 18,
    "suggestionHeight"          : 14,
    "suggestionPreviewWidth"    : 0,
    "suggestionRects"           : [
        {"x": 600, "y": 256, "width": 108, "height": 84},
        {"x": 715, "y": 256, "width": 108, "height": 84},
        {"x": 830, "y": 256, "width": 108, "height": 84},
        {"x": 600, "y": 348, "width": 108, "height": 84},
        {"x": 715, "y": 348, "width": 108, "height": 84},
        {"x": 830, "y": 348, "width": 108, "height": 84},
        {"x": 600, "y": 436, "width": 108, "height": 84},
        {"x": 715, "y": 436, "width": 108, "height": 84},
        {"x": 830, "y": 436, "width": 108, "height": 84}
    ],
    "suggestionGenerators"      : [
        "generators/EchoGenerator.js", "generators/bpe_autoencoder.js", "generators/bpe_autoencoder.js",
        "generators/bpe_autoencoder.js", "generators/bpe_autoencoder.js", "generators/bpe_autoencoder.js",
        "generators/evolutionGen.js",  "generators/evolutionGen.js",  "generators/evolutionGen.js"
    ],
    "suggestionGeneratorParams"      : [
        "{}", "{\"noise\":0.01,\"clean\":false}",  "{\"noise\":0.01,\"clean\":true}",
        "{\"noise\":0.02,\"clean\":false}",  "{\"noise\":0.02,\"clean\":true}", "{\"noise\":0.04}",
        "{\"fitness\" : [    {\"name\": \"interest\", \"target\": 1, \"base\" : 1, \"weight\": 1, \"mult\" : 1},\n" +
        "    {\"name\": \"enemies\", \"target\": 1, \"base\" : 1, \"weight\": 1, \"mult\" : 1}," +
        "    {\"name\": \"hazards\", \"target\": 1, \"base\" : 1, \"weight\": 1, \"mult\" : 1}," +
        "    {\"name\": \"rewards\", \"target\": 1, \"base\" : 1, \"weight\": 1, \"mult\" : 1}," +
        "    {\"name\": \"leniency\", \"target\": 1, \"base\" : 1, \"weight\": 1, \"mult\" : 1}," +
        "    {\"name\": \"adjleniency\", \"target\": 1, \"base\" : 1, \"weight\": 1, \"mult\" : 2}," +
        "    {\"name\": \"reachable\", \"target\": 18, \"base\" : 1, \"weight\": 1, \"mult\" : 10}," +
        "    {\"name\": \"reqJumps\", \"target\": 1, \"base\" : 1, \"weight\": 1, \"mult\" : 1}], " +
        "\"mutatorWeights\" : {\n" +
        "    \"basicMutatorWeight\" : 100,\n" +
        "    \"mixedColumnWeight\" : 10,\n" +
        "    \"noisyMixedColumnWeight\" : 5,\n" +
        "    \"noisyMixedColumnNoise\" : .1,\n" +
        "    \"shiftedColumnWeight\" : 10,\n" +
        "    \"shiftedColumnMin\" : -3,\n" +
        "    \"shiftedColumnMax\" : 3,\n" +
        "    \"duplicateColumnWeight\" : 5,\n" +
        "    \"swapColumnWeight\" : 5,\n" +
        "} }",

        "{\"fitness\" : [    {\"name\": \"interest\", \"target\": 1, \"base\" : 1, \"weight\": 0, \"mult\" : 1},\n" +
        "    {\"name\": \"enemies\", \"target\": 1, \"base\" : 1, \"weight\": 1, \"mult\" : 0}," +
        "    {\"name\": \"hazards\", \"target\": 1, \"base\" : 1, \"weight\": 1, \"mult\" : 0}," +
        "    {\"name\": \"rewards\", \"target\": 1, \"base\" : 1, \"weight\": 1, \"mult\" : 0}," +
        "    {\"name\": \"leniency\", \"target\": 1, \"base\" : 1, \"weight\": 1, \"mult\" : 0}," +
        "    {\"name\": \"adjleniency\", \"target\": 20, \"base\" : 30, \"weight\": 1, \"mult\" : 3}," +
        "    {\"name\": \"reachable\", \"target\": 18, \"base\" : 1, \"weight\": 1, \"mult\" : 10}," +
        "    {\"name\": \"reqJumps\", \"target\": 1, \"base\" : 1, \"weight\": 0, \"mult\" : 0}], " +
        "\"mutatorWeights\" : {\n" +
        "    \"basicMutatorWeight\" : 80,\n" +
        "    \"mixedColumnWeight\" : 1,\n" +
        "    \"noisyMixedColumnWeight\" : 25,\n" +
        "    \"noisyMixedColumnNoise\" : .05,\n" +
        "    \"shiftedColumnWeight\" : 5,\n" +
        "    \"shiftedColumnMin\" : -3,\n" +
        "    \"shiftedColumnMax\" : 3,\n" +
        "    \"duplicateColumnWeight\" : 2,\n" +
        "    \"swapColumnWeight\" : 10,\n" +
        "} }",

        "{\"fitness\" : [    {\"name\": \"interest\", \"target\": 1, \"base\" : 1, \"weight\": 0, \"mult\" : 1},\n" +
        "    {\"name\": \"enemies\", \"target\": 2, \"base\" : 3, \"weight\": 1, \"mult\" : 3}," +
        "    {\"name\": \"hazards\", \"target\": 1, \"base\" : 1, \"weight\": 0, \"mult\" : 5}," +
        "    {\"name\": \"rewards\", \"target\": 3, \"base\" : 3, \"weight\": 1, \"mult\" : 0}," +
        "    {\"name\": \"leniency\", \"target\": 1, \"base\" : 1, \"weight\": 0, \"mult\" : 0}," +
        "    {\"name\": \"adjleniency\", \"target\": 20, \"base\" : 20, \"weight\": 1, \"mult\" : 5}," +
        "    {\"name\": \"reachable\", \"target\": 18, \"base\" : 1, \"weight\": 1, \"mult\" : 1}," +
        "    {\"name\": \"reqJumps\", \"target\": 1, \"base\" : 1, \"weight\": 0, \"mult\" : 1}], " +
        "\"mutatorWeights\" : {\n" +
        "    \"basicMutatorWeight\" : 50,\n" +
        "    \"mixedColumnWeight\" : 5,\n" +
        "    \"noisyMixedColumnWeight\" : 5,\n" +
        "    \"noisyMixedColumnNoise\" : .1,\n" +
        "    \"shiftedColumnWeight\" : 15,\n" +
        "    \"shiftedColumnMin\" : -3,\n" +
        "    \"shiftedColumnMax\" : 3,\n" +
        "    \"duplicateColumnWeight\" : 10,\n" +
        "    \"swapColumnWeight\" : 10,\n" +
        "} }"    ],


    // TODO Button Bar

    // analysis
    "exitButtonX"               : 940,
    "exitButtonY"               : 550,
    "exitButtonWidth"           : 120,
    "exitButtonHeight"          : 40,

    "AnalyisMiniX"              : 250,
    "AnalyisMiniY"              : 450,
    "AnalyisMiniWidth"          : 604,
    "AnalyisMiniHeight"         : 32,

    "AnalysisViewportWidth"      : 1072,
    "AnalysisViewportHeight"     : 448,
    "analysisTileStats"          : ["Tile Statistics", "Empty: ", "Interesting: ",
        "Enemy: ", "Hazard: ", "Rewards: "],
    "ANALYSIS_EMPTY_TILES"      : 1,
    "ANALYSIS_INTERESTING_TILES"      : 2,
    "ANALYSIS_ENEMY_TILES"      : 3,
    "ANALYSIS_HAZARD_TILES"      : 4,
    "ANALYSIS_REWARDS_TILES"      : 5,

    "analysisDificulty"      : [ "Difficulty", "Leniency: ", "Adj. Leniency: ", "Path Leniency: ", "Completable: "],
    "ANALYSIS_LENIENCY" : 1,
    "ANALYSIS_ADJ_LENIENCY" : 2,
    "ANALYSIS_PATH_LENIENCY" : 3,
    "ANALYSIS_COMPLETABLE" : 4,

    "analysisStructure"      : [ "Structure", "Linearity: ", "Negative Space: ", "Density: ", "Gaps: "],
    "ANALYSIS_LINEARITY" : 1,
    "ANALYSIS_NEGATIVE_SPACE" : 2,
    "ANALYSIS_DENSITY" : 3,
    "ANALYSIS_GAPS" : 4,

    "analysisMotion"          : ["Motion", "Jumps: ", "Required Jumps: ", "Reward Jumps: "],
    "ANALYSIS_JUMPS" : 1,
    "ANALYSIS_REQUIRED_JUMPS" : 2,
    "ANALYSIS_REWARD_JUMPS" : 3,

    "helpPages"              : {
        "menuTop": 20, "menuLeft" : 820, "menuWidth" : 240, "menuHeight" : 40, "menuGap" : 10,
        "commands" : ["Introduction", "Overview of Editor", "Tiles in the game",
            "Tools for editing", "Recommendations", "Side Menu", "Analysis" , "", "Return to Editor"],
        "images" : [ "res/help/Intro.png", "res/help/overview.png", "res/help/tiles.png",
            "res/help/tools.png", "res/help/recommendations.png", "res/help/side.png", "res/help/analysis.png"]
    },

    "userID" : 0,
    "session" : 0,
    "mapId" : 0,
    "showInstructions" : false
}

LITE_TUX_SCREEN_IDS = {
    "TITLE" : 0,
    "INSTRUCTIONS" : 1,
    "GAME" : 2
}

LITE_TUX_SOUND_IDS = {
    "CANNON" : 0,
    "COIN" : 1,
    "DEATH" : 2,
    "GEM" : 3,
    "JUMP" : 4,
    "STOMP" : 5,
    "NUM_SOUNDS" : 6
}

LITE_TUX_TILE_IDS = {
    "Empty" : 0,
    "FallingSpike" : 1,
    "Cloud" : 2,
    "Owl" : 3,
    "Coin" : 4,
    "Snowball" : 5,
    "LargeCoin" : 6,
    "MrIceblock" : 7,
    "Ground" : 8,
    "GroundSpike" : 9,
    "BreakableBrick" : 10,
    "SlipperyGround" : 11,
    "Coinbox" : 12,
    "CollapsingWall" : 13,
    "PowerUp" : 14,
    "Cannon" : 15
}