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
            expect( vorple( "file", "copy", "copytest", "/copytarget" ) ).to.be.true;
            expect( vorple( "file", "exists", "copytest" ) ).to.be.true;
            expect( vorple( "file", "exists", "/copytarget/copytest" ) ).to.be.true;
        });

        it( "copies to a new name", () => {
            vorple( "file", "write", "copyAndRenameMe", contents );
            expect( vorple( "file", "copy", "copyAndRenameMe", "copyAndRenameTo" ) ).to.be.true;
            expect( vorple( "file", "exists", "copyAndRenameMe" ) ).to.be.true;
            expect( vorple( "file", "exists", "copyAndRenameTo" ) ).to.be.true;
        });

        it( "overwrites files", () => {
            vorple( "file", "write", "overwriter", "source" );
            vorple( "file", "write", "victim", "target" );
            expect( vorple( "file", "copy", "overwriter", "victim" ) ).to.be.true;
            expect( vorple( "file", "exists", "overwriter" ) ).to.be.true;
            expect( vorple( "file", "exists", "victim" ) ).to.be.true;
            expect( vorple( "file", "read", "victim" ) ).to.equal( "source" );
        });

        it( "doesn't overwrite files if asked not to", () => {
            vorple( "file", "write", "copier", "source" );
            vorple( "file", "write", "blocker", "target" );
            expect( vorple( "file", "copy", "copier", "blocker", { replace: false } ) ).to.be.false;
            expect( vorple( "file", "exists", "copier" ) ).to.be.true;
            expect( vorple( "file", "exists", "blocker" ) ).to.be.true;
            expect( vorple( "file", "read", "blocker" ) ).to.equal( "target" );
        });

        it( "doesn't copy directories", () => {
            vorple( "file", "mkdir", "copytestdir" );
            vorple( "file", "mkdir", "/copytarget" );
            expect( vorple( "file", "copy", "copytestdir", "/copytarget" ) ).to.be.false;
            expect( vorple( "file", "exists", "copytestdir" ) ).to.be.true;
            expect( vorple( "file", "exists", "/copytarget/copytestdir" ) ).to.be.false;
        });
    });

    describe( "exists", () => {
        it( "finds existing files", () => {
            expect( vorple( "file", "exists", "/vorple/VpHndshk" ) ).to.be.true;
            expect( vorple( "file", "exists", "VpHndshk", { cwd: "/vorple" } ) ).to.be.true;
        });

        it( "doesn't find non-existing files", () => {
            expect( vorple( "file", "exists", "doesntexist" ) ).to.be.false;
        });
    });

    describe( "getFS", () => {
        it( "returns the fs object", () => {
            waitForLineInput();
            expect( browser.execute( () => typeof vorple.file.getFS().FS ) ).to.equal( "function" );
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
            expect( vorple( "file", "info", "infotest.txt" ) ).to.deep.include( expectedData );
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
            expect( vorple( "file", "info", "infodir" ) ).to.deep.include( expectedData );
        });

        it( "returns null for non-existing file", () => {
            expect( vorple( "file", "info", "doesntexist" ) ).to.be.null;
        })
    });

    describe( "informHeader", () => {
        it( "returns the correct header", () => {
            expect( vorple( "file", "informHeader", "TEST", "foo.txt" ) ).to.equal( "* //TEST// foo.txt\n" );
            expect( vorple( "file", "informHeader", "TEST", "/sub/dir/foo.txt" ) ).to.equal( "* //TEST// foo.txt\n" );
        });

        it( "can mark files not ready", () => {
            expect( vorple( "file", "informHeader", "TEST", "foo.txt", false ) ).to.equal( "- //TEST// foo.txt\n" );
        });
    });

    describe( "init", () => {
        it( "creates the basic directory structure", () => {
            const dirs = [ "inform", "tmp", "vorple" ];
            expect( vorple( "file", "readdir", "/" ) ).to.include.members( dirs );
        });

        it( "can be called multiple times", () => {
            expect( vorple( "file", "init" ) ).to.not.throw;
            expect( vorple( "file", "init" ) ).to.not.throw;
        });

        it( "creates the handshake file", () => {
            expect( vorple( "file", "exists", "/vorple/VpHndshk" ) ).to.be.true;
        });
    });

    describe( "isReady", () => {
        it( "newly created files are ready", () => {
            vorple( "file", "write", "defaultReady.txt", contents );
            expect( vorple( "file", "isReady", "defaultReady.txt" ) ).to.be.true;

            // manual double check
            const text = browser.execute( () => vorple.file.getFS().readFileSync( "/inform/defaultReady.txt" ) );
            // Firefox and Chrome return different data structure!
            expect( text.data ? text.data[ 0 ] : text[ 0 ] ).to.equal( "*".charCodeAt( 0 ) );
        });

        it( "newly created files with ready flag false are not ready", () => {
            vorple( "file", "write", "defaultNotReady.txt", contents, { ready: false } );
            expect( vorple( "file", "isReady", "defaultNotReady.txt" ) ).to.be.false;

            // manual double check
            const text = browser.execute( () => vorple.file.getFS().readFileSync( "/inform/defaultNotReady.txt" ) );
            expect( text.data ? text.data[ 0 ] : text[ 0 ] ).to.equal( "-".charCodeAt( 0 ) );
        });
    });

    describe( "markReady", () => {
        it( "changes ready files to not ready", () => {
            vorple( "file", "write", "changeReady.txt", contents, { ready: true } );
            expect( vorple( "file", "isReady", "changeReady.txt" ) ).to.be.true;
            expect( vorple( "file", "markReady", "changeReady.txt", false ) ).to.be.true;
            expect( vorple( "file", "isReady", "changeReady.txt" ) ).to.be.false;
        });

        it( "changes not ready files to ready", () => {
            vorple( "file", "write", "changeReady.txt", contents, { ready: false } );
            expect( vorple( "file", "isReady", "changeReady.txt" ) ).to.be.false;
            expect( vorple( "file", "markReady", "changeReady.txt", true ) ).to.be.true;
            expect( vorple( "file", "isReady", "changeReady.txt" ) ).to.be.true;
        });

        it( "doesn't change status if already correct", () => {
            vorple( "file", "write", "changeReady.txt", contents, { ready: true } );
            expect( vorple( "file", "isReady", "changeReady.txt" ) ).to.be.true;
            vorple( "file", "markReady", "changeReady.txt", true );
            expect( vorple( "file", "isReady", "changeReady.txt" ) ).to.be.true;

            vorple( "file", "write", "changeReady.txt", contents, { ready: false } );
            expect( vorple( "file", "isReady", "changeReady.txt" ) ).to.be.false;
            vorple( "file", "markReady", "changeReady.txt", false );
            expect( vorple( "file", "isReady", "changeReady.txt" ) ).to.be.false;
        });
    });

    describe( "mkdir", () => {
        it( "creates a new directory", () => {
            expect( vorple( "file", "mkdir", "testDir" ) ).to.be.true;
            expect( vorple( "file", "exists", "testDir" ) ).to.be.true;

            expect( vorple( "file", "mkdir", "testDir", { cwd: "/" } ) ).to.be.true;
            expect( vorple( "file", "exists", "/testDir" ) ).to.be.true;
        });

        it( "doesn't create nested directories", () => {
            expect( vorple( "file", "mkdir", "/foo/bar/testDir" ) ).to.be.false;
            expect( vorple( "file", "exists", "/foo/bar/testDir" ) ).to.be.false;
        });

        it( "doesn't overwrite files", () => {
            expect( vorple( "file", "exists", "testDir" ) ).to.be.true; // exists before...
            expect( vorple( "file", "mkdir", "testDir" ) ).to.be.false;
            expect( vorple( "file", "exists", "testDir" ) ).to.be.true; // ...and after

            expect( vorple( "file", "exists", "/vorple/VpHndshk" ) ).to.be.true; // exists before...
            expect( vorple( "file", "mkdir", "/vorple/VpHndshk" ) ).to.be.false;
            expect( vorple( "file", "exists", "/vorple/VpHndshk" ) ).to.be.true; // ...and after
        });
    });

    describe( "move", () => {
        it( "moves a file to another directory", () => {
            vorple( "file", "write", "movetest", contents );
            vorple( "file", "mkdir", "/movetarget" );
            expect( vorple( "file", "move", "movetest", "/movetarget" ) ).to.be.true;
            expect( vorple( "file", "exists", "movetest" ) ).to.be.false;
            expect( vorple( "file", "exists", "/movetarget/movetest" ) ).to.be.true;
        });

        it( "renames a file", () => {
            vorple( "file", "write", "renameMe", contents );
            expect( vorple( "file", "move", "renameMe", "renameTo" ) ).to.be.true;
            expect( vorple( "file", "exists", "renameMe" ) ).to.be.false;
            expect( vorple( "file", "exists", "renameTo" ) ).to.be.true;
        });

        it( "overwrites files", () => {
            vorple( "file", "write", "overwriter", "source" );
            vorple( "file", "write", "victim", "target" );
            expect( vorple( "file", "move", "overwriter", "victim" ) ).to.be.true;
            expect( vorple( "file", "exists", "overwriter" ) ).to.be.false;
            expect( vorple( "file", "exists", "victim" ) ).to.be.true;
            expect( vorple( "file", "read", "victim" ) ).to.equal( "source" );
        });

        it( "doesn't overwrite files if asked not to", () => {
            vorple( "file", "write", "mover", "source" );
            vorple( "file", "write", "blocker", "target" );
            expect( vorple( "file", "move", "mover", "blocker", { replace: false } ) ).to.be.false;
            expect( vorple( "file", "exists", "mover" ) ).to.be.true;
            expect( vorple( "file", "exists", "blocker" ) ).to.be.true;
            expect( vorple( "file", "read", "blocker" ) ).to.equal( "target" );
        });

        it( "moves directories", () => {
            vorple( "file", "mkdir", "movetestdir" );
            vorple( "file", "mkdir", "/movetarget" );
            expect( vorple( "file", "move", "movetestdir", "/movetarget" ) ).to.be.true;
            expect( vorple( "file", "exists", "movetestdir" ) ).to.be.false;
            expect( vorple( "file", "exists", "/movetarget/movetestdir" ) ).to.be.true;
            expect( vorple( "file", "info", "/movetarget/movetestdir" ).isDirectory ).to.be.true;
        });
    });

    describe( "path", () => {
        it( "joins paths correctly", () => {
            expect( vorple( "file", "path", "foo.txt" ) ).to.equal( "/inform/foo.txt" );
            expect( vorple( "file", "path", "foo.txt", "bar" ) ).to.equal( "/inform/bar/foo.txt" );
            expect( vorple( "file", "path", "foo.txt", "/bar" ) ).to.equal( "/bar/foo.txt" );
            expect( vorple( "file", "path", "../foo.txt", "/bar/xyz" ) ).to.equal( "/bar/foo.txt" );
            expect( vorple( "file", "path", "/foo.txt", "/" ) ).to.equal( "/foo.txt" );
            expect( vorple( "file", "path", "/foo.txt", "/bar/xyz" ) ).to.equal( "/foo.txt" );
        });
    });

    describe( "read/write", () => {
        it( "writes and reads text files", () => {
            expect( vorple( "file", "write", "test.txt", contents ) ).to.be.true;
            expect( vorple( "file", "read", "test.txt" ) ).to.equal( contents );

            // this is mentioned in the documentation so better get it right!
            expect( vorple( "file", "exists", "/inform/foo" ) ).to.be.false;
            vorple( "file", "write", "foo", contents );
            expect( vorple( "file", "exists", "/inform/foo" ) ).to.be.true;
            expect( vorple( "file", "read", "foo" ) ).to.equal( contents );
            expect( vorple( "file", "read", "/inform/foo" ) ).to.equal( contents );
            expect( vorple( "file", "read", "foo", { cwd: "/inform" } ) ).to.equal( contents );
        });

        it( "writes and reads binary files", () => {
            expect( vorple( "file", "write", "test.bin", [ 1, 2, 3 ], { binary: true } ) ).to.be.true;
            expect( vorple( "file", "read", "test.bin" ) ).to.equal( "\u0001\u0002\u0003" );
        });

        it( "writes the Inform 7 header", () => {
            const header = "* //VORPLE// test.txt\n";
            expect( vorple( "file", "write", "test.txt", contents ) ).to.be.true;
            expect( vorple( "file", "read", "test.txt", { header: true } ) ).to.equal( header + contents );
        });
        
        it( "ignores the Inform 7 header by default on read", () => {
            expect( vorple( "file", "read", "test.txt" ) ).to.equal( contents );
        });

        it( "overwrites files", () => {
            vorple( "file", "write", "overwrite.txt", contents );
            expect( vorple( "file", "write", "overwrite.txt", contents + "2" ) ).to.be.true;
            expect( vorple( "file", "read", "overwrite.txt" ) ).to.equal( contents + "2" );
        });

        it( "appends to files", () => {
            vorple( "file", "write", "append.txt", contents );
            expect( vorple( "file", "write", "append.txt", "3", { append: true } ) ).to.be.true;
            expect( vorple( "file", "read", "append.txt" ) ).to.equal( contents + "3" );
        });

        it( "appending to a non-existing file creates a new file", () => {
            expect( vorple( "file", "write", "append-missing.txt", contents, { append: true } ) ).to.be.true;
            expect( vorple( "file", "read", "append-missing.txt" ) ).to.equal( contents );
        });

        it( "persists files over reload", () => {
            browser.refresh();
            waitForLineInput();
            expect( vorple( "file", "read", "test.txt" ) ).to.equal( contents );
        });
    });

    describe( "readdir", () => {
        it( "shows the contents of directories", () => {
            vorple( "file", "mkdir", "/readdir" );
            vorple( "file", "mkdir", "/readdir/dir1" );
            vorple( "file", "write", "/readdir/file1" );
            vorple( "file", "write", "/readdir/file2" );
            expect( vorple( "file", "readdir", "/readdir" ) ).to.have.members([ "dir1", "file1", "file2" ]);
        });

        it( "returns null for invalid directories", () => {
            expect( vorple( "file", "readdir", "doesntexist" ) ).to.be.null;
            expect( vorple( "file", "readdir", "/readdir/file1" ) ).to.be.null;
        });
    });

    describe( "rmdir", () => {
        it( "removes empty directories", () => {
            vorple( "file", "mkdir", "/empty" );
            expect( vorple( "file", "exists", "/empty" ) ).to.be.true;
            expect( vorple( "file", "rmdir", "/empty" ) ).to.be.true;
            expect( vorple( "file", "exists", "/empty" ) ).to.be.false;
        });

        it( "doesn't remove non-empty directories", () => {
            vorple( "file", "mkdir", "/full" );
            vorple( "file", "write", "/full/foo.txt", "" );
            expect( vorple( "file", "exists", "/full" ) ).to.be.true;
            expect( vorple( "file", "rmdir", "/full" ) ).to.be.false;
            expect( vorple( "file", "exists", "/full" ) ).to.be.true;
        });

        it( "doesn't remove files", () => {
            vorple( "file", "write", "rmtest.txt", "" );
            expect( vorple( "file", "exists", "rmtest.txt" ) ).to.be.true;
            expect( vorple( "file", "rmdir", "rmtest.txt" ) ).to.be.false;
            expect( vorple( "file", "exists", "rmtest.txt" ) ).to.be.true;
        });
    });

    describe( "unlink", () => {
        it( "removes files", () => {
            vorple( "file", "write", "unlinkme", "" );
            expect( vorple( "file", "exists", "unlinkme" ) ).to.be.true;
            expect( vorple( "file", "unlink", "unlinkme" ) ).to.be.true;
            expect( vorple( "file", "exists", "unlinkme" ) ).to.be.false;
        });

        it( "doesn't remove directories", () => {
            vorple( "file", "mkdir", "unlinkdir" );
            expect( vorple( "file", "exists", "unlinkdir" ) ).to.be.true;
            expect( vorple( "file", "unlink", "unlinkdir" ) ).to.be.false;
            expect( vorple( "file", "exists", "unlinkdir" ) ).to.be.true;
        });
    });
});
