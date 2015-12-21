var chai = require('chai');
var expect = chai.expect;
var feathers = require('feathers');
var feathersHooks = require('feathers-hooks');
var Fixtures = require('./fixtures');
var errors = require('feathers-errors').types;
var mongooseService = require('../lib/feathers-mongoose');
var mongooseHooks = require('../lib/hooks');
var mongoose = require('mongoose');

var app = feathers();
app.configure(feathersHooks());

var Schema = mongoose.Schema;
var _ids = {};

var Comment = {
    schema: {
        content: {type: String, required: true},
        commenter: {type: String, required: true}
    },
    before:{
      all: [],
      find: [],
      get: [],
      create: [],
      update: [],
      patch: [],
      remove: []
    },
    after:{
      all: [],
      find: [mongooseHooks.toObject()],
      get: [],
      create: [mongooseHooks.toObject()],
      update: [],
      patch: [],
      remove: []
    }
};

var Post = {
    schema: {
        title: {type: String, required: true},
        author: {type: String, required: true},
        published: {type: Boolean, 'default': false},
        comments: [{type: Schema.ObjectId, ref: 'comment'}]
    },
    methods: {
      instanceMethod: function(){}
    },
    statics: {
      staticMethod: function(){}
    },
    virtuals: {
      'virtualAttribute': {
        get: function(){ return 'virtual'; }
      }
    },
    indexes: [
      {'published': 1, background: true}
    ]
};

app.use('comments', mongooseService('Comment', Comment));
app.use('posts', mongooseService('Post', Post));

var commentService = app.service('comments');
// var postService = app.service('posts');

