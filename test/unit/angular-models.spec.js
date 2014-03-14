describe('model', function() {
  beforeEach(module('shinetech.models'));

  describe('Base', function() {
    var Base, Test, obj;

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

    describe('memoize', function() {
      var result;
      beforeEach(function() {
        result = 1;
        obj = {};
      });

      describe('a method', function() {
        var returnValue;
        beforeEach(function() {
          Base.extend({
            memoize: ['method'],
            method: function() {
              return result;
            }
          }).mixInto(obj);
        });

        describe('then invoke it', function() {
          beforeEach(function() {
            returnValue = obj.method();
          });

          it ('returns the right result', function() {
            expect(returnValue).toBe(1);
          });

          describe('then increment the result', function() {
            beforeEach(function() {
              result++;
            });

            it('memoizes the method return value', function() {
              expect(obj.method()).toBe(1);
            });

            it('returns the new value when unmemoized', function() {
              obj.unmemoize();
              expect(obj.method()).toBe(2);
            });
          });
        });
      });

      describe('a property with a getter method', function() {
        var returnValue;
        beforeEach(function() {
          Base.extend({
            memoize: ['getter'],
            get getter() {
              return result;
            }
          }).mixInto(obj);
        });

        describe('then get it', function() {
          beforeEach(function() {
            returnValue = obj.getter;
          });

          it ('returns the right result', function() {
            expect(returnValue).toBe(1);
          });

          describe('then increment the result', function() {
            beforeEach(function() {
              result++;
            });

            it('memoizes the return value', function() {
              expect(obj.getter).toBe(1);
            });

            it('returns the new value when unmemoized', function() {
              obj.unmemoize();
              expect(obj.getter).toBe(2);
            });
          });
        });
      });

      it('raises an error if memoizing a property value does not have an unmemoize method', function() {
        expect(function() {
          Base.extend({
            memoize: ['property'],
            property: {}
          }).mixInto(obj);
        }).toThrow();
      });

      it('raises an error if the property is an array whose elements do not have an unmemoize method', function() {
        expect(function() {
          Base.extend({
            memoize: ['array'],
            array: [{}]
          }).mixInto(obj);
        }).toThrow();
      });
    });

    describe('unmemoize', function() {
      it ('unmemoizes an object property', function() {
        obj = {};
        var Memoized = Base.extend({
          memoize: ['property'],
          property: {
            unmemoize: function() {}
          }
        });
        spyOn(Memoized.property, 'unmemoize');
        Memoized.mixInto(obj);

        obj.unmemoize();
        expect(Memoized.property.unmemoize).toHaveBeenCalled;
      });
      it ('unmemoizes an array property', function() {
        obj = {};
        var Memoized = Base.extend({
          memoize: ['array'],
          array: [{
            unmemoize: function() {}
          }, {
            unmemoize: function() {}
          }]
        });
        spyOn(Memoized.array[0], 'unmemoize');
        spyOn(Memoized.array[1], 'unmemoize');
        Memoized.mixInto(obj);

        obj.unmemoize();
        expect(Memoized.array[0].unmemoize).toHaveBeenCalled;
        expect(Memoized.array[1].unmemoize).toHaveBeenCalled;
      });
    });
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

  describe('memoize', function() {
    var memoize;

    beforeEach(inject(function(_memoize_) {
      memoize = _memoize_;
    }));

    it('raises an error if not passed a function', function() {
      expect(memoize).toThrow();
    });

    describe('a function', function() {
      var memoized, spy, calls;

      beforeEach(function() {
        var obj = {
          func: function() {
            return 1;
          }
        };

        // Need to setup spy BEFORE we memoize to make sure the spy gets memoized and not the
        // original function
        spy = spyOn(obj, 'func');

        var func = obj.func;
        calls = func.calls;
        memoized = memoize(func);
      });

      describe('that returns a defined value', function() {
        beforeEach(function() {
          spy.andReturn(1);
        });

        describe('and invoking it', function() {
          var value;
          beforeEach(function() {
            value = memoized();
          });

          it("calls the original function", function() {
            expect(calls.length).toBe(1);
          });

          it("returns the correct value", function() {
            expect(value).toBe(1);
          })

          describe('then changing the return value of the original function', function() {
            beforeEach(function() {
              spy.andReturn(2);
            });

            describe('and invoking the memoized version again', function() {
              beforeEach(function() {
                value = memoized();
              });

              it("doesn't call the original function", function() {
                expect(calls.length).toBe(1);
              });

              it('returns the value of the first invocation', function() {
                expect(value).toBe(1);
              });
            });

            describe('then unmemoizing and invoking the memoized function again', function() {
              beforeEach(function() {
                memoized.unmemoize();
                value = memoized();
              });

              it('executes the function again', function() {
                expect(calls.length).toBe(2);
              });

              it('returns the new value', function() {
                expect(value).toBe(2);
              });
            });
          });
        });
      });

      describe("that returns an undefined value", function() {
        beforeEach(function() {
          spy.andReturn(undefined);
        });

        describe('and invoking it', function() {
          var value;
          beforeEach(function() {
            value = memoized();
          });

          it("calls the original function", function() {
            expect(calls.length).toBe(1);
          });

          it("returns the correct value", function() {
            expect(value).toBe(undefined);
          })

          describe('then changing the return value of the original function', function() {
            beforeEach(function() {
              spy.andReturn(1);
            });

            describe('and invoking the memoized version again', function() {
              beforeEach(function() {
                value = memoized();
              });

              it("doesn't call the original function", function() {
                expect(calls.length).toBe(1);
              });

              it("returns the correct value", function() {
                expect(value).toBe(undefined);
              })
            });
          });
        });
      });
    })
  });

  describe('afterEveryDigest', function() {
    var scope, afterEveryDigest, callCount, stop;

    beforeEach(inject(function($rootScope, _afterEveryDigest_) {
      scope = $rootScope.$new();
      afterEveryDigest = _afterEveryDigest_;
      callCount = 0;
      stop = afterEveryDigest(scope, function() {
        callCount++;
      });
    }));

    it('is invoked after every digest cycle', function() {
      scope.$digest();
      expect(callCount).toBe(1);
      scope.$digest();
      expect(callCount).toBe(2);
    });

    it('is invoked only once per digest cycle', function() {
      // Set it up so that, by changing the result of the watch function a couple of times, we'll
      // force multiple iterations over the watch list
      var result = 0;
      scope.$watch(function() {
        if (result < 2) {
          result++;
        }
        return result;
      }, function() {
        // Dummy watch function
      });

      scope.$digest();
      expect(callCount).toBe(1);
    });

    it('returns a function that will stop it from executing', function() {
      stop();
      scope.$digest();
      expect(callCount).toBe(0);
    });
  });
});