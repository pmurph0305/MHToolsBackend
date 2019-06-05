const handleHistoryGetPHQ9 = (db) => (req, res) => {
    const {id} = req.params;
    // specifically selects a single distinct phq-9 entry for the user for each date
    // so that even if they enter the phq-9 on multiple dates, it only returns one.
    // Though there should never be multiple entries for a single user for phq-9 with the same date.
    // during testing right now there is multiple entries for a single date.
    db('phq9').select(db.raw('distinct on (date) date, score'))
    .where({user_id: id})
    .orderBy('date', 'asc')
    .then(data => {
        if (Array.isArray(data) && data.length) {
            res.json(data);
        } else {
            res.json("No PHQ-9 data found for user.");
        }
    })
    .catch(err => {
        res.status(500).json("Error getting PHQ9 data for user. " + err);
        throw err;
    });
}

const handleHistoryGetDM = (db) => (req, res) => {
    const {id} = req.params;
    // get the count and sum of tasks completed for each date.
    // used db.raw in select because was having difficulty doing it with otherwise
    // Casting completed to int and then using SUM gives the # of completions.
    // Counting the task id's for the date gives the total # of tasks.
    db('dmtasks')
    .select(db.raw('date, COUNT(task_id) AS total, SUM(completed::int) AS completed'))
    .where({user_id : id})
    .groupBy('date')
    .orderBy('date', 'asc')
    .then(data=> {
        if (Array.isArray(data) && data.length) {
            res.json(data);
        } else {
            res.json("No daily maintenance data found for user.");
        }
    })
    .catch(err => {
        res.status(500).json("Error getting daily maintenance data for user. " + err);
        throw err;
    });
}

const handleHistoryGetCBTThinkingStyles = (db) => (req, res) => {
    const {id} = req.params;
    db('cbt_events')
    .select('thinking_styles')
    .where({user_id: id})
    .then(data => {
        if (Array.isArray(data) && data.length) {
            let result = [0,0,0,0,0,0,0];
            data.forEach(entry => entry.thinking_styles.forEach((item, index) => {
                if (item) {
                    result[index] += 1;
                }
            }))
            res.json({thinking_styles: result});
        } else {
            res.json("No CBT data found for user")
        }
    })
    .catch(err => {
        res.status(500).json("Error getting CBT data for user. " + err)
        throw err;
    })
}

const handleHistoryGetCBTRatings = (db) => (req, res) => {
    const {id} = req.params;
    db('cbt_events')
    .select('rating_before', 'rating_after', 'date')
    .orderBy('date', 'asc')
    .where({user_id: id})
    .then(data => {
        if (Array.isArray(data) && data.length) {
            res.json(data);
        } else {
            res.json("No CBT data found for user")
        }
    })
    .catch(err => {
        res.status(500).json("Error getting CBT data for user. " + err)
        throw err;
    })
}

module.exports = {
    handleHistoryGetDM,
    handleHistoryGetPHQ9,
    handleHistoryGetCBTThinkingStyles ,
    handleHistoryGetCBTRatings,
}