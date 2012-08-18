$(function() {
  timetracker = {
    model: {},
    collection: {},
    view: {},
    routes: {}
  }

  //shortcuts
  var model = timetracker.model;
  var collection = timetracker.collection;
  var view = timetracker.view;
  var routes = timetracker.routes;

  //models
  model.Client = Backbone.Model.extend({
    defaults: {
      id: null,
      name: null,
    }
  });

  model.Project = Backbone.Model.extend({
    defaults: {
      id: null,
      name: null,
      start_date: null,
      deadline: null,
      time_spent: null,
      price_id: {}
    }
  });

  model.Task = Backbone.Model.extend({
    defaults: {
      id: null,
      name: null,
      project_id: null,
      hours: null, 
      start_date: null,
      end_date: null
    }
  });

  //collections
  collection.Clients = Backbone.Collection.extend({
    model: model.Client,
    active: null,

    url: function() {
      return "testdata/client.json";
    }
  });

  collection.Projects = Backbone.Collection.extend({
    model: model.Project,
    active: null,
  });

  collection.Tasks = Backbone.Collection.extend({
    model: model.Task
  });


  //views
  view.ClientSideView = Backbone.View.extend({
    tagName: "li",
    template: _.template($("#template-sidebar-client").html()),
    
    initialize: function() {
      _.bindAll(this);
      $(this.el).attr("id", "nav-clients-" + this.model.get("name"));
      this.model.on("destroy", this.remove)
    },

    render: function() {
      $(this.el).html(this.template({
        name: this.model.get("name")
      }));
      return this.el;
    },

    makeActive: function() {
      collection.clients.active = this.model.get("id");
      collection.clients.trigger("changeActiveClient");
    },

    events: {
      "click": "makeActive"
    }
  });

  view.ClientsSideView = Backbone.View.extend({
    el: "#sidebar-client",
    template: _.template($("#template-sidebar-clients").html()),
    
    initialize: function() {
      _.bindAll(this);
      this.collection.on("add", this.addLink);
    },

    addLink: function(model) { 
      tmp = new view.ClientSideView({model: model});
      $(this.el).append(tmp.render())
    },

    render: function() {
      $(this.el).html(this.template());
      _.each(this.collection.models, function(model) {
        this.addLink(model);
      }, this);
      return this.el;
    },
  });

  view.ProjectSideView = Backbone.View.extend({
    tagName: "li",
    template: _.template($("#template-sidebar-project").html()),
    
    initialize: function() {
      _.bindAll(this);
      $(this.el).attr("id", "nav-projects-" + this.model.get("name"));
      this.model.on("destroy", this.remove);

    },

    render: function() {
      var client = collection.clients.get(this.model.get("client_id"));
      $(this.el).html(this.template({
        name: this.model.get("name"),
        client: client.get("name")
      }));
      return this.el;
    },
  });

  view.ProjectsSideView = Backbone.View.extend({
    el: "#sidebar-project",
    template: _.template($("#template-sidebar-projects").html()),

    initialize: function() {
      _.bindAll(this);
      this.collection.on("add", this.addLink);
      collection.clients.on("changeActiveClient", this.updateProjects);
    },

    updateProjects: function() {
      collection.projects.url = "testdata/client/" + collection.clients.active
      collection.projects.fetch({
        success: this.render
      });
    },

    addLink: function(model, path) {
      tmp = new view.ProjectSideView({model: model});
      $(this.el).append(tmp.render())
    },

    render: function(path) {
      $(this.el).empty();
      $(this.el).html(this.template({path: path}));
      _.each(this.collection.models, function(model) {
        this.addLink(model, path);
      }, this);
      return this.el;
    }
  });

  view.TaskView = Backbone.View.extend({
    el: "true"
  });


  view.SideView = Backbone.View.extend({
    el: "sidebar",

    initialize: function() {
      _.bindAll(this)

      collection.clients.fetch({
        success: _.bind(function(c, o) {
          this.ClientsView = new view.ClientsSideView({collection: c}).render();
          collection.projects.url = "testdata/client/0" //getall 
          collection.projects.fetch({ 
            success: _.bind(function(c, o) {
              this.ProjectsView = new view.ProjectsSideView({collection: c}).render();
            }, this)
          })
        }, this),
    
        error: function(c, r) {
          console.log(c, r);
        }
      });
    }
  });

  view.Application = Backbone.View.extend({
    el: "body",

    initialize: function() {
      //initialize collections
      collection.clients = new collection.Clients;
      collection.tasks = new collection.Tasks;
      collection.projects = new collection.Projects;

      //create sideview
      this.sideView = new view.SideView;
    }
  });

  routes.dummy = Backbone.Router.extend({
    routes: {
      "": "index",
      ":client": "navigation",
      ":client/:project": "navigation"
    },
    
    generate: function() {
    },

    navigation: function(client, project) {
      if (client) {
        $("#sidebar-client").find(".active").removeClass("active");
        $("#sidebar-client").find("#nav-clients-" + client).addClass("active");
      }
      if (project) {
        $("#sidebar-project").find(".active").removeClass("active");
        $("#sidebar-project").find("#nav-projects-" + project).addClass("active");
      }
    }
  });

//  route = new routes.dummy;
//  Backbone.history.start();


  new view.Application
});