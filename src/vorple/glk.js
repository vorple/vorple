/**
 * GLK connection to Quixe. This is a trimmed down and slightly modified
 * version of glkapi.js by Andrew Plotkin.
 * 
 * Functions that are modified are annotated, for easier syncing with
 * updates in official Quixe.
 * 
 * @module glk
 * @since 3.2.0
 * @private
 */

import { append, flush } from "../haven/buffer";
import { keypress } from "../haven/input";
import { expectInput } from "../haven/prompt";
import { engineStops } from "../haven/haven";
import {
    HANDSHAKE_FILENAME,
    INFORM_PATH,
    JS_EVAL_FILENAME,
    JS_RETURN_VALUE_FILENAME,
    JS_RETURN_VALUE_TYPE_FILENAME,
    VORPLE_PATH,
    exists,
    filePrompt,
    read,
    restoreFilePrompt,
    saveFilePrompt,
    transcriptFilePrompt,
    write
} from "./file";
import { evaluate } from "./vorple";
import { setStyle } from "./haven";
import error from "../haven/error";
import { 
    Const,
    KeystrokeNameMap,
    StyleNameMap,
    FileTypeMap,
    unicode_upper_table,
    unicode_lower_table,
    unicode_title_table,
    unicode_decomp_table,
    unicode_combin_table,
    unicode_compo_table
} from "./glkConstants";
    


/** VORPLE UTILITY FUNCTIONS */

/**
 * Receive character input from UI
 */
export function sendChar( value ) {
    accept_ui_event({ 
        type: 'char',
        value: value || ""
    });
}


/**
 * Receive line input from UI
 */
export function sendLine( value ) {
    accept_ui_event({ 
        type: 'line',
        value
    });
}


/**
 * Choose a different directory when reading or writing Vorple files
 */
function filePath( filename ) {
    const vorpleFiles = [ HANDSHAKE_FILENAME, JS_EVAL_FILENAME, JS_RETURN_VALUE_FILENAME, JS_RETURN_VALUE_TYPE_FILENAME ];
    
    if( vorpleFiles.indexOf( filename ) > -1 ) {
        return VORPLE_PATH;
    }

    return INFORM_PATH;
}


/**
 * Function that does nothing for GLK functions that we won't use at all
 */
function DO_NOTHING() {}




/** GLKAPI.JS */

/* The VM interface object. */
let VM = null;

/* Options from the vm_options object. */
let option_exit_warning;
let option_do_vm_autosave;
let option_before_select_hook;
let option_extevent_hook;
let option_glk_gestalt_hook;

/* Library display state. */
let has_exited = false;
let ui_disabled = false;
let ui_specialinput = null;
let ui_specialcallback = null;
let event_generation = 0;
let current_partial_inputs = null;
let current_partial_outputs = null;


function init( vm_options ) {   // modified
    VM = vm_options.vm;
    GiDispa.set_vm( VM );
    
    vm_options.accept = accept_ui_event;
    option_exit_warning = vm_options.exit_warning;
    option_do_vm_autosave = vm_options.do_vm_autosave;
    option_before_select_hook = vm_options.before_select_hook;
    option_extevent_hook = vm_options.extevent_hook;
    option_glk_gestalt_hook = vm_options.glk_gestalt_hook;

    if( option_before_select_hook ) {
        option_before_select_hook();
    }

    // wait a tick before continuing initialization
    setTimeout( () => accept_ui_event({ type: 'init', gen: 0 }), 1 );
}


function accept_ui_event(obj) {  // modified
    if( ui_disabled ) {
        /* We've hit glk_exit() or a VM fatal error, or just blocked the UI for
            some modal dialog. */
        return;
    }

    /* Note any partial inputs; we'll need them if the game cancels a line
        input. This may be undef. */
    current_partial_inputs = obj.partial;

    switch( obj.type ) {
        case 'init':
            // content_metrics = obj.metrics;
            /* We ignore the support array. This library is updated in sync
            with GlkOte, so we know what it supports. */
            VM.init();
            break;
            
        // these are not supported
        case 'external':
        case 'timer':
        case 'hyperlink':
        case 'mouse':
        case 'arrange':
        case 'redraw':
            break;

        case 'specialresponse':
            if (obj.response === 'fileref_prompt') {
                gli_fileref_create_by_prompt_callback(obj);
            }
            break;

        case 'char':
            handle_char_input( obj.value );
            break;

        case 'line':
            handle_line_input( obj.value, obj.terminator );
            break;
    }
}

// function handle_arrange_input() {
// function handle_redraw_input() {
// function handle_external_input(res) {
// function handle_hyperlink_input(disprock, val) {
// function handle_mouse_input(disprock, xpos, ypos) {

function handle_char_input( /* disprock, */ input) {    // modified
    var charval;

    if (!gli_selectref)
        return;

    var win = gli_rootwin;  // we have only one window

    if (input.length == 1) {
        charval = input.charCodeAt(0);
        if (!win.char_request_uni)
            charval = charval & 0xFF;
    }
    else {
        charval = KeystrokeNameMap[input];
        if (!charval)
            charval = Const.keycode_Unknown;
    }

    gli_selectref.set_field(0, Const.evtype_CharInput);
    gli_selectref.set_field(1, win);
    gli_selectref.set_field(2, charval);
    gli_selectref.set_field(3, 0);

    win.char_request = false;
    win.char_request_uni = false;
    win.input_generation = null;

    if (window.GiDispa)
        GiDispa.prepare_resume(gli_selectref);
    gli_selectref = null;
    VM.resume();
}

function handle_line_input( /* disprock, */ input, _termkey) {  // modified
    var ix;

    if (!gli_selectref) {
        return;
    }

    var win = gli_rootwin;

    if (input.length > win.linebuf.length)
        input = input.slice(0, win.linebuf.length);

    if (win.request_echo_line_input) {
        ix = win.style;
        gli_set_style(win.str, Const.style_Input);
        gli_window_put_string(win, input);
        if (win.echostr)
            glk_put_jstring_stream(win.echostr, input);
        gli_set_style(win.str, ix);
        gli_window_put_string(win, "\n");
        if (win.echostr)
            glk_put_jstring_stream(win.echostr, "\n");
    }

    for (ix=0; ix<input.length; ix++)
        win.linebuf[ix] = input.charCodeAt(ix);

    var termcode = Const.keycode_Return;
    /*
    if (termkey && KeystrokeNameMap[termkey]) 
        termcode = KeystrokeNameMap[termkey];
    */

    gli_selectref.set_field(0, Const.evtype_LineInput);
    gli_selectref.set_field(1, win);
    gli_selectref.set_field(2, input.length);
    gli_selectref.set_field(3, termcode);

    if (window.GiDispa)
        GiDispa.unretain_array(win.linebuf);
    win.line_request = false;
    win.line_request_uni = false;
    win.request_echo_line_input = null;
    win.input_generation = null;
    win.linebuf = null;

    if (window.GiDispa)
        GiDispa.prepare_resume(gli_selectref);
    gli_selectref = null;
    VM.resume();
}


function update() { // modified
    var dataobj = { type: 'update', gen: event_generation };
    var winarray = null;
    var contentarray = null;
    var inputarray = null;
    var win, obj, robj, useobj, lineobj, ls, val, ix, cx;
    var initial, lastpos, laststyle, lasthyperlink;

    win = gli_rootwin;

    useobj = false;
    obj = { id: win.disprock };
    if (contentarray == null)
        contentarray = [];

    gli_window_buffer_deaccumulate(win);
    if (win.content.length) {
        obj.text = win.content.slice(0);
        win.content.length = 0;
        useobj = true;
    }
    if (win.clearcontent) {
        obj.clear = true;
        win.clearcontent = false;
        useobj = true;
        if (!obj.text) {
            obj.text = [];
        }
        win.reserve.length = 0;
    }
    if (obj.text && obj.text.length) {
        for (ix=0; ix<obj.text.length; ix++) {
            win.reserve.push(obj.text[ix]);
        }
    }
    if (win.reserve.length > 100) {
        win.reserve.splice(0, win.reserve.length-100);
    }

    if (useobj)
        contentarray.push(obj);

    inputarray = [];
    
    obj = null;
    if (win.char_request) {
        obj = { id: win.disprock, type: 'char', gen: win.input_generation };
    }
    if (win.line_request) {
        initial = '';
        if (current_partial_outputs) {
            val = current_partial_outputs[win.disprock];
            if (val)
                initial = val;
        }
        /* Note that the initial and terminators fields will be ignored
            if this is a continued (old) input request. So it doesn't
            matter if they're wrong. */
        obj = { id: win.disprock, type: 'line', gen: win.input_generation,
                maxlen: win.linebuf.length, initial: initial };
        if (win.line_input_terminators.length) {
            obj.terminators = win.line_input_terminators;
        }
    }
    if (obj)
        inputarray.push(obj);

    dataobj.windows = winarray;
    dataobj.content = contentarray;
    dataobj.input = inputarray;

    if (ui_specialinput) {
        const callback = function( filename ) {
            accept_ui_event({ 
                type: 'specialresponse',
                response: "fileref_prompt",
                value: filename ? { filename } : null
            });
        };

        dataobj.specialinput = ui_specialinput;
        switch( ui_specialinput.filetype ) {
            case 'save':
                if( ui_specialinput.filemode === "write" ) {
                    saveFilePrompt( ui_specialinput.gameid, callback );
                }
                else {
                    restoreFilePrompt( ui_specialinput.gameid, callback );
                }
                break;
            case 'transcript':
                transcriptFilePrompt( callback );
                break;
            default:
                filePrompt( callback );
                break;
        }
    }

    if (ui_disabled) {
        dataobj.disable = true;
    }

    /* Clean this up; it's only meaningful within one run/update cycle. */
    current_partial_outputs = null;

    /* If we're doing an autorestore, gli_autorestore_glkstate will 
       contain additional setup information for the first update()
       call only. */
    if (gli_autorestore_glkstate)
        dataobj.autorestore = gli_autorestore_glkstate;
    gli_autorestore_glkstate = null;

    // GlkOte.update(dataobj, gli_autorestore_glkstate);

    if (option_before_select_hook) {
        option_before_select_hook();
    }
    if (option_do_vm_autosave) {
        if (has_exited) {
            /* On quit or fatal error, delete the autosave. */
            VM.do_autosave(-1);
        }
        else {
            /* If this is a good time, autosave. */
            var eventarg = GiDispa.check_autosave();
            if (eventarg)
                VM.do_autosave(eventarg);
        }
    }
}

