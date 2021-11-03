/**
 * Base class for mutations. The default is normal picking of column
 * from two tile maps. Weights are a number that should reflect how often
 * the mutation should occur, with the actual chance being the portion
 * of this mutations weight compared to the total weight of all mutations
 * being used.
 */
class BasicMutator {
    /**
     * @param weight how often this mutator should be selected
     */
    constructor(weight) {
        this.weight = Math.ceil(weight);
    }

    /**
     * generate column by picking between column in one of two maps.
     *
     * @param x column in the map to be generated
     * @param map1 source map 1
     * @param map2 source map 2
     * @param childMap map being generated
     */
    generateColumn(x, map1, map2, childMap) {
        if (Math.random() < .5)
            for (let y = 0; y < map1.height; ++y)
                childMap.setTile(x, y, map1.getTile(x, y));
        else
            for (let y = 0; y < map1.height; ++y)
                childMap.setTile(x, y, map2.getTile(x, y));
    }
}

// --------------------------------------------------------------------------

/**
 * Mutotor where each tile in the column is randomly selected from both
 * parents and has a chance of changing based on the mutation rate.
 */
class NoisyTileMutator extends BasicMutator {
    /**
     * @param weight how often this mutator should be selected
     * @param tileMutationRate chance a tile will be random
     */
    constructor(weight, tileMutationRate) {
        super(weight);
        this.tileMutationRate = tileMutationRate
    }

    /**
     * Pick tile from both maps then randomly set one of the bits in
     * that tile to 1
     * @param x x coordinate of map tile to be generated
     * @param y y coordinate of map tile to be generated
     * @param parent1tile tile from first parent to be mutated
     * @param parent2tile tile from second parent to be mutated
     * @returns {number}
     */
    generateTile(x, y, parent1tile, parent2tile) {
        let base = Math.random < .5 ? parent1tile : parent2tile;
        let mutate  = 1 << Math.floor(Math.random()*4)
        return (base ^ mutate);
    }

    /**
     * generate column by picking between tiles from each parent or
     * by generating random tile based on current mutation rate.
     *
     * @param x column in the map to be generated
     * @param map1 source map 1
     * @param map2 source map 2
     * @param childMap map being generated
     */
    generateColumn(x, map1, map2, childMap) {
        let t = 0;
        for (let y = 0; y < map1.height; ++y) {
            let p1 = map1.getTile(x, y);
            let p2 = map2.getTile(x, y);
            if (Math.random() < this.tileMutationRate)
                t = this.generateTile(x, y, p1, p2);
            else if (Math.random() < .5)
                t = p1;
            else
                t = p2;
            childMap.setTile(x, y, t);
        }

    }
}

// --------------------------------------------------------------------------

/**
 * generate column by picking between column in one of two maps and
 * vertically shifting that column randomly by allowed shift range.
 */
class ColumnShiftMutator extends BasicMutator{
    /**
     * @param weight how often this mutator should be selected
     * @param minShift minimum amount for shift (-3 works well)
     * @param maxShift maximum amount for shift
     */
    constructor(weight, minShift, maxShift) {
        super(weight);
        this.minShift = Math.floor(minShift);
        this.maxShift = Math.ceil(maxShift);
    }

    /**
     * generate column by picking between column in one of two maps and
     * vertically shifting that column randomly by allowed shift range.
     *
     * @param x column in the map to be generated
     * @param map1 source map 1
     * @param map2 source map 2
     * @param childMap map being generated
     */
    generateColumn(x, map1, map2, childMap) {
        let range = this.maxShift - this.minShift + 1;
        let shift = Math.floor(Math.random() * range) + this.minShift;
        let map = Math.random() < .5 ? map1 : map2;
        if (shift < 0) {
            for (let y = 0; y < -shift; ++y)
                childMap.setTile(x, y, map.getTile(x, 0));
            for (let y = -shift; y < map.height; ++y)
                childMap.setTile(x, y, map.getTile(x, y+shift));
        } else {
            for (let y = 0; y < map.height-shift; ++y)
                childMap.setTile(x, y, map.getTile(x, y+shift));
            for (let y = map.height-shift; y < map.height; ++y)
                childMap.setTile(x, y, map.getTile(x, map.height-1));
        }
    }
}

// --------------------------------------------------------------------------

