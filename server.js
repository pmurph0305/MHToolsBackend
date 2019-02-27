const express = require('express');
const bodyParser = require('body-parser');
const phq9 = require('./phq9');

const knex = require('knex');
const db = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'postgres',
      password : 'test',
      database : 'mhtoolsdb'
    }
  });


const app = express();
app.use(bodyParser.json());



app.listen(3001, ()=> {
    console.log("working on port 3001");
});

app.get('/', (req, res) => {
    res.send('working.')
})

app.post('/phq9/:id/:score', phq9.handlePHQPost(db));

app.get('/phq9/:id', phq9.handlePHQ9DataGet(db));