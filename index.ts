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

import { Response, NextFunction } from 'express';
import express = require('express');
import mongoConnection from './lib/mongo-connection';
import * as cron from 'node-cron';
const jwt = require('jsonwebtoken');
const moment = require('moment');

class SuperSession {

    private sessions: any;
    private tokenHeaderName: string;
    private secret: string;
    private duration: number;
    private db: any;
    private mult: boolean;
    private reqAttribute: string;
    private connectionOptions: any;
    private collectionName: string;

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
    createSession(sessionId: string, sessionData: any): Promise<string> {
        const expiresAt: Date = moment().startOf('days').add(this.duration, 'days').toDate();
        const createdAt: Date = moment().toDate();

        return new Promise((resolve: any, reject: any) => {
            if (this.connectionOptions) {
                if (this.mult) {
                    this.db.collection(this.collectionName).findOneAndUpdate(
                        { sessionId: sessionId },
                        {
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
                        },
                        {
                            new: true,
                            upsert: true
                        },
                        (err: any, res: any) => {
                            if (err) {
                                return reject(err);
                            }

                            // Create user session
                            let session: any;
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
                        }
                    );
                }
                else {
                    this.db.collection(this.collectionName).findOneAndUpdate(
                        { sessionId: sessionId },
                        {
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
                        },
                        {
                            new: true,
                            upsert: true
                        },
                        (err: any) => {
                            if (err) {
                                return reject(err);
                            }

                            // Create user session
                            const session: any = { sessionId: sessionId, sessions: [{ data: sessionData, expiresAt: expiresAt, createdAt: createdAt }] };

                            // Set the session
                            this.set(sessionId, session);

                            // Create the token access
                            resolve(jwt.sign({ sessionId: sessionId, createdAt: createdAt }, this.secret));
                        }
                    );
                }
            }
            else {
                if (this.mult) {
                    // Create user session
                    let session: any = this.get(sessionId);
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
                    const session: any = { sessionId: sessionId, sessions: [{ data: sessionData, expiresAt: expiresAt, createdAt: createdAt }] };

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
    deleteUserSessions(sessionId: string): Promise<void> {
        return new Promise((resolve: any, reject: any) => {
            if (this.connectionOptions) {
                // Expire the session
                this.db.collection(this.collectionName).updateOne(
                    {
                        sessionId: sessionId
                    },
                    {
                        $set: {
                            sessions: []
                        }
                    },
                    {
                        expiresAt: moment().toDate()
                    },
                    (err: any) => {
                        if (err) {
                            return reject(err);
                        }

                        // Delete the user session
                        const session: any = this.get(sessionId);
                        if (session) {
                            session.sessions = new Array();
                        }
                        this.set(sessionId, session);
                        resolve();
                    }
                );
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
    decode(): express.RequestHandler {
        return (req: any, res: Response, next: NextFunction) => {
            const tokenEncoded = req.headers[this.tokenHeaderName];
            if (tokenEncoded) {
                // Decode the token
                const tokenDecoded = jwt.verify(tokenEncoded, this.secret);

                const session = this.get(tokenDecoded.sessionId);
                if (session) {
                    const userSession = session.sessions.find((elem: any) => {
                        return new Date(elem.createdAt).getTime() == new Date(tokenDecoded.createdAt).getTime();
                    });

                    // Try get a session that is not expired
                    const expiresAt: Date = userSession ? new Date(userSession.expiresAt) : new Date();
                    if (expiresAt.getTime() > new Date().getTime()) {
                        req[this.reqAttribute] = userSession.data;
                        req[this.reqAttribute].expiresAt = userSession.expiresAt;
                        req[this.reqAttribute].createdAt = tokenDecoded.createdAt;

                        // Create the logout function to session
                        req[this.reqAttribute].logout = async () => {
                            this.logout(tokenDecoded.sessionId, tokenDecoded.createdAt);
                        };
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
    async configure(options: ConfigureOptions, cb?: () => void): Promise<void> {
        const { secret, duration, tokenHeaderName, mult, reqAttribute, collectionName, connection } = options;

        if (secret) {
            this.secret = secret;
        }
        if (tokenHeaderName) {
            this.tokenHeaderName = tokenHeaderName;
        }
        if (duration) {
            this.duration = Number(duration);
        }
        if (mult) {
            this.mult = mult;
        }
        if (reqAttribute) {
            this.reqAttribute = reqAttribute;
        }
        if (collectionName) {
            this.collectionName = collectionName;
        }
        if (connection) {
            this.connectionOptions = connection;
            try {
                this.db = await mongoConnection.connect(connection.dbUrl, connection.dbName);
                await this.deleteExpiredSessions();
                await this.loadSessions();
            } catch (err) {
                console.log(err);
                console.log('Error in SuperSession.configure()');
            }
        }

        this.createCron();

        if (cb)
            cb();
    }

    /**
     * Expire a unique user session
     * @param sessionId
     * @param createdAt
     */
    private async logout(sessionId: string, createdAt: Date): Promise<any> {
        return new Promise((resolve: any, reject: any) => {
            if (this.connectionOptions) {
                this.db.collection(this.collectionName)
                    .findOneAndUpdate(
                        { sessionId: sessionId },
                        { $pull: { sessions: { createdAt: { $eq: new Date(createdAt) } } } },
                        {
                            new: true
                        },
                        (err: any) => {
                            if (err) {
                                return reject(err);
                            }

                            // Remove the session from sessions
                            const session: any = this.get(sessionId);
                            session.sessions = session.sessions.filter((elem: any) => {
                                return new Date(elem.createdAt).getTime() != new Date(createdAt).getTime();
                            });

                            this.set(sessionId, session); // Update the session
                            resolve();
                        }
                    );
            }
            else {
                // Remove the session from sessions
                const session: any = this.get(sessionId);
                session.sessions = session.sessions.filter((elem: any) => {
                    return new Date(elem.createdAt).getTime() != new Date(createdAt).getTime();
                });

                this.set(sessionId, session); // Update the session
                resolve();
            }
        });
    }

    /**
     * Load users session
     */
    private async loadSessions(): Promise<any> {
        return new Promise((resolve: any, reject: any) => {
            if (this.connectionOptions) {
                this.db.collection(this.collectionName)
                    .find({},
                        async (err: any, cursor: any) => {
                            if (err) {
                                return reject(err);
                            }

                            const sessions = await cursor.toArray();
                            sessions.forEach((elem: any) => {
                                const sessionId: string = elem.sessionId;
                                delete elem._id;
                                this.set(sessionId, { ...elem });
                            });

                            resolve();
                        }
                    );
            }
            else {
                resolve();
            }
        });
    }

    /**
     * Delete the expired sessions
     */
    private async deleteExpiredSessions() {
        return new Promise((resolve: any, reject: any) => {
            if (this.connectionOptions) {
                this.db.collection(this.collectionName)
                    .updateMany({}, { $pull: { sessions: { expiresAt: { $lte: new Date() } } } }, (err: any) => {
                        if (err) {
                            return reject(err);
                        }

                        // Delete expired sessions from cache
                        for (const key in this.sessions) {
                            this.sessions[key].sessions = this.sessions[key].sessions.filter((elem: any) => {
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
    }

    /**
     * Set a session
     * @param key
     */
    private set(key: string, value: any) {
        this.sessions[key] = value;
    }

    /**
     * Get a session
     * @param key
     */
    private get(key: string): any {
        return this.sessions[key];
    }

    /**
     * Create a cron job to delete expired sessions
     */
    private createCron() {
        cron.schedule(
            '0 0 0 * * * *',
            () => {
                this.deleteExpiredSessions();
            }
        );
    }

}

interface ConfigureOptions {
    connection?: {
        dbUrl: string;
        dbName: string;
    };
    secret?: string;
    tokenHeaderName?: string;
    duration?: string | number;
    mult?: boolean;
    reqAttribute?: string;
    collectionName?: string;
}

export const superSession = new SuperSession();