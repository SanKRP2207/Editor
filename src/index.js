const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const jwtKey = process.env.JWT;
const bcrypt = require('bcrypt');
const Port = process.env.Port
const mysqlConn = require('../db/config');



app.use(express.json());
app.use(cors());

app.get('/user', (req, resp) => {

     try {
          mysqlConn.query('SELECT * FROM users', (error, result) => {
               if (error) {
                    resp.send(error);
               } else {
                    resp.send(result);
               }
          })
     } catch (error) {
          resp.send('user not added');

     }

})

app.post('/signup', async (req, resp) => {
     const data = req.body
     try {


          const hashedPassword = await bcrypt.hash(data.password, 5);
          data.password = hashedPassword;

          const [existingUser] = await mysqlConn.query('SELECT * FROM users WHERE email = ?', [email]);
          if (existingUser.length > 0) {
               return res.status(400).json({ error: 'User already exists' });
          }

          mysqlConn.query('INSERT INTO users SET ?', data, (error, result, fields) => {
               if (error) {
                    resp.send(error);
               } else {
                    resp.send(result);
               }
          })
     } catch (error) {
          resp.send('user not added');

     }
});

app.post('/signin', async (req, resp) => {
     if (req.body.email && req.body.password) {
          mysqlConn.query('SELECT * FROM users WHERE email = ?', [req.body.email], async (error, results) => {
               if (error) {
                    return resp.send({ result: 'Database error occurred', error });
               }

               if (results.length > 0) {
                    const user = results[0];
                    const isMatch = await bcrypt.compare(req.body.password, user.password);

                    if (isMatch) {
                         delete user.password;

                         try {
                              const token = jwt.sign({ user }, jwtKey, { expiresIn: '2h' });
                              return resp.send({ user, auth: token });
                         } catch (jwtError) {
                              return resp.send({ result: 'Failed to generate token', error: jwtError.message });
                         }
                    } else {
                         return resp.send({ result: 'Invalid email or password' });
                    }
               } else {
                    return resp.send({ result: 'User not found' });
               }
          });
     } else {
          return resp.send({ result: 'Missing email or password' });
     }
});
// ------------------------------------------------------------------ Now contents Api


app.post('/savecontent', async (req, resp) => {
     const { user_id, content } = req.body;
     try {
          mysqlConn.query('INSERT INTO contents (user_id, text) VALUES (?, ?)', [user_id, content], (error, result, fields) => {
               if (error) {
                    resp.send(error);
               } else {
                    resp.send(result);
               }
          })
     } catch (error) {
          console.error("Error:", error); // Log any errors that occur
          resp.status(500).json({ error: 'Failed to save content' });
     }
});


app.get('/user/:user_id/contents', async (req, resp) => {
     const { user_id } = req.params; // Extract the user_id value directly

     try {
          mysqlConn.query('SELECT * FROM contents WHERE user_id = ?', [user_id], (error, result) => { // Pass user_id as an array
               if (error) {
                    resp.status(500).send(error);
               } else {
                    resp.status(200).json(result);
               }
          });
     } catch (error) {
          resp.status(500).json({ error: 'Failed to fetch content' });
     }
});

app.get('/content/:id', async (req, resp) => {
     const { id } = req.params;
     try {
          //     const [result] = await mysqlConn.query('SELECT text FROM contents WHERE id = ?', [id]);
          //     res.status(200).json(result[0]);
          mysqlConn.query('SELECT * FROM contents WHERE id = ?', [id], (error, result) => {
               if (error) {
                    resp.status(500).send(error);
               } else {
                    resp.status(200).json(result);
               }
          });
     } catch (error) {
          resp.status(500).json({ error: 'Failed to fetch content' });
     }
});
//  ---------



app.put('/content/:id', async (req, resp) => {
     const { id } = req.params;
     const { text, user_id } = req.body;
     try {
          mysqlConn.query('UPDATE contents SET text = ? WHERE id = ? AND user_id = ?', [text, id, user_id], (error, result) => {
               if (error) {
                    resp.status(500).send(error);
               } else {
                    resp.status(200).json(result);
               }
          });
     } catch (error) {
          resp.status(500).json({ error: 'Failed to update content' });
     }
});


app.delete('/content/:id', async (req, res) => {
     const { id } = req.params;
     try {
          await mysqlConn.query('DELETE FROM contents WHERE id = ?', [id]);
          res.status(200).json({ message: 'Content deleted successfully' });
     } catch (error) {
          res.status(500).json({ error: 'Failed to delete content' });
     }
});





app.listen(Port);