"use strict";
/*! *****************************************************************************
MIT License

Copyright (c) 2018 Guilherme Martins Arantes

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
Object.defineProperty(exports, "__esModule", { value: true });
class Tesk {
    constructor() {
        this.tasks = new Array();
        this.forEachArray = new Array();
        this.currentTask = -1;
    }
    do(task) {
        this.tasks.push(task);
        return this;
    }
    forEach(array, callback) {
        this.forEachArray = array;
        this.forEachFunction = callback;
        return this;
    }
    finally(callback) {
        this.callFinalyFunction = callback;
        return this;
    }
    catch(callback) {
        this.catchFunction = callback;
        return this;
    }
    exec(callback) {
        this.execFunction = callback;
        if (this.forEachFunction) {
            this.setTaskObj(() => this.execForEach());
            this.execForEach();
        }
        else {
            this.setTaskObj(() => this.execTask());
            this.execTask();
        }
    }
    execAsync(callback) {
        this.execFunction = callback;
        if (this.forEachFunction) {
            this.setTaskObj(() => {
                this.currentTask++;
                if (this.currentTask == this.forEachArray.length - 1) {
                    this.callFinalyFunction();
                }
            });
            this.execAsyncForEach();
        }
        else {
            this.setTaskObj(() => {
                this.currentTask++;
                if (this.currentTask == this.tasks.length - 1) {
                    this.callFinalyFunction();
                }
            });
            this.execAsyncTask();
        }
    }
    execTask() {
        this.currentTask++;
        if (this.currentTask == this.tasks.length) {
            this.callFinalyFunction();
        }
        else {
            this.tasks[this.currentTask](this.taskObj);
        }
    }
    execAsyncTask() {
        this.tasks.forEach((task) => {
            task(this.taskObj);
        });
    }
    execForEach() {
        this.currentTask++;
        if (this.currentTask == this.forEachArray.length) {
            this.callFinalyFunction();
        }
        else {
            this.forEachFunction(this.forEachArray[this.currentTask], this.currentTask, this.taskObj);
        }
    }
    execAsyncForEach() {
        this.forEachArray.forEach((elem, index) => {
            this.forEachFunction(elem, index, this.taskObj);
        });
    }
    setTaskObj(nextFunction) {
        this.taskObj = new Object();
        this.taskObj.next = nextFunction;
        if (this.execFunction)
            this.taskObj.reject = this.execFunction;
        else
            this.taskObj.reject = this.catchFunction;
    }
    callFinalyFunction() {
        if (this.execFunction)
            this.execFunction(null);
        else
            this.finallyFunction();
    }
}
const tesk = function () {
    return new Tesk();
};
exports.tesk = tesk;
