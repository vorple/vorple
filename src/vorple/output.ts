/**
 * Output filter methods.
 *
 * @module output
 * @since 3.2.0
 */

export interface FilterMeta {
    output: string;
    original: string;
    style: {
        bold: boolean;
        italic: boolean;
    }
}

export type OutputFilter = ( input: string, meta: FilterMeta ) => boolean;

const outputFilters: OutputFilter[] = [];


/**
 * Registers a new output filter.
 *
 * @param {function} filter
 * @returns {function} A function that can be called to remove the filter
 */
export function addOutputFilter( filter ) {
    outputFilters.push( filter );
    return (): boolean => removeOutputFilter( filter );
}


/**
 * Runs output through all output filters.
 *
 * @param {string} originalOutput
 * @private
 */
export function applyOutputFilters( originalOutput, meta ) {
    let finalOutput = originalOutput;

    for( let i = 0; i < outputFilters.length; ++i ) {
        const filtered = outputFilters[ i ]( finalOutput, {
            ...meta,
            output: finalOutput,
            original: originalOutput
        });

        // a filter that returns false breaks the chain
        if( filtered === false ) {
            break;
        }

        if( typeof filtered === "string" ) {
            finalOutput = filtered;
        }
    }

    return finalOutput;
}


/**
 * Removes a filter from the registered output filters.
 *
 * @param {function} filter The filter to remove
 */
export function removeOutputFilter( filter ) {
    const index = outputFilters.indexOf( filter );

    if( index === -1 ) {
        return false;
    }

    outputFilters.splice( index, 1 );
    return true;
}

