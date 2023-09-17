const express = require("express");
const path = require("path");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initialization = async (response, error) => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running on http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB ERROR: ${error.message}`);
  }
};
initialization();

const converter = (object) => {
  return {
    id: object.id,
    todo: object.todo,
    priority: object.priority,
    status: object.status,
    category: object.category,
    dueDate: object.due_date,
  };
};

const statusInvalid = (status) => {
  return status !== "TO DO" && status !== "IN PROGRESS" && status !== "DONE";
};
const priorityInvalid = (priority) => {
  return priority !== "HIGH" && priority !== "MEDIUM" && priority !== "LOW";
};
const categoryInvalid = (category) => {
  return category !== "WORK" && category !== "HOME" && category !== "LEARNING";
};

app.get("/todos/", async (request, response) => {
  const { status, priority, search_q = "", category } = request.query;

  if (status !== undefined) {
    if (statusInvalid(status)) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else {
      const query = `
            SELECT *
            FROM todo
            WHERE status ='${status}';`;

      const result = await db.all(query);
      response.send(result.map((each) => converter(each)));
    }
  } else if (priority !== undefined) {
    if (priorityInvalid(priority)) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else {
      const query = `
            SELECT *
            FROM todo
            WHERE priority ='${priority}';`;

      const result = await db.all(query);
      response.send(result.map((each) => converter(each)));
    }
  } else if (status !== undefined && priority !== undefined) {
    if (statusInvalid(status)) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else if (priorityInvalid(priority)) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else {
      const query = `
            SELECT *
            FROM todo
            WHERE priority ='${priority}'
            AND status = '${status}';`;

      const result = await db.all(query);
      response.send(result.map((each) => converter(each)));
    }
  } else if (category !== undefined && status !== undefined) {
    if (categoryInvalid(category)) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else if (statusInvalid(status)) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else {
      const query = `
          SELECT *
          FROM todo
          WHERE status ='${status}'
          AND category = '${category}';`;

      const result = await db.all(query);
      response.send(result.map((each) => converter(each)));
    }
  } else if (category !== undefined) {
    if (categoryInvalid(category)) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else {
      const query = `
          SELECT *
          FROM todo
          WHERE category = '${category}';`;

      const result = await db.all(query);
      response.send(result.map((each) => converter(each)));
    }
  } else if (category !== undefined && priority !== undefined) {
    if (categoryInvalid(category)) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else if (priorityInvalid(priority)) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else {
      const query = `
          SELECT *
          FROM todo
          WHERE category = '${category}'
          AND priority = '${priority}';`;

      const result = await db.all(query);
      response.send(result.map((each) => converter(each)));
    }
  } else {
    const query = `
          SELECT *
          FROM todo
          WHERE todo LIKE '%${search_q}%';`;

    const result = await db.all(query);
    response.send(result.map((each) => converter(each)));
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const query = `
    SELECT *
    FROM todo
    WHERE id = ${todoId};`;

  const result = await db.get(query);
  response.send(converter(result));
});

const checkDate = (date) => {
  const d = new Date(date);

  return isValid(d);
};

const formatDate = (date) => {
  const d = new Date(date);
  const dateFormat = format(
    new Date(d.getFullYear(), d.getMonth(), d.getDate()),
    "yyyy-MM-dd"
  );
  return dateFormat;
};

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const d = new Date(date);
  if (isValid(d)) {
    const dateFormat = formatDate(d);
    const query = `
    SELECT *
    FROM todo
    WHERE due_date = '${dateFormat}';`;

    const result = await db.all(query);
    response.send(result.map((each) => converter(each)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  if (statusInvalid(status)) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (priorityInvalid(priority)) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (categoryInvalid(category)) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (checkDate(dueDate) === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const dateFormat = formatDate(dueDate);
    const query = `
    INSERT INTO todo (id, todo, priority, status, category, due_date)
    VALUES (
        ${id},
        '${todo}',
        '${priority}',
        '${status}',
        '${category}',
        '${dateFormat}'
    );`;

    await db.run(query);
    response.send("Todo Successfully Added");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, todo, category, dueDate } = request.body;

  if (status !== undefined) {
    if (statusInvalid(status)) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else {
      const query = `
            UPDATE todo
            SET 
                status = '${status}'
            WHERE id = ${todoId};`;
      await db.run(query);
      response.send("Status Updated");
    }
  } else if (priority !== undefined) {
    if (priorityInvalid(priority)) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else {
      const query = `
            UPDATE todo
            SET 
                priority = '${priority}'
            WHERE id = ${todoId};`;
      await db.run(query);
      response.send("Priority Updated");
    }
  } else if (todo !== undefined) {
    const query = `
            UPDATE todo
            SET 
                todo = '${todo}'
            WHERE id = ${todoId};`;
    await db.run(query);
    response.send("Todo Updated");
  } else if (category !== undefined) {
    if (categoryInvalid(category)) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else {
      const query = `
            UPDATE todo
            SET 
                category = '${category}'
            WHERE id = ${todoId};`;
      await db.run(query);
      response.send("Category Updated");
    }
  } else if (dueDate !== undefined) {
    if (checkDate(dueDate) === false) {
      response.status(400);
      response.send("Invalid Due Date");
    } else {
      const query = `
            UPDATE todo
            SET 
                due_date = '${dueDate}'
            WHERE id = ${todoId};`;
      await db.run(query);
      response.send("Due Date Updated");
    }
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const query = `
    DELETE FROM todo
    WHERE id = ${todoId};`;

  await db.run(query);
  response.send("Todo Deleted");
});

module.exports = app;