function fatal_error( err ) {   // modified
    error( err );
}

function CharToString(val) {
    if (val < 0x10000) {
        return String.fromCharCode(val);
    }
    else {
        val -= 0x10000;
        return String.fromCharCode(0xD800 + (val >> 10), 0xDC00 + (val & 0x3FF));
    }
}

function TrimArrayToBytes(arr) {
    var ix, newarr;
    var len = arr.length;
    for (ix=0; ix<len; ix++) {
        if (arr[ix] < 0 || arr[ix] >= 0x100) 
            break;
    }
    if (ix == len) {
        return arr;
    }
    newarr = Array(len);
    for (ix=0; ix<len; ix++) {
        if (arr[ix] < 0 || arr[ix] >= 0x100) 
            newarr[ix] = 63;  // '?'
        else
            newarr[ix] = arr[ix];
    }
    return newarr;
}

function ByteArrayToString(arr) {
    var ix, newarr;
    var len = arr.length;
    if (len == 0)
        return '';
    for (ix=0; ix<len; ix++) {
        if (arr[ix] < 0 || arr[ix] >= 0x100) 
            break;
    }
    if (ix == len) {
        return String.fromCharCode.apply(this, arr);
    }
    newarr = Array(len);
    for (ix=0; ix<len; ix++) {
        newarr[ix] = String.fromCharCode(arr[ix] & 0xFF);
    }
    return newarr.join('');
}

function UniArrayToString(arr) {
    var ix, val, newarr;
    var len = arr.length;
    if (len == 0)
        return '';
    for (ix=0; ix<len; ix++) {
        if (arr[ix] >= 0x10000) 
            break;
    }
    if (ix == len) {
        return String.fromCharCode.apply(this, arr);
    }
    newarr = Array(len);
    for (ix=0; ix<len; ix++) {
        val = arr[ix];
        if (val < 0x10000) {
            newarr[ix] = String.fromCharCode(val);
        }
        else {
            val -= 0x10000;
            newarr[ix] = String.fromCharCode(0xD800 + (val >> 10), 0xDC00 + (val & 0x3FF));
        }
    }
    return newarr.join('');
}

function UniArrayToUTF8(arr) {
    var count = 0;

    for (var ix=0; ix<arr.length; ix++) {
        var val = arr[ix];
        if (val < 0x80) {
            count += 1;
        }
        else if (val < 0x800) {
            count += 2;
        }
        else if (val < 0x10000) {
            count += 3;
        }
        else if (val < 0x200000) {
            count += 4;
        }
        else {
            count += 1;
        }
    }

    if (count == arr.length)
        return arr;

    var res = [];
    for (var ix=0; ix<arr.length; ix++) {
        var val = arr[ix];
        if (val < 0x80) {
            res.push(val);
        }
        else if (val < 0x800) {
            res.push(0xC0 | ((val & 0x7C0) >> 6));
            res.push(0x80 |  (val & 0x03F)     );
        }
        else if (val < 0x10000) {
            res.push(0xE0 | ((val & 0xF000) >> 12));
            res.push(0x80 | ((val & 0x0FC0) >>  6));
            res.push(0x80 |  (val & 0x003F)      );
        }
        else if (val < 0x200000) {
            res.push(0xF0 | ((val & 0x1C0000) >> 18));
            res.push(0x80 | ((val & 0x03F000) >> 12));
            res.push(0x80 | ((val & 0x000FC0) >>  6));
            res.push(0x80 |  (val & 0x00003F)      );
        }
        else {
            res.push(63);  // '?'
        }
    }

    return res;
}

function UniArrayToBE32(arr) {
    var res = new Array(4*arr.length);
    for (var ix=0; ix<arr.length; ix++) {
        var val = arr[ix];
        res[4*ix]   = (val >> 24) & 0xFF;
        res[4*ix+1] = (val >> 16) & 0xFF;
        res[4*ix+2] = (val >> 8) & 0xFF;
        res[4*ix+3] = (val) & 0xFF;
    }
    return res;
}

// function qlog(msg) {

function RefBox() {
    this.value = undefined;
    this.set_value = function(val) {
        this.value = val;
    }
    this.get_value = function() {
        return this.value;
    }
}

function RefStruct() {
    this.fields = [];
    this.push_field = function(val) {
        this.fields.push(val);
    }
    this.set_field = function(pos, val) {
        this.fields[pos] = val;
    }
    this.get_field = function(pos) {
        return this.fields[pos];
    }
    this.get_fields = function() {
        return this.fields;
    }
}

const DidNotReturn = { dummy: 'Glk call has not yet returned' };

function call_may_not_return(id) {
    if (id == 0x001 || id == 0x0C0 || id == 0x062)
        return true;
    else
        return false;
}

const strtype_File = 1;
const strtype_Window = 2;
const strtype_Memory = 3;
const strtype_Resource = 4;

let gli_autorestore_glkstate = null;
let gli_windowlist = null;
let gli_rootwin = null;
let geometry_changed = true; 
let content_metrics = null;

let gli_streamlist = null;
let gli_filereflist = null;
let gli_schannellist = null;

let gli_currentstr = null;

let gli_selectref = null;

let gli_api_display_rocks = 1;

/*
var gli_timer_interval = null; 
var gli_timer_started = null; 
var gli_timer_lastsent = null;
*/

function gli_new_window(type, rock) {
    var win = {};
    win.type = type;
    win.rock = rock;
    win.disprock = undefined;

    win.parent = null;
    win.str = gli_stream_open_window(win);
    win.echostr = null;
    win.style = Const.style_Normal;
    win.hyperlink = 0;

    win.input_generation = null;
    win.linebuf = null;
    win.char_request = false;
    win.line_request = false;
    win.char_request_uni = false;
    win.line_request_uni = false;
    win.hyperlink_request = false;
    win.mouse_request = false;
    win.echo_line_input = false;    // CHANGED: Quixe echos line input, we don't!
    win.line_input_terminators = [];
    win.request_echo_line_input = null; /* only used during a request */

    /* window-type-specific info is set up in glk_window_open */

    win.prev = null;
    win.next = gli_windowlist;
    gli_windowlist = win;
    if (win.next)
        win.next.prev = win;

    if (window.GiDispa)
        GiDispa.class_register('window', win);
    else
        win.disprock = gli_api_display_rocks++;
    /* We need to assign a disprock even if there's no GiDispa layer,
       because GlkOte differentiates windows by their disprock. */
    geometry_changed = true;

    return win;
}

function gli_delete_window(win) {
    var prev, next;

    if (window.GiDispa)
        GiDispa.class_unregister('window', win);
    geometry_changed = true;
    
    win.echostr = null;
    if (win.str) {
        gli_delete_stream(win.str);
        win.str = null;
    }

    prev = win.prev;
    next = win.next;
    win.prev = null;
    win.next = null;

    if (prev)
        prev.next = next;
    else
        gli_windowlist = next;
    if (next)
        next.prev = prev;

    win.parent = null;
    win.rock = null;
    win.disprock = null;
}

function gli_windows_unechostream(str) {
    var win;
    
    for (win=gli_windowlist; win; win=win.next) {
        if (win.echostr === str)
            win.echostr = null;
    }
}

function gli_window_put_string(_win, val) { // modified
    append( val );
}

function gli_window_buffer_deaccumulate(win) {
    var conta = win.content;
    var stylename = StyleNameMap[win.accumstyle];
    var text, ls, ix, obj, arr;

    if (win.accum.length) {
        text = win.accum.join('');
        ls = text.split('\n');
        for (ix=0; ix<ls.length; ix++) {
            arr = undefined;
            if (ix == 0) {
                if (ls[ix]) {
                    if (conta.length == 0) {
                        arr = [];
                        conta.push({ content: arr, append: true });
                    }
                    else {
                        obj = conta[conta.length-1];
                        if (!obj.content) {
                            arr = [];
                            obj.content = arr;
                        }
                        else {
                            arr = obj.content;
                        }
                    }
                }
            }
            else {
                if (ls[ix]) {
                    arr = [];
                    conta.push({ content: arr });
                }
                else {
                    conta.push({ });
                }
            }
            if (arr !== undefined) {
                if (!win.accumhyperlink) {
                    arr.push(stylename);
                    arr.push(ls[ix]);
                }
                else {
                    arr.push({ style:stylename, text:ls[ix], hyperlink:win.accumhyperlink });
                }
            }
        }
    }

    win.accum.length = 0;
    win.accumstyle = win.style;
    win.accumhyperlink = win.hyperlink;
}

function gli_window_buffer_put_special(win, special, flowbreak) {
    gli_window_buffer_deaccumulate(win);

    var conta = win.content;
    var arr = undefined;
    var obj;

    /* The next bit is a simplified version of the array-append code 
       from deaccumulate(). It's simpler because we have exactly one
       item to add. */

    if (conta.length == 0) {
        arr = [];
        obj = { content: arr, append: true };
        if (flowbreak)
            obj.flowbreak = true;
        conta.push(obj);
    }
    else {
        obj = conta[conta.length-1];
        if (flowbreak)
            obj.flowbreak = true;
        if (!obj.content) {
            arr = [];
            obj.content = arr;
        }
        else {
            arr = obj.content;
        }
    }
    
    if (arr !== undefined && special !== undefined) {
        arr.push(special);
    }
}

