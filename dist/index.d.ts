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
import express = require('express');
declare class SuperSession {
    private sessions;
    private tokenHeaderName;
    private secret;
    private duration;
    private db;
    private mult;
    private reqAttribute;
    private connectionOptions;
    private collectionName;
    constructor();
    /**
     * Create user session
     * @param id
     * @param permissions
     */
    createSession(sessionId: string, sessionData: any): Promise<string>;
    /**
     * Delete all sessions of a user
     * @param sessionId
     */
    deleteUserSessions(sessionId: string): Promise<void>;
    /**
     * Express middleware to decode the session
     */
    decode(): express.RequestHandler;
    /**
     * Configure the super session
     * @param dbUrl
     */
    configure(options: ConfigureOptions): Promise<void>;
    /**
     * Expire a unique user session
     * @param sessionId
     * @param createdAt
     */
    private logout;
    /**
     * Load users session
     */
    private loadSessions;
    /**
     * Delete the expired sessions
     */
    private deleteExpiredSessions;
    /**
     * Set a session
     * @param key
     */
    private set;
    /**
     * Get a session
     * @param key
     */
    private get;
    /**
     * Create a cron job to delete expired sessions
     */
    private createCron;
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
export declare const superSession: SuperSession;
export {};
