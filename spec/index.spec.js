/*!
 * Module dependencies.
 */

var cordova = require('./helper/cordova'),
    contentSync = require('../www'),
    execSpy,
    execWin,
    options;

/*!
 * Specification.
 */

describe('phonegap-plugin-contentsync', function() {
    beforeEach(function() {
        options = { src: 'http://path/to/src.zip' };
        execWin = jasmine.createSpy();
        execSpy = spyOn(cordova.required, 'cordova/exec').andCallFake(execWin);
    });

    describe('.sync', function() {
        it('should require the options parameter', function() {
            expect(function() {
                options = undefined;
                contentSync.sync(options);
            }).toThrow();
            expect(execSpy).not.toHaveBeenCalled();
        });

        it('should require the options.src parameter', function() {
            expect(function() {
                options.src = undefined;
                contentSync.sync(options);
            }).toThrow();
            expect(execSpy).not.toHaveBeenCalled();
        });

        it('should return an instance of ContentSync', function() {
            var sync = contentSync.sync(options);
            expect(sync).toEqual(jasmine.any(contentSync.ContentSync));
        });
    });

    describe('ContentSync instance', function() {
        describe('cordova.exec', function() {
            it('should call cordova.exec on next process tick', function(done) {
                contentSync.sync(options);
                setTimeout(function() {
                    expect(execSpy).toHaveBeenCalledWith(
                        jasmine.any(Function),
                        jasmine.any(Function),
                        'Sync',
                        'sync',
                        jasmine.any(Object)
                    );
                    done();
                }, 100);
            });

            describe('options.src', function() {
                it('should be passed to exec', function(done) {
                    execSpy.andCallFake(function(win, fail, service, id, args) {
                        expect(args[0]).toEqual(options.src);
                        done();
                    });
                    contentSync.sync(options);
                });
            });

            describe('options.type', function() {
                it('should default to "replace"', function(done) {
                    execSpy.andCallFake(function(win, fail, service, id, args) {
                        expect(args[1]).toEqual('replace');
                        done();
                    });
                    contentSync.sync(options);
                });

                it('should be passed as whatever we specify', function(done) {
                    options.type = 'superduper';
                    execSpy.andCallFake(function(win, fail, service, id, args) {
                        expect(args[1]).toEqual(options.type);
                        done();
                    });
                    contentSync.sync(options);
                });
            });
        });

        describe('on "progress" event', function() {
            it('should be emitted with an argument', function(done) {
                execSpy.andCallFake(function(win, fail, service, id, args) {
                    win({ 'progressLength': 1 });
                });
                var sync = contentSync.sync(options);
                sync.on('progress', function(data) {
                    expect(data.progressLength).toEqual(1);
                    done();
                });
            });
        });

        describe('on "complete" event', function() {
            it('should be emitted on success', function(done) {
                execSpy.andCallFake(function(win, fail, service, id, args) {
                    win();
                });
                var sync = contentSync.sync(options);
                sync.on('complete', function(data) {
                    expect(data).toBeUndefined();
                    done();
                });
            });
        });

        it('should emit the error event on error', function(done) {
            execSpy.andCallFake(function(win, fail, service, id, args) {
                fail('something went wrong');
            });
            var sync = contentSync.sync(options);
            sync.on('error', function(e) {
                expect(e).toEqual('something went wrong');
                done();
            });
        });
    });

    describe('.cancel', function() {
        it('should delegate to exec', function(done) {
            var sync = contentSync.sync(options);
            sync.cancel();
            setTimeout(function() {
                expect(execSpy).toHaveBeenCalled();
                expect(execSpy.callCount).toEqual(2);
                expect(execSpy.mostRecentCall.args).toEqual(
                    [jasmine.any(Function), null, 'Sync', 'cancel', []]
                );
                done();
            }, 100);
        });

        it('should emit the cancel event on cancel', function(done) {
            execSpy.andCallFake(function(onCancel, fail, service, id, args) {
                onCancel();
            });
            var sync = contentSync.sync(options);
            sync.on('cancel', function() {
                done();
            });
            sync.cancel();
        });
    });

    describe('.on', function() {
        it('should support the event "cancel"', function() {
            var sync = contentSync.sync(options);
            var cancelCallback = jasmine.createSpy(function() { console.log('i cancel'); });
            sync.on('cancel', cancelCallback);
            sync.emit('cancel');
            expect(cancelCallback).toHaveBeenCalled();
        });

        it('should support the event "error"', function() {
            var sync = contentSync.sync(options);
            var errorCallback = jasmine.createSpy(function() { console.log('i error'); });
            sync.on('error', errorCallback);
            sync.emit('error');
            expect(errorCallback).toHaveBeenCalled();
        });
    });
});