function gli_new_stream(type, readable, writable, rock) {
    let str = {};
    str.type = type;
    str.rock = rock;
    str.disprock = undefined;

    str.unicode = false;
    /* isbinary is only meaningful for Resource and streaming-File streams */
    str.isbinary = false;
    str.streaming = false;
    str.ref = null;
    str.win = null;
    str.file = null;

    /* for buffer mode */
    str.buf = null;
    str.bufpos = 0;
    str.buflen = 0;
    str.bufeof = 0;
    str.timer_id = null;
    str.flush_func = null;

    /* for streaming mode */
    str.fstream = null;

    str.readcount = 0;
    str.writecount = 0;
    str.readable = readable;
    str.writable = writable;

    str.prev = null;
    str.next = gli_streamlist;
    gli_streamlist = str;
    if (str.next)
        str.next.prev = str;

    if (window.GiDispa)
        GiDispa.class_register('stream', str);

    return str;
}

function gli_delete_stream(str) {
    var prev, next;
    
    if (str === gli_currentstr) {
        gli_currentstr = null;
    }

    gli_windows_unechostream(str);

    if (str.type == strtype_Memory) {
        if (window.GiDispa)
            GiDispa.unretain_array(str.buf);
    }
    else if (str.type == strtype_File) {
        if (str.fstream) {
            str.fstream.fclose();
            str.fstream = null;
        }
    }

    if (window.GiDispa)
        GiDispa.class_unregister('stream', str);

    prev = str.prev;
    next = str.next;
    str.prev = null;
    str.next = null;

    if (prev)
        prev.next = next;
    else
        gli_streamlist = next;
    if (next)
        next.prev = prev;

    str.fstream = null;
    str.buf = null;
    str.readable = false;
    str.writable = false;
    str.ref = null;
    str.win = null;
    str.file = null;
    str.rock = null;
    str.disprock = null;
}

function gli_stream_open_window(win) {
    var str;
    str = gli_new_stream(strtype_Window, false, true, 0);
    str.unicode = true;
    str.win = win;
    return str;
}


function gli_stream_dirty_file(str) {
    if (str.streaming)
        GlkOte.log('### gli_stream_dirty_file called for streaming file!');
    if (str.timer_id === null) {
        if (str.flush_func === null) {
            /* Bodge together a closure to act as a stream method. */
            str.flush_func = function() { gli_stream_flush_file(str); };
        }
        str.timer_id = setTimeout(str.flush_func, 10000);
    }
}

function gli_stream_flush_file(str) {
    if (str.streaming)
        GlkOte.log('### gli_stream_flush_file called for streaming file!');
    if (!(str.timer_id === null)) {
        clearTimeout(str.timer_id);
    }
    str.timer_id = null;
    write( str.ref.filename, str.buf, { append: true } );
}

function gli_new_fileref(filename, usage, rock, ref) {
    var fref = {};
    fref.filename = filename;
    fref.rock = rock;
    fref.disprock = undefined;

    fref.textmode = ((usage & Const.fileusage_TextMode) != 0);
    fref.filetype = (usage & Const.fileusage_TypeMask);
    fref.filetypename = FileTypeMap[fref.filetype];
    if (!fref.filetypename) {
        fref.filetypename = 'xxx';
    }

    if (!ref) {
        var gameid = '';
        if (fref.filetype == Const.fileusage_SavedGame)
            gameid = VM.get_signature();
        // ref = Dialog.file_construct_ref(fref.filename, fref.filetypename, gameid);
    }
    fref.ref = ref;

    fref.prev = null;
    fref.next = gli_filereflist;
    gli_filereflist = fref;
    if (fref.next)
        fref.next.prev = fref;

    if (window.GiDispa)
        GiDispa.class_register('fileref', fref);
    
    return fref;
}

function gli_delete_fileref(fref) {
    var prev, next;
    
    if (window.GiDispa)
        GiDispa.class_unregister('fileref', fref);

    prev = fref.prev;
    next = fref.next;
    fref.prev = null;
    fref.next = null;

    if (prev)
        prev.next = next;
    else
        gli_filereflist = next;
    if (next)
        next.prev = prev;

    fref.filename = null;
    fref.ref = null;
    fref.rock = null;
    fref.disprock = null;
}

function gli_put_char(str, ch) {
    if (!str || !str.writable)
        throw('gli_put_char: invalid stream');

    if (!str.unicode) {
        if (ch < 0 || ch >= 0x100)
            ch = 63;  // '?'
    }

    str.writecount += 1;
    
    switch (str.type) {
    case strtype_File:
        /* non-streaming... */
        gli_stream_dirty_file(str);
        if (!str.unicode || (ch < 0x80 && !str.isbinary)) {
            if (str.bufpos < str.buflen) {
                str.buf[str.bufpos] = ch;
                str.bufpos += 1;
                if (str.bufpos > str.bufeof)
                    str.bufeof = str.bufpos;
            }
        }
        else {
            var arr;
            if (!str.isbinary)
                arr = UniArrayToUTF8([ch]);
            else
                arr = UniArrayToBE32([ch]);
            var len = arr.length;
            if (len > str.buflen-str.bufpos)
                len = str.buflen-str.bufpos;
            for (ix=0; ix<len; ix++)
                str.buf[str.bufpos+ix] = arr[ix];
            str.bufpos += len;
            if (str.bufpos > str.bufeof)
                str.bufeof = str.bufpos;
        }
        break;
    case strtype_Memory:
        if (str.bufpos < str.buflen) {
            str.buf[str.bufpos] = ch;
            str.bufpos += 1;
            if (str.bufpos > str.bufeof)
                str.bufeof = str.bufpos;
        }
        break;
    case strtype_Window:
        if (str.win.line_request)
            throw('gli_put_char: window has pending line request');
        gli_window_put_string(str.win, CharToString(ch));
        if (str.win.echostr)
            gli_put_char(str.win.echostr, ch);
        break;
    }
}

function gli_put_array(str, arr, allbytes) {
    var ix, len, val;

    if (!str || !str.writable)
        throw('gli_put_array: invalid stream');

    if (!str.unicode && !allbytes) {
        arr = TrimArrayToBytes(arr);
        allbytes = true;
    }

    str.writecount += arr.length;
    
    switch (str.type) {
    case strtype_File:
        if (str.streaming) {
            if (!str.unicode) {
                var buf = new str.fstream.BufferClass(arr);
                str.fstream.fwrite(buf);
            }
            else {
                if (!str.isbinary) {
                    /* cheap UTF-8 stream */
                    var arr8 = UniArrayToUTF8(arr);
                    var buf = new str.fstream.BufferClass(arr8);
                    str.fstream.fwrite(buf);
                }
                else {
                    /* cheap big-endian stream */
                    var buf = new str.fstream.BufferClass(4*arr.length);
                    for (ix=0; ix<arr.length; ix++) {
                        buf.writeUInt32BE(arr[ix], 4*ix, true);
                    }
                    str.fstream.fwrite(buf);
                }
            }
        }
        else {
            /* non-streaming... */
            gli_stream_dirty_file(str);
            var arr8;
            if (!str.unicode) {
                arr8 = arr;
            }
            else {
                if (!str.isbinary)
                    arr8 = UniArrayToUTF8(arr);
                else
                    arr8 = UniArrayToBE32(arr);
            }
            var len = arr8.length;
            if (len > str.buflen-str.bufpos)
                len = str.buflen-str.bufpos;
            for (ix=0; ix<len; ix++)
                str.buf[str.bufpos+ix] = arr8[ix];
            str.bufpos += len;
            if (str.bufpos > str.bufeof)
                str.bufeof = str.bufpos;
        }
        break;
    case strtype_Memory:
        len = arr.length;
        if (len > str.buflen-str.bufpos)
            len = str.buflen-str.bufpos;
        for (ix=0; ix<len; ix++)
            str.buf[str.bufpos+ix] = arr[ix];
        str.bufpos += len;
        if (str.bufpos > str.bufeof)
            str.bufeof = str.bufpos;
        break;
    case strtype_Window:
        if (str.win.line_request)
            throw('gli_put_array: window has pending line request');
        if (allbytes)
            val = String.fromCharCode.apply(this, arr);
        else
            val = UniArrayToString(arr);
        gli_window_put_string(str.win, val);
        if (str.win.echostr)
            gli_put_array(str.win.echostr, arr, allbytes);
        break;
    }
}

