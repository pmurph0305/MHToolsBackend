
const handleCopingSkillsGet = (db) => (req,res) => {
    const {id} = req.params;
   // res.json("working coping.")
    db.select('*')
        .from('copingskills')
        .where({user_id: id})
        .orderBy('rank','asc')
        .then(data => {
            if (Array.isArray(data) && data.length) {
                res.json(data);
            } else {
                res.json("No coping skills found.")
            }
        })
        .catch(err=> res.status(500).json("Error getting coping skills. " + err))
}

const handleCopingSkillsPost = (db) => (req,res) => {
    const {id} = req.params;
    const {title, desc, shared, rank} = req.body;
    if (!rank) {
        console.log("no rank");
        // find highest rank for current user and use that as rank.
    }
    db.insert({
            user_id: id,
            rank: rank,
            shared: shared,
            title: title,
            description: desc
        })
        .into('copingskills')
        .returning('*')
        .then(data => {
            res.json(data);
        })
        .catch(err => {
            res.status(500).json("Error adding coping skill. " + err);
        })
    
}

module.exports = {
    handleCopingSkillsGet,
    handleCopingSkillsPost
}

//CREATE TABLE copingskills (skill_id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), title VARCHAR NOT NULL, description VARCHAR NOT NULL, date_added DATE NOT NULL DEFAULT CURRENT_DATE, rank INTEGER NOT NULL, shared BOOLEAN NOT NULL DEFAULT FALSE);



// CREATE TABLE sharedskills (shared_id SERIAL PRIMARY KEY, skill_id INTEGER REFERENCES copingskills(skill_id), votes INTEGER NOT NULL DEFAULT 0, vote_ids INTEGER ARRAY)