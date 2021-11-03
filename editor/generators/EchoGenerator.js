/**
 * The simplest possible generator only returns the original message.
 * @param e:MessageEvent message
 */
onmessage = function(e) {
    postMessage(e.data);
};
