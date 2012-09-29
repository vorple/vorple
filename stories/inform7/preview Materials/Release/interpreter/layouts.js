;(function($) {

	$.noty.layouts.bottom = {
		name: 'bottom',
		options: {},
		container: {
			object: '<ul id="noty_bottom_layout_container" />',
			selector: 'ul#noty_bottom_layout_container',
			style: function() {
				$(this).css({
					bottom: 0,
					left: '5%',
					position: 'fixed',
					width: '90%',
					height: 'auto',
					margin: 0,
					padding: 0,
					listStyleType: 'none',
					zIndex: 9999999
				});
			}
		},
		parent: {
			object: '<li />',
			selector: 'li',
			css: {}
		},
		css: {
			display: 'none'
		},
		addClass: ''
	};

})(jQuery);;(function($) {

	$.noty.layouts.bottomCenter = {
		name: 'bottomCenter',
		options: { // overrides options

		},
		container: {
			object: '<ul id="noty_bottomCenter_layout_container" />',
			selector: 'ul#noty_bottomCenter_layout_container',
			style: function() {
				$(this).css({
					bottom: 20,
					left: 0,
					position: 'fixed',
					width: '310px',
					height: 'auto',
					margin: 0,
					padding: 0,
					listStyleType: 'none',
					zIndex: 10000000
				});

				$(this).css({
					left: ($(window).width() - $(this).outerWidth()) / 2 + 'px'
				});
			}
		},
		parent: {
			object: '<li />',
			selector: 'li',
			css: {}
		},
		css: {
			display: 'none',
			width: '310px'
		},
		addClass: ''
	};

})(jQuery);
;(function($) {

	$.noty.layouts.bottomLeft = {
		name: 'bottomLeft',
		options: { // overrides options
			
		},
		container: {
			object: '<ul id="noty_bottomLeft_layout_container" />',
			selector: 'ul#noty_bottomLeft_layout_container',
			style: function() {
				$(this).css({
					bottom: 20,
					left: 20,
					position: 'fixed',
					width: '310px',
					height: 'auto',
					margin: 0,
					padding: 0,
					listStyleType: 'none',
					zIndex: 10000000
				});

				if (window.innerWidth < 600) {
					$(this).css({
						left: 5
					});
				}
			}
		},
		parent: {
			object: '<li />',
			selector: 'li',
			css: {}
		},
		css: {
			display: 'none',
			width: '310px'
		},
		addClass: ''
	};

})(jQuery);;(function($) {

	$.noty.layouts.bottomRight = {
		name: 'bottomRight',
		options: { // overrides options
			
		},
		container: {
			object: '<ul id="noty_bottomRight_layout_container" />',
			selector: 'ul#noty_bottomRight_layout_container',
			style: function() {
				$(this).css({
					bottom: 20,
					right: 20,
					position: 'fixed',
					width: '310px',
					height: 'auto',
					margin: 0,
					padding: 0,
					listStyleType: 'none',
					zIndex: 10000000
				});

				if (window.innerWidth < 600) {
					$(this).css({
						right: 5
					});
				}
			}
		},
		parent: {
			object: '<li />',
			selector: 'li',
			css: {}
		},
		css: {
			display: 'none',
			width: '310px'
		},
		addClass: ''
	};

})(jQuery);;(function($) {

	$.noty.layouts.center = {
		name: 'center',
		options: { // overrides options
			
		},
		container: {
			object: '<ul id="noty_center_layout_container" />',
			selector: 'ul#noty_center_layout_container',
			style: function() {
				$(this).css({
					position: 'fixed',
					width: '310px',
					height: 'auto',
					margin: 0,
					padding: 0,
					listStyleType: 'none',
					zIndex: 10000000
				});

				// getting hidden height
				var dupe = $(this).clone().css({visibility:"hidden", display:"block", position:"absolute", top: 0, left: 0}).attr('id', 'dupe');
				$("body").append(dupe);
				dupe.find('.i-am-closing-now').remove();
				dupe.find('li').css('display', 'block');
				var actual_height = dupe.height();
				dupe.remove();

				if ($(this).hasClass('i-am-new')) {
					$(this).css({
						left: ($(window).width() - $(this).outerWidth()) / 2 + 'px',
						top: ($(window).height() - actual_height) / 2 + 'px'
					});
				} else {
					$(this).animate({
						left: ($(window).width() - $(this).outerWidth()) / 2 + 'px',
						top: ($(window).height() - actual_height) / 2 + 'px'
					}, 500);
				}
				
			}
		},
		parent: {
			object: '<li />',
			selector: 'li',
			css: {}
		},
		css: {
			display: 'none',
			width: '310px'
		},
		addClass: ''
	};

})(jQuery);;(function($) {

	$.noty.layouts.centerLeft = {
		name: 'centerLeft',
		options: { // overrides options

		},
		container: {
			object: '<ul id="noty_centerLeft_layout_container" />',
			selector: 'ul#noty_centerLeft_layout_container',
			style: function() {
				$(this).css({
					left: 20,
					position: 'fixed',
					width: '310px',
					height: 'auto',
					margin: 0,
					padding: 0,
					listStyleType: 'none',
					zIndex: 10000000
				});

				// getting hidden height
				var dupe = $(this).clone().css({visibility:"hidden", display:"block", position:"absolute", top: 0, left: 0}).attr('id', 'dupe');
				$("body").append(dupe);
				dupe.find('.i-am-closing-now').remove();
				dupe.find('li').css('display', 'block');
				var actual_height = dupe.height();
				dupe.remove();

				if ($(this).hasClass('i-am-new')) {
					$(this).css({
						top: ($(window).height() - actual_height) / 2 + 'px'
					});
				} else {
					$(this).animate({
						top: ($(window).height() - actual_height) / 2 + 'px'
					}, 500);
				}

				if (window.innerWidth < 600) {
					$(this).css({
						left: 5
					});
				}

			}
		},
		parent: {
			object: '<li />',
			selector: 'li',
			css: {}
		},
		css: {
			display: 'none',
			width: '310px'
		},
		addClass: ''
	};

})(jQuery);
;(function($) {

	$.noty.layouts.centerRight = {
		name: 'centerRight',
		options: { // overrides options

		},
		container: {
			object: '<ul id="noty_centerRight_layout_container" />',
			selector: 'ul#noty_centerRight_layout_container',
			style: function() {
				$(this).css({
					right: 20,
					position: 'fixed',
					width: '310px',
					height: 'auto',
					margin: 0,
					padding: 0,
					listStyleType: 'none',
					zIndex: 10000000
				});

				// getting hidden height
				var dupe = $(this).clone().css({visibility:"hidden", display:"block", position:"absolute", top: 0, left: 0}).attr('id', 'dupe');
				$("body").append(dupe);
				dupe.find('.i-am-closing-now').remove();
				dupe.find('li').css('display', 'block');
				var actual_height = dupe.height();
				dupe.remove();

				if ($(this).hasClass('i-am-new')) {
					$(this).css({
						top: ($(window).height() - actual_height) / 2 + 'px'
					});
				} else {
					$(this).animate({
						top: ($(window).height() - actual_height) / 2 + 'px'
					}, 500);
				}

				if (window.innerWidth < 600) {
					$(this).css({
						right: 5
					});
				}

			}
		},
		parent: {
			object: '<li />',
			selector: 'li',
			css: {}
		},
		css: {
			display: 'none',
			width: '310px'
		},
		addClass: ''
	};

})(jQuery);
;(function($) {

	$.noty.layouts.inline = {
		name: 'inline',
		options: {},
		container: {
			object: '<ul id="noty_inline_layout_container" />',
			selector: 'ul#noty_inline_layout_container',
			style: function() {
				$(this).css({
					width: '100%',
					height: 'auto',
					margin: 0,
					padding: 0,
					listStyleType: 'none',
					zIndex: 9999999
				});
			}
		},
		parent: {
			object: '<li />',
			selector: 'li',
			css: {}
		},
		css: {
			display: 'none'
		},
		addClass: ''
	};

})(jQuery);;(function($) {

	$.noty.layouts.top = {
		name: 'top',
		options: {},
		container: {
			object: '<ul id="noty_top_layout_container" />',
			selector: 'ul#noty_top_layout_container',
			style: function() {
				$(this).css({
					top: 0,
					left: '5%',
					position: 'fixed',
					width: '90%',
					height: 'auto',
					margin: 0,
					padding: 0,
					listStyleType: 'none',
					zIndex: 9999999
				});
			}
		},
		parent: {
			object: '<li />',
			selector: 'li',
			css: {}
		},
		css: {
			display: 'none'
		},
		addClass: ''
	};

})(jQuery);;(function($) {

	$.noty.layouts.topCenter = {
		name: 'topCenter',
		options: { // overrides options

		},
		container: {
			object: '<ul id="noty_topCenter_layout_container" />',
			selector: 'ul#noty_topCenter_layout_container',
			style: function() {
				$(this).css({
					top: 20,
					left: 0,
					position: 'fixed',
					width: '310px',
					height: 'auto',
					margin: 0,
					padding: 0,
					listStyleType: 'none',
					zIndex: 10000000
				});

				$(this).css({
					left: ($(window).width() - $(this).outerWidth()) / 2 + 'px'
				});
			}
		},
		parent: {
			object: '<li />',
			selector: 'li',
			css: {}
		},
		css: {
			display: 'none',
			width: '310px'
		},
		addClass: ''
	};

})(jQuery);
;(function($) {

	$.noty.layouts.topLeft = {
		name: 'topLeft',
		options: { // overrides options
			
		},
		container: {
			object: '<ul id="noty_topLeft_layout_container" />',
			selector: 'ul#noty_topLeft_layout_container',
			style: function() {
				$(this).css({
					top: 20,
					left: 20,
					position: 'fixed',
					width: '310px',
					height: 'auto',
					margin: 0,
					padding: 0,
					listStyleType: 'none',
					zIndex: 10000000
				});

				if (window.innerWidth < 600) {
					$(this).css({
						left: 5
					});
				}
			}
		},
		parent: {
			object: '<li />',
			selector: 'li',
			css: {}
		},
		css: {
			display: 'none',
			width: '310px'
		},
		addClass: ''
	};

})(jQuery);;(function($) {

	$.noty.layouts.topRight = {
		name: 'topRight',
		options: { // overrides options
			
		},
		container: {
			object: '<ul id="noty_topRight_layout_container" />',
			selector: 'ul#noty_topRight_layout_container',
			style: function() {
				$(this).css({
					top: 20,
					right: 20,
					position: 'fixed',
					width: '310px',
					height: 'auto',
					margin: 0,
					padding: 0,
					listStyleType: 'none',
					zIndex: 10000000
				});

				if (window.innerWidth < 600) {
					$(this).css({
						right: 5
					});
				}
			}
		},
		parent: {
			object: '<li />',
			selector: 'li',
			css: {}
		},
		css: {
			display: 'none',
			width: '310px'
		},
		addClass: ''
	};

})(jQuery);