function gli_get_char(str, want_unicode) {
    var ch;

    if (!str || !str.readable)
        return -1;
    
    switch (str.type) {
    case strtype_File:
        if (str.streaming) {
            if (!str.unicode) {
                var len = str.fstream.fread(str.buffer4, 1);
                if (!len)
                    return -1;
                str.readcount++;
                return str.buffer4[0];
            }
            else {
                if (!str.isbinary) {
                    /* slightly less cheap UTF8 stream */
                    var val0, val1, val2, val3;
                    var len = str.fstream.fread(str.buffer4, 1);
                    if (!len)
                        return -1;
                    val0 = str.buffer4[0];
                    if (val0 < 0x80) {
                        ch = val0;
                    }
                    else {
                        var len = str.fstream.fread(str.buffer4, 1);
                        if (!len)
                            return -1;
                        val1 = str.buffer4[0];
                        if ((val1 & 0xC0) != 0x80)
                            return -1;
                        if ((val0 & 0xE0) == 0xC0) {
                            ch = (val0 & 0x1F) << 6;
                            ch |= (val1 & 0x3F);
                        }
                        else {
                            var len = str.fstream.fread(str.buffer4, 1);
                            if (!len)
                                return -1;
                            val2 = str.buffer4[0];
                            if ((val2 & 0xC0) != 0x80)
                                return -1;
                            if ((val0 & 0xF0) == 0xE0) {
                                ch = (((val0 & 0xF)<<12)  & 0x0000F000);
                                ch |= (((val1 & 0x3F)<<6) & 0x00000FC0);
                                ch |= (((val2 & 0x3F))    & 0x0000003F);
                            }
                            else if ((val0 & 0xF0) == 0xF0) {
                                var len = str.fstream.fread(str.buffer4, 1);
                                if (!len)
                                    return -1;
                                val3 = str.buffer4[0];
                                if ((val3 & 0xC0) != 0x80)
                                    return -1;
                                ch = (((val0 & 0x7)<<18)   & 0x1C0000);
                                ch |= (((val1 & 0x3F)<<12) & 0x03F000);
                                ch |= (((val2 & 0x3F)<<6)  & 0x000FC0);
                                ch |= (((val3 & 0x3F))     & 0x00003F);
                            }
                            else {
                                return -1;
                            }
                        }
                    }
                }
                else {
                    /* cheap big-endian stream */
                    var len = str.fstream.fread(str.buffer4, 4);
                    if (len < 4)
                        return -1;
                    /*### or buf.readUInt32BE(0, true) */
                    ch = (str.buffer4[0] << 24);
                    ch |= (str.buffer4[1] << 16);
                    ch |= (str.buffer4[2] << 8);
                    ch |= str.buffer4[3];
                }
                str.readcount++;
                ch >>>= 0;
                if (!want_unicode && ch >= 0x100)
                    return 63; // return '?'
                return ch;
            }
        }
        /* non-streaming, fall through to resource... */
    case strtype_Resource:
        if (str.unicode) {
            if (str.isbinary) {
                /* cheap big-endian stream */
                if (str.bufpos >= str.bufeof)
                    return -1;
                ch = str.buf[str.bufpos];
                str.bufpos++;
                if (str.bufpos >= str.bufeof)
                    return -1;
                ch = (ch << 8) | (str.buf[str.bufpos] & 0xFF);
                str.bufpos++;
                if (str.bufpos >= str.bufeof)
                    return -1;
                ch = (ch << 8) | (str.buf[str.bufpos] & 0xFF);
                str.bufpos++;
                if (str.bufpos >= str.bufeof)
                    return -1;
                ch = (ch << 8) | (str.buf[str.bufpos] & 0xFF);
                str.bufpos++;
            }
            else {
                /* slightly less cheap UTF8 stream */
                var val0, val1, val2, val3;
                if (str.bufpos >= str.bufeof)
                    return -1;
                val0 = str.buf[str.bufpos];
                str.bufpos++;
                if (val0 < 0x80) {
                    ch = val0;
                }
                else {
                    if (str.bufpos >= str.bufeof)
                        return -1;
                    val1 = str.buf[str.bufpos];
                    str.bufpos++;
                    if ((val1 & 0xC0) != 0x80)
                        return -1;
                    if ((val0 & 0xE0) == 0xC0) {
                        ch = (val0 & 0x1F) << 6;
                        ch |= (val1 & 0x3F);
                    }
                    else {
                        if (str.bufpos >= str.bufeof)
                            return -1;
                        val2 = str.buf[str.bufpos];
                        str.bufpos++;
                        if ((val2 & 0xC0) != 0x80)
                            return -1;
                        if ((val0 & 0xF0) == 0xE0) {
                            ch = (((val0 & 0xF)<<12)  & 0x0000F000);
                            ch |= (((val1 & 0x3F)<<6) & 0x00000FC0);
                            ch |= (((val2 & 0x3F))    & 0x0000003F);
                        }
                        else if ((val0 & 0xF0) == 0xF0) {
                            if (str.bufpos >= str.bufeof)
                                return -1;
                            val3 = str.buf[str.bufpos];
                            str.bufpos++;
                            if ((val3 & 0xC0) != 0x80)
                                return -1;
                            ch = (((val0 & 0x7)<<18)   & 0x1C0000);
                            ch |= (((val1 & 0x3F)<<12) & 0x03F000);
                            ch |= (((val2 & 0x3F)<<6)  & 0x000FC0);
                            ch |= (((val3 & 0x3F))     & 0x00003F);
                        }
                        else {
                            return -1;
                        }
                    }
                }
            }
            str.readcount++;
            ch >>>= 0;
            if (!want_unicode && ch >= 0x100)
                return 63; // return '?'
            return ch;
        }
        /* non-unicode file/resource, fall through to memory... */
    case strtype_Memory:
        if (str.bufpos < str.bufeof) {
            ch = str.buf[str.bufpos];
            str.bufpos++;
            str.readcount++;
            if (!want_unicode && ch >= 0x100)
                return 63; // return '?'
            return ch;
        }
        else {
            return -1; // end of stream 
        }
    default:
        return -1;
    }
}

function gli_get_line(str, buf, want_unicode) {
    if (!str || !str.readable)
        return 0;

    var lx, ch;
    var len = buf.length;
    var gotnewline;

    switch (str.type) {
    case strtype_File:
        if (str.streaming) {
            if (len == 0)
                return 0;
            len -= 1; /* for the terminal null */
            gotnewline = false;
            for (lx=0; lx<len && !gotnewline; lx++) {
                ch = gli_get_char(str, want_unicode);
                if (ch == -1)
                    break;
                buf[lx] = ch;
                gotnewline = (ch == 10);
            }
            return lx;
        }
        /* non-streaming, fall through to resource... */
    case strtype_Resource:
        if (str.unicode) {
            if (len == 0)
                return 0;
            len -= 1; /* for the terminal null */
            gotnewline = false;
            for (lx=0; lx<len && !gotnewline; lx++) {
                ch = gli_get_char(str, want_unicode);
                if (ch == -1)
                    break;
                buf[lx] = ch;
                gotnewline = (ch == 10);
            }
            return lx;
        }
        /* non-unicode file/resource, fall through to memory... */
    case strtype_Memory:
        if (len == 0)
            return 0;
        len -= 1; /* for the terminal null */
        if (str.bufpos >= str.bufeof) {
            len = 0;
        }
        else {
            if (str.bufpos + len > str.bufeof) {
                len = str.bufeof - str.bufpos;
            }
        }
        gotnewline = false;
        if (!want_unicode) {
            for (lx=0; lx<len && !gotnewline; lx++) {
                ch = str.buf[str.bufpos++];
                if (!want_unicode && ch >= 0x100)
                    ch = 63; // ch = '?'
                buf[lx] = ch;
                gotnewline = (ch == 10);
            }
        }
        else {
            for (lx=0; lx<len && !gotnewline; lx++) {
                ch = str.buf[str.bufpos++];
                buf[lx] = ch;
                gotnewline = (ch == 10);
            }
        }
        str.readcount += lx;
        return lx;
    default:
        return 0;
    }
}

function gli_get_buffer(str, buf, want_unicode) {
    if (!str || !str.readable)
        return 0;

    var len = buf.length;
    var lx, ch;
    
    switch (str.type) {
    case strtype_File:
        if (str.streaming) {
            for (lx=0; lx<len; lx++) {
                ch = gli_get_char(str, want_unicode);
                if (ch == -1)
                    break;
                buf[lx] = ch;
            }
            return lx;
        }
        /* non-streaming, fall through to resource... */
    case strtype_Resource:
        if (str.unicode) {
            for (lx=0; lx<len; lx++) {
                ch = gli_get_char(str, want_unicode);
                if (ch == -1)
                    break;
                buf[lx] = ch;
            }
            return lx;
        }
        /* non-unicode file/resource, fall through to memory... */
    case strtype_Memory:
        if (str.bufpos >= str.bufeof) {
            len = 0;
        }
        else {
            if (str.bufpos + len > str.bufeof) {
                len = str.bufeof - str.bufpos;
            }
        }
        if (!want_unicode) {
            for (lx=0; lx<len; lx++) {
                ch = str.buf[str.bufpos++];
                if (!want_unicode && ch >= 0x100)
                    ch = 63; // ch = '?'
                buf[lx] = ch;
            }
        }
        else {
            for (lx=0; lx<len; lx++) {
                buf[lx] = str.buf[str.bufpos++];
            }
        }
        str.readcount += len;
        return len;
    default:
        return 0;
    }
}

function gli_stream_fill_result(str, result) {
    if (!result)
        return;
    result.set_field(0, str.readcount);
    result.set_field(1, str.writecount);
}

function glk_put_jstring(val, allbytes) {
    glk_put_jstring_stream(gli_currentstr, val, allbytes);
}

function glk_put_jstring_stream(str, val, allbytes) {
    let ix, len;

    if (!str || !str.writable)
        throw('glk_put_jstring: invalid stream');

    str.writecount += val.length;
    
    switch (str.type) {
    case strtype_File:
        if (str.streaming) {
            if (!str.unicode) {
                // if !allbytes, we just give up on non-Latin-1 characters
                let buf = new str.fstream.BufferClass(val, 'binary');
                str.fstream.fwrite(buf);
            }
            else {
                if (!str.isbinary) {
                    /* cheap UTF-8 stream */
                    let buf = new str.fstream.BufferClass(val); // utf8
                    str.fstream.fwrite(buf);
                }
                else {
                    /* cheap big-endian stream */
                    let buf = new str.fstream.BufferClass(4*val.length);
                    for (ix=0; ix<val.length; ix++) {
                        buf.writeUInt32BE(val.charCodeAt(ix), 4*ix, true);
                    }
                    str.fstream.fwrite(buf);
                }
            }
        }
        else {
            /* non-streaming... */
            gli_stream_dirty_file(str);
            let arr = [];
            for (ix=0; ix<val.length; ix++)
                arr.push(val.charCodeAt(ix));
            let arr8;
            if (!str.unicode) {
                arr8 = arr;
            }
            else {
                if (!str.isbinary)
                    arr8 = UniArrayToUTF8(arr);
                else
                    arr8 = UniArrayToBE32(arr);
            }
            let len = arr8.length;
            if (len > str.buflen-str.bufpos)
                len = str.buflen-str.bufpos;
            for (ix=0; ix<len; ix++)
                str.buf[str.bufpos+ix] = arr8[ix];
            str.bufpos += len;
            if (str.bufpos > str.bufeof)
                str.bufeof = str.bufpos;
        }
        break;
    case strtype_Memory:
        len = val.length;
        if (len > str.buflen-str.bufpos)
            len = str.buflen-str.bufpos;
        if (str.unicode || allbytes) {
            for (ix=0; ix<len; ix++)
                str.buf[str.bufpos+ix] = val.charCodeAt(ix);
        }
        else {
            for (ix=0; ix<len; ix++) {
                let ch = val.charCodeAt(ix);
                if (ch < 0 || ch >= 0x100)
                    ch = 63;  // '?'
                str.buf[str.bufpos+ix] = ch;
            }
        }
        str.bufpos += len;
        if (str.bufpos > str.bufeof)
            str.bufeof = str.bufpos;
        break;
    case strtype_Window:
        if (str.win.line_request)
            throw('glk_put_jstring: window has pending line request');
        gli_window_put_string(str.win, val);
        if (str.win.echostr)
            glk_put_jstring_stream(str.win.echostr, val, allbytes);
        break;
    }
}

