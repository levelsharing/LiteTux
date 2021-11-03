importScripts("../LiteTuxEditorConfig.js");
importScripts("../stats/stats.js");
importScripts("genetic/EvolutionProto.js");
importScripts("../../../userMaps.js");

/** set up defaults for fitness functions */
FITNESS_FUNCTION_DEFAULTS = [
    {"name": "interest", "target": 1, "base" : 1, "weight": 1, "mult" : 1},
    {"name": "enemies", "target": 1, "base" : 1, "weight": 1, "mult" : 1},
    {"name": "hazards", "target": 1, "base" : 1, "weight": 1, "mult" : 1},
    {"name": "rewards", "target": 1, "base" : 1, "weight": 1, "mult" : 1},
    {"name": "leniency", "target": 1, "base" : 1, "weight": 1, "mult" : 1},
    {"name": "adjleniency", "target": 1, "base" : 1, "weight": 1, "mult" : 2},
    {"name": "reachable", "target": 18, "base" : 1, "weight": 1, "mult" : 10},
    {"name": "reqJumps", "target": 1, "base" : 1, "weight": 1, "mult" : 1}
];

/** set up mutation handling (frequency of mutation and which types) */
DEFAULT_MUTATOR_WEIGHTS = {
    "basicMutatorWeight" : 100,
    "mixedColumnWeight" : 10,
    "noisyMixedColumnWeight" : 5,
    "noisyMixedColumnNoise" : .1,
    "shiftedColumnWeight" : 10,
    "shiftedColumnMin" : -3,
    "shiftedColumnMax" : 3,
    "duplicateColumnWeight" : 5,
    "swapColumnWeight" : 5,

};

/**
 * WebWorker handler gets sent a tile map with a params field containing options
 * with these consisting of the different fitness function parameters and the
 * different mutators.
 *
 * @param event
 * @returns {Promise<void>}
 */
onmessage = function(e) {
    console.log('Worker: Message received from main script ' + e.data);
    let tilemap = JSON.parse(e.data);
    if (typeof tilemap.width === 'undefined') {
        postMessage('{}');
    } else {
        let evolution = new EvolutionGenerator();
        let params = tilemap.params;
        if (tilemap.params == null)
            params = {};
        let fitness = params.fitness;
        if (fitness == null)
            fitness = FITNESS_FUNCTION_DEFAULTS;
        for (let i = 0; i < fitness.length; ++i)
            evolution.setFinessParameter(fitness[i].name, fitness[i].target,
                fitness[i].base, fitness[i].weight, fitness[i].mult);

        let mutatorWeights = params.mutatorWeights;
        if (mutatorWeights == null)
            mutatorWeights = DEFAULT_MUTATOR_WEIGHTS;
        evolution.clearMutators();
        let basicMutatorWeight = mutatorWeights.basicMutatorWeight;
        if (basicMutatorWeight == null)
            basicMutatorWeight = DEFAULT_MUTATOR_WEIGHTS.basicMutatorWeight;
        evolution.addMutator(new BasicMutator(basicMutatorWeight));

        let mixedColumnWeight = mutatorWeights.mixedColumnWeight;
        if (mixedColumnWeight == null)
            mixedColumnWeight = DEFAULT_MUTATOR_WEIGHTS.mixedColumnWeight;
        evolution.addMutator(new NoisyTileMutator(mixedColumnWeight, 0));

        let noisyMixedColumnWeight = mutatorWeights.noisyMixedColumnWeight;
        if (noisyMixedColumnWeight == null)
            noisyMixedColumnWeight = DEFAULT_MUTATOR_WEIGHTS.noisyMixedColumnWeight;
        let noisyMixedColumnNoise = mutatorWeights.noisyMixedColumnNoise;
        if (noisyMixedColumnNoise == null)
            noisyMixedColumnNoise = DEFAULT_MUTATOR_WEIGHTS.noisyMixedColumnNoise;
        evolution.addMutator(new NoisyTileMutator(noisyMixedColumnWeight, noisyMixedColumnNoise));

        let shiftedColumnWeight = mutatorWeights.shiftedColumnWeight;
        if (shiftedColumnWeight == null)
            shiftedColumnWeight = DEFAULT_MUTATOR_WEIGHTS.shiftedColumnWeight;
        let shiftedColumnMin = mutatorWeights.shiftedColumnMin;
        if (shiftedColumnMin == null)
            shiftedColumnMin = DEFAULT_MUTATOR_WEIGHTS.shiftedColumnMin;
        let shiftedColumnMax = mutatorWeights.shiftedColumnMax;
        if (shiftedColumnMax == null)
            shiftedColumnMax = DEFAULT_MUTATOR_WEIGHTS.shiftedColumnMax;
        evolution.addMutator(new ColumnShiftMutator(shiftedColumnWeight, shiftedColumnMin, shiftedColumnMax));

        let duplicateColumnWeight = mutatorWeights.duplicateColumnWeight;
        if (duplicateColumnWeight == null)
            duplicateColumnWeight = DEFAULT_MUTATOR_WEIGHTS.duplicateColumnWeight;
        evolution.addMutator(new DuplicateColumnMutator(duplicateColumnWeight));

        let swapColumnWeight = mutatorWeights.swapColumnWeight;
        if (swapColumnWeight == null)
            swapColumnWeight = DEFAULT_MUTATOR_WEIGHTS.swapColumnWeight;
        evolution.addMutator(new SwapColumnsMutator(swapColumnWeight));

        let map1 = new StatsMap(tilemap);
        let gen = new ProbableTileGenerator(USER_MAPS);
        let map2 = gen.generateRandomMap(tilemap.width, tilemap.height);
        let pool = evolution.makePoolFromSingleMap(map1, 100, 5);

        for (let generation = 0; generation < 4; ++generation) {
            pool = evolution.breedPool(pool, 100, 5)
        }
        let mapMetrics = new MapMetrics(tilemap);
        tilemap.stattest = mapMetrics.getAdjustedLeniency();
        //console.log("Returning message " + JSON.stringify(pool.pool[0]));
        postMessage(JSON.stringify(pool.pool[0]));
    }
};
