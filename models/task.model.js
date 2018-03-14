'use strict';

var db = require('./database');
var Sequelize = require('sequelize');
var Promise = require('bluebird');

// Make sure you have `postgres` running!

//---------VVVV---------  your code below  ---------VVV----------

var Task = db.define('Task', {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  complete: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  due: Sequelize.DATE
}, {
//getter methods ~ return info about time remaining on a task instance and overdue status, without adding that info to database
  getterMethods: {
    timeRemaining() {
      if (!this.due) return Infinity;
      return this.due - Date.now();
    },

    overdue() {
      if (this.due > Date.now() || this.complete) {
        return false;
      }
      return true;
    }
  }
});

//Class Methods
    //Delete all of the completed tasks
Task.clearCompleted = () => {
  return Task.destroy({
    where: {
      complete: true
    }
  })
  .catch((error) => {
    console.error(error);
  })
};

    //Mark all of the not complete task as complete
Task.completeAll = function() {
  return Task.findAll({
    where: {
      complete: false
    }
  })
  .then((arrayOfIncompleteTasks) => {
    const incompleteTasks = arrayOfIncompleteTasks.map((task) => {
      return task.update({complete: true});
    })
    return Promise.all(incompleteTasks);
  })
  .catch((error) => {
    console.error(error);
  })
};


//Instance Methods
        //Add Child for an instance
Task.prototype.addChild = function (childTask) {
  return Task.create({
    name: childTask.name,
  })
  .then((createdChild) => {//the child instance that was created
    return createdChild.setParent(this);
  })
  .catch((error) => {
    console.error(error);
  })
};
    //Get list of an instance's children
Task.prototype.getChildren = function() {
  const idOfParent = this.id;//id of the parent instance addChild will be called on
  return Task.findAll({
    where: {
      parentId: idOfParent
    }
  })
  .catch((error) => {
    console.error(error);
  })
};

    //List all of a child' siblings
Task.prototype.getSiblings = function() {
  const parentIdOfBigSibling = this.parentId;
  return Task.findAll({
    where: {
      parentId: parentIdOfBigSibling,
      id: {
        $ne: this.id
      }

    }
  })
  .catch((error) => {
    console.error(error);
  })
};

//Hook that will automatically get rid of child instances before a parent is destroyed
Task.addHook('beforeDestroy', 'removal', function(parentTask){
  return Task.destroy({
    where: {
      parentId: parentTask.id
    }
  })
  .catch((error) => {
    console.error(error);
  })
})



Task.belongsTo(Task, {as: 'parent'});


//---------^^^---------  your code above  ---------^^^----------

module.exports = Task;