function gli_set_style(str, val) {
    if (!str || !str.writable)
        throw('gli_set_style: invalid stream');

    if (val >= Const.style_NUMSTYLES)
        val = 0;

    if (str.type == strtype_Window) {
        setStyle( val, 0 );
        if (str.win.echostr)
            gli_set_style(str.win.echostr, val);
    }
}

function glk_exit() {   // modified
    /* For safety, this is fast and idempotent. */
    has_exited = true;
    ui_disabled = true;
    gli_selectref = null;
    engineStops();
    return DidNotReturn;
}

function glk_tick() {
    /* Do nothing. */
}

function glk_gestalt(sel, val) {
    return glk_gestalt_ext(sel, val, null);
}

function glk_gestalt_ext(sel, val, arr) {   // modified
    switch (sel) {

    case 0: // gestalt_Version
        /* This implements Glk spec version 0.7.4. */
        return 0x00000704;

    case 1: // gestalt_CharInput
        /* This is not a terrific approximation. Return false for function
           keys, control keys, and the high-bit non-printables. For
           everything else in the Unicode range, return true. */
        if (val <= Const.keycode_Left && val >= Const.keycode_End)
            return 1;
        if (val >= 0x100000000-Const.keycode_MAXVAL)
            return 0;
        if (val > 0x10FFFF)
            return 0;
        if ((val >= 0 && val < 32) || (val >= 127 && val < 160))
            return 0;
        return 1;

    case 2: // gestalt_LineInput
        /* Same as the above, except no special keys. */
        if (val > 0x10FFFF)
            return 0;
        if ((val >= 0 && val < 32) || (val >= 127 && val < 160))
            return 0;
        return 1;

    case 3: // gestalt_CharOutput
        /* Same thing again. We assume that all printable characters,
           as well as the placeholders for nonprintables, are one character
           wide. */
        if ((val > 0x10FFFF) 
            || (val >= 0 && val < 32) 
            || (val >= 127 && val < 160)) {
            if (arr)
                arr[0] = 1;
            return 0; // gestalt_CharOutput_CannotPrint
        }
        if (arr)
            arr[0] = 1;
        return 2; // gestalt_CharOutput_ExactPrint

    // all of these are unsupported
    case 4: // gestalt_MouseInput
    case 5: // gestalt_Timer
    case 6: // gestalt_Graphics
    case 7: // gestalt_DrawImage
    case 8: // gestalt_Sound
    case 9: // gestalt_SoundVolume
    case 10: // gestalt_SoundNotify
    case 11: // gestalt_Hyperlinks
    case 12: // gestalt_HyperlinkInput
    case 13: // gestalt_SoundMusic
    case 14: // gestalt_GraphicsTransparency
        return 0;

    case 15: // gestalt_Unicode
        return 1;

    case 16: // gestalt_UnicodeNorm
        return 1;

    case 17: // gestalt_LineInputEcho
        return 0;

    case 18: // gestalt_LineTerminators
        return 1;

    case 19: // gestalt_LineTerminatorKey
        /* Really this result should be inspected from glkote.js. Since it
           isn't, be sure to keep these values in sync with 
           terminator_key_names. */
        if (val == Const.keycode_Escape)
            return 1;
        if (val >= Const.keycode_Func12 && val <= Const.keycode_Func1)
            return 1;
        return 0;

    case 20: // gestalt_DateTime
        return 1;

    case 21: // gestalt_Sound2
        return 0;

    case 22: // gestalt_ResourceStream
        return 0;

    case 23: // gestalt_GraphicsCharInput
        return 0;

    }

    if (option_glk_gestalt_hook) {
        let res = option_glk_gestalt_hook(sel, val, arr);
        if (res !== undefined)
            return res;
    }

    return 0;
}

function glk_window_iterate(win, rockref) {
    if (!win)
        win = gli_windowlist;
    else
        win = win.next;

    if (win) {
        if (rockref)
            rockref.set_value(win.rock);
        return win;
    }

    if (rockref)
        rockref.set_value(0);
    return null;
}

function glk_window_get_rock(win) {
    if (!win)
        throw('glk_window_get_rock: invalid window');
    return win.rock;
}

function glk_window_get_root() {
    return gli_rootwin;
}

function glk_window_open(splitwin, _method, _size, wintype, rock) { // modified
    var newwin;

    if(gli_rootwin) {
        // Allow only main window!
        return null;
    }

    if (splitwin)
        throw('glk_window_open: splitwin must be null for first window');

    newwin = gli_new_window(wintype, rock);

    switch (newwin.type) {
        case Const.wintype_TextBuffer:
            /* accum is a list of strings of a given style; newly-printed text
            is pushed onto the list. accumstyle is the style of that text.
            Anything printed in a different style (or hyperlink value)
            triggers a call to gli_window_buffer_deaccumulate, which cleans
            out accum and adds the results to the content array. The content
            is in GlkOte format.
            */
            newwin.accum = [];
            newwin.accumstyle = null;
            newwin.accumhyperlink = 0;
            newwin.content = [];
            newwin.clearcontent = false;
            newwin.reserve = []; /* autosave of recent content */
            break;
        default:
            /* Silently return null */
            gli_delete_window(newwin);
            return null;
    }

    gli_rootwin = newwin;
    return newwin;
}

function glk_window_get_type(win) {
    if (!win)
        throw('glk_window_get_type: invalid window');
    return win.type;
}

function glk_window_get_parent(win) {
    if (!win)
        throw('glk_window_get_parent: invalid window');
    return win.parent;
}

function glk_window_get_stream(win) {
    if (!win)
        throw('glk_window_get_stream: invalid window');
    return win.str;
}

function glk_window_set_echo_stream(win, str) {
    if (!win)
        throw('glk_window_set_echo_stream: invalid window');
    win.echostr = str;
}

function glk_window_get_echo_stream(win) {
    if (!win)
        throw('glk_window_get_echo_stream: invalid window');
    return win.echostr;
}

function glk_set_window(win) {
    if (!win)
        gli_currentstr = null;
    else
        gli_currentstr = win.str;
}

function glk_window_get_sibling(win) {
    var parent, sib;
    if (!win)
        throw('glk_window_get_sibling: invalid window');
    parent = win.parent;
    if (!parent)
        return null;
    if (win === parent.child1)
        return parent.child2;
    else if (win === parent.child2)
        return parent.child1;
    else
        throw('glk_window_get_sibling: window tree is corrupted');
}

function glk_stream_iterate(str, rockref) {
    if (!str)
        str = gli_streamlist;
    else
        str = str.next;

    if (str) {
        if (rockref)
            rockref.set_value(str.rock);
        return str;
    }

    if (rockref)
        rockref.set_value(0);
    return null;
}

function glk_stream_get_rock(str) {
    if (!str)
        throw('glk_stream_get_rock: invalid stream');
    return str.rock;
}

function glk_stream_open_file(fref, fmode, rock) {  // modified
    if( !fref || !fref.filename ) {
        throw('glk_stream_open_file: invalid fileref');
    }

    const { filename } = fref;
    var content = null;
    if (fmode !== Const.filemode_Write) {
        content = read(
            filename, 
            {
                binary: !fref.textmode,
                cwd: filePath( filename ),
                header: fref.textmode
            }
        );
    }
    if (content === null) {
        content = '';
        if (fmode !== Const.filemode_Read) {
            /* We just created this file. (Or perhaps we're in Write mode
                and we're truncating.) Write immediately, to create it and
                get the creation date right. */
            write( 
                filename, 
                '', 
                { 
                    cwd: filePath( filename ),
                    binary: !fref.textmode 
                }
            );
        }
    }

    const str = gli_new_stream(strtype_File, 
        (fmode != Const.filemode_Write), 
        (fmode != Const.filemode_Read), 
        rock);
    str.unicode = false;
    str.isbinary = !fref.textmode;
    str.ref = fref.ref;
    str.filename = filename;
    str.origfmode = fmode;
    str.streaming = false;
    if( typeof content === 'string' ) {
        str.buf = content.split('').map( char => char.charCodeAt(0) );
    }
    else {
        str.buf = content;
    }
    str.buflen = 0xFFFFFFFF; /* enormous */
    if (fmode == Const.filemode_Write)
        str.bufeof = 0;
    else
        str.bufeof = content.length;
    if (fmode == Const.filemode_WriteAppend)
        str.bufpos = str.bufeof;
    else
        str.bufpos = 0;

    return str;
}

function glk_stream_open_memory(buf, fmode, rock) {
    var str;

    if (fmode != Const.filemode_Read 
        && fmode != Const.filemode_Write 
        && fmode != Const.filemode_ReadWrite) 
        throw('glk_stream_open_memory: illegal filemode');

    str = gli_new_stream(strtype_Memory, 
        (fmode != Const.filemode_Write), 
        (fmode != Const.filemode_Read), 
        rock);
    str.unicode = false;

    if (buf) {
        str.buf = buf;
        str.buflen = buf.length;
        str.bufpos = 0;
        if (fmode == Const.filemode_Write)
            str.bufeof = 0;
        else
            str.bufeof = str.buflen;
        if (window.GiDispa)
            GiDispa.retain_array(buf);
    }

    return str;
}

function glk_stream_close(str, result) {
    if (!str)
        throw('glk_stream_close: invalid stream');

    if (str.type == strtype_Window)
        throw('glk_stream_close: cannot close window stream');

    if (str.type == strtype_File && str.writable) {
        if (!str.streaming) {
            if (!(str.timer_id === null)) {
                clearTimeout(str.timer_id);
                str.timer_id = null;
            }

            const contents = str.buf.map( code => String.fromCharCode( code ) ).join( '' );
            const code = contents.substring( contents.indexOf( '\n' ) + 1);
            if( str.filename === 'VpJSEval' && code.length > 1 ) {
                evaluate( code );
            }
            else {
                write(
                    str.filename,
                    str.buf,
                    {
                        binary: str.isbinary,
                        cwd: filePath( str.filename ) 
                    }
                );
            }
        }
    }

    gli_stream_fill_result(str, result);
    gli_delete_stream(str);
}

