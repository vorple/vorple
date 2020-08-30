const assert = require( "chai" ).expect;
const { vorple, waitForLineInput } = require( "../utility" );

before(() => {
    waitForLineInput();
});

describe( "Virtual filesystem", () => {
    const contents = "Test file " + new Date();

    describe( "copy", () => {
        it( "copies a file to another directory", () => {
            vorple( "file", "write", "copytest", contents );
            vorple( "file", "mkdir", "/copytarget" );
            assert( vorple( "file", "copy", "copytest", "/copytarget" ) ).to.be.true;
            assert( vorple( "file", "exists", "copytest" ) ).to.be.true;
            assert( vorple( "file", "exists", "/copytarget/copytest" ) ).to.be.true;
        });

        it( "copies to a new name", () => {
            vorple( "file", "write", "copyAndRenameMe", contents );
            assert( vorple( "file", "copy", "copyAndRenameMe", "copyAndRenameTo" ) ).to.be.true;
            assert( vorple( "file", "exists", "copyAndRenameMe" ) ).to.be.true;
            assert( vorple( "file", "exists", "copyAndRenameTo" ) ).to.be.true;
        });

        it( "overwrites files", () => {
            vorple( "file", "write", "overwriter", "source" );
            vorple( "file", "write", "victim", "target" );
            assert( vorple( "file", "copy", "overwriter", "victim" ) ).to.be.true;
            assert( vorple( "file", "exists", "overwriter" ) ).to.be.true;
            assert( vorple( "file", "exists", "victim" ) ).to.be.true;
            assert( vorple( "file", "read", "victim" ) ).to.equal( "source" );
        });

        it( "doesn't overwrite files if asked not to", () => {
            vorple( "file", "write", "copier", "source" );
            vorple( "file", "write", "blocker", "target" );
            assert( vorple( "file", "copy", "copier", "blocker", { replace: false } ) ).to.be.false;
            assert( vorple( "file", "exists", "copier" ) ).to.be.true;
            assert( vorple( "file", "exists", "blocker" ) ).to.be.true;
            assert( vorple( "file", "read", "blocker" ) ).to.equal( "target" );
        });

        it( "doesn't copy directories", () => {
            vorple( "file", "mkdir", "copytestdir" );
            vorple( "file", "mkdir", "/copytarget" );
            assert( vorple( "file", "copy", "copytestdir", "/copytarget" ) ).to.be.false;
            assert( vorple( "file", "exists", "copytestdir" ) ).to.be.true;
            assert( vorple( "file", "exists", "/copytarget/copytestdir" ) ).to.be.false;
        });
    });

    describe( "exists", () => {
        it( "finds existing files", () => {
            assert( vorple( "file", "exists", "/vorple/VpHndshk" ) ).to.be.true;
            assert( vorple( "file", "exists", "VpHndshk", { cwd: "/vorple" } ) ).to.be.true;
        });

        it( "doesn't find non-existing files", () => {
            assert( vorple( "file", "exists", "doesntexist" ) ).to.be.false;
        });
    });

    describe( "getFS", () => {
        it( "returns the fs object", () => {
            waitForLineInput();
            assert( browser.execute( () => typeof vorple.file.getFS().FS ) ).to.equal( "function" );
        })
    });

    describe( "info", () => {
        it( "returns file data", () => {
            const expectedData = {
                contents: "* //VORPLE// infotest.txt\n" + contents,
                directory: "/inform",
                header: {
                    project: "VORPLE",
                    ready: true
                },
                isDirectory: false,
                name: "infotest.txt",
                path: "/inform/infotest.txt"
            };

            vorple( "file", "write", "infotest.txt", contents );
            assert( vorple( "file", "info", "infotest.txt" ) ).to.deep.include( expectedData );
        });

        it( "returns directory data", () => {
            const expectedData = {
                contents: [ "test1" ],
                directory: "/inform",
                header: null,
                isDirectory: true,
                name: "infodir",
                path: "/inform/infodir"
            };

            vorple( "file", "mkdir", "infodir" );
            vorple( "file", "write", "infodir/test1", contents );
            assert( vorple( "file", "info", "infodir" ) ).to.deep.include( expectedData );
        });

        it( "returns null for non-existing file", () => {
            assert( vorple( "file", "info", "doesntexist" ) ).to.be.null;
        })
    });

    describe( "informHeader", () => {
        it( "returns the correct header", () => {
            assert( vorple( "file", "informHeader", "TEST", "foo.txt" ) ).to.equal( "* //TEST// foo.txt\n" );
            assert( vorple( "file", "informHeader", "TEST", "/sub/dir/foo.txt" ) ).to.equal( "* //TEST// foo.txt\n" );
        });

        it( "can mark files not ready", () => {
            assert( vorple( "file", "informHeader", "TEST", "foo.txt", false ) ).to.equal( "- //TEST// foo.txt\n" );
        });
    });

    describe( "init", () => {
        it( "creates the basic directory structure", () => {
            const dirs = [ "inform", "tmp", "vorple" ];
            assert( vorple( "file", "readdir", "/" ) ).to.include.members( dirs );
        });

        it( "can be called multiple times", () => {
            assert( vorple( "file", "init" ) ).to.not.throw;
            assert( vorple( "file", "init" ) ).to.not.throw;
        });

        it( "creates the handshake file", () => {
            assert( vorple( "file", "exists", "/vorple/VpHndshk" ) ).to.be.true;
        });
    });

    describe( "isReady", () => {
        it( "newly created files are ready", () => {
            vorple( "file", "write", "defaultReady.txt", contents );
            assert( vorple( "file", "isReady", "defaultReady.txt" ) ).to.be.true;

            // manual double check
            const text = browser.execute( () => vorple.file.getFS().readFileSync( "/inform/defaultReady.txt" ) );
            // Firefox and Chrome return different data structure!
            assert( text.data ? text.data[ 0 ] : text[ 0 ] ).to.equal( "*".charCodeAt( 0 ) );
        });

        it( "newly created files with ready flag false are not ready", () => {
            vorple( "file", "write", "defaultNotReady.txt", contents, { ready: false } );
            assert( vorple( "file", "isReady", "defaultNotReady.txt" ) ).to.be.false;

            // manual double check
            const text = browser.execute( () => vorple.file.getFS().readFileSync( "/inform/defaultNotReady.txt" ) );
            assert( text.data ? text.data[ 0 ] : text[ 0 ] ).to.equal( "-".charCodeAt( 0 ) );
        });
    });

    describe( "markReady", () => {
        it( "changes ready files to not ready", () => {
            vorple( "file", "write", "changeReady.txt", contents, { ready: true } );
            assert( vorple( "file", "isReady", "changeReady.txt" ) ).to.be.true;
            assert( vorple( "file", "markReady", "changeReady.txt", false ) ).to.be.true;
            assert( vorple( "file", "isReady", "changeReady.txt" ) ).to.be.false;
        });

        it( "changes not ready files to ready", () => {
            vorple( "file", "write", "changeReady.txt", contents, { ready: false } );
            assert( vorple( "file", "isReady", "changeReady.txt" ) ).to.be.false;
            assert( vorple( "file", "markReady", "changeReady.txt", true ) ).to.be.true;
            assert( vorple( "file", "isReady", "changeReady.txt" ) ).to.be.true;
        });

        it( "doesn't change status if already correct", () => {
            vorple( "file", "write", "changeReady.txt", contents, { ready: true } );
            assert( vorple( "file", "isReady", "changeReady.txt" ) ).to.be.true;
            vorple( "file", "markReady", "changeReady.txt", true );
            assert( vorple( "file", "isReady", "changeReady.txt" ) ).to.be.true;

            vorple( "file", "write", "changeReady.txt", contents, { ready: false } );
            assert( vorple( "file", "isReady", "changeReady.txt" ) ).to.be.false;
            vorple( "file", "markReady", "changeReady.txt", false );
            assert( vorple( "file", "isReady", "changeReady.txt" ) ).to.be.false;
        });
    });

    describe( "mkdir", () => {
        it( "creates a new directory", () => {
            assert( vorple( "file", "mkdir", "testDir" ) ).to.be.true;
            assert( vorple( "file", "exists", "testDir" ) ).to.be.true;

            assert( vorple( "file", "mkdir", "testDir", { cwd: "/" } ) ).to.be.true;
            assert( vorple( "file", "exists", "/testDir" ) ).to.be.true;
        });

        it( "doesn't create nested directories", () => {
            assert( vorple( "file", "mkdir", "/foo/bar/testDir" ) ).to.be.false;
            assert( vorple( "file", "exists", "/foo/bar/testDir" ) ).to.be.false;
        });

        it( "doesn't overwrite files", () => {
            assert( vorple( "file", "exists", "testDir" ) ).to.be.true; // exists before...
            assert( vorple( "file", "mkdir", "testDir" ) ).to.be.false;
            assert( vorple( "file", "exists", "testDir" ) ).to.be.true; // ...and after

            assert( vorple( "file", "exists", "/vorple/VpHndshk" ) ).to.be.true; // exists before...
            assert( vorple( "file", "mkdir", "/vorple/VpHndshk" ) ).to.be.false;
            assert( vorple( "file", "exists", "/vorple/VpHndshk" ) ).to.be.true; // ...and after
        });
    });

    describe( "move", () => {
        it( "moves a file to another directory", () => {
            vorple( "file", "write", "movetest", contents );
            vorple( "file", "mkdir", "/movetarget" );
            assert( vorple( "file", "move", "movetest", "/movetarget" ) ).to.be.true;
            assert( vorple( "file", "exists", "movetest" ) ).to.be.false;
            assert( vorple( "file", "exists", "/movetarget/movetest" ) ).to.be.true;
        });

        it( "renames a file", () => {
            vorple( "file", "write", "renameMe", contents );
            assert( vorple( "file", "move", "renameMe", "renameTo" ) ).to.be.true;
            assert( vorple( "file", "exists", "renameMe" ) ).to.be.false;
            assert( vorple( "file", "exists", "renameTo" ) ).to.be.true;
        });

        it( "overwrites files", () => {
            vorple( "file", "write", "overwriter", "source" );
            vorple( "file", "write", "victim", "target" );
            assert( vorple( "file", "move", "overwriter", "victim" ) ).to.be.true;
            assert( vorple( "file", "exists", "overwriter" ) ).to.be.false;
            assert( vorple( "file", "exists", "victim" ) ).to.be.true;
            assert( vorple( "file", "read", "victim" ) ).to.equal( "source" );
        });

        it( "doesn't overwrite files if asked not to", () => {
            vorple( "file", "write", "mover", "source" );
            vorple( "file", "write", "blocker", "target" );
            assert( vorple( "file", "move", "mover", "blocker", { replace: false } ) ).to.be.false;
            assert( vorple( "file", "exists", "mover" ) ).to.be.true;
            assert( vorple( "file", "exists", "blocker" ) ).to.be.true;
            assert( vorple( "file", "read", "blocker" ) ).to.equal( "target" );
        });

        it( "moves directories", () => {
            vorple( "file", "mkdir", "movetestdir" );
            vorple( "file", "mkdir", "/movetarget" );
            assert( vorple( "file", "move", "movetestdir", "/movetarget" ) ).to.be.true;
            assert( vorple( "file", "exists", "movetestdir" ) ).to.be.false;
            assert( vorple( "file", "exists", "/movetarget/movetestdir" ) ).to.be.true;
            assert( vorple( "file", "info", "/movetarget/movetestdir" ).isDirectory ).to.be.true;
        });
    });

    describe( "path", () => {
        it( "joins paths correctly", () => {
            assert( vorple( "file", "path", "foo.txt" ) ).to.equal( "/inform/foo.txt" );
            assert( vorple( "file", "path", "foo.txt", "bar" ) ).to.equal( "/inform/bar/foo.txt" );
            assert( vorple( "file", "path", "foo.txt", "/bar" ) ).to.equal( "/bar/foo.txt" );
            assert( vorple( "file", "path", "../foo.txt", "/bar/xyz" ) ).to.equal( "/bar/foo.txt" );
            assert( vorple( "file", "path", "/foo.txt", "/" ) ).to.equal( "/foo.txt" );
            assert( vorple( "file", "path", "/foo.txt", "/bar/xyz" ) ).to.equal( "/foo.txt" );
        });
    });

    describe( "read/write", () => {
        it( "writes and reads files", () => {
            assert( vorple( "file", "write", "test.txt", contents ) ).to.be.true;
            assert( vorple( "file", "read", "test.txt" ) ).to.equal( contents );

            // this is mentioned in the documentation so better get it right!
            assert( vorple( "file", "exists", "/inform/foo" ) ).to.be.false;
            vorple( "file", "write", "foo", contents );
            assert( vorple( "file", "exists", "/inform/foo" ) ).to.be.true;
            assert( vorple( "file", "read", "foo" ) ).to.equal( contents );
            assert( vorple( "file", "read", "/inform/foo" ) ).to.equal( contents );
            assert( vorple( "file", "read", "foo", { cwd: "/inform" } ) ).to.equal( contents );
        });

        it( "writes the Inform 7 header", () => {
            const header = "* //VORPLE// test.txt\n";
            assert( vorple( "file", "write", "test.txt", contents ) ).to.be.true;
            assert( vorple( "file", "read", "test.txt", { header: true } ) ).to.equal( header + contents );
        });
        
        it( "ignores the Inform 7 header by default on read", () => {
            assert( vorple( "file", "read", "test.txt" ) ).to.equal( contents );
        });

        it( "overwrites files", () => {
            vorple( "file", "write", "overwrite.txt", contents );
            assert( vorple( "file", "write", "overwrite.txt", contents + "2" ) ).to.be.true;
            assert( vorple( "file", "read", "overwrite.txt" ) ).to.equal( contents + "2" );
        });

        it( "appends to files", () => {
            vorple( "file", "write", "append.txt", contents );
            assert( vorple( "file", "write", "append.txt", "3", { append: true } ) ).to.be.true;
            assert( vorple( "file", "read", "append.txt" ) ).to.equal( contents + "3" );
        });

        it( "appending to a non-existing file creates a new file", () => {
            assert( vorple( "file", "write", "append-missing.txt", contents, { append: true } ) ).to.be.true;
            assert( vorple( "file", "read", "append-missing.txt" ) ).to.equal( contents );
        });

        it( "persists files over reload", () => {
            browser.refresh();
            waitForLineInput();
            assert( vorple( "file", "read", "test.txt" ) ).to.equal( contents );
        });
    });

    describe( "readdir", () => {
        it( "shows the contents of directories", () => {
            vorple( "file", "mkdir", "/readdir" );
            vorple( "file", "mkdir", "/readdir/dir1" );
            vorple( "file", "write", "/readdir/file1" );
            vorple( "file", "write", "/readdir/file2" );
            assert( vorple( "file", "readdir", "/readdir" ) ).to.have.members([ "dir1", "file1", "file2" ]);
        });

        it( "returns null for invalid directories", () => {
            assert( vorple( "file", "readdir", "doesntexist" ) ).to.be.null;
            assert( vorple( "file", "readdir", "/readdir/file1" ) ).to.be.null;
        });
    });

    describe( "rmdir", () => {
        it( "removes empty directories", () => {
            vorple( "file", "mkdir", "/empty" );
            assert( vorple( "file", "exists", "/empty" ) ).to.be.true;
            assert( vorple( "file", "rmdir", "/empty" ) ).to.be.true;
            assert( vorple( "file", "exists", "/empty" ) ).to.be.false;
        });

        it( "doesn't remove non-empty directories", () => {
            vorple( "file", "mkdir", "/full" );
            vorple( "file", "write", "/full/foo.txt", "" );
            assert( vorple( "file", "exists", "/full" ) ).to.be.true;
            assert( vorple( "file", "rmdir", "/full" ) ).to.be.false;
            assert( vorple( "file", "exists", "/full" ) ).to.be.true;
        });

        it( "doesn't remove files", () => {
            vorple( "file", "write", "rmtest.txt", "" );
            assert( vorple( "file", "exists", "rmtest.txt" ) ).to.be.true;
            assert( vorple( "file", "rmdir", "rmtest.txt" ) ).to.be.false;
            assert( vorple( "file", "exists", "rmtest.txt" ) ).to.be.true;
        });
    });

    describe( "unlink", () => {
        it( "removes files", () => {
            vorple( "file", "write", "unlinkme", "" );
            assert( vorple( "file", "exists", "unlinkme" ) ).to.be.true;
            assert( vorple( "file", "unlink", "unlinkme" ) ).to.be.true;
            assert( vorple( "file", "exists", "unlinkme" ) ).to.be.false;
        });

        it( "doesn't remove directories", () => {
            vorple( "file", "mkdir", "unlinkdir" );
            assert( vorple( "file", "exists", "unlinkdir" ) ).to.be.true;
            assert( vorple( "file", "unlink", "unlinkdir" ) ).to.be.false;
            assert( vorple( "file", "exists", "unlinkdir" ) ).to.be.true;
        });
    });
});