/**
 * generate column by duplicating the previous column of the level
 */
class DuplicateColumnMutator extends BasicMutator{
    /**
     * @param weight how often this mutator should be selected
     */
    constructor(weight) {
        super(weight);
    }

    /**
     * generate column by duplicating the previous column of the level
     *
     * @param x column in the map to be generated
     * @param map1 source map 1 - not used but part of API
     * @param map2 source map 2 - not used but part of API
     * @param childMap map being generated
     */
    generateColumn(x, map1, map2, childMap) {
        if (x === 0) {
            return super.generateColumn(x, map1, map2, childMap);
        }
        let previousX = Math.max(0, x-1);
        for (let y = 0; y < map1.height; ++y)
            childMap.setTile(x, y, childMap.getTile(previousX, y));
    }
}

// --------------------------------------------------------------------------

/**
 * generate column by picking between column in one of two maps and
 * then swapping that column with the previous column in the map
 */
class SwapColumnsMutator extends BasicMutator{
    /**
     * @param weight how often this mutator should be selected
     */
    constructor(weight) {
        super(weight);
    }

    /**
     * generate column by picking between column in one of two maps and
     * then swapping that column with the previous column in the map
     *
     * @param x column in the map to be generated
     * @param map1 source map 1
     * @param map2 source map 2
     * @param childMap map being generated
     */
    generateColumn(x, map1, map2, childMap) {
        super.generateColumn(x, map1, map2, childMap);
        if (x === 0) return

        let previousX = Math.max(0, x-1);
        for (let y = 0; y < map1.height; ++y) {
            let temp = childMap.getTile(x, y)
            childMap.setTile(x, y, childMap.getTile(previousX, y));
            childMap.setTile(previousX, y, temp);
        }
    }
}

// --------------------------------------------------------------------------

/** Holds the metrics used for calculating the fitness of a map. Each of the
 * metrics for the map is found and the value of that function is determined
 * based on how far the metric is from the target value. We start the value
 * at the base weight and the distance from the target value is multiplied
 * by the reduction rate multiplier to find the base value which then gets
 * multiplied by the multiplier.
 *
 * example:
 * sample metric has a target of 100, base weight of 50, reduction rate of 2
 * and multiplier of 2.
 * if the metric resulted in 80 then
 *      (50 - floor(100-80) * 2 ) * 2 = (50 - 60) * 2 = 20.
 * if the metric resulted in 70 then
 *      (50 - floor(100-70) * 2 ) * 2 = (50 - 60) * 2 = -20.
 */
class MetricWeigher {
    /**
     * @param target:number desired target for the metric when ran on map
     * @param baseWeight:number how much to give if target is met
     * @param reductionRate:number how much to reduce value per step from target
     * @param overallWeightMultiplier:number how important this metric is to overall fitness
     */
    constructor(target, baseWeight, reductionRate, overallWeightMultiplier) {
        this.adjustTarget(target, baseWeight, reductionRate, overallWeightMultiplier);
    }

    /**
     * adjust the targets for this metric
     * @param target:number desired target for the metric when ran on map
     * @param baseWeight:number how much to give if target is met
     * @param reductionRate:number how much to reduce value per step from target
     * @param overallWeightMultiplier:number how important this metric is to overall fitness
     */
    adjustTarget(target, baseWeight, reductionRate, overallWeightMultiplier) {
        this.target = target;
        this.baseWeight = baseWeight;
        this.reductionRate = reductionRate;
        this.overallWeightMultiplier = overallWeightMultiplier;
    }

    /**
     * Given a metric result, figure out the value that the metric adds (or reduces)
     * the fitness of a given map.
     *
     * @param value:number metric result to find fitness value adjustment for
     * @returns {number} how much metric adds/reduces fitness of the map
     */
    evaluateMetric(value) {
        let score = this.baseWeight - Math.abs(value - this.target) * this.reductionRate;
        return score * this.overallWeightMultiplier;
    }
}

// --------------------------------------------------------------------------

/**
 * Calculate per row tile probabilities and generate tile based on how often
 * that tile is used in a particular row of the map.
 */
class ProbableTileGenerator {
    /**
     * @param list array of levels to be processed.
     */
    constructor(list) {
        this.tileCountsPerRow = [];
        this.tilesInRow = [];
        for (let i = 0; i < list.length; ++i) {
            this.addLevelInformation(list[i]);
        }
    }

