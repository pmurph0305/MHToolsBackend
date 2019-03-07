const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');

const phq9 = require('./phq9');
const dm = require('./dailymaintenance');

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
app.use(cors());

//TODO: verify user is user.

app.listen(3001, ()=> {
    console.log("working on port 3001");
});

app.get('/', (req, res) => {
    res.send('working.')
})

// PHQ9 Routes
app.get('/phq9/:id', phq9.handlePHQ9DataGet(db));

app.post('/phq9/:id', phq9.handlePHQPost(db));

// Daily Maintenance Routes
app.get('/dm/:id/:date', dm.handleDailyMaintenanceGet(db));

app.get('/dm/:id/:date/:change', dm.handleDailyMaintenanceGetDateChange(db));

app.delete('/dm/:id/:task_id', dm.handleDailyMaintenanceDelete(db));

app.post('/dm/:id', dm.handleDailyMaintenancePost(db));

app.put('/dm/:id', dm.handleDailyMaintenancePut(db));

app.put('/dm/:id/:task_id/:completed', dm.handleDailyMaintenancePutComplete(db));