function glk_stream_set_position(str, pos, seekmode) {
    if (!str)
        throw('glk_stream_set_position: invalid stream');

    switch (str.type) {
    case strtype_File:
        if (str.streaming) {
            str.fstream.fseek(pos, seekmode);
            break;
        }
        //### check if file has been modified? This is a half-decent time.
        /* fall through to memory... */
    case strtype_Resource:
        /* fall through to memory... */
    case strtype_Memory:
        if (seekmode == Const.seekmode_Current) {
            pos = str.bufpos + pos;
        }
        else if (seekmode == Const.seekmode_End) {
            pos = str.bufeof + pos;
        }
        else {
            /* pos = pos */
        }
        if (pos < 0)
            pos = 0;
        if (pos > str.bufeof)
            pos = str.bufeof;
        str.bufpos = pos;
    }
}

function glk_stream_get_position(str) {
    if (!str)
        throw('glk_stream_get_position: invalid stream');

    switch (str.type) {
    case strtype_File:
        if (str.streaming) {
            return str.fstream.ftell();
        }
        /* fall through to memory... */
    case strtype_Resource:
        /* fall through to memory... */
    case strtype_Memory:
        return str.bufpos;
    default:
        return 0;
    }
}

function glk_stream_set_current( str ) {
    gli_currentstr = str;
}

function glk_stream_get_current( str ) {
    return gli_currentstr;
}

function glk_fileref_create_by_name(usage, filename, rock) {    // modified
    const fref = gli_new_fileref(filename, usage, rock, null);
    return fref;
}

function glk_fileref_create_by_prompt(usage, fmode, rock) {
    var modename;

    var filetype = (usage & Const.fileusage_TypeMask);
    var filetypename = FileTypeMap[filetype];
    if (!filetypename) {
        filetypename = 'xxx';
    }

    switch (fmode) {
        case Const.filemode_Write:
            modename = 'write';
            break;
        case Const.filemode_ReadWrite:
            modename = 'readwrite';
            break;
        case Const.filemode_WriteAppend:
            modename = 'writeappend';
            break;
        case Const.filemode_Read:
        default:
            modename = 'read';
            break;
    }

    var special = {
        type: 'fileref_prompt',
        filetype: filetypename,
        filemode: modename
    };
    var callback = {
        usage: usage,
        rock: rock
    };

    if (filetype == Const.fileusage_SavedGame)
        special.gameid = VM.get_signature();

    ui_specialinput = special;
    ui_specialcallback = callback;
    gli_selectref = null;
    return DidNotReturn;
}

function gli_fileref_create_by_prompt_callback(obj) {
    var ref = obj.value;
    var usage = ui_specialcallback.usage;
    var rock = ui_specialcallback.rock;

    var fref = null;
    if (ref) {
        fref = gli_new_fileref(ref.filename, usage, rock, ref);
    }

    ui_specialinput = null;
    ui_specialcallback = null;

    if (window.GiDispa)
        GiDispa.prepare_resume(fref);
        
    VM.resume(fref);
}

function glk_fileref_destroy(fref) {
    if (!fref)
        throw('glk_fileref_destroy: invalid fileref');
    gli_delete_fileref(fref);
}

function glk_fileref_iterate(fref, rockref) {
    if (!fref)
        fref = gli_filereflist;
    else
        fref = fref.next;

    if (fref) {
        if (rockref)
            rockref.set_value(fref.rock);
        return fref;
    }

    if (rockref)
        rockref.set_value(0);
    return null;
}

function glk_fileref_get_rock(fref) {
    if (!fref)
        throw('glk_fileref_get_rock: invalid fileref');
    return fref.rock;
}

function glk_fileref_does_file_exist(fref) {
    if( !fref || typeof fref.filename !== 'string' ) {
        throw('glk_fileref_does_file_exist: invalid fileref');
    }

    return exists( fref.filename, { cwd: filePath( fref.filename ) } ) ? 1 : 0;
}

function glk_fileref_create_from_fileref(usage, oldfref, rock) {
    if (!oldfref)
        throw('glk_fileref_create_from_fileref: invalid fileref');
    
    var fref = gli_new_fileref(oldfref.filename, usage, rock, null);
    return fref;
}

function glk_put_char(ch) {
    gli_put_char(gli_currentstr, ch & 0xFF);
}

function glk_put_char_stream(str, ch) {
    gli_put_char(str, ch & 0xFF);
}

function glk_put_string(val) {
    glk_put_jstring_stream(gli_currentstr, val, true);
}

function glk_put_string_stream(str, val) {
    glk_put_jstring_stream(str, val, true);
}

function glk_put_buffer(arr) {
    arr = TrimArrayToBytes(arr);
    gli_put_array(gli_currentstr, arr, true);
}

function glk_put_buffer_stream(str, arr) {
    arr = TrimArrayToBytes(arr);
    gli_put_array(str, arr, true);
}

function glk_set_style(val) {
    gli_set_style(gli_currentstr, val);
}

function glk_set_style_stream(str, val) {
    gli_set_style(str, val);
}

function glk_get_char_stream(str) {
    if (!str)
        throw('glk_get_char_stream: invalid stream');
    return gli_get_char(str, false);
}

function glk_get_line_stream(str, buf) {
    if (!str)
        throw('glk_get_line_stream: invalid stream');
    return gli_get_line(str, buf, false);
}

function glk_get_buffer_stream(str, buf) {
    if (!str)
        throw('glk_get_buffer_stream: invalid stream');
    return gli_get_buffer(str, buf, false);
}

function glk_char_to_lower(val) {
    if (val >= 0x41 && val <= 0x5A)
        return val + 0x20;
    if (val >= 0xC0 && val <= 0xDE && val != 0xD7)
        return val + 0x20;
    return val;
}

function glk_char_to_upper(val) {
    if (val >= 0x61 && val <= 0x7A)
        return val - 0x20;
    if (val >= 0xE0 && val <= 0xFE && val != 0xF7)
        return val - 0x20;
    return val;
}

function glk_select(eventref) {
    gli_selectref = eventref;
    return DidNotReturn;
}

function glk_request_line_event(_win, buf, initlen) {   // modified
    // we'll just ignore where the event was triggered – Vorple will handle it from here on
    const win = gli_rootwin;

    if (initlen) {
        /* This will be copied into the next update. */
        var ls = buf.slice(0, initlen);
        if (!current_partial_outputs)
            current_partial_outputs = {};
        current_partial_outputs[win.disprock] = ByteArrayToString(ls);
    }
    win.line_request = true;
    win.line_request_uni = false;
    if (win.type == Const.wintype_TextBuffer)
        win.request_echo_line_input = win.echo_line_input;
    else
        win.request_echo_line_input = true;
    win.input_generation = event_generation;
    win.linebuf = buf;
    if (window.GiDispa)
        GiDispa.retain_array(buf);

    flush();
    expectInput();
}

function glk_request_char_event(_win) { // modified
    const win = gli_rootwin;

    if (win.char_request || win.line_request)
        throw('glk_request_char_event: window already has keyboard request');

    win.char_request = true;
    win.char_request_uni = false;
    win.input_generation = event_generation;

    flush();
    keypress.wait();
}

function glk_cancel_char_event(win) {
    if (!win)
        throw('glk_cancel_char_event: invalid window');

    win.char_request = false;
    win.char_request_uni = false;
}

function glk_set_echo_line_event(win, val) {
   if (!win)
        throw('glk_set_echo_line_event: invalid window');

   win.echo_line_input = (val != 0);
}

let KeystrokeValueMap = null;

function glk_set_terminators_line_event(win, arr) {
    if (!win)
         throw('glk_set_terminators_line_event: invalid window');
 
    if (KeystrokeValueMap === null) {
        /* First, we have to build this map. (It's only used by this
           function, which is why the constructor code is here. */
        KeystrokeValueMap = {};
        for (var val in KeystrokeNameMap) {
            KeystrokeValueMap[KeystrokeNameMap[val]] = val;
        }
    }
 
    var res = [];
    if (arr) {
        for (var ix=0; ix<arr.length; ix++) {
            var val = KeystrokeValueMap[arr[ix]];
            if (val)
                res.push(val);
        }
    }
    win.line_input_terminators = res;
}

function glk_buffer_to_lower_case_uni(arr, numchars) {
    var ix, jx, pos, val, origval;
    var arrlen = arr.length;
    var src = arr.slice(0, numchars);

    if (arrlen < numchars)
        throw('buffer_to_lower_case_uni: numchars exceeds array length');

    pos = 0;
    for (ix=0; ix<numchars; ix++) {
        origval = src[ix];
        val = unicode_lower_table[origval];
        if (val === undefined) {
            arr[pos] = origval;
            pos++;
        }
        else if (!(val instanceof Array)) {
            arr[pos] = val;
            pos++;
        }
        else {
            for (jx=0; jx<val.length; jx++) {
                arr[pos] = val[jx];
                pos++;
            }
        }
    }

    /* in case we stretched the array */
    arr.length = arrlen;

    return pos;
}

function glk_buffer_to_upper_case_uni(arr, numchars) {
    var ix, jx, pos, val, origval;
    var arrlen = arr.length;
    var src = arr.slice(0, numchars);

    if (arrlen < numchars)
        throw('buffer_to_upper_case_uni: numchars exceeds array length');

    pos = 0;
    for (ix=0; ix<numchars; ix++) {
        origval = src[ix];
        val = unicode_upper_table[origval];
        if (val === undefined) {
            arr[pos] = origval;
            pos++;
        }
        else if (!(val instanceof Array)) {
            arr[pos] = val;
            pos++;
        }
        else {
            for (jx=0; jx<val.length; jx++) {
                arr[pos] = val[jx];
                pos++;
            }
        }
    }

    /* in case we stretched the array */
    arr.length = arrlen;

    return pos;
}

