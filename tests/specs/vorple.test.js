const { expect } = require( "chai" );

const VERSION = require( "../../package.json" ).version;
const getVorple = require( "../utility" ).getVorple;
const vorple = require( "../utility" ).vorple;

describe( "Core library", () => {
    describe( "version", () => {
        it( "is exposed", () => {
            expect( getVorple().version ).to.equal( VERSION );
        });
    });

    describe( "requireVersion", () => {
        it( "returns true for lower or equal versions", () => {
            const [ major, minor, patch ] = getVorple().version.split( '.' ).map( str => +str );

            let lowerVersions = [
                [ 1, 0, 0 ],
                [ major ],
                [ major, minor ],
                [ major, minor, patch ],
                [ major - 1, minor, patch ],
                [ major, Math.max( minor - 1, 0 ), patch ],
                [ major, minor, Math.max( patch - 1, 0 ) ],
                [ major, minor - 1 ],
                [ major - 1 ],
                [ major - 1, minor ],
                [ major - 1, Math.max( minor - 1, 0 ), Math.max( patch - 1, 0 ) ]
            ];

            lowerVersions.forEach( test => expect( vorple( null, "requireVersion", test.join( "." ) ) ).to.be.true );
        });

        it( "throws an error for higher versions", () => {
            const [ major, minor, patch ] = getVorple().version.split( '.' ).map( str => +str );

            let lowerVersions = [
                [ 10, 0, 0 ],
                [ 9999, 9999, 9999 ],
                [ major + 1, minor + 1, patch + 1 ],
                [ major + 1, minor + 1 ],
                [ major + 1 ],
                [ major + 1, minor, patch + 1 ],
                [ major, minor + 1 ],
                [ major, minor, patch + 1 ],
            ];

            lowerVersions.forEach( test => {
                try {
                    expect( vorple( null, "requireVersion", test.join( "." ) ) ).to.throw();
                }
                catch( e ) {}
            });
        });
    });
});