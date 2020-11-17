"use strict";

require("dotenv/config.js");

var _express = _interopRequireDefault(require("express"));

var _mysql = _interopRequireDefault(require("mysql"));

var _bodyParser = _interopRequireDefault(require("body-parser"));

var _expressSession = _interopRequireDefault(require("express-session"));

var _expressFileupload = _interopRequireDefault(require("express-fileupload"));

var _cookieParser = _interopRequireDefault(require("cookie-parser"));

var _cors = _interopRequireDefault(require("cors"));

var _bcrypt = _interopRequireDefault(require("bcrypt"));

var _morgan = _interopRequireDefault(require("morgan"));

var _path = _interopRequireDefault(require("path"));

var _lodash = _interopRequireDefault(require("lodash"));

var _util = _interopRequireDefault(require("util"));

var _multer = _interopRequireDefault(require("multer"));

var _console = require("console");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// import fileUpload from "express-fileupload";
// import routes from "./route/routes";
// import path from "path";
// import usersRoutes from "./routes/users.js";
// import('dotenv/config');
var app = (0, _express["default"])();
app.use(_express["default"].json());
app.use(_express["default"].urlencoded({
  extended: true
}));
var PORT = process.env.PORT || 4000;
var saltRounds = 10; // enable files upload

app.use((0, _expressFileupload["default"])({
  createParentPath: true
})); //add other middleware

app.use(_bodyParser["default"].json());
app.use((0, _morgan["default"])('dev'));
app.use((0, _cors["default"])({
  origin: ['http://localhost:3000'],
  methods: ["GET", "POST"],
  credentials: true
}));
app.use((0, _cookieParser["default"])());
app.use(_bodyParser["default"].urlencoded({
  extended: true
}));
app.use((0, _expressSession["default"])({
  key: 'userId',
  secret: 'subscribe',
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: 60 * 60 * 24
  }
}));

var db = _mysql["default"].createConnection({
  host: process.env.HOST,
  user: process.env.USERNAME,
  password: process.env.PASSWORD,
  database: process.env.DATABASE
});

db.connect(function (err) {
  if (err) throw err;
  console.log("MySQl connected...");
});
app.get("/", function (req, res) {
  res.send("<h3>Welcome on board!!!  <br> You're on POST ".concat(PORT, "</h3>"));
});
app.post("/api/create_project_tbl", function (req, res) {
  var sql = "CREATE TABLE IF NOT EXISTS project_tbl(\n    id INT NOT NULL AUTO_INCREMENT,\n    name varchar(255) NOT NULL,\n    color varchar(255) NOT NULL,\n    PRIMARY KEY(id))";
  db.query(sql, function (err, data) {
    if (err) throw err;
    console.log(data);
    res.send("Project Table created...");
  });
});
app.post("/api/create_dump_tbl", function (req, res) {
  var sql = "CREATE TABLE IF NOT EXISTS dump_tbl(\n    id INT NOT NULL AUTO_INCREMENT,\n    clicked_id varchar(255) NOT NULL,\n    PRIMARY KEY(id))";
  db.query(sql, function (err, data) {
    if (err) throw err;
    console.log(data);
    res.send("Dump Table created...");
  });
});
app.post("/api/new_project", function (req, res) {
  var name = req.body.title;
  var color = req.body.color;
  var user_id = req.body.user_id;
  var sql = "INSERT INTO project_tbl (name, color, user_id) VALUES (?,?,?)";
  db.query(sql, [name, color, user_id], function (err, data) {
    if (err) throw err;
    res.send("post made successful"); // console.log(data);
  });
});
app.get("/api/all_project", function (req, res) {
  var user_id = req.body.userId;
  var sql = "SELECT * FROM project_tbl WHERE user_id = user_id";
  db.query(sql, function (err, data) {
    if (err) throw err;
    res.send(data);
  });
});
app.post("/api/dump_id", function (req, res) {
  var clicked_id = req.body.id;
  console.log(clicked_id); // let sql = `UPDATE project_tbl SET clicked_at = now() WHERE id = (?) AND user_id=2`;

  var sql = "UPDATE project_tbl SET clicked_at = now() WHERE id = (?)";
  db.query(sql, [clicked_id], function (err, data) {
    if (err) throw err;
    res.send("id sucessflly post"); // console.log(data);
  });
});
app.get("/api/review_project", function (req, res) {
  var user_id = req.body.user_id; // let sql = `SELECT DISTINCT clicked_id,name,color FROM dump_tbl ORDER BY clicked_id DESC LIMIT 4`;

  var sql = "SELECT * FROM project_tbl WHERE user_id = user_id ORDER BY clicked_at DESC LIMIT 4";
  db.query(sql, function (err, data) {
    if (err) throw err;
    res.send(data);
  });
}); // app.get("/api/review_project", (req, res) => {
//   let sql = `SELECT DISTINCT id,name,color FROM project_tbl ORDER BY id DESC LIMIT 4`;
//   db.query(sql, (err, data) => {
//     if (err) throw err;
//     res.send(data);
//   });
// });

