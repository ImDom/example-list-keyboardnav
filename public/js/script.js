var el = {
	$html_body: $("html,body"),
	$document: $(document),
	$window: $(window),
	
	$notebar: $("#notebar"),
	$notebarList: $("#notebar-list")
};

var helper = {
	focusableTagNames: ["INPUT, TEXTAREA"],
	
	positionElementMiddleOnScreen: function(element, speed) {
		speed = arguments.length > 1 ? speed : false;
		
		var redundant = $("#header").outerHeight();
		
		var elementPos = element.offset();
		var elementHeight = element.outerHeight(false);
		var windowHeight = $(window).height() - redundant;
		
		var scrollTop = 0;
		
		if (elementHeight >= windowHeight) {
			scrollTop = elementPos.top-redundant;
		} else if (elementHeight < windowHeight) {
			scrollTop = elementPos.top - (windowHeight/2) + (elementHeight/2) - redundant;
		}
		
		if (speed > 0) {
			el.$html_body.stop(true, true).animate({
				scrollTop: scrollTop
			}, speed);
		} else {
			el.$html_body.scrollTop(scrollTop);
		}
	}
};

var script = {
	init: function() {
		this.initScrollables(function() {
			!function() {
				var _markup = '<li class="list-item"></li>';
				$.template("notebar-list-item", _markup);
				setInterval(function() {
					el.$notebarList.append($.tmpl("notebar-list-item"));
					var jsp = el.$notebar.data("jsp");
					jsp.reinitialise()
					//jsp.scrollToPercentY(100);
				}, 1000);
			}();
		});
		this.initKeyboardNavigated();
	},
	
	initScrollables: function(callback) {
		el.$window.unbind(".scrollable");
		$(".scrollable").unbind(".scrollable");
		
		$(".scrollable").each(function() {
			//$.unbind("mousewheel.scrollable");
			var $this = $(this);
			
			var jsp = $this.jScrollPane({
				horizontalGutter: -7,
				verticalGutter: -7
			}).data("jsp");
			
			var $scrollWrapper = $this.find(".jspVerticalBar, .jspHorizontalBar");
			
			var _resizeHold = false;
			el.$window.bind("resize.scrollable", function() {
				if (_resizeHold) { return; }
				_resizeHold = true;
				jsp.reinitialise();
				_resizeHold = false;
			});
			
			var scrollShowTimeout = 0;
			function scrollShow() {
				clearTimeout(scrollShowTimeout);
				$scrollWrapper.stop(true, true).show();
				scrollShowTimeout = setTimeout(function() { $scrollWrapper.fadeOut(500) }, 1000);
			};
			
			scrollShow();
			
			$this.bind("mouseenter.scrollable", function(e) {
				scrollShow();
			});
			
			var _scrollHold = false;
			$this.bind("scroll.scrollable", function() {
				if (_scrollHold) { return; }
				_scrollHold = true;
				scrollShow();
				_scrollHold = false;
			});
			
			var _mousewheelHold = false;
			$this.bind("mousewheel.scrollable", function(e, d) {
				if (_mousewheelHold) { return };
				_mousewheelHold = true;

				var $this = $(this)
				,   scrollTop = $this.scrollTop()
				,   scrollHeight = $this[0].scrollHeight
				,   height = $this.height();

				if ((scrollTop === (scrollHeight - height) && d < 0) || (scrollTop === 0 && d > 0)) {
					e.preventDefault();
				}

				_mousewheelHold = false;
			});
		});
		
		if (arguments.length > 0) {
			callback.call(this);
		}
	},
	
	initKeyboardNavigated: function() {
		var activeWrapper = $("#content .keyboard-navigated:first").addClass('active')
		,   activeItemIndicator = activeWrapper.find(".active-indicator:first");

		var keyUpCode = 38
		,   keyDownCode = 40;
		
		var navigationSpeed = 300;
		
		var moveActiveItemIndicator = function(toElement, speed, scroll) {
			speed = arguments.length > 1 ? speed : false;
			scroll = arguments.length > 2 ? scroll : true;
			
			activeWrapper.find(".item.active").removeClass("active");
			toElement.addClass("active");
			
			var toElementHeight = toElement.outerHeight(false);
			var toElementPos = toElement.position();

			if (speed > 0) {
				activeItemIndicator.stop(true, true).animate({
					top: toElementPos.top,
					height: toElementHeight
				}, speed);
			} else {
				activeItemIndicator.css("top", toElementPos.top).css("height", toElementHeight);
			}
			
			if (scroll) {
				helper.positionElementMiddleOnScreen(toElement, speed);
			}
		};
		
		moveActiveItemIndicator(activeWrapper.find(".item:first"), false, false);

		el.$document.bind("click", function(e) {
			$(".keyboard-navigated").removeClass("active");
			var $target = $(e.target);
			
			var $targetWrapper;
			if ($target.hasClass("keyboard-navigated")) {
				$targetWrapper = $target;
			} else {
				$targetWrapper = $target.parents(".keyboard-navigated:first");
			}
			
			if ($targetWrapper.length > 0) {
				$targetWrapper.addClass("active");

				activeWrapper = $targetWrapper;
				activeItemIndicator = $targetWrapper.find(".active-indicator:first");
				
				var $clickedItem;
				
				if ($target.hasClass("item")) {
					$clickedItem = $target;
				} else {
					$clickedItem = $target.parents(".item:first");
				}
				
				if ($clickedItem.length === 0) {
					$clickedItem = activeWrapper.find(".item.active:first");
					if ($clickedItem.length === 0) {
						$clickedItem = activeWrapper.find(".item:first");
					}
				}
				
				moveActiveItemIndicator($clickedItem, 100);
			} else {
				activeWrapper = false;
				activeItemIndicator = false;
			}
		});

		var _hold = false;
		el.$document.bind("keydown", function(e) {
			if (_hold) return;
			_hold = true;
			
			var keyUp = e.keyCode === keyUpCode
			,   keyDown = e.keyCode === keyDownCode;
			
			var $target = $(e.target);
			var focusableElementFocused =  $.inArray(e.target.tagName, helper.focusableTagNames) > -1
				|| typeof $target.attr("tabindex") !== "undefined";
							
			if ((keyUp || keyDown) && activeWrapper && !focusableElementFocused) {
				e.preventDefault();

				var currentActiveItem = activeWrapper.find(".active:first");

				var nextActiveItem;

				if (keyDown) {
					nextActiveItem = currentActiveItem.next(".item");
				} else if (keyUp) {
					nextActiveItem = currentActiveItem.prev(".item");
				}

				if (nextActiveItem.length === 0) {
					if (keyDown) {
						nextActiveItem = activeWrapper.find(".item:first");
					} else if (keyUp) {
						nextActiveItem = activeWrapper.find(".item:last");
					}
				}

				moveActiveItemIndicator(nextActiveItem, navigationSpeed);
			}
			
			_hold = false;
		});
	}
};

$(function() {
	script.init();
});