    /**
     * Processes a provided level to collect tile frequency information
     * @param level tile map to be processed
     */
    addLevelInformation(level) {
        while (level.height > this.tileCountsPerRow.length) {
            let row = [];
            for (let t = 0; t < 16; ++t)
                row.push(1);
            this.tileCountsPerRow.push(row);
            this.tilesInRow.push(16);
        }

        for (let y = 0; y < level.height; ++y) {
            let rowTileCount = 0;
            for (let x = 0; x < level.width; ++x) {
                let tid = level._mapData[y][x];
                if ((tid >= 0) && (tid <= 15)) {
                    ++rowTileCount;
                    ++this.tileCountsPerRow[y][tid];
                }
            }
            this.tilesInRow[y] += rowTileCount;
        }
    }

    /**
     * generates a tile without row information by randomly picking a row
     * and then using that row's frequency information
     * @returns {number}
     */
    generateRandomTile() {
        let y = Math.floor(Math.random() * this.tilesInRow.length);
        return this.generateRandomTileForRow(y);
    }

    /**
     * Generate random tile based on tile frequency for row
     * @param row row to generate tile for
     * @returns {number}
     */
    generateRandomTileForRow(row) {
        let pickWeight = Math.random() * this.tilesInRow[row];
        let tid = 0;
        while (pickWeight > this.tileCountsPerRow[row][tid]) {
            pickWeight -= this.tileCountsPerRow[row][tid];
            ++tid;
        }
        return tid;
    }

    /**
     * Generates a random column for a map
     *
     * @param map map to place column in
     * @param column:number column to be generated
     */
    generateRandomColumnInMap(map, column) {
        for (let y = 0; y < map.height; ++y) {
            map.setTile(column, y, this.generateRandomTileForRow(y));
        }

    }

    /**
     * Generate a random map of given dimensions.
     *
     * @param width width of map to generate
     * @param height height of map to generate
     * @returns {StatsMap}
     */
    generateRandomMap(width, height) {
        let randomMap = new StatsMap({"width": width, "height":height}, false)
        for (let x = 0; x < width; ++x) {
            this.generateRandomColumnInMap(randomMap, x);
        }
        return randomMap;
    }

    /**
     * return information about the tile frequency
     */
    debugDump() {
        console.log(`tileCounts = ${this.tileCountsPerRow} weights ${this.tilesInRow}`);
    }
}

// --------------------------------------------------------------------------



// --------------------------------------------------------------------------

/**
 * calculate the fitness of a map
 */
class FitnessCalculator {
    constructor() {
        this.weights = {};
    }

    /**
     * calculate the fitness of a map
     *
     * @param map map to find fitness for
     * @returns {number} how fit this map is
     */
    calculate(map) {
        let metrics = new MapMetrics(map);
        let score = this.weights["interest"].evaluateMetric(metrics.getInterestingCount());
        score += this.weights["enemies"].evaluateMetric(metrics.getEnemiesCount());
        score += this.weights["hazards"].evaluateMetric(metrics.getHazardCount());
        score += this.weights["rewards"].evaluateMetric(metrics.getRewardsCount());
        score += this.weights["leniency"].evaluateMetric(metrics.getBaseLeniency());
        score += this.weights["adjleniency"].evaluateMetric(metrics.getAdjustedLeniency());
        score += this.weights["reachable"].evaluateMetric(metrics.getFurthestReachableColumn());
        score += this.weights["reqJumps"].evaluateMetric(metrics.getRequiredJumps());

        return score;
    }

    /**
     * Sets the parameters for a fitness function metric
     *
     * @param prefix label for fitness method
     * @param target:number desired target for the metric when ran on map
     * @param base:number how much to give if target is met
     * @param weight:number how much to reduce value per step from target
     * @param mult:number how important this metric is to overall fitness
     */
    setFitnessParameter(prefix, target, base, weight, mult) {
        if (this.weights[prefix] == null)
            this.weights[prefix] =  new MetricWeigher(target, base, weight, mult);
        else
            this.weights[prefix].adjustTarget(target, base, weight, mult);
    }
}

// --------------------------------------------------------------------------

/**
 * holds the maps that were bread
 */
