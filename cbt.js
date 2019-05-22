const handleCBTEventGet = (db) => (req, res) => {
    console.log('def');
    const { id, cbt_id } = req.params;
    if (id && cbt_id) {
        db('cbt_events')
        .select()
        .where({
            user_id: id,
            cbt_id: cbt_id
        })
        .then(data => {
            res.status(200).json(data);
        })
        .catch(error => {
            res.sendStatus(500);
        })
    } else {
        res.sendStatus(400);
    }
}

const handleCBTEventMultipleGet = (db) => (req, res) => {
    console.log('abc');
    const { id } = req.params;
    console.log('id', id);
    if (id) {
        db('cbt_events')
        .select()
        .where({ user_id: id })
        .orderBy('date', 'desc')
        .limit(10)
        .then(data => {
            res.status(200).json(data);
        })
        .catch(error => {
            console.log(error);
            return res.sendStatus(500);
        })
    } else {
        res.sendStatus(400);
    }
}


const handleCBTEventPost = (db) => (req, res) => {
    const { id } = req.params;
    const { data } = req.body;
    console.log(id, data);
    if (id && data) {
        db('cbt_events')
        .insert({
            user_id: id,
            date: data.date,
            situation: data.situation,
            automatic_thoughts: data.automaticThoughts,
            rating_before: data.ratingBefore,
            thinking_styles: data.thinkingStyles,
            alternative_thoughts: data.alternativeThoughts,
            evidence_conclusions: data.evidenceConclusions,
            rating_after: data.ratingAfter
        })
        .then(success => {
            res.status(200).json("Success");
        })
        .catch(error => {
            res.sendStatus(500);
        })
    } else {
        res.sendStatus(400);
    }
}


module.exports = {
    handleCBTEventGet,
    handleCBTEventMultipleGet,
    handleCBTEventPost,
}

// CREATE TABLE cbt_events (
//     cbt_id serial PRIMARY KEY,
//     user_id INTEGER REFERENCES users(id),
//     date DATE NOT NULL DEFAULT NOW(),
//     situation VARCHAR(600) NOT NULL DEFAULT '',
//     automatic_thoughts VARCHAR(1500) NOT NULL DEFAULT '',
//     rating_before SMALLINT NOT NULL DEFAULT 50,
//     thinking_styles BOOLEAN[7] NOT NULL DEFAULT '{false,false,false,false,false,false,false}',
//     alternative_thoughts VARCHAR(1500) NOT NULL DEFAULT '',
//     evidence_conclusions VARCHAR(1500) NOT NULL DEFAULT '',
//     rating_after SMALLINT NOT NULL DEFAULT 50
// );