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

handleDailyMaintenanceGetDateChange = (db) => (req, res) => {
    // destruct params
    const {id, date, change} = req.params;
    // for decreasing dates
    if (change < 0) {
        // select the closest less than date.
        db.select('date')
        .from('dmtasks')
        .where({
            user_id: id
        })
        .andWhere('date', '<', date)
        .orderBy('date','desc')
        .limit(1)
        .then(data => {
            // make sure there is a date
            if (Array.isArray(data) && data.length) {
                // select all the tasks for that date and return them.
                db.select('*')
                .from('dmtasks')
                .where({
                    user_id: id,
                    date: data[0]['date']
                })
                .orderBy('rank', 'asc')
                .then(tasks => {
                    res.json(tasks);
                })
                .catch(err => res.status(500).json('Error decreasing date for daily maintenance data. ' + err))
            } else {
                res.json("No data exists for previous date for user.")
            }
        })
        .catch(err => res.status(500).json('Error changing date for daily maintenance data. ' + err));
    } else {
        // for increasing date
        // select closest greater than date
        db.select('date')
        .from('dmtasks')
        .where({
            user_id: id
        })
        .andWhere('date', '>', date)
        .orderBy('date','asc')
        .limit(1)
        .then(data => {
            // make sure a date was found.
            if (Array.isArray(data) && data.length) {
                // select and return tasks for that date
                db.select('*')
                .from('dmtasks')
                .where({
                    user_id: id,
                    date: data[0]['date']
                })
                .orderBy('rank', 'asc')
                .then(tasks => {
                    res.json(tasks);
                })
                .catch(err => res.status(500).json('Error decreasing date for daily maintenance data. ' + err))
            } else {
                res.json("No data exists for previous date for user.")
            }
        })
        .catch(err => res.status(500).json('Error changing date for daily maintenance data. ' + err));
    }
}


const handleDailyMaintenancePost = (db) => (req, res) => {
    // TODO: handle adding tasks to previous date, or reject them and only allow new tasks
    // on the current date.
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

const handleDailyMaintenancePutComplete = (db) => (req, res) => {
    // desctruct params
    const {id, task_id, completed} = req.params;
    // update the users task id based on if it's completed or not.
    db('dmtasks')
    .where({
        user_id: id,
        task_id: task_id
    })
    .update({
        completed: completed
    })
    .catch(err => res.status(500).json("Error updating task for user. " + err));
    res.json("Successfully updated task");
}

const handleDailyMaintenancePut = (db) => (req, res) => {
    // destructure id and tasks.
    const {id} = req.params;
    const {tasks} = req.body;
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
    handleDailyMaintenanceGetDateChange,
    handleDailyMaintenancePost,
    handleDailyMaintenancePut,
    handleDailyMaintenancePutComplete,
    handleDailyMaintenanceDelete,
}

// CREATE TABLE dmtasks (task_id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), task VARCHAR NOT NULL, completed BOOLEAN NOT NULL, date DATE NOT NULL)