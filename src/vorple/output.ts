/**
 * Output filter methods.
 *
 * @module output
 * @since 3.2.0
 */

export interface OutputFilterMeta {
    /**
     * The current output.
     */
    output: string;

    /**
     * The original output before it went through the filters.
     */
    original: string;

    /**
     * Style information: whether the output will be printed bold and/or italic.
     */
    style: {
        bold: boolean;
        italic: boolean;
    }
}

export type OutputFilter = ( input: string, meta: OutputFilterMeta ) => boolean;

const outputFilters: OutputFilter[] = [];


/**
 * Registers a new output filter.
 *
 * @param filter  The output filter to add.
 * @returns  A function that can be called to remove the filter
 *
 * @see https://vorple-if.com/docs/filters.html
 */
export function addOutputFilter( filter: OutputFilter ): () => boolean {
    outputFilters.push( filter );
    return (): boolean => removeOutputFilter( filter );
}


/**
 * Runs output through all output filters.
 *
 * @param originalOutput  The original output
 * @internal
 */
export function applyOutputFilters( originalOutput: string, meta: OutputFilterMeta ): string {
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
 * @param filter  A reference to the filter to remove
 * @returns Returns true if the filter was removed, false if the filter wasn't registered.
 */
export function removeOutputFilter( filter: OutputFilter ): boolean {
    const index = outputFilters.indexOf( filter );

    if( index === -1 ) {
        return false;
    }

    outputFilters.splice( index, 1 );
    return true;
}