describe('Feathers Mongoose Service', function() {

  describe('#init', function() {
    beforeEach(function(){
      mongoose.models = {};
      mongoose.modelSchemas = {};
      mongoose.connection.models = {};
      mongoose.connection.collections = {};
    });

    describe('without model name', function() {
      it('throws an error', function() {
        expect(mongooseService).to.throw('Must provide a valid model name');
      });
    });

    describe('with model name', function() {
      it('sets the type', function(){
        var service = mongooseService('post', Post, {db: 'test'});
        expect(service.type).to.equal('mongoose');
      });

      it('sets custom options', function(){
        var service = mongooseService('post', Post, {db: 'test'});
        expect(service.options.db).equal('test');
      });

      it('changes a default mongoose option', function(){
        var service = mongooseService('post', Post, {versionKey: '__version'});
        expect(service.options.versionKey).equal('__version');
      });

      describe('when entity is mongoose model', function() {
        it('sets the name', function(){
          var PostSchema = mongoose.Schema(Post.schema);
          var PostModel = mongoose.model('post', PostSchema);
          var service = mongooseService('post', PostModel, {db: 'test'});
          expect(service.name).to.equal('post');
        });
      });

      describe('when entity is a mongoose schema', function() {
        it('sets the name', function(){
          var PostSchema = mongoose.Schema(Post.schema);
          var service = mongooseService('post', PostSchema, {db: 'test'});
          expect(service.name).to.equal('post');
        });
      });

      describe('when entity is an object literal', function() {
        it('sets the name', function(){
          var service = mongooseService('post', Post, {db: 'test'});
          expect(service.name).to.equal('post');
        });

        it('sets any instance methods', function() {
          var service = mongooseService('post', Post, {db: 'test'});
          var post = new service.model({title: 'A post', author: 'Ernest'});
          expect(post.instanceMethod).to.not.be.undefined;
        });

        it('sets any static methods', function() {
          var service = mongooseService('post', Post, {db: 'test'});
          expect(service.model.staticMethod).to.not.be.undefined;
        });

        it('sets any virtual methods', function() {
          var service = mongooseService('post', Post, {db: 'test'});
          var post = new service.model({title: 'A post', author: 'Ernest'});
          expect(post.virtualAttribute).to.equal('virtual');
        });

        it('sets any indexes', function() {
          mongooseService('post', Post, {db: 'test'});
          var indexes = mongoose.modelSchemas.post._indexes;
          expect(indexes.length).to.not.equal(0);
        });
      });
    });

    describe('with existing connection', function() {
      it('uses the existing connection', function(done) {
        var connection = mongoose.createConnection('mongodb://localhost:27017/test');
        var service = mongooseService('post', Post, {connection: connection});
        
        service.find({}, function(error, data){
          expect(error).to.be.null;
          expect(data).to.be.ok;
          done();
        });
      });
    });

    describe('with connection string', function() {
      it('sets up a connection', function(done) {
        var service = mongooseService('post', Post, {db: 'test'});
        
        service.find({}, function(error, data){
          expect(error).to.be.null;
          expect(data).to.be.ok;
          done();
        });
      });
    });

    describe('without connection string', function() {
      it('sets up a default connection', function(done) {
        var service = mongooseService('post', Post);

        service.find({}, function(error, data){
          expect(error).to.be.null;
          expect(data).to.be.ok;
          done();
        });
      });

      it('sets up a custom connection', function(done) {
        var options = {
          host: 'localhost',
          port: 27017,
          db: 'test',
          reconnect: false
        };

        var service = mongooseService('post', Post, options);
        
        service.find({}, function(error, data){
          expect(error).to.be.null;
          expect(data).to.be.ok;
          done();
        });
      });
    });
  });

  describe('CRUD methods', function(){
    before(function(){
      mongoose.models = {};
      mongoose.modelSchemas = {};
      mongoose.connection.models = {};
      mongoose.connection.collections = {};
      this.service = mongooseService('post', Post);
      this.commentService = mongooseService('comment', Comment);
    });

    beforeEach(function(done) {
      this.service.create(Fixtures.singlePost, function(error, data) {
        if (error) {
          console.error(error);
        }

        _ids.FirstPost = data._id;
        done();
      });
    });

    afterEach(function(done) {
      this.service.remove(_ids.FirstPost, function() {
        done();
      });
    });

    describe('#find', function() {
      beforeEach(function(done) {
        var secondPost = Fixtures.multiplePosts[0];
        var thirdPost = Fixtures.multiplePosts[1];

        this.commentService.create(Fixtures.comments[0], function(err, comment){
          secondPost.comments = [comment._id];

          this.service.create(secondPost, function(err, post) {
            _ids.SecondPost = post._id;

            this.service.create(thirdPost, function(err, post) {
              _ids.ThirdPost = post._id;
              done();
            });
          }.bind(this));
        }.bind(this));
      });

      afterEach(function(done) {
        this.service.remove(_ids.SecondPost, function() {
          this.service.remove(_ids.ThirdPost, function() {
            done();
          });
        }.bind(this));
      });

      it('returns all items', function(done) {
        this.service.find({}, function(error, data) {
          expect(error).to.be.null;
          expect(data).to.be.instanceof(Array);
          expect(data.length).to.equal(3);
          done();
        });
      });

      it('filters results by query parameters', function(done) {
        this.service.find({ query: { title: 'First Post' } }, function(error, data) {
          expect(error).to.be.null;
          expect(data).to.be.instanceof(Array);
          expect(data.length).to.equal(1);
          expect(data[0].title).to.equal('First Post');
          done();
        });
      });

      it('supports sorting', function(done) {
        var params = {
          query: {
            $sort: {author: 1}
          }
        };

        this.service.find(params, function(error, data) {
          expect(error).to.be.null;
          expect(data.length).to.equal(3);
          expect(data[0].author).to.equal('Alice');
          expect(data[1].author).to.equal('Bob');
          expect(data[2].author).to.equal('Doug');
          done();
        });
      });

      it('supports limiting', function(done) {
        var params = {
          query: {
            $limit: 2
          }
        };
        
        this.service.find(params, function(error, data) {
          expect(error).to.be.null;
          expect(data.length).to.equal(2);
          done();
        });
      });

      it('supports skipping', function(done) {
        var params = {
          query: {
            $sort: {author: 1},
            $skip: 1
          }
        };
        
        this.service.find(params, function(error, data) {
          expect(error).to.be.null;
          expect(data.length).to.equal(2);
          expect(data[0].author).to.equal('Bob');
          expect(data[1].author).to.equal('Doug');
          done();
        });
      });

      it('supports selecting specific fields', function(done) {
        var params = {
          query: {
            author: 'Alice',
            $select: ['title']
          }
        };
        
        this.service.find(params, function(error, data) {
          expect(error).to.be.null;
          expect(data.length).to.equal(1);
          expect(data[0].title).to.equal('First Post');
          expect(data[0].author).to.be.undefined;
          done();
        });
      });

      it('supports populating sub documents', function(done) {
        var params = {
          query: {
            author: 'Bob',
            $populate: ['comments']
          }
        };
        
        this.service.find(params, function(error, data) {
          expect(error).to.be.null;
          expect(data.length).to.equal(1);
          expect(data[0].title).to.equal('Second Post');
          expect(data[0].comments[0].content).to.equal('First comment');
          done();
        });
      });
    });

    describe('#get', function() {
      it('returns a BadRequest error when no id is provided', function(done) {
        this.service.get(function(error) {
          expect(error).to.be.ok;
          expect(error instanceof errors.BadRequest).to.be.ok;
          done();
        });
      });

      describe('when instance exists', function(){
        it('returns the found instance', function(done) {          
          this.service.get(_ids.FirstPost, function(error, data) {
            expect(data._id.toString()).to.equal(_ids.FirstPost.toString());
            done();
          });
        });

        it('does not return an error', function(done) {
          this.service.get(_ids.FirstPost, function(error) {
            expect(error).to.be.null;
            done();
          });
        });
      });

      describe('when instance does not exist', function(){
        it('returns NotFound error for non-existing id', function(done) {
          this.service.get('55c0f8c7c0846306132077ab', function(error) {
            expect(error).to.be.ok;
            expect(error instanceof errors.NotFound).to.be.ok;
            expect(error.message).to.equal('No record found for id 55c0f8c7c0846306132077ab');
            done();
          });
        });
      });
    });

    describe('#create', function() {
      describe('when invalid', function(){
        it('returns a BadRequest error', function(done) {
          this.service.create(Fixtures.invalidPost, function(error) {
            expect(error instanceof errors.BadRequest).to.be.ok;
            done();
          });
        });

        it('returns mongoose validation error', function(done) {
          this.service.create(Fixtures.invalidPost, function(error) {
            expect(error.message).to.equal('Validation failed');
            expect(error.errors.author.path).to.equal('author');
            expect(error.errors.author.message).to.equal('Path `author` is required.');
            done();
          });
        });
      });

      describe('when valid', function(){
        it('supports creating single instances and returns it', function(done) {
          this.service.create(Fixtures.singlePost, function(error, data) {
            expect(data.title).to.equal('First Post');

            this.service.remove(data._id, function(){
              done();
            });
          }.bind(this));
        });

        it.skip('supports creating multiple instances and returns them', function(done) {
          this.service.create(Fixtures.multiplePosts, function(error, data) {
            expect(data[0].title).to.equal('Second Post');
            expect(data[1].title).to.equal('Third Post');
            done();
          });
        });
      });
    });

    describe('#remove', function() {
      describe('when instance exists', function(){
        it('deletes instance and returns the deleted instance', function(done) {
          this.service.remove(_ids.FirstPost, function(error, data) {
            expect(data.title).to.equal('First Post');
            done();
          });
        });

        it('does not return an error', function(done) {
          this.service.remove(_ids.FirstPost, function(error) {
            expect(error).to.be.null;
            done();
          });
        });
      });

      describe('when instance does not exist', function(){
        it('returns NotFound error for non-existing id', function(done) {
          this.service.remove('55c0f8c7c0846306132077ab', function(error) {
            expect(error).to.be.ok;
            expect(error instanceof errors.NotFound).to.be.ok;
            expect(error.message).to.equal('No record found for id 55c0f8c7c0846306132077ab');
            done();
          });
        });
      });
    });

    describe('#update', function() {
      describe('when instance exists', function(){
        it('updates instance and returns the updated instance', function(done) {
          this.service.update(_ids.FirstPost, { title: 'New Title'}, function(error, data) {
            expect(data.title).to.equal('New Title');
            done();
          });
        });

        it('does not return an error', function(done) {
          this.service.update(_ids.FirstPost, {}, function(error) {
            expect(error).to.be.null;
            done();
          });
        });
      });

      describe('when instance does not exist', function(){
        it('returns NotFound error for non-existing id', function(done) {
          this.service.update('55c0f8c7c0846306132077ab', {}, function(error) {
            expect(error).to.be.ok;
            expect(error instanceof errors.NotFound).to.be.ok;
            expect(error.message).to.equal('No record found for id 55c0f8c7c0846306132077ab');
            done();
          });
        });
      });

      describe('invalid params', function(){
        it('returns BadRequest error when not passing data', function(done) {
          this.service.update(_ids.FirstPost, function(error) {
            expect(error).to.be.ok;
            expect(error instanceof errors.BadRequest).to.be.ok;
            expect(error.message).to.equal('You need to provide data to be updated');
            done();
          });
        });
      });
    });

    describe('#patch', function() {
      describe('when instance exists', function(){
        it('patches instance and returns the patched instance', function(done) {
          this.service.patch(_ids.FirstPost, { title: 'New Title'}, function(error, data) {
            expect(data.title).to.equal('New Title');
            done();
          });
        });

        it('does not return an error', function(done) {
          this.service.patch(_ids.FirstPost, {}, function(error) {
            expect(error).to.be.null;
            done();
          });
        });
      });

      describe('when instance does not exist', function(){
        it('returns NotFound error for non-existing id', function(done) {
          this.service.patch('55c0f8c7c0846306132077ab', {}, function(error) {
            expect(error).to.be.ok;
            expect(error instanceof errors.NotFound).to.be.ok;
            expect(error.message).to.equal('No record found for id 55c0f8c7c0846306132077ab');
            done();
          });
        });
      });

      describe('invalid params', function(){
        it('returns BadRequest error when not passing data', function(done) {
          this.service.patch(_ids.FirstPost, function(error) {
            expect(error).to.be.ok;
            expect(error instanceof errors.BadRequest).to.be.ok;
            expect(error.message).to.equal('You need to provide data to be updated');
            done();
          });
        });
      });
    });
  });

  describe('Feathers Hooks', function(){

    it('The toObject hook converts arrays of mongoose model instances to plain objects.', function(done) {
      commentService.find({}, function(error, data) {
        expect(error).to.be.null;
        expect(data).to.be.instanceof(Array);
        expect(data[0].toObject).to.be.undefined;
        done();
      });
    });

    it('The toObject hook converts a mongoose model instance to a plain object.', function(done) {
      commentService.create(Fixtures.comments[0], function(error, data) {
        expect(error).to.be.null;
        expect(data.toObject).to.be.undefined;
        done();
      });
    });

    it.skip('The toObject hook throws an error when not being used as a function.', function(done) {
        try{
          var BadComment = {
              schema: {
                  content: {type: String, required: true},
                  commenter: {type: String, required: true}
              },
              after:{
                create: [mongooseHooks.toObject],
              }
          };
          app.use('badcomments', mongooseService('badcomments', BadComment));
          var badService = app.service('badcomments');
          badService.create(Fixtures.comments[0], function(error) {
            console.log(error);
          });  
        }
        catch(err) {
          console.log('This is a test');
          console.log(err);
          done();
        }
    });
  });

});
