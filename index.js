'use strict';

var MOD = 65521;

// adler32 is not cryptographically strong, and is only used to sanity check that
// markup generated on the server matches the markup generated on the client.
// This implementation (a modified version of the SheetJS version) has been optimized
// for our use case, at the expense of conforming to the adler32 specification
// for non-ascii inputs.
function adler32(data) {
  var a = 1;
  var b = 0;
  var i = 0;
  var l = data.length;
  var m = l & ~0x3;
  while (i < m) {
    for (; i < Math.min(i + 4096, m); i += 4) {
      b +=
        (a += data.charCodeAt(i)) +
        (a += data.charCodeAt(i + 1)) +
        (a += data.charCodeAt(i + 2)) +
        (a += data.charCodeAt(i + 3));
    }
    a %= MOD;
    b %= MOD;
  }
  for (; i < l; i++) {
    b += a += data.charCodeAt(i);
  }
  a %= MOD;
  b %= MOD;
  return a | (b << 16);
}

// data-reactid=\"[^"]+\">
const transcludeRegex = /\<x\-(\w+)( data-reactroot=\"([^"]*?)\")? data-reactid=\"([^"]+?)\"( data\-react\-checksum=\"\-?\d+\")?\>\<\/x\-\w+\>/g;
const reactChecksumRegex = / data\-react\-checksum=\"\-?\d+\"/g;

function transclude(str, comps) {
  return str.replace(transcludeRegex, (match, compId) => {
    if (!comps[compId]) {
      console.log(`missing ${compId}`);
    }
    const comp = comps[compId] || '';
    return transclude(comp, comps);
  });
}

function updateReactRootAndReactIds(str) {
    let index = 1;
    return str.replace(/ data\-reactroot=\"([^"]*?)\"/g, "")
        .replace(/ /, ' data-reactroot="" ')
        .replace(/ data\-reactid=\"\d+\"/g, function () {
            return ` data-reactid="${index++}"`
        });
}

function transcludeAndChecksum(str, comps) {
    const rawHtml = updateReactRootAndReactIds(transclude(str, comps).replace(reactChecksumRegex, ''));
    const checksum = adler32(rawHtml);
    return rawHtml.replace(/\>/, ` data-react-checksum="${checksum}">`);
}

module.exports = transcludeAndChecksum;