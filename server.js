const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');

// Modules for each page.
const copingSkills = require('./copingskills');
const dm = require('./dailymaintenance');
const history = require('./history');
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
app.use(cors());

//TODO: verify user is user.

app.listen(3001, ()=> {
    console.log("working on port 3001");
});

app.get('/', (req, res) => {
    res.send('working.')
})

// Coping Skills Routes
// Get all user's coping skills.
app.get('/copingskills/:id', copingSkills.handleCopingSkillsGet(db));
// delete coping skill from a users list.
app.delete('/copingskills/:id/:skill_id', copingSkills.handleCopingSkillsDelete(db));
// Insert new coping skill to users list. (And share if shared).
app.post('/copingskills/:id', copingSkills.handleCopingSkillsPost(db));
// Update existing skill on users list.
app.put('/copingskills/:id/:skill_id', copingSkills.handleCopingSkillsPut(db));

// Shared coping skills.
// Get shared skills by new, top, or rand.
app.get('/copingskills/shared/:id/:type', copingSkills.handleCopingSkillsSharedGet(db));
// Add a shared skill to users own list.
app.post('/copingskills/shared/:id/:skill_id', copingSkills.handleCopingSkillsSharedPost(db));

// Daily Maintenance Routes
app.get('/dm/:id/:date', dm.handleDailyMaintenanceGet(db));

app.get('/dm/:id/:date/:change', dm.handleDailyMaintenanceGetDateChange(db));

app.delete('/dm/:id/:task_id', dm.handleDailyMaintenanceDelete(db));

app.post('/dm/:id', dm.handleDailyMaintenancePost(db));

app.put('/dm/:id', dm.handleDailyMaintenancePut(db));

app.put('/dm/:id/:task_id/:completed', dm.handleDailyMaintenancePutComplete(db));

// History routes

app.get('/history/dm/:id/', history.handleHistoryGetDM(db));

app.get('/history/phq9/:id', history.handleHistoryGetPHQ9(db));

// PHQ9 Routes
app.get('/phq9/:id', phq9.handlePHQ9DataGet(db));

app.post('/phq9/:id', phq9.handlePHQPost(db));
