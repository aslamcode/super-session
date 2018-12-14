'use strict';

const expect = require('chai').expect;
const tesk = require('../dist/index.js').tesk;

/**
 * do tests
 */
describe('do tests', () => {
    it('exec() should return 123', (done) => {
        let result = '';

        tesk()
            .do((task) => {
                result += '1';
                task.next();
            })
            .do((task) => {
                setTimeout(() => {
                    result += '2';
                    task.next();
                }, 1);
            })
            .do((task) => {
                result += '3';
                task.next();
            })
            .finally(() => {
                expect(result).to.equal('123');
                done();
            })
            .catch(() => {
            })
            .exec();
    });

    it('exec() - task.reject() should return 1', (done) => {
        let result = '';

        tesk()
            .do((task) => {
                result += '1';
                task.next();
            })
            .do((task) => {
                setTimeout(() => {
                    task.reject();
                }, 1);
            })
            .do((task) => {
                result += '3';
                task.next();
            })
            .finally(() => {
            })
            .catch(() => {
                expect(result).to.equal('1');
                done();
            })
            .exec();
    });

    it('exec() - short mode (without finally and catch) should return 123', (done) => {
        let result = '';

        tesk()
            .do((task) => {
                result += '1';
                task.next();
            })
            .do((task) => {
                setTimeout(() => {
                    result += '2';
                    task.next();
                }, 1);
            })
            .do((task) => {
                result += '3';
                task.next();
            })
            .exec((err) => {
                expect(result).to.equal('123');
                done();
            });
    });

    it('exec() - task.reject() short mode (without finally and catch) should return error', (done) => {
        let result = '';

        tesk()
            .do((task) => {
                result += '1';
                task.next();
            })
            .do((task) => {
                setTimeout(() => {
                    result += '2';
                    task.reject('error');
                }, 1);
            })
            .do((task) => {
                result += '3';
                task.next();
            })
            .exec((err) => {
                expect(err).to.equal('error');
                done();
            });
    });

    it('execAsync() should return 132', (done) => {
        let result = '';

        tesk()
            .do((task) => {
                result += '1';
                task.next();
            })
            .do((task) => {
                setTimeout(() => {
                    result += '2';
                    task.next();
                }, 1);
            })
            .do((task) => {
                result += '3';
                task.next();
            })
            .finally(() => {
                expect(result).to.equal('132');
                done();
            })
            .catch(() => {
            })
            .execAsync();
    });

    it('execAsync() - task.reject() should return 13', (done) => {
        let result = '';

        tesk()
            .do((task) => {
                result += '1';
                task.next();
            })
            .do((task) => {
                setTimeout(() => {
                    task.reject();
                }, 1);
            })
            .do((task) => {
                result += '3';
                task.next();
            })
            .finally(() => {
            })
            .catch(() => {
                expect(result).to.equal('13');
                done();
            })
            .execAsync();
    });

    it('execAsync() short mode (without finally and catch) should return 132', (done) => {
        let result = '';

        tesk()
            .do((task) => {
                result += '1';
                task.next();
            })
            .do((task) => {
                setTimeout(() => {
                    result += '2';
                    task.next();
                }, 1);
            })
            .do((task) => {
                result += '3';
                task.next();
            })
            .execAsync(() => {
                expect(result).to.equal('132');
                done();
            });
    });

    it('execAsync() - task.reject() short mode (without finally and catch) should return error', (done) => {
        let result = '';

        tesk()
            .do((task) => {
                result += '1';
                task.next();
            })
            .do((task) => {
                setTimeout(() => {
                    task.reject('error');
                }, 1);
            })
            .do((task) => {
                result += '3';
                task.next();
            })
            .execAsync((err) => {
                expect(err).to.equal('error');
                done();
            });
    });
});

/**
 * forEach tests
 */
describe('forEach tests', () => {
    it('exec() should return 1234', (done) => {
        let result = '';

        tesk()
            .forEach([1, 2, 3, 4], (elem, index, task) => {
                if (index == 2) {
                    setTimeout(() => {
                        result += elem;
                        task.next();
                    }, 1);
                }
                else {
                    result += elem;
                    task.next();
                }
            })
            .finally(() => {
                expect(result).to.equal('1234');
                done();
            })
            .catch(() => {
            })
            .exec();
    });

    it('exec() - task.reject() should return 12', (done) => {
        let result = '';

        tesk()
            .forEach([1, 2, 3, 4], (elem, index, task) => {
                if (index == 2) {
                    setTimeout(() => {
                        task.reject();
                    }, 1);
                }
                else {
                    result += elem;
                    task.next();
                }
            })
            .finally(() => {
            })
            .catch(() => {
                expect(result).to.equal('12');
                done();
            })
            .exec();
    });

    it('exec() short mode (without finally and catch) should return 1234', (done) => {
        let result = '';

        tesk()
            .forEach([1, 2, 3, 4], (elem, index, task) => {
                if (index == 2) {
                    setTimeout(() => {
                        result += elem;
                        task.next();
                    }, 1);
                }
                else {
                    result += elem;
                    task.next();
                }
            })
            .exec(() => {
                expect(result).to.equal('1234');
                done();
            });
    });

    it('exec() - task.reject() short mode (without finally and catch) should return error', (done) => {
        let result = '';

        tesk()
            .forEach([1, 2, 3, 4], (elem, index, task) => {
                if (index == 2) {
                    setTimeout(() => {
                        task.reject('error');
                    }, 1);
                }
                else {
                    result += elem;
                    task.next();
                }
            })
            .exec((err) => {
                expect(err).to.equal('error');
                done();
            });
    });

    it('execAsync() should return 1243', (done) => {
        let result = '';

        tesk()
            .forEach([1, 2, 3, 4], (elem, index, task) => {
                if (index == 2) {
                    setTimeout(() => {
                        result += elem;
                        task.next();
                    }, 1);
                }
                else {
                    result += elem;
                    task.next();
                }
            })
            .finally(() => {
                expect(result).to.equal('1243');
                done();
            })
            .catch(() => {
            })
            .execAsync();
    });

    it('execAsync() - task.reject() should return 124', (done) => {
        let result = '';

        tesk()
            .forEach([1, 2, 3, 4], (elem, index, task) => {
                if (index == 2) {
                    setTimeout(() => {
                        task.reject();
                    }, 1);
                }
                else {
                    result += elem;
                    task.next();
                }
            })
            .finally(() => {
            })
            .catch(() => {
                expect(result).to.equal('124');
                done();
            })
            .execAsync();
    });

    it('execAsync() short mode (without finally and catch) should return 1243', (done) => {
        let result = '';

        tesk()
            .forEach([1, 2, 3, 4], (elem, index, task) => {
                if (index == 2) {
                    setTimeout(() => {
                        result += elem;
                        task.next();
                    }, 1);
                }
                else {
                    result += elem;
                    task.next();
                }
            })
            .execAsync(() => {
                expect(result).to.equal('1243');
                done();
            });
    });

    it('execAsync() - task.reject() short mode (without finally and catch) should return error', (done) => {
        let result = '';

        tesk()
            .forEach([1, 2, 3, 4], (elem, index, task) => {
                if (index == 2) {
                    setTimeout(() => {
                        task.reject('error');
                    }, 1);
                }
                else {
                    result += elem;
                    task.next();
                }
            })
            .execAsync((err) => {
                expect(err).to.equal('error');
                done();
            });
    });
});