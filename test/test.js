'use strict';

const expect = require('chai').expect;
const tesk = require('tesk').tesk;
const superSession = require('../dist/index.js').superSession;

/**
 * Mutiples sessions (without mongo connection)
 */
describe('Mutiples sessions (without mongo connection)', () => {
    let tokens;

    it('configure', (done) => {
        const result = {
            secret: 'secret',
            tokenHeaderName: 'x-access-token',
            duration: 14,
            mult: true,
            reqAttribute: 'user',
            collectionName: 'xsessions'
        };

        superSession.configure(result, () => {
            const { secret, tokenHeaderName, duration, mult, reqAttribute, collectionName } = superSession;
            expect(result.secret).to.equal(secret);
            expect(result.tokenHeaderName).to.equal(tokenHeaderName);
            expect(result.duration).to.equal(duration);
            expect(result.mult).to.equal(mult);
            expect(result.reqAttribute).to.equal(reqAttribute);
            expect(result.collectionName).to.equal(collectionName);
            done();
        });
    });

    it('create sessions', (done) => {
        tokens = new Array();

        tesk()
            .do((task) => {
                const sessionData = { _id: 123456, name: 'Hulk' };
                superSession.createSession(sessionData._id, sessionData).then((token) => {
                    tokens.push(token);
                    expect(token).not.equal(undefined);
                    task.next();
                });
            })
            .do((task) => {
                const sessionData = { _id: 123456, name: 'Hulk' };
                superSession.createSession(sessionData._id, sessionData).then((token) => {
                    tokens.push(token);
                    expect(token).not.equal(undefined);
                    task.next();
                });
            })
            .do((task) => {
                const sessionData = { _id: 123, name: 'Groot' };
                superSession.createSession(sessionData._id, sessionData).then((token) => {
                    tokens.push(token);
                    expect(token).not.equal(undefined);
                    task.next();
                });
            })
            .exec(() => {
                done();
            });
    });

    it('check sessions', (done) => {
        expect(superSession.sessions['123456'].sessions.length).to.equal(2)
        expect(superSession.sessions['123'].sessions.length).to.equal(1);
        expect(Object.keys(superSession.sessions).length).to.equal(2);
        done();
    });

    it('decode', (done) => {
        tesk()
            .do((task) => {
                const req = {
                    headers: {
                        'x-access-token': tokens[0]
                    }
                };
                superSession.decode()(req, undefined, () => {
                    expect(req.user._id).to.equal(123456);
                    task.next();
                });
            })
            .do((task) => {
                const req = {
                    headers: {
                        'x-access-token': tokens[1]
                    }
                };
                superSession.decode()(req, undefined, () => {
                    expect(req.user._id).to.equal(123456);
                    task.next();
                });
            })
            .do((task) => {
                const req = {
                    headers: {
                        'x-access-token': tokens[2]
                    }
                };
                superSession.decode()(req, undefined, () => {
                    expect(req.user._id).to.equal(123);
                    task.next();
                });
            })
            .do((task) => {
                const req = {
                    headers: {
                        'x-access-token': undefined
                    }
                };
                superSession.decode()(req, undefined, () => {
                    expect(req.user).to.equal(undefined);
                    task.next();
                });
            })
            .exec(() => {
                done();
            });
    });

    it('logout', (done) => {
        tesk()
            .do((task) => {
                const req = {
                    headers: {
                        'x-access-token': tokens[0]
                    }
                };
                superSession.decode()(req, undefined, () => {
                    req.user.logout();
                    task.next();
                });
            })
            .do((task) => {
                const req = {
                    headers: {
                        'x-access-token': tokens[1]
                    }
                };
                superSession.decode()(req, undefined, () => {
                    req.user.logout();
                    task.next();
                });
            })
            .do((task) => {
                const req = {
                    headers: {
                        'x-access-token': tokens[2]
                    }
                };
                superSession.decode()(req, undefined, () => {
                    req.user.logout();
                    task.next();
                });
            })
            .do((task) => {
                const req = {
                    headers: {
                        'x-access-token': tokens[0]
                    }
                };
                superSession.decode()(req, undefined, () => {
                    expect(req.user).to.equal(undefined);
                    task.next();
                });
            })
            .do((task) => {
                const req = {
                    headers: {
                        'x-access-token': tokens[1]
                    }
                };
                superSession.decode()(req, undefined, () => {
                    expect(req.user).to.equal(undefined);
                    task.next();
                });
            })
            .do((task) => {
                const req = {
                    headers: {
                        'x-access-token': tokens[2]
                    }
                };
                superSession.decode()(req, undefined, () => {
                    expect(req.user).to.equal(undefined);
                    task.next();
                });
            })
            .exec(() => {
                done();
            });
    });

    it('delete user sessions', (done) => {
        tokens = new Array();
        tesk()
            .do((task) => {
                const sessionData = { _id: 123456, name: 'Hulk' };
                superSession.createSession(sessionData._id, sessionData).then((token) => {
                    tokens.push(token);
                    expect(token).not.equal(undefined);
                    task.next();
                });
            })
            .do((task) => {
                const sessionData = { _id: 123456, name: 'Hulk' };
                superSession.createSession(sessionData._id, sessionData).then((token) => {
                    tokens.push(token);
                    expect(token).not.equal(undefined);
                    task.next();
                });
            })
            .do((task) => {
                const sessionData = { _id: 123, name: 'Groot' };
                superSession.createSession(sessionData._id, sessionData).then((token) => {
                    tokens.push(token);
                    expect(token).not.equal(undefined);
                    task.next();
                });
            })
            .do((task) => {
                superSession.deleteUserSessions(123456).then(() => {
                    task.next();
                });
            })
            .do((task) => {
                superSession.deleteUserSessions(123).then(() => {
                    task.next();
                });
            })
            .do((task) => {
                const req = {
                    headers: {
                        'x-access-token': tokens[0]
                    }
                };
                superSession.decode()(req, undefined, () => {
                    expect(req.user).to.equal(undefined);
                    task.next();
                });
            })
            .do((task) => {
                const req = {
                    headers: {
                        'x-access-token': tokens[1]
                    }
                };
                superSession.decode()(req, undefined, () => {
                    expect(req.user).to.equal(undefined);
                    task.next();
                });
            })
            .do((task) => {
                const req = {
                    headers: {
                        'x-access-token': tokens[2]
                    }
                };
                superSession.decode()(req, undefined, () => {
                    expect(req.user).to.equal(undefined);
                    task.next();
                });
            })
            .exec(() => {
                done();
            });

           
    });
});

