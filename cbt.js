const handleCBTEventGet = (db) => (req, res) => {
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
    const { id } = req.params;
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
            return res.sendStatus(500);
        })
    } else {
        res.sendStatus(400);
    }
}


const handleCBTEventPost = (db) => (req, res) => {
    const { id } = req.params;
    const { data } = req.body;
    if (id && data) {
        db('cbt_events')
        .insert({
            user_id: id,
            date: data.date,
            situation: data.situation,
            automatic_thoughts: data.automatic_thoughts,
            rating_before: data.rating_before,
            thinking_styles: data.thinking_styles,
            alternative_thoughts: data.alternative_thoughts,
            evidence_conclusions: data.evidence_conclusions,
            rating_after: data.rating_after
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