importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@2.0.0/dist/tf.min.js");
tf.setBackend('cpu');

/**
 * Utility function (may want to move to general utility class in future) that
 * takes a tile map and converts it to a bit-plane encoded slice for use with
 * a neural network that expects bpe input (as opposed to one-hot-bit)
 *
 * @param map source map to be encoded (any TileMap compatible object)
 * @param startCol which column on the map the slice should start at
 * @param cols how many columns are in a slice
 * @param bitplanes how many bitplanes make up a tile
 * @returns {*[]} array containing slice data
 */
function map2bpeSlice(map, startCol, cols=4, bitplanes=4) {
    let slc = [];
    for (let c = 0; c < cols; ++c) {
        for (let r = 0; r < map.height; ++r) {
            let t = map._mapData[r][c+startCol]
            for (let b = 0; b < bitplanes; ++b) {
                let mask = 1 << b;
                mask &= t;
                mask >>= b;
                slc.push(mask);
            }
        }
    }
    return slc;
}

/**
 * checks if slice is blank so we know if we need to just clean the slice or
 * predict the slice. We are ignoring the bottom row of the slice
 * @param slc bpe slice to check if empty
 * @param cols number of columns in slice
 * @param bitplanes number of bit-planes in slice
 * @returns {boolean}
 */
function isSliceBlank(slc, cols=4, bitplanes = 4) {
    let rows = slc/(cols*bitplanes);
    let i = 0;
    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < (rows-1)*bitplanes; ++r) {
            if (slc[i] > 0)
                return false;
            ++i;
        }
        i+=bitplanes
    }

    return true;
}

/**
 * Adds random noise - by randomly setting bit to 0 or 1
 * @param slc slice to add noise to
 * @param noiseThreshold (0..1) probablity of bit being noise
 * @returns {*}
 */
function addNoiseToSlice(slc, noiseThreshold) {
    for (let i = 0; i < slc.length; ++i)
        if (Math.random() < noiseThreshold)
            if (slc[i] > .5)
                slc[i] = 0;
            else
                slc[i] = 1;
    return slc;
}

/**
 * Utility function Converts slice back into a map.
 * (may want to move to general utility class in future)
 * @param slc slice to be converted back into map data
 * @param map map to add slice into
 * @param startCol column of map to add slice into
 * @param cols number of columns in the slice
 * @param bitplanes how many bit-planes were used
 */
function bpeSlice2map(slc, map, startCol, cols=4, bitplanes=4 ) {
    let i = 0;
    for (let c = 0; c < cols; ++c) {
        for (let r = 0; r < map.height; ++r) {
            let t = 0;
            for (let b = 0; b < bitplanes; ++b) {
                let mask = 1 << b;
                if (slc[i] > .5)
                    t |= mask;
                ++i;
            }
            map._mapData[r][c+startCol] = t;
        }
    }
}

let model = null;
let predictor = null;

/**
 * WebWorker handler gets sent a tile map with a params field containing options
 * with the noise controlling noise likelihood and clean deciding if predictor
 * output should be cleaned.
 * @param event
 * @returns {Promise<void>}
 */
onmessage = async function (event) {
//    console.log('executing worker  with ' + event);

    let tilemap = JSON.parse(event.data);
//    console.log(tilemap);
    if (typeof tilemap.width === 'undefined') {
        postMessage('{}');
    } else {
        if (!model) {
            model = await createModel();
        }
        let startCol = tilemap.width % 4;
        let noise = 0.05;
        if (tilemap.params.noise !== undefined)
            noise = tilemap.params.noise;
//        console.log("Noise is " + noise);
        let clean = (tilemap.params.clean !== undefined) ? tilemap.params.clean : false;
        let prev = map2bpeSlice(tilemap,0);
        while ((startCol + 4) < tilemap.width) {
            let slc = map2bpeSlice(tilemap,startCol)
            let isBlank = isSliceBlank(slc);
            let predictOut, input;
            if (isBlank) {
//                console.log("predicting");
                if (!predictor)
                    predictor = await createPredictor();
                addNoiseToSlice(prev, noise/2);
                input = tf.tensor(prev);
                input = input.expandDims(0);
                predictOut = predictor.predict(input);
                if (clean) {
                    input.dispose();
                    input = predictOut;
                    predictOut = model.predict(input);
                }
            } else {
                addNoiseToSlice(slc, noise);
                input = tf.tensor(slc);
                input = input.expandDims(0);
                predictOut = model.predict(input);
            }
            bpeSlice2map(predictOut.dataSync(), tilemap, startCol);
            predictOut.dispose();
            input.dispose();
            startCol += 1;//4;
            prev = slc;
        }

        postMessage(JSON.stringify(tilemap));
    }
};

async function createModel() {
//    console.log("Loading tensorflow model");
    return await tf.loadLayersModel('cleaner/model.json')
}

async function createPredictor() {
//    console.log("Loading tensorflow model");
    return await tf.loadLayersModel('predictor/model.json')
}