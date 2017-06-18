import chai from 'chai';
import Promise from 'bluebird';
import PromiseQueue from '../src/utils/PromiseQueue';

const expect = chai.expect;

describe('PromiseQueue', () => {
  it('async functions are executed sequentially', (done) => {
    let counter = 0;

    const count = () => { counter += 1; };
    const expectOrder = i => () => { expect(counter).to.eql(i); };

    const queue = new PromiseQueue(done);
    queue.add(() => Promise.delay(100).then(count));
    queue.add(expectOrder(1));
    queue.add(() => Promise.delay(10).then(count));
    queue.add(expectOrder(2));
  });

  it('executes callback provided with value when generator is finally executed', (done) => {
    let counter = 0;

    const count = () => {
      counter += 1;
      return counter;
    };
    const expectReturnedValue = i => (v) => {
      expect(v).to.eql(i);
    };

    const queue = new PromiseQueue(done);
    queue.add(() => Promise.delay(10).then(count), expectReturnedValue(1));
    queue.add(() => Promise.delay(10).then(count), expectReturnedValue(2));
  });

  it('prioritises based on priority options', (done) => {
    let counter = 0;

    const count = () => { counter += 1; };
    const expectOrder = i => () => {
      expect(counter).to.eql(i);
    };

    const queue = new PromiseQueue(done);
    queue.add(() => Promise.delay(10).then(count), expectOrder(1), { priority: 0 }); // executed immediately because queue is empty
    queue.add(() => Promise.delay(10).then(count), expectOrder(5), { priority: 0 });
    queue.add(() => Promise.delay(10).then(count), expectOrder(3), { priority: 2 });
    queue.add(() => Promise.delay(10).then(count), expectOrder(6), { priority: 0 });
    queue.add(() => Promise.delay(10).then(count), expectOrder(4), { priority: 2 });
    queue.add(() => Promise.delay(10).then(count), expectOrder(2), { priority: 5 });
  });

  it('does not stop on error', (done) => {
    let counter = 0;

    const count = () => { counter += 1; };
    const expectOrder = i => () => { expect(counter).to.eql(i); };

    const queue = new PromiseQueue();
    queue.add(() => Promise.reject());
    queue.add(() => Promise.delay(10).then(count));
    queue.add(() => Promise.reject());
    queue.add(() => Promise.reject());
    queue.add(expectOrder(1));
    queue.add(() => done());
  });

  it('retrys for the specified attempts', (done) => {
    let counter = 0;
    const failing = () => {
      counter++;
      return (counter < 3) ? Promise.reject() : Promise.resolve();
    };
    const queue = new PromiseQueue();
    queue.add(() => Promise.delay(20));
    queue.add(failing, { attempts: 3 });
    queue.add(() => {
      expect(counter).to.eql(3);
      done();
    });
  });

  it('retrys for a number of attempts before continuing even if there is an error', (done) => {
    let counter = 0;
    const failing = () => {
      counter++;
      return (counter < 8) ? Promise.reject() : Promise.resolve();
    };
    const queue = new PromiseQueue();
    queue.add(failing, { attempts: 10 });
    queue.add(() => {
      expect(counter).to.eql(8);
      done();
    });
  });

  it('is reusable', (done) => {
    let doneCounter = 0;
    let counter = 0;

    const finished = () => {
      doneCounter++;
      if (doneCounter === 2) done();
    };
    const count = () => { counter += 1; };
    const expectOrder = i => () => { expect(counter).to.eql(i); };

    const queue = new PromiseQueue(finished);
    queue.add(() => Promise.delay(20).then(count));
    queue.add(expectOrder(1));

    Promise.delay(40).then(() => {
      queue.add(() => Promise.delay(10).then(count));
      queue.add(expectOrder(2));
    });
  });
});
