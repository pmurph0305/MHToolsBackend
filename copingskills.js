
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
    const { id } = req.params;
    const { title, desc, shared } = req.body;
    let { rank } = req.body;
    // make sure we have a rank when we add it to the users coping skills.
    new Promise((resolve, reject) => {
        if (rank) {
            resolve(rank);
        } else {
            // get max rank.
            db.max('rank')
            .from('copingskills')
            .where({
                user_id: id
            })
            .then(data => {
                if (data[0]) {
                    resolve(data[0].max+1);
                } else {
                    // User's first coping skill.   
                    reslove(0);
                }
            })
            .catch(reject);
        }
    }).then(rank_value => {
        // insert the new coping skill using the prev found rank value.
        db.insert({
            user_id: id,
            rank: rank_value,
            shared: shared,
            title: title,
            description: desc,
            shareable: true,
        })
        .into('copingskills')
        .returning('*')
        .then(data => {
            res.json(data)
        })
        .catch(err => {
            res.status(500).json("Error adding coping skill. " + err);
        })
    })
    .catch(err => {
        res.status(500).json("Error adding coping skill. No rank found. " + err);
    })
}

const handleCopingSkillsPut = (db) => (req, res) => {
    const { id, skill_id } = req.params;
    const { title, desc, shared } = req.body;
    // update the users coping skill with new data.
    db('copingskills')
    .where({
        user_id: id,
        skill_id: skill_id,
    })
    .update({
        title: title,
        description: desc,
        shared: shared,
        // If the user shared the skill, don't let others share it.
        // So that user's can't add other's shared skills, then re-share it.
        shareable: true
    }, '*')
    .then(data => res.json(data))
    .catch(err => res.status(500).json("Error updating coping skill. " + err));
}


// Not needed?
const handleCopingSkillsSharePut = (db) => (req, res) => {
    // update skill to be shared = true, and shareable = false
    // shareable is set to false so other users who in the future
    // add it to their list, can not re-share the same coping skill.
    const { id, skill_id } = req.params;
    db('copingskills')
    .where({
        user_id: id,
        skill_id: skill_id,
    })
    .update({
        shared: true,
        shareable: true,
    })
    .then(data => res.sendStatus(200))
    .catch(err => res.status(500).json("Error sharing coping skill. " + err));
}

// Adds getting the list of shared coping skills.
const handleCopingSkillsSharedGet = (db) => (req, res) => {
    const { id, type } = req.params;
    if (type === 'new') {
        db('copingskills')
        .returning('*')
        .where({
            shared: true,
            shareable: true,
        })
        // don't return users own shared skills.
        .whereNot({
            user_id: id
        })
        // sort by newest date added.
        .orderBy('date_added', 'desc')
        .then(data => res.json(data))
        .catch(err => res.status(500).json("Error getting newest shared coping skills. " + err));
    } else if (type === 'top') {
        db('copingskills')
        .returning('*')
        .where({
            shared: true,
            shareable: true,
        })
        // don't return users own shared skills.
        .whereNot({
            user_id: id
        })
        // sort by highest number of times added.
        .orderBy('times_added', 'desc')
        .then(data => res.json(data))
        .catch(err => res.status(500).json("Error getting top shared coping skills. " + err));
    } else if (type === 'rand') {
        let nid = Number(id);
        // Select random rows from postgres where shared & shareable. (ignore own users shared skills)
        db.raw("SELECT * FROM copingskills WHERE shareable = TRUE AND shared = TRUE AND user_id != " + nid + " ORDER BY random()")
        .then(data => res.json(data.rows))
        .catch(err => res.status(500).json("Error getting random coping skills. " + err));
    } else {
        res.status(400).json("Improper shared coping skill request");
    }
}


// Adds a shared skill to a users own list.
const handleCopingSkillsSharedPost = (db) => (req, res) => {
    const { id, skill_id } = req.params;
    // get rank to add too.
    new Promise((resolve, reject) => {
        db.select('rank')
        .from('copingskills')
        .where({
            user_id: id
        })
        .orderBy('rank','desc')
        .first()
        .then(data => {
            if (data) {
                // Add new skill to bottom of list.
                resolve(data.rank+1);
            } else {
                // User's first coping skill.
                resolve(0);
            }
        })
        .catch(reject);
    })
    .then(rank => {
        // select skill thats going to be added.
        db('copingskills')
        .where({ 
            skill_id: skill_id,
            shareable: true,
            shared: true,
        })
        .increment('times_added', 1)
        .returning('*')
        .then(data => {
            // make sure we have the data.
            if (Array.isArray(data) && data[0]) {
                // insert for current user. (no longer shareable)
                db('copingskills')
                .insert({
                    user_id: id,
                    shareable: false,
                    shared: false,
                    title: data[0].title,
                    description: data[0].description,
                    rank: rank,
                })
                .returning('*')
                // return the newly added skill for the user.
                .then(data=> res.json(data))
                .catch(err => res.status(500).json("Error adding shared coping skill. " + err));
            }
        })
        .catch(err => res.status(500).json("Error getting shared skill to add. " + err));
    })  
    .catch(err => res.status(500).json("Error getting rank to add shared skill. " + err));
}

module.exports = {
    handleCopingSkillsGet,
    handleCopingSkillsPost,
    handleCopingSkillsPut,
    handleCopingSkillsSharedGet,
    handleCopingSkillsSharedPost,
}

//CREATE TABLE copingskills (skill_id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), title VARCHAR NOT NULL, description VARCHAR NOT NULL, date_added DATE NOT NULL DEFAULT CURRENT_DATE, rank INTEGER NOT NULL, shared BOOLEAN NOT NULL DEFAULT FALSE);



// CREATE TABLE sharedskills (shared_id SERIAL PRIMARY KEY, skill_id INTEGER REFERENCES copingskills(skill_id), votes INTEGER NOT NULL DEFAULT 0, vote_ids INTEGER ARRAY)