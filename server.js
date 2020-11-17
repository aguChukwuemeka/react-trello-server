// import fileUpload from "express-fileupload";
// import routes from "./route/routes";
// import path from "path";
// import usersRoutes from "./routes/users.js";

// import('dotenv/config');
import { } from 'dotenv/config.js';

import express from "express";
import mySQL from "mysql";
import bodyParser from "body-parser";
import session from "express-session";
import fileUpload from "express-fileupload";
import cookieParser from "cookie-parser";
import cors from "cors";
import bcrypt from "bcrypt";
import morgan from "morgan";
import path from "path";
import _ from "lodash";
import util from "util";
import multer from "multer";
import { error } from "console";




const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 4000;

const saltRounds = 10;

// enable files upload
app.use(fileUpload({
    createParentPath: true
}));

//add other middleware
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(cors({
    origin: ['http://localhost:3000'],
    methods: ["GET", "POST"],
    credentials: true
  })
);

app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  key: 'userId',
  secret: 'subscribe',
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires:60*60*24
  },
}))


const db = mySQL.createConnection({
    host: process.env.HOST,
    user: process.env.USERNAME,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
});



db.connect((err) => {
  if (err) throw err;
  console.log("MySQl connected...");
});

app.get("/", (req, res) => {
  res.send(`<h3>Welcome on board!!!  <br> You're on POST ${PORT}</h3>`);
});

app.post("/api/create_project_tbl", (req, res) => {
  let sql = `CREATE TABLE IF NOT EXISTS project_tbl(
    id INT NOT NULL AUTO_INCREMENT,
    name varchar(255) NOT NULL,
    color varchar(255) NOT NULL,
    PRIMARY KEY(id))`;
  db.query(sql, (err, data) => {
    if (err) throw err;
    console.log(data);
    res.send("Project Table created...");
  });
});

app.post("/api/create_dump_tbl", (req, res) => {
  let sql = `CREATE TABLE IF NOT EXISTS dump_tbl(
    id INT NOT NULL AUTO_INCREMENT,
    clicked_id varchar(255) NOT NULL,
    PRIMARY KEY(id))`;
  db.query(sql, (err, data) => {
    if (err) throw err;
    console.log(data);
    res.send("Dump Table created...");
  });
});

app.post("/api/new_project", (req, res) => {
  const name = req.body.title;
  const color = req.body.color;
  const user_id = req.body.user_id;
  let sql = `INSERT INTO project_tbl (name, color, user_id) VALUES (?,?,?)`;
    db.query(sql, [name, color, user_id], (err, data) => {
      if (err) throw err;
      res.send("post made successful");
      // console.log(data);
    });
});

app.get("/api/all_project", (req, res) => {
  const user_id = req.body.userId;
  let sql = `SELECT * FROM project_tbl WHERE user_id = user_id`;
    db.query(sql, (err, data) => {
        if (err) throw err;
        res.send(data);
    });
});

app.post("/api/dump_id", (req, res) => {
  const clicked_id = req.body.id;  
  console.log(clicked_id)
  // let sql = `UPDATE project_tbl SET clicked_at = now() WHERE id = (?) AND user_id=2`;
  let sql = `UPDATE project_tbl SET clicked_at = now() WHERE id = (?)`;
    db.query(sql, [clicked_id], (err, data) => {
      if (err) throw err;
      res.send("id sucessflly post");
      // console.log(data);
    });
});

app.get("/api/review_project", (req, res) => {
  const user_id = req.body.user_id;
    // let sql = `SELECT DISTINCT clicked_id,name,color FROM dump_tbl ORDER BY clicked_id DESC LIMIT 4`;
    let sql = `SELECT * FROM project_tbl WHERE user_id = user_id ORDER BY clicked_at DESC LIMIT 4`;
  db.query(sql, (err, data) => {
    if (err) throw err;
    res.send(data);
  });
});

// app.get("/api/review_project", (req, res) => {
//   let sql = `SELECT DISTINCT id,name,color FROM project_tbl ORDER BY id DESC LIMIT 4`;
//   db.query(sql, (err, data) => {
//     if (err) throw err;
//     res.send(data);
//   });
// });

app.get("/api/single_project/:id", (req, res) => {
    const id = req.params.id;
    let sql = `SELECT * FROM project_tbl WHERE id = ?`;
    db.query(sql, id, (err, data) => {
      if (err) throw err;
      res.send(data);
    });
});

app.get("/create_users_tbl", (req, res) => {
  let sql = `CREATE TABLE users_tbl (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`;
  db.query(sql, (err, data) => {
    if (err) throw err;
    res.send("User Table created...", data);
    // console.log(data);
  });
});

app.post("/api/register_user", (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  let sql = `INSERT INTO users_tbl (name, email, password) VALUES (?,?,?)`;
  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) console.log(err);
    db.query(sql, [name, email, hash], (err, data) => {
      if (err) throw err;
      res.send("post made successful");
      // console.log(data);
    });
  })
});

app.post("/api/login_user", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let sql = `SELECT * FROM users_tbl WHERE email = ?`;
  db.query(sql, email, (err, data) => {
    if (err) res.send({err: err})
    if (data.length > 0)
      bcrypt.compare(password, data[0].password, (err, result) => {
        if (err) throw err;
        if (result) {
          req.session.user = data;
          res.send(data)
          // console.log(req.session.user);
        }
        else
          res.send({ message: 'wrong email and password combination!' })
      });
    else
      res.send({ message: 'user doesn\'t exist' })
  });
})

app.get('/api/login_user', (req, res) => {
  if (req.session.user) {
    res.send({ loggedIn: true, user: req.session.user })
  } else {
    res.send({ loggedIn: false })
  }
})



app.get("*", (req, res) => {
  res.send('404 This Page is not found <a href="/">Go to Home Page</a>');
});

app.listen(PORT, () => console.log(`Server running on POST ${PORT}`));












// app.use(express.static('uploads'));

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

