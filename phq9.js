const handlePHQ9Post = (db) => (req, res) => {
    const {id} = req.params;
    const {scores, score} = req.body;
    var allowNewSubmission = false;
    db.select('user_id','date','phq9_id')
    .from('phq9')
    .where({
        user_id: id
    })
    .orderBy('phq9_id', 'desc')
    .limit(1)
    .then(data => {
        // check if user has submitted a phq9 today. Or if they have no previous data.
        if (data.length) {
            latest = data[0]['date'].toISOString().slice(0,10);
            let today = new Date().toISOString().slice(0,10);
            if (today != latest) {
                allowNewSubmission = true;
            } else {
                allowNewSubmission = false;
            }
        } else {
            allowNewSubmission = true;
        }
    })
    .then(function() {
        // insert if they haven't submitted today, otherwise tell them they have already submitted today.
        if (allowNewSubmission) {
            // Insert into db, returning success if it works, otherwise return an error.
            // Date for row is default new postgres date.
            db.insert({
                user_id: id,
                score: score,
                scores: scores
            })
            .into('phq9')
            .then(success => res.json("PHQ-9 submission successful."))
            .catch(err => res.status(500).json('Error 1: Problem submitting PHQ-9 data, please try again.'))
        } else {
            res.json('You have already submitted the PHQ-9 today.');
        }
    })
    .catch(err => res.status(500).json('Error 2: Problem submitting PHQ-9 data, please try again.'))
}

const handlePHQ9DataGet = (db) => (req, res) => {
    console.log("get phq9")
    const {id} = req.params;
    db.select('*')
        .from('phq9')
        .where({
            user_id: id
        })
    .then(phq9data => {
        if (phq9data.length) {
            res.json(phq9data);
        } else {
            res.status(404).json('No PHQ9 data found.')
        }
    })
    .catch(error => res.status(500).json('Error getting PHQ9 data from database.'));
}

module.exports = {
    handlePHQPost: handlePHQ9Post,
    handlePHQ9DataGet: handlePHQ9DataGet
}