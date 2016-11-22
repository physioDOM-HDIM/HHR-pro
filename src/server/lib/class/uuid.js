/**
 @license
 Copyright (c) 2016 Telecom Sante
 This code may only be used under the CC BY-NC 4.0 style license found at https://creativecommons.org/licenses/by-nc/4.0/legalcode

 You are free to:

 Share — copy and redistribute the material in any medium or format
 Adapt — remix, transform, and build upon the material
 The licensor cannot revoke these freedoms as long as you follow the license terms.

 Under the following terms:

 Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made.
 You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.

 NonCommercial — You may not use the material for commercial purposes.

 No additional restrictions — You may not apply legal terms or technological measures that legally restrict others
 from doing anything the license permits.
 */

/**
 * @Module UUID
 * @date 2013-09-01
 * @author Fatima EL OUARRAT <fatima.elouarrat@telecomsante.com>
 * @author Fabrice LE COZ <fabrice.lecoz@telecomsante.com>
 * @copyright © Télécom Santé
 * @description
 *
 * Singleton to generate / handle unique ids
 * @TODO to we really need this one? If yes can it be avoid?
 */
'use strict';

// Private array of chars to use
var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

/** @lends UUID */
function UUID() {
	this.uuid = function (len, radix) {
		var chars = CHARS, uuid = [], i;
		radix = radix || chars.length;

		if (len) {
			for (i = 0; i < len; i++) {
				uuid[i] = chars[0 | Math.random() * radix];
			}
		} else {
			// rfc4122, version 4 form
			var r;

			// rfc4122 requires these characters
			uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
			uuid[14] = '4';

			// Fill in random data.  At i==19 set the high bits of clock sequence as
			// per rfc4122, sec. 4.1.5
			for (i = 0; i < 36; i++) {
				if (!uuid[i]) {
					r = 0 | Math.random() * 16;
					uuid[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r];
				}
			}
		}

		return uuid.join('');
	};

	// A more performant, but slightly bulkier, RFC4122v4 solution.  We boost performance
	// by minimizing calls to random()
	this.uuidFast = function () {
		var chars = CHARS;
		var uuid = new Array(36);
		var rnd = 0;
		var r;
		for (var i = 0; i < 36; i++) {
			if (i === 8 || i === 13 ||  i === 18 || i === 23) {
				uuid[i] = '-';
			} else if (i === 14) {
				uuid[i] = '4';
			} else {
				if (rnd <= 0x02) {
					rnd = 0x2000000 + (Math.random() * 0x1000000) | 0;
				}
				r = rnd & 0xf;
				rnd = rnd >> 4;
				uuid[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r];
			}
		}
		return uuid.join('');
	};

	// A more compact, but less performant, RFC4122v4 solution:
	this.uuidCompact = function () {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			var r = Math.random() * 16 | 0;
			var v = c === 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	};
}

module.exports = new UUID();