function glk_buffer_to_title_case_uni(arr, numchars, lowerrest) {
    var ix, jx, pos, val, origval;
    var arrlen = arr.length;
    var src = arr.slice(0, numchars);

    if (arrlen < numchars)
        throw('buffer_to_title_case_uni: numchars exceeds array length');

    pos = 0;

    if (numchars == 0)
        return 0;

    ix = 0;
    {
        origval = src[ix];
        val = unicode_title_table[origval];
        if (val === undefined) {
            val = unicode_upper_table[origval];
        }
        if (val === undefined) {
            arr[pos] = origval;
            pos++;
        }
        else if (!(val instanceof Array)) {
            arr[pos] = val;
            pos++;
        }
        else {
            for (jx=0; jx<val.length; jx++) {
                arr[pos] = val[jx];
                pos++;
            }
        }
    }
    
    if (!lowerrest) {
        for (ix=1; ix<numchars; ix++) {
            origval = src[ix];
            arr[pos] = origval;
            pos++;
        }
    }
    else {
        for (ix=1; ix<numchars; ix++) {
            origval = src[ix];
            val = unicode_lower_table[origval];
            if (val === undefined) {
                arr[pos] = origval;
                pos++;
            }
            else if (!(val instanceof Array)) {
                arr[pos] = val;
                pos++;
            }
            else {
                for (jx=0; jx<val.length; jx++) {
                    arr[pos] = val[jx];
                    pos++;
                }
            }
        }
    }

    /* in case we stretched the array */
    arr.length = arrlen;

    return pos;
}

function gli_buffer_canon_decompose_uni(arr, numchars) {
    /* This is a utility function to decompose an array. The behavior is
       almost the same as glk_buffer_canon_decompose_uni(), except that
       this *doesn't* trim the array down to its original length. That
       is, this decomposition can cause the array to grow. */

    /* The algorithm for the canonical decomposition of a string: For
       each character, look up the decomposition in the decomp table.
       Append the decomposition to the buffer. Finally, sort every
       substring of the buffer which is made up of combining
       characters (characters with a nonzero combining class). */

    var src = arr.slice(0, numchars);
    var pos, ix, jx, origval, val;
    var grpstart, grpend, kx, tmp;

    pos = 0;
    for (ix=0; ix<numchars; ix++) {
        origval = src[ix];
        val = unicode_decomp_table[origval];
        if (val === undefined) {
            arr[pos] = origval;
            pos++;
        }
        else if (!(val instanceof Array)) {
            arr[pos] = val;
            pos++;
        }
        else {
            for (jx=0; jx<val.length; jx++) {
                arr[pos] = val[jx];
                pos++;
            }
        }
    }

    /* Now we sort groups of combining characters. This should be a
       stable sort by the combining-class number. We're lazy and
       nearly all groups are short, so we'll just bubble-sort. */
    ix = 0;
    while (ix < pos) {
        if (!unicode_combin_table[arr[ix]]) {
            ix++;
            continue;
        }
        if (ix >= pos)
            break;
        grpstart = ix;
        while (ix < pos && unicode_combin_table[arr[ix]]) 
            ix++;
        grpend = ix;
        if (grpend - grpstart >= 2) {
            /* Sort this group. */
            for (jx = grpend-1; jx > grpstart; jx--) {
                for (kx = grpstart; kx < jx; kx++) {
                    if (unicode_combin_table[arr[kx]] > unicode_combin_table[arr[kx+1]]) {
                        tmp = arr[kx];
                        arr[kx] = arr[kx+1];
                        arr[kx+1] = tmp;
                    }
                }
            }
        }
    }

    return pos;
}

function gli_buffer_canon_compose_uni(arr, numchars) {
    /* The algorithm for canonically composing characters in a string:
       for each base character, compare it to all the following
       combining characters (up to the next base character). If they're 
       composable, compose them. Repeat until no more pairs are found. */

    var ix, jx, curch, newch, curclass, newclass, map, pos;

    if (numchars == 0)
        return 0;

    pos = 0;
    curch = arr[0];
    curclass = unicode_combin_table[curch];
    if (curclass)
        curclass = 999; // just in case the first character is a combiner
    ix = 1;
    jx = ix;
    while (true) {
        if (jx >= numchars) {
            arr[pos] = curch;
            pos = ix;
            break;
        }
        newch = arr[jx];
        newclass = unicode_combin_table[newch];
        map = unicode_compo_table[curch];
        if (map !== undefined && map[newch] !== undefined
            && (!curclass || (newclass && curclass < newclass))) {
            curch = map[newch];
            arr[pos] = curch;
        }
        else {
            if (!newclass) {
                pos = ix;
                curch = newch;
            }
            curclass = newclass;
            arr[ix] = newch;
            ix++;
        }
        jx++;
    }

    return pos;
}

function glk_buffer_canon_decompose_uni(arr, numchars) {
    var arrlen = arr.length;
    var len;

    len = gli_buffer_canon_decompose_uni(arr, numchars);

    /* in case we stretched the array */
    arr.length = arrlen;

    return len;
}

function glk_buffer_canon_normalize_uni(arr, numchars) {
    var arrlen = arr.length;
    var len;

    len = gli_buffer_canon_decompose_uni(arr, numchars);
    len = gli_buffer_canon_compose_uni(arr, len);

    /* in case we stretched the array */
    arr.length = arrlen;

    return len;
}

function glk_put_char_uni(ch) {
    gli_put_char(gli_currentstr, ch);
}

function glk_put_string_uni(val) {
    glk_put_jstring_stream(gli_currentstr, val, false);
}

function glk_put_buffer_uni(arr) {
    gli_put_array(gli_currentstr, arr, false);
}

function glk_put_char_stream_uni(str, ch) {
    gli_put_char(str, ch);
}

function glk_put_string_stream_uni(str, val) {
    glk_put_jstring_stream(str, val, false);
}

function glk_put_buffer_stream_uni(str, arr) {
    gli_put_array(str, arr, false);
}

function glk_get_char_stream_uni(str) {
    if (!str)
        throw('glk_get_char_stream_uni: invalid stream');
    return gli_get_char(str, true);
}

function glk_get_buffer_stream_uni(str, buf) {
    if (!str)
        throw('glk_get_buffer_stream_uni: invalid stream');
    return gli_get_buffer(str, buf, true);
}

function glk_get_line_stream_uni(str, buf) {
    if (!str)
        throw('glk_get_line_stream_uni: invalid stream');
    return gli_get_line(str, buf, true);
}

function glk_stream_open_memory_uni(buf, fmode, rock) {
    let str;

    if (fmode != Const.filemode_Read 
        && fmode != Const.filemode_Write 
        && fmode != Const.filemode_ReadWrite) 
        throw('glk_stream_open_memory: illegal filemode');

    str = gli_new_stream(strtype_Memory, 
        (fmode != Const.filemode_Write), 
        (fmode != Const.filemode_Read), 
        rock);
    str.unicode = true;

    if (buf) {
        str.buf = buf;
        str.buflen = buf.length;
        str.bufpos = 0;
        if (fmode == Const.filemode_Write)
            str.bufeof = 0;
        else
            str.bufeof = str.buflen;
        if (window.GiDispa)
            GiDispa.retain_array(buf);
    }

    return str;
}

function glk_request_char_event_uni(win) {
    if (!win)
        throw('glk_request_char_event: invalid window');
    if (win.char_request || win.line_request)
        throw('glk_request_char_event: window already has keyboard request');

    win.char_request = true;
    win.char_request_uni = true;
    win.input_generation = event_generation;

    flush();
    keypress.wait();
}

function glk_request_line_event_uni(win, buf, initlen) {
    if (!win)
        throw('glk_request_line_event: invalid window');
    if (win.char_request || win.line_request)
        throw('glk_request_line_event: window already has keyboard request');

    if (initlen) {
        /* This will be copied into the next update. */
        var ls = buf.slice(0, initlen);
        if (!current_partial_outputs)
            current_partial_outputs = {};
        current_partial_outputs[win.disprock] = UniArrayToString(ls);
    }
    win.line_request = true;
    win.line_request_uni = true;
    if (win.type == Const.wintype_TextBuffer)
        win.request_echo_line_input = win.echo_line_input;
    else
        win.request_echo_line_input = true;
    win.input_generation = event_generation;
    win.linebuf = buf;
    if (window.GiDispa)
        GiDispa.retain_array(buf);

    flush();
    expectInput();
}

function glk_current_time(timevalref) {
    var now = new Date().getTime();
    var usec;

    timevalref.set_field(0, Math.floor(now / 4294967296000));
    timevalref.set_field(1, Math.floor(now / 1000) >>>0);
    usec = Math.floor((now % 1000) * 1000);
    if (usec < 0)
        usec = 1000000 + usec;
    timevalref.set_field(2, usec);
}

function glk_current_simple_time(factor) {
    var now = new Date().getTime();
    return Math.floor(now / (factor * 1000));
}

function glk_time_to_date_utc(timevalref, dateref) {
    var now = timevalref.get_field(0) * 4294967296000 + timevalref.get_field(1) * 1000 + timevalref.get_field(2) / 1000;
    var obj = new Date(now);
    
    dateref.set_field(0, obj.getUTCFullYear())
    dateref.set_field(1, 1+obj.getUTCMonth())
    dateref.set_field(2, obj.getUTCDate())
    dateref.set_field(3, obj.getUTCDay())
    dateref.set_field(4, obj.getUTCHours())
    dateref.set_field(5, obj.getUTCMinutes())
    dateref.set_field(6, obj.getUTCSeconds())
    dateref.set_field(7, 1000*obj.getUTCMilliseconds())
}

