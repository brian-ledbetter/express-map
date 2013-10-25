/*jslint nomen:true, node:true*/
/*global describe, beforeEach, afterEach, it*/

'use strict';

var expect  = require('chai').expect,
    expmap  = require('../../'),
    express = require('express'),

    app;

describe('Express Map', function () {
    beforeEach(function () {
        // Create an Express app instance, and extend it
        app = express();
        expmap.extend(app);
    });

    it('should extend the Express app with extra methods', function () {
        expect(app.map).to.be.a('function');
        expect(app.getRouteMap).to.be.a('function');
        expect(app.getRouteParams).to.be.a('function');
        expect(app.params).to.be.an('object');
    });

    describe('#map', function () {
        it('should create a `name` annotation on the route with the given name', function () {
            var annotations = app.annotations;

            app.map('/app', 'application');
            app.get('/app', function () { /* no-op for testing purposes */ });

            expect(annotations['/app'].name).to.equal('application');
        });

        it('should create aliases on the same route if called multiple times', function () {
            var annotations = app.annotations;

            app.map('/', 'home');
            app.map('/', 'index');

            app.get('/', function () { /* no-op for testing purposes */ });

            expect(annotations['/'].name).to.equal('home');
            expect(annotations['/'].names).to.contain('home', 'index');
        })
    });

    beforeEach(function () {
        var render = function () { /* no-op for testing purposes */ };

        // Map routes to multiple aliases
        app.map('/', 'home');
        app.map('/', 'index');
        app.map('/', 'main');

        // Map routes to unique names
        app.map('/users/', 'users#index');
        app.map('/users/:user', 'users#show');
        app.map('/blog/', 'blog#index');
        app.map('/blog/:post', 'blog#show');

        // Set up and annotate a set of routes with a specific section
        ['/', '/users/', '/users/:user'].forEach(function (route) {
            app.get(route, render)
            app.annotate(route, { section: 'app' });
        });

        ['/blog/', '/blog/:post'].forEach(function (route) {
            app.get(route, render);
            app.annotate(route, { section: 'blog' });
        });

        // Set up and add additional route annotations that don't need mapping
        ['/privacy', '/copyright'].forEach(function (route) {
            app.get(route, render);
            app.annotate(route, { section: 'legal' })
        });
    });

    describe('#getRouteMap', function () {
        it('should return all named routes if no annotations are passed', function () {
            var routeMap = app.getRouteMap();

            expect(Object.keys(routeMap)).to.have.length(7);
            expect(routeMap).to.contain.keys('home', 'index', 'main');
            expect(routeMap).to.contain.keys('users#index', 'users#show');
            expect(routeMap).to.contain.keys('blog#index', 'blog#show');
        });

        it('should return the routes with the specified annotations', function () {
            var routeMap = app.getRouteMap({ section: 'blog' });
            
            expect(Object.keys(routeMap)).to.have.length(2);
            expect(routeMap).to.contain.keys('blog#index', 'blog#show');
        });
    });

    describe('#getRouteParams', function () {
        it('should return nothing if there are no parameter handlers', function () {
            var paramMap = app.getRouteParams();

            expect(paramMap).to.be.empty;
        });

        it('should return a map of all parameter handlers if no route map is passed', function () {
            app.param('user', function () { /* no-op for testing */ });
            app.param('post', function () { /* no-op for testing */ });

            var paramMap = app.getRouteParams();

            expect(Object.keys(paramMap)).to.have.length(2);
            expect(paramMap).to.contain.keys('user', 'post');
        });

        it('should return a map of only the parameter handlers of the filtered map', function () {
            app.param('user', function () { /* no-op for testing */ });
            app.param('post', function () { /* no-op for testing */ });

            var routeMap = app.getRouteMap({ section: 'blog' }),
                paramMap = app.getRouteParams(routeMap);

            expect(Object.keys(paramMap)).to.have.length(1);
            expect(paramMap).to.contain.keys('post');
        });
    });

    describe('#pathTo', function () {
        it('should return a function', function () {
            var routeMap = app.getRouteMap();

            expect(expmap.pathTo(routeMap)).to.be.a('function');
        });

        it('should provide the correct paths given the abstracted name', function () {
            var routeMap = app.getRouteMap(),
                pathTo   = expmap.pathTo(routeMap);

            expect(pathTo('home')).to.equal('/');
            expect(pathTo('index')).to.equal('/');

            expect(pathTo('users#index')).to.equal('/users/');
        });

        it('should provide the correct paths given the name and a context', function () {
            var routeMap = app.getRouteMap(),
                pathTo   = expmap.pathTo(routeMap),
                userPath = pathTo('users#show', {
                    user: 'clarle'
                });

            expect(userPath).to.equal('/users/clarle');
        });
    })
});