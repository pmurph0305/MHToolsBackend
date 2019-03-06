var Promise = require('bluebird')

const handleDailyMaintenanceGet = (db, knex) => (req, res) => {
    const {id, date} = req.params;
    // get all tasks for user and date and return them.
    db.select('*')
    .from('dmtasks')
    .where({
        user_id: id,
        date: date
    })
    .orderBy('rank', 'asc')
    .then (data => {
        if (Array.isArray(data) && data.length) {
            // return data if the current users data exists for date.
            res.json(data);
        } else {
            // Select the latest date the user has data for.
            db.select('date')
            .from('dmtasks')
            .where({
                user_id: id
            })
            .orderBy('date', 'desc')
            .limit(1)
            .then(latestDate => {
                // if it found a previous entry for the user.
                if (Array.isArray(latestDate) && latestDate.length) {
                    console.log("latestDate", latestDate[0]['date']);
                    // select all the entries for that date.
                    db.select('user_id','task','rank')
                    .from('dmtasks')
                    .where({
                        user_id: id,
                        date: latestDate[0]['date']
                    })
                    .then(tasks => {
                        // Create a transaction for inserting all the data for the current date using the previous dates entries.
                        db.transaction(trx => {
                            return Promise.all(
                                tasks.map((task => {
                                    console.log("task", task)
                                    return db.insert({
                                        user_id: task['user_id'],
                                        task: task['task'],
                                        completed: false,
                                        rank: task['rank'],
                                    }).into('dmtasks')
                                    .returning('*')
                                    .transacting(trx)
                                }))
                            )
                            .then(data => {
                                // Succesfully copied previous dates data to current date
                                // So map and return the data from the promises.
                                res.json(data.map((d=> {
                                    return d[0];
                                })))
                                trx.commit
                            })
                            .catch(err => {
                                trx.rollback
                                // error during copying previous date data to current date.
                                res.status(500).json('Error creating new daily maintenance data. ' + err);
                            })
                        })
                    })
                    .catch(err => {
                        // Error selecting user data for any previous date.
                        res.status(500).json('Error finding previous maintenance data. ' + err);
                    });
                }  else {
                    // User is new and has no data.
                    res.json("No data found for user.")
                }
            })
        }
    })
    .catch(err => {
        // Error selecting user data from database for current date.
        res.status(500).json('Error getting daily maintenance data. ' + err);
    });
}

const handleDailyMaintenancePost = (db) => (req, res) => {
    const {id} = req.params;
    const {task, rank} = req.body;
    // insert new task, and return it.
    db.returning('*')
    .insert({
        user_id: id,
        task: task,
        completed: false,
        rank: rank,
    })
    .into('dmtasks')
    .then(task => res.json(task))
    .catch(err => res.status(500).json('Error inserting new task. ' + err))
}

const handleDailyMaintenancePut = (db) => (req, res) => {
    // destructure id and tasks.
    const {id} = req.params;
    const {tasks} = req.body;
    console.log("Put DM", tasks.length);
    if (tasks.length) {
        let success = true;
        // update each task for user id.
        tasks.map((task => {
            db('dmtasks')
            .where({
                user_id: id,
                task_id: task['task_id']
            })
            .update({
                task: task['task'],
                rank: task['rank']
            })
            .catch(err => {
                success = false;
                res.status(500).json("Error updating tasks" + err)
            });
        }))
        if (success) {
            res.json("Sucessfully updated tasks");
        }
    }
}

const handleDailyMaintenanceDelete = (db) => (req, res) => {
    const {id, task_id} = req.params;
    // delete task.
    db('dmtasks')
    .where({
        user_id: id,
        task_id: task_id,
    })
    .del()
    .then(() => res.json('Deletion successful.'))
    .catch(err => res.status(500).json("Error deleting task. " + err))
}

module.exports = {
    handleDailyMaintenanceGet,
    handleDailyMaintenancePost,
    handleDailyMaintenancePut,
    handleDailyMaintenanceDelete,
}

// CREATE TABLE dmtasks (task_id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), task VARCHAR NOT NULL, completed BOOLEAN NOT NULL, date DATE NOT NULL)