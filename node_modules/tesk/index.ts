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

class Tesk {

	tasks: any[];
	taskObj: any;
	finallyFunction: any;
	catchFunction: any;
	forEachFunction: any;
	execFunction: any;
	forEachArray: any[];
	currentTask: number;

	constructor() {
		this.tasks = new Array();
		this.forEachArray = new Array();
		this.currentTask = -1;
	}

	do(task: any): Tesk {
		this.tasks.push(task);
		return this;
	}

	forEach(array: any[], callback: any) {
		this.forEachArray = array;
		this.forEachFunction = callback;
		return this;
	}

	finally(callback: any): Tesk {
		this.callFinalyFunction = callback;
		return this;
	}

	catch(callback: any): Tesk {
		this.catchFunction = callback;
		return this;
	}

	exec(callback?: any) {
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

	execAsync(callback?: any) {
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

	private execTask() {
		this.currentTask++;

		if (this.currentTask == this.tasks.length) {
			this.callFinalyFunction();
		}
		else {
			this.tasks[this.currentTask](this.taskObj);
		}
	}

	private execAsyncTask() {
		this.tasks.forEach((task: any) => {
			task(this.taskObj);
		});
	}

	private execForEach() {
		this.currentTask++;
		if (this.currentTask == this.forEachArray.length) {
			this.callFinalyFunction();
		}
		else {
			this.forEachFunction(this.forEachArray[this.currentTask], this.currentTask, this.taskObj);
		}
	}

	private execAsyncForEach() {
		this.forEachArray.forEach((elem: any, index: any) => {
			this.forEachFunction(elem, index, this.taskObj);
		});
	}

	private setTaskObj(nextFunction: any) {
		this.taskObj = new Object();
		this.taskObj.next = nextFunction;

		if (this.execFunction)
			this.taskObj.reject = this.execFunction;
		else 
			this.taskObj.reject = this.catchFunction;
	}

	private callFinalyFunction() {
		if (this.execFunction)
			this.execFunction(null);
		else 
			this.finallyFunction();
	}

}

const tesk = function() {
	return new Tesk();
}

export { tesk };

