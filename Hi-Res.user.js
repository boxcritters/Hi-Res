// ==UserScript==
// @name         Hi-Res
// @description  no more blocky blur
// @author       SArpnt
// @version      5.7.1
// @namespace    https://boxcrittersmods.ga/authors/sarpnt/
// @homepage     https://boxcrittersmods.ga/mods/hi-res/
// @updateURL    https://github.com/SArpnt/Hi-Res/raw/master/Hi-Res.user.js
// @downloadURL  https://github.com/SArpnt/Hi-Res/raw/master/Hi-Res.user.js
// @supportURL   https://github.com/SArpnt/Hi-Res/issues
// @run-at       document-start
// @grant        none
// @include      /^https:\/\/boxcritters\.com\/play\/(index\.html)?([\?#].*)?$/
// @require      https://github.com/SArpnt/joinFunction/raw/master/script.js
// @require      https://github.com/SArpnt/EventHandler/raw/master/script.js
// @require      https://github.com/SArpnt/cardboard/raw/master/script.user.js
// ==/UserScript==

(function () {
	'use strict';
	cardboard.register('hiRes');

	function getZoom() {
		if (window.safari) {
			/**
			 * terrible browser makes me write terrible code that breaks in every edge case
			 * credit to p1 for making the first draft and putting up with safari
			 */
			let tabBar = ( // fullscreen detector
				window.screenLeft == 0 &&
				window.screenTop == 0 &&
				window.outerHeight == screen.height &&
				window.outerWidth == screen.width
			) ? 0 : 38;

			let ratio = Math.min(
				(window.outerHeight - tabBar) / window.innerHeight, // height
				window.outerWidth / window.innerWidth // width
			);

			return [.5, .75, .85, 1, 1.15, 1.25, 1.5, 1.75, 2, 2.5, 3] // zoom levels
				.reduce((a, b) => ratio < b ? a : b);
		} else
			return devicePixelRatio; // every sane browser
	}
	cardboard.on('runScriptCreatejs', function () {
		createjs.DisplayObject.prototype.cache = joinFunction(createjs.DisplayObject.prototype.cache, function (_a, _b, _c, _d, _e, _f, h) {
			let bc = this.bitmapCache;
			if (h) {
				if (typeof h == 'function')
					bc.hUpdate = h;
			} else {
				bc.hScale = bc.scale;
				bc.hUpdate = function (scale) {
					bc.scale = bc.hScale * scale;
				};
			}
			cardboard.on('mod-hiRes-hUpdate', bc.hUpdate);
			if (world.stage.hCanvasScale)
				bc.hUpdate(world.stage.hCanvasScale);
		});
	});
	cardboard.on('loadScriptMobile', function (t) {
		t.innerHTML = t.innerHTML.replace(
			/stage\.width/,
			`stage.hWidth`
		).replace(
			/ctx\.canvas\.width/,
			`world.stage.hCanvasWidth`
		).replace(
			/world\.stage\.room\.focus\([^\)]*\)/,
			`(world.stage.hUpdate(),world.stage.room.focus())`
		);
	});
	cardboard.on('worldStageCreated', function (world, s) {
		s.hX = s.x;
		s.hY = s.y;
		s.hXPx = 0;
		s.hYPx = 0;

		s.hWidth = s.width;
		s.hHeight = s.height;
		s.hWidthPx = 0;
		s.hHeightPx = 0;

		s.hScale = 1;

		s.hCanvasWidth = s.width;
		s.hCanvasHeight = s.height;

		s.hiRes = true;
		s.hUpdate = function () {
			let canvas = s.canvas;
			let dpr = getZoom();

			canvas.height = s.hCanvasHeight;
			canvas.width = s.hCanvasWidth;

			let scale = canvas.offsetWidth * dpr / canvas.width;
			s.hCanvasScale = scale;

			let temp = canvas.offsetWidth * dpr;
			canvas.height = canvas.offsetHeight * dpr;
			canvas.width = temp;

			s.x = s.hXPx + (s.hX * scale);
			s.y = s.hYPx + (s.hY * scale);
			s.width = s.hWidth + (s.hWidthPx / scale);
			s.height = s.hHeight + (s.hHeightPx / scale);
			s.scale = s.hScale * scale;

			cardboard.emit('mod-hiRes-hUpdate', scale);
		};
		cardboard.on('login', function () {
			window.addEventListener('resize', s.hUpdate);
			s.hUpdate();
		});
	});
})();
