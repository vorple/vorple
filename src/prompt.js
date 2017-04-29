(function() {
    "use strict";

    var prompt = {},
        commandQueue = [];


    /**
     * If there is a command waiting in the queue, submit it to the parser.
     * The command is then removed from the queue.
     */
    function runCommandQueue() {
        if( commandQueue.length > 0 ) {
            var command = commandQueue.shift();

            prompt.setValue( command.cmd );
            prompt.submit( command.silent );
        }
    }


    /**
     * Manually hide the prompt. It won't be shown until unhide() is called.
     */
    prompt.hide = function() {
        $( haven.prompt.get() ).addClass( 'force-hidden' );
    };


    /**
     * Hook into the lineinput's ready event for passing commands from the queue.
     */
    prompt.init = function() {
        haven.prompt.get().addEventListener( 'lineinputReady', runCommandQueue );
    };


    /**
     * Add a command to the command queue. If the line input is ready, execute
     * the command immediately.
     *
     * @param {string} cmd
     * @param {boolean} [silent=false] If true, the command isn't added to the transcript.
     */
    prompt.queueCommand = function( cmd, silent ) {
        commandQueue.push( {
            cmd: cmd,
            silent: !!silent
        } );

        if( haven.prompt.isReady() ) {
            runCommandQueue();
        }
    };


    /**
     * Set the prefix (caret) of the command prompt.
     *
     * @param prefix
     * @param {boolean} escaped If true, the prefix has already been escaped
     *  (or we don't want to escape it) and it can be set to the prefix element
     *  directly without HTML-encoding it.
     *
     *  @return {string} The new prefix.
     */
    prompt.setPrefix = function( prefix, escaped ) {
        var newPrefix = prefix;

        if( !escaped ) {
            newPrefix = $( '<div>' ).text( prefix ).html();
        }

        haven.prompt.prefix.set( newPrefix );

        return newPrefix;
    };


    /**
     * Set the lineinput's value.
     *
     * @param value
     */
    prompt.setValue = function( value ) {
        $( haven.prompt.get() ).find( '#lineinput-field' ).val( value );
    };


    /**
     * Trigger the submit event of the lineinput.
     */
    prompt.submit = function( silent ) {
        haven.prompt.get().dispatchEvent( new CustomEvent( 'submit', { detail: { silent: !!silent } } ) );
    };


    /**
     * Remove manual hiding of the prompt.
     */
    prompt.unhide = function() {
        $( haven.prompt.get() ).removeClass( 'force-hidden' );

        // trigger input field resize so that it fits on the line
        haven.prompt.resizeInput();
    };


    vorple.prompt = prompt;
})();