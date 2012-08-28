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
  var app = null;

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
      client_id: null,
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
    active: 0,

    url: function() {
      return "testdata/client.json";
    }
  });

  collection.Projects = Backbone.Collection.extend({
    model: model.Project,
    active: 0,
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

    makeActive: function() {
      collection.projects.active = this.model.get("id");
      collection.projects.trigger("changeActiveProject");
    },

    events: {
      "click": "makeActive"
    }
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
    tagName: "tr",
    template: _.template($("#template-task").html()),
    
    initialize: function() {
      _.bindAll(this);
    },

    render: function() {
      var project = collection.projects.get(this.model.get("project_id"));
      $(this.el).html(this.template({
        id: this.model.get("id"),
        name: this.model.get("name"),
        hours: this.model.get("hours"),
        client: collection.clients.get(project.get("client_id")).get("name"),
        project: project.get("name")
      }));
      return this.el
    }
  });

  view.TasksView = Backbone.View.extend({
    el: "#tasks tbody",

    initialize: function() {
      _.bindAll(this);
      collection.projects.on("changeActiveProject", this.updateTasks);
      this.updateTasks();
    },

    updateTasks: function() {
      collection.tasks.url = "testdata/project/" + collection.projects.active;
      collection.tasks.fetch({
        success: this.render
      });
    },

    addTask: function(model) {
      var tmp = new view.TaskView({model: model});
      $(this.el).append(tmp.render());
    },
    
    render: function() {
      var that = this;
      $(this.el).empty();
      _.each(collection.tasks.models, function(model) {
        that.addTask(model);
      });
    }
  });


  view.SideView = Backbone.View.extend({
    el: "sidebar",

    initialize: function(client, project) {
      _.bindAll(this)

      collection.clients.fetch({
        success: _.bind(function(c, o) {
          this.ClientsView = new view.ClientsSideView({collection: c}).render();
          //if client is defined, get its id
          if (client) {
            client = _.filter(c.models, function(model) {
              return client === model.get("name");
            })[0];
          }
          else {
            client = 0;//get all
          }

          var id = client && client.get("id");
          collection.projects.url = "testdata/client/" + id;
          collection.projects.trigger("clientsLoad");
          collection.projects.fetch({ 
            success: _.bind(function(c, o) {
              c.active = 0;
              this.ProjectsView = new view.ProjectsSideView({collection: c}).render();
              collection.tasks.trigger("projectsLoad");
            }, this)
          })
        }, this),
    
        error: function(c, r) {
          console.log(c, r);
        }
      });
    }
  });

  view.clientSelect = Backbone.View.extend({
    el: "#select-client",

    initialize: function(client, project) {
      _.bindAll(this);
      collection.clients.on("sync", this.render);
    },

    render: function() {
      var that = this;
      _.each(collection.clients.models, function(model) {
        $(that.el).append("<option>" + model.get("name") + "</option>");
      });
    },

    loadProject: function() {
      console.log("changed");
    },

    events: {
      "change": "loadProject"
    }
  });


  view.topView = Backbone.View.extend({
    el: "#newTask",

    initialize: function() {
      _.bindAll(this);
      this.select = {
        client: new view.clientSelect,
        project: undefined
      };
      $(this.el).find("#options").hide();
      //collection.clients.on("sync", this.ss);
    },

    ss: function(c,o) {
      console.log(c, o);
    },

    addTask: function(e) {
      console.log(e);
    },

    showOptions: function() {
      $(this.el).find("#options").slideDown(100);
    },

    events: {
      "click #addTask": "addTask",
      "focusin": "showOptions"
    }
  });

  view.Application = Backbone.View.extend({
    el: "body",

    initialize: function(client, project) {
      _.bindAll(this);
      //default values
      this.client = client || null;
      this.project = project || null;
      //initialize collections
      collection.clients  = new collection.Clients;
      collection.tasks    = new collection.Tasks;
      collection.projects = new collection.Projects;
      //create sideview
      this.sideView  = new view.SideView(client, project);
      this.topView   = new view.topView;

      //when all client/project information is loaded, get tasks
      collection.tasks.on("projectsLoad", this.getTasks);
    },

    getTasks: function() {
      this.taskView = new view.TasksView;
    }
  });

  routes.dummy = Backbone.Router.extend({
    routes: {
      "": "generate",
      ":client": "generate",
      ":client/:project": "navigation"
    },
    
    generate: function(client) {
      var cl;
      if (!app) {
        app = new view.Application(client);
      }
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

  route = new routes.dummy;
  Backbone.history.start();
});