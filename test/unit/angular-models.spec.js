describe('model', function() {
  beforeEach(module('shinetech.models'));

  describe('Base', function() {
    var Base, Test;

    beforeEach(inject(function(_Base_) {
      Base = _Base_;
      Test = Base.extend({
        test: 'test',
        get getter() {
          return 'getter';
        }
      });

      this.addMatchers({
        toHaveGetterMethodCalled: function() {
          return {
            compare: function(actual, name) {
              return {
                pass: angular.isDefined(Object.getOwnPropertyDescriptor(actual, name).get)
              };
            }
          };
        }
      });
    }));

    describe('extend', function() {
      it ('creates a new mixin', function() {
        expect(Test.mixInto).toBeDefined();
        expect(Test.test).toEqual('test');
      });

      it ('does not add properties to base', function() {
        expect(Base.test).not.toBeDefined;
      });

      it ('allows sub-extension', function() {
        var SubTest = Test.extend({test1: 'test1'});
        expect(SubTest.test).toEqual('test');
        expect(SubTest.test1).toEqual('test1');
      });

      it ('overrides properties on sub-extensions', function() {
        var SubTest = Test.extend({test: 'overriddenTest'});
        expect(SubTest.test).toEqual('overriddenTest');
      })

      it ('handles multiple extensions', function() {
        var MultiTest = Base.extend({test1: 'test1'}, {test2: 'test2'});
        expect(MultiTest.test1).toEqual('test1');
        expect(MultiTest.test2).toEqual('test2');
      });

      it ('gives the last extension object property priority', function() {
        var MultiTest = Base.extend({test: 'test1'}, {test: 'test2'});
        expect(MultiTest.test).toEqual('test2');
      })

      it('copies getter methods', function() {
        expect(Object.getOwnPropertyDescriptor(Test, 'getter').get).toBeDefined;
      })
    });

    describe('mixInto', function() {
      describe('when beforeMixingInto is not defined', function() {
        var obj;

        beforeEach(function() {
          obj = {data: 'data'};
          Test.mixInto(obj);
        });

        it ('adds behaviour to an object', function() {
          expect(obj.test).toEqual('test');
          expect(obj.data).toEqual('data');
        });

        it ('does not add properties to mixin', function() {
          expect(Test.data).not.toBeDefined;
        });

        it('copies getter methods in', function() {
          expect(obj).toHaveGetterMethodCalled('getter');
          expect(obj.getter).toBe('getter');
        });
      });

      describe('when beforeMixingInto is defined', function() {
        var CustomizedTest;

        beforeEach(function() {
          CustomizedTest = Test.extend({ beforeMixingInto: function() {} });
          spyOn(CustomizedTest, 'beforeMixingInto');
        });

        it ("invokes beforeMixingInto with the same arguments if it's provided", function() {
          var obj = {data: 'data'};
          CustomizedTest.mixInto(obj, 'arg1', 'arg2');
          expect(CustomizedTest.beforeMixingInto).toHaveBeenCalledWith(obj, 'arg1', 'arg2');
        });

        it ('does not invoke beforeMixingInto if the target is null', function() {
          Test.mixInto(null);
          expect(CustomizedTest.beforeMixingInto).not.toHaveBeenCalledWith();
        });

        it ('does not invoke beforeMixingInto if the target is null', function() {
          Test.mixInto(undefined);
          expect(CustomizedTest.beforeMixingInto).not.toHaveBeenCalledWith();
        });
      });
    })
  });

  describe('identityMap', function() {
    var identityMap;

    beforeEach(inject(function(_identityMap_) {
      identityMap = _identityMap_;
    }));

    describe("that does not contain any objects", function() {
      it("returns the new object", function() {
        var object = {id: 1};
        expect(identityMap('class', object)).toBe(object);
      });
    });

    describe("that contains an object", function() {
      var object = {id: 1};

      beforeEach(function() {
        identityMap('class', object);
      });

      describe("and is given a new object with the same class and ID", function() {
        it("returns the existing object", function() {
          expect(identityMap('class', {id: 1})).toBe(object);
        });

        it("merges the new values into the existing object", function() {
          identityMap('class', {id: 1, test: 'test'});
          expect(object.test).toBe('test');
        });
      });

      describe("and is given an object with the same ID but a different class", function() {
        it("returns the new object", function() {
          var newObject = {id: 1};
          expect(identityMap('newClass', newObject)).toBe(newObject);
        });
      });

      describe("and is given an object with the same class and a new ID", function() {
        it("returns the new object", function() {
          var newObject = {id: 2};
          expect(identityMap('class', newObject)).toBe(newObject);
        });
      });
    });
  });

  describe('extend', function() {
    var extend;

    beforeEach(inject(function(_extend_) {
      extend = _extend_;
    }));

    describe('from a source object with both regular and getter properties', function() {
      var destination;

      beforeEach(function() {
        destination = {};

        extend(destination, {
          test1: 'test1',
          get test2() {
            return 'test2';
          }
        });
      });

      it('copies regular property across', function() {
        expect(destination.test1).toBe('test1');
      });

      it('copies the getter function across', function() {
        expect(destination.test2).toBe('test2');
      });

      it('makes the getter function enumerable', function() {
        expect(Object.keys(destination)).toContain('test2');
      });

      it('allows the getter function to be overridden', function() {
        extend(destination, {
          get test2() {return 'test2redux';}
        });
        expect(destination.test2).toBe('test2redux');
      });
    });

    describe('from multiple source objects', function() {
      beforeEach(function() {
        destination = {};

        extend(destination, {
          test1: 'test1',
          get test2() {
            return 'test2';
          },
          test3: 'test3',
          get test4() {
            return 'test4';
          }
        }, {
          test3: 'test3redux',
          get test4() {
            return 'test4redux'
          },
          test5: 'test5',
          get test6() {
            return 'test6';
          }
        });
      });

      it('copies properties from the first source', function() {
        expect(destination.test1).toBe('test1');
      });

      it('copies getter functions from the first source', function() {
        expect(destination.test2).toBe('test2');
      });

      it('overrides properties from the first source with those from the second', function() {
        expect(destination.test3).toBe('test3redux');
      });

      it('overrides getter functions from the first source with those from the second', function() {
        expect(destination.test4).toBe('test4redux');
      });

      it('copies properties from the second source', function() {
        expect(destination.test5).toBe('test5');
      });

      it('copies getter functions from the second source', function() {
        expect(destination.test6).toBe('test6');
      });
    })
  });
});