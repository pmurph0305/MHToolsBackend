const handlePHQ9Post = (db) => (req, res) => {
    const {id, score} = req.params;
    db.insert({
            user_id: id,
            score: score
        })
        .into('phq9')
    .then(res.json('Success'))
    .catch(error => res.status(500).json('Inserting score into database failed.'))
    

}

const handlePHQ9DataGet = (db) => (req, res) => {
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