class BreedingPool {
    /**
     * @param poolSize:number how many top n in pool
     */
    constructor(poolSize) {
        this.pool = [];
        this.maxPoolSize = poolSize;
    }

    /**
     * add a map to the pool, if pool full then will see if map better than
     *  weakest member of pool and replace that member if so.
     * @param map map to potentially add to the pool
     */
    addChild(map) {
        let temp = map;
        for (let i = 0; i < this.pool.length; ++i) {
            if (this.pool[i].fitness < map.fitness) {
                temp = this.pool[i];
                this.pool[i] = map;
                map = temp;
            }
        }
        if (this.pool.length < this.maxPoolSize)
            this.pool.push(map);
    }

    /**
     * randomly pick member of the pool
     *
     * @returns {*}
     */
    pickRandomChild() {
        let i = Math.floor(Math.random()*this.pool.length)
        return this.pool[i];
    }
}

// --------------------------------------------------------------------------

/**
 * generate maps using genetic algorithm
 */
class EvolutionGenerator {
    /**
     * @param mutationRate - no longer used
     * @param mutator
     */
    constructor(mutationRate = 0.1, mutator = null) {
        this.mutationRate = mutationRate;
        this.mutators = [];
        this.totalMutationWeight = 0;
        this.fitness = new FitnessCalculator();
    }

    /**
     * remove the mutators from the generator
     */
    clearMutators() {
        this.mutators = [];
        this.totalMutationWeight = 0;
    }

    /** add mutator to the generator
     *
     * @param mutator see mutators above
     */
    addMutator(mutator) {
        this.mutators.push(mutator);
        this.totalMutationWeight += mutator.weight
    }

    /**
     * Breed a pair pf maps, producing a new map
     * @param map1
     * @param map2
     * @returns {StatsMap}
     */
    breed(map1, map2) {
        if (this.mutators.length === 0)
            this.addMutator(new BasicMutator(100));
        let childMap = new StatsMap({"width":map1.width, "height": map1.height}, false);

        for (let x = 0; x < map1.width; ++x) {
            let mutatorWeight = Math.floor(Math.random() * this.totalMutationWeight);
            let mutatorIndex = 0;
            while (mutatorWeight > this.mutators[mutatorIndex].weight) {
                mutatorWeight -= this.mutators[mutatorIndex].weight;
                ++mutatorIndex;
            }
            this.mutators[mutatorIndex].generateColumn(x, map1, map2, childMap);
         }

        return childMap;
    }

    /**
     * Find how fit a map is
     *
     * @param map
     * @returns {number}
     */
    getMapFitness(map) {
        return this.fitness.calculate(map);
    }

    /**
     * add a fitness parameter to the list of evaluation parameters
     * @param prefix label for fitness method
     * @param target:number desired target for the metric when ran on map
     * @param base:number how much to give if target is met
     * @param weight:number how much to reduce value per step from target
     * @param mult:number how important this metric is to overall fitness
     */
    setFinessParameter(prefix, target, base, weight, mult) {
        this.fitness.setFitnessParameter(prefix, target, base, weight, mult);
    }

    /**
     * Breed a map using a single map (acts as both sides)
     * @param map
     * @param children
     * @param best
     * @returns {BreedingPool}
     */
    makePoolFromSingleMap(map, children, best) {
        let pool = new BreedingPool(best)
        for (let i = 0; i < children; ++i) {
            let child = this.breed(map, map);
            child.fitness = this.getMapFitness(child);
            console.log(`debug: created child with fitness ${child.fitness}`);
            pool.addChild(child);
        }
        return pool;
    }

    /**
     * breed a new generation of maps
     *
     * @param pool pool to breed from
     * @param childrenToBreed how many children to produce
     * @param keepBest how big resulting pool should be (best n)
     * @returns {BreedingPool}
     */
    breedPool(pool, childrenToBreed, keepBest) {
        let childPool = new BreedingPool(keepBest);
        for (let i = 0; i < childrenToBreed; ++i) {
            let mother = pool.pickRandomChild();
            let father = pool.pickRandomChild();
            let child = this.breed(mother, father);
            child.fitness = this.getMapFitness(child);
            childPool.addChild(child);
        }
        return childPool;
    }

    /**
     * displays fitness function
     */
    debugDump() {
        console.log(this.fitness);
    }
}

