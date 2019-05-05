
const handleCopingSkillsGet = (db) => (req,res) => {
    // Get all users coping skills.
    const {id} = req.params;
    db.select('*')
    .from('copingskills')
    .where({user_id: id})
    .orderBy('rank','asc')
    .then(data => {
        res.json(data);
    })
    .catch(err=> res.status(500).json("Error getting coping skills. " + err))
}

const handleCopingSkillsDelete = (db) => (req, res) => {
    const { id, skill_id } = req.params;
    // Delete skill_id for user_id
    db('copingskills')
    .where({
        user_id: id,
        skill_id: skill_id
    })
    .del()
    .then(data => {
        // Returns # of effected cells.
        if (data === 1) {
            // Deleted a row.i
            res.json({skill_id: skill_id});
        } else {
            // Didn't find a row to delete.
            res.status(500).json("No skill with that id, or improper user id.")
        }
    })
    .catch(err => res.status(500).json("Error deleting coping skill. " + err));
}

const handleCopingSkillsPost = (db) => (req,res) => {
    // Adds a new coping skill to the users list.
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
            shared_from_id: -1, // users own skills set as default -1 shared_from so it doesn't display in shared skills. (as we don't have skill_id yet)
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
    // Update users coping skill.
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
    }, '*')
    .then(data => res.json(data))
    .catch(err => res.status(500).json("Error updating coping skill. " + err));
}


const handleCopingSkillsSharePut = (db) => (req, res) => {
    // Share a user's unshared coping skill.
    const { id, skill_id } = req.params;
    db('copingskills')
    .returning('*')
    .where({
        user_id: id,
        skill_id: skill_id,
    })
    .update({
        shared: true,
    })
    .then(data => res.json(data))
    .catch(err => res.status(500).json("Error sharing coping skill. " + err));
}

const handleCopingSkillsSharedGet = (db) => (req, res) => {
    // Get shared coping skills.
    const { id, type } = req.params;
    db('copingskills')
        // .select('shared_from_id')
        .select(db.raw('ARRAY_AGG(shared_from_id) as added'))
        .where({
            user_id: id,
        })
        .then(users_skills => {
            // if the user has no skills yet, use -1 as their array so all shared skills are returned.
            if (!users_skills[0].added) {
                users_skills[0].added = [-1];
            }
            if (type === 'new') {
                db('copingskills')
                .returning('*')
                .where({
                    shared: true,
                })
                // don't show users own skills.
                .whereNot({
                    user_id: id,
                })
                // Don't return skills user already added // their own skills.
                .whereNotIn('skill_id', users_skills[0].added)
                // sort by newest date added.
                .orderBy('date_added', 'desc')
                .then(data => res.json(data))
                .catch(err => res.status(500).json("Error getting newest shared coping skills. " + err));
            } else if (type === 'top') {
                db('copingskills')
                .returning('*')
                .where({
                    shared: true,
                })
                // don't show users own skills.
                .whereNot({
                    user_id: id,
                })
                // Don't return skills user already added // their own skills.
                .whereNotIn('skill_id', users_skills[0].added)
                // sort by highest number of times added.
                .orderBy('times_added', 'desc')
                .then(data => res.json(data))
                .catch(err => res.status(500).json("Error getting top shared coping skills. " + err));
            } else if (type === 'rand') {
                let nid = Number(id);
                if (Number.isInteger(nid)) {
                    // Select random rows from postgres where shared (ignore own users shared skills & shared skills already added.)
                db.raw("SELECT * FROM copingskills WHERE shared = TRUE AND user_id != "+ nid +" AND NOT skill_id = ALL (array[" + users_skills[0].added + "]) ORDER BY random()")
                .then(data => res.json(data.rows))
                .catch(err => res.status(500).json("Error getting random coping skills. " + err));
                } else {
                    res.status(400).json("Improper user_id used to get shared coping skills.")
                }
            
            } else {
                res.status(400).json("Improper shared coping skill request");
            }
        })
}


// Adds a shared skill to a users own list.
const handleCopingSkillsSharedPost = (db) => (req, res) => {
    const { id, skill_id } = req.params;
    // get rank to add too.
    new Promise((resolve, reject) => {
        db.max('rank')
        .from('copingskills')
        .where({
            user_id: id
        })
        .then(data => {
            if (Array.isArray(data) && data.length) {
                resolve(data[0].max+1)
            } else {
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
                    // shared as false so user can't reshare a skill.
                    shared: false,
                    title: data[0].title,
                    description: data[0].description,
                    rank: rank,
                    shared_from_id: data[0].skill_id,
                })
                .returning('*')
                // return the newly added skill for the user.
                .then(data=> res.json(data))
                .catch(err => res.status(500).json("Error adding shared coping skill. " + err));
            } else {
                // Didn't find the shared skill with that skill_id.
                res.status(400).json("No shared skill with that skill_id.")
            }
        })
        .catch(err => res.status(500).json("Error getting shared skill to add. " + err));
    })  
    .catch(err => res.status(500).json("Error getting rank to add shared skill. " + err));
}

module.exports = {
    handleCopingSkillsGet,
    handleCopingSkillsDelete,
    handleCopingSkillsPost,
    handleCopingSkillsPut,
    handleCopingSkillsSharedGet,
    handleCopingSkillsSharedPost,
    handleCopingSkillsSharePut,
}

//CREATE TABLE copingskills (skill_id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), title VARCHAR NOT NULL, description VARCHAR NOT NULL, date_added DATE NOT NULL DEFAULT CURRENT_DATE, rank INTEGER NOT NULL, shared BOOLEAN NOT NULL DEFAULT FALSE);



// CREATE TABLE sharedskills (shared_id SERIAL PRIMARY KEY, skill_id INTEGER REFERENCES copingskills(skill_id), votes INTEGER NOT NULL DEFAULT 0, vote_ids INTEGER ARRAY)