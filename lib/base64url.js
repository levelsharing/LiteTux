BASE64CONSTS = {
    "STANDARD_BASE64": "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
    "URL_BASE64" : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_",
    "HEX" : "0123456789ABCDEF"
}

// ********************************************************************

/**
 * A simple utility class that allows the use of Base64url using binary strings
 * or easier to work with hex strings. The url variant of Base64 is designed to
 * work with URI requests which use + and / as control characters so replace
 * these characters with -_.
 *
 * terminology:
 *  binary string is a string but which has specifically been encoded so that
 *      each character in the string represents a byte (0-255)
 *  hex string is a regular text string with hexadecimal digits as text.
 *      currently expect a single long continuation of characters but plan
 *      on allowing whitespace and other delimiters in the future.
 */
class Base64url {
    constructor() {
    }

    /** convert from standard base64 to base64url
     *
     * @param s:string base64 encoded string to be converted
     * @returns {string} base64url string
     */
    base64ToBase64url(s) {
        let urlString = s.replace(/\+/g,"-");
        urlString = urlString.replace(/\//g, "_");
        return urlString;
    }

    /**
     *
     * @param s:string base64url encoded string to be converted
     * @returns {string} standard base64 string
     */
    base64urlToBase64(s) {
        let urlString = s.replace(/-/g,"+");
        urlString = urlString.replace(/_/g, "/");
        return urlString;
    }

    /**
     * convert base64url string back into the original binary string
     * @param s:string base64url encoded string
     * @returns {string} binary encoded string
     */
    decodeBinaryString(s) {
        return atob(this.base64urlToBase64(s));
    }

    /**
     * convert base64url encoded string back into a hex string (it is
     * expected that original string was a hex string).
     * @param s:string base64url encoded string
     * @returns {string} hex string
     */
    decodeHexString(s) {
        let binaryString = atob(this.base64urlToBase64(s));
        let hex = "";
        for (let i = 0; i < binaryString.length; ++i) {
            let bchar = binaryString.charCodeAt(i);
            hex = hex + BASE64CONSTS.HEX.charAt( (bchar >> 4) & 15);
            hex = hex + BASE64CONSTS.HEX.charAt( bchar & 15);
        }
        return hex;
    }

    /** converts a binary string into base64url.
     *
     * @param s:string binary encoded string to be converted
     * @returns {string} base64url string
     */
    encodeBinaryString(s) {
        return this.base64ToBase64url(btoa(s));
    }

    /**
     * convert hex string into a base64ulr string
     *
     * @param s:string hex string with pairs of nybbles to form proper bytes.
     * @returns {string} base64url encoded string
     */
    encodeHexString(s) {
        // TODO clean by removing non-hex characters and insuring even

        let hs = s.toUpperCase();
        if ((hs.length % 2) === 1)
            hs = "0" + hs

        let binaryString = "";
        for (let i = 0; i < hs.length; i += 2) {
            let binChar = BASE64CONSTS.HEX.indexOf(hs.charAt(i)) << 4;
            binChar += BASE64CONSTS.HEX.indexOf(hs.charAt(i+1))
            binaryString += String.fromCharCode(binChar);
        }

        return this.encodeBinaryString(binaryString);
    }

    /**
     * converts a string of hex characters (ideally from tile map converted
     * to hex string) into a tile map. The format of the hex string tilemap
     * is the first two nybbles forming the width of the map, the next two
     * nybbles forming the height then each tile being a nybble.
     *
     * Maps with tiles outside the 0-15 range are not currently supported
     * but there are plans to add this support in the future.
     *
     * @param hexString:string tile map represented as a hex string
     * @param bitsPerTile:number for future to support multi-nybble tiles
     * @returns {TileMap}:TileMap resulting tile map object
     */
    hexToTileMap(hexString, bitsPerTile=4) {
        let w = parseInt(hexString.substr(0,2), 16);
        let h = parseInt(hexString.substr(2,2), 16);
        let tm = new TileMap(w,h);
        let index = 4;
        for (let row = 0; row < h; ++row)
            for (let col = 0; col < w; ++col) {
                // TODO multi-nybble tiles
                let t = BASE64CONSTS.HEX.indexOf(hexString.charAt(index++))
                tm.setTile(col, row, (t>0)?t:0);
            }
        return tm;
    }

    /**
     * converts a tile map into a hex string (for further base64url encoding).
     * The format of the hex string tilemap
     * is the first two nybbles forming the width of the map, the next two
     * nybbles forming the height then each tile being a nybble.
     *
     * Maps with tiles outside the 0-15 range are not currently supported
     * but there are plans to add this support in the future.
     *
     * @param tileMap:TileMap tile map to be converted to a hex string
     * @param bitsPerTile:number for future to support multi-nybble tiles
     * @returns {string} tile map represented as a hex string
     */
    tileMapToHex(tileMap, bitsPerTile=4) {
        let w = tileMap.width.toString(16);
        if (w.length < 2) w = "0"+w;
        let h = tileMap.height.toString(16);
        if (h.length < 2) h = "0"+h;
        let hex = w+h
        for (let row = 0; row < tileMap.height; ++row)
            for (let col = 0; col < tileMap.width; ++col)
            {
                let t = Math.min(Math.max(0, tileMap.getTile(col, row)), 15);
                hex += BASE64CONSTS.HEX.charAt(t);
                // TODO nybble support
            }
        return hex;
    }
}