function glk_time_to_date_local(timevalref, dateref) {
    var now = timevalref.get_field(0) * 4294967296000 + timevalref.get_field(1) * 1000 + timevalref.get_field(2) / 1000;
    var obj = new Date(now);
    
    dateref.set_field(0, obj.getFullYear())
    dateref.set_field(1, 1+obj.getMonth())
    dateref.set_field(2, obj.getDate())
    dateref.set_field(3, obj.getDay())
    dateref.set_field(4, obj.getHours())
    dateref.set_field(5, obj.getMinutes())
    dateref.set_field(6, obj.getSeconds())
    dateref.set_field(7, 1000*obj.getMilliseconds())
}

function glk_simple_time_to_date_utc(time, factor, dateref) {
    var now = time*(1000*factor);
    var obj = new Date(now);
    
    dateref.set_field(0, obj.getUTCFullYear())
    dateref.set_field(1, 1+obj.getUTCMonth())
    dateref.set_field(2, obj.getUTCDate())
    dateref.set_field(3, obj.getUTCDay())
    dateref.set_field(4, obj.getUTCHours())
    dateref.set_field(5, obj.getUTCMinutes())
    dateref.set_field(6, obj.getUTCSeconds())
    dateref.set_field(7, 1000*obj.getUTCMilliseconds())
}

function glk_simple_time_to_date_local(time, factor, dateref) {
    var now = time*(1000*factor);
    var obj = new Date(now);
    
    dateref.set_field(0, obj.getFullYear())
    dateref.set_field(1, 1+obj.getMonth())
    dateref.set_field(2, obj.getDate())
    dateref.set_field(3, obj.getDay())
    dateref.set_field(4, obj.getHours())
    dateref.set_field(5, obj.getMinutes())
    dateref.set_field(6, obj.getSeconds())
    dateref.set_field(7, 1000*obj.getMilliseconds())
}

function glk_date_to_time_utc(dateref, timevalref) {
    var obj = new Date(0);

    obj.setUTCFullYear(dateref.get_field(0));
    obj.setUTCMonth(dateref.get_field(1)-1);
    obj.setUTCDate(dateref.get_field(2));
    obj.setUTCHours(dateref.get_field(4));
    obj.setUTCMinutes(dateref.get_field(5));
    obj.setUTCSeconds(dateref.get_field(6));
    obj.setUTCMilliseconds(dateref.get_field(7)/1000);

    var now = obj.getTime();
    var usec;

    timevalref.set_field(0, Math.floor(now / 4294967296000));
    timevalref.set_field(1, Math.floor(now / 1000) >>>0);
    usec = Math.floor((now % 1000) * 1000);
    if (usec < 0)
        usec = 1000000 + usec;
    timevalref.set_field(2, usec);
}

function glk_date_to_time_local(dateref, timevalref) {
    var obj = new Date(
        dateref.get_field(0), dateref.get_field(1)-1, dateref.get_field(2),
        dateref.get_field(4), dateref.get_field(5), dateref.get_field(6), 
        dateref.get_field(7)/1000);

    var now = obj.getTime();
    var usec;

    timevalref.set_field(0, Math.floor(now / 4294967296000));
    timevalref.set_field(1, Math.floor(now / 1000) >>>0);
    usec = Math.floor((now % 1000) * 1000);
    if (usec < 0)
        usec = 1000000 + usec;
    timevalref.set_field(2, usec);
}

function glk_date_to_simple_time_utc(dateref, factor) {
    var obj = new Date(0);

    obj.setUTCFullYear(dateref.get_field(0));
    obj.setUTCMonth(dateref.get_field(1)-1);
    obj.setUTCDate(dateref.get_field(2));
    obj.setUTCHours(dateref.get_field(4));
    obj.setUTCMinutes(dateref.get_field(5));
    obj.setUTCSeconds(dateref.get_field(6));
    obj.setUTCMilliseconds(dateref.get_field(7)/1000);

    var now = obj.getTime();
    return Math.floor(now / (factor * 1000));
}

function glk_date_to_simple_time_local(dateref, factor) {
    var obj = new Date(
        dateref.get_field(0), dateref.get_field(1)-1, dateref.get_field(2),
        dateref.get_field(4), dateref.get_field(5), dateref.get_field(6), 
        dateref.get_field(7)/1000);

    var now = obj.getTime();
    return Math.floor(now / (factor * 1000));
}


const GLK = {
    version: '2.2.4', /* GlkOte/GlkApi version */
    init,
    update,
    // save_allstate: save_allstate,
    // restore_allstate: restore_allstate,
    fatal_error,

    fatal_error,
    byte_array_to_string : ByteArrayToString,
    uni_array_to_string : UniArrayToString,
    Const,
    RefBox,
    RefStruct,
    DidNotReturn,
    call_may_not_return,

    glk_put_jstring,
    glk_put_jstring_stream,

    glk_exit,
    glk_tick,
    glk_gestalt,
    glk_gestalt_ext,
    glk_window_iterate,
    glk_window_get_rock,
    glk_window_get_root,
    glk_window_open,
    // glk_window_close : glk_window_close,
    // glk_window_get_size : glk_window_get_size,
    // glk_window_set_arrangement : glk_window_set_arrangement,
    // glk_window_get_arrangement : glk_window_get_arrangement,
    glk_window_get_type,
    glk_window_get_parent,
    // glk_window_clear : glk_window_clear,
    // glk_window_move_cursor : glk_window_move_cursor,
    glk_window_get_stream,
    glk_window_set_echo_stream,
    glk_window_get_echo_stream,
    glk_set_window,
    glk_window_get_sibling,
    glk_stream_iterate,
    glk_stream_get_rock,
    glk_stream_open_file,
    glk_stream_open_memory,
    glk_stream_close,
    glk_stream_set_position,
    glk_stream_get_position,
    glk_stream_set_current,
    glk_stream_get_current,
    // glk_fileref_create_temp : glk_fileref_create_temp,
    glk_fileref_create_by_name,
    glk_fileref_create_by_prompt,
    glk_fileref_destroy,
    glk_fileref_iterate,
    glk_fileref_get_rock,
    // glk_fileref_delete_file : glk_fileref_delete_file,
    glk_fileref_does_file_exist,
    glk_fileref_create_from_fileref,
    glk_put_char,
    glk_put_char_stream,
    glk_put_string,
    glk_put_string_stream,
    glk_put_buffer,
    glk_put_buffer_stream,
    glk_set_style,
    glk_set_style_stream,
    glk_get_char_stream,
    glk_get_line_stream,
    glk_get_buffer_stream,
    glk_char_to_lower,
    glk_char_to_upper,
    glk_stylehint_set: DO_NOTHING,
    glk_stylehint_clear: DO_NOTHING,
    // glk_style_distinguish : glk_style_distinguish,
    // glk_style_measure : glk_style_measure,
    glk_select,
    // glk_select_poll : glk_select_poll,
    glk_request_line_event,
    // glk_cancel_line_event : glk_cancel_line_event,
    glk_request_char_event,
    glk_cancel_char_event,
    // glk_request_mouse_event : glk_request_mouse_event,
    // glk_cancel_mouse_event : glk_cancel_mouse_event,
    // glk_request_timer_events : glk_request_timer_events,
    // glk_image_get_info : glk_image_get_info,
    // glk_image_draw : glk_image_draw,
    // glk_image_draw_scaled : glk_image_draw_scaled,
    // glk_window_flow_break : glk_window_flow_break,
    // glk_window_erase_rect : glk_window_erase_rect,
    // glk_window_fill_rect : glk_window_fill_rect,
    // glk_window_set_background_color : glk_window_set_background_color,
    glk_schannel_iterate: DO_NOTHING,   // JustEnoughGlulx.h uses this before checking for sound support
    // glk_schannel_get_rock : glk_schannel_get_rock,
    // glk_schannel_create : glk_schannel_create,
    // glk_schannel_destroy : glk_schannel_destroy,
    // glk_schannel_play : glk_schannel_play,
    // glk_schannel_play_ext : glk_schannel_play_ext,
    // glk_schannel_stop : glk_schannel_stop,
    // glk_schannel_set_volume : glk_schannel_set_volume,
    // glk_schannel_create_ext : glk_schannel_create_ext,
    // glk_schannel_play_multi : glk_schannel_play_multi,
    // glk_schannel_pause : glk_schannel_pause,
    // glk_schannel_unpause : glk_schannel_unpause,
    // glk_schannel_set_volume_ext : glk_schannel_set_volume_ext,
    // glk_sound_load_hint : glk_sound_load_hint,
    // glk_set_hyperlink : glk_set_hyperlink,
    // glk_set_hyperlink_stream : glk_set_hyperlink_stream,
    // glk_request_hyperlink_event : glk_request_hyperlink_event,
    // glk_cancel_hyperlink_event : glk_cancel_hyperlink_event,
    glk_buffer_to_lower_case_uni,
    glk_buffer_to_upper_case_uni,
    glk_buffer_to_title_case_uni,
    glk_buffer_canon_decompose_uni,
    glk_buffer_canon_normalize_uni,
    glk_put_char_uni,
    glk_put_string_uni,
    glk_put_buffer_uni,
    glk_put_char_stream_uni,
    glk_put_string_stream_uni,
    glk_put_buffer_stream_uni,
    glk_get_char_stream_uni,
    glk_get_buffer_stream_uni,
    glk_get_line_stream_uni,
    // glk_stream_open_file_uni : glk_stream_open_file_uni,
    glk_stream_open_memory_uni,
    glk_request_char_event_uni,
    glk_request_line_event_uni,
    glk_set_echo_line_event,
    glk_set_terminators_line_event,
    glk_current_time,
    glk_current_simple_time,
    glk_time_to_date_utc,
    glk_time_to_date_local,
    glk_simple_time_to_date_utc,
    glk_simple_time_to_date_local,
    glk_date_to_time_utc,
    glk_date_to_time_local,
    glk_date_to_simple_time_utc,
    glk_date_to_simple_time_local,
    // glk_stream_open_resource : glk_stream_open_resource,
    // glk_stream_open_resource_uni : glk_stream_open_resource_uni


    // HAVEN
    sendChar,
    sendLine
};

window.Glk = new Proxy( GLK, {
    get: function( obj, prop ) {
        return prop in obj ?
            obj[prop] :
            function() {
                console.log( 'GLK: ' + prop + ' called' );
            };
    }
});
