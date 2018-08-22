var pointUtils = {
	speed: function (points) {
		var dist = 0;

		for (var i = 1; i < points.length; i++) {
			var a = points[i - 1];
			var b = points[i];

			dist += Math.pow(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2), 0.5);
		}

		var time = points[points.length - 1].time - points[0].time;

		return dist / time;
	},

	// This is only an approximation. Cba with differentials and stuff
	acceleration: function (points) {
		var sampleSize = points.length / 4;

		var startSpeed = this.speed(points.slice(0, sampleSize));
		var endSpeed = this.speed(points.slice(-sampleSize));
		var time = points[points.length - 1].time - points[0].time;

		return (endSpeed - startSpeed) / time;
	}
};


function futurelink(options) {
	var mouseData = [];

	if (typeof options === 'function') {
		options = {
			links: true,
			future: options
		};
	}

	if (options.links === true) {
		options.links = Array.from(document.querySelectorAll('a'));
	} else if (!Array.isArray(options.links)) {
		options.links = Array.from(options.links);
	}

	if (typeof options.hoverDelay === 'undefined' || options.hoverDelay === true) {
		options.hoverDelay = 100;
	}

	var futureDone = [];
	var hoverDone = [];
	var clickDone = [];

	function handleMousemove(e) {
    var point = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    };
    mouseData.push(point);

    predict(point, mouseData);
	}

  function handleMouseover(e) {
    var element = e.target;

    if (!options.links.includes(element)) {
      return;
    }

    if (noFuturelink(element)) {
      return false;
    }

    if (typeof options.hover === 'function' && !hoverDone.includes(element)) {
      hoverDone.push(element);
      options.hover(element, e);
    }

    // After 100ms (or configured) of hover, fire future event if predict() didn't work
    if (typeof options.hoverDelay === 'number' && !futureDone.includes(element) && typeof options.future === 'function') {
      var timeout = setTimeout(function () {
        futureDone.push(element);
        options.future(element);
      }, options.hoverDelay);

      e.target.addEventListener('mouseout', function () {
        clearTimeout(timeout);
      });
    }
  }

  function handleClick(e) {
    var element = e.target;

    if (!clickDone.includes(element) && options.links.includes(e.target)) {
      clickDone.push(element);
      options.click(element, e);
    }
	}

  document.addEventListener('mousemove', handleMousemove);
	document.addEventListener('mouseover', handleMouseover);

	if (typeof options.click === 'function') {
		document.addEventListener('click', handleClick);
	}

	function teardown() {
    document.removeEventListener('mousemove', handleMousemove);
    document.removeEventListener('mouseover', handleMouseover);
    document.removeEventListener('click', handleClick);
	}

	function predict(point, data) {
		var recentData = data.slice(data.findIndex(function (oldPoint) {
			return oldPoint.time > point.time - 300;
		}));

		if (recentData.length < 10) {
			// Not enough data
			return
		}

		var acc = pointUtils.acceleration(recentData);

		var reallyRecentData = recentData.slice(recentData.length / -4);
		var recentSpeed = pointUtils.speed(reallyRecentData);

		// Test if about to hit a link
		// This is literally just a random number that seemed to do the trick
		if (recentSpeed * recentSpeed / acc > -10) {
			return;
		}

		var a = reallyRecentData[0];
		var b = reallyRecentData[reallyRecentData.length - 1];

		var direction = Math.atan((b.x - a.x) / (b.y - a.y));

		if (a.y > b.y) {
			direction += Math.PI;
		}

		// This is pretty much a random number too lol
		var length = recentSpeed * 150;

		var goingToX = point.x + length * Math.sin(direction);
		var goingToY = point.y + length * Math.cos(direction);

		options.links.forEach(function (link) {
			if (!futureDone.includes(link) && testLink(link)) {
				futureDone.push(link);

				if (typeof options.future === 'function') {
					options.future(link);
				}
			}
		});

		function testLink(link) {
			if (noFuturelink(link)) {
				return false;
			}

			var linkRect = link.getBoundingClientRect();

			return testHorizontal(linkRect.top, linkRect) ||
				testHorizontal(linkRect.top + linkRect.height, linkRect) ||
				testVertical(linkRect.left, linkRect) ||
				testVertical(linkRect.left + linkRect.width, linkRect);
		}

		function testHorizontal(y, linkRect) {
			if (y < Math.min(point.y, goingToY) || y > Math.max(point.y, goingToY)) {
				return false;
			}

			// Using the vector equation of a line here
			var lambda = (y - point.y) / Math.cos(direction);
			var xAtIntersect = point.x + lambda * Math.sin(direction);

			return (xAtIntersect >= linkRect.left && xAtIntersect <= linkRect.left + linkRect.width);
		}

		function testVertical(x, linkRect) {
			if (x < Math.min(point.x, goingToX) || x > Math.max(point.x, goingToX)) {
				return false;
			}

			// Using the vector equation of a line here
			var lambda = (x - point.x) / Math.cos(direction);
			var yAtIntersect = point.y + lambda * Math.sin(direction);

			return (yAtIntersect >= linkRect.top && yAtIntersect <= linkRect.top + linkRect.height);
		}
	}

	function noFuturelink(link) {
		do {
			if (link.classList.contains('no-futurelink')) {
				return true;
			}
		} while ((link = link.parentElement));

		return false;
	}

	return teardown;
}

if (typeof module === 'object') {
	module.exports = futurelink;
}
