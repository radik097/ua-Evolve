/* SHA-256 implementation for browser usage (sync). */
(function (root) {
    'use strict';

    function rightRotate(value, amount) {
        return (value >>> amount) | (value << (32 - amount));
    }

    function sha256(ascii) {
        var mathPow = Math.pow;
        var maxWord = mathPow(2, 32);
        var lengthProperty = 'length';
        var i, j; // Used as counter across loops
        var result = '';

        var words = [];
        var asciiBitLength = ascii[lengthProperty] * 8;

        // Initialize hash and round constants
        var hash = sha256.h = sha256.h || [];
        var k = sha256.k = sha256.k || [];
        var primeCounter = k[lengthProperty];

        var isPrime = function (n) {
            for (var factor = 2; factor * factor <= n; factor++) {
                if (n % factor === 0) return false;
            }
            return true;
        };

        var getFractionalBits = function (n) {
            return ((n - (n | 0)) * maxWord) | 0;
        };

        for (var candidate = 2; primeCounter < 64; candidate++) {
            if (isPrime(candidate)) {
                if (primeCounter < 8) {
                    hash[primeCounter] = getFractionalBits(Math.pow(candidate, 1 / 2));
                }
                k[primeCounter] = getFractionalBits(Math.pow(candidate, 1 / 3));
                primeCounter++;
            }
        }

        ascii += '\x80';
        while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
        for (i = 0; i < ascii[lengthProperty]; i++) {
            j = ascii.charCodeAt(i);
            if (j >> 8) return; // ASCII only
            words[i >> 2] |= j << ((3 - i) % 4) * 8;
        }
        words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
        words[words[lengthProperty]] = asciiBitLength;

        for (j = 0; j < words[lengthProperty];) {
            var w = words.slice(j, (j += 16));
            var oldHash = hash.slice(0);

            for (i = 0; i < 64; i++) {
                var w15 = w[i - 15], w2 = w[i - 2];

                var a = hash[0], e = hash[4];
                var temp1 = hash[7]
                    + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
                    + ((e & hash[5]) ^ (~e & hash[6]))
                    + k[i]
                    + (w[i] = (i < 16) ? w[i] : (
                        w[i - 16]
                        + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
                        + w[i - 7]
                        + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
                    ) | 0);

                var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
                    + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

                hash = [(temp1 + temp2) | 0].concat(hash);
                hash[4] = (hash[4] + temp1) | 0;
                hash.pop();
            }

            for (i = 0; i < 8; i++) {
                hash[i] = (hash[i] + oldHash[i]) | 0;
            }
        }

        for (i = 0; i < 8; i++) {
            for (j = 3; j + 1; j--) {
                var b = (hash[i] >> (j * 8)) & 255;
                result += ((b < 16) ? 0 : '') + b.toString(16);
            }
        }

        return result;
    }

    root.sha256 = sha256;
})(typeof window !== 'undefined' ? window : this);
