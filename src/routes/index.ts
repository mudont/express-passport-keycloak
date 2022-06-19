import { NextFunction } from "express";
import type { User, MyRequest, MyResponse, Handler } from "../types";

var express = require("express");
var db = require("../db");

let fetchTodos: Handler = (req, res, next) => {
  db.all(
    "SELECT * FROM todos WHERE owner_id = ?",
    [req.user.id],
    function (err: any, rows: [any]) {
      if (err) {
        return next(err);
      }

      var todos = rows.map(function (row) {
        return {
          id: row.id,
          title: row.title,
          completed: row.completed == 1 ? true : false,
          url: "/" + row.id,
        };
      });
      res.locals.todos = todos;
      res.locals.activeCount = todos.filter(function (todo) {
        return !todo.completed;
      }).length;
      res.locals.completedCount = todos.length - res.locals.activeCount;
      next();
    }
  );
};

var router = express.Router();

/* GET home page. */
router.get(
  "/",
  (req: MyRequest, res: MyResponse, next: NextFunction) => {
    if (!req.user) {
      return res.render("home");
    }
    next();
  },
  fetchTodos,
  function (req: MyRequest, res: MyResponse, next: NextFunction) {
    res.locals.filter = null;
    res.render("index", { user: req.user });
  }
);

router.get(
  "/active",
  fetchTodos,
  function (req: MyRequest, res: MyResponse, next: NextFunction) {
    res.locals.todos = res.locals.todos.filter(function (todo: any) {
      return !todo.completed;
    });
    res.locals.filter = "active";
    res.render("index", { user: req.user });
  }
);

router.get(
  "/completed",
  fetchTodos,
  function (req: MyRequest, res: MyResponse, next: NextFunction) {
    res.locals.todos = res.locals.todos.filter(function (todo: any) {
      return todo.completed;
    });
    res.locals.filter = "completed";
    res.render("index", { user: req.user });
  }
);

router.post(
  "/",
  function (req: MyRequest, res: MyResponse, next: NextFunction) {
    req.body.title = req.body.title.trim();
    next();
  },
  function (req: MyRequest, res: MyResponse, next: NextFunction) {
    if (req.body.title !== "") {
      return next();
    }
    return res.redirect("/" + (req.body.filter || ""));
  },
  function (req: MyRequest, res: MyResponse, next: NextFunction) {
    db.run(
      "INSERT INTO todos (owner_id, title, completed) VALUES (?, ?, ?)",
      [req.user.id, req.body.title, req.body.completed == true ? 1 : null],
      function (err: any) {
        if (err) {
          return next(err);
        }
        return res.redirect("/" + (req.body.filter || ""));
      }
    );
  }
);

router.post(
  "/:id(\\d+)",
  function (req: MyRequest, res: MyResponse, next: NextFunction) {
    req.body.title = req.body.title.trim();
    next();
  },
  function (req: MyRequest, res: MyResponse, next: NextFunction) {
    if (req.body.title !== "") {
      return next();
    }
    db.run(
      "DELETE FROM todos WHERE id = ? AND owner_id = ?",
      [req.params.id, req.user.id],
      function (err: any) {
        if (err) {
          return next(err);
        }
        return res.redirect("/" + (req.body.filter || ""));
      }
    );
  },
  function (req: MyRequest, res: MyResponse, next: NextFunction) {
    db.run(
      "UPDATE todos SET title = ?, completed = ? WHERE id = ? AND owner_id = ?",
      [
        req.body.title,
        req.body.completed !== undefined ? 1 : null,
        req.params.id,
        req.user.id,
      ],
      function (err: any) {
        if (err) {
          return next(err);
        }
        return res.redirect("/" + (req.body.filter || ""));
      }
    );
  }
);

router.post(
  "/:id(\\d+)/delete",
  function (req: MyRequest, res: MyResponse, next: NextFunction) {
    db.run(
      "DELETE FROM todos WHERE id = ? AND owner_id = ?",
      [req.params.id, req.user.id],
      function (err: any) {
        if (err) {
          return next(err);
        }
        return res.redirect("/" + (req.body.filter || ""));
      }
    );
  }
);

router.post(
  "/toggle-all",
  function (req: MyRequest, res: MyResponse, next: NextFunction) {
    db.run(
      "UPDATE todos SET completed = ? WHERE owner_id = ?",
      [req.body.completed !== undefined ? 1 : null, req.user.id],
      function (err: any) {
        if (err) {
          return next(err);
        }
        return res.redirect("/" + (req.body.filter || ""));
      }
    );
  }
);

router.post(
  "/clear-completed",
  function (req: MyRequest, res: MyResponse, next: NextFunction) {
    db.run(
      "DELETE FROM todos WHERE owner_id = ? AND completed = ?",
      [req.user.id, 1],
      function (err: any) {
        if (err) {
          return next(err);
        }
        return res.redirect("/" + (req.body.filter || ""));
      }
    );
  }
);

module.exports = router;
