'use strict';

var db = require('./database');
var Sequelize = require('sequelize');

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
  getterMethods: {
    timeRemaining() {
      if (!this.due) {
        return Infinity
      }
      return this.due - Date.now()
    },
    overdue() {
      return (Date.now() - this.due > 0 && !this.complete)
    }
  },
  hooks: {
    beforeDestroy: function(parent) {
      return Task.destroy({
        where: {
          parentId: parent.id
        }
      })
    }
  }
});

Task.clearCompleted = function() {
  return Task.destroy({
    where: {
      complete: true
    }
  })
}

Task.completeAll = function() {
  return Task.update({
    complete: true
  }, {
    where: {
      complete: false
    }
  })
}

Task.prototype.addChild = function(task) {
  return Task.create({
    name: task.name,
    parentId: this.id
  })
}

Task.prototype.getChildren = function() {
  return Task.findAll({
    where: {
      parentId: this.id
    }
  })
}

Task.prototype.getSiblings = function() {
  const Op = Sequelize.Op
  return Task.findAll({
    where: {
      parentId: this.parentId,
      id: {$ne: this.id}
    }
  })
}

Task.belongsTo(Task, {as: 'parent'});


//---------^^^---------  your code above  ---------^^^----------

module.exports = Task;