/**
 * Single session (without mongo connection)
 */
describe('Single session (without mongo connection)', () => {
    let tokens;
    
    it('configure', (done) => {
        superSession.sessions = {};
        const result = {
            secret: 'secret',
            tokenHeaderName: 'x-access-token',
            duration: 14,
            mult: false,
            reqAttribute: 'user',
            collectionName: 'xsessions'
        };

        superSession.configure(result, () => {
            const { secret, tokenHeaderName, duration, mult, reqAttribute, collectionName } = superSession;
            expect(result.secret).to.equal(secret);
            expect(result.tokenHeaderName).to.equal(tokenHeaderName);
            expect(result.duration).to.equal(duration);
            expect(result.mult).to.equal(mult);
            expect(result.reqAttribute).to.equal(reqAttribute);
            expect(result.collectionName).to.equal(collectionName);
            done();
        });
    });

    it('create sessions', (done) => {
        tokens = new Array();

        tesk()
            .do((task) => {
                const sessionData = { _id: 4321, name: 'Hulk' };
                superSession.createSession(sessionData._id, sessionData).then((token) => {
                    expect(token).not.equal(undefined);
                    task.next();
                });
            })
            .do((task) => {
                const sessionData = { _id: 4321, name: 'Hulk' };
                superSession.createSession(sessionData._id, sessionData).then((token) => {
                    tokens.push(token);
                    expect(token).not.equal(undefined);
                    task.next();
                });
            })
            .do((task) => {
                const sessionData = { _id: 432, name: 'Groot' };
                superSession.createSession(sessionData._id, sessionData).then((token) => {
                    tokens.push(token);
                    expect(token).not.equal(undefined);
                    task.next();
                });
            })
            .exec(() => {
                done();
            });
    });

    it('check sessions', (done) => {
        expect(superSession.sessions['4321'].sessions.length).to.equal(1)
        expect(superSession.sessions['432'].sessions.length).to.equal(1);
        expect(Object.keys(superSession.sessions).length).to.equal(2);
        done();
    });

    it('decode', (done) => {
        tesk()
            .do((task) => {
                const req = {
                    headers: {
                        'x-access-token': tokens[0]
                    }
                };
                superSession.decode()(req, undefined, () => {
                    expect(req.user._id).to.equal(4321);
                    task.next();
                });
            })
            .do((task) => {
                const req = {
                    headers: {
                        'x-access-token': tokens[1]
                    }
                };
                superSession.decode()(req, undefined, () => {
                    expect(req.user._id).to.equal(432);
                    task.next();
                });
            })
            .exec(() => {
                done();
            });
    });

    it('logout', (done) => {
        tesk()
            .do((task) => {
                const req = {
                    headers: {
                        'x-access-token': tokens[0]
                    }
                };
                superSession.decode()(req, undefined, () => {
                    req.user.logout();
                    task.next();
                });
            })
            .do((task) => {
                const req = {
                    headers: {
                        'x-access-token': tokens[1]
                    }
                };
                superSession.decode()(req, undefined, () => {
                    req.user.logout();
                    task.next();
                });
            })
            .do((task) => {
                const req = {
                    headers: {
                        'x-access-token': tokens[0]
                    }
                };
                superSession.decode()(req, undefined, () => {
                    expect(req.user).to.equal(undefined);
                    task.next();
                });
            })
            .do((task) => {
                const req = {
                    headers: {
                        'x-access-token': tokens[1]
                    }
                };
                superSession.decode()(req, undefined, () => {
                    expect(req.user).to.equal(undefined);
                    task.next();
                });
            })
            .exec(() => {
                done();
            });
    });

    it('delete user sessions', (done) => {
        tokens = new Array();
        tesk()
            .do((task) => {
                const sessionData = { _id: 4321, name: 'Hulk' };
                superSession.createSession(sessionData._id, sessionData).then((token) => {
                    tokens.push(token);
                    expect(token).not.equal(undefined);
                    task.next();
                });
            })
            .do((task) => {
                const sessionData = { _id: 4321, name: 'Hulk' };
                superSession.createSession(sessionData._id, sessionData).then((token) => {
                    tokens.push(token);
                    expect(token).not.equal(undefined);
                    task.next();
                });
            })
            .do((task) => {
                const sessionData = { _id: 432, name: 'Groot' };
                superSession.createSession(sessionData._id, sessionData).then((token) => {
                    tokens.push(token);
                    expect(token).not.equal(undefined);
                    task.next();
                });
            })
            .do((task) => {
                superSession.deleteUserSessions(4321).then(() => {
                    task.next();
                });
            })
            .do((task) => {
                superSession.deleteUserSessions(432).then(() => {
                    task.next();
                });
            })
            .do((task) => {
                const req = {
                    headers: {
                        'x-access-token': tokens[0]
                    }
                };
                superSession.decode()(req, undefined, () => {
                    expect(req.user).to.equal(undefined);
                    task.next();
                });
            })
            .do((task) => {
                const req = {
                    headers: {
                        'x-access-token': tokens[1]
                    }
                };
                superSession.decode()(req, undefined, () => {
                    expect(req.user).to.equal(undefined);
                    task.next();
                });
            })
            .exec(() => {
                done();
            });
    });
});