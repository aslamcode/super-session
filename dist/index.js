"use strict";
/*! *****************************************************************************
MIT License

Copyright (c) 2018 Guilherme Martins Arantes <guiri_@hotmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
***************************************************************************** */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongo_connection_1 = require("./lib/mongo-connection");
const cron = require("node-cron");
const jwt = require('jsonwebtoken');
const moment = require('moment');
class SuperSession {
    constructor() {
        this.sessions = new Object();
        this.tokenHeaderName = 'access-token';
        this.secret = new Date().getTime().toString();
        this.duration = 14;
        this.mult = false;
        this.reqAttribute = 'session';
        this.collectionName = 'sessions';
    }
    /**
     * Create user session
     * @param id
     * @param permissions
     */
    createSession(sessionId, sessionData) {
        const expiresAt = moment().startOf('days').add(this.duration, 'days').toDate();
        const createdAt = moment().toDate();
        return new Promise((resolve, reject) => {
            if (this.connectionOptions) {
                if (this.mult) {
                    this.db.collection(this.collectionName).findOneAndUpdate({ sessionId: sessionId }, {
                        $set: {
                            sessionId: sessionId,
                        },
                        $push: {
                            sessions: {
                                data: sessionData,
                                expiresAt: expiresAt,
                                createdAt: createdAt
                            }
                        }
                    }, {
                        new: true,
                        upsert: true
                    }, (err, res) => {
                        if (err) {
                            return reject(err);
                        }
                        // Create user session
                        let session;
                        if (res.value) {
                            delete res._id;
                            session = { sessionId: sessionId, sessions: res.value.sessions };
                            session.sessions.push({ data: sessionData, expiresAt: expiresAt, createdAt: createdAt });
                        }
                        else {
                            session = { sessionId: sessionId, sessions: [{ data: sessionData, expiresAt: expiresAt, createdAt: createdAt }] };
                        }
                        // Set the session
                        this.set(sessionId, session);
                        // Create the token access
                        resolve(jwt.sign({ sessionId: sessionId, createdAt: createdAt }, this.secret));
                    });
                }
                else {
                    this.db.collection(this.collectionName).findOneAndUpdate({ sessionId: sessionId }, {
                        $set: {
                            sessionId: sessionId,
                            sessions: [
                                {
                                    data: sessionData,
                                    expiresAt: expiresAt,
                                    createdAt: createdAt
                                }
                            ]
                        }
                    }, {
                        new: true,
                        upsert: true
                    }, (err) => {
                        if (err) {
                            return reject(err);
                        }
                        // Create user session
                        const session = { sessionId: sessionId, sessions: [{ data: sessionData, expiresAt: expiresAt, createdAt: createdAt }] };
                        // Set the session
                        this.set(sessionId, session);
                        // Create the token access
                        resolve(jwt.sign({ sessionId: sessionId, createdAt: createdAt }, this.secret));
                    });
                }
            }
            else {
                if (this.mult) {
                    // Create user session
                    let session = this.get(sessionId);
                    if (!session) {
                        session = { sessionId: sessionId, sessions: [] };
                        this.set(sessionId, session);
                    }
                    session.sessions.push({ data: sessionData, expiresAt: expiresAt, createdAt: createdAt });
                    // Create the access token
                    resolve(jwt.sign({ sessionId: sessionId, createdAt: createdAt }, this.secret));
                }
                else {
                    // Create user session
                    const session = { sessionId: sessionId, sessions: [{ data: sessionData, expiresAt: expiresAt, createdAt: createdAt }] };
                    // Set the session
                    this.set(sessionId, session);
                    // Create the token access
                    resolve(jwt.sign({ sessionId: sessionId, createdAt: createdAt }, this.secret));
                }
            }
        });
    }
    /**
     * Delete all sessions of a user
     * @param sessionId
     */
    deleteUserSessions(sessionId) {
        return new Promise((resolve, reject) => {
            if (this.connectionOptions) {
                // Expire the session
                this.db.collection(this.collectionName).updateOne({
                    sessionId: sessionId
                }, {
                    $set: {
                        sessions: []
                    }
                }, {
                    expiresAt: moment().toDate()
                }, (err) => {
                    if (err) {
                        return reject(err);
                    }
                    // Delete the user session
                    const session = this.get(sessionId);
                    if (session) {
                        session.sessions = new Array();
                    }
                    this.set(sessionId, session);
                    resolve();
                });
            }
            else {
                // Delete the user session
                this.set(sessionId, undefined);
                resolve();
            }
        });
    }
    /**
     * Express middleware to decode the session
     */
    decode() {
        return (req, res, next) => {
            const tokenEncoded = req.headers[this.tokenHeaderName];
            if (tokenEncoded) {
                // Decode the token
                const tokenDecoded = jwt.verify(tokenEncoded, this.secret);
                const session = this.get(tokenDecoded.sessionId);
                if (session) {
                    const userSession = session.sessions.find((elem) => {
                        return new Date(elem.createdAt).getTime() == new Date(tokenDecoded.createdAt).getTime();
                    });
                    // Try get a session that is not expired
                    const expiresAt = userSession ? new Date(userSession.expiresAt) : new Date();
                    if (expiresAt.getTime() > new Date().getTime()) {
                        req[this.reqAttribute] = userSession.data;
                        req[this.reqAttribute].expiresAt = userSession.expiresAt;
                        req[this.reqAttribute].createdAt = tokenDecoded.createdAt;
                        // Create the logout function to session
                        req[this.reqAttribute].logout = () => __awaiter(this, void 0, void 0, function* () {
                            this.logout(tokenDecoded.sessionId, tokenDecoded.createdAt);
                        });
                    }
                }
            }
            next();
        };
    }
    /**
     * Configure the super session
     * @param dbUrl
     */
    configure(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { secret, duration, tokenHeaderName, mult, reqAttribute, collectionName, connection } = options;
            if (secret != undefined) {
                this.secret = secret;
            }
            if (tokenHeaderName != undefined) {
                this.tokenHeaderName = tokenHeaderName;
            }
            if (duration != undefined) {
                this.duration = Number(duration);
            }
            if (mult != undefined) {
                this.mult = mult;
            }
            if (reqAttribute != undefined) {
                this.reqAttribute = reqAttribute;
            }
            if (collectionName != undefined) {
                this.collectionName = collectionName;
            }
            if (connection != undefined) {
                this.connectionOptions = connection;
                try {
                    this.db = yield mongo_connection_1.default.connect(connection.dbUrl, connection.dbName);
                    yield this.deleteExpiredSessions();
                    yield this.loadSessions();
                }
                catch (err) {
                    console.log(err);
                    console.log('Error in SuperSession.configure()');
                }
            }
            this.createCron();
        });
    }
    /**
     * Expire a unique user session
     * @param sessionId
     * @param createdAt
     */
    logout(sessionId, createdAt) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (this.connectionOptions) {
                    this.db.collection(this.collectionName)
                        .findOneAndUpdate({ sessionId: sessionId }, { $pull: { sessions: { createdAt: { $eq: new Date(createdAt) } } } }, {
                        new: true
                    }, (err) => {
                        if (err) {
                            return reject(err);
                        }
                        // Remove the session from sessions
                        const session = this.get(sessionId);
                        session.sessions = session.sessions.filter((elem) => {
                            return new Date(elem.createdAt).getTime() != new Date(createdAt).getTime();
                        });
                        this.set(sessionId, session); // Update the session
                        resolve();
                    });
                }
                else {
                    // Remove the session from sessions
                    const session = this.get(sessionId);
                    session.sessions = session.sessions.filter((elem) => {
                        return new Date(elem.createdAt).getTime() != new Date(createdAt).getTime();
                    });
                    this.set(sessionId, session); // Update the session
                    resolve();
                }
            });
        });
    }
    /**
     * Load users session
     */
    loadSessions() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (this.connectionOptions) {
                    this.db.collection(this.collectionName)
                        .find({}, (err, cursor) => __awaiter(this, void 0, void 0, function* () {
                        if (err) {
                            return reject(err);
                        }
                        const sessions = yield cursor.toArray();
                        sessions.forEach((elem) => {
                            const sessionId = elem.sessionId;
                            delete elem._id;
                            this.set(sessionId, Object.assign({}, elem));
                        });
                        resolve();
                    }));
                }
                else {
                    resolve();
                }
            });
        });
    }
    /**
     * Delete the expired sessions
     */
    deleteExpiredSessions() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (this.connectionOptions) {
                    this.db.collection(this.collectionName)
                        .updateMany({}, { $pull: { sessions: { expiresAt: { $lte: new Date() } } } }, (err) => {
                        if (err) {
                            return reject(err);
                        }
                        // Delete expired sessions from cache
                        for (const key in this.sessions) {
                            this.sessions[key].sessions = this.sessions[key].sessions.filter((elem) => {
                                return new Date(elem.expiresAt).getTime() > new Date().getTime();
                            });
                        }
                        resolve();
                    });
                }
                else {
                    resolve();
                }
            });
        });
    }
    /**
     * Set a session
     * @param key
     */
    set(key, value) {
        this.sessions[key] = value;
    }
    /**
     * Get a session
     * @param key
     */
    get(key) {
        return this.sessions[key];
    }
    /**
     * Create a cron job to delete expired sessions
     */
    createCron() {
        cron.schedule('0 0 0 * * * *', () => {
            this.deleteExpiredSessions();
        });
    }
}
exports.superSession = new SuperSession();
