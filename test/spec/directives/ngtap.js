'use strict';

describe('Directive: ngTap', function () {

  // load the directive's module
  beforeEach(module('olcApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<ng-tap></ng-tap>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the ngTap directive');
  }));
});
