(function($) {
	vorple.preview = {
		interval: false
	};

	vorple.preview.createClock = function() {
		$( '.alarmclock' ).empty();
		$( '<div>' )
			.addClass( 'alarmclockTime' )
			.append( $( '<span>' ).addClass( 'alarmclockHours' ) )
			.append( $( '<span>' ).addClass( 'alarmclockBlinker' ).data( 'state', false ).text( ':' ).css( 'visibility', 'hidden' ) )
			.append( $( '<span>' ).addClass( 'alarmclockMinutes' ) )
			.appendTo( $( '.alarmclock' ) );
		
		if( !this.interval ) {
			setInterval( vorple.preview.updateClock, 1000 );
			this.interval = true;
		}
		this.updateClock();
	};

	vorple.preview.updateClock = function() {
		var date = new Date();
		var hours = date.getHours();
		if( hours < 10 ) {
			hours = '0'+hours;
		}
		
		var minutes = date.getMinutes();
		if( minutes < 10 ) {
			minutes = '0'+minutes;
		}
		
		$( '.alarmclockHours' ).text( hours );
		$( '.alarmclockMinutes' ).text( minutes );
		$( '.alarmclockBlinker' ).data( 'state', !$( '.alarmclockBlinker' ).data( 'state' ) );
		$( '.alarmclockBlinker' ).css( 'visibility', $( '.alarmclockBlinker' ).data( 'state' ) ? 'visible' : 'hidden' );
	};
}(jQuery));