app.get("/api/single_project/:id", function (req, res) {
  var id = req.params.id;
  var sql = "SELECT * FROM project_tbl WHERE id = ?";
  db.query(sql, id, function (err, data) {
    if (err) throw err;
    res.send(data);
  });
});
app.get("/create_users_tbl", function (req, res) {
  var sql = "CREATE TABLE users_tbl (\n    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,\n    name VARCHAR(255) NOT NULL,\n    email VARCHAR(255) NOT NULL UNIQUE,\n    password VARCHAR(255) NOT NULL,\n    created_at DATETIME DEFAULT CURRENT_TIMESTAMP)";
  db.query(sql, function (err, data) {
    if (err) throw err;
    res.send("User Table created...", data); // console.log(data);
  });
});
app.post("/api/register_user", function (req, res) {
  var name = req.body.name;
  var email = req.body.email;
  var password = req.body.password;
  var sql = "INSERT INTO users_tbl (name, email, password) VALUES (?,?,?)";

  _bcrypt["default"].hash(password, saltRounds, function (err, hash) {
    if (err) console.log(err);
    db.query(sql, [name, email, hash], function (err, data) {
      if (err) throw err;
      res.send("post made successful"); // console.log(data);
    });
  });
});
app.post("/api/login_user", function (req, res) {
  var email = req.body.email;
  var password = req.body.password;
  var sql = "SELECT * FROM users_tbl WHERE email = ?";
  db.query(sql, email, function (err, data) {
    if (err) res.send({
      err: err
    });
    if (data.length > 0) _bcrypt["default"].compare(password, data[0].password, function (err, result) {
      if (err) throw err;

      if (result) {
        req.session.user = data;
        res.send(data); // console.log(req.session.user);
      } else res.send({
        message: 'wrong email and password combination!'
      });
    });else res.send({
      message: 'user doesn\'t exist'
    });
  });
});
app.get('/api/login_user', function (req, res) {
  if (req.session.user) {
    res.send({
      loggedIn: true,
      user: req.session.user
    });
  } else {
    res.send({
      loggedIn: false
    });
  }
});
app.get("*", function (req, res) {
  res.send('404 This Page is not found <a href="/">Go to Home Page</a>');
});
app.listen(PORT, function () {
  return console.log("Server running on POST ".concat(PORT));
}); // app.use(express.static('uploads'));
// app.post('/upload-avatar', async (req, res) => {
//     try {
//         if(!req.files) {
//             res.send({
//                 status: false,
//                 message: 'No file uploaded'
//             });
//         } else {
//             //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
//             let avatar = req.files.avatar;
//             //Use the mv() method to place the file in upload directory (i.e. "uploads")
//             avatar.mv('./uploads/' + avatar.name);
//             //send response
//             res.send({
//                 status: true,
//                 message: 'File is uploaded',
//                 data: {
//                     name: avatar.name,
//                     mimetype: avatar.mimetype,
//                     size: avatar.sizec
//                 }
//             });
//         }
//     } catch (err) {
//         res.status(500).send(err);
//     }
// });
/////////////////////////////////////////////////////////////////////////
// const storage = multer.diskStorage({
//     destination: './upload/images',
//     filename: (req, file, cb) => {
//         return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
//     }
// })
// const upload = multer({
//     storage: storage,
//     limits: {
//         fileSize: 10
//     }
// })
// app.use('/profile', express.static('upload/images'));
// app.post("/api/upload", upload.single('profile'), (req, res) => {
//   console.log(req.file);
//   res.json({
//     success: 1,
//     profile_url: `http://localhost:4000/profile/${req.file.filename}`
//   });
// })
// function errHandler(err, req, res, next) {
//     if (err instanceof multer.MulterError) {
//         res.json({
//             success: 0,
//             message: err.message
//         })
//     }
// }
// app.use(errHandler);
///////////////////////////////////////////////////////////
// const storage = multer.diskStorage({
//   destination: "uploads/images",
//   filename: (req, file, cb) => {
//     return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
//   }
// });
// const upload = multer({ storage: storage });
// app.use('selectedPicture',  express.static("uploads/images"));
// app.use('/api/project_file', upload.single('selectedPicture'), (req, res) => {
//   console.log(req.file);
//   res.json({
//     success: 1,
//     profile_url: `http://localhost:4000/selectedPicture/${req.file.filename}`
//   })
// });
// app.post("/api/upload", upload.single('selectedPicture'), (req, res) => {
//   console.log(req.file)
// });
// app.post("/api/upload", function (req, res, next) {
//   upload.single('selectedPicture')(req, res, function (error) {
//     if (error) {
//       console.log(`upload.single error: ${error}`);
//       return res.sendStatus(500);
//     }
//     // const title = req.body.title;
//     const image = req.file.filename;
//     let sql = `INSERT INTO project_tbl (title, image) VALUES (?,?)`;
//     if (err) console.log(err);
//     db.query(sql, [title, image], (err, data) => {
//       if (err) throw err;
//       res.send("New project created successful");
//       console.log(data);
//     })
//   });
// });
/////////////////////////////////////////////////////////////
// app.post("/api/new_project", (req, res) => {
//   const name = req.body.project_title;
//   let sql = `INSERT INTO project_tbl name VALUES ?`;
//     db.query(sql, name, (err, data) => {
//       if (err) throw err;
//       res.send("New project created successful");
//       console.log(data);
//     });
// })