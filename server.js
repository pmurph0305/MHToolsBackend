// packages
const bcrypt = require('bcrypt');
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');

// Modules for each page.
const cbt = require('./cbt');
const copingSkills = require('./copingskills');
const dm = require('./dailymaintenance');
const history = require('./history');
const { requireAuthorization } = require('./jwtAuth')
const phq9 = require('./phq9');
const register = require('./register');
const signin = require('./signin');

// database set up
const knex = require('knex');
// heroku running
// const db = knex({
//   client: 'pg',
//   connection: {
//     connectionString : process.env.DATABASE_URL,
//     ssl: true,
//   }
// });

// Local running.
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

const PORT = (process.env.PORT ? process.env.PORT: 3001);
app.listen(PORT, ()=> {
    console.log(`working on port ${PORT}`);
});

app.get('/', (req, res) => {
    res.send('working.')
})

// Sign in route.
app.post('/signin', signin.handleSignin(db, bcrypt));

// Register route.
app.post('/register', register.handleRegister(db, bcrypt));


// CBT routes.
// TODO: user verification when accessing user data.
// adds a cbt event of the user to the database.
app.post('/cbt/:id', requireAuthorization, cbt.handleCBTEventPost(db));
// gets an individual event of the user
app.get('/cbt/event/:id/:cbt_id',requireAuthorization, cbt.handleCBTEventGet(db));
// gets (up to) 10 most recent cbt events of the user
app.get('/cbt/events/:id/',requireAuthorization, cbt.handleCBTEventMultipleGet(db));

// Coping Skills Routes
// Get all user's coping skills.
app.get('/copingskills/:id', requireAuthorization, copingSkills.handleCopingSkillsGet(db));
// delete coping skill from a users list.
app.delete('/copingskills/:id/:skill_id', requireAuthorization, copingSkills.handleCopingSkillsDelete(db));
// Insert new coping skill to users list. (And share if shared).
app.post('/copingskills/:id', requireAuthorization, copingSkills.handleCopingSkillsPost(db));
// Update existing skill on users list.
app.put('/copingskills/:id/:skill_id', requireAuthorization, copingSkills.handleCopingSkillsPut(db));
// Share a user's coping skill.
app.put('/copingskills/share/:id/:skill_id', requireAuthorization, copingSkills.handleCopingSkillsSharePut(db));

// Shared coping skills.
// Get shared skills by new, top, or rand.
app.get('/copingskills/shared/:id/:type', copingSkills.handleCopingSkillsSharedGet(db));
// Add a shared skill to users own list.
app.post('/copingskills/shared/:id/:skill_id', requireAuthorization, copingSkills.handleCopingSkillsSharedPost(db));

// Daily Maintenance Routes
app.get('/dm/:id/:date', requireAuthorization, dm.handleDailyMaintenanceGet(db));
// Get tasks when clicking next/previous (:change) date from current :date
app.get('/dm/:id/:date/:change', requireAuthorization, dm.handleDailyMaintenanceGetDateChange(db));
// Delete a user's task.
app.delete('/dm/:id/:task_id', requireAuthorization, dm.handleDailyMaintenanceDelete(db));
// Add a task to the user's list
app.post('/dm/:id', requireAuthorization, dm.handleDailyMaintenancePost(db));
// Update task info (description) for an array of tasks.
app.put('/dm/:id', requireAuthorization, dm.handleDailyMaintenancePut(db));
// Mark a task as complete/incomplete.
app.put('/dm/:id/:task_id/:completed', requireAuthorization, dm.handleDailyMaintenancePutComplete(db));

// History routes
// Daily maintenance % complete history by date.
app.get('/history/dm/:id/', requireAuthorization, history.handleHistoryGetDM(db));
// PHQ9 score by date
app.get('/history/phq9/:id', requireAuthorization, history.handleHistoryGetPHQ9(db));
// CBT Thinking styles
app.get('/history/cbt/thinkingstyles/:id', requireAuthorization, history.handleHistoryGetCBTThinkingStyles(db));
// CBT Before/After Ratings
app.get('/history/cbt/ratings/:id', requireAuthorization, history.handleHistoryGetCBTRatings(db));

// PHQ9 Routes
app.get('/phq9/:id', requireAuthorization, phq9.handlePHQ9DataGet(db));
// Post a phq9 form
app.post('/phq9/:id', requireAuthorization, phq9.handlePHQPost(db));
