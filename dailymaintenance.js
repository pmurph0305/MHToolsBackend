const handleDailyMaintenanceGet = (db) => (req, res) => {
    const {id, date} = req.params;
    // get all tasks for user and date and return them.
    db.select("*")
    .from('dmtasks')
    .where({
        user_id: id,
        date: date
    })
    .orderBy('rank', 'asc')
    .then (data => {
        if (data.length) {
            res.json(data);
        } else {
            res.json("No daily maintenance data found.");
        }
    })
    .catch(err => {
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
    handleDailyMaintenanceDelete
}

// CREATE TABLE dmtasks (task_id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), task VARCHAR NOT NULL, completed BOOLEAN NOT NULL, date DATE